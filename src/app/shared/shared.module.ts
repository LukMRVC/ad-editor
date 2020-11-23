import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PopoverModule} from 'ngx-smart-popover';
import {DragDropModule} from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PopoverModule,
    DragDropModule
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    PopoverModule,
    DragDropModule,
  ]
})
export class SharedModule { }
