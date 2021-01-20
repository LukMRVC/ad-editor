import {Component, OnDestroy, OnInit} from '@angular/core';
import {GoogleFontService, WebFont} from '@core/services/google-font.service';
import {Color} from '@angular-material-components/color-picker';
import {FormControl} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {map, shareReplay, startWith} from 'rxjs/operators';
import {KonvaService} from '@core/services/konva.service';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import * as WebFontLoader from 'webfontloader';

@Component({
  selector: 'app-headline',
  templateUrl: './headline.component.html',
  styleUrls: ['./headline.component.scss']
})
export class HeadlineComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();

  headlineText = '';
  headlineTextPadding = 10;
  headlineTextDecoration = [];
  headlineFontStyle = [];
  fontList: WebFont[] = [];
  fillColor: Color = new Color(0, 0, 0, 255);

  fontFamilyControl: FormControl = new FormControl();
  fontSizeControl: FormControl = new FormControl();
  filteredFonts: Observable<WebFont[]>;

  fontLineHeight = 1;
  fontLetterSpacing = 0;
  fontScaling = 0;

  shadow = { enabled: false, color: new Color(0, 0, 0, 255), blur: 3, offsetY: 0, offsetX: 0 };


  constructor(
    public konva: KonvaService,
    public googleFont: GoogleFontService,
  ) { }

  autocompleteDisplay = ( (font: WebFont) => font?.family );

  ngOnInit(): void {
    this.subscriptions.add(this.googleFont.getAll$('popularity').pipe(shareReplay(1)).subscribe(
      fontList => this.fontList = fontList.items,
      error => console.log(error))
    );

    this.filteredFonts = this.fontFamilyControl.valueChanges.pipe(
      startWith(''),
      map( value => this._filter(value))
    );
    this.fontSizeControl.setValue(10);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadFont($event: MatAutocompleteSelectedEvent): void {
    const optionValue = $event.option.value;
    WebFontLoader.load({
      fontactive: (familyName, fvd) => { this.konva.changeHeadline({ fontFamily: familyName }); },
      google: {
        families: [optionValue.family]
      }
    });
  }

  private _filter(fontFamilyName: string): WebFont[] {
    if (fontFamilyName === '') {
      return this.fontList.slice(0, 50);
    } else if (typeof fontFamilyName === 'string') {
      const filterValue = fontFamilyName.toLowerCase();
      return this.fontList.filter(font => font.family.toLowerCase().indexOf(filterValue) === 0);
    } else {
      const filterValue = (fontFamilyName as WebFont).family.toLowerCase();
      return this.fontList.filter(font => font.family.toLowerCase().indexOf(filterValue) === 0);
    }
  }

}
