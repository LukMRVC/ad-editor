import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-image-filter',
  template: `
    <div fxLayout="column" fxLayoutGap=".5rem">
      <h4>Filters</h4>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Image blur</label>
          <span>{{ blurRadius }}</span>
        </div>
        <mat-slider [(ngModel)]="blurRadius" thumbLabel min="0" max="40" step="0.5"
                    (valueChange)="filterChanged.emit({ filterName: 'Blur', filterProperty: {blurRadius: $event}, minValue: 0 })"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Brighten image</label>
          <span>{{ brighten }}</span>
        </div>
        <mat-slider [(ngModel)]="brighten" thumbLabel min="-1" max="1" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Brighten', filterProperty: {brightness: $event}, minValue: -1 })"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Contrast</label>
          <span>{{ contrast }}</span>
        </div>
        <mat-slider [(ngModel)]="contrast" thumbLabel min="-100" max="100" step="1"
                    (valueChange)="filterChanged.emit({ filterName: 'Contrast', filterProperty: {contrast: $event}, minValue: -100 })"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Enhance</label>
          <span>{{ enhance }}</span>
        </div>
        <mat-slider [(ngModel)]="enhance" thumbLabel min="-1" max="1" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Enhance', filterProperty: {enhance: $event} })"></mat-slider>
      </div>

      <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Grayscale', filterValues: $event.checked })" #grayscale>
        Grayscale
      </mat-slide-toggle>

      <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Invert', filterValues: $event.checked })" #invert>
        Invert
      </mat-slide-toggle>

      <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Solarize', filterValues: $event.checked })" #solarize>
        Solarize
      </mat-slide-toggle>

      <mat-slide-toggle (change)="filterChanged.emit({ filterName: 'Sepia', filterValues: $event.checked })" #sepia>
        Sepia
      </mat-slide-toggle>


      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Mask</label>
          <span>{{ maskThreshold }}</span>
        </div>
        <mat-slider [(ngModel)]="maskThreshold" thumbLabel min="0" max="300" step="1"
                    (valueChange)="filterChanged.emit({ filterName: 'Mask', filterProperty: {threshold: $event}, minValue: 0 })"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Noise</label>
          <span>{{ noise }}</span>
        </div>
        <mat-slider [(ngModel)]="noise" thumbLabel min="0" max="5" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Noise', filterProperty: {noise: $event}, minValue: 0 })"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Pixelate</label>
          <span>{{ pixelSize }}</span>
        </div>
        <mat-slider [(ngModel)]="pixelSize" thumbLabel min="1" max="30" step="1"
                    (valueChange)="filterChanged.emit({ filterName: 'Pixelate', filterProperty: {pixelSize: $event}, minValue: 1 })"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Posterize</label>
          <span>{{ posterizationLevel }}</span>
        </div>
        <mat-slider [(ngModel)]="posterizationLevel" thumbLabel min="0" max="1" step="0.1"
                    (valueChange)="filterChanged.emit({ filterName: 'Posterize', minValue: 0, filterProperty: {levels: $event } })"></mat-slider>
      </div>

    </div>
  `,
  styles: [
  ]
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
