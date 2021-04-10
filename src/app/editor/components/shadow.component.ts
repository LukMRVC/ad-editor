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
        {{ 'shadow_for' | translate:{ shape: (this.shadowFor | translate ) } | capitalize }}
      </mat-slide-toggle>
      <ng-container *ngIf="shadowToggle.checked">
        <mat-form-field fxFlex appearance="outline">
          <mat-label>{{ shadowFor | translate | titlecase }} {{ 'shadow color' | translate | capitalize }}</mat-label>
          <input [(ngModel)]="shadowColor" (keydown.enter)="shadowPicker.close()" (focus)="shadowPicker.open()"
                 [ngxMatColorPicker]="shadowPicker"
                 (colorChange)="this.shadowChange.emit({shadowColor: $event.value.toRgbString()})" matInput #shadowPickerInput>
          <ngx-mat-color-toggle matSuffix [for]="shadowPicker"></ngx-mat-color-toggle>
          <ngx-mat-color-picker defaultColor="#000" #shadowPicker touchUi="false"></ngx-mat-color-picker>
        </mat-form-field>
        <div class="filter-slider">
          <label>{{ shadowFor | translate | titlecase }} {{ 'shadow blur' | translate | titlecase }}</label>

          <mat-slider (input)="shadowBlur = $event.value;" (change)="this.shadowChange.emit({shadowBlur: $event.value})"
                      [(ngModel)]="shadowBlur" min="0" max="40" step="1"></mat-slider>
          <span>{{ shadowBlur }}</span>
        </div>
        <div class="filter-slider">
          <label>{{ shadowFor | translate | titlecase }} {{ 'shadow x offset' | translate | titlecase }}</label>

          <mat-slider (input)="shadowOffsetX = $event.value;" (change)="this.shadowChange.emit({shadowOffsetX: $event.value})"
                      [(ngModel)]="shadowOffsetX" min="-40" max="40" step="1"></mat-slider>
          <span>{{ shadowOffsetX }}</span>
        </div>
        <div class="filter-slider">
          <label>{{ shadowFor | translate | titlecase }} {{ 'shadow y  offset' | translate | titlecase }}</label>

          <mat-slider (input)="shadowOffsetY = $event.value;" (change)="this.shadowChange.emit({shadowOffsetY: $event.value})"
                      [(ngModel)]="shadowOffsetY" min="-40" max="40" step="1"></mat-slider>
          <span>{{ shadowOffsetY }}</span>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['../../../themed-slider.scss']
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
