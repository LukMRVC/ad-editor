import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input, OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import Konva from 'konva';
import {Color, NgxMatColorPickerInputEvent} from '@angular-material-components/color-picker';
import {ComponentStateService} from '@core/services/component-state.service';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {UploadedImage} from '@core/services/image-gallery.service';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-shape-bg-color',
  template: `
    <!-- Gradients -->
    <section fxLayout="column" fxLayoutGap=".25rem">
      <mat-form-field appearance="outline">
        <mat-label> {{ 'shape_color' | translate:{ shape: (this.shape | translate ) } | capitalize }}  </mat-label>
        <input [(ngModel)]="fillColor" (keydown.enter)="backgroundColorPicker.close()" (focus)="backgroundColorPicker.open()"
               [ngxMatColorPicker]="backgroundColorPicker" (colorChange)="fillColorChanged($event)" matInput #backgroundFillInput>
        <ngx-mat-color-toggle matSuffix [for]="backgroundColorPicker"></ngx-mat-color-toggle>
        <ngx-mat-color-picker [defaultColor]="defaultFillColour" #backgroundColorPicker [touchUi]="touchUi"></ngx-mat-color-picker>
      </mat-form-field>

      <div fxLayout="row nowrap" fxLayoutGap="0.25rem">
        <div fxFlex [id]="shape + '-gradient-stage'" class="preview-stage"></div>
        <mat-button-toggle-group vertical fxFlexAlign="start" (change)="changeFillStyle()" [(ngModel)]="fillStyle" name="fillStyle" aria-label="Fill Style">
          <mat-button-toggle checked="true" value="color">{{ 'solid' | translate | capitalize }}</mat-button-toggle>
          <mat-button-toggle value="linear-gradient">{{ 'linear' | translate | capitalize }}</mat-button-toggle>
          <mat-button-toggle value="radial-gradient">{{ 'radial' | translate | capitalize }}</mat-button-toggle>
          <mat-button-toggle value="pattern">{{ 'image' | translate | capitalize }}</mat-button-toggle>
        </mat-button-toggle-group>
      </div>
      <div fxFlex fxLayout="column" fxLayoutGap=".25rem">

        <ng-container *ngIf="fillStyle === 'pattern'">

          <button (click)="openGallery()" fxFlex #uploadBtn mat-raised-button color="primary">
            <mat-icon>insert_photo</mat-icon>
            {{ 'image_for'|translate:{shape: ('background' | translate) } | capitalize }}
          </button>

          <div class="filter-slider">
            <label>{{ 'zoom effect' | translate | capitalize }}</label>

            <mat-slider (input)="fillPatternScale = $event.value;"
                        [(ngModel)]="fillPatternScale" thumbLabel min="0.1" max="2" step="0.1"
                        (valueChange)="fillColorChanged()"></mat-slider>
            <span>{{ fillPatternScale }}</span>
          </div>

          <div class="filter-slider">
            <label>{{ 'rotation' | translate | capitalize }}</label>
            <mat-slider (input)="fillPatternRotation = $event.value;"
                        [(ngModel)]="fillPatternRotation" thumbLabel min="0" max="360" step="1"
                        (valueChange)="fillColorChanged()"></mat-slider>
            <span>{{ fillPatternRotation }}</span>
          </div>

        </ng-container>

        <ng-container *ngIf="fillStyle !== 'color' && fillStyle !== 'pattern'">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'gradient color' | translate | capitalize }}</mat-label>
            <input [(ngModel)]="defaultGradientColor" (keydown.enter)="gradientPicker.close()" (focus)="gradientPicker.open()"
                   [ngxMatColorPicker]="gradientPicker" (colorChange)="fillColorChanged($event)" matInput #gradientColourInput>
            <ngx-mat-color-toggle matSuffix [for]="gradientPicker"></ngx-mat-color-toggle>
            <ngx-mat-color-picker [defaultColor]="defaultGradientColor" #gradientPicker [touchUi]="touchUi"></ngx-mat-color-picker>
          </mat-form-field>

          <h5>{{ 'color stops' | translate | capitalize }}</h5>
          <div fxLayout="row nowrap" aria-label="Color stops">
            <button (click)="setEditableColorStop(i)" *ngFor="let colorStop of colorStops; index as i"
                    [style.backgroundColor]="colorStop.color"
                    mat-button style="border-radius: 0; max-width: 20px">
            </button>
            <button mat-flat-button (click)="addColorStop()">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <div fxLayout="column nowrap">
            <ng-container *ngFor="let colorStop of colorStops; let i = index; trackBy:trackByIdx">
              <div fxLayout="row nowrap" fxLayoutAlign="start start" fxFlex fxLayoutGap=".5rem" fxFlexOrder="1">
                <mat-form-field *ngIf="editableColorStopIdx === i" style="max-width: 80%" appearance="outline">
                  <mat-label>{{ 'color stop' | translate | capitalize }} {{ i }}</mat-label>
                  <input [(ngModel)]="colorStopEditableColor" (keydown.enter)="colorStopPicker.close()" (focus)="colorStopPicker.open()"
                         [ngxMatColorPicker]="colorStopPicker" (colorChange)="changeColorStopColor($event)" matInput #gradientColourInput>
                  <ngx-mat-color-toggle matSuffix [for]="colorStopPicker"></ngx-mat-color-toggle>
                  <ngx-mat-color-picker [defaultColor]="colorStopEditableColor" #colorStopPicker [touchUi]="touchUi"></ngx-mat-color-picker>
                </mat-form-field>

                <button (click)="removeColorStop(i)" fxFlex *ngIf="editableColorStopIdx === i" mat-flat-button color="warn">
                  <mat-icon>remove</mat-icon>
                </button>
              </div>

              <div *ngIf="i % 2 === 0" class="filter-slider">
                <label>{{ i + 1 }}</label>
                <mat-slider (input)="colorStops[i].position = $event.value;"
                            [(ngModel)]="colorStops[i].position" (valueChange)="changeColorStop()"
                            min="0" step="0.01" max="1"></mat-slider>
                <span>{{ colorStops[i].position }}</span>
              </div>

            </ng-container>
          </div>
        </ng-container>

        <div class="filter-slider" *ngIf="fillStyle === 'radial-gradient'">
          <label>{{ 'start gradient radius' | translate | titlecase }} </label>
          <mat-slider (input)="radialGradientStartRadius = $event.value;"
                      (change)="radialGradientRadiusChanged()" [(ngModel)]="radialGradientStartRadius"
                      min="1" step="1" max="100" >
          </mat-slider>
          <span>{{ radialGradientStartRadius }}</span>
        </div>
        <div class="filter-slider" *ngIf="fillStyle === 'radial-gradient'">
          <label>{{ 'end gradient radius' | translate | titlecase }}</label>
          <mat-slider (input)="radialGradientEndRadius = $event.value;"
                      (change)="radialGradientRadiusChanged()" [(ngModel)]="radialGradientEndRadius"
                      min="1" step="1" max="100" >
          </mat-slider>
          <span>{{ radialGradientEndRadius }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [
    '.preview-stage { border: 1px solid #a0a0a0; max-width: 200px; max-height: 200px; }',
  ],
  styleUrls: ['../../../../themed-slider.scss']
})
export class ShapeBgColorComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() shape: string;

  @Output() fillChanged: EventEmitter<Konva.ShapeConfig> = new EventEmitter<Konva.ShapeConfig>();

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
  readonly stageWidth = 200;
  readonly stageHeight = 200;
  touchUi = false;

  fillPatternImage: HTMLImageElement = null;
  fillPatternScale = 1;
  fillPatternRotation = 1;
  // must alternate number and color
  colorStops: {position: number, color: string}[] = [];
  editableColorStopIdx = -1;
  colorStopEditableColor = new Color(255, 255, 255, 255);
  private fillPatternImageName = '';

  constructor(
    private stateService: ComponentStateService,
    private dialog: MatDialog,
  ) {
    this.onScreenResize();
  }

  ngOnInit(): void {
    this.stateService.recoverState(`shape-bg-${this.shape}`, this);
  }

  ngAfterViewInit(): void {
    this.gradientStage = new Konva.Stage({ container: `${this.shape}-gradient-stage`, width: this.stageWidth, height: this.stageHeight });
    this.layer = new Konva.Layer({ id: 'grad-1' });

    if ( !this.gradientPoints.length) {
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
    }
    this.gradientPoints.forEach(p => p.on('dragmove', () => {  this.handleGradPointDrag(); }));

    this.gradientBackgroundRect = new Konva.Rect({
      width: this.gradientStage.width(),
      height: this.gradientStage.height(),
      x: 0,
      y: 0,
      fill: this.defaultFillColour.toHex8String(),
      fillPriority: this.fillStyle ?? 'color',
      fillPatternOffsetX: 0,
      fillPatternOffsetY: 0,
      listening: true,
      draggable: true,
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

    this.gradientBackgroundRect.on('dragstart', dragstart => dragstart.target.setAttr('dragJustStarted', true));

    this.gradientBackgroundRect.on('dragmove', dragging => {
      this.gradientBackgroundRect.x(0);
      this.gradientBackgroundRect.y(0);
      if (this.gradientBackgroundRect.fillPriority() !== 'pattern') {
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
      this.gradientBackgroundRect.setAttrs({
        fillPatternOffsetX: (this.gradientBackgroundRect.getAttr('fillPatternOffsetX') ?? 0) - dragDeltaX,
        fillPatternOffsetY: (this.gradientBackgroundRect.getAttr('fillPatternOffsetY') ?? 0) - dragDeltaY,
      });
      this.layer.batchDraw();
      this.fillChanged.emit({
        fillPatternOffsetX: this.gradientBackgroundRect.fillPatternOffsetX(),
        fillPatternOffsetY: this.gradientBackgroundRect.fillPatternOffsetY(),
      });
    });

    this.layer.add(this.gradientPoints[0]);
    this.layer.add(this.gradientPoints[1]);
    this.layer.add(this.gradientPoints[2]);
    this.gradientStage.add(this.layer);
    this.gradientStage.draw();
  }

  ngOnDestroy(): void {
    this.stateService.saveState(`shape-bg-${this.shape}`, {
      gradientPoints: this.gradientPoints,
      fillColor: this.fillColor,
      fillStyle: this.fillStyle,
      radialGradientEndRadius: this.radialGradientEndRadius,
      radialGradientStartRadius: this.radialGradientStartRadius,
      colorStops: this.colorStops,
    });
  }

  fillColorChanged(ev?: NgxMatColorPickerInputEvent): void {
    const allColorStops = [0, this.defaultGradientColor.toHex8String()]
      .concat(this.colorStops.flatMap((stop) => Object.values(stop) ))
      .concat([1, this.fillColor.toHex8String()]);
    const getPoint2D = (shape) => ({x: shape.x(), y: shape.y()});
    const getPoint2DPercentage = (shape, w, h) => ({x: 100 * (shape.x() / w), y: 100 * (shape.y() / h)});
    const fillAttributes = {
      fillPriority: this.fillStyle,
      fill: this.fillColor.toHex8String(),
      alpha: ev?.value?.a ?? 1,
      fillLinearGradientColorStops: allColorStops,
      fillRadialGradientColorStops: allColorStops,
      fillLinearGradientStartPoint: getPoint2D(this.gradientPoints[0]),
      fillLinearGradientEndPoint: getPoint2D(this.gradientPoints[1]),
      fillRadialGradientEndPoint: getPoint2D(this.gradientPoints[2]),
      fillRadialGradientStartPoint: getPoint2D(this.gradientPoints[2]),
      fillRadialGradientStartRadius: this.radialGradientStartRadius,
      fillRadialGradientEndRadius: this.radialGradientEndRadius,
      fillPatternScale: {x: this.fillPatternScale, y: this.fillPatternScale },
      fillPatternRotation: this.fillPatternRotation,
      fillPatternImage: this.fillPatternImage,
      fillPatternImageName: this.fillPatternImageName,
    };
    this.gradientBackgroundRect.setAttrs(fillAttributes);
    this.gradientStage.batchDraw();
    this.fillChanged.emit({...fillAttributes,
      fillLinearGradientStartPoint: getPoint2DPercentage(this.gradientPoints[0], this.stageWidth, this.stageHeight),
      fillLinearGradientEndPoint: getPoint2DPercentage(this.gradientPoints[1], this.stageWidth, this.stageHeight),
      fillRadialGradientEndPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
      fillRadialGradientStartPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
    });
  }

  changeFillStyle(): void {
    if (this.fillStyle === 'color' || this.fillStyle === 'pattern') {
      this.gradientPoints.forEach(p => p.opacity(0));
    } else if (this.fillStyle === 'linear-gradient') {
      this.gradientPoints.forEach(p => p.opacity(1));
      this.gradientPoints[2].opacity(0);
    } else if (this.fillStyle === 'radial-gradient') {
      this.gradientPoints.forEach(p => p.opacity(1));
      this.gradientPoints.forEach(p => p.opacity(0));
      this.gradientPoints[2].opacity(1);
    }
    this.fillColorChanged();
    this.gradientStage.batchDraw();
  }

  private handleGradPointDrag(): void {
    const getPoint2D = (shape) => ({x: shape.x(), y: shape.y()});
    const getPoint2DPercentage = (shape, w, h) => ({ x: 100 * (shape.x() / w), y: 100 * (shape.y() / h) });
    if (this.fillStyle !== 'radial-gradient') {
      this.gradientBackgroundRect.fillLinearGradientStartPoint(getPoint2D(this.gradientPoints[0]));
      this.gradientBackgroundRect.fillLinearGradientEndPoint(getPoint2D(this.gradientPoints[1]));
      this.fillChanged.emit({
        fillLinearGradientStartPoint: getPoint2DPercentage(this.gradientPoints[0], this.stageWidth, this.stageHeight),
        fillLinearGradientEndPoint: getPoint2DPercentage(this.gradientPoints[1], this.stageWidth, this.stageHeight),
      });
    } else {
      this.gradientBackgroundRect.fillRadialGradientEndPoint({ x: this.gradientPoints[2].x(), y: this.gradientPoints[2].y() });
      this.gradientBackgroundRect.fillRadialGradientStartPoint({ x: this.gradientPoints[2].x(), y: this.gradientPoints[2].y() });
      this.fillChanged.emit({
        fillRadialGradientEndPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
        fillRadialGradientStartPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
      });
    }
    this.gradientStage.batchDraw();
  }

  radialGradientRadiusChanged(): void {
    this.gradientBackgroundRect
      .fillRadialGradientStartRadius((this.radialGradientStartRadius / 100) * this.gradientBackgroundRect.width());
    this.gradientBackgroundRect
      .fillRadialGradientEndRadius((this.radialGradientEndRadius / 100) * this.gradientBackgroundRect.width());
    const attributesToChange = {
      fillRadialGradientStartRadius: this.radialGradientStartRadius,
      fillRadialGradientEndRadius: this.radialGradientEndRadius,
    };
    this.fillChanged.emit(attributesToChange);
    this.gradientStage.batchDraw();
  }

  @HostListener('window:resize')
  onScreenResize(): void {
    this.touchUi = window.innerWidth < 720;
  }

  addColorStop(): void {
    const randomColor = `#${Math.floor(Math.random() * 16_777_215).toString(16)}`.padEnd(9, 'f');
    this.colorStops.push({position: 0.5, color: randomColor});
    this.fillColorChanged();
  }

  changeColorStop(): void {
    this.fillColorChanged();
  }

  trackByIdx(index: number): any {
    return index;
  }

  changeColorStopColor($event: NgxMatColorPickerInputEvent): void {
    this.colorStops[this.editableColorStopIdx].color = $event.value.toHex8String();
    this.fillColorChanged();
  }

  setEditableColorStop(colorStopIndex: number): void {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      // console.log(result);
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: parseInt(result[4], 16)
      };
    };

    this.editableColorStopIdx = colorStopIndex;
    const rgb = hexToRgb(this.colorStops[this.editableColorStopIdx].color);
    this.colorStopEditableColor = new Color(rgb.r, rgb.g, rgb.b, rgb?.a);
  }

  removeColorStop(index: number): void {
    this.colorStops.splice(index, 1);
    this.fillColorChanged();
    this.editableColorStopIdx = null;
  }

  public async openGallery(): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    if (img) {
      const htmlImg = new Image();
      htmlImg.onload = () => {
        this.fillPatternImage = htmlImg;
        this.fillColorChanged();
      };
      this.fillPatternImageName = (img as UploadedImage).name;
      htmlImg.src = (img as UploadedImage).src;
    }
  }
}
