import {Component, Input, OnInit, EventEmitter, Output} from '@angular/core';
import {Color} from '@angular-material-components/color-picker';
import Konva from 'konva';

@Component({
  selector: 'app-stroke',
  template: `
    <!-- Stroke controls -->
    <div fxFlex fxLayout="column">
      <mat-slide-toggle #shadowToggle (change)="this.strokeChange.emit({strokeEnabled: $event.checked})">
        {{ strokeFor | titlecase }} stroke
      </mat-slide-toggle>
      <ng-container *ngIf="shadowToggle.checked">
        <mat-form-field fxFlex appearance="outline">
          <mat-label>{{ strokeFor | titlecase }} stroke color</mat-label>
          <input [(ngModel)]="strokeColor" (keydown.enter)="shadowPicker.close()" (focus)="shadowPicker.open()"
                 [ngxMatColorPicker]="shadowPicker"
                 (colorChange)="this.strokeChange.emit({stroke: $event.value.toRgbString()})" matInput #shadowPickerInput>
          <ngx-mat-color-toggle matSuffix [for]="shadowPicker"></ngx-mat-color-toggle>
          <ngx-mat-color-picker defaultColor="#000" #shadowPicker touchUi="false"></ngx-mat-color-picker>
        </mat-form-field>
        <div fxFlex fxLayout="column">
          <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
            <label>{{ strokeFor | titlecase }} stroke width</label>
            <span>{{ strokeWidth }}px</span>
          </div>
          <mat-slider (change)="this.strokeChange.emit({strokeWidth: $event.value})"
                      [(ngModel)]="strokeWidth" thumbLabel value="1" min="1" max="30" step="1"></mat-slider>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
  ]
})
export class StrokeComponent implements OnInit {

  @Input() strokeFor: string;
  @Output() strokeChange = new EventEmitter<Konva.TagConfig>();
  strokeColor: Color|null = new Color(0, 0, 0, 255);
  strokeWidth = 1;

  constructor() { }

  ngOnInit(): void {
  }

}
