import {EventEmitter, Injectable} from '@angular/core';
import Konva from 'konva';
import {StageConfig} from 'konva/types/Stage';
import {LayerConfig} from 'konva/types/Layer';
import {ImageConfig} from 'konva/types/shapes/Image';
import {TransformerConfig} from 'konva/types/shapes/Transformer';
import {RectConfig} from 'konva/types/shapes/Rect';
import {TextConfig} from 'konva/types/shapes/Text';
import {Banner, Point2D} from '@core/models/banner-layout';
import {FilterChangedEvent} from '../../editor/components/image-filter.component';
import {BannerDataService, ShapeInformation} from '@core/services/banner-data.service';

// TODO: On tab click just switch object source and redraw the canvas with different source
// TODO: Named objects will have properties like on which banners they should appear and the user
// TODO: will simply edit on banner how it is positioned, then just upload image and text sources


@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  constructor(
    public dataService: BannerDataService,
  ) {
    // console.log(`Creating ${KonvaService.name} instance`);
    // console.log(this.dataService.getActiveDataset());
    this.shapes = this.dataService.getActiveDataset();

    this.dataService.datasetChanged$.subscribe(newDatasetName => {
      // console.log(this.dataService.getActiveDataset());
      this.shapes = this.dataService.getActiveDataset();
      for (const bannerGroup of this.bannerGroups) {
        bannerGroup.group
          .getChildren( node => node.name() !== 'group-bg' && node.name() !== 'banner-label' )
          .each(c => c.destroy());
      }
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
        // TODO: change image
      }

    });
  }

  private canvas: Konva.Stage;
  private transformers: Konva.Transformer = null;
  private shapes: ShapeInformation[];

  onClickTap$: EventEmitter<any> = new EventEmitter<any>();
  // onNewLayer$: EventEmitter<Konva.Layer> = new EventEmitter<Konva.Layer>();
  selectedNodes: Konva.Shape[] = [];

  public layers: Konva.Layer[] = [];
  private banners: Banner[];
  private bannerGroups: {group: Konva.Group, bg: Konva.Shape}[] = [];
  private shouldTransformRelatives = true;

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
    bgLayer.add(this.transformers);
  }

  getInstance(): Konva.Stage {
    return this.canvas;
  }

  transformer(conf?: TransformerConfig): Konva.Transformer {
    const tr = new Konva.Transformer();
    tr.moveToTop();
    this.canvas.on('click', ev => {
      // console.log(ev.target.id());
      let nodes = tr.nodes().slice();
      if (ev.target === this.canvas) {
        nodes = [];
      } else if (ev.target.getAttr('transformable') !== false) {
        if (ev.evt.ctrlKey) {
          nodes.push(ev.target);
        } else {
          nodes = [ev.target];
        }
      } else {
        nodes = [];
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

  private mergeConfig(name: string, id: string, conf: object): any {
    return { ...{name, id}, ...conf };
  }


  rect(conf?: RectConfig, addToInstance = true): Konva.Rect {
    if (!addToInstance) {
      return new Konva.Rect(conf);
    }
    const layer = this.getWorkingLayerInstance();
    const shapesCount = layer.getChildren(c => c.getClassName() !== 'Transformer').length;
    conf = this.mergeConfig(`Shape ${shapesCount + 1}`, `${layer.id()}:${shapesCount}`, conf);
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

  moveObjectZIndices(direction: 'down' | 'down-one' | 'up-one' | 'up'): void {
    switch (direction) {
      case 'down':
        this.selectedNodes.forEach(n => n.moveToBottom());
        break;
      case 'down-one':
        this.selectedNodes.forEach(n => n.moveDown());
        break;
      case 'up-one':
        this.selectedNodes.forEach(n => n.moveUp());
        break;
      case 'up':
        this.selectedNodes.forEach(n => n.moveToTop());
        break;
    }
    this.redraw();
  }

  exportAsImage(mime: 'image/jpeg' | 'image/png'): void {
    const layer = this.canvas.getLayers()[2];
    const dataUrl = layer.toDataURL({
      mimeType: mime,
    });
    const link = document.createElement('a');
    link.download = 'Ad1-file.jpeg';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  button(conf: Konva.ShapeConfig): Konva.Label {
    // labels are groups that contain a text ang tag shape,
    const button = new Konva.Label({
      name: 'button',
      x: conf.x,
      y: conf.y,
      opacity: 1,
      draggable: true,
    });

    button.add(new Konva.Tag({
      name: 'button-tag',
      fill: 'red',
      lineJoin: 'round',
      cornerRadius: 0,
      shadowEnabled: false,
      shadowBlur: 5,
      shadowColor: '#000',
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
      transformable: false,
    }));

    return button;

    // this.addShapeToLayer(button, this.layers[0]);
  }

  public setBanners(banners: Banner[]): void {
    this.banners = banners;
  }

  public applyImageFilter(shapeName: string, filters: FilterChangedEvent): void {
    console.log(Konva.Filters[filters.filterName]);
    console.log('Applying filter to ', shapeName, filters);

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

    this.bannerGroups.forEach( (bannerGroup) => {
      const shape = bannerGroup.group.findOne(`.${shapeName}`);
      if (!shape) { return; }
      const activeFilters = shape.filters() ?? [];
      const containsFilter = activeFilters.includes( Konva.Filters[filters.filterName] );

      if (shouldRemoveFilter(containsFilter, propValue, filters.minValue)) {
        shape.filters( activeFilters.filter(f => f !== Konva.Filters[filters.filterName] ));
      } else if (shouldAddFilter(containsFilter, propValue, filters.minValue)) {
        shape.filters( activeFilters.concat([Konva.Filters[filters.filterName]]) );
      }

      shape.setAttr(propName, propValue);


    });
    this.redraw();
  }

  public drawBanners(): void {
    if (this.canvas) {
      console.log('Drawing banners');
      this.canvas.destroyChildren();
      const bgLayer = new Konva.Layer();
      this.layers = [bgLayer];
      this.transformers = this.transformer();
      this.canvas.add(bgLayer);
      bgLayer.add(this.transformers);
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
          name: 'group-bg',
          x: posX,
          y: posY,
          width: banner.layout.dimensions.width,
          height: banner.layout.dimensions.height,
          fill: '#fff',
          transformable: false,
        }, false);
        const label = this.bannerLabel({x: 0, y: posY + banner.layout.dimensions.height}, `${banner.layout.dimensions.width}x${banner.layout.dimensions.height}`);
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

  private bannerLabel(position: Point2D, text: string): Konva.Label {
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

  public drawLogo(conf: Konva.ImageConfig): void {
    this.banners.forEach((banner, index) => {
      if (!banner.layout.hasLogo) { return; }
      const logoDimensions = { width: conf.width, height: conf.height };
      const { x: scaleX, y: scaleY } = banner.getScaleForLogo(logoDimensions);

      const {x, y} = banner.getPixelPositionFromPercentage(banner.layout.logoPosition, logoDimensions, {scaleX, scaleY});
      // console.log('Got coords', {x, y});
      const logos = this.bannerGroups[index].group.getChildren(children => children.name() === 'logo');
      logos.each(logo => logo.destroy());
      const offsetX = this.bannerGroups[index].group.clipX();
      const offsetY = this.bannerGroups[index].group.clipY();
      const image = new Konva.Image({ name: 'logo', x: x + offsetX, y: y + offsetY, scaleX, scaleY,  ...conf });
      // console.log(`For ${this.bannerGroups[index].group.id()} computed X: ${image.x()} and Y: ${image.y()}`);
      image.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, 'logo'));
      image.on('transformstart', () => image.setAttr('initialScale', image.scale()));
      image.on('transformend', (endedTransform) => this.transformRelatives(endedTransform, 'logo'));

      image.cache();
      this.bannerGroups[index].group.add(image);
    });
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
    console.log(shape);
    this.banners.forEach( (banner, index) => {

      let text = null;
      // Draw shape from saved config
      if (shape.bannerShapeConfig.has(index)) {
        if (index === 0) {
          console.log('Config for shape 0', shape.bannerShapeConfig.get(index));
        }

        text = new Konva.Text(shape.bannerShapeConfig.get(index));
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
        shape.bannerShapeConfig.set(index, text.getAttrs());
      }

      text.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, slugifiedShapeName));
      text.on('transformstart', () => text.setAttr('initialScale', text.scale()));
      text.on('transformend', (endedTransform) => this.transformRelatives(endedTransform, slugifiedShapeName));
      this.bannerGroups[index].group.add(text);
    });
    this.transformers.moveToTop();
    this.redraw();
  }

  public updateText(slugifiedShapeName: string, attributes: Konva.TextConfig): void {
    const shape = this.shapes.find(s => s.userShapeName.slugify() === slugifiedShapeName);
    // console.log(shape);
    // console.log(this.shapes);
    console.log('Updating text');
    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if ('fontScaling' in attributes) {
        attributes.fontSize = (bannerGroup.group.findOne(`.${slugifiedShapeName}`) as Konva.Text).getAttr('initialFontSize');
        attributes.fontSize *= 1 + (attributes.fontScaling / 10);
      }
      const textShape = bannerGroup.group.findOne(`.${slugifiedShapeName}`);
      if (!textShape) {
        this.drawText(slugifiedShapeName, {...attributes});
        break;
      } else {
        textShape.setAttrs(attributes);
        textShape.cache();
      }
      shape.bannerShapeConfig.set(index, textShape.getAttrs());
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
    this.bannerGroups.forEach( (bannerGroup, index) => {
      // destroy old background so we dont waste memory
      bannerGroup.group.getChildren(children => children.name() === 'bg-image').each(c => c.destroy());

      const bgImage = new Konva.Image({
        name: 'bg-image',
        x: bannerGroup.group.clipX(),
        y: bannerGroup.group.clipY(),
        width: this.banners[index].layout.dimensions.width,
        height: this.banners[index].layout.dimensions.height,
        ...conf,
      });

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

        this.bannerGroups.forEach(bannerGroup2 => {
          const img = (bannerGroup2.group.findOne('.bg-image') as Konva.Image);
          img.clearCache();
          if (img.cropX() - dragDeltaX > 0 && (img.cropX() - dragDeltaX + img.cropWidth()) < img.image().width) {
            img.cropX( img.cropX() - dragDeltaX );
          }
          if (img.cropY() - dragDeltaY > 0 && (img.cropY() - dragDeltaY + img.cropHeight()) < img.image().height) {
            img.cropY( img.cropY() - dragDeltaY );
          }
          img.cache();
          img.draw();
        });
      });

      bannerGroup.group.add(bgImage);
      bgImage.moveToBottom();
      bannerGroup.bg.moveToBottom();
    });
    this.positionBackground('center-middle');
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

  public drawButton(): void {
    this.banners.forEach( (banner, index) => {
      const dimensions = { width: banner.layout.dimensions.width / 3, height: banner.layout.dimensions.height / 5 };
      const {x, y} = banner.getPixelPositionFromPercentage(banner.layout.buttonPosition, dimensions);
      const offsetX = this.bannerGroups[index].group.clipX();
      const offsetY = this.bannerGroups[index].group.clipY();
      const button = this.button({ x: x + offsetX, y: y + offsetY });

      button.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, 'button'));

      this.bannerGroups[index].group.add(button);
    });
    this.transformers.moveToTop();
    this.redraw();
  }

  public changeButton(changeOf: 'style'|'text', config: Konva.TagConfig|Konva.TextConfig): void {
    if (changeOf === 'style') {
      this.bannerGroups.forEach( (bannerGroup) => {
        const tag = bannerGroup.group.findOne('.button-tag');
        tag.setAttrs(config);
      });
    } else {
      this.bannerGroups.forEach( (bannerGroup) => {
        const text = bannerGroup.group.findOne('.button-text');
        if ('fontScaling' in config) {
          config.fontSize = text.getAttr('initialFontSize');
          config.fontSize *= 1 + (config.fontScaling / 10);
        }
        text.setAttrs(config);
      });

    }
    this.redraw();
  }

  private moveAllRelatives(dragEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex: number, shapeName: string): void {
    let dimensions = {
      width: dragEvent.target.width() * dragEvent.target.scaleX(),
      height: dragEvent.target.height() * dragEvent.target.scaleY()
    };
    let { x: xPos, y: yPos } = dragEvent.target.getPosition();
    xPos -= dragEvent.target.getParent().clipX();
    yPos -= dragEvent.target.getParent().clipY();
    const eventBanner = this.banners[bannerGroupIndex];
    // console.log('Dimensions', dimensions);
    // console.log('X and Y', { xPos, yPos });
    const percentages = eventBanner.getPercentageCenterPositionInBanner({x: xPos, y: yPos}, dimensions);
    // console.log('Computed percentages', percentages);

    const shapeData = this.shapes.find(s => s.userShapeName.slugify() === shapeName);
    if (!shapeData.bannerShapeConfig) {
      shapeData.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    // console.log(`Settings value values for ${bannerGroupIndex}`, dragEvent.target.getAttrs());
    shapeData.bannerShapeConfig.set(bannerGroupIndex, dragEvent.target.getAttrs());

    if (!this.shouldTransformRelatives) { return; }

    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if (bannerGroup.group === dragEvent.target.getParent()) { continue; }
      const relativeShape = bannerGroup.group.findOne(`.${shapeName}`);
      if (!relativeShape) { return; }
      dimensions = {
        width: relativeShape.width() * relativeShape.scaleX(),
        height: relativeShape.height() * relativeShape.scaleY()
      };
      const banner = this.banners[index];
      const {x: actualXPos, y: actualYPos} = banner.getPixelPositionFromPercentage(percentages, dimensions);
      const offsetX = this.bannerGroups[index].group.clipX();
      const offsetY = this.bannerGroups[index].group.clipY();
      // console.table({ index, x: actualXPos + offsetX, y: actualYPos + offsetY });
      relativeShape.x(actualXPos + offsetX);
      relativeShape.y(actualYPos + offsetY);
      shapeData.bannerShapeConfig.set(index, relativeShape.getAttrs());
    }
    this.redraw();
  }

  private transformRelatives(transformEvent: Konva.KonvaEventObject<Konva.Shape>, shapeName: string): void {
    if (!this.shouldTransformRelatives) { return; }
    const initialScale = transformEvent.target.getAttr('initialScale');
    const currentScale = transformEvent.target.getAttr('scale');
    const scaleDelta = { x: currentScale.x - initialScale.x, y: currentScale.y - initialScale.y };
    this.bannerGroups.forEach(bannerGroup => {
      if (bannerGroup.group === transformEvent.target.getParent()) { return; }
      const relative = bannerGroup.group.findOne(`.${shapeName}`);
      if (!relative) { return; }
      relative.scaleX( relative.scaleX() + scaleDelta.x );
      relative.scaleY( relative.scaleY() + scaleDelta.y );
      if (relative.isCached()) {
        relative.cache();
      }
    });
    this.redraw();
  }

  private redrawShapes(): void {
    for (const shape of this.shapes) {
      if ( Object.keys(shape.shapeConfig).length === 0) {
        continue;
      }

      if (shape.isText) {
        this.drawText(shape.userShapeName.slugify(), { ...shape.shapeConfig });
      } else if (shape.isImage) {
        // this.draw
      } else if (shape.isButton) {
      //
      }

    }
  }
}
