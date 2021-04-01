import { Injectable } from '@angular/core';
import Konva from 'konva';
import {Banner} from '@core/models/banner-layout';
import {ShapeInformation} from '@core/models/dataset';

@Injectable({
  providedIn: 'root'
})
export class TextDrawingService {

  constructor() { }

  public drawText(group: Konva.Group, banner: Banner, shape: ShapeInformation, conf: Konva.TextConfig, slug = null): Konva.Text {
    if (slug === null) {
      slug = shape.userShapeName.slugify();
    }
    let text = null;
    // Draw shape from saved config
    if (shape.bannerShapeConfig.has(banner.id)) {
      if (!shape.bannerShapeConfig.get(banner.id).shouldDraw) { return text; }
      text = new Konva.Text({ ...shape.bannerShapeConfig.get(banner.id), ...shape.shapeConfig});
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

  public updateText(textToUpdate: Konva.Text, group: Konva.Group, banner: Banner,
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
      return this.drawText(group, banner, shape, {...conf}, slug);
    } else if (textToUpdate) {
      // textShape.clearCache();
      textToUpdate.setAttrs(conf);
      textToUpdate.cache();
      shape.bannerShapeConfig.set(banner.id, textToUpdate.getAttrs());
    }
    return null;
  }
}
