import {EventEmitter, Injectable} from '@angular/core';
import Konva from 'konva';
import {StageConfig} from 'konva/types/Stage';
import {LayerConfig} from 'konva/types/Layer';
import {TransformerConfig} from 'konva/types/shapes/Transformer';
import {Banner, Dimension2D, Point2D} from '@core/models/banner-layout';
import {FilterChangedEvent} from '../../editor/components/image-filter.component';
import {BannerDataService} from '@core/services/banner-data.service';
import {ImageService} from '@core/services/drawing/image.service';
import {ShapeInformation} from '@core/models/dataset';
import {ShapeFactoryService} from '@core/services/shape-factory.service';
import {ButtonDrawingService} from '@core/services/button-drawing.service';
import {TextDrawingService} from '@core/services/text-drawing.service';

// TODO: Add skewing
// TODO: Refactor this class and separate concenrns
// TODO: stylizace banneru
// TODO: Sablony banneru a tlacitek
// TODO: Hotovo bannery dat do bakalarky
// TODO: Font scaling jednotlivych textu
// TODO: Vyresit texty
// TODO: Vice banneru
// TODO: Undo/Redo
// TODO: Groupovani
@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  constructor(
    public dataService: BannerDataService,
    public imageService: ImageService,
    public buttonService: ButtonDrawingService,
    public textService: TextDrawingService,
    private shapeFactory: ShapeFactoryService,
  ) {
    this.shapes = this.dataService.getActiveDataset();

    this.dataService.datasetChanged$.subscribe(() => {
      this.shapes = this.dataService.getActiveDataset();
      this.transformers.nodes([]);
      this.redrawShapes();
    });

    this.dataService.banners$.subscribe(newBanners => {
      this.banners = newBanners;
      this.shapes = this.dataService.getActiveDataset();
      this.drawBanners();
    });

    this.dataService.informationUpdated$.subscribe(updatedShapeName => {
      this.shapes = this.dataService.getActiveDataset();
      console.log(updatedShapeName);
      const updatedShape = this.shapes.find(s => s.userShapeName === updatedShapeName);
      // console.log(updatedShape);
      if (updatedShape.isText) {
        this.updateText(updatedShapeName.slugify(), updatedShape.shapeConfig);
      } else if (updatedShape.isImage) {
        if (updatedShape.userShapeName.slugify() === 'background') {
          this.drawBackground(updatedShape.shapeConfig as Konva.ImageConfig);
        } else {
          this.drawImage(updatedShapeName.slugify(), updatedShape.shapeConfig as Konva.ImageConfig);
        }
      } else if (updatedShape.isButton) {
        this.updateButton('text', updatedShape.shapeConfig);
      } else {
        this.drawShape(updatedShape);
      }
    });
  }

  private canvas: Konva.Stage;
  private transformers: Konva.Transformer = null;
  private shapes: ShapeInformation[];

  onClickTap$: EventEmitter<Konva.KonvaEventObject<MouseEvent>> = new EventEmitter<Konva.KonvaEventObject<MouseEvent>>();
  onContextMenu$: EventEmitter<Konva.KonvaEventObject<MouseEvent>> = new EventEmitter<Konva.KonvaEventObject<MouseEvent>>();
  // onNewLayer$: EventEmitter<Konva.Layer> = new EventEmitter<Konva.Layer>();
  selectedNodes: Konva.Shape[] = [];

  public layers: Konva.Layer[] = [];
  private banners: Banner[];
  private bannerGroups: {group: Konva.Group, bg: Konva.Shape}[] = [];
  public shouldTransformRelatives = true;

  static mergeConfig(name: string, id: string, conf: object): any {
    return { ...{name, id}, ...conf };
  }

  static bannerLabel(position: Point2D, text: string): Konva.Label {
    const label = new Konva.Label({
      y: position.y,
      opacity: 0.75,
      transformable: false,
    });

    label.add(new Konva.Tag({
      fill: '#fcfcfc',
      cornerRadius: 5,
      lineJoin: 'round',
      transformable: false,
    }));

    label.add(new Konva.Text({
      text,
      fontFamily: 'Arial',
      fontSize: 15,
      padding: 5,
      fill: 'black',
      transformable: false,
    }));

    return label;
}

  static isRadiiBasedShape(shapeClassName): boolean {
    return ['circle', 'wedge', 'arc', 'donut', 'regularpolygon', 'star'].includes(shapeClassName.toLowerCase());
  }

  private initZoom(stage: Konva.Stage, scaleBy: number): void {
    stage.on('wheel', ev => {
      let scaling = scaleBy;

      if (ev.evt.ctrlKey) {
        scaling += 0.06;
      }

      ev.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      const mousePointsTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = ev.evt.deltaY > 0 ? oldScale * scaling : oldScale / scaling;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointer.x - mousePointsTo.x * newScale,
        y: pointer.y - mousePointsTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    });
  }

  public init(conf: StageConfig): void {
    // console.log('Initializing konvaJS stage with', conf);
    this.canvas = new Konva.Stage(conf);
    this.canvas.on('click tap', (e: Konva.KonvaEventObject<MouseEvent>) => {
      this.onClickTap$.emit(e);
    });
    this.canvas.scale({ x: 0.75, y: 0.75 });

    this.initZoom(this.canvas, 1.02);
    const bgLayer = new Konva.Layer();

    this.canvas.add(bgLayer);
    this.layers.push(bgLayer);
    this.canvas.draw();
    this.transformers = this.transformer();

    this.canvas.on('contextmenu', (ev) => {
      ev.evt.preventDefault();
      this.onContextMenu$.emit(ev);
    });

    bgLayer.add(this.transformers);

  }

  public getInstance(): Konva.Stage {
    return this.canvas;
  }

  public transformer(conf?: TransformerConfig): Konva.Transformer {
    const tr = new Konva.Transformer({
      rotationSnaps: [0, 90, 180, 270],
    });
    // tr.moveToTop();
    this.canvas.on('click', ev => {
      // console.log(ev.target.id());
      let nodes = tr.nodes().slice();
      if (ev.target === this.canvas) {
        nodes = [];
      } else if (ev.target.getAttr('transformable') !== false) {
        if (ev.target.name() === 'button-text') {
          ev.target = ev.target.getParent();
        }
        if (ev.evt.ctrlKey) {
          nodes.push(ev.target);
        } else {
          nodes = [ev.target];
        }
      } else {
        nodes = [];
      }

      const hasText = nodes.some(node => node.getClassName().toLowerCase() === 'text');
      if (hasText) {
        tr.enabledAnchors(['middle-left', 'middle-right']);
      } else {
        // all anchors
        tr.enabledAnchors(['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']);
      }

      tr.nodes(nodes);
      this.redraw();
      // console.log(layer);
    });
    return tr;
  }

  public layer(conf?: LayerConfig, addToInstance = true): Konva.Layer {
    conf = { ...{name: `Layer ${this.layers.length + 1}`, id: `${this.layers.length}`}, ...conf };
    const layer = new Konva.Layer(conf);
    if (!addToInstance) { return layer; }
    const tr = this.transformer({});
    layer.add(tr);
    this.layers.push(layer);
    this.canvas.add(layer);
    // this.onNewLayer$.emit(layer);

    // layer.on('dragmove', this.guidelinesSnapping);
    // layer.on('dragend', KonvaService.destroyGuideLines);
    return layer;
  }

  private getWorkingLayerInstance(): Konva.Layer {
    return this.layer();
  }

  public updateSelected(updatedValues: object): void {
    for (const shape of this.selectedNodes) {
      shape.setAttrs(updatedValues);
    }
    this.layers.forEach(layer => layer.batchDraw());
  }

  public redraw(layer?: Konva.Layer): void {
    if (this.transformers !== null) {
      this.transformers.moveToTop();
    }
    if (layer) {
      layer.batchDraw();
      return;
    }
    this.layers.forEach(l => l.batchDraw());
  }

  public moveObjectZIndices(direction: 'Down' | 'ToBottom' | 'ToTop' | 'Up'): void {
    const selectedNodes = this.transformers.nodes();
    if (this.shouldTransformRelatives) {
      const nodesNamesToMove = selectedNodes.map(node => node.name()).filter( (nodeName, index, self) =>
        self.indexOf(nodeName) === index );
      for (const bannerGroup of this.bannerGroups) {
        const bg = bannerGroup.group.findOne('.background');
        for (const nodeName of nodesNamesToMove) {
          const node = bannerGroup.group.findOne(`.${nodeName}`);
          if (direction === 'Down' && node.zIndex() - 1 <= bg.zIndex()) {
            continue;
          }
          // call method
          node[`move${direction}`]();
        }
        if (direction === 'ToBottom') {
          bg.moveToBottom();
        }
      }
    } else {
      selectedNodes.forEach( node => node[`move${direction}`]() );
    }

    this.redraw();
  }

  public exportAsImage(target: string, mime: 'image/jpeg' | 'image/png'): void {
    const group = this.bannerGroups.find(g => g.group.id() === target);
    console.log(group.group.getChildren().toArray());
    console.log(target);
    console.assert(group !== undefined);


    group.group.getChildren().each(c => {
      c.clearCache();
      c.draw();
    });
    group.bg.clearCache();
    // group.group.draw();

    // const layer = this.canvas.getLayers()[2];
    // const dataUrl = layer.toDataURL({
    //   mimeType: mime,
    // });
    const dataUrl = group.group.toDataURL({ mimeType: mime, pixelRatio: 1 });
    const link = document.createElement('a');
    link.download = 'Ad1-file.jpeg';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public setBanners(banners: Banner[]): void {
    this.banners = banners;
  }

  public applyImageFilter(shapeName: string, filters: FilterChangedEvent): void {
    // console.log(Konva.Filters[filters.filterName]);
    // console.log('Applying filter to ', shapeName, filters);

    const shouldRemoveFilter = (contains, value, minValue = 0): boolean => {
      if (typeof value === 'boolean') {
        return contains && !value;
      } else if (typeof value === 'number') {
        return contains && value === minValue;
      }
      return contains;
    };

    const shouldAddFilter = (contains, value, minValue = 0): boolean => {
      if (typeof value === 'boolean') {
        return !contains && value;
      } else if (typeof value === 'number') {
        return !contains && value !== minValue;
      }
      return !contains;
    };

    let propName = '';
    let propValue = null;

    // tslint:disable-next-line:forin
    for (const key in filters.filterProperty ) {
      propName = key;
      propValue = filters.filterProperty[key];
    }
    if (propValue === null) {
      propValue = filters.filterValues;
    }

    const imagesToFilter = this.shouldTransformRelatives
      ? [] : this.transformers.nodes().filter(s => s.name() === shapeName);


    for (const bannerGroup of this.bannerGroups) {
      const shape = bannerGroup.group.findOne(`.${shapeName}`);
      if (!shape) { continue; }
      // skip if this image is not selected
      if (imagesToFilter.length) {
        if (!imagesToFilter.includes(shape)) {
          continue;
        }
      }


      const activeFilters = shape.filters() ?? [];
      const containsFilter = activeFilters.includes( Konva.Filters[filters.filterName] );

      if (shouldRemoveFilter(containsFilter, propValue, filters.minValue)) {
        shape.filters( activeFilters.filter(f => f !== Konva.Filters[filters.filterName] ));
      } else if (shouldAddFilter(containsFilter, propValue, filters.minValue)) {
        shape.filters( activeFilters.concat([Konva.Filters[filters.filterName]]) );
      }

      shape.setAttr(propName, propValue);
    }
    this.redraw();
  }

  public drawBanners(): void {
    if (this.canvas) {
      // console.log('Drawing banners');
      for (const bannerGroup of this.bannerGroups) {
        bannerGroup.group.destroy();
      }
      this.bannerGroups = [];

      // this.transformers = this.transformer();
      // const bgLayer = new Konva.Layer();
      // bgLayer.add(this.transformers);
      // this.layers = [bgLayer];
      // this.canvas.add(bgLayer);
      const spacing = 20;
      const lineXStart = 60;
      let posX = lineXStart;
      let posY = spacing;
      let lineNum = 0;
      let lineHeight = 0;
      this.banners.forEach((banner, index) => {
        const group = new Konva.Group({
          id: `group-${banner.layout.name}`,
          name: `group-${banner.layout.name}`,
          draggable: false,
          clipY: posY,
          clipX: posX,
          clipWidth: banner.layout.dimensions.width,
          clipHeight: banner.layout.dimensions.height,
          width: banner.layout.dimensions.width,
          height: banner.layout.dimensions.height,
        });

        const bg = new Konva.Rect({
          id: `group-bg-${banner.layout.name}`,
          name: 'background',
          x: posX,
          y: posY,
          width: banner.layout.dimensions.width,
          height: banner.layout.dimensions.height,
          fill: '#fff',
          transformable: false,
        });
        const label = KonvaService.bannerLabel({x: 0, y: posY + banner.layout.dimensions.height}, `${banner.layout.dimensions.width}x${banner.layout.dimensions.height}`);
        label.name('banner-label');
        label.y( label.y() - label.height() );
        label.x( posX + banner.layout.dimensions.width - label.width() );

        group.add(bg, label);

        posX += banner.layout.dimensions.width + spacing;

        lineHeight = Math.max(lineHeight, banner.layout.dimensions.height + label.height());
        this.layers[0].add(group);
        const nextBannerWidth = this.banners[index + 1]?.layout.dimensions.width;
        if (posX + nextBannerWidth >= 1400) {
          posX = lineXStart;
          lineNum++;
          posY += lineHeight + spacing;
          lineHeight = spacing;
        }
        this.bannerGroups.push({ group, bg });
      });
      this.redraw();
    }

  }

  public drawImage(slugifiedShapeName: string, conf: Konva.ImageConfig = {image: null}): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === slugifiedShapeName);
    if (!shape.bannerShapeConfig) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    conf.name = slugifiedShapeName;
    if (!conf.image) { return; }
    for (const banner of this.banners) {
      const img = this.imageService.drawImage(this.bannerGroups[banner.id].group, banner, shape, conf);
      if (img !== null) {
        shape.bannerShapeConfig.set(banner.id, img.getAttrs());
        img.on('dragmove', (dragging) => this.moveAllRelatives(dragging, banner.id, slugifiedShapeName));
        img.on('transformend', (endedTransform) => this.transformRelatives(endedTransform, banner.id, slugifiedShapeName));
      }
    }

    this.transformers.moveToTop();
    this.redraw();
  }

  private bindTextEvents(text: Konva.Text, index: number, slugifiedShapeName: string): void {
    text.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, slugifiedShapeName));
    text.on('transform', (transform) => {
      for (const relativeBannerGroup of this.bannerGroups) {
        const relativeText = relativeBannerGroup.group.findOne(`.${slugifiedShapeName}`);
        if (!this.shouldTransformRelatives) {
          if (relativeText !== transform.target) {
            continue;
          }
        }
        relativeText.setAttrs({
          // the Text width should never be bigger than its parent group so we do Math.min
          width: Math.min(Math.max( text.width() * text.scaleX(), 50), relativeBannerGroup.group.width()),
          scaleX: 1,
        });
        relativeText.cache();
      }
    });
  }

  public drawText(slugifiedShapeName: string, conf: Konva.TextConfig = {}): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === slugifiedShapeName);
    if (!shape.bannerShapeConfig) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    for (const [index, banner] of this.banners.entries()) {
      const text = this.textService.drawText(this.bannerGroups[banner.id].group, banner, shape, conf);
      if (text !== null) {
        this.bindTextEvents(text, index, slugifiedShapeName);
      }
    }
    this.transformers.moveToTop();
    this.redraw();
  }

  public updateText(slugifiedShapeName: string, attributes: Konva.TextConfig): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === slugifiedShapeName);
    const textsToUpdate = this.shouldTransformRelatives
      ? [] : this.transformers.nodes().filter(s => s.name() === slugifiedShapeName);

    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      const textShape = bannerGroup.group.findOne(`.${slugifiedShapeName}`);
      if (textsToUpdate.length) {
        if (!textsToUpdate.includes(textShape)) {
          continue;
        }
      }
      const text = this.textService.updateText(textShape as Konva.Text, bannerGroup.group,
        this.banners[index], shape, attributes, slugifiedShapeName);
      if (text !== null) {
        this.bindTextEvents(text, index, slugifiedShapeName);
      }
    }
    this.redraw();
  }

  public drawHeadline(conf: Konva.TextConfig = {}): void {
    this.drawText('headline', conf);
    this.transformers.moveToTop();
    this.redraw();
  }

  public changeHeadline(attributes: Konva.TextConfig): void {
    this.updateText('headline', attributes);
  }

  public drawBackground(conf: Konva.ImageConfig): void {
    // console.log('Drawing background');
    let firstTimeDrawing = false;

    const shape = this.shapes.find(s => s.userShapeName.slugify() === 'background');
    if (!shape.bannerShapeConfig) {
      firstTimeDrawing = true;
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }

    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      // destroy old background so we dont waste memory
      bannerGroup.group.getChildren(children => children.name() === 'bg-image').each(c => c.destroy());
      // console.log(shape?.bannerShapeConfig?.get(index));

      const bgImage = new Konva.Image({
        ...shape?.bannerShapeConfig?.get(index),
        name: 'bg-image',
        x: bannerGroup.group.clipX(),
        y: bannerGroup.group.clipY(),
        width: this.banners[index].layout.dimensions.width,
        height: this.banners[index].layout.dimensions.height,
        ...conf,
        draggable: true,
        transformable: false,
      });

      bgImage.cropX(shape?.bannerShapeConfig?.get(index)?.cropX);
      bgImage.cropY(shape?.bannerShapeConfig?.get(index)?.cropY);

      bgImage.on('dragstart', dragstart => {
        dragstart.target.setAttr('dragJustStarted', true);
      });

      bgImage.on('dragmove', dragging => {
        bgImage.x(bannerGroup.group.clipX());
        bgImage.y(bannerGroup.group.clipY());
        const justStarted = dragging.target.getAttr('dragJustStarted');
        if (justStarted) {
          dragging.target.setAttr('dragFromX', dragging.evt.clientX);
          dragging.target.setAttr('dragFromY', dragging.evt.clientY);
          dragging.target.setAttr('dragJustStarted', false);
          return;
        }
        const dragDeltaX = dragging.evt.clientX - dragging.target.getAttr('dragFromX');
        const dragDeltaY = dragging.evt.clientY - dragging.target.getAttr('dragFromY');
        dragging.target.setAttr('dragFromX', dragging.evt.clientX);
        dragging.target.setAttr('dragFromY', dragging.evt.clientY);

        for (const bannerGroup2 of this.bannerGroups) {
          const img = (bannerGroup2.group.findOne('.bg-image') as Konva.Image);
          if (!this.shouldTransformRelatives) {
            if (img !== dragging.target) {
              continue;
            }
          }
          img.clearCache();
          if (img.cropX() - dragDeltaX > 0 && (img.cropX() - dragDeltaX + img.cropWidth()) < img.image().width) {
            img.cropX( img.cropX() - dragDeltaX );
          }
          if (img.cropY() - dragDeltaY > 0 && (img.cropY() - dragDeltaY + img.cropHeight()) < img.image().height) {
            img.cropY( img.cropY() - dragDeltaY );
          }
          img.cache();
          img.draw();
        }
      });

      bgImage.on('dragend', () => {
        for (const [idx, group] of this.bannerGroups.entries()) {
          const img = (group.group.findOne('.bg-image') as Konva.Image);
          shape.bannerShapeConfig.set(idx, img.getAttrs());
        }
      });

      shape.bannerShapeConfig.set(index, bgImage.getAttrs());
      bannerGroup.group.add(bgImage);
      bgImage.moveToBottom();
      bgImage.cache();
      bannerGroup.bg.moveToBottom();
    }
    if (firstTimeDrawing) {
      this.positionBackground('center-top');
    }
    this.redraw();
  }

  public positionBackground(position: string): void {
    this.bannerGroups.forEach((bannerGroup) => {
      const bgImage = bannerGroup.group.findOne('.bg-image');
      if (!bgImage) { return; }

      bgImage.setAttr('lastCropUsed', position);
      const sourceImageWidth = (bgImage as Konva.Image).image().width as number;
      const sourceImageHeight = (bgImage as Konva.Image).image().height as number;
      // const {width, height} = { width: (bgImage as Konva.Image).image().width, height: (bgImage as Konva.Image).image().height };
      const aspectRatio = bgImage.width() / bgImage.height();
      let newWidth = bgImage.height() * aspectRatio;
      let newHeight = bgImage.height();
      const imageRatio = sourceImageWidth / sourceImageHeight;
      if (aspectRatio >= imageRatio) {
        newWidth = bgImage.width();
        newHeight = bgImage.width() / aspectRatio;
      }
      let x = 0;
      let y = 0;
      if (position === 'left-top') {
      } else if (position === 'left-middle') {
        y = (sourceImageHeight - newHeight) / 2;
      } else if (position === 'left-bottom') {
        y = sourceImageHeight - newHeight;
      } else if (position === 'center-top') {
        x = (sourceImageWidth - newWidth) / 2;
      } else if (position === 'center-middle') {
        x = (sourceImageWidth - newWidth) / 2;
        y = (sourceImageHeight - newHeight) / 2;
      } else if (position === 'center-bottom') {
        x = (sourceImageWidth - newWidth) / 2;
        y = sourceImageHeight - newHeight;
      } else if (position === 'right-top') {
        x = sourceImageWidth - newWidth;
      } else if (position === 'right-middle') {
        x = sourceImageWidth - newWidth;
        y = (sourceImageHeight - newHeight) / 2;
      } else if (position === 'right-bottom') {
        x = sourceImageWidth - newWidth;
        y = sourceImageHeight - newHeight;
      } else if (position === 'scale') {
        newWidth = sourceImageWidth;
        newHeight = sourceImageHeight;
      } else {
        console.error(
          new Error('Unknown clip position property - ' + position)
        );
      }
      (bgImage as Konva.Image).crop({
        x,
        y,
        width: newWidth,
        height: newHeight,
      });
      bgImage.cache();
    });
  }

  public zoomBackground(scale: number): void {
    this.bannerGroups.forEach((bannerGroup) => {
      const bgImage = bannerGroup.group.findOne('.bg-image');
      if (!bgImage) { return; }
      bgImage.scale({ x: scale, y: scale });
    });
    this.redraw();
  }

  public drawButton(labelConfig = {}, tagConfig = {}, textConfig = {}): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === 'button');
    if (!shape.bannerShapeConfig) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    for (const [index, banner] of this.banners.entries()) {
      const configs = {labelConfig, tagConfig, textConfig};
      const button = this.buttonService
        .drawButton(this.bannerGroups[banner.id].group, banner, shape, configs, shape.userShapeName.slugify());

      if (button !== null) {
        button.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, 'button'));
      }
    }
    this.transformers.moveToTop();
    this.redraw();
  }

  public updateButton(changeOf: 'style'|'text', config: Konva.TagConfig|Konva.TextConfig): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === 'button');
    if (!shape.bannerShapeConfig) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    const btnsToChange = this.shouldTransformRelatives
      ? [] : this.transformers.nodes().filter(s => s.name() === 'button');

    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      const button = bannerGroup.group.findOne('.button');
      if (btnsToChange.length) {
        if ( !btnsToChange.includes(button)) {
          continue;
        }
      }
      const updated = this.buttonService
        .updateButton(changeOf, button as Konva.Label, config, bannerGroup.group, this.banners[index], shape);
      if (updated !== null) {
        button.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, 'button'));
      }
    }
    this.redraw();
  }

  public drawShape(shapeInfo: ShapeInformation): void {
    if (!shapeInfo.bannerShapeConfig) {
      shapeInfo.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }

    for (const [index, banner] of this.bannerGroups.entries()) {
      const shapeToDraw = this.shapeFactory.createShape(shapeInfo, {
        rect: {
          dblclick: (event) => this.rect2poly(event),
        },
      });
      if (shapeInfo.bannerShapeConfig.has(index)) {
        const savedData = shapeInfo.bannerShapeConfig.get(index);
        if ( !savedData.shoulDraw) { return; }
        shapeToDraw.setAttrs(savedData);
      } else {
        const { x: offsetX, y: offsetY } = banner.group.clip();
        shapeInfo.bannerShapeConfig.set(index, shapeToDraw.getAttrs());
        shapeToDraw.x( shapeToDraw.x() + offsetX );
        shapeToDraw.y( shapeToDraw.y() + offsetY );
      }
      shapeToDraw.on('dragmove', (dragging) =>
        this.moveAllRelatives(dragging, this.banners[index].id, shapeInfo.userShapeName.slugify()));
      shapeToDraw.on('transformend', (endedTransform) =>
        this.transformRelatives(endedTransform, this.banners[index].id, shapeInfo.userShapeName.slugify()));
      banner.group.add(shapeToDraw);

    }
    this.redraw();
  }

  private rect2poly(event): void {
    this.transformers.nodes([]);
    const rect = event.target;
    const r = { x: rect.x(), y: rect.y(), w: rect.width(), h: rect.height() };
    const points = [r.x, r.y, r.x + r.w, r.y, r.x + r.w, r.y + r.h, r.x, r.y + r.h];
    const editGroup = new Konva.Group({ draggable: true, transformable: false, });
    const polygon = new Konva.Line({
      closed: true,
      fill: rect.fill(),
      draggable: false,
      stroke: rect.stroke(),
      transformable: false,
      points,
    });
    editGroup.add(polygon);

    const pairwise = (arr: any[], func) => {
      if (arr.length % 2 !== 0) {
        throw new Error('Number of elements in array is not even');
      }
      for (let i = 0; i < arr.length; i += 2) {
        func(arr[i], arr[i + 1], i);
      }
    };

    pairwise(polygon.points(), (cx, cy, pidx) => {
      const editPoint = new Konva.Circle({
        x: cx,
        y: cy,
        radius: 10,
        fill: '#777',
        stroke: '#000',
        draggable: true,
        transformable: false,
      });
      editPoint.on('dragmove', (drag) => {
        const polyPoints = polygon.points();
        polyPoints[pidx] = editPoint.x();
        polyPoints[pidx + 1] = editPoint.y();
        this.redraw();
      });
      editGroup.add(editPoint);
    });
    event.target.getParent().add(editGroup);
    this.redraw();
  }

  private moveAllRelatives(dragEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex: number, shapeName: string): void {
    const percentages = this.getBannerPercentagesFromEvent(dragEvent, bannerGroupIndex);
    // console.log('Computed percentages', percentages);
    const shapeData = this.shapes.find(s => s.userShapeName.slugify() === shapeName);
    if (!shapeData.bannerShapeConfig) {
      shapeData.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    dragEvent.target.setAttr('percentagePositions', percentages);

    if (shapeData.userShapeName.slugify() === 'button') {
      // save button data
      shapeData.bannerShapeConfig.get(bannerGroupIndex).labelConfig = dragEvent.target.getAttrs();
    } else {
      shapeData.bannerShapeConfig.set(bannerGroupIndex, dragEvent.target.getAttrs());
    }

    if (!this.shouldTransformRelatives) { return; }
    let positionFix = 0;
    if (KonvaService.isRadiiBasedShape(dragEvent.target.getClassName())) {
      positionFix = dragEvent.target.getAttr('radius');
    }


    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if (bannerGroup.group === dragEvent.target.getParent()) { continue; }
      const relativeShape = bannerGroup.group.findOne(`.${shapeName}`);
      if (!relativeShape) { continue; }
      relativeShape.setAttr('percentagePositions', percentages);
      const pos = this.getPixelPositionsWithinBanner(index, percentages, relativeShape);
      relativeShape.x(pos.x + positionFix);
      relativeShape.y(pos.y + positionFix);
      if (shapeData.userShapeName.slugify() === 'button') {
        shapeData.bannerShapeConfig.get(index).labelConfig = relativeShape.getAttrs();
      } else {
        shapeData.bannerShapeConfig.set(index, relativeShape.getAttrs());
      }
    }
    this.redraw();
  }

  private transformRelatives(transformEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex, shapeName: string): void {
    if (transformEvent.target.isCached()) {
      transformEvent.target.cache();
    }
    // Object image center in percentage
    const percentages = this.getBannerPercentagesFromEvent(transformEvent, bannerGroupIndex);
    // current shape data
    const shapeData = this.shapes.find(s => s.userShapeName.slugify() === shapeName);

    if (shapeData.userShapeName.slugify() === 'button') {
      // save button data
      console.log(transformEvent.target.name());
      shapeData.bannerShapeConfig.get(bannerGroupIndex).labelConfig = transformEvent.target.getAttrs();
    } else {
      shapeData.bannerShapeConfig.set(bannerGroupIndex, transformEvent.target.getAttrs());
    }
    // console.log(shapeData.bannerShapeConfig.get(bannerGroupIndex));
    // calculate final dimensions in percentages relative to its banner
    let dimensionsWidthPercentage = transformEvent.target.width() * transformEvent.target.scaleX();
    dimensionsWidthPercentage /= this.bannerGroups[bannerGroupIndex].group.width();
    dimensionsWidthPercentage *= 100;
    let aspectRatio = transformEvent.target.height() * transformEvent.target.scaleY();
    aspectRatio /= transformEvent.target.width() * transformEvent.target.scaleX();

    if (!this.shouldTransformRelatives) { return; }
    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if (bannerGroup.group === transformEvent.target.getParent()) { continue; }
      const relative = bannerGroup.group.findOne(`.${shapeName}`);
      // some relatives might not exist, because the user set it
      if (!relative) { continue; }
      const finalWidth = (dimensionsWidthPercentage / 100) * bannerGroup.group.width();
      // to preserve aspect ration
      const finalHeight = finalWidth * aspectRatio;
      // if (transformEvent.target.getClassName() === 'image') {
      //
      // }
      relative.scaleX( finalWidth / relative.width() );
      relative.scaleY( finalHeight / relative.height() );
      const pos = this.getPixelPositionsWithinBanner(index, percentages, relative);
      relative.x(pos.x);
      relative.y(pos.y);
      relative.rotation(transformEvent.target.getAbsoluteRotation());
      shapeData.bannerShapeConfig.set(index, relative.getAttrs());
      if (relative.isCached()) {
        relative.cache();
      }
    }
    this.redraw();
  }

  private getPixelPositionsWithinBanner(index: number, percentages: Point2D, relative: Konva.Node): Point2D {
    const dimensions = {
      width: relative.width() * relative.scaleX(),
      height: relative.height() * relative.scaleY()
    };
    const banner = this.banners[index];
    const {x: actualXPos, y: actualYPos} = banner.getPixelPositionFromPercentage(percentages, dimensions);
    const offsetX = this.bannerGroups[index].group.clipX();
    const offsetY = this.bannerGroups[index].group.clipY();
    return { x: actualXPos + offsetX, y: actualYPos + offsetY };
  }

  private getBannerPercentagesFromEvent(ev: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex: number): Point2D {
    const dimensions = {
      width: ev.target.width() * ev.target.scaleX(),
      height: ev.target.height() * ev.target.scaleY()
    };
    let { x: xPos, y: yPos } = ev.target.getPosition();
    if (KonvaService.isRadiiBasedShape(ev.target.getClassName())) {
      xPos -= ev.target.getAttr('radius');
      yPos -= ev.target.getAttr('radius');
    }
    // if (ev.target.getAttr('radius'));
    // console.log(ev.target.getPosition());
    xPos -= ev.target.getParent().clipX();
    yPos -= ev.target.getParent().clipY();
    const eventBanner = this.banners[bannerGroupIndex];
    return eventBanner.getPercentageCenterPositionInBanner({x: xPos, y: yPos}, dimensions);
  }

  public redrawShapes(): void {
    for (const bannerGroup of this.bannerGroups) {
      bannerGroup.group
        .getChildren( node => node.name() !== 'group-bg' && node.name() !== 'banner-label' )
        .each(c => c.destroy());
    }

    for (const shape of this.shapes) {
      if ( Object.keys(shape.shapeConfig).length === 0) {
        continue;
      }

      if (shape.isText) {
        this.drawText(shape.userShapeName.slugify(), { ...shape.shapeConfig });
      } else if (shape.isImage && shape.shapeConfig.image) {
        if (shape.userShapeName.slugify() === 'background') {
          this.drawBackground(shape.shapeConfig as Konva.ImageConfig);
        } else {
          this.drawImage(shape.userShapeName.slugify(), shape.shapeConfig as Konva.ImageConfig);
        }
      } else if (shape.isButton && shape.bannerShapeConfig) {
        this.drawButton({}, {}, shape.shapeConfig);
      }

    }
  }

  public getPointPixelPositionFromPercentage(percentage: Point2D, maxDimensions: Dimension2D): Point2D {
    return {x: (percentage.x / 100) * maxDimensions.width, y: (percentage.y / 100) * maxDimensions.height };
  }

  public updateBackgroundOfShape($event: Konva.ShapeConfig, slugifiedShapeName: string): void {
    // console.log($event);
    const pixelPoints = {
      fillLinearGradientStartPoint: undefined,
      fillLinearGradientEndPoint: undefined,
      fillRadialGradientStartPoint: undefined,
      fillRadialGradientEndPoint: undefined,
    };

    const keysToDelete = [];
    // Dont delete key directly to avoid Undefined behaviour
    for (const key of Object.keys(pixelPoints)) {
      if ( !(key in $event)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      delete pixelPoints[key];
    }

    // shape dimensions
    const shapeDim = (shape: Konva.Node): Dimension2D => ({width: shape.width(), height: shape.height()});
    for (const [index, {bg, group}] of this.bannerGroups.entries()) {
      const shape = group.findOne(`.${slugifiedShapeName}`);
      if (!shape) {
        continue;
      }
      for (const pointKey of Object.keys(pixelPoints)) {
        pixelPoints[pointKey] = this.getPointPixelPositionFromPercentage($event[pointKey], shapeDim(shape));
      }
      // dimensions
      const dims = shapeDim(shape);

      const radialGradientRadiuses = {
        fillRadialGradientStartRadius: (($event.fillRadialGradientStartRadius ?? 0) / 100.0) *
          (dims.width >= dims.height ? dims.width : dims.height),
        fillRadialGradientEndRadius: (($event.fillRadialGradientEndRadius ?? 0) / 100.0) *
          (dims.width >= dims.height ? dims.width : dims.height),
      };

      if ('fillRadialGradientStartRadius' in $event) {
        shape.setAttrs({ ...$event, ...pixelPoints, ...radialGradientRadiuses });
      } else {
        shape.setAttrs({ ...$event, ...pixelPoints });
      }
      if (shape.isCached()) {
        shape.cache();
      }
    }
    this.redraw();
  }
}
