import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PopoverModule} from 'ngx-smart-popover';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {NgxFileDropModule} from 'ngx-file-drop';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PopoverModule,
    DragDropModule,
    NgxFileDropModule,
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    PopoverModule,
    DragDropModule,
    NgxFileDropModule,
  ]
})
export class SharedModule { }
