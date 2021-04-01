import { Injectable } from '@angular/core';
import Konva from 'konva';

@Injectable({
  providedIn: 'root'
})
export class ShapeFactoryService {

  readonly defaultConfig = {
    width: 50,
    height: 50,
    fill: '#ff0000ff',
    radius: 20,
    x: 50,
    y: 50,
  };

  constructor() { }

  public createShape(shapeConfig: Konva.ShapeConfig): Konva.Shape {
    let shape: Konva.Shape;
    switch (shapeConfig.shapeType) {
      case 'circle':
        shape = new Konva.Circle(this.defaultConfig);
        break;
      case 'rectangle':
        shape = new Konva.Rect(this.defaultConfig);
        break;
    }
    shape.setAttrs(shapeConfig);
    return shape;
  }
}
