import { Injectable } from '@angular/core';
import * as Konva from 'konva';
import { StageConfig } from 'konva/types/Stage';
import { LayerConfig } from 'konva/types/Layer';
import { CircleConfig } from 'konva/types/shapes/Circle';


@Injectable({
  providedIn: 'root'
})
export class KonvaService {

  canvas: Konva.default.Stage;

  constructor() { }

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

}
