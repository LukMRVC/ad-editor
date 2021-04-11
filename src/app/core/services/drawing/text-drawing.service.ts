import { Injectable } from '@angular/core';
import Konva from 'konva';
import {Banner} from '@core/models/banner-layout';
import {ShapeInformation} from '@core/models/dataset';
import {KonvaService} from '@core/services/konva.service';
import {BannerDataService} from '@core/services/banner-data.service';

@Injectable({
  providedIn: 'root'
})
export class TextDrawingService {

  constructor(
    private dataService: BannerDataService,
    private konvaService: KonvaService,
  ) {
    this.dataService.datasetChanged$.subscribe(() => {
      const allTexts = this.dataService.getActiveDataset().filter(shape => shape.isText);
      for (const text of allTexts) {
        this.drawText(text.userShapeName.slugify(), text.shapeConfig);
      }
    });

    this.dataService.informationUpdated$.subscribe(shapeName => {
      const textShape = this.dataService.getActiveDataset().find(s => s.userShapeName === shapeName);
      if (textShape.isText) {
        this.updateText(shapeName.slugify(), textShape.shapeConfig);
      }
    });
  }

  private static createText(group: Konva.Group, banner: Banner, shape: ShapeInformation, conf: Konva.TextConfig, slug = null): Konva.Text {
    if (slug === null) {
      slug = shape.userShapeName.slugify();
    }
    let text = null;
    // Draw shape from saved config
    if (shape.bannerShapeConfig.has(banner.id)) {
      if (!shape.bannerShapeConfig.get(banner.id).shouldDraw) { return text; }
      text = new Konva.Text({ ...shape.bannerShapeConfig.get(banner.id), ...shape.shapeConfig, });
    } else {
      const dimensions = { width: banner.layout.dimensions.width, height: null };
      conf.width =  banner.layout.dimensions.width;
      conf.fontSize = banner.layout.headlineFontSize;
      conf.shadowEnabled = false;
      conf.draggable = true;
      const { x, y } = banner.getPixelPositionFromPercentage(banner.layout.headlinePosition, dimensions);
      const {x: offsetX, y: offsetY} = group.clip();
      const scaleX = 1;
      const scaleY = 1;
      text = new Konva.Text({ name: slug, x: x + offsetX, y: y + offsetY, scaleX, scaleY, ...conf });
      text.setAttr('initialFontSize', conf.fontSize);
      text.setAttr('shouldDraw', true);
      shape.bannerShapeConfig.set(banner.id, text.getAttrs());
    }
    group.add(text);
    return text;
  }

  private static editText(textToUpdate: Konva.Text, group: Konva.Group, banner: Banner,
                          shape: ShapeInformation, conf: Konva.TextConfig, slug = null): Konva.Text {
    if (slug === null) {
      slug = shape.userShapeName.slugify();
    }

    const shouldDraw = shape.bannerShapeConfig?.get(banner.id)?.shouldDraw ?? true;
    if ('fontScaling' in conf) {
      conf.fontSize = (group.findOne(`.${slug}`) as Konva.Text).getAttr('initialFontSize');
      conf.fontSize *= 1 + (conf.fontScaling / 10);
    }

    if ( !textToUpdate && shouldDraw) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
      return TextDrawingService.createText(group, banner, shape, {...conf}, slug);
    } else if (textToUpdate) {
      textToUpdate.setAttrs(conf);
      if (textToUpdate.isCached()) {
        textToUpdate.cache();
      }
      shape.bannerShapeConfig.set(banner.id, textToUpdate.getAttrs());
    }
    return null;
  }

  public drawText(slugifiedShapeName: string, conf: Konva.TextConfig = {}): void {
    const shape = this.dataService.getActiveDataset().find(s => s.userShapeName.slugify() === slugifiedShapeName);
    if (!shape.bannerShapeConfig) {
      shape.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    for (const [index, bannerGroup] of this.konvaService.getBannerGroups().entries()) {
      const banner = this.dataService.getBannerById(index);
      const text = TextDrawingService.createText(bannerGroup, banner, shape, conf);
      if (text !== null) {
        this.bindTextEvents(text, index, slugifiedShapeName);
      }
    }
    this.konvaService.redraw();
  }

  private bindTextEvents(text: Konva.Text, index: number, slugifiedShapeName: string): void {
    text.on('dragmove', (dragging) => this.konvaService.moveAllRelatives(dragging, index, slugifiedShapeName));
    text.on('transform', (transform) => {
      for (const relativeBannerGroup of this.konvaService.getBannerGroups()) {
        const relativeText = relativeBannerGroup.findOne(`.${slugifiedShapeName}`);
        if (!this.konvaService.shouldTransformRelatives) {
          if (relativeText !== transform.target) {
            continue;
          }
        }
        relativeText.setAttrs({
          // the Text width should never be bigger than its parent group so we do Math.min
          width: Math.min(Math.max( text.width() * text.scaleX(), 50), relativeBannerGroup.width()),
          scaleX: 1,
        });
        relativeText.cache();
      }
    });
  }

  public updateText(slugifiedShapeName: string, attributes: Konva.TextConfig): void {
    const shape = this.dataService.getActiveDataset().find(s => s.userShapeName.slugify() === slugifiedShapeName);
    // console.log(shape);
    if ( !shape) {
      return;
    }
    // if ('text' in attributes) {
    //   shape.shapeConfig.text = attributes.text;
    // }
    const textsToUpdate = this.konvaService.shouldTransformRelatives
      ? [] : this.konvaService.getTransformer().nodes().filter(s => s.name() === slugifiedShapeName);

    for (const [index, bannerGroup] of this.konvaService.getBannerGroups().entries()) {
      let textShape = bannerGroup.findOne(`.${slugifiedShapeName}`);
      if (textsToUpdate.length) {
        if (!textsToUpdate.includes(textShape)) {
          continue;
        }
      }
      const banner = this.dataService.getBannerById(index);
      const text = TextDrawingService.editText(textShape as Konva.Text, bannerGroup, banner, shape, attributes, slugifiedShapeName);
      if (text !== null) {
        this.bindTextEvents(text, index, slugifiedShapeName);
        textShape = text;
      }
      if ((textShape as Konva.Text).shadowEnabled()) {
        textShape.cache();
      } else if (textShape.isCached()) {
        textShape.clearCache();
      }

    }
    this.konvaService.redraw();
  }

}
