import { Injectable } from '@angular/core';
import Konva from 'konva';
import {BehaviorSubject, Subject} from 'rxjs';
import {Banner} from '@core/models/banner-layout';
import {ImageGalleryService} from '@core/services/image-gallery.service';
import {Dataset, ShapeInformation} from '@core/models/dataset';

@Injectable({
  providedIn: 'root'
})
export class BannerDataService {

  userShapes: ShapeInformation[] = [];
  public datasetChanged$ = new Subject<string>();
  public informationUpdated$ = new Subject<string>();
  public banners$ = new BehaviorSubject<Banner[]>([]);

  public template: Dataset;

  public datasets: Dataset[] = [];
  private datasetCounter = 0;
  public activeDataset: string = null;
  private banners: Banner[] = [];

  constructor(
    private imageService: ImageGalleryService,
  ) {
    this.template = new Dataset('Template', null, this.createDataset());
    this.activeDataset = 'template';
    // this.datasets.set(`Template #${++this.datasetCounter}`, this.createDataset());
  }

  private createDataset(): ShapeInformation[] {
    const datasetShapes: ShapeInformation[] = [
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
          text: '',
          textConfig: {},
        },
      }
    ];
    return datasetShapes.concat( JSON.parse(JSON.stringify(this.userShapes)) );
  }

  public addDataset(): void {
    this.datasets.push(
      new Dataset(`Dataset #${++this.datasetCounter}`, this.datasets.length + 1, this.createDataset())
    );
    // this.datasets.set(`Dataset #${++this.datasetCounter}`, this.createDataset());
  }

  public setActiveDataset(setName: string): void {
    if (this.activeDataset !== setName) {
      this.activeDataset = setName;
      this.datasetChanged$.next(setName);
    }
  }

  public getActiveDataset(): ShapeInformation[] {
    if (this.activeDataset === 'template') {
      return this.template.shapes;
    }
    return this.datasets.find(dataset => dataset.datasetName === this.activeDataset)?.shapes ?? [];
  }

  public addShape(userShapeName: string, shapeType: 'text'|'image'): void {
    this.userShapes.push({
      userShapeName,
      isText: shapeType === 'text',
      isImage: shapeType === 'image',
      shapeConfig: {
        text: shapeType === 'text' ? userShapeName : '',
      },
    });
    this.template.shapes.push({
      userShapeName,
      isText: shapeType === 'text',
      isImage: shapeType === 'image',
      shapeConfig: {
        text: shapeType === 'text' ? userShapeName : '',
      },
    });
    for (const dataset of this.datasets) {
      dataset.shapes.push({
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

  public changeValue(datasetName: string, shapeInfo: ShapeInformation, nextValue: any): void {
    let datasetShapes = this.datasets.find(dataset => dataset.datasetName === datasetName)?.shapes ?? [];
    if (datasetName === 'template') {
      datasetShapes = this.template.shapes;
    }
    const shapeInformation = datasetShapes.find(shape => shape.userShapeName === shapeInfo.userShapeName);
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
    const file = ($event.target as HTMLInputElement).files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const lines = result.split(/\r?\n/);
        let columns = this.userShapes.map(s => s.userShapeName.slugify());
        columns = columns.concat(['headline', 'background', 'logo', 'button']);
        const header = this.parseCsvHeader(lines, columns);

        const dataLines = lines.slice(1).filter(l => l != null);
        const templateDataset = this.template.shapes as ShapeInformation[];
        // console.log(templateDataset);

        for (const line of dataLines) {
          const dataset = this.createDataset();
          const values = line.split(';');
          for (let i = 0; i < header.length; ++i) {
            const shapeInfo = dataset.find(s => s.userShapeName.slugify() === header[i]);
            console.assert(shapeInfo !== undefined);
            if (shapeInfo.isText) {
              shapeInfo.shapeConfig.text = values[i];
            } else if (shapeInfo.isImage) {
                const image = await this.imageService.loadImage( values[i]);
                shapeInfo.shapeConfig = { image };
              // Get image form image gallery service
            } else if (shapeInfo.isButton) {
              shapeInfo.shapeConfig.text = values[i];
              shapeInfo.shapeConfig.textConfig.text = values[i];
            }
            const templateShape = templateDataset.find(s => s.userShapeName === shapeInfo.userShapeName);
            console.assert(templateShape !== undefined);
            if (templateShape.bannerShapeConfig) {
              shapeInfo.bannerShapeConfig = new Map<number, Konva.ShapeConfig>(templateShape.bannerShapeConfig);
            }

          }
          this.datasets.push(
            new Dataset(
              `Dataset #${++this.datasetCounter}`,
              this.datasets.length + 1,
              dataset,
            )
          );
          // this.datasets.set(, dataset);
        }

      };
      reader.readAsText(file, 'utf-8');
    }

  }

  public getTemplateDataset(): ShapeInformation[] {
    return this.template.shapes;
  }

  private parseCsvHeader(lines: string[], expectedHeaders: string[]): string[] {
    const header = [];
    for (const column of lines[0].split(';')) {
      if (column === '') {
        continue;
      } else if (!expectedHeaders.includes(column)) {
        throw new Error(`Unknown header \'${column}\' found in dataset!`);
      }
      header.push(column);
    }
    return header;
  }
}
