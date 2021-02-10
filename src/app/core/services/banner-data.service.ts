import { Injectable } from '@angular/core';
import Konva from 'konva';

@Injectable({
  providedIn: 'root'
})
export class BannerDataService {

  userShapes: ShapeInformation[] = [];

  datasets = new Map<string, ShapeInformation[]>();
  private datasetCounter = 0;
  private activeDataset: string;

  constructor() {
    this.datasets.set(`Dataset #${++this.datasetCounter}`, this.createDataset());
    this.activeDataset = `Dataset #${this.datasetCounter}`;
    console.log(`Creating ${BannerDataService.name} instance!`);
  }

  private createDataset(): ShapeInformation[] {
    let dataset: ShapeInformation[];
    if (this.datasets.size <= 0) {
      dataset = [
        {
          userShapeName: 'Logo',
          isImage: true,
          shapeConfig: {},
        },
        {
          userShapeName: 'Headline',
          isText: true,
          shapeConfig: {},
        },
        {
          userShapeName: 'Background',
          isImage: true,
          shapeConfig: {},
        },
        {
          userShapeName: 'Button',
          isButton: true,
          shapeConfig: {},
        }
      ];
    } else {
      dataset = [... [...this.datasets.values()].pop() ];
    }

    return dataset;
  }

  public addDataset(): void {
    console.log(this.createDataset());
    this.datasets.set(`Dataset #${++this.datasetCounter}`, this.createDataset());
  }

  public setActiveDataset(setName: string): void {
    this.activeDataset = setName;
  }

  public getActiveDataset(): ShapeInformation[] {
    return this.datasets.get(this.activeDataset);
  }

  public addToDataset(userShapeName: string, shapeType: 'text'|'image'): void {
    for (const [, setShapes] of this.datasets.entries()) {
      this.userShapes.push({
        userShapeName,
        isText: shapeType === 'text',
        isImage: shapeType === 'image',
      });
      setShapes.push(this.userShapes[this.userShapes.length - 1]);
    }
  }

}

export interface ShapeInformation {
  userShapeName: string;
  isText?: boolean;
  isImage?: boolean;
  isButton?: boolean;
  shapeConfig?: Konva.ShapeConfig;
}
