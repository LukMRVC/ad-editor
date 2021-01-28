import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {GoogleFontService, WebFont} from '@core/services/google-font.service';
import {FormControl} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {map, shareReplay, startWith} from 'rxjs/operators';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import * as WebFontLoader from 'webfontloader';


@Component({
  selector: 'app-font-chooser',
  templateUrl: './font-chooser.component.html',
  styleUrls: ['./font-chooser.component.scss']
})
export class FontChooserComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();

  fontList: WebFont[] = [];
  fontFamilyControl: FormControl = new FormControl();
  filteredFonts: Observable<WebFont[]>;

  @Output() fontFamilyLoaded: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    public googleFont: GoogleFontService,
  ) { }

  autocompleteDisplay = ( (font: WebFont) => font?.family );


  ngOnInit(): void {
    this.subscriptions.add(this.googleFont.getAll$('popularity').subscribe(
      fontList => this.fontList = fontList.items,
      error => console.log(error))
    );

    this.filteredFonts = this.fontFamilyControl.valueChanges.pipe(
      startWith(''),
      map( value => this._filter(value))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadFont($event: MatAutocompleteSelectedEvent): void {
    const optionValue = $event.option.value;
    WebFontLoader.load({
      fontactive: (familyName, fvd) => { this.fontFamilyLoaded.emit(familyName); },
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