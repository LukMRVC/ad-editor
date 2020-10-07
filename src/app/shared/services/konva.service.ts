import {EventEmitter, Injectable, Output} from '@angular/core';
import * as Konva from 'konva';
import { StageConfig } from 'konva/types/Stage';
import { LayerConfig } from 'konva/types/Layer';
import { CircleConfig } from 'konva/types/shapes/Circle';
import { ImageConfig } from 'konva/types/shapes/Image';
import { TransformerConfig } from 'konva/types/shapes/Transformer';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class KonvaService {

  private canvas: Konva.default.Stage;

  onClickTap: EventEmitter<any> = new EventEmitter<any>();
  selectedNodes: Konva.default.Shape[] = [];

  private $selectedObject: BehaviorSubject<'image' | 'text' | 'shape' | 'background'> =
    new BehaviorSubject<'image' | 'text' | 'shape' | 'background'>('background');

  $selectedObjectType = this.$selectedObject.asObservable();

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
      this.onClickTap.emit(e);
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
    return new Konva.default.Layer(conf);
  }

  circle(conf: CircleConfig): Konva.default.Circle {
    return new Konva.default.Circle(conf);
  }

  image(conf: ImageConfig): Konva.default.Image {
    return new Konva.default.Image(conf);
  }

}
