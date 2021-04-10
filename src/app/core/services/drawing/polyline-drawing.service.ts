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
    this.dataService.datasetChanged$.subscribe(() => {
      const shapes = this.dataService.getActiveDataset().filter(s => !s.isText && !s.isButton && !s.isImage);
      for (const shape of shapes) {
        this.drawShape(shape);
      }
    });

    this.konvaService.onClickTap$.subscribe(ev => {
      if (this.konvaService.editGroup !== null && ev.target.getParent() !== this.konvaService.editGroup) {
        this.konvaService.editGroup.getChildren(c => c.name() === 'editPoint').each(c => c.destroy());
        const editedPoly = this.konvaService.editGroup.getChildren().toArray()[0];
        editedPoly.moveTo(this.konvaService.editGroup.getParent());
        for (const group of this.konvaService.getBannerGroups()) {
          const shape = group.findOne(`.${editedPoly.name()}`);
          shape.setAttr('draggable', true);
          shape.setAttr('transformable', true);
        }

        this.konvaService.editGroup.destroy();
        this.konvaService.editGroup = null;
        this.konvaService.redraw();
      }
    });

    this.dataService.informationUpdated$.subscribe(updatedShapeName => {
      const shapeInfo = this.dataService.getActiveDataset().find(s => s.userShapeName === updatedShapeName);
      if ( !shapeInfo.isButton && !shapeInfo.isText && !shapeInfo.isImage) {
        this.drawShape(shapeInfo);
      }
    });

    this.konvaService.onContextMenu$.subscribe(ctxMenu => {
      if (this.konvaService.editGroup !== null && ctxMenu.target.getParent() === this.konvaService.editGroup) {
        const editablePoly = this.konvaService.editGroup.getChildren(c => c.name() !== 'editPoint').toArray()[0];
        let pointerPosition = this.konvaService.getStage().getPointerPosition();
        console.log('Normal PP', pointerPosition);
        const actions = [
          { name: 'Add point', action: () => this.addPointToPoly(editablePoly, pointerPosition)},
        ];
        if (ctxMenu.target.name() === 'editPoint') {
          actions.push({
            name: 'Remove point', action: () => this.removePointFromPoly(editablePoly as Konva.Line, ctxMenu.target as Konva.Circle),
          });
        }
        // pointerPosition = KonvaService.getRelativePointerPosition(this.konvaService.editGroup);
        // console.log('Relative PP', pointerPosition);
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

  public static getRectPoints(rect: Konva.Rect): number[] {
    return [rect.x(), rect.y(), rect.x(), rect.y() + rect.height(),
      rect.x() + rect.width(), rect.y() + rect.height(), rect.x() + rect.width(), rect.y()];
  }

  public drawShape(shapeInfo: ShapeInformation): void {
    if (!shapeInfo.bannerShapeConfig) {
      shapeInfo.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }

    for (const [index, bannerGroup] of this.konvaService.getBannerGroups().entries()) {
      const shapeToDraw = this.shapeFactory.createShape(shapeInfo, {
        rect: {
          dblclick: (event) => this.makeEditablePolygon(event),
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
      shapeToDraw.on('transform', () => {


      });
      shapeToDraw.on('transformend', (endedTransform) =>
        this.konvaService.transformRelatives(endedTransform, index, shapeInfo.userShapeName.slugify()));
      bannerGroup.add(shapeToDraw);
    }
    this.konvaService.redraw();
  }


  private makeEditablePolygon(event): void {
    this.konvaService.getTransformer().nodes([]);
    const target = event.target;
    // TODO: When making editable second time, points are on same position after moving the line
    this.konvaService.editGroup = new Konva.Group({
      name: 'editGroup',
      draggable: false,
      transformable: false
    });
    for (const group of this.konvaService.getBannerGroups()) {
      const shape = group.findOne(`.${target.name()}`);
      if ( !(shape.getAttr('shouldDraw') ?? true)) {
        continue;
      }
      let points = [];
      if ('points' in shape) {
        points = (shape as Konva.Line).points();
      } else if (shape.getClassName().toLowerCase() === 'rect') {
        points = PolylineDrawingService.getRectPoints(shape as Konva.Rect);
      }

      const polygon = new Konva.Line({
        name: event.target.name(),
        closed: true,
        fill: (shape as Konva.Shape).fill(),
        draggable: false,
        stroke: (shape as Konva.Shape).stroke(),
        transformable: false,
        points,
      });

      polygon.on('dragmove', (drag) =>
        this.konvaService.moveAllRelatives(drag, group.getAttr('bannerId'), polygon.name()));
      polygon.on('transformend', (ev) =>
       this.konvaService.transformRelatives(ev, polygon.getParent().getAttr('bannerId'), polygon.name()));
      polygon.on('dblclick', ev => this.makeEditablePolygon(ev));

      if (shape === event.target) {
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
      } else {
        group.add(polygon);
        shape.destroy();
      }

    }

    event.target.getParent().add(this.konvaService.editGroup);
    event.target.destroy();
    this.konvaService.redraw();
  }

  public editPointDragEvent(polygon: Konva.Line, editPoint: Konva.Circle): void {
    editPoint.on('dragmove', (drag) => {
      const pidx = editPoint.getAttr('pointIdx');
      const mainGroup = polygon.findAncestor('.banner-group');
      const percentage = this.konvaService.getShapeCenterPercentageInBannerFromEvent(drag, mainGroup.getAttr('bannerId'));


      for (const group of this.konvaService.getBannerGroups()) {
        if ( !this.konvaService.shouldTransformRelatives && mainGroup !== group) {
          continue;
        }
        const groupPolygon = group.findOne(`.${polygon.name()}`) as Konva.Line;
        const dim = {width: group.width(), height: group.height()};
        const pixelPos = KonvaService.getPointPixelPositionFromPercentage(percentage, dim);
        const polyPoints = groupPolygon.points();
        polyPoints[pidx] = pixelPos.x + group.clipX();
        polyPoints[pidx + 1] = pixelPos.y + group.clipY();
      }
      this.konvaService.redraw();

    });
  }

  private removePointFromPoly(editablePoly: Konva.Line, point: Konva.Circle): void {
    const polyPoints = editablePoly.points();
    if (polyPoints.length > 6) {
      const pointIdx = point.getAttr('pointIdx');
      polyPoints.splice(pointIdx, 2);
      editablePoly.points(polyPoints);
      for (const group of this.konvaService.getBannerGroups()) {
        const polygon = group.findOne(`.${editablePoly.name()}`) as Konva.Line;
        if (polygon === editablePoly) {
          continue;
        }
        const polygonPoints = polygon.points();
        polygonPoints.splice(pointIdx, 2);
        polygon.points(polygonPoints);
      }
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
