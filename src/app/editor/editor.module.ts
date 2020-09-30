import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './pages/editor/editor.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { DrawToolbarComponent } from './components/draw-toolbar/draw-toolbar.component';
import {SharedModule} from '../shared/shared.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MaterialModule} from '../shared/material.module';
import {EditorRoutingModule} from './editor-routing.module';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faMousePointer} from '@fortawesome/free-solid-svg-icons';
import { CanvasObjectToolbarComponent } from './components/canvas-object-toolbar/canvas-object-toolbar.component';
import {faFillDrip} from '@fortawesome/free-solid-svg-icons/faFillDrip';

@NgModule({
  declarations: [
    EditorComponent,
    CanvasComponent,
    DrawToolbarComponent,
    CanvasObjectToolbarComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    EditorRoutingModule,
    FlexLayoutModule,
    MaterialModule,
    FontAwesomeModule,
  ],
})
export class EditorModule {
  constructor(lib: FaIconLibrary) {
    lib.addIcons(faMousePointer, faFillDrip);
  }
}
