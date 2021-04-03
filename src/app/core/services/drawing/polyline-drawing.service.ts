import { Injectable } from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {BannerDataService} from '@core/services/banner-data.service';
import {ShapeInformation} from '@core/models/dataset';
import Konva from 'konva';
import {ShapeFactoryService} from '@core/services/drawing/shape-factory.service';

@Injectable({
  providedIn: 'root'
})
export class PolylineDrawingService {

  constructor(
    private konvaService: KonvaService,
    private dataService: BannerDataService,
    private shapeFactory: ShapeFactoryService,
  ) { }

  public drawShape(shapeInfo: ShapeInformation): void {
    if (!shapeInfo.bannerShapeConfig) {
      shapeInfo.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }

    for (const [index, bannerGroup] of this.konvaService.getBannerGroups().entries()) {
      const shapeToDraw = this.shapeFactory.createShape(shapeInfo, {
        rect: {
          dblclick: (event) => this.rect2poly(event),
        },
      });

      if (shapeInfo.bannerShapeConfig.has(index)) {
        const savedData = shapeInfo.bannerShapeConfig.get(index);
        if ( !savedData.shoulDraw) { return; }
        shapeToDraw.setAttrs(savedData);
      } else {
        const { x: offsetX, y: offsetY } = bannerGroup.clip();
        shapeInfo.bannerShapeConfig.set(index, shapeToDraw.getAttrs());
        shapeToDraw.x( shapeToDraw.x() + offsetX );
        shapeToDraw.y( shapeToDraw.y() + offsetY );
      }
      shapeToDraw.on('dragmove', (dragging) =>
        this.konvaService.moveAllRelatives(dragging, index, shapeInfo.userShapeName.slugify()));
      shapeToDraw.on('transformend', (endedTransform) =>
        this.konvaService.transformRelatives(endedTransform, index, shapeInfo.userShapeName.slugify()));
      bannerGroup.add(shapeToDraw);
    }
    this.konvaService.redraw();
  }


  private rect2poly(event): void {
    this.konvaService.getTransformer().nodes([]);
    const rect = event.target;
    const r = { x: rect.x(), y: rect.y(), w: rect.width(), h: rect.height() };
    const points = [r.x, r.y, r.x + r.w, r.y, r.x + r.w, r.y + r.h, r.x, r.y + r.h];
    this.konvaService.editGroup = new Konva.Group({ draggable: true, transformable: false, });
    const polygon = new Konva.Line({
      closed: true,
      fill: rect.fill(),
      draggable: false,
      stroke: rect.stroke(),
      transformable: false,
      points,
    });
    this.konvaService.editGroup.add(polygon);

    const pairwise = (arr: any[], func) => {
      if (arr.length % 2 !== 0) {
        throw new Error('Number of elements in array is not even');
      }
      for (let i = 0; i < arr.length; i += 2) {
        func(arr[i], arr[i + 1], i);
      }
    };

    pairwise(polygon.points(), (cx, cy, pidx) => {
      const editPoint = new Konva.Circle({
        name: 'editPoint',
        x: cx,
        y: cy,
        radius: 8,
        fill: '#fff',
        stroke: '#333',
        draggable: true,
        transformable: false,
      });
      editPoint.on('dragmove', () => {
        const polyPoints = polygon.points();
        polyPoints[pidx] = editPoint.x();
        polyPoints[pidx + 1] = editPoint.y();
        this.konvaService.redraw();
      });
      this.konvaService.editGroup.add(editPoint);
    });


    event.target.getParent().add(this.konvaService.editGroup);
    this.konvaService.redraw();
  }
}
