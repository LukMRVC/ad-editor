import { Injectable } from '@angular/core';
import Konva from 'konva';
import {BehaviorSubject, Subject} from 'rxjs';
import {Banner} from '@core/models/banner-layout';
import {ImageGalleryService} from '@core/services/image-gallery.service';
import {Dataset, ShapeInformation} from '@core/models/dataset';
import {BannerService} from '@core/services/banner.service';
import {GoogleFontService} from '@core/services/google-font.service';

@Injectable({
  providedIn: 'root'
})
export class BannerDataService {

  constructor(
    private imageService: ImageGalleryService,
    private bannerService: BannerService,
    private fontService: GoogleFontService,
  ) {
    this.template = new Dataset('Template', null, this.createDataset());
    this.activeDataset = 'template';
  }

  userShapes: ShapeInformation[] = [];
  public datasetChanged$ = new Subject<string>();
  public informationUpdated$ = new Subject<string>();
  public banners$ = new BehaviorSubject<Banner[]>([]);

  public template: Dataset;

  public datasets: Dataset[] = [];
  private datasetCounter = 0;
  public activeDataset: string = null;
  private banners: Banner[] = [];

  private static parseCsvHeader(lines: string[], expectedHeaders: string[]): string[] {
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

  private createTemplateDatasetCopy(): ShapeInformation[] {
    const templateDeepShapesCopy = JSON.parse(JSON.stringify(this.template.shapes));
    this.restoreShapesAndLoadFonts(templateDeepShapesCopy);
    // for (const [index, shape] of templateDeepShapesCopy.entries()) {
    //   shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>(this.template.shapes[index].bannerShapeConfig.entries());
    // }
    return templateDeepShapesCopy;
  }

  public addDataset(): void {
    this.datasets.push(
      new Dataset(`Dataset #${++this.datasetCounter}`, this.datasets.length + 1, this.createDataset())
    );
    // this.datasets.set(`Dataset #${++this.datasetCounter}`, this.createDataset());
  }

  public setActiveDataset(setName: string): void {
    this.activeDataset = setName;
    this.datasetChanged$.next(setName);
  }

  public getActiveDataset(): ShapeInformation[] {
    if (this.activeDataset === 'template') {
      return this.template.shapes;
    }
    return this.datasets.find(dataset => dataset.datasetName === this.activeDataset)?.shapes ?? [];
  }

  public addShape(userShapeName: string, shapeType: 'text'|'image'|'rect'|'circle'): void {
    this.userShapes.push({
      userShapeName,
      shapeType,
      isText: shapeType === 'text',
      isImage: shapeType === 'image',
      shapeConfig: {
        text: shapeType === 'text' ? userShapeName : '',
      },
    });
    this.template.shapes.push({
      userShapeName,
      shapeType,
      isText: shapeType === 'text',
      isImage: shapeType === 'image',
      shapeConfig: {
        text: shapeType === 'text' ? userShapeName : '',
      },
    });
    for (const dataset of this.datasets) {
      dataset.shapes.push({
        userShapeName,
        shapeType,
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
      const loadedImage = this.imageService.loadImage(nextValue);
      loadedImage.then(image => {
        shapeInformation.shapeConfig = { image, imageSrc: nextValue };
        this.informationUpdated$.next(shapeInformation.userShapeName);
      });
    } else if (shapeInformation.isButton) {
      shapeInformation.shapeConfig.text = nextValue;
      this.informationUpdated$.next(shapeInformation.userShapeName);
    }
  }

  public getActiveBanners(): Banner[] {
    return this.banners;
  }

  public getBannerById(bannerId: number): Banner {
    return this.banners[bannerId];
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
        const header = BannerDataService.parseCsvHeader(lines, columns);

        const dataLines = lines.slice(1).filter(l => l != null && l !== '');
        const templateDataset = this.template.shapes as ShapeInformation[];
        // console.log(templateDataset);

        for (const line of dataLines) {
          const dataset = this.createTemplateDatasetCopy();
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

        }

      };
      reader.readAsText(file, 'utf-8');
    }

  }

  public getTemplateDataset(): ShapeInformation[] {
    return this.template.shapes;
  }

  removeDataset(datasetIndex: number): void {
    const datasetToRemove = this.datasets[datasetIndex];

    if (this.datasets.length - 1 === 0) {
      this.activeDataset = 'template';
    }

    if (this.activeDataset === datasetToRemove.datasetName) {
      if (this.datasets.length - 1 > 0) {
        this.activeDataset = this.datasets[(datasetIndex + 1) % this.datasets.length].datasetName;
      }
    }
    this.datasets.splice(datasetIndex, 1);

  }

  public serialized(): string {
    this.template.shapes.forEach(shape => {
      if (shape.bannerShapeConfig) {
        shape.serializedBannerShapeConfig = Array.from(shape.bannerShapeConfig.entries());
      }
    });

    this.datasets.forEach(dataset => {
      dataset.shapes.forEach(shape => {
        if (shape.bannerShapeConfig) {
          shape.serializedBannerShapeConfig = Array.from(shape.bannerShapeConfig.entries());
        }
      });
    });

    const datasets = {
      template: this.template,
      banners: this.banners$.value.map(banner => banner.layout),
      datasets: [...this.datasets],
      userShapes: [...this.userShapes],
    };
    return JSON.stringify(datasets);
  }

  private async restoreShapesAndLoadFonts(datasetToRestore: ShapeInformation[] = null): Promise<void> {
    let fontsToLoad = [];
    const restore = datasetToRestore === null ? this.template.shapes : datasetToRestore;
    for (const shape of restore) {
      let templateShape = null;
      if (datasetToRestore !== null) {
        templateShape = this.template.shapes.find(s => s.userShapeName === shape.userShapeName);
      }

      if (shape.isImage && shape.userShapeName.slugify() !== 'background') {
        if (shape.shapeConfig.imageSrc !== undefined && shape.shapeConfig.imageSrc !== null) {
          shape.shapeConfig.image = await this.imageService.loadImage(shape.shapeConfig.imageSrc);
        }
      }

      if ('fillPatternImageName' in shape.shapeConfig) {
        if (shape.shapeConfig.fillPatternImageName !== undefined && shape.shapeConfig.fillPatternImageName !== null) {
          shape.shapeConfig.fillPatternImage = await this.imageService.loadImage(shape.shapeConfig.fillPatternImageName);
        }
      }

      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>(
        shape.serializedBannerShapeConfig ?? templateShape?.bannerShapeConfig?.entries());
      if (shape.isText) {
        fontsToLoad = fontsToLoad.concat([...shape.bannerShapeConfig.values()].map(txtConfig => txtConfig.fontFamily));
      }
      if (shape.isButton) {
        const textCfgs = [...shape.bannerShapeConfig.values()].map(btnCfg => btnCfg.textConfig?.fontFamily);
        fontsToLoad = fontsToLoad.concat(textCfgs);
      }
    }

    fontsToLoad = fontsToLoad.filter( (val, index, self) => self.indexOf(val) === index );
    for (const fontFamily of fontsToLoad) {
      await this.fontService.loadFont(fontFamily);
    }

  }

  async import(fileContent: string): Promise<void> {
    const json = JSON.parse(fileContent);
    const banners = json.banners;
    this.template = json.template;
    await this.restoreShapesAndLoadFonts();
    this.datasets = json.datasets;
    for (const dataset of this.datasets) {
      for (const shape of dataset.shapes) {
        shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>(shape.serializedBannerShapeConfig ?? []);
      }
      await this.restoreShapesAndLoadFonts(dataset.shapes);
    }
    this.userShapes = json.userShapes;
    this.setBanners(this.bannerService.toInstances(banners, false));
    this.setActiveDataset('template');
  }
}
