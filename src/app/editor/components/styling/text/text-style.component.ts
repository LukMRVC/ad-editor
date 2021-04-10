import {Component, Input, OnInit} from '@angular/core';
import {Color} from '@angular-material-components/color-picker';
import {FormControl} from '@angular/forms';
import {TextDrawingService} from '@core/services/drawing/text-drawing.service';

@Component({
  selector: 'app-text-style',
  template: `
    <div fxLayout="column" fxLayoutGap="0.5rem">
      <app-font-chooser (fontFamilyLoaded)="textService.updateText(shapeName.slugify(), { fontFamily: $event })"></app-font-chooser>
      <app-text-h-alignment (alignmentChanged)="textService.updateText(shapeName.slugify(), {align: $event})"></app-text-h-alignment>
      <app-text-v-alignment (alignmentChanged)="textService.updateText(shapeName.slugify(), {verticalAlign: $event})"></app-text-v-alignment>
      <app-text-decoration (decorationChanged)="textService.updateText(shapeName.slugify(), $event)"></app-text-decoration>
      <div class="filter-slider">
        <label>{{ 'line height' | translate | capitalize }}</label>

        <mat-slider (input)="fontLineHeight = $event.value;"
                    (change)="textService.updateText(this.shapeName.slugify(), {lineHeight: fontLineHeight})"
                    [(ngModel)]="fontLineHeight" min="1" max="5" step="0.1" value="1"></mat-slider>
        <span>{{ fontLineHeight }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'letter spacing' | translate | capitalize }}</label>

        <mat-slider (input)="fontLetterSpacing = $event.value;"
                    (change)="textService.updateText(this.shapeName.slugify(), {letterSpacing: fontLetterSpacing})"
                    [(ngModel)]="fontLetterSpacing" min="-10" max="10" step="0.1" value="0"></mat-slider>
        <span>{{ fontLetterSpacing }}</span>
      </div>

      <div class="filter-slider">
        <label>{{ 'font size' | translate | capitalize }}</label>

        <mat-slider (input)="fontScaling = $event.value;"
                    (change)="textService.updateText(this.shapeName.slugify(), {fontScaling: fontScaling})"
                    [(ngModel)]="fontScaling" min="-10" max="10" step="0.1" value="0"></mat-slider>
        <span>{{ fontScaling }}%</span>
      </div>

      <mat-form-field fxFlex appearance="outline">
        <mat-label>{{ 'color' | translate | capitalize }}</mat-label>
        <input [(ngModel)]="fillColor" (keydown.enter)="fillPicker.close()" (focus)="fillPicker.open()"
               [ngxMatColorPicker]="fillPicker"
               (colorChange)="textService.updateText(this.shapeName.slugify(), {fill: fillColor.toHex8String()})" matInput #fillColourInput>
        <ngx-mat-color-toggle matSuffix [for]="fillPicker"></ngx-mat-color-toggle>
        <ngx-mat-color-picker defaultColor="#000" #fillPicker touchUi="false"></ngx-mat-color-picker>
      </mat-form-field>

      <!-- Shadow controls -->
      <app-shadow [shadowFor]="shapeName.slugify()" (shadowChange)="textService.updateText(this.shapeName.slugify(), $event)"></app-shadow>
    </div>

  `,
  styleUrls: ['../../../../../themed-slider.scss']
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
    public textService: TextDrawingService,
  ) { }

  ngOnInit(): void {
    this.fontSizeControl.setValue(10);
  }

}
