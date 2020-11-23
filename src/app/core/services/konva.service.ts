import {EventEmitter, Injectable, Output} from '@angular/core';
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


@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  constructor() {}

  private canvas: Konva.Stage;

  onClickTap$: EventEmitter<any> = new EventEmitter<any>();
  onNewLayer$: EventEmitter<Konva.Layer> = new EventEmitter<Konva.Layer>();
  selectedNodes: Konva.Shape[] = [];

  public layers: Konva.Layer[] = [];
  public addNewShapeToNewLayer = false;
  public workingLayer = -1;
  private background: Konva.Rect;

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

  init(conf: StageConfig): void {
    console.log('Initializing konvaJS stage with', conf);
    this.canvas = new Konva.Stage(conf);
    this.canvas.on('click tap', (e: Konva.KonvaEventObject<object>) => {
      if (e.target === this.canvas) {
        this.updateSelectedObjectType('background');
        this.selectedNodes = [this.background];
      } else {
        const isSelected = this.selectedNodes.indexOf(e.target as Konva.Shape) >= 0;
        if (!isSelected) {
          if ((e.evt as MouseEvent).ctrlKey) {
            this.selectedNodes.push(e.target as Konva.Shape);
          } else {
            this.selectedNodes = [e.target as Konva.Shape];
            this.updateSelectedObjectType('shape');
          }
        }
      }
      this.onClickTap$.emit(e);
    });
    const bgLayer = this.layer({ id: 'background', name: 'Background' });
    this.background = this.rect({
      id: 'bg-rect',
      strokeEnabled: false,
      width: this.canvas.width(),
      height: this.canvas.height(),
      fill: '#00000000',
      draggable: false,
      listening: false,
    });
    bgLayer.add(this.background);
    // this.canvas.on('')
  }

  getInstance(): Konva.Stage {
    return this.canvas;
  }

  transformer(conf?: TransformerConfig): Konva.Transformer {
    return new Konva.Transformer();
  }

  layer(conf?: LayerConfig, addToInstance = true): Konva.Layer {
    conf = { ...{name: `Layer ${this.layers.length + 1}`, id: `${this.layers.length}`}, ...conf };
    const layer = new Konva.Layer(conf);
    if (!addToInstance) { return layer; }
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

  private getWorkingLayerInstance(): Konva.Layer {
    if (this.addNewShapeToNewLayer) {
      return this.layer();
    }
    return this.layers[this.workingLayer];
  }

  private addShapeToLayer(shape: Konva.Shape, layer: Konva.Layer): void {
    const indexOfLayer = this.layerTreeData.findIndex(l => l.id === layer.id());
    this.layerTreeData[indexOfLayer].children.push({
      name: shape.name(),
      id: shape.id(),
      iconName: 'shapes',
      children: [],
      zIdx: () => shape.getZIndex(),
    });
    shape.on('transform', () => {
      shape.width(Math.max(5, Math.round(shape.width() * shape.scaleX())));
      shape.height(Math.max(5, Math.round(shape.height() * shape.scaleY())));
      /*if ('radius' in shape) {
        (shape as Konva.Circle).radius( Math.max(5, (shape as Konva.Circle).radius() * (shape as Konva.Circle).scaleX()));
      }*/
      shape.scaleX(1);
      shape.scaleY(1);
    });
    // this is here because as a part of workaround between MatTreeModule
    this.layerTreeData = [...this.layerTreeData];
    layer.add(shape);
    layer.batchDraw();
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
      const indexOfLayer = this.layerTreeData.findIndex(l => l.id === layer.id());
      this.layerTreeData[indexOfLayer].children
        .splice(this.layerTreeData[indexOfLayer].children.findIndex(node => node.id === n.id()), 1);
      n.destroy();
      layer.batchDraw();
    });
    this.layerTreeData = [...this.layerTreeData];
  }

  redraw(): void {
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
          console.log(previousChild[0].getZIndex());
          console.log(currentChild[0].getZIndex());
          previousChild[0].zIndex(previous.zIdx());
          currentChild[0].zIndex(current.zIdx());

        } else { // move to another layer

        }

      }
      this.layerTreeData = [...this.layerTreeData];
    }
  }
}
