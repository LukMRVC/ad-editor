import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import './utils/prototypes';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
  ],
  exports: [
    HttpClientModule,
  ],
})
export class CoreModule { }
