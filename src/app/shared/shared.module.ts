import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PopoverModule} from 'ngx-smart-popover';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PopoverModule,
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    PopoverModule,
  ]
})
export class SharedModule { }
