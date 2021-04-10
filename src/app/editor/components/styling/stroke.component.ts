import {Component, Input, OnInit, EventEmitter, Output} from '@angular/core';
import {Color} from '@angular-material-components/color-picker';
import Konva from 'konva';

@Component({
  selector: 'app-stroke',
  template: `
    <!-- Stroke controls -->
    <div fxFlex fxLayout="column">
      <mat-slide-toggle #shadowToggle (change)="this.strokeChange.emit({strokeEnabled: $event.checked})">
        {{ strokeFor | titlecase }} {{ 'stroke' | translate }}
      </mat-slide-toggle>
      <ng-container *ngIf="shadowToggle.checked">
        <mat-form-field fxFlex appearance="outline">
          <mat-label>{{ 'stroke color' | translate | capitalize }}</mat-label>
          <input [(ngModel)]="strokeColor" (keydown.enter)="shadowPicker.close()" (focus)="shadowPicker.open()"
                 [ngxMatColorPicker]="shadowPicker"
                 (colorChange)="this.strokeChange.emit({stroke: $event.value.toRgbString()})" matInput #shadowPickerInput>
          <ngx-mat-color-toggle matSuffix [for]="shadowPicker"></ngx-mat-color-toggle>
          <ngx-mat-color-picker defaultColor="#000" #shadowPicker touchUi="false"></ngx-mat-color-picker>
        </mat-form-field>
        <div class="filter-slider">
          <label>{{ 'stroke width' | translate | capitalize }}</label>

          <mat-slider (input)="strokeWidth = $event.value;"
                      (change)="this.strokeChange.emit({strokeWidth: $event.value})"
                      [(ngModel)]="strokeWidth" value="1" min="1" max="30" step="1"></mat-slider>
          <span>{{ strokeWidth }}</span>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['../../../../themed-slider.scss']
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
