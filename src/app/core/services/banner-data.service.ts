import { Injectable } from '@angular/core';
import Konva from 'konva';
import {BehaviorSubject, Subject} from 'rxjs';
import {Banner} from '@core/models/banner-layout';

@Injectable({
  providedIn: 'root'
})
export class BannerDataService {

  userShapes: ShapeInformation[] = [];
  public datasetChanged$ = new Subject<string>();
  public informationUpdated$ = new Subject<string>();
  public banners$ = new BehaviorSubject<Banner[]>([]);

  datasets = new Map<string, ShapeInformation[]>();
  private datasetCounter = 0;
  private activeDataset: string;
  private banners: Banner[] = [];

  constructor() {
    this.datasets.set(`Dataset #${++this.datasetCounter}`, this.createDataset());
    this.activeDataset = `Dataset #${this.datasetCounter}`;
    console.log(`Creating ${BannerDataService.name} instance!`);
  }

  private createDataset(): ShapeInformation[] {
    const dataset: ShapeInformation[] = [
      {
        userShapeName: 'Logo',
        isImage: true,
        shapeConfig: {
          draggable: true,
        },
      },
      {
        userShapeName: 'Headline',
        isText: true,
        shapeConfig: {
          text: '',
        },
      },
      {
        userShapeName: 'Background',
        isImage: true,
        shapeConfig: {},
      },
      {
        userShapeName: 'Button',
        isButton: true,
        shapeConfig: {
          labelConfig: {},
          tagConfig: {},
          textConfig: {},
        },
      }
    ];
    return dataset.concat( [...this.userShapes] );
  }

  public addDataset(): void {
    this.datasets.set(`Dataset #${++this.datasetCounter}`, this.createDataset());
  }

  public setActiveDataset(setName: string): void {
    if (this.activeDataset !== setName) {
      this.activeDataset = setName;
      this.datasetChanged$.next(setName);
    }
  }

  public getActiveDataset(): ShapeInformation[] {
    return this.datasets.get(this.activeDataset);
  }

  public addToDataset(userShapeName: string, shapeType: 'text'|'image', toAll: boolean = true): void {
    this.userShapes.push({
      userShapeName,
      isText: shapeType === 'text',
      isImage: shapeType === 'image',
      shapeConfig: {
        text: shapeType === 'text' ? userShapeName : '',
      },
    });

    if (toAll) {
      for (const dataset of this.datasets.values()) {
        dataset.push({
          userShapeName,
          isText: shapeType === 'text',
          isImage: shapeType === 'image',
          shapeConfig: {
            text: shapeType === 'text' ? userShapeName : '',
          },
        });
      }
    } else {
      this.datasets.get(this.activeDataset).push({
        userShapeName,
        isText: shapeType === 'text',
        isImage: shapeType === 'image',
        shapeConfig: {
          text: shapeType === 'text' ? userShapeName : '',
        },
      });
    }

    this.informationUpdated$.next(userShapeName);
  }

  public changeValue(datasetKey: string, shapeInfo: ShapeInformation, nextValue: any): void {
    const dataset = this.datasets.get(datasetKey);
    const shapeInformation = dataset.find(shape => shape.userShapeName === shapeInfo.userShapeName);
    if (!shapeInformation) { return; }
    if (shapeInformation.isText) {
      shapeInformation.shapeConfig = { text: nextValue };
      this.informationUpdated$.next(shapeInformation.userShapeName);
    } else if (shapeInformation.isImage) {
      const image = new Image();
      image.src = nextValue;
      image.onload = () => {
        shapeInformation.shapeConfig = { image };
        this.informationUpdated$.next(shapeInformation.userShapeName);
      };
    }
    // console.log(this.datasets);
  }

  public setBanners(banners: Banner[]): void {
    this.banners = banners;
    this.banners$.next(this.banners);
  }
}

export interface ShapeInformation {
  userShapeName: string;
  isText?: boolean;
  isImage?: boolean;
  isButton?: boolean;
  shapeConfig?: Konva.ShapeConfig;
  bannerShapeConfig?: Map<number, Konva.ShapeConfig>;
}
