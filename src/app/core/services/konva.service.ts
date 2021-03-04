import {EventEmitter, Injectable} from '@angular/core';
import Konva from 'konva';
import {StageConfig} from 'konva/types/Stage';
import {LayerConfig} from 'konva/types/Layer';
import {TransformerConfig} from 'konva/types/shapes/Transformer';
import {RectConfig} from 'konva/types/shapes/Rect';
import {Banner, Point2D} from '@core/models/banner-layout';
import {FilterChangedEvent} from '../../editor/components/image-filter.component';
import {BannerDataService, ShapeInformation} from '@core/services/banner-data.service';
import {ImageService} from '@core/services/drawing/image.service';

// TODO: Add skewing
// TODO: Fillable background color, gradients, watermarks
// TODO: Groupovani obrazku

@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  constructor(
    public dataService: BannerDataService,
    public imageService: ImageService,
  ) {
    // console.log(`Creating ${KonvaService.name} instance`);
    // console.log(this.dataService.getActiveDataset());
    this.shapes = this.dataService.getActiveDataset();

    this.dataService.datasetChanged$.subscribe(() => {
      // console.log(this.dataService.getActiveDataset());
      this.shapes = this.dataService.getActiveDataset();
      this.transformers.nodes([]);

      // console.log('Changed shapes', this.shapes);
      this.redrawShapes();
    });

    this.dataService.banners$.subscribe(newBanners => {
      this.banners = newBanners;
      this.shapes = this.dataService.getActiveDataset();
      // console.log('Drawing banners');
      this.drawBanners();
    });

    this.dataService.informationUpdated$.subscribe(updatedShapeName => {
      this.shapes = this.dataService.getActiveDataset();
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
        this.changeButton('text', updatedShape.shapeConfig);
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

  init(conf: StageConfig): void {
    console.log('Initializing konvaJS stage with', conf);
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

  getInstance(): Konva.Stage {
    return this.canvas;
  }

  transformer(conf?: TransformerConfig): Konva.Transformer {
    const tr = new Konva.Transformer();
    // tr.moveToTop();
    console.log('Creating transformer');
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

  layer(conf?: LayerConfig, addToInstance = true): Konva.Layer {
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

  private addShapeToLayer(shape: Konva.Shape|Konva.Label, layer: Konva.Layer): void {
    // const indexOfLayer = this.layerTreeData.findIndex(l => l.id === layer.id());
    // this.layerTreeData[indexOfLayer].children.push({
    //   name: shape.name(),
    //   id: shape.id(),
    //   iconName: 'shapes',
    //   children: [],
    //   zIdx: () => shape.getZIndex(),
    // });
    (shape as Konva.Shape).on('transform', () => {
      shape.width(Math.max(5, Math.round(shape.width() * shape.scaleX())));
      shape.height(Math.max(5, Math.round(shape.height() * shape.scaleY())));
      /*if ('radius' in shape) {
        (shape as Konva.Circle).radius( Math.max(5, (shape as Konva.Circle).radius() * (shape as Konva.Circle).scaleX()));
      }*/
      shape.scaleX(1);
      shape.scaleY(1);
      layer.batchDraw();
    });
    // this is here because as a part of workaround between MatTreeModule
    layer.add(shape);
    this.transformers.moveToTop();
    this.redraw();
  }


  rect(conf?: RectConfig, addToInstance = true): Konva.Rect {
    if (!addToInstance) {
      return new Konva.Rect(conf);
    }
    const layer = this.getWorkingLayerInstance();
    const shapesCount = layer.getChildren(c => c.getClassName() !== 'Transformer').length;
    conf = KonvaService.mergeConfig(`Shape ${shapesCount + 1}`, `${layer.id()}:${shapesCount}`, conf);
    const rect = new Konva.Rect(conf);
    this.addShapeToLayer(rect, layer);
    return rect;
  }

  updateSelected(updatedValues: object): void {
    for (const shape of this.selectedNodes) {
      shape.setAttrs(updatedValues);
    }
    this.layers.forEach(layer => layer.batchDraw());
  }

  redraw(layer?: Konva.Layer): void {
    if (this.transformers !== null) {
      this.transformers.moveToTop();
    }
    if (layer) {
      layer.batchDraw();
      return;
    }
    this.layers.forEach(l => l.batchDraw());
  }

  moveObjectZIndices(direction: 'Down' | 'ToBottom' | 'ToTop' | 'Up'): void {
    const selectedNodes = this.transformers.nodes();
    if (this.shouldTransformRelatives) {
      const nodesNamesToMove = selectedNodes.map(node => node.name()).filter( (nodeName, index, self) =>
        self.indexOf(nodeName) === index );
      for (const bannerGroup of this.bannerGroups) {
        for (const nodeName of nodesNamesToMove) {
          const node = bannerGroup.group.findOne(`.${nodeName}`);
          node[`move${direction}`]();
        }
      }
    } else {
      selectedNodes.forEach( node => node[`move${direction}`]() );
    }

    this.redraw();
  }

  exportAsImage(target: string, mime: 'image/jpeg' | 'image/png'): void {
    const group = this.bannerGroups.find(g => g.group.id() === target);
    console.log(group);
    console.log(target);
    console.assert(group !== undefined);

    group.group.getChildren().each(c => c.clearCache());
    group.group.draw();

    // const layer = this.canvas.getLayers()[2];
    // const dataUrl = layer.toDataURL({
    //   mimeType: mime,
    // });
    const dataUrl = group.group.toDataURL({ mimeType: mime, pixelRatio: 3 });
    const link = document.createElement('a');
    link.download = 'Ad1-file.jpeg';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  button(conf: Konva.ShapeConfig, tagConfig = {}, textConfig = {}): Konva.Label {
    // labels are groups that contain a text ang tag shape,
    const button = new Konva.Label({
      name: 'button',
      x: conf.x,
      y: conf.y,
      opacity: 1,
      draggable: true,
      transformable: true,
    });

    button.add(new Konva.Tag({
      name: 'button-tag',
      fill: 'red',
      lineJoin: 'round',
      cornerRadius: 0,
      shadowEnabled: false,
      shadowBlur: 5,
      shadowColor: '#000',
      hitStrokeWidth: 0,
      shadowForStrokeEnabled: false,
      ...tagConfig,
    }));

    button.add(new Konva.Text({
      name: 'button-text',
      text: 'Button 1',
      fontFamily: 'Calibri',
      fontSize: 18,
      initialFontSize: 18,
      padding: 5,
      align: 'center',
      verticalAlign: 'middle',
      fill: 'white',
      transformable: true,
      ...textConfig,
    }));

    return button;

    // this.addShapeToLayer(button, this.layers[0]);
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
      console.log('Drawing banners');
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

        const bg = this.rect({
          id: `group-bg-${banner.layout.name}`,
          name: 'group-bg',
          x: posX,
          y: posY,
          width: banner.layout.dimensions.width,
          height: banner.layout.dimensions.height,
          fill: '#fff',
          transformable: false,
        }, false);
        const label = KonvaService.bannerLabel({x: 0, y: posY + banner.layout.dimensions.height}, `${banner.layout.dimensions.width}x${banner.layout.dimensions.height}`);
        label.name('banner-label');
        label.y( label.y() - label.height() );
        label.x( posX + banner.layout.dimensions.width - label.width() );
        bg.cache();
        label.cache();

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

  public drawLogo(conf: Konva.ImageConfig): void {
    this.drawImage('logo', conf);
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
        img.on('transformstart', () => img.setAttr('initialScale', img.scale()));
        img.on('transformend', (endedTransform) => this.transformRelatives(endedTransform, banner.id, slugifiedShapeName));
      }
    }

    this.transformers.moveToTop();
    this.redraw();
  }

  public drawText(slugifiedShapeName: string, conf: Konva.TextConfig = {}): void {
    // console.log('Drawing text');
    const shape = this.shapes.find(s => s.userShapeName.slugify() === slugifiedShapeName);
    // console.log(shape);
    if (!shape.bannerShapeConfig) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    // console.log(shape);
    for (const [index, banner] of this.banners.entries()) {
      let text = null;
      // Draw shape from saved config
      if (shape.bannerShapeConfig.has(index)) {
        if (!shape.bannerShapeConfig.get(index).shouldDraw) { continue; }
        text = new Konva.Text({ ...shape.bannerShapeConfig.get(index), ...shape.shapeConfig});
      } else {
        const dimensions = { width: banner.layout.dimensions.width, height: null };
        conf.width =  banner.layout.dimensions.width;
        conf.fontSize = banner.layout.headlineFontSize;
        conf.shadowEnabled = false;
        conf.draggable = true;
        const { x, y } = banner.getPixelPositionFromPercentage(banner.layout.headlinePosition, dimensions);
        const offsetX = this.bannerGroups[index].group.clipX();
        const offsetY = this.bannerGroups[index].group.clipY();
        const scaleX = 1;
        const scaleY = 1;
        text = new Konva.Text({ name: slugifiedShapeName, x: x + offsetX, y: y + offsetY, scaleX, scaleY, ...conf });
        text.setAttr('initialFontSize', conf.fontSize);
        text.setAttr('shouldDraw', true);
        shape.bannerShapeConfig.set(index, text.getAttrs());
      }

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
      // text.on('transformstart', () => text.setAttr('initialScale', text.scale()));
      // text.on('transformend', (endedTransform) => this.transformRelatives(endedTransform, index, slugifiedShapeName));
      this.bannerGroups[index].group.add(text);
    }
    this.transformers.moveToTop();
    this.redraw();
  }

  public updateText(slugifiedShapeName: string, attributes: Konva.TextConfig): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === slugifiedShapeName);
    // console.log(shape);
    // console.log(this.shapes);
    // console.log('Updating text');
    const textsToUpdate = this.shouldTransformRelatives
      ? [] : this.transformers.nodes().filter(s => s.name() === slugifiedShapeName);

    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      const textShape = bannerGroup.group.findOne(`.${slugifiedShapeName}`);
      if (textsToUpdate.length) {
        if (!textsToUpdate.includes(textShape)) {
          continue;
        }
      }

      const shouldDraw = shape.bannerShapeConfig?.get(index)?.shouldDraw ?? true;

      if ('fontScaling' in attributes) {
        attributes.fontSize = (bannerGroup.group.findOne(`.${slugifiedShapeName}`) as Konva.Text).getAttr('initialFontSize');
        attributes.fontSize *= 1 + (attributes.fontScaling / 10);
      }
      if ( !textShape && shouldDraw) {
        this.drawText(slugifiedShapeName, {...attributes});
        break;
      } else if (textShape) {
        // textShape.clearCache();
        textShape.setAttrs(attributes);
        textShape.cache();
        shape.bannerShapeConfig.set(index, textShape.getAttrs());
      }
      // textShape.setAttr('shouldDraw', true);
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
      let button = null;

      if (shape.bannerShapeConfig.has(index)) {
        const savedData = shape.bannerShapeConfig.get(index);
        if (!savedData.shouldDraw) { continue; }
        // console.log('Recovering button from', savedData);
        button = this.button( savedData.labelConfig, savedData.tagConfig, savedData.textConfig );
      } else {
        const dimensions = { width: banner.layout.dimensions.width / 3, height: banner.layout.dimensions.height / 5 };
        const {x, y} = banner.getPixelPositionFromPercentage(banner.layout.buttonPosition, dimensions);
        const offsetX = this.bannerGroups[index].group.clipX();
        const offsetY = this.bannerGroups[index].group.clipY();
        button = this.button({ x: x + offsetX, y: y + offsetY, ...labelConfig }, tagConfig, textConfig);
        const tag = button.findOne('.button-tag');
        const text = button.findOne('.button-text');
        shape.bannerShapeConfig.set(index, { shouldDraw: true, labelConfig: button.getAttrs(),
          tagConfig: tag.getAttrs(), textConfig: text.getAttrs() });
      }

      button.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, 'button'));
      this.bannerGroups[index].group.add(button);
    }
    this.transformers.moveToTop();
    this.redraw();
  }

  public changeButton(changeOf: 'style'|'text', config: Konva.TagConfig|Konva.TextConfig): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === 'button');
    if (!shape.bannerShapeConfig) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }

    if (changeOf === 'style') {

      const btnsToChange = this.shouldTransformRelatives
        ? [] : this.transformers.nodes().filter(s => s.name() === 'button');

      for (const [index, bannerGroup] of this.bannerGroups.entries()) {
        const tag = bannerGroup.group.findOne('.button-tag');
        const shouldDraw = shape.bannerShapeConfig?.get(index)?.shouldDraw ?? true;
        if (!tag) {
          if (shouldDraw) {
            this.drawButton({}, config, {});
            break;
          }
          continue;
        }
        tag.setAttrs(config);
        const btnSavedCfg = shape.bannerShapeConfig.get(index);
        btnSavedCfg.tagConfig = tag.getAttrs();
        // console.log(shape.bannerShapeConfig.get(index));
        tag.cache();
      }

    } else {

      for (const [index, bannerGroup] of this.bannerGroups.entries()) {
        const text = bannerGroup.group.findOne('.button-text');
        // const tag = bannerGroup.group.findOne('.button-tag');
        const shouldDraw = shape.bannerShapeConfig?.get(index)?.shouldDraw ?? true;

        if (!text) {
          if (shouldDraw) {
            this.drawButton({}, {}, config);
            break;
          }
          continue;
        }

        if ('fontScaling' in config) {
          config.fontSize = text.getAttr('initialFontSize');
          config.fontSize *= 1 + (config.fontScaling / 10);
        }

        text.setAttrs(config);
        const btnSavedCfg = shape.bannerShapeConfig.get(index);
        btnSavedCfg.textConfig = text.getAttrs();
        // console.log(text.getAttrs());
        // console.log(shape.bannerShapeConfig.get(index));
        // tag.cache();
      }
    }

    this.redraw();
  }

  private moveAllRelatives(dragEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex: number, shapeName: string): void {
    // console.log('Moving relatives');
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

    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if (bannerGroup.group === dragEvent.target.getParent()) { continue; }
      const relativeShape = bannerGroup.group.findOne(`.${shapeName}`);
      if (!relativeShape) { continue; }
      relativeShape.setAttr('percentagePositions', percentages);
      const pos = this.getPixelPositionsWithinBanner(index, percentages, relativeShape);
      relativeShape.x(pos.x);
      relativeShape.y(pos.y);
      if (shapeData.userShapeName.slugify() === 'button') {
        shapeData.bannerShapeConfig.get(index).labelConfig = relativeShape.getAttrs();
      } else {
        shapeData.bannerShapeConfig.set(index, relativeShape.getAttrs());
      }
    }
    this.redraw();
  }

  private transformRelatives(transformEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex, shapeName: string): void {
    const initialScale = transformEvent.target.getAttr('initialScale');
    const currentScale = transformEvent.target.getAttr('scale');
    const scaleDelta = { x: currentScale.x - initialScale.x, y: currentScale.y - initialScale.y };
    // console.log('Is cached', transformEvent.target.isCached());
    if (transformEvent.target.isCached()) {
      transformEvent.target.cache();
    }
    const percentages = this.getBannerPercentagesFromEvent(transformEvent, bannerGroupIndex);
    const shapeData = this.shapes.find(s => s.userShapeName.slugify() === shapeName);

    if (shapeData.userShapeName.slugify() === 'button') {
      // save button data
      console.log(transformEvent.target.name());
      // shapeData.bannerShapeConfig.get(bannerGroupIndex).labelConfig = transformEvent.target.getAttrs();
    } else {
      shapeData.bannerShapeConfig.set(bannerGroupIndex, transformEvent.target.getAttrs());
    }
    // console.log(shapeData.bannerShapeConfig.get(bannerGroupIndex));

    if (!this.shouldTransformRelatives) { return; }
    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if (bannerGroup.group === transformEvent.target.getParent()) { continue; }
      const relative = bannerGroup.group.findOne(`.${shapeName}`);
      if (!relative) { continue; }
      relative.scaleX( relative.scaleX() + scaleDelta.x );
      relative.scaleY( relative.scaleY() + scaleDelta.y );
      const aspectRatio = relative.width() / relative.height();

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
}
