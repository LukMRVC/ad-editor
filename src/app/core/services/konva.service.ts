import {EventEmitter, Injectable} from '@angular/core';
import Konva from 'konva';
import {StageConfig} from 'konva/types/Stage';
import {LayerConfig} from 'konva/types/Layer';
import {ImageConfig} from 'konva/types/shapes/Image';
import {TransformerConfig} from 'konva/types/shapes/Transformer';
import {BehaviorSubject} from 'rxjs';
import {RectConfig} from 'konva/types/shapes/Rect';
import {RegularPolygonConfig} from 'konva/types/shapes/RegularPolygon';
import {FlatLayerData, LayerData} from '../../editor/components/stage-layers/stage-layers.component';
import {TextConfig} from 'konva/types/shapes/Text';
import {takeWhile} from 'rxjs/operators';
import {Banner, Point2D} from '@core/models/banner-layout';

@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  constructor(
  ) {}

  private canvas: Konva.Stage;
  private drawing = false;
  private transformers: Konva.Transformer = null;

  onClickTap$: EventEmitter<any> = new EventEmitter<any>();
  onNewLayer$: EventEmitter<Konva.Layer> = new EventEmitter<Konva.Layer>();
  selectedNodes: Konva.Shape[] = [];

  public layers: Konva.Layer[] = [];
  public addNewShapeToNewLayer = false;
  private banners: Banner[];
  private bannerGroups: {group: Konva.Group, bg: Konva.Shape}[] = [];
  private shouldTransformRelatives = true;

  private $selectedObject: BehaviorSubject<'image' | 'text' | 'shape' | 'background'> =
    new BehaviorSubject<'image' | 'text' | 'shape' | 'background'>('background');

  $selectedObjectType = this.$selectedObject.asObservable();
  layerTreeData: LayerData[] = [];
  updateSelectedObjectType(nextVal: 'image' | 'text' | 'shape' | 'background'): void {
    this.$selectedObject.next(nextVal);
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
    this.canvas.on('dragend', end => {
      console.log('Drag end');
    });
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
      if (this.drawing) {
        return;
      }
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
    this.onNewLayer$.emit(layer);
    this.layerTreeData = this.layerTreeData.concat(
      [{ name: layer.name(), id: layer.id(), iconName: 'layer-group', children: [], zIdx: () => layer.getZIndex() }]
    );
    // layer.on('dragmove', this.guidelinesSnapping);
    // layer.on('dragend', KonvaService.destroyGuideLines);
    return layer;
  }

  getLayerTransformer(layer: Konva.Layer): Konva.Transformer {
    const transformers = layer.getChildren(c => c.getClassName() === 'Transformer');
    return transformers[0] as Konva.Transformer;
  }

  private getWorkingLayerInstance(): Konva.Layer {
    return this.layer();
  }

  private addShapeToLayer(shape: Konva.Shape|Konva.Label, layer: Konva.Layer): void {
    const indexOfLayer = this.layerTreeData.findIndex(l => l.id === layer.id());
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
    this.layerTreeData = [...this.layerTreeData];
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

  regularPolygon(conf?: RegularPolygonConfig): Konva.RegularPolygon {
    const layer = this.getWorkingLayerInstance();
    const shapesCount = layer.getChildren(c => c.getClassName() !== 'Transformer').length;
    conf = this.mergeConfig(`Shape ${shapesCount + 1}`, `${layer.id()}:${shapesCount}`, conf);
    const regPolygon = new Konva.RegularPolygon(conf);
    this.addShapeToLayer(regPolygon, layer);
    return regPolygon;
  }

  image(conf?: ImageConfig): Konva.Image {
    const layer = this.getWorkingLayerInstance();
    conf = this.mergeConfig(`Image 1`, `${layer.id()}:1`, conf);
    const img = new Konva.Image(conf);
    this.addShapeToLayer(img, layer);
    return img;
  }

  text(conf?: TextConfig): Konva.Text {
    const layer = this.getWorkingLayerInstance();
    conf = this.mergeConfig(`Text 1`, `${layer.id()}:1`, conf);
    const txt = new Konva.Text(conf);
    this.addShapeToLayer(txt, layer);
    txt.on('transform', () => {
      txt.setAttrs({
        width: Math.max(txt.width() + txt.scaleX(), 20),
        scaleX: 1,
        scaleY: 1,
      });
    });
    return txt;
  }

  updateSelected(updatedValues: object): void {
    for (const shape of this.selectedNodes) {
      shape.setAttrs(updatedValues);
    }
    this.layers.forEach(layer => layer.batchDraw());
  }

  deleteSelected(): void {
    this.selectedNodes.forEach(n => {
      const layer = this.layers.find(l => l.id() === n.getLayer().id());
      if (!layer) { return; }
      const tr = this.getLayerTransformer(layer);
      tr.nodes([]);
      const indexOfLayer = this.layerTreeData.findIndex(l => l.id === layer.id());
      this.layerTreeData[indexOfLayer].children
        .splice(this.layerTreeData[indexOfLayer].children.findIndex(node => node.id === n.id()), 1);
      n.destroy();
      layer.batchDraw();
    });
    this.layerTreeData = [...this.layerTreeData];
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
    this.layerTreeData = [...this.layerTreeData];
  }


  // TODO: Dodelat presouvani mezi vrstavama
  moveObjectInStage(previous: FlatLayerData, current: FlatLayerData): void {
    const prevId = previous.id;
    const curId = current.id;
    if (prevId !== curId) {
      const isLayer = prevId.indexOf(':') === -1;
      if (isLayer && curId.indexOf(':') === -1) { // valid move of layer to another layer

      } else if (!isLayer && curId.indexOf(':') !== -1) { // valid move of shape
        const prevLayerId = prevId.substring(0, prevId.indexOf(':'));
        const currentLayerId = curId.substring(0, curId.indexOf(':'));
        if (prevLayerId === currentLayerId) { // just a move in layer
          console.log(`moving ${prevId} to ${curId}`);
          const layer = this.layers.find(l => l.id() === currentLayerId);
          const previousChild = layer.getChildren(n => n.id() === prevId);
          const currentChild = layer.getChildren(n => n.id() === curId);
          console.log('Previous:', previousChild[0].getZIndex(), previousChild[0].name());
          console.log('Current:', currentChild[0].getZIndex(), currentChild[0].name());
          const direction = 0;
          // const direction = previousChild[0].getZIndex() > currentChild[0].getZIndex() ? 1 : -1;
          previousChild[0].zIndex(direction - currentChild[0].zIndex());
          currentChild[0].zIndex( direction + previousChild[0].zIndex());

        } else { // move to another layer

        }

      }
      this.layerTreeData = [...this.layerTreeData];
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

  newLayerGroup(): void {
    this.prepareDraw();
    this.onClickTap$.pipe(takeWhile( evt => evt.target !== this.canvas && this.drawing, true)).subscribe(evt => {
      this.endDraw();
      const position = this.canvas.getPointerPosition();
      const layerGroup = new Konva.Group({
        x: position.x,
        y: position.y,
        width: 300,
        height: 300,
        clipWidth: 300,
        clipHeight: 300,
        clipX: -1,
        clipY: -1,
        draggable: true,
      });
      const bg = new Konva.Rect({ id: 'group-1-bg', width: 300, height: 300, draggable: false, x: 0, y: 0, fill: '#fff' });
      layerGroup.add(bg);
      layerGroup.moveToBottom();
      this.layers[0].add(layerGroup);
      this.redraw();
      console.log(this.canvas.getPointerPosition());
      this.canvas.container().classList.remove('drawing');
      console.log('Still taking event');
    });

  }

  prepareDraw(): void {
    this.drawing = true;
    this.canvas.container().classList.add('drawing');
  }

  private endDraw(): void {
    this.drawing = false;
    this.canvas.container().classList.remove('drawing');
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

  public drawBanners(): void {
    const spacing = 20;
    const lineXStart = 60;
    let posX = lineXStart;
    let posY = spacing;
    let lineNum = 0;
    let lineHeight = 0;
    this.banners.forEach((banner, index) => {
      const group = new Konva.Group({
        id: `group-${banner.layout.name}`,
        draggable: false,
        clipY: posY,
        clipX: posX,
        clipWidth: banner.layout.dimensions.width,
        clipHeight: banner.layout.dimensions.height,
        width: banner.layout.dimensions.width,
        height: banner.layout.dimensions.height,
      });

      const bg = this.rect({
        x: posX,
        y: posY,
        width: banner.layout.dimensions.width,
        height: banner.layout.dimensions.height,
        fill: '#fff',
        transformable: false,
      }, false);
      const label = this.bannerLabel({x: 0, y: posY + banner.layout.dimensions.height}, `${banner.layout.dimensions.width}x${banner.layout.dimensions.height}`);
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
      image.on('transformstart', (started) => image.setAttr('initialScale', image.scale()));
      image.on('transformend', (endedTransform) => this.transformRelatives(endedTransform, index, 'logo'));

      image.cache();
      this.bannerGroups[index].group.add(image);
    });
    this.transformers.moveToTop();
    this.redraw();
  }

  public drawHeadline(conf?: Konva.TextConfig): void {
    this.banners.forEach( (banner, index) => {
      const dimensions = { width: banner.layout.dimensions.width, height: null };
      conf.width = banner.layout.dimensions.width;
      conf.fontSize = banner.layout.headlineFontSize;
      conf.shadowOffsetY = 0;
      conf.shadowColor = '#000';
      conf.shadowBlur = 3;
      conf.shadowEnabled = false;
      const {x, y} = banner.getPixelPositionFromPercentage(banner.layout.headlinePosition, dimensions);
      // const headlines = this.bannerGroups[index].group.getChildren(children => children.name() === 'headline');
      const offsetX = this.bannerGroups[index].group.clipX();
      const offsetY = this.bannerGroups[index].group.clipY();
      const scaleX = 1;
      const scaleY = 1;
      const text = new Konva.Text({ name: 'headline', x: x + offsetX, y: y + offsetY, scaleX, scaleY, ...conf });
      text.setAttr('initialFontSize', conf.fontSize);
      text.on('dragmove', (dragging) => this.moveAllRelatives(dragging, index, 'headline'));
      text.on('transformstart', (started) => text.setAttr('initialScale', text.scale()));
      text.on('transformend', (endedTransform) => this.transformRelatives(endedTransform, index, 'logo'));
      this.bannerGroups[index].group.add(text);
    });
    this.transformers.moveToTop();
    this.redraw();
  }

  public changeHeadline(attributes: Konva.TextConfig): void {
    this.bannerGroups.forEach( (bannerGroup, index) => {
      if ('fontScaling' in attributes) {
        attributes.fontSize = (bannerGroup.group.findOne('.headline') as Konva.Text).getAttr('initialFontSize');
        attributes.fontSize *= 1 + (attributes.fontScaling / 10);
      }
      const headline = bannerGroup.group.findOne('.headline');
      headline.setAttrs(attributes);
      headline.cache();
    });
    this.redraw();
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
          if (img.cropX() - dragDeltaX > 0 && (img.cropX() - dragDeltaX + img.cropWidth()) < img.image().width) {
            img.cropX( img.cropX() - dragDeltaX );
          }
          if (img.cropY() - dragDeltaY > 0 && (img.cropY() - dragDeltaY + img.cropHeight()) < img.image().height) {
            img.cropY( img.cropY() - dragDeltaY );
          }
          img.cache();
          img.draw();
        });
        // bgImage.cropX( bgImage.cropX() - dragDeltaX );
        // bgImage.cropY( bgImage.cropY() - dragDeltaY );
        // bgImage.cache();
        // bgImage.draw();
      });

      bannerGroup.group.add(bgImage);
      bgImage.moveToBottom();
      bannerGroup.bg.moveToBottom();
    });
    this.positionBackground('center-middle');
    this.redraw();
  }

  public positionBackground(position: string): void {
    this.bannerGroups.forEach((bannerGroup, index) => {
      const bgImage = bannerGroup.group.findOne('.bg-image');
      if (!bgImage) { return; }
      bgImage.setAttr('lastCropUsed', position);
      const sourceImageWidth = (bgImage as Konva.Image).image().width as number;
      const sourceImageHeight = (bgImage as Konva.Image).image().height as number;
      // const {width, height} = { width: (bgImage as Konva.Image).image().width, height: (bgImage as Konva.Image).image().height };
      const aspectRatio = bgImage.width() / bgImage.height();
      let newWidth = 0;
      let newHeight = 0;
      const imageRatio = sourceImageWidth / sourceImageHeight;
      if (aspectRatio >= imageRatio) {
        newWidth = bgImage.width();
        newHeight = bgImage.width() / aspectRatio;
      } else {
        newWidth = bgImage.height() * aspectRatio;
        newHeight = bgImage.height();
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
      this.bannerGroups.forEach( (bannerGroup, index) => {
        const btn = bannerGroup.group.findOne('.button');
        const tag = bannerGroup.group.findOne('.button-tag');
        tag.setAttrs(config);
      });
    } else {
      this.bannerGroups.forEach( (bannerGroup, index) => {
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
    if (!this.shouldTransformRelatives) { return; }
    let dimensions = {
      width: dragEvent.target.width() * dragEvent.target.scaleX(),
      height: dragEvent.target.height() * dragEvent.target.scaleY()
    };
    let { x: xPos, y: yPos } = dragEvent.target.getPosition();
    xPos -= dragEvent.target.getParent().clipX();
    yPos -= dragEvent.target.getParent().clipY();
    const eventBanner = this.banners[bannerGroupIndex];
    const percentages = eventBanner.getPercentageCenterPositionInBanner({x: xPos, y: yPos}, dimensions);
    // console.log('Computed percentages', percentages);
    this.bannerGroups.forEach((bannerGroup, index) => {
      if (bannerGroup.group === dragEvent.target.getParent()) { return; }
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
      relativeShape.x(actualXPos + offsetX);
      relativeShape.y(actualYPos + offsetY);
    });
    this.redraw();
  }

  private transformRelatives(transformEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex: number, shapeName: string): void {
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

    });
    this.redraw();
  }

}
