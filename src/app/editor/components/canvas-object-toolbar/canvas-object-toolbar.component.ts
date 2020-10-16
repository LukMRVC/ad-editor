import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {Observable, Subscription} from 'rxjs';
import {ThemePalette} from '@angular/material/core';
import {NgxMatColorPickerInputEvent} from '@angular-material-components/color-picker';
import {GoogleFontService, WebFont} from '@shared/services/google-font.service';
import {FormControl} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-canvas-object-toolbar',
  templateUrl: './canvas-object-toolbar.component.html',
  styleUrls: ['./canvas-object-toolbar.component.scss']
})
export class CanvasObjectToolbarComponent implements OnInit, OnDestroy {

  canvasObjectType: 'image' | 'text' | 'shape' | 'background';

  subscription: Subscription = new Subscription();
  fillColour: ThemePalette = 'primary';
  fontList: WebFont[] = [];
  fontFamilyControl: FormControl = new FormControl();
  filteredFonts: Observable<WebFont[]>;


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
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private _filter(fontFamilyName: string): WebFont[] {
    // console.log(fontFamilyName);
    if (fontFamilyName === '') {
      return this.fontList.slice(0, 50);
    }
    const filterValue = fontFamilyName.toLowerCase();
    return this.fontList.filter(font => font.family.toLowerCase().indexOf(filterValue) === 0);
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
