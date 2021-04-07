import {EventEmitter, Injectable} from '@angular/core';
import Konva from 'konva';
import {StageConfig} from 'konva/types/Stage';
import {Banner, Dimension2D, Point2D} from '@core/models/banner-layout';
import {FilterChangedEvent} from '../../editor/components/image-filter.component';
import {BannerDataService} from '@core/services/banner-data.service';
import {ShapeInformation} from '@core/models/dataset';
import {PolylineDrawingService} from '@core/services/drawing/polyline-drawing.service';

// TODO: stylizace banneru
// TODO: Sablony banneru a tlacitek
// TODO: Hotove bannery dat do bakalarky
// TODO: Vyresit texty
// TODO: Vice banneru
// TODO: Undo/Redo
// TODO: Groupovani
@Injectable({
  providedIn: 'root',
})
export class KonvaService {

  constructor(
    public dataService: BannerDataService,
  ) {
    this.shapes = this.dataService.getActiveDataset();

    this.dataService.datasetChanged$.subscribe(() => {
      this.shapes = this.dataService.getActiveDataset();
      this.transformer.nodes([]);
      this.clearBanners();
      const bannerBg = this.shapes.find(s => s.userShapeName.slugify() === 'background');
      this.updateBackgroundOfShape(bannerBg.shapeConfig, 'background', true);
    });

    this.dataService.banners$.subscribe(newBanners => {
      this.banners = newBanners;
      this.shapes = this.dataService.getActiveDataset();
      this.drawBanners();
    });

    this.dataService.informationUpdated$.subscribe(updatedShapeName => {
      this.shapes = this.dataService.getActiveDataset();
      const updatedShape = this.shapes.find(s => s.userShapeName === updatedShapeName);
      // if (updatedShape.isImage && updatedShapeName.slugify() === 'background') {
      //   this.drawBackground(updatedShape.shapeConfig as Konva.ImageConfig);
      // }
    });
  }

  private stage: Konva.Stage = null;
  private layer: Konva.Layer = null;
  private transformer: Konva.Transformer = null;
  private shapes: ShapeInformation[] = [];
  private banners: Banner[];
  private bannerGroups: Konva.Group[] = [];

  public editGroup: Konva.Group = null;

  // for components to display context menu
  public displayContextMenuEvent$ = new EventEmitter<{ pos: Point2D, actions: {name: string, action: any}[]}>();
  public onClickTap$: EventEmitter<Konva.KonvaEventObject<MouseEvent>> = new EventEmitter<Konva.KonvaEventObject<MouseEvent>>();
  // for drawing services
  public onContextMenu$: EventEmitter<Konva.KonvaEventObject<MouseEvent>> = new EventEmitter<Konva.KonvaEventObject<MouseEvent>>();
  public selectedNodes: Konva.Shape[] = [];
  public shouldTransformRelatives = true;

  public static mergeConfig(name: string, id: string, conf: object): any {
    return { ...{name, id}, ...conf };
  }

  public static bannerLabel(position: Point2D, text: string): Konva.Label {
    const label = new Konva.Label({
      y: position.y,
      opacity: 0.75,
      transformable: false,
    });

    label.add(new Konva.Tag({
      fill: '#fcfcfc',
      cornerRadius: 5,
      lineJoin: 'round',
      transformable: false,
    }));

    label.add(new Konva.Text({
      text,
      fontFamily: 'Arial',
      fontSize: 15,
      padding: 5,
      fill: 'black',
      transformable: false,
    }));

    return label;
}

  public static isRadiiBasedShape(shapeClassName): boolean {
    return ['circle', 'wedge', 'arc', 'donut', 'regularpolygon', 'star'].includes(shapeClassName.toLowerCase());
  }

  public static getRelativePointerPosition(node: Konva.Node, position: Konva.Vector2d = null): Konva.Vector2d {
    const transform = node.getAbsoluteTransform().copy();
    transform.invert();
    if (position !== null) {
      return transform.point(position);
    } else {
      const pos = node.getStage().getPointerPosition();
      return transform.point(pos);
    }
  }

  public static getPointPixelPositionFromPercentage(percentage: Point2D, maxDimensions: Dimension2D): Point2D {
    return {x: (percentage.x / 100) * maxDimensions.width, y: (percentage.y / 100) * maxDimensions.height };
  }

  public static getPointPercentagePositionFromPixel(position: Point2D, dimensions: Dimension2D): Point2D {
    return {x: (position.x / dimensions.width) * 100, y: (position.y / dimensions.height) * 100 };
  }

  private initZoom(stage: Konva.Stage, scaleBy: number): void {
    stage.on('wheel', ev => {
      let scaling = scaleBy;

      if (ev.evt.altKey) {
        scaling += 0.06;
      }

      ev.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      const mousePointsTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = ev.evt.deltaY > 0 ? oldScale * scaling : oldScale / scaling;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointer.x - mousePointsTo.x * newScale,
        y: pointer.y - mousePointsTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    });
  }

  public init(conf: StageConfig): void {
    this.stage = new Konva.Stage(conf);
    this.stage.on('click tap', (e: Konva.KonvaEventObject<MouseEvent>) => {
      this.onClickTap$.emit(e);
    });
    this.stage.scale({ x: 0.75, y: 0.75 });

    this.initZoom(this.stage, 1.02);
    this.layer = new Konva.Layer();

    this.stage.add(this.layer);
    this.stage.draw();
    this.transformer = this.createTransformer();

    this.stage.on('contextmenu', (ev) => {
      ev.evt.preventDefault();
      this.onContextMenu$.emit(ev);
    });

    this.layer.add(this.transformer);
  }

  public getStage(): Konva.Stage {
    return this.stage;
  }

  public getLayer(): Konva.Layer {
    return this.layer;
  }

  public getBannerGroups(): Konva.Group[] {
    return this.bannerGroups;
  }

  public getTransformer(): Konva.Transformer {
    return this.transformer;
  }

  public displayContextMenu(pointerPos: Point2D, actions: {name: string, action: any}[]): void {
    this.displayContextMenuEvent$.emit({pos: pointerPos, actions});
  }

  private createTransformer(): Konva.Transformer {
    const tr = new Konva.Transformer({
      rotationSnaps: [0, 90, 180, 270],
    });
    // tr.moveToTop();
    this.stage.on('click', ev => {
      // console.log(ev.target.id());
      let nodes = tr.nodes().slice();
      if (ev.target === this.stage) {
        nodes = [];
      } else if (ev.target.getAttr('transformable') !== false) {
        if (ev.target.name() === 'button-text') {
          ev.target = ev.target.getParent();
        }
        if (ev.evt.ctrlKey) {
          nodes.push(ev.target);
        } else {
          nodes = [ev.target];
        }
      } else {
        nodes = [];
      }

      const hasText = nodes.some(node => node.getClassName().toLowerCase() === 'text');
      if (hasText) {
        tr.enabledAnchors(['middle-left', 'middle-right']);
      } else {
        // all anchors
        tr.enabledAnchors(['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']);
      }

      tr.nodes(nodes);
      this.redraw();
    });
    return tr;
  }

  // public updateSelected(updatedValues: object): void {
  //   for (const shape of this.selectedNodes) {
  //     shape.setAttrs(updatedValues);
  //   }
  //   this.layers.forEach(layer => layer.batchDraw());
  // }

  public redraw(): void {
    if (this.transformer !== null) {
      this.transformer.moveToTop();
    }
    this.layer.batchDraw();
  }

  public moveObjectZIndices(direction: 'Down' | 'ToBottom' | 'ToTop' | 'Up'): void {
    const selectedNodes = this.transformer.nodes();
    if (this.shouldTransformRelatives) {
      const nodesNamesToMove = selectedNodes.map(node => node.name()).filter( (nodeName, index, self) =>
        self.indexOf(nodeName) === index );
      for (const bannerGroup of this.bannerGroups) {
        const bg = bannerGroup.findOne('.background');
        for (const nodeName of nodesNamesToMove) {
          const node = bannerGroup.findOne(`.${nodeName}`);
          if (direction === 'Down' && node.zIndex() - 1 <= bg.zIndex()) {
            continue;
          }
          // call method
          node[`move${direction}`]();
        }
        if (direction === 'ToBottom') {
          bg.moveToBottom();
        }
      }
    } else {
      selectedNodes.forEach( node => node[`move${direction}`]() );
    }

    this.redraw();
  }

  // public exportAsImage(target: string, mime: 'image/jpeg' | 'image/png'): void {
  //   const group = this.bannerGroups.find(g => g.group.id() === target);
  //   console.log(group.group.getChildren().toArray());
  //   console.log(target);
  //   console.assert(group !== undefined);
  //
  //   group.group.getChildren().each(c => {
  //     c.clearCache();
  //     c.draw();
  //   });
  //   group.bg.clearCache();
  //   // group.group.draw();
  //
  //   // const layer = this.canvas.getLayers()[2];
  //   // const dataUrl = layer.toDataURL({
  //   //   mimeType: mime,
  //   // });
  //   const dataUrl = group.group.toDataURL({ mimeType: mime, pixelRatio: 1 });
  //   const link = document.createElement('a');
  //   link.download = 'Ad1-file.jpeg';
  //   link.href = dataUrl;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // }

  public applyFilter(shapeName: string, filters: FilterChangedEvent): void {
    const shouldRemoveFilter = (contains, value, minValue = 0): boolean => {
      if (typeof value === 'boolean') {
        return contains && !value;
      } else if (typeof value === 'number') {
        return contains && value === minValue;
      }
      return contains;
    };

    const shouldAddFilter = (contains, value, minValue = 0): boolean => {
      if (typeof value === 'boolean') {
        return !contains && value;
      } else if (typeof value === 'number') {
        return !contains && value !== minValue;
      }
      return !contains;
    };

    let propName = '';
    let propValue = null;

    for (const key of Object.keys(filters.filterProperty) ) {
      propName = key;
      propValue = filters.filterProperty[key];
    }

    if (propValue === null) {
      propValue = filters.filterValues;
    }

    const imagesToFilter = this.shouldTransformRelatives
      ? [] : this.transformer.nodes().filter(s => s.name() === shapeName);


    for (const bannerGroup of this.bannerGroups) {
      const shape = bannerGroup.findOne(`.${shapeName}`);
      if (!shape) { continue; }
      // skip if this image is not selected
      if (imagesToFilter.length) {
        if (!imagesToFilter.includes(shape)) {
          continue;
        }
      }

      const activeFilters = shape.filters() ?? [];
      const containsFilter = activeFilters.includes( Konva.Filters[filters.filterName] );

      if (shouldRemoveFilter(containsFilter, propValue, filters.minValue)) {
        shape.filters( activeFilters.filter(f => f !== Konva.Filters[filters.filterName] ));
      } else if (shouldAddFilter(containsFilter, propValue, filters.minValue)) {
        shape.filters( activeFilters.concat([Konva.Filters[filters.filterName]]) );
      }

      shape.setAttr(propName, propValue);
    }
    this.redraw();
  }

  public drawBanners(): void {
    if (this.stage) {
      for (const bannerGroup of this.bannerGroups) {
        bannerGroup.destroy();
      }
      this.bannerGroups = [];
      const spacing = 20;
      const lineXStart = 60;
      let posX = lineXStart;
      let posY = spacing;
      let lineNum = 0;
      let lineHeight = 0;
      this.redraw();
      for (const [index, banner] of this.banners.entries()) {
        const group = new Konva.Group({
          id: `group-${banner.layout.name}`,
          name: `banner-group`,
          bannerId: banner.id,
          draggable: false,
          x: posX,
          y: posY,
          clip: {
            x: 0,
            y: 0,
            width: banner.layout.dimensions.width,
            height: banner.layout.dimensions.height,
          },
          width: banner.layout.dimensions.width,
          height: banner.layout.dimensions.height,
        });
        const bgRect = new Konva.Rect({
          id: `group-bg-${banner.layout.name}`,
          name: 'background',
          width: banner.layout.dimensions.width,
          height: banner.layout.dimensions.height,
          fill: '#fff',
          transformable: false,
          draggable: true,
          fillPatternOffsetX: 0,
          fillPatternOffsetY: 0,
        });

        bgRect.on('dragstart', dragstart => {
          dragstart.target.setAttr('dragJustStarted', true);
        });

        bgRect.on('dragmove', dragging => {
          bgRect.x(0);
          bgRect.y(0);
          if (bgRect.fillPriority() !== 'pattern') {
            return;
          }
          const justStarted = dragging.target.getAttr('dragJustStarted');
          if (justStarted) {
            dragging.target.setAttr('dragFromX', dragging.evt.clientX);
            dragging.target.setAttr('dragFromY', dragging.evt.clientY);
            dragging.target.setAttr('dragJustStarted', false);
            return;
          }
          const dragDeltaX = dragging.evt.clientX - dragging.target.getAttr('dragFromX');
          const dragDeltaY = dragging.evt.clientY - dragging.target.getAttr('dragFromY');
          dragging.target.setAttr('dragFromX', dragging.evt.clientX);
          dragging.target.setAttr('dragFromY', dragging.evt.clientY);


          for (const bannerGroup2 of this.bannerGroups) {
            const everyBgRect = bannerGroup2.findOne('.background');
            if (!this.shouldTransformRelatives) {
              if (everyBgRect !== dragging.target) {
                continue;
              }
            }

            everyBgRect.setAttrs({
              fillPatternOffsetX: everyBgRect.getAttr('fillPatternOffsetX') - dragDeltaX,
              fillPatternOffsetY: everyBgRect.getAttr('fillPatternOffsetY') - dragDeltaY,
            });
            everyBgRect.draw();
          }
        });

        group.add(bgRect);

        const label = KonvaService.bannerLabel({x: 0, y: banner.layout.dimensions.height},
          `${banner.layout.dimensions.width}x${banner.layout.dimensions.height}`);
        label.name('banner-label');
        label.y( label.y() - label.height() );
        label.x( banner.layout.dimensions.width - label.width() );
        group.add(label);

        posX += banner.layout.dimensions.width + spacing;

        lineHeight = Math.max(lineHeight, banner.layout.dimensions.height + label.height());
        const nextBannerWidth = this.banners[index + 1]?.layout.dimensions.width;
        if (posX + nextBannerWidth >= 1400) {
          posX = lineXStart;
          lineNum++;
          posY += lineHeight + spacing;
          lineHeight = spacing;
        }
        this.layer.add(group);
        this.bannerGroups.push(group);
      }
    }
  }

  public moveAllRelatives(dragEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex: number, shapeName: string): void {
    const centerPercentage = this.getShapeCenterPercentageInBannerFromEvent(dragEvent, bannerGroupIndex);
    const shapeData = this.shapes.find(s => s.userShapeName.slugify() === shapeName);
    if (!shapeData.bannerShapeConfig) {
      shapeData.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }
    dragEvent.target.setAttr('percentagePositions', centerPercentage);

    if (shapeData.userShapeName.slugify() === 'button') {
      // save button data
      shapeData.bannerShapeConfig.get(bannerGroupIndex).labelConfig = dragEvent.target.getAttrs();
    } else {
      shapeData.bannerShapeConfig.set(bannerGroupIndex, dragEvent.target.getAttrs());
    }

    if (!this.shouldTransformRelatives) { return; }
    let positionFix = 0;
    if (KonvaService.isRadiiBasedShape(dragEvent.target.getClassName())) {
      positionFix = dragEvent.target.getAttr('radius');
    }

    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if (bannerGroup === dragEvent.target.getParent()) { continue; }
      const relativeShape = bannerGroup.findOne(`.${shapeName}`);
      if (!relativeShape) { continue; }
      relativeShape.setAttr('percentagePositions', centerPercentage);
      const pos = this.getPixelPositionsWithinBanner(index, centerPercentage, relativeShape);
      // console.log(`Settings position for ${bannerGroup.id()} to ${pos.x}`);
      relativeShape.x(pos.x + positionFix);
      relativeShape.y(pos.y + positionFix);
      if (shapeData.userShapeName.slugify() === 'button') {
        shapeData.bannerShapeConfig.get(index).labelConfig = relativeShape.getAttrs();
      } else {
        shapeData.bannerShapeConfig.set(index, relativeShape.getAttrs());
      }

    }
    this.redraw();
  }

  public transformRelatives(transformEvent: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex, shapeName: string): void {
    if (transformEvent.target.isCached()) {
      transformEvent.target.cache();
    }
    // Object image center in percentage
    const percentages = this.getShapeCenterPercentageInBannerFromEvent(transformEvent, bannerGroupIndex);
    // current shape data
    const shapeData = this.shapes.find(s => s.userShapeName.slugify() === shapeName);

    if (shapeData.userShapeName.slugify() === 'button') {
      // save button data
      console.log(transformEvent.target.name());
      shapeData.bannerShapeConfig.get(bannerGroupIndex).labelConfig = transformEvent.target.getAttrs();
    } else {
      shapeData.bannerShapeConfig.set(bannerGroupIndex, transformEvent.target.getAttrs());
    }
    // console.log(shapeData.bannerShapeConfig.get(bannerGroupIndex));
    // calculate final dimensions in percentages relative to its banner
    let dimensionsWidthPercentage = transformEvent.target.width() * transformEvent.target.scaleX();
    dimensionsWidthPercentage /= this.bannerGroups[bannerGroupIndex].width();
    dimensionsWidthPercentage *= 100;
    let aspectRatio = transformEvent.target.height() * transformEvent.target.scaleY();
    aspectRatio /= transformEvent.target.width() * transformEvent.target.scaleX();

    if (!this.shouldTransformRelatives) { return; }
    for (const [index, bannerGroup] of this.bannerGroups.entries()) {
      if (bannerGroup === transformEvent.target.getParent()) { continue; }
      const relative = bannerGroup.findOne(`.${shapeName}`);
      // some relatives might not exist, because the user set it
      if (!relative) { continue; }
      const finalWidth = (dimensionsWidthPercentage / 100) * bannerGroup.width();
      // to preserve aspect ration
      const finalHeight = finalWidth * aspectRatio;
      // if (transformEvent.target.getClassName() === 'image') {
      //
      // }
      relative.scaleX( finalWidth / relative.width() );
      relative.scaleY( finalHeight / relative.height() );
      const pos = this.getPixelPositionsWithinBanner(index, percentages, relative);
      relative.x(pos.x);
      relative.y(pos.y);
      relative.rotation(transformEvent.target.getAbsoluteRotation());
      shapeData.bannerShapeConfig.set(index, relative.getAttrs());
      if (relative.isCached()) {
        relative.cache();
      }
    }
    this.redraw();
  }

  private getPixelPositionsWithinBanner(index: number, percentages: Point2D, relative: Konva.Node): Point2D {
    const dimensions = {
      width: relative.width() * relative.scaleX(),
      height: relative.height() * relative.scaleY()
    };
    const banner = this.banners[index];
    const {x: actualXPos, y: actualYPos} = banner.getPixelPositionFromPercentage(percentages, dimensions);
    const offsetX = this.bannerGroups[index].clipX();
    const offsetY = this.bannerGroups[index].clipY();
    return { x: actualXPos + offsetX, y: actualYPos + offsetY };
  }

  public getShapeCenterPercentageInBannerFromEvent(ev: Konva.KonvaEventObject<Konva.Shape>, bannerGroupIndex: number): Point2D {
    const dimensions = {
      width: ev.target.width() * ev.target.scaleX(),
      height: ev.target.height() * ev.target.scaleY()
    };
    let { x: xPos, y: yPos } = ev.target.getPosition();
    if (KonvaService.isRadiiBasedShape(ev.target.getClassName())) {
      xPos -= ev.target.getAttr('radius');
      yPos -= ev.target.getAttr('radius');
    }
    // if (ev.target.getAttr('radius'));
    // console.log(ev.target.getPosition());
    const eventBanner = this.banners[bannerGroupIndex];
    return eventBanner.getPercentageCenterPositionInBanner({x: xPos, y: yPos}, dimensions);
  }

  public clearBanners(): void {
    for (const bannerGroup of this.bannerGroups) {
      bannerGroup.getChildren( node => node.name() !== 'background' && node.name() !== 'banner-label' )
        .each(c => c.destroy());
    }
  }

  public updateBackgroundOfShape(bgConfig: Konva.ShapeConfig, slugifiedShapeName: string, restore = false): void {
    let shapeInfo = this.shapes.find(s => s.userShapeName.slugify() === slugifiedShapeName);
    if (slugifiedShapeName === 'button-tag') {
      shapeInfo = this.shapes.find(s => s.userShapeName.slugify() === 'button');
    }
    if ( !shapeInfo.bannerShapeConfig) {
      shapeInfo.bannerShapeConfig = new Map<number, Konva.ShapeConfig>();
    }

    const pixelPoints = {
      fillLinearGradientStartPoint: undefined,
      fillLinearGradientEndPoint: undefined,
      fillRadialGradientStartPoint: undefined,
      fillRadialGradientEndPoint: undefined,
    };

    const keysToDelete = [];
    // Dont delete key directly to avoid Undefined behaviour
    for (const key of Object.keys(pixelPoints)) {
      if ( !(key in bgConfig)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      delete pixelPoints[key];
    }

    // shape dimensions
    const shapeDim = (shape: Konva.Node): Dimension2D => ({width: shape.width(), height: shape.height()});
    for (const group of this.bannerGroups) {
      const shape = group.findOne(`.${slugifiedShapeName}`);
      if (!shape) {
        continue;
      }

      if (restore) {
        const attrs = shapeInfo.bannerShapeConfig.get(group.getAttr('bannerId'));
        shape.setAttrs(attrs);
        continue;
      }

      for (const pointKey of Object.keys(pixelPoints)) {
        pixelPoints[pointKey] = KonvaService.getPointPixelPositionFromPercentage(bgConfig[pointKey], shapeDim(shape));
      }
      // dimensions
      const dims = shapeDim(shape);

      const radialGradientRadiuses = {
        fillRadialGradientStartRadius: ((bgConfig.fillRadialGradientStartRadius ?? 0) / 100.0) *
          (dims.width >= dims.height ? dims.width : dims.height),
        fillRadialGradientEndRadius: ((bgConfig.fillRadialGradientEndRadius ?? 0) / 100.0) *
          (dims.width >= dims.height ? dims.width : dims.height),
      };

      if ('fillRadialGradientStartRadius' in bgConfig) {
        shape.setAttrs({ ...bgConfig, ...pixelPoints, ...radialGradientRadiuses });
      } else {
        shape.setAttrs({ ...bgConfig, ...pixelPoints });
      }
      if (slugifiedShapeName === 'button-tag') {
        const shapeCfg = shapeInfo.bannerShapeConfig.get(group.getAttr('bannerId'));
        shapeCfg.tagConfig = shape.getAttrs();
        shapeInfo.bannerShapeConfig.set(group.getAttr('bannerId'), shapeCfg);
      } else {
        shapeInfo.bannerShapeConfig.set(group.getAttr('bannerId'), shape.getAttrs());
      }
      if (shape.isCached()) {
        shape.cache();
      }
    }
    this.redraw();
  }
}
