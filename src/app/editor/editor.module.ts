import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './pages/editor/editor.component';
import { DrawToolbarComponent } from './components/draw-toolbar/draw-toolbar.component';
import {SharedModule} from '@shared/shared.module';
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
  faLongArrowAltUp, faLongArrowAltDown, faAngleDoubleUp, faAngleDoubleDown,
} from '@fortawesome/free-solid-svg-icons';
import { LogoComponent } from './components/logo/logo.component';
import { HeadlineComponent } from './components/headline/headline.component';
import { BackgroundComponent } from './components/background/background.component';
import { ButtonComponent } from './components/button/button.component';
import { FontChooserComponent } from './components/styling/text/font-chooser.component';
import { TextHAlignmentComponent } from './components/styling/text/text-h-alignment.component';
import { TextVAlignmentComponent } from './components/styling/text/text-v-alignment.component';
import { TextDecorationComponent } from './components/styling/text/text-decoration.component';
import { ShadowComponent } from './components/shadow.component';
import { ImageFilterComponent } from './components/image-filter.component';
import { ShapeDataComponent } from './components/shape-data/shape-data.component';
import { ShapeNameDialogComponent } from './components/shape-name-dialog.component';
import { TextStyleComponent } from './components/styling/text/text-style.component';
import { StrokeComponent } from './components/styling/stroke.component';
import { ShapeBgColorComponent } from './components/styling/shape-bg-color.component';

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
    ImageFilterComponent,
    ShapeDataComponent,
    ShapeNameDialogComponent,
    TextStyleComponent,
    StrokeComponent,
    ShapeBgColorComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    EditorRoutingModule,
    FontAwesomeModule,
  ],

})
export class EditorModule {
  constructor(lib: FaIconLibrary) {
    lib.addIcons(faMousePointer, faFillDrip, faLayerGroup, faShapes, faArrowsAltH, faArrowsAltV);
    lib.addIcons(faLongArrowAltUp, faLongArrowAltDown, faAngleDoubleUp, faAngleDoubleDown);
  }
}
