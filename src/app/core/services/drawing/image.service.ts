import { Injectable } from '@angular/core';
import Konva from 'konva';
import {Banner} from '@core/models/banner-layout';
import {BannerDataService, ShapeInformation} from '@core/services/banner-data.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(
    private dataService: BannerDataService
  ) { }

  public drawImage(bannerGroup: Konva.Group, banner: Banner, shapeData: ShapeInformation, conf: Konva.ImageConfig): Konva.Image {
    let konvaImage = null;
    if (shapeData.bannerShapeConfig.has(banner.id)
      && (shapeData.bannerShapeConfig.get(banner.id) as Konva.ImageConfig).image === conf.image) {
      if (!shapeData.bannerShapeConfig.get(banner.id).shouldDraw) {
        return null;
      }
      konvaImage = new Konva.Image(shapeData.bannerShapeConfig.get(banner.id) as Konva.ImageConfig);
    } else {
      const logoDimensions = {width: conf.image.width as number, height: conf.image.height as number};
      // TODO: Get template scaling and apply, if image is outside banner move it, if is bigger, get default scale
      const templateScale = this.dataService.getTemplateDataset().find(s => s.userShapeName.slugify() === conf.name);

      if (templateScale.bannerShapeConfig.get(banner.id)) {
        // const {x: scaleX, y: scaleY} = templateScale.bannerShapeConfig.get(banner.id).scale;
        const scaleX2 = templateScale.bannerShapeConfig.get(banner.id).scaleX;
        const scaleY2 = templateScale.bannerShapeConfig.get(banner.id).scaleY;
        // TODO: it is not the scale that i need, i need the final width and height (=width() * scaleX(), ...)

      }

      const { x: scaleX, y: scaleY } = banner.getScaleForLogo(logoDimensions);
      const logos = bannerGroup.getChildren(children => children.name() === conf.name);
      logos.each(logo => logo.destroy());
      const percentages = {x: 0, y: 0};

      if (shapeData.bannerShapeConfig.has(banner.id) && shapeData.bannerShapeConfig.get(banner.id).percentagePositions) {
        percentages.x = shapeData.bannerShapeConfig.get(banner.id).percentagePositions.x;
        percentages.y = shapeData.bannerShapeConfig.get(banner.id).percentagePositions.y;
      }

      const {x, y} = banner.getPixelPositionFromPercentage(percentages, logoDimensions, {scaleX, scaleY});

      const offsetX = bannerGroup.clipX();
      const offsetY = bannerGroup.clipY();
      konvaImage = new Konva.Image({x: x + offsetX, y: y + offsetY, scaleX, scaleY, ...conf});
      konvaImage.draggable(true);
      // console.log(`For ${bannerGroup.id()} computed X: ${image.x()} and Y: ${image.y()}`);
      konvaImage.setAttr('shouldDraw', true);
    }
    konvaImage.cache();
    bannerGroup.add(konvaImage);
    return konvaImage;
  }

}
