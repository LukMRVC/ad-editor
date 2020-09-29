import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './pages/editor/editor.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { DrawToolbarComponent } from './components/draw-toolbar/draw-toolbar.component';
import {SharedModule} from '../shared/shared.module';



@NgModule({
  declarations: [
    EditorComponent,
    CanvasComponent,
    DrawToolbarComponent],
  imports: [
    CommonModule,
    SharedModule,
  ]
})
export class EditorModule { }
