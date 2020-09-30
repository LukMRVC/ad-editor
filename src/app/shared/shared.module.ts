import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {KonvaService} from './services/konva.service';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';



@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    FormsModule,
  ],
  exports: [
    FormsModule
  ]
})
export class SharedModule { }
