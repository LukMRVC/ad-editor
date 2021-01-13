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
  fontList: WebFont[] = [];
  fontFamilyControl: FormControl = new FormControl();
  fontSizeControl: FormControl = new FormControl();
  filteredFonts: Observable<WebFont[]>;
  fontSize = 30;
  text = '';

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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  range(i: number): any[] {
    return new Array(i);
  }

  onFileChange($event: any): void {
    const inputNode = this.imageInput.nativeElement;
    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (reader.readyState === reader.DONE) {
          // console.log(reader.result);
          this.imageUploaded.emit( { file: inputNode.files[0], buffer: reader.result as ArrayBuffer } );
        }
      };
      const file = reader.readAsArrayBuffer(inputNode.files[0]);
    }
  }

  dragEnd($event: CdkDragEnd): void {
    console.log($event);
  }

  fileDropped($event: NgxFileDropEntry[]): void {
    for (const droppedFile of $event) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file( (file: File) => {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (reader.readyState === reader.DONE) {
              console.log('Image uploaded', reader.result);
              this.imageSources.push(reader.result as string);
              const image = new window.Image();
              image.src = reader.result as string;
              this.konva.drawLogo({
                image,
                width: image.width,
                height: image.height,
                draggable: true,
              });
              // this.imageUploaded.emit();
            }
          };
          reader.readAsDataURL(file);
        });

      }
    }
  }

  loadFont($event: MatAutocompleteSelectedEvent): void {
    const optionValue = $event.option.value;
    WebFontLoader.load({
      fontactive: (familyName, fvd) => { this.konva.updateSelected({ fontFamily: familyName }); },
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




