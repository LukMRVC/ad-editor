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
import { LogoComponent } from './components/logo/logo.component';
import { HeadlineComponent } from './components/headline/headline.component';
import { BackgroundComponent } from './components/background/background.component';
import { ButtonComponent } from './components/button/button.component';
import { FontChooserComponent } from './components/font-chooser/font-chooser.component';
import { TextHAlignmentComponent } from './components/text-h-alignment.component';
import { TextVAlignmentComponent } from './components/text-v-alignment.component';
import { TextDecorationComponent } from './components/text-decoration.component';
import { ShadowComponent } from './components/shadow.component';

@NgModule({
  declarations: [
    EditorComponent,
    DrawToolbarComponent,
    CanvasObjectToolbarComponent,
    StageLayersComponent,
    LogoComponent,
    HeadlineComponent,
    BackgroundComponent,
    ButtonComponent,
    FontChooserComponent,
    TextHAlignmentComponent,
    TextVAlignmentComponent,
    TextDecorationComponent,
    ShadowComponent,
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
