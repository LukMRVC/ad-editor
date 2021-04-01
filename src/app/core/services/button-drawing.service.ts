import { Injectable } from '@angular/core';
import Konva from 'konva';
import {Banner} from '@core/models/banner-layout';
import {ShapeInformation} from '@core/models/dataset';

@Injectable({
  providedIn: 'root'
})
export class ButtonDrawingService {

  constructor() { }

  private createButton(conf: Konva.ShapeConfig, tagConfig = {}, textConfig = {}): Konva.Label {
    const button = new Konva.Label({
      name: 'button',
      x: conf.x,
      y: conf.y,
      opacity: 1,
      draggable: true,
      transformable: true,
    });

    button.add(new Konva.Tag({
      name: 'button-tag',
      fill: 'red',
      lineJoin: 'round',
      cornerRadius: 0,
      shadowEnabled: false,
      shadowBlur: 5,
      shadowColor: '#000',
      hitStrokeWidth: 0,
      shadowForStrokeEnabled: false,
      ...tagConfig,
    }));

    button.add(new Konva.Text({
      name: 'button-text',
      text: 'Button 1',
      fontFamily: 'Calibri',
      fontSize: 16,
      initialFontSize: 16,
      padding: 5,
      align: 'center',
      verticalAlign: 'middle',
      fill: 'white',
      transformable: true,
      ...textConfig,
    }));

    return button;
  }

  public drawButton(group: Konva.Group, banner: Banner, shape: ShapeInformation, configs, slug = null): Konva.Label {
    if (slug === null) {
      slug = shape.userShapeName.slugify();
    }
    let button = null;
    if (shape.bannerShapeConfig.has(banner.id)) {
      const savedData = shape.bannerShapeConfig.get(banner.id);
      if (!savedData.shouldDraw) { return null; }
      // console.log('Recovering button from', savedData);
      button = this.createButton( savedData.labelConfig, savedData.tagConfig, savedData.textConfig );
    } else {
      const dimensions = { width: banner.layout.dimensions.width / 3, height: banner.layout.dimensions.height / 5 };
      const {x, y} = banner.getPixelPositionFromPercentage(banner.layout.buttonPosition, dimensions);
      const offsetX = group.clipX();
      const offsetY = group.clipY();
      button = this.createButton(
        { x: x + offsetX, y: y + offsetY, ...configs.labelConfig },
        {...configs.tagConfig},
        {...configs.textConfig}
        );
      const tag = button.findOne('.button-tag');
      const text = button.findOne('.button-text');
      shape.bannerShapeConfig.set(banner.id, { shouldDraw: true, labelConfig: button.getAttrs(),
        tagConfig: tag.getAttrs(), textConfig: text.getAttrs() });
    }
    group.add(button);
    return button;
  }

  public updateButton(
    changeOf: 'style'|'text',
    btn: Konva.Label,
    config: Konva.TagConfig|Konva.TextConfig,
    group: Konva.Group,
    banner: Banner,
    shape: ShapeInformation): Konva.Label {

    if (changeOf === 'style') {
        const tag = group.findOne('.button-tag');
        const shouldDraw = shape.bannerShapeConfig?.get(banner.id)?.shouldDraw ?? true;
        if (!tag) {
          if (shouldDraw) {
            return this.drawButton(group, banner, shape, {tagConfig: config});
          }
          return;
        }
        tag.setAttrs(config);
        const btnSavedCfg = shape.bannerShapeConfig.get(banner.id);
        btnSavedCfg.tagConfig = tag.getAttrs();
        tag.cache();
    } else {
      const tag = group.findOne('.button-tag');
      const text = group.findOne('.button-text');
      // const tag = bannerGroup.group.findOne('.button-tag');
      const shouldDraw = shape.bannerShapeConfig?.get(banner.id)?.shouldDraw ?? true;
      if (!text) {
        if (shouldDraw) {
          return this.drawButton(group, banner, shape, {textConfig: config});
        }
        return null;
      }

      if ('fontScaling' in config) {
        config.fontSize = text.getAttr('initialFontSize');
        config.fontSize *= 1 + (config.fontScaling / 10);
      }
      text.setAttrs(config);
      const btnSavedCfg = shape.bannerShapeConfig.get(banner.id);
      btnSavedCfg.textConfig = text.getAttrs();
      tag.cache();
    }
    return null;
  }
}
