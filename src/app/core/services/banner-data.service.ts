import { Injectable } from '@angular/core';
import Konva from 'konva';
import {BehaviorSubject, Subject} from 'rxjs';
import {Banner} from '@core/models/banner-layout';
import {ImageGalleryService} from '@core/services/image-gallery.service';

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

  constructor(
    private imageService: ImageGalleryService,
  ) {
    this.datasets.set(`Dataset #${++this.datasetCounter}`, this.createDataset());
    this.activeDataset = `Dataset #${this.datasetCounter}`;
    // console.log(`Creating ${BannerDataService.name} instance!`);
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
          textConfig: {}
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
    } else if (shapeInformation.isButton) {
      shapeInformation.shapeConfig.text = nextValue;
      this.informationUpdated$.next(shapeInformation.userShapeName);
    }
    // console.log(this.datasets);
  }

  public getActiveBanners(): Banner[] {
    return this.banners;
  }

  public setBanners(banners: Banner[]): void {
    this.banners = banners;
    this.banners$.next(this.banners);
  }

  public uploadDatasets($event: Event): void {
    console.log(this.userShapes);
    const file = ($event.target as HTMLInputElement).files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const lines = result.split(/\r?\n/);
        const header = [];
        let columns = this.userShapes.map(s => s.userShapeName.slugify());
        columns = columns.concat(['headline', 'background', 'logo', 'button']);
        for (const column of lines[0].split(';')) {
          if (column === '') {
            continue;
          } else if (!columns.includes(column)) {
            throw new Error(`Unknown header \'${column}\' found in dataset!`);
          }
          header.push(column);
        }
        console.log(header);
        const dataLines = lines.slice(1);
        for (const line of dataLines) {
          const dataset = this.createDataset();
          const values = line.split(';');
          // console.log(values);
          for (let i = 0; i < header.length; ++i) {
            const shapeInfo = dataset.find(s => s.userShapeName.slugify() === header[i]);
            console.assert(shapeInfo !== undefined);
            // TODO: fix this when assigning text to user defined text
            if (shapeInfo.isText) {
              // console.log({shapeInfo, index: i, value: values[i]});
              shapeInfo.shapeConfig.text = values[i];
              // shapeInfo.shapeConfig.text = values[i];
              console.log(shapeInfo.shapeConfig, values[i]);
              console.log(shapeInfo.shapeConfig.text, values[i]);
            } else if (shapeInfo.isImage) {
              shapeInfo.shapeConfig = { image: this.imageService.getImageInstanceByName( values[i]) };
              // Get image form image gallery service
            } else if (shapeInfo.isButton) {
              shapeInfo.shapeConfig.textConfig.text = values[i];
            }
          }
          this.datasets.set(`Dataset #${++this.datasetCounter}`, dataset);
        }

      };
      reader.readAsText(file, 'utf-8');
    }

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
