import { Injectable } from '@angular/core';
import Konva from 'konva';

@Injectable({
  providedIn: 'root'
})
export class ShapeFactoryService {

  constructor() { }

  public createShape(shapeConfig: Konva.ShapeConfig): Konva.Shape {
    let shape: Konva.Shape;
    switch (shapeConfig.shapeType) {
      case 'circle':
        shape = new Konva.Circle();
        break;
      case 'rectangle':
        shape = new Konva.Rect();
        break;
    }
    shape.setAttrs(shapeConfig);
    return shape;
  }
}
