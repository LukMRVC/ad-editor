import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {Color} from '@angular-material-components/color-picker';

interface ShadowConfig {
  shadowEnabled?: boolean;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowColor?: string;
}

@Component({
  selector: 'app-shadow',
  template: `
    <!-- Shadow controls -->
    <div fxFlex fxLayout="column">
      <mat-slide-toggle #shadowToggle (change)="this.shadowChange.emit({shadowEnabled: $event.checked})">
        {{ shadowFor | titlecase }} shadow
      </mat-slide-toggle>
      <ng-container *ngIf="shadowToggle.checked">
        <mat-form-field fxFlex appearance="outline">
          <mat-label>{{ shadowFor | titlecase }} shadow color</mat-label>
          <input [(ngModel)]="shadowColor" (keydown.enter)="shadowPicker.close()" (focus)="shadowPicker.open()"
                 [ngxMatColorPicker]="shadowPicker"
                 (colorChange)="this.shadowChange.emit({shadowColor: $event.value.toRgbString()})" matInput #shadowPickerInput>
          <ngx-mat-color-toggle matSuffix [for]="shadowPicker"></ngx-mat-color-toggle>
          <ngx-mat-color-picker defaultColor="#000" #shadowPicker touchUi="false"></ngx-mat-color-picker>
        </mat-form-field>
        <div fxFlex fxLayout="column">
          <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
            <label>{{ shadowFor | titlecase }} shadow blur</label>
            <span>{{ shadowBlur }}px</span>
          </div>
          <mat-slider (change)="this.shadowChange.emit({shadowBlur: $event.value})"
                      [(ngModel)]="shadowBlur" thumbLabel min="0" max="40" step="1"></mat-slider>
        </div>
        <div fxFlex fxLayout="column">
          <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
            <label>{{ shadowFor | titlecase }} shadow X offset</label>
            <span>{{ shadowOffsetX }}px</span>
          </div>
          <mat-slider (change)="this.shadowChange.emit({shadowOffsetX: $event.value})"
                      [(ngModel)]="shadowOffsetX" thumbLabel min="-40" max="40" step="1"></mat-slider>
        </div>
        <div fxFlex fxLayout="column">
          <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
            <label>{{ shadowFor | titlecase }} shadow Y offset</label>
            <span>{{ shadowOffsetY }}px</span>
          </div>
          <mat-slider (change)="this.shadowChange.emit({shadowOffsetY: $event.value})"
                      [(ngModel)]="shadowOffsetY" thumbLabel min="-40" max="40" step="1"></mat-slider>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
  ]
})
export class ShadowComponent implements OnInit {

  @Input() shadowFor: string|null = null;
  shadowEnabled: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur = 5;
  shadowColor: Color|null = new Color(0, 0, 0, 255);

  @Output() shadowChange = new EventEmitter<ShadowConfig>();

  constructor() { }

  ngOnInit(): void {
  }

}
