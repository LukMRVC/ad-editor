import {EventEmitter, Injectable} from '@angular/core';
import Konva from 'konva';
import { StageConfig } from 'konva/types/Stage';
import { LayerConfig } from 'konva/types/Layer';
import { CircleConfig } from 'konva/types/shapes/Circle';
import { ImageConfig } from 'konva/types/shapes/Image';
import { TransformerConfig } from 'konva/types/shapes/Transformer';
import { BehaviorSubject } from 'rxjs';
import {RectConfig} from 'konva/types/shapes/Rect';
import {RegularPolygonConfig} from 'konva/types/shapes/RegularPolygon';
import {FlatLayerData, LayerData} from '../../editor/components/stage-layers/stage-layers.component';
import {getGuides, getLineGuideStops, getObjectSnappingEdges} from '@core/utils/KonvaGuidelines';
import {TextConfig} from 'konva/types/shapes/Text';
import {takeWhile, throttle, throttleTime} from 'rxjs/operators';
import {ResizeService, Size} from '@core/services/resize.service';
import { fromEvent } from 'rxjs';
import {getAriaReferenceIds} from '@angular/cdk/a11y/aria-describer/aria-reference';

@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  constructor(
    public resizer: ResizeService,
  ) {}

  private canvas: Konva.Stage;
  private drawing = false;
  private transformers: Konva.Transformer;

  onClickTap$: EventEmitter<any> = new EventEmitter<any>();
  onNewLayer$: EventEmitter<Konva.Layer> = new EventEmitter<Konva.Layer>();
  selectedNodes: Konva.Shape[] = [];

  public layers: Konva.Layer[] = [];
  public addNewShapeToNewLayer = false;
  public workingLayer = -1;

  private $selectedObject: BehaviorSubject<'image' | 'text' | 'shape' | 'background'> =
    new BehaviorSubject<'image' | 'text' | 'shape' | 'background'>('background');

  $selectedObjectType = this.$selectedObject.asObservable();
  layerTreeData: LayerData[] = [];

  private static drawGuides(guides, layer): void {
    guides.forEach((lg) => {
      if (lg.orientation === 'H') {
        const line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guide-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
        layer.batchDraw();
      } else if (lg.orientation === 'V') {
        const line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
        layer.batchDraw();
      }
    });
  }

  private static destroyGuideLines($event): void {
    const layer = $event.currentTarget;
    layer.find('.guide-line').destroy();
    layer.batchDraw();
  }

  updateSelectedObjectType(nextVal: 'image' | 'text' | 'shape' | 'background'): void {
    this.$selectedObject.next(nextVal);
  }

  createInstance(conf: StageConfig): Konva.Stage {
    return new Konva.Stage(conf);
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
    this.canvas.scale({ x: 0.5, y: 0.5 });

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
    this.testWorkGroup();
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
    tr.on('transformend', () => {
      for (const shape of tr.nodes()) {
        if (shape.id() === 'layer-bg') {
          this.layers[0].width( Math.round(shape.width() * shape.scaleX()) );
          this.layers[0].height( Math.round(shape.height() * shape.scaleY()) );
        }
        // adjust size to scale
        // and set minimal size
        shape.width(Math.max(5, shape.width() * shape.scaleX()));
        shape.height(Math.max(5, shape.height() * shape.scaleY()));
        // reset scale to 1
        shape.scaleX(1);
        shape.scaleY(1);
        this.redraw();
      }
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
    this.workingLayer++;
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
    if (this.addNewShapeToNewLayer) {
      return this.layer();
    }
    return this.layers[this.workingLayer];
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

  circle(conf?: CircleConfig): Konva.Circle {
    const layer = this.getWorkingLayerInstance();
    const shapesCount = layer.getChildren(c => c.getClassName() !== 'Transformer').length;
    conf = this.mergeConfig(`Shape ${shapesCount + 1}`, `${layer.id()}:${shapesCount}`, conf);
    const circle = new Konva.Circle(conf);
    this.addShapeToLayer(circle, layer);
    return circle;
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

  guidelinesSnapping($event): void {
    const layer = $event.currentTarget;
    const guideStops = getLineGuideStops(layer.getParent(), $event.target);
    const itemBounds = getObjectSnappingEdges($event.target);
    const guides = getGuides(guideStops, itemBounds);
    if (!guides.length) {
      return;
    }
    KonvaService.drawGuides(guides, layer);
    const absPos = $event.target.absolutePosition();
    // lg for line guide
    guides.forEach((lg) => {
      switch (lg.snap) {
        case 'start': {
          switch (lg.orientation) {
            case 'V': {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case 'H': {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
          }
          break;
        }
        case 'center': {
          switch (lg.orientation) {
            case 'V': {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case 'H': {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
          }
          break;
        }
        case 'end': {
          switch (lg.orientation) {
            case 'V': {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case 'H': {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
          }
          break;
        }
      }
    });
    $event.target.absolutePosition(absPos);
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

  button(): Konva.Label {
    const button = new Konva.Label({
      x: 400,
      y: 500,
      opacity: 0.75,
      draggable: false,
    });

    button.add(new Konva.Tag({
      fill: 'black',
      lineJoin: 'round',
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: { x: 10, y: 10 },
      shadowOpacity: 0.5
    }));

    button.add(new Konva.Text({
      text: 'Button 1',
      fontFamily: 'Calibri',
      fontSize: 18,
      padding: 5,
      fill: 'white'
    }));

    return button;

    // this.addShapeToLayer(button, this.layers[0]);
  }

  testWorkGroup(): void {
    const lineSpacing = 20;
    let lineStartX = lineSpacing;
    let lineY = lineSpacing;

    let lineNum = 0;
    let lineHeight = 0;
    this.resizer.computer.forEach(size => {
      const group = new Konva.Group({
        id: `group-${size.name}`,
        draggable: false,
        clipY: lineY,
        clipX: lineStartX,
        clipWidth: size.width,
        clipHeight: size.height,
        width: size.width,
        height: size.height,
      });

      const bg = this.rect({
        x: lineStartX,
        y: lineY,
        width: size.width,
        height: size.height,
        fill: '#fff',
        transformable: false,
      }, false);

      const label = new Konva.Label({
        y: lineY + size.height,
        opacity: 0.75,
      });

      label.add(new Konva.Tag({
        fill: '#fcfcfc',
        cornerRadius: 5,
        lineJoin: 'round',
      }));

      label.add(new Konva.Text({
        text: `${size.width}x${size.height}`,
        fontFamily: 'Arial',
        fontSize: 15,
        padding: 5,
        fill: 'black',
      }));
      label.x( lineStartX + size.width - label.width() );
      group.clipHeight(group.clipHeight() + label.height());
      bg.cache();
      label.cache();

      const rect = this.rect({
        name: 'rect-test',
        x: lineStartX,
        y: lineY,
        width: 90,
        height: 50,
        draggable: true,
        fill: '#aa45ce',
        transformable: false,

      }, false);

      rect.on('dragmove', dragging => {
        // console.log(dragging);
        const banners = this.layers[0].getChildren(shape => shape.id().includes('group-'));
        // X is relative to the stage, to make it relative to the group we make a difference
        // between the target X position and group X position and take a center
        const relativeCenterX = dragging.target.x() - group.clipX() + dragging.target.width() / 2;
        const relativeCenterY = dragging.target.y() - group.clipY() + dragging.target.height() / 2;

        // then compute the X position as percent between start and end of group container
        const percentageInGroupX = ((relativeCenterX - dragging.target.width() / 2) / (group.width() - dragging.target.width())) * 100;
        const percentageInGroupY = ((relativeCenterY - dragging.target.height() / 2) / (group.height() - dragging.target.height())) * 100;

        banners.each((banner: Konva.Group) => {
          const testRect = banner.getChildren(shape => shape.name() === 'rect-test').toArray()[0];
          // now compute the center of test rectangle in other groups based on their width
          const relativeTestRectCenterX = (percentageInGroupX / 100) * (banner.width() - testRect.width());
          const relativeTestRectCenterY = (percentageInGroupY / 100) * (banner.height() - testRect.height());

          // console.log(`${testRectXRelative} for ${banner.id()} ${banner.width()}`);
          if (testRect !== dragging.target) {
            testRect.x(relativeTestRectCenterX + banner.clipX());
            testRect.y(relativeTestRectCenterY + banner.clipY());
          }
        });
        this.redraw();

        // console.log(children);
      });

      group.add(bg, label, rect);

      lineStartX += size.width + lineSpacing;

      lineHeight = Math.max(lineHeight, size.height);
      this.layers[0].add(group);

      // console.log(lineStartX);
      // console.log(lineHeight);
      if (lineStartX >= 1400) {
        lineStartX = lineSpacing;
        lineNum++;
        lineY += lineHeight + lineSpacing;
      }

    });
    this.redraw();
  }

}
