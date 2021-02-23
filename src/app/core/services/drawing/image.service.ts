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
      const templateScale = this.dataService.getTemplateDataset().find(s => s.userShapeName.slugify() === conf.name);
      let { x: scaleX, y: scaleY } = banner.getScaleForLogo(logoDimensions);
      if (templateScale.bannerShapeConfig.get(banner.id)) {
        const templateScaleX = templateScale.bannerShapeConfig.get(banner.id).scaleX;
        // not like an actual target, but my goal
        const templateImgDimension = {
          width: templateScale.bannerShapeConfig.get(banner.id).image.width as number,
          height: templateScale.bannerShapeConfig.get(banner.id).image.height as number,
        };
        const currentImgAspectRatio = logoDimensions.height / logoDimensions.width;
        const targetWidth = templateImgDimension.width * templateScaleX;
        // Current image X scale
        scaleX = targetWidth / logoDimensions.width;
        // Now get current image Y scale
        const desiredWidth = logoDimensions.width * scaleX;
        const desiredHeight = currentImgAspectRatio * desiredWidth;
        scaleY = desiredHeight / logoDimensions.height;

      }

      const logos = bannerGroup.getChildren(children => children.name() === conf.name);
      logos.each(logo => logo.destroy());
      const percentages = {x: 0, y: 0};

      if (templateScale.bannerShapeConfig.has(banner.id) && templateScale.bannerShapeConfig.get(banner.id).percentagePositions) {
        percentages.x = templateScale.bannerShapeConfig.get(banner.id).percentagePositions.x;
        percentages.y = templateScale.bannerShapeConfig.get(banner.id).percentagePositions.y;
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