import { Injectable } from '@angular/core';
import Konva from 'konva';
import {BehaviorSubject, Subject} from 'rxjs';
import {Banner} from '@core/models/banner-layout';
import {ImageGalleryService} from '@core/services/image-gallery.service';
import {Dataset, ShapeInformation} from '@core/models/dataset';
import {BannerService} from '@core/services/banner.service';
import {GoogleFontService} from '@core/services/google-font.service';
import {UnknownColumnError} from '@core/unknown-column-error';

@Injectable({
  providedIn: 'root'
})
export class BannerDataService {
  private startZIndex = 3;

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
  public shapeDeleted$ = new Subject<string>();
  public banners$ = new BehaviorSubject<Banner[]>([]);
  public forceRedraw$ = new Subject<boolean>();

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
        throw new UnknownColumnError();
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
          zIndex: 5,
          draggable: true,
        },
      },
      {
        userShapeName: 'Headline',
        isText: true,
        shapeConfig: {
          zIndex: 4,
          text: '',
        },
      },
      {
        userShapeName: 'Background',
        isImage: true,
        shapeConfig: {
          zIndex: 1,
        },
      },
      {
        userShapeName: 'Button',
        isButton: true,
        shapeConfig: {
          text: '',
          zIndex: 3,
          textConfig: {},
        },
      }
    ];
    return datasetShapes.concat( JSON.parse(JSON.stringify(this.userShapes)) );
  }

  private async createTemplateDatasetCopy(): Promise<ShapeInformation[]> {
    const templateDeepShapesCopy = JSON.parse(JSON.stringify(this.template.shapes));
    await this.restoreShapesAndLoadFonts(templateDeepShapesCopy);
    return templateDeepShapesCopy;
  }

  public addDataset(): void {
    this.datasets.push(
      new Dataset(`Dataset #${++this.datasetCounter}`, this.datasets.length + 1, this.createDataset())
    );
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
    const zIndex = this.getActiveDataset().length + 2;
    this.userShapes.push({
      userShapeName,
      shapeType,
      isText: shapeType === 'text',
      isImage: shapeType === 'image',
      shapeConfig: {
        zIndex,
      },
    });
    this.template.shapes.push({
      userShapeName,
      shapeType,
      isText: shapeType === 'text',
      isImage: shapeType === 'image',
      shapeConfig: {
        zIndex,
      },
    });
    for (const dataset of this.datasets) {
      dataset.shapes.push({
        userShapeName,
        shapeType,
        isText: shapeType === 'text',
        isImage: shapeType === 'image',
        shapeConfig: {
          zIndex,
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
      shapeInformation.shapeConfig = { ...shapeInformation.shapeConfig, text: nextValue };
      this.informationUpdated$.next(shapeInformation.userShapeName);
    } else if (shapeInformation.isImage) {
      const loadedImage = this.imageService.loadImage(nextValue);
      loadedImage.then(image => {
        shapeInformation.shapeConfig = { ...shapeInformation.shapeConfig, image, imageSrc: nextValue };
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
        // console.log(templateDataset);

        for (const line of dataLines) {
          const dataset = await this.createTemplateDatasetCopy();
          const values = line.split(';');
          for (let i = 0; i < header.length; ++i) {
            const shapeInfo = dataset.find(s => s.userShapeName.slugify() === header[i]);
            console.assert(shapeInfo !== undefined);
            console.assert(shapeInfo.bannerShapeConfig);
            if (shapeInfo.isText) {
              shapeInfo.shapeConfig.text = values[i];
              if (shapeInfo.bannerShapeConfig) {
                for (const configs of shapeInfo.bannerShapeConfig.values()) {
                  configs.text = values[i];
                }
              }

            } else if (shapeInfo.isImage) {
                const image = await this.imageService.loadImage( values[i]);
                shapeInfo.shapeConfig = { image };
              // Get image form image gallery service
            } else if (shapeInfo.isButton) {
              shapeInfo.shapeConfig.text = values[i];
              shapeInfo.shapeConfig.textConfig.text = values[i];
              if (shapeInfo.bannerShapeConfig) {
                for (const configs of shapeInfo.bannerShapeConfig.values()) {
                  configs.textConfig.text = values[i];
                }
              }
            }

          }
          // console.log(dataset);
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

  public removeUserShape(shapeInfo: ShapeInformation): void {
    const idx = this.userShapes.findIndex(s => s.userShapeName === shapeInfo.userShapeName);
    this.userShapes.splice(idx, 1);
    if (this.activeDataset === 'template') {
      const datasetIdx = this.template.shapes.findIndex(s => s.userShapeName === shapeInfo.userShapeName);
      this.template.shapes.splice(datasetIdx, 1);
      for (const dataset of this.datasets) {
        dataset.shapes.splice(datasetIdx, 1);
      }
    } else {
      const datasetIdx = this.getActiveDataset().findIndex(s => s.userShapeName === shapeInfo.userShapeName);
      this.getActiveDataset().splice(datasetIdx, 1);
    }
    this.shapeDeleted$.next(shapeInfo.userShapeName);
  }

  public serialized(): string {
    this.template.shapes.forEach(shape => {
      // console.log(shape.bannerShapeConfig.get(0));
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
    restore.forEach( (shapeInfo, index) => shapeInfo.ordering = index );
    restore.sort( (a, b) => a.ordering - b.ordering );
    let zIndexCounter = this.startZIndex;
    for (const shape of restore) {
      let templateShape = null;
      if (datasetToRestore) {
        templateShape = this.template.shapes.find(s => s.userShapeName === shape.userShapeName);
      }

      if ('imageSrc' in shape.shapeConfig && shape.userShapeName !== 'background') {
        if (shape.shapeConfig.imageSrc) {
          shape.shapeConfig.image = await this.imageService.loadImage(shape.shapeConfig.imageSrc);
          restore.sort( (a, b) => a.ordering - b.ordering );
        }
      }
      if ('fillPatternImageName' in shape.shapeConfig) {
        if (shape.shapeConfig.fillPatternImageName) {
          shape.shapeConfig.fillPatternImage = await this.imageService.loadImage(shape.shapeConfig.fillPatternImageName);
          restore.sort( (a, b) => a.ordering - b.ordering );
        }
      }

      const templateDeepCopy = JSON.parse(JSON.stringify(Array.from(templateShape?.bannerShapeConfig?.entries() ?? [])));
      shape.bannerShapeConfig =
        new Map<number, Konva.ShapeConfig>(shape.serializedBannerShapeConfig ?? templateDeepCopy);
      if (shape.isText) {
        fontsToLoad = fontsToLoad.concat([...shape.bannerShapeConfig.values()].map(txtConfig => txtConfig.fontFamily));
      }
      if (shape.isButton) {
        const textCfgs = [...shape.bannerShapeConfig.values()].map(btnCfg => btnCfg.textConfig?.fontFamily);
        fontsToLoad = fontsToLoad.concat(textCfgs);
      }
      shape.shapeConfig.zIndex = zIndexCounter++;
      if (shape.userShapeName.slugify() === 'background') {
        shape.shapeConfig.zIndex = 1;
        // decrement counter so not "hole" is in between
        zIndexCounter--;
      }
    }
    fontsToLoad = fontsToLoad.filter( (val, index, self) => self.indexOf(val) === index ).filter(val => !!val);
    const calibriIndex = fontsToLoad.indexOf('Calibri');
    if (calibriIndex !== -1) {
      fontsToLoad.splice(calibriIndex, 1);
    }

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

  swapZIndexes(plusOrMinus: number, shapeInfo: ShapeInformation): void {
    const dataset = this.getActiveDataset();
    const currentZIndex = shapeInfo.shapeConfig.zIndex;
    const targetZIndex = currentZIndex + plusOrMinus;
    // the number 2 is to make space for background and banner label
    if (targetZIndex > (dataset.length + 1) || targetZIndex <= 2) {
      return;
    }
    const next = dataset.find(s => s.shapeConfig.zIndex === targetZIndex);

    shapeInfo.shapeConfig.zIndex = targetZIndex;
    next.shapeConfig.zIndex = currentZIndex;
    this.forceRedraw$.next(true);
  }
}
