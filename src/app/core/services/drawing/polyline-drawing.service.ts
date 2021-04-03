import { Injectable } from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {BannerDataService} from '@core/services/banner-data.service';
import {ShapeInformation} from '@core/models/dataset';
import Konva from 'konva';
import {ShapeFactoryService} from '@core/services/drawing/shape-factory.service';

type PairwiseCallback = (current: any, next: any, currentIndex?: number) => any;

@Injectable({
  providedIn: 'root'
})
export class PolylineDrawingService {

  readonly editPointConfig = {
    radius: 8,
    fill: '#fff',
    stroke: '#333',
    draggable: true,
    transformable: false,
  };

  constructor(
    private konvaService: KonvaService,
    private dataService: BannerDataService,
    private shapeFactory: ShapeFactoryService,
  ) {
    this.dataService.informationUpdated$.subscribe(updatedShapeName => {
      const shapeInfo = this.dataService.getActiveDataset().find(s => s.userShapeName === updatedShapeName);
      if ( !shapeInfo.isButton && !shapeInfo.isText && !shapeInfo.isButton) {
        this.drawShape(shapeInfo);
      }
    });

    this.konvaService.onContextMenu$.subscribe(ctxMenu => {
      if (ctxMenu.target.getParent() === this.konvaService.editGroup) {
        const editablePoly = this.konvaService.editGroup.getChildren(c => c.name() !== 'editPoint').toArray()[0];
        const pointerPosition = this.konvaService.getStage().getPointerPosition();
        const actions = [
          { name: 'Add point', action: () => this.addPointToPoly(editablePoly, pointerPosition)},
        ];
        if (ctxMenu.target.name() === 'editPoint') {
          actions.push({
            name: 'Remove point', action: () => this.removePointFromPoly(editablePoly as Konva.Line, ctxMenu.target as Konva.Circle),
          });
        }
        this.konvaService.displayContextMenu(pointerPosition, actions);
      }
    });
  }

  public static pairwise(arrayToPair: any[], callback: PairwiseCallback): void {
    if (arrayToPair.length % 2 !== 0) {
      throw new Error('Array length is not even!');
    }

    for (let i = 0; i < arrayToPair.length; i += 2) {
      callback(arrayToPair[i], arrayToPair[i + 1], i);
    }
  }

  public drawShape(shapeInfo: ShapeInformation): void {
    if (!shapeInfo.bannerShapeConfig) {
      shapeInfo.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }

    for (const [index, bannerGroup] of this.konvaService.getBannerGroups().entries()) {
      const shapeToDraw = this.shapeFactory.createShape(shapeInfo, {
        rect: {
          dblclick: (event) => this.rectToPolygon(event),
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


  private rectToPolygon(event): void {
    this.konvaService.getTransformer().nodes([]);
    const rect = event.target;
    const r = { x: rect.x(), y: rect.y(), w: rect.width(), h: rect.height() };
    const points = [r.x, r.y, r.x + r.w, r.y, r.x + r.w, r.y + r.h, r.x, r.y + r.h];
    this.konvaService.editGroup = new Konva.Group({name: 'edit-group', draggable: true, transformable: false});
    const polygon = new Konva.Line({
      name: event.target.name(),
      closed: true,
      fill: rect.fill(),
      draggable: false,
      stroke: rect.stroke(),
      transformable: false,
      points,
    });
    this.konvaService.editGroup.add(polygon);

    PolylineDrawingService.pairwise(polygon.points(), (cx, cy, pidx) => {
      const editPoint = new Konva.Circle({
        name: 'editPoint',
        pointIdx: pidx,
        x: cx,
        y: cy,
        ...this.editPointConfig,
      });
      this.editPointDragEvent(polygon, editPoint);
      this.konvaService.editGroup.add(editPoint);
    });


    event.target.getParent().add(this.konvaService.editGroup);
    event.target.destroy();
    this.konvaService.redraw();
  }

  public editPointDragEvent(polygon: Konva.Line, editPoint: Konva.Circle): void {
    editPoint.on('dragmove', () => {
      const polyPoints = polygon.points();
      const pidx = editPoint.getAttr('pointIdx');
      polyPoints[pidx] = editPoint.x();
      polyPoints[pidx + 1] = editPoint.y();
      this.konvaService.redraw();
    });
  }

  private removePointFromPoly(editablePoly: Konva.Line, point: Konva.Circle): void {
    const polyPoints = editablePoly.points();
    if (polyPoints.length > 6) {
      const pointIdx = point.getAttr('pointIdx');
      polyPoints.splice(pointIdx, 2);
      editablePoly.points(polyPoints);
      const allPoints = this.konvaService.editGroup.getChildren(c => c.name() === 'editPoint').toArray();
      allPoints.filter(p => p.getAttr('pointIdx') > pointIdx)
        .forEach(p => p.setAttr('pointIdx', p.getAttr('pointIdx') - 2));
      point.destroy();
    }
    this.konvaService.redraw();
  }

  private addPointToPoly(editablePoly: Konva.Node, pointerPosition: Konva.Vector2d): void {
    const relativePointerPosition = KonvaService.getRelativePointerPosition(this.konvaService.editGroup, pointerPosition);
    const polyPoints = (editablePoly as Konva.Line).points();
    polyPoints.push(relativePointerPosition.x, relativePointerPosition.y);
    const editPoint = new Konva.Circle({
      name: 'editPoint',
      x: relativePointerPosition.x,
      y: relativePointerPosition.y,
      pointIdx: polyPoints.length - 2, // length - 1 is Y coord, length - 2 is X coord
      ...this.editPointConfig,
    });
    this.editPointDragEvent(editablePoly as Konva.Line, editPoint);
    this.konvaService.editGroup.add(editPoint);
    this.konvaService.redraw();
  }
}
