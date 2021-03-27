import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {KonvaService} from '@core/services/konva.service';
import {MatSliderChange} from '@angular/material/slider';
import {
  Color,
  NgxMatColorPickerComponent,
  NgxMatColorPickerInputEvent
} from '@angular-material-components/color-picker';
import Konva from 'konva';
import {ImageGalleryService, UploadedImage} from '@core/services/image-gallery.service';
import {MatDialog} from '@angular/material/dialog';
import {BannerDataService} from '@core/services/banner-data.service';
import {ShapeInformation} from '@core/models/dataset';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit, AfterViewInit {
  public imageFitOptions = [
    'left-top',
    'left-middle',
    'left-bottom',
    'right-top',
    'right-middle',
    'right-bottom',
    'center-top',
    'center-middle',
    'center-bottom',
  ];

  public selectedBackgroundFit = 'center-top';
  zoom = 1;

  @ViewChild('fillPicker') fillPicker: NgxMatColorPickerComponent;
  gradientStage: Konva.Stage;
  gradientBackgroundRect: Konva.Rect;
  gradientPoints: Konva.Shape[] = [];
  layer: Konva.Layer;

  fillColor: Color = new Color(255, 255, 255, 255);
  defaultFillColour = new Color(255, 255, 255, 255);
  defaultGradientColor = new Color(255, 0, 0, 255);
  fillStyle = 'color';

  radialGradientEndRadius = 50;
  radialGradientStartRadius = 0;
  activeDataset = null;
  logoShapeInfo = null;

  touchUi = false;

  // must alternate number and color
  colorStops: any[] = [];

  constructor(
    public konva: KonvaService,
    public imageService: ImageGalleryService,
    public dialog: MatDialog,
    public dataService: BannerDataService,
  ) {
    this.onScreenResize();
  }

  ngOnInit(): void {
    this.activeDataset = this.dataService.getActiveDataset();
    this.logoShapeInfo = this.activeDataset.find(s => s.userShapeName?.toLowerCase() === 'background');
  }

  ngAfterViewInit(): void {
    this.gradientStage = new Konva.Stage({ container: 'background-preview-stage', width: 200, height: 200 });
    this.layer = new Konva.Layer({ id: 'grad-1' });

    this.gradientPoints.push(new Konva.Rect({
      id: 'grad:0',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: '#f0d732',
      strokeWidth: 1,
      stroke: 'black',
      opacity: 0,
      draggable: true,
      dragBoundFunc: (pos) => {
        const newX = pos.x < 0 ? 0 : (pos.x > 190 ? 190 : pos.x);
        const newY = pos.y < 0 ? 0 : (pos.y > 190 ? 190 : pos.y);
        return {
          x: newX,
          y: newY,
        };
      }
    }));

    this.gradientPoints.push(new Konva.Rect({
      id: 'grad:1',
      x: this.gradientStage.width() - 10,
      y: this.gradientStage.height() - 10,
      width: 10,
      height: 10,
      fill: '#f0d732',
      strokeWidth: 1,
      stroke: 'black',
      opacity: 0,
      draggable: true,
      dragBoundFunc: (pos) => {
        const newX = pos.x < 0 ? 0 : (pos.x > 190 ? 190 : pos.x);
        const newY = pos.y < 0 ? 0 : (pos.y > 190 ? 190 : pos.y);
        return {
          x: newX,
          y: newY,
        };
      }
    }));

    this.gradientPoints.push(new Konva.Rect({
      id: 'grad:2',
      x: this.gradientStage.width() / 2,
      y: this.gradientStage.height() / 2,
      width: 10,
      height: 10,
      fill: '#f0d732',
      strokeWidth: 1,
      stroke: 'black',
      opacity: 0,
      draggable: true,
      dragBoundFunc: (pos) => {
        const newX = pos.x < 0 ? 0 : (pos.x > 190 ? 190 : pos.x);
        const newY = pos.y < 0 ? 0 : (pos.y > 190 ? 190 : pos.y);
        return {
          x: newX,
          y: newY,
        };
      }
    }));
    this.gradientPoints.forEach(p => p.on('dragmove', (ev) => {  this.handleGradPointDrag(ev); }));
    this.gradientPoints.forEach(p => p.on('dragend', (ev) => {  this.setSelectedFillStyle(); }));

    this.gradientBackgroundRect = new Konva.Rect({
      width: this.gradientStage.width(),
      height: this.gradientStage.height(),
      x: 0,
      y: 0,
      fill: this.defaultFillColour.toHex8String(),
      listening: false,
      fillRadialGradientStartPoint: { x: this.gradientPoints[2].x(), y: this.gradientPoints[2].y() },
      fillRadialGradientStartRadius: this.radialGradientStartRadius,
      fillRadialGradientEndPoint: { x: this.gradientPoints[2].x() + 10, y: this.gradientPoints[2].y() + 10 },
      fillRadialGradientEndRadius: (this.radialGradientEndRadius / 100) * this.gradientStage.width(),
      fillRadialGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
      fillLinearGradientStartPoint: { x: this.gradientPoints[0].x(), y: this.gradientPoints[0].y() },
      fillLinearGradientEndPoint: { x: this.gradientPoints[1].x(), y: this.gradientPoints[1].y() },
      fillLinearGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
    });

    this.layer.add(this.gradientBackgroundRect);
    this.layer.add(this.gradientPoints[0]);
    this.layer.add(this.gradientPoints[1]);
    this.layer.add(this.gradientPoints[2]);
    this.gradientStage.add(this.layer);
    this.gradientStage.draw();
  }

  async openGallery(datasetKey: string, shapeInfo: ShapeInformation): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    if (img) {
      this.dataService.changeValue(datasetKey, shapeInfo, (img as UploadedImage).src);
    }
  }

  fillColorChanged(ev?: NgxMatColorPickerInputEvent): void {
    const fillAttributes = {
      fill: this.fillColor.toHex8String(),
      alpha: ev?.value?.a ?? 1,
      fillLinearGradientColorStops:
        [0, this.defaultGradientColor.toHex8String()]
          .concat(this.colorStops).concat([1, this.fillColor.toHex8String()]),

      fillRadialGradientColorStops:
        [0, this.defaultGradientColor.toHex8String()]
          .concat(this.colorStops).concat([1, this.fillColor.toHex8String()]),
    };
    this.konva.selectedNodes.forEach(node => {
      node.setAttrs(fillAttributes);
    });
    this.gradientBackgroundRect.setAttrs(fillAttributes);
    this.gradientStage.batchDraw();
    // this.konva.redraw();
    // this.konva.updateSelected({ fill: ev.value.toHex8String(true), alpha: ev.value.a });
    // this.konva.updateSelectedFillColor(ev.value);
  }

  changeFillStyle(): void {
    if (this.fillStyle === 'color') {
      this.gradientBackgroundRect.setAttrs({
        fillPriority: this.fillStyle,
      });
      this.gradientPoints.forEach(p => p.opacity(0));
    } else if (this.fillStyle === 'linear-gradient') {
      this.gradientBackgroundRect.setAttrs({
        fillPriority: this.fillStyle,
      });
      this.gradientPoints.forEach(p => p.opacity(1));
      this.gradientPoints[2].opacity(0);
    } else if (this.fillStyle === 'radial-gradient') {
      this.gradientBackgroundRect.setAttrs({
        fillPriority: this.fillStyle,
      });
      this.gradientPoints.forEach(p => p.opacity(0));
      this.gradientPoints[2].opacity(1);
    }
    this.gradientStage.batchDraw();
    this.setSelectedFillStyle();
  }

  private handleGradPointDrag(ev: Konva.KonvaEventObject<any>): void {
    const id = ev.target.id();
    const point = ev.target;
    const splitId = id.split(':');
    const idx = parseInt(splitId[1], 10);
    if (idx === 0) {
      this.gradientBackgroundRect.fillLinearGradientStartPoint({ x: point.x(), y: point.y() });
    } else if (idx === 1) {
      this.gradientBackgroundRect.fillLinearGradientEndPoint({ x: point.x(), y: point.y() });
    } else if (idx === 2) {
      this.gradientBackgroundRect.fillRadialGradientEndPoint({ x: point.x(), y: point.y() });
      this.gradientBackgroundRect.fillRadialGradientStartPoint({ x: point.x(), y: point.y() });
    }
    this.gradientStage.batchDraw();
  }

  private setSelectedFillStyle(): void {
    this.konva.selectedNodes.forEach(node => {
      const ratioX = node.width() / this.gradientBackgroundRect.width();
      const ratioY = node.height() / this.gradientBackgroundRect.height();
      let circularOffset = 0;
      if ('radius' in node) {
        circularOffset = -this.gradientStage.width() / 2;
      }
      // console.log('X ratio:', ratioX);
      node.fillPriority(this.fillStyle);
      const calculatedCoordinates = (pointIdx) => {
        return {
          x: (this.gradientPoints[pointIdx].x() + circularOffset) * ratioX,
          y: (this.gradientPoints[pointIdx].y() + circularOffset) * ratioY,
        };
      };
      node.setAttrs({
        fill: this.fillColor.toHex8String(),
        fillLinearGradientStartPoint: calculatedCoordinates(0),
        fillLinearGradientEndPoint: calculatedCoordinates(1),
        fillLinearGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
        fillRadialGradientStartPoint: calculatedCoordinates(2),
        fillRadialGradientEndPoint: calculatedCoordinates(2),
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndRadius: (this.radialGradientEndRadius / 100) * node.width(),
        fillRadialGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
      });
    });
    this.konva.redraw();
  }

  radialGradientRadiusChanged($event: MatSliderChange): void {
    this.gradientBackgroundRect
      .fillRadialGradientStartRadius((this.radialGradientStartRadius / 100) * this.gradientBackgroundRect.width());
    this.gradientBackgroundRect
      .fillRadialGradientEndRadius((this.radialGradientEndRadius / 100) * this.gradientBackgroundRect.width());
    this.konva.selectedNodes
      .forEach(node => node.setAttr('fillRadialGradientEndRadius', (this.radialGradientEndRadius / 100) * node.width()));
    this.konva.redraw();
    this.gradientStage.batchDraw();
  }

  gradientColorChanged($event: NgxMatColorPickerInputEvent): void {
    const fillAttributes = {
      fillLinearGradientColorStops: [0, $event.value.toHex8String() , 1, this.fillColor.toHex8String()],
      fillRadialGradientColorStops: [0, $event.value.toHex8String(), 1, this.fillColor.toHexString()],
    };
    this.konva.selectedNodes.forEach(node => {
      node.setAttrs(fillAttributes);
    });
    this.gradientBackgroundRect.setAttrs(fillAttributes);
    this.konva.redraw();
    this.gradientStage.batchDraw();
  }

  @HostListener('window:resize', ['$event'])
  onScreenResize(event?): void {
    this.touchUi = window.innerWidth < 720;
  }

  addColorStop(): void {
    const randomColor = `#${Math.floor(Math.random() * 16_777_215).toString(16)}`.padEnd(7, '0');
    console.log(randomColor);
    this.colorStops.push(0.5, randomColor);
    this.fillColorChanged();
  }

  changeColorStop(): void {
    this.fillColorChanged();
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }
}
