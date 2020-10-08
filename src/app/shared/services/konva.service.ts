import {EventEmitter, Injectable, Output} from '@angular/core';
import * as Konva from 'konva';
import { StageConfig } from 'konva/types/Stage';
import { LayerConfig } from 'konva/types/Layer';
import { CircleConfig } from 'konva/types/shapes/Circle';
import { ImageConfig } from 'konva/types/shapes/Image';
import { TransformerConfig } from 'konva/types/shapes/Transformer';
import { BehaviorSubject } from 'rxjs';
import {Color} from '@angular-material-components/color-picker';
import {RectConfig} from 'konva/types/shapes/Rect';
import {RegularPolygonConfig} from 'konva/types/shapes/RegularPolygon';
import {EditorModule} from '../../editor/editor.module';
import {LayerData} from '../../editor/components/stage-layers/stage-layers.component';


@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  private canvas: Konva.default.Stage;

  onClickTap$: EventEmitter<any> = new EventEmitter<any>();
  onNewLayer$: EventEmitter<Konva.default.Layer> = new EventEmitter<Konva.default.Layer>();
  selectedNodes: Konva.default.Shape[] = [];

  private layers: Konva.default.Layer[] = [];
  public addNewShapeToNewLayer = false;
  public workingLayer = 0;

  private $selectedObject: BehaviorSubject<'image' | 'text' | 'shape' | 'background'> =
    new BehaviorSubject<'image' | 'text' | 'shape' | 'background'>('background');

  $selectedObjectType = this.$selectedObject.asObservable();
  layerTreeData: LayerData[] = [];

  constructor() {}

  updateSelectedObjectType(nextVal: 'image' | 'text' | 'shape' | 'background'): void {
    this.$selectedObject.next(nextVal);
  }

  init(conf: StageConfig): void {
    console.log('Initializing konvaJS stage with', conf);
    this.canvas = new Konva.default.Stage(conf);
    this.canvas.on('click tap', (e) => {
      if (e.target === this.canvas) {
        this.selectedNodes = [];
      } else {
        const isSelected = this.selectedNodes.indexOf(e.target as Konva.default.Shape) >= 0;
        if (!isSelected) {
          this.selectedNodes.push(e.target as Konva.default.Shape);
          this.updateSelectedObjectType('shape');
        }
      }
      this.onClickTap$.emit(e);
    });
    // this.canvas.on('')
  }

  getInstance(): Konva.default.Stage {
    return this.canvas;
  }

  transformer(conf?: TransformerConfig): Konva.default.Transformer {
    return new Konva.default.Transformer();
  }

  layer(conf?: LayerConfig): Konva.default.Layer {
    conf = { ...{name: `Layer ${this.layers.length + 1}`, id: `${this.layers.length}`}, ...conf };
    const layer = new Konva.default.Layer(conf);
    this.layers.push(layer);
    this.canvas.add(layer);
    this.onNewLayer$.emit(layer);
    this.layerTreeData = this.layerTreeData.concat([{ name: layer.name(), id: layer.id(), iconName: 'layer-group', children: [] }]);
    return layer;
  }

  private getWorkingLayerInstance(): Konva.default.Layer {
    if (this.addNewShapeToNewLayer) {
      return this.layer();
    }
    return this.layers[this.workingLayer];
  }

  private addShapeToLayer(shape: Konva.default.Shape, layer: Konva.default.Layer): void {
    const indexOfLayer = this.layerTreeData.findIndex(l => l.id === layer.id());
    this.layerTreeData[indexOfLayer].children.push({
      name: shape.name(),
      id: shape.id(),
      iconName: 'shapes',
      children: [],
    });
    // this is here because as a part of workaround between MatTreeModule
    this.layerTreeData = [...this.layerTreeData];
    layer.add(shape);
    shape.draw();
  }

  private mergeConfig(name: string, id: string, conf: object): any {
    return { ...{name, id}, ...conf };
  }

  circle(conf?: CircleConfig): Konva.default.Circle {
    const layer = this.getWorkingLayerInstance();
    const shapesCount = layer.getChildren(c => c.getClassName() !== 'Transformer').length;
    conf = this.mergeConfig(`Shape ${shapesCount + 1}`, `${layer.id()}:${shapesCount}`, conf);
    const circle = new Konva.default.Circle(conf);
    this.addShapeToLayer(circle, layer);
    return circle;
  }

  rect(conf?: RectConfig): Konva.default.Rect {
    const layer = this.getWorkingLayerInstance();
    const shapesCount = layer.getChildren(c => c.getClassName() !== 'Transformer').length;
    conf = this.mergeConfig(`Shape ${shapesCount + 1}`, `${layer.id()}:${shapesCount}`, conf);
    const rect = new Konva.default.Rect(conf);
    this.addShapeToLayer(rect, layer);
    return rect;
  }

  regularPolygon(conf?: RegularPolygonConfig): Konva.default.RegularPolygon {
    const layer = this.getWorkingLayerInstance();
    const shapesCount = layer.getChildren(c => c.getClassName() !== 'Transformer').length;
    conf = this.mergeConfig(`Shape ${shapesCount + 1}`, `${layer.id()}:${shapesCount}`, conf);
    const regPolygon = new Konva.default.RegularPolygon(conf);
    this.addShapeToLayer(regPolygon, layer);
    return regPolygon;
  }

  image(conf: ImageConfig): Konva.default.Image {
    return new Konva.default.Image(conf);
  }

  updateSelectedFillColor(color: Color): void {
    for (const shape of this.selectedNodes) {
      shape.fill(color.toRgba());
      shape.alpha(color.a);
    }
    this.canvas.draw();
  }

  updateSelectedStrokeColor(color: Color): void {
    for (const shape of this.selectedNodes) {
      shape.stroke(color.toRgba());
    }
    this.canvas.draw();
  }
}
