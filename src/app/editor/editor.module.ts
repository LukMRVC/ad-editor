import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './pages/editor/editor.component';
import { DrawToolbarComponent } from './components/draw-toolbar/draw-toolbar.component';
import {SharedModule} from '@shared/shared.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MaterialModule} from '@shared/material.module';
import {EditorRoutingModule} from './editor-routing.module';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { CanvasObjectToolbarComponent } from './components/canvas-object-toolbar/canvas-object-toolbar.component';
import { StageLayersComponent } from './components/stage-layers/stage-layers.component';

import {
  faMousePointer,
  faFillDrip,
  faShapes,
  faLayerGroup,
  faArrowsAltH,
  faArrowsAltV,
  faLongArrowAltUp, faLongArrowAltDown, faAngleDoubleUp, faAngleDoubleDown, faAlignCenter, faAlignLeft,
  faAlignRight, faAlignJustify
} from '@fortawesome/free-solid-svg-icons';

@NgModule({
  declarations: [
    EditorComponent,
    DrawToolbarComponent,
    CanvasObjectToolbarComponent,
    StageLayersComponent,
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
    lib.addIcons(faMousePointer, faFillDrip, faLayerGroup, faShapes, faArrowsAltH, faArrowsAltV);
    lib.addIcons(faLongArrowAltUp, faLongArrowAltDown, faAngleDoubleUp, faAngleDoubleDown);
    // lib.addIcons(faAlignCenter, faAlignLeft, faAlignRight, faAlignJustify);
  }
}
