import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '../../../shared/services/konva.service';
import {Subscription} from 'rxjs';
import {ThemePalette} from '@angular/material/core';
import {NgxMatColorPickerInputEvent} from '@angular-material-components/color-picker';

@Component({
  selector: 'app-canvas-object-toolbar',
  templateUrl: './canvas-object-toolbar.component.html',
  styleUrls: ['./canvas-object-toolbar.component.scss']
})
export class CanvasObjectToolbarComponent implements OnInit, OnDestroy {

  canvasObjectType: 'image' | 'text' | 'shape' | 'background';

  typeSubscription: Subscription;
  fillColour: ThemePalette = 'primary';

  constructor(
    public konva: KonvaService
  ) {
    this.typeSubscription = this.konva.$selectedObjectType.subscribe(objectType => this.canvasObjectType = objectType);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.typeSubscription.unsubscribe();
  }

  fillColorChanged(ev: NgxMatColorPickerInputEvent): void {
    // console.log(ev.value.toRgba());
    this.konva.updateSelectedFillColor(ev.value);
    // this.konva.updateSelectedFillColor(ev.value);
  }

  strokeColorChanged(ev: NgxMatColorPickerInputEvent): void {
    this.konva.updateSelectedStrokeColor(ev.value);
  }

}
