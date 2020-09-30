import { Injectable } from '@angular/core';
import * as Konva from 'konva';
import { StageConfig } from 'konva/types/Stage';
import { LayerConfig } from 'konva/types/Layer';
import { CircleConfig } from 'konva/types/shapes/Circle';
import { ImageConfig } from 'konva/types/shapes/Image';
import {BehaviorSubject} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class KonvaService {

  canvas: Konva.default.Stage;

  private $selectedObject: BehaviorSubject<'image' | 'text' | 'shape' | 'background'> =
    new BehaviorSubject<'image' | 'text' | 'shape' | 'background'>('background');

  $selectedObjectType = this.$selectedObject.asObservable();

  constructor() { }

  updateSelectedObjectType(nextVal: 'image' | 'text' | 'shape' | 'background'): void {
    this.$selectedObject.next(nextVal);
  }

  init(conf: StageConfig): void {
    console.log('Initializing konvaJS stage with', conf);
    this.canvas = new Konva.default.Stage(conf);
  }

  getInstance(): Konva.default.Stage {
    return this.canvas;
  }

  layer(conf?: LayerConfig): Konva.default.Layer {
    return new Konva.default.Layer(conf);
  }

  circle(conf: CircleConfig): Konva.default.Circle {
    return new Konva.default.Circle(conf);
  }

  image(conf: ImageConfig): Konva.default.Image {
    return new Konva.default.Image(conf);
  }

}
