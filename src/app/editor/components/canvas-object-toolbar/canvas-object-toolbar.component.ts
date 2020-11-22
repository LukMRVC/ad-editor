import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {Observable, Subscription} from 'rxjs';
import {
  Color,
  NgxMatColorPickerComponent,
  NgxMatColorPickerInputEvent
} from '@angular-material-components/color-picker';
import {GoogleFontService, WebFont} from '@shared/services/google-font.service';
import {FormControl} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

import * as WebFontLoader from 'webfontloader';
import Konva from 'konva';
import KonvaEventObject = Konva.KonvaEventObject;
import {MatSliderChange} from '@angular/material/slider';

@Component({
  selector: 'app-canvas-object-toolbar',
  templateUrl: './canvas-object-toolbar.component.html',
  styleUrls: ['./canvas-object-toolbar.component.scss']
})
export class CanvasObjectToolbarComponent implements OnInit, OnDestroy, AfterViewInit {

  canvasObjectType: 'image' | 'text' | 'shape' | 'background';

  subscription: Subscription = new Subscription();
  defaultFillColour = new Color(255, 0, 0, 255);
  defaultGradientColor = new Color(255, 255, 255, 0);
  defaultShadowColor = new Color(0, 0, 0, 255);
  fontList: WebFont[] = [];
  fontFamilyControl: FormControl = new FormControl();
  filteredFonts: Observable<WebFont[]>;
  fontSize = 30;
  text = '';
  fillColor: Color = new Color(255, 0, 0, 255);
  strokeColor: Color = new Color(0, 0, 0, 255);
  strokeEnabled = true;
  strokeWidth = 1;
  fillStyle = 'color';
  radialGradientRadius = 50;
  drawPoint: {x: number, y: number} = { x: 0, y: 0 };
  dimension: {w: number, h: number} = { w: 0, h: 0 };
  shadow: { enabled: boolean, blur: number, offset: { x: 0, y: 0} } = { enabled: false, blur: 50, offset: { x: 0, y: 0} };

  @ViewChild('fillPicker') fillPicker: NgxMatColorPickerComponent;
  gradientStage: Konva.Stage;
  gradientBackgroundRect: Konva.Rect;
  gradientPoints: Konva.Shape[] = [];

  constructor(
    public konva: KonvaService,
    public googleFont: GoogleFontService,
  ) {
    this.subscription.add(this.konva.$selectedObjectType.subscribe(objectType => this.canvasObjectType = objectType));
    this.subscription.add(this.googleFont.getAll$('popularity').subscribe(
      fontList => this.fontList = fontList.items,
      error => console.log(error))
    );
  }

  autocompleteDisplay = ( (font: WebFont) => font?.family );

  ngOnInit(): void {
    this.filteredFonts = this.fontFamilyControl.valueChanges.pipe(
      startWith(''),
      map( value => this._filter(value))
    );
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
    this.subscription.add(this.konva.onClickTap$.subscribe(ev => {
      if (this.konva.selectedNodes.length === 1) {
        const node = this.konva.selectedNodes[0];
        this.drawPoint = { x: Math.round(node.x()), y: Math.round(node.y()) };
        this.dimension = { w: node.width(), h: node.height() };
        if (node.getClassName() === 'Text') {
          this.text = ev.target.text();
        }
        console.log('Node: ', node);
        let rgb = hexToRgb(node.fill());
        this.fillColor = new Color(rgb.r, rgb.g, rgb.b, rgb.a);
        this.strokeEnabled = node.strokeEnabled();
        if (node.strokeEnabled()) {
          rgb = hexToRgb(node.stroke());
          this.strokeColor = new Color(rgb.r, rgb.g, rgb.b, rgb.a);
          this.strokeWidth = node.strokeWidth();
        }
        this.gradientBackgroundRect.setAttrs({
          fill: this.fillColor.toHex8String(),
        });
        this.gradientStage.batchDraw();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.gradientStage = new Konva.Stage({ container: 'gradient-stage', width: 200, height: 200 });
    const layer = new Konva.Layer({ id: 'grad-1' });

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
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndPoint: { x: this.gradientPoints[2].x() + 10, y: this.gradientPoints[2].y() + 10 },
      fillRadialGradientEndRadius: (this.radialGradientRadius / 100) * this.gradientStage.width(),
      fillRadialGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
      fillLinearGradientStartPoint: { x: this.gradientPoints[0].x(), y: this.gradientPoints[0].y() },
      fillLinearGradientEndPoint: { x: this.gradientPoints[1].x(), y: this.gradientPoints[1].y() },
      fillLinearGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
    });

    layer.add(this.gradientBackgroundRect);
    layer.add(this.gradientPoints[0]);
    layer.add(this.gradientPoints[1]);
    layer.add(this.gradientPoints[2]);
    this.gradientStage.add(layer);
    this.gradientStage.draw();
  }

  private _filter(fontFamilyName: string): WebFont[] {
    // console.log({familyName: fontFamilyName});
    if (fontFamilyName === '') {
      return this.fontList.slice(0, 50);
    } else if (typeof fontFamilyName === 'string') {
      const filterValue = fontFamilyName.toLowerCase();
      return this.fontList.filter(font => font.family.toLowerCase().indexOf(filterValue) === 0);
    } else {
      const filterValue = (fontFamilyName as WebFont).family.toLowerCase();
      return this.fontList.filter(font => font.family.toLowerCase().indexOf(filterValue) === 0);
    }
  }

  fillColorChanged(ev: NgxMatColorPickerInputEvent): void {
    const fillAttributes = {
      fill: this.fillColor.toHex8String(),
      alpha: ev.value.a,
      fillLinearGradientColorStops: [0, this.defaultGradientColor.toHex8String() , 1, this.fillColor.toHex8String()],
      fillRadialGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
    };
    this.konva.selectedNodes.forEach(node => {
      node.setAttrs(fillAttributes);
    });
    this.gradientBackgroundRect.setAttrs(fillAttributes);
    this.konva.redraw();
    this.gradientStage.batchDraw();
    // this.konva.updateSelected({ fill: ev.value.toHex8String(true), alpha: ev.value.a });
    // this.konva.updateSelectedFillColor(ev.value);
  }

  strokeColorChanged(ev: NgxMatColorPickerInputEvent): void {
    this.konva.updateSelected({ stroke: ev.value.toHex8String(true) });
  }

  loadFont($event: MatAutocompleteSelectedEvent): void {
    // console.log($event);
    const optionValue = $event.option.value;
    // console.log(optionValue);
    WebFontLoader.load({
      fontactive: (familyName, fvd) => { this.konva.updateSelected({ fontFamily: familyName }); },
      google: {
        families: [optionValue.family]
      }
    });
  }

  fontSizeChanged(): void {
    this.konva.updateSelected({ fontSize: this.fontSize });
  }

  textChanged(): void {
    this.konva.updateSelected({ text: this.text });
  }

  strokeEnableChanged(): void {
    this.konva.updateSelected({ strokeEnabled: this.strokeEnabled });
  }

  strokeWidthChanged(): void {
    this.konva.updateSelected({ strokeWidth: this.strokeWidth });
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

  private handleGradPointDrag(ev: KonvaEventObject<any>): void {
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
        fillRadialGradientEndRadius: (this.radialGradientRadius / 100) * node.width(),
        fillRadialGradientColorStops: [0, this.defaultGradientColor.toHex8String(), 1, this.fillColor.toHexString()],
      });
    });
    this.konva.redraw();
  }

  radialGradientRadiusChanged($event: MatSliderChange): void {
    this.gradientBackgroundRect.fillRadialGradientEndRadius((this.radialGradientRadius / 100) * this.gradientBackgroundRect.width());
    this.konva.selectedNodes.forEach(node => node.setAttr('fillRadialGradientEndRadius', (this.radialGradientRadius / 100) * node.width()));
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

  shadowChanged(): void {
    this.konva.selectedNodes.forEach(node => {
      node.setAttrs({
        shadowEnabled: this.shadow.enabled,
        shadowBlur: this.shadow.blur,
        shadowColor: this.defaultShadowColor.toHexString(),
        shadowOffset: this.shadow.offset,
        shadowOpacity: this.defaultShadowColor.a,
      });
    });
    this.konva.redraw();
  }
}
