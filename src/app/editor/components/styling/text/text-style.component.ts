import {Component, Input, OnInit} from '@angular/core';
import {Color} from '@angular-material-components/color-picker';
import {FormControl} from '@angular/forms';
import {KonvaService} from '@core/services/konva.service';

@Component({
  selector: 'app-text-style',
  template: `
    <div fxLayout="column" fxLayoutGap="0.5rem">
      <app-font-chooser (fontFamilyLoaded)="konva.changeHeadline({ fontFamily: $event })"></app-font-chooser>
      <app-text-h-alignment (alignmentChanged)="konva.changeHeadline({align: $event})"></app-text-h-alignment>
      <app-text-v-alignment (alignmentChanged)="konva.changeHeadline({verticalAlign: $event})"></app-text-v-alignment>
      <app-text-decoration (decorationChanged)="konva.changeHeadline($event)"></app-text-decoration>
      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Line height</label>
          <span>{{ fontLineHeight }}</span>
        </div>
        <mat-slider (change)="konva.changeHeadline({lineHeight: fontLineHeight})"
                    [(ngModel)]="fontLineHeight" thumbLabel min="1" max="5" step="0.1" value="1"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Letter spacing</label>
          <span>{{ fontLetterSpacing }}</span>
        </div>
        <mat-slider (change)="konva.changeHeadline({letterSpacing: fontLetterSpacing})"
                    [(ngModel)]="fontLetterSpacing" thumbLabel min="-10" max="10" step="0.1" value="0"></mat-slider>
      </div>

      <div fxFlex fxLayout="column">
        <div class="slider-label" fxLayout="row" fxLayoutAlign="space-between end">
          <label>Font size</label>
          <span>{{ fontScaling }}%</span>
        </div>
        <mat-slider (change)="konva.changeHeadline({fontScaling: fontScaling})"
                    [(ngModel)]="fontScaling" thumbLabel min="-10" max="10" step="0.1" value="0"></mat-slider>
      </div>

      <mat-form-field fxFlex appearance="outline">
        <mat-label>Color</mat-label>
        <input [(ngModel)]="fillColor" (keydown.enter)="fillPicker.close()" (focus)="fillPicker.open()"
               [ngxMatColorPicker]="fillPicker"
               (colorChange)="konva.changeHeadline({fill: fillColor.toHex8String()})" matInput #fillColourInput>
        <ngx-mat-color-toggle matSuffix [for]="fillPicker"></ngx-mat-color-toggle>
        <ngx-mat-color-picker defaultColor="#000" #fillPicker touchUi="false"></ngx-mat-color-picker>
      </mat-form-field>

      <!-- Shadow controls -->
      <app-shadow shadowFor="headline" (shadowChange)="konva.changeHeadline($event)"></app-shadow>
    </div>

  `,
  styles: [
  ]
})
export class TextStyleComponent implements OnInit {

  @Input() shapeName: string;

  headlineTextPadding = 10;
  fillColor: Color = new Color(0, 0, 0, 255);

  fontSizeControl: FormControl = new FormControl();
  fontLineHeight = 1;
  fontLetterSpacing = 0;
  fontScaling = 0;

  shadow = { enabled: false, color: new Color(0, 0, 0, 255), blur: 3, offsetY: 0, offsetX: 0 };

  constructor(
    public konva: KonvaService,
  ) { }

  ngOnInit(): void {
    this.fontSizeControl.setValue(10);
  }

}