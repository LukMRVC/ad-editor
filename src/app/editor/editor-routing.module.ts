import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {EditorComponent} from './pages/editor/editor.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: EditorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditorRoutingModule { }
