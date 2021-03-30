import {
  AfterContentInit,
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

@Component({
  selector: 'app-shape-bg-color',
  template: `
    <!-- Gradients -->
    <section fxLayout="column" fxLayoutGap=".25rem">
      <mat-form-field>
        <mat-label>{{ shape | titlecase }} color</mat-label>
        <input [(ngModel)]="fillColor" (keydown.enter)="backgroundColorPicker.close()" (focus)="backgroundColorPicker.open()"
               [ngxMatColorPicker]="backgroundColorPicker" (colorChange)="fillColorChanged($event)" matInput #backgroundFillInput>
        <ngx-mat-color-toggle matSuffix [for]="backgroundColorPicker"></ngx-mat-color-toggle>
        <ngx-mat-color-picker [defaultColor]="defaultFillColour" #backgroundColorPicker [touchUi]="touchUi"></ngx-mat-color-picker>
      </mat-form-field>

      <div fxLayout="row nowrap" fxLayoutGap="0.25rem">
        <div fxFlex [id]="shape + '-gradient-stage'" class="preview-stage"></div>
        <mat-button-toggle-group vertical fxFlexAlign="start" (change)="changeFillStyle()" [(ngModel)]="fillStyle" name="fillStyle" aria-label="Fill Style">
          <mat-button-toggle checked="true" value="color">Solid</mat-button-toggle>
          <mat-button-toggle value="linear-gradient">Linear</mat-button-toggle>
          <mat-button-toggle value="radial-gradient">Radial</mat-button-toggle>
        </mat-button-toggle-group>
      </div>
      <div fxFlex fxLayout="column" fxLayoutGap=".25rem">
        <mat-form-field>
          <mat-label>{{ shape | titlecase }} gradient color</mat-label>
          <input [(ngModel)]="defaultGradientColor" (keydown.enter)="gradientPicker.close()" (focus)="gradientPicker.open()"
                 [ngxMatColorPicker]="gradientPicker" (colorChange)="fillColorChanged($event)" matInput #gradientColourInput>
          <ngx-mat-color-toggle matSuffix [for]="gradientPicker"></ngx-mat-color-toggle>
          <ngx-mat-color-picker [defaultColor]="defaultGradientColor" #gradientPicker [touchUi]="touchUi"></ngx-mat-color-picker>
        </mat-form-field>

        <ng-container *ngIf="fillStyle !== 'color'">
          <h5>{{ shape | titlecase }} color stops</h5>
          <div fxLayout="row nowrap" aria-label="Color stops">
            <button (click)="setEditableColorStop(i)" *ngFor="let colorStop of colorStops; index as i"
                    [style.backgroundColor]="colorStop.color"
                    mat-button style="border-radius: 0">
            </button>
            <button mat-flat-button (click)="addColorStop()">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <div fxLayout="column nowrap">
            <ng-container *ngFor="let colorStop of colorStops; let i = index; trackBy:trackByIdx">
              <div fxLayout="row nowrap" fxLayoutAlign="start start" fxFlex fxLayoutGap=".5rem" fxFlexOrder="1">
                <mat-form-field *ngIf="editableColorStopIdx === i" style="max-width: 80%">
                  <mat-label>Color stop {{ i }}</mat-label>
                  <input [(ngModel)]="colorStopEditableColor" (keydown.enter)="colorStopPicker.close()" (focus)="colorStopPicker.open()"
                         [ngxMatColorPicker]="colorStopPicker" (colorChange)="changeColorStopColor($event)" matInput #gradientColourInput>
                  <ngx-mat-color-toggle matSuffix [for]="colorStopPicker"></ngx-mat-color-toggle>
                  <ngx-mat-color-picker [defaultColor]="colorStopEditableColor" #colorStopPicker [touchUi]="touchUi"></ngx-mat-color-picker>
                </mat-form-field>

                <button (click)="removeColorStop(i)" fxFlex *ngIf="editableColorStopIdx === i" mat-flat-button color="warn">
                  <mat-icon>remove</mat-icon>
                </button>
              </div>


              <div *ngIf="i % 2 === 0" fxLayout="row nowrap" fxFlexOrder="2" fxLayoutAlign="start start" fxLayoutGap=".25rem">
                <span class="slider-label">{{ i + 1 }}</span>
                <mat-slider [(ngModel)]="colorStops[i].position" (valueChange)="changeColorStop()"
                            fxFill thumbLabel min="0" step="0.01" max="1"></mat-slider>
              </div>

            </ng-container>
          </div>
        </ng-container>

        <div fxLayout="column" fxFlex *ngIf="fillStyle === 'radial-gradient'">
          <span>Start gradient radius</span>
          <mat-slider thumbLabel (change)="radialGradientRadiusChanged()" [(ngModel)]="radialGradientStartRadius"
                      min="1" step="1" max="100" >
          </mat-slider>
        </div>
        <div fxLayout="column" fxFlex *ngIf="fillStyle === 'radial-gradient'">
          <span>End gradient radius</span>
          <mat-slider thumbLabel (change)="radialGradientRadiusChanged()" [(ngModel)]="radialGradientEndRadius"
                      min="1" step="1" max="100" >
          </mat-slider>
        </div>
      </div>
    </section>
  `,
  styles: [
    '.preview-stage { border: 1px solid #a0a0a0;}',
    '.slider-label { margin-top: 15px!important; }',
  ],
})
export class ShapeBgColorComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() shape: string;

  @Output() colorChanged: EventEmitter<Konva.ShapeConfig> = new EventEmitter<Konva.ShapeConfig>();

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

  // must alternate number and color
  colorStops: {position: number, color: string}[] = [];
  editableColorStopIdx = -1;
  colorStopEditableColor = new Color(255, 255, 255, 255);

  constructor(
    private stateService: ComponentStateService
  ) {
    this.onScreenResize();
  }

  ngOnInit(): void {
    this.stateService.recoverState(`shape-bg-${this.shape}`, this);
    console.log(this.colorStops);
    console.log(this.fillStyle);
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
    this.gradientPoints.forEach(p => p.on('dragend', () => {  this.setSelectedFillStyle(); }));

    this.gradientBackgroundRect = new Konva.Rect({
      width: this.gradientStage.width(),
      height: this.gradientStage.height(),
      x: 0,
      y: 0,
      fill: this.defaultFillColour.toHex8String(),
      fillPriority: this.fillStyle ?? 'color',
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
    };
    // this.konva.selectedNodes.forEach(node => {
    //   node.setAttrs(fillAttributes);
    // });
    this.gradientBackgroundRect.setAttrs(fillAttributes);
    this.gradientStage.batchDraw();
    this.colorChanged.emit({...fillAttributes,
      fillLinearGradientStartPoint: getPoint2DPercentage(this.gradientPoints[0], this.stageWidth, this.stageHeight),
      fillLinearGradientEndPoint: getPoint2DPercentage(this.gradientPoints[1], this.stageWidth, this.stageHeight),
      fillRadialGradientEndPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
      fillRadialGradientStartPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
    });
    // this.konva.redraw();
    // this.konva.updateSelected({ fill: ev.value.toHex8String(true), alpha: ev.value.a });
    // this.konva.updateSelectedFillColor(ev.value);
  }

  changeFillStyle(): void {
    if (this.fillStyle === 'color') {
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
    this.setSelectedFillStyle();
  }

  private handleGradPointDrag(): void {
    const getPoint2D = (shape) => ({x: shape.x(), y: shape.y()});
    const getPoint2DPercentage = (shape, w, h) => ({ x: 100 * (shape.x() / w), y: 100 * (shape.y() / h) });
    if (this.fillStyle !== 'radial-gradient') {
      this.gradientBackgroundRect.fillLinearGradientStartPoint(getPoint2D(this.gradientPoints[0]));
      this.gradientBackgroundRect.fillLinearGradientEndPoint(getPoint2D(this.gradientPoints[1]));
      this.colorChanged.emit({
        fillLinearGradientStartPoint: getPoint2DPercentage(this.gradientPoints[0], this.stageWidth, this.stageHeight),
        fillLinearGradientEndPoint: getPoint2DPercentage(this.gradientPoints[1], this.stageWidth, this.stageHeight),
      });
    } else {
      this.gradientBackgroundRect.fillRadialGradientEndPoint({ x: this.gradientPoints[2].x(), y: this.gradientPoints[2].y() });
      this.gradientBackgroundRect.fillRadialGradientStartPoint({ x: this.gradientPoints[2].x(), y: this.gradientPoints[2].y() });
      this.colorChanged.emit({
        fillRadialGradientEndPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
        fillRadialGradientStartPoint: getPoint2DPercentage(this.gradientPoints[2], this.stageWidth, this.stageHeight),
      });
    }
    this.gradientStage.batchDraw();
  }

  private setSelectedFillStyle(): void {
    // this.konva.selectedNodes.forEach(node => {
    //   const ratioX = node.width() / this.gradientBackgroundRect.width();
    //   const ratioY = node.height() / this.gradientBackgroundRect.height();
    //   let circularOffset = 0;
    //   if ('radius' in node) {
    //     circularOffset = -this.gradientStage.width() / 2;
    //   }
    //   // console.log('X ratio:', ratioX);
    //   node.fillPriority(this.fillStyle);
    //   const calculatedCoordinates = (pointIdx) => {
    //     return {
    //       x: (this.gradientPoints[pointIdx].x() + circularOffset) * ratioX,
    //       y: (this.gradientPoints[pointIdx].y() + circularOffset) * ratioY,
    //     };
    //   };
    //   node.setAttrs({
    //     fill: this.fillColor.toHex8String(),
    //     fillLinearGradientStartPoint: calculatedCoordinates(0),
    //     fillLinearGradientEndPoint: calculatedCoordinates(1),
    //     fillLinearGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
    //     fillRadialGradientStartPoint: calculatedCoordinates(2),
    //     fillRadialGradientEndPoint: calculatedCoordinates(2),
    //     fillRadialGradientStartRadius: 0,
    //     fillRadialGradientEndRadius: (this.radialGradientEndRadius / 100) * node.width(),
    //     fillRadialGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
    //   });
    // });
    // this.konva.redraw();
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
    this.colorChanged.emit(attributesToChange);
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

  trackByIdx(index: number, obj: any): any {
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
}
