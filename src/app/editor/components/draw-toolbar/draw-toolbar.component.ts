import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {CdkDragEnd} from '@angular/cdk/drag-drop';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {GoogleFontService, WebFont} from '@core/services/google-font.service';
import {FormControl} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import * as WebFontLoader from 'webfontloader';
import {map, startWith} from 'rxjs/operators';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {Color} from '@angular-material-components/color-picker';

@Component({
  selector: 'app-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  styleUrls: ['./draw-toolbar.component.scss']
})
export class DrawToolbarComponent implements OnInit, OnDestroy {

  @ViewChild('imageInput') imageInput: ElementRef;

  @Output() imageUploaded = new EventEmitter<{ file: File, buffer: ArrayBuffer }>();

  private subscriptions: Subscription = new Subscription();
  public imageSources: string[] = [];

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
    this.subscriptions.add(this.googleFont.getAll$('popularity').subscribe(
      fontList => this.fontList = fontList.items,
      error => console.log(error))
    );

    this.filteredFonts = this.fontFamilyControl.valueChanges.pipe(
      startWith(''),
      map( value => this._filter(value))
    );
    this.fontSizeControl.setValue(10);
    console.log(this.shadow);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  range(i: number): any[] {
    return new Array(i);
  }

  readFile(file: Blob): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (reader.readyState === reader.DONE) {
        this.imageSources.push(reader.result as string);
        const image = new Image();
        image.src = reader.result as string;
        image.onload = () => {
          this.konva.drawLogo({ image, width: image.width, height: image.height, draggable: true });
        };
      }
    };
    reader.readAsDataURL(file);
  }

  onFileChange($event: Event): void {

    const file = ($event.target as HTMLInputElement).files[0];
    if (file !== null && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      this.readFile(file);
    }
  }

  dragEnd($event: CdkDragEnd): void {
    console.log($event);
  }

  fileDropped($event: NgxFileDropEntry[]): void {
    for (const droppedFile of $event) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file( (file: File) => this.readFile(file));
      }
    }
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

  headlineTextChanged($event: Event): void {
    this.konva.changeHeadline({
      text: this.headlineText,
    });
  }

  headlineTextAlignChanged($event: MatButtonToggleChange): void {
    this.konva.changeHeadline({
      align: $event.value,
    });
  }

  decorationChanged($event: MatButtonToggleChange): void {
    console.log($event);
    console.log(this.headlineTextDecoration);
  }
}




