import { Injectable } from '@angular/core';
import Konva from 'konva';
import {ShapeInformation} from '@core/models/dataset';

@Injectable({
  providedIn: 'root'
})
export class ShapeFactoryService {

  readonly defaultConfig = {
    width: 50,
    height: 50,
    fill: '#ff0000ff',
    radius: 20,
    // Radius of the shape
    x: 20,
    y: 20,
    draggable: true,
    scale: { x: 1, y: 1}
  };

  constructor() { }

  public createShape(shapeInfo: ShapeInformation, eventCallbacks): Konva.Shape {
    let shape: Konva.Shape;
    switch (shapeInfo.shapeType) {
      case 'circle':
        shape = new Konva.Circle(this.defaultConfig);
        break;
      case 'rect':
        shape = new Konva.Rect(this.defaultConfig);
        break;
    }
    if (shape.getClassName().toLowerCase() in eventCallbacks) {
      for (const [event, callback] of Object.entries(eventCallbacks[shape.getClassName().toLowerCase()])) {
        // @ts-ignore
        shape.on(event, callback);
      }
    }
    shape.setAttrs(shapeInfo.shapeConfig);
    shape.name(shapeInfo.userShapeName.slugify());
    return shape;
  }
}
