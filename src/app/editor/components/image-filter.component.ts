import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-image-filter',
  template: `
    <div fxLayout="column" fxLayoutGap=".5rem">
      <h4>Filters</h4>

      <div class="filter-slider">
        <label>{{ 'blur' | translate | titlecase }}</label>
        <mat-slider (input)="blurRadius = $event.value;" [(ngModel)]="blurRadius" min="0" max="40" step="1"
                    (valueChange)="filterChanged.emit({ filterName: 'Blur', filterProperty: {blurRadius: $event}, minValue: 0 })"></mat-slider>
        <span>{{ blurRadius }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'brighten' | translate | titlecase }}</label>
        <mat-slider (input)="brighten = $event.value;" [(ngModel)]="brighten" min="-1" max="1" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Brighten', filterProperty: {brightness: $event}, minValue: -1 })"></mat-slider>
        <span>{{ brighten }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'contrast' | translate | titlecase }}</label>
        <mat-slider (input)="contrast = $event.value;" [(ngModel)]="contrast" min="-100" max="100" step="1"
                    (valueChange)="filterChanged.emit({ filterName: 'Contrast', filterProperty: {contrast: $event}, minValue: -100 })"></mat-slider>
        <span>{{ contrast }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'enhance' | translate | titlecase }}</label>

        <mat-slider (input)="enhance = $event.value;" [(ngModel)]="enhance" min="-1" max="1" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Enhance', filterProperty: {enhance: $event} })"></mat-slider>
        <span>{{ enhance }}</span>
      </div>

      <div fxLayoutGap=".5rem" fxLayout="row wrap">
        <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Grayscale', filterValues: $event.checked })" #grayscale>
          {{ 'grayscale' | translate | capitalize }}
        </mat-slide-toggle>

        <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Invert', filterValues: $event.checked })" #invert>
          {{ 'invert' | translate | titlecase }}
        </mat-slide-toggle>

        <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Solarize', filterValues: $event.checked })" #solarize>
          {{ 'solarize' | translate | titlecase }}
        </mat-slide-toggle>

        <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Sepia', filterValues: $event.checked })" #sepia>
          {{ 'sepia' | translate | titlecase }}
        </mat-slide-toggle>
      </div>

      <div class="filter-slider">
        <label>{{ 'mask' | translate | titlecase }}</label>

        <mat-slider (input)="maskThreshold = $event.value;" [(ngModel)]="maskThreshold" min="0" max="300" step="1"
                    (valueChange)="filterChanged.emit({ filterName: 'Mask', filterProperty: {threshold: $event}, minValue: 0 })"></mat-slider>
        <span>{{ maskThreshold }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'noise' | translate | titlecase }}</label>

        <mat-slider (input)="noise = $event.value;" [(ngModel)]="noise" min="0" max="5" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Noise', filterProperty: {noise: $event}, minValue: 0 })"></mat-slider>
        <span>{{ noise }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'pixelate' | translate | titlecase }}</label>

        <mat-slider (input)="pixelSize = $event.value;" [(ngModel)]="pixelSize" min="1" max="30" step="1"
                    (valueChange)="filterChanged.emit({ filterName: 'Pixelate', filterProperty: {pixelSize: $event}, minValue: 1 })"></mat-slider>
        <span>{{ pixelSize }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'posterize' | translate | titlecase }}</label>

        <mat-slider (input)="posterizationLevel = $event.value;" [(ngModel)]="posterizationLevel" min="0" max="1" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Posterize', minValue: 0, filterProperty: {levels: $event } })"></mat-slider>
        <span>{{ posterizationLevel }}</span>
      </div>

    </div>
  `,
  styleUrls: ['./draw-toolbar/draw-toolbar.component.scss']
})
export class ImageFilterComponent implements OnInit {

  @Output() filterChanged: EventEmitter<FilterChangedEvent> = new EventEmitter<FilterChangedEvent>();

  blurRadius = 0;
  brighten = 0;
  contrast = 0;
  enhance = 0;
  noise = 0;
  pixelSize = 1;

  maskThreshold = 0;
  posterizationLevel = 0;

  constructor() { }

  ngOnInit(): void {
  }

}

export interface FilterChangedEvent {
  filterName: string;
  filterProperty?: {};
  filterValues?: {
    hue?: number;
    saturation?: number;
    value?: number;
    luminance?: number;
    red?: number;
    green?: number;
    blue?: number;
    alpha?: number;
    embossStrength?: number;
    embossWhiteLevel?: number;
    embossDirection?: string,
    embossBlend?: boolean;
  }|number|boolean;
  minValue?: number;
}
