import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PopoverModule} from 'ngx-smart-popover';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {NgxFileDropModule} from 'ngx-file-drop';
import { ImageGalleryDialogComponent } from './components/image-gallery-dialog.component';
import {MaterialModule} from '@shared/material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {HttpClientModule} from '@angular/common/http';
import { HideableDirective } from './directives/hideable.directive';
import { ShapeDisplayDialogComponent } from './components/shape-display-dialog.component';
import { SlugifyPipe } from './pipes/slugify.pipe';
import { UnslugifyPipe } from './pipes/unslugify.pipe';


@NgModule({
  declarations: [
    ImageGalleryDialogComponent,
    HideableDirective,
    ShapeDisplayDialogComponent,
    SlugifyPipe,
    UnslugifyPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PopoverModule,
    DragDropModule,
    NgxFileDropModule,
    MaterialModule,
    FlexLayoutModule,
    HttpClientModule,
  ],
    exports: [
        ReactiveFormsModule,
        FormsModule,
        PopoverModule,
        DragDropModule,
        NgxFileDropModule,
        MaterialModule,
        FlexLayoutModule,
        HttpClientModule,
        HideableDirective,
    ],
  entryComponents: [
    ImageGalleryDialogComponent,
  ]
})
export class SharedModule { }
