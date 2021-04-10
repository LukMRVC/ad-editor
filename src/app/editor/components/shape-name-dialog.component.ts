import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-shape-name-dialog',
  template: `
    <mat-dialog-content>
      <mat-form-field appearance="outline">
        <mat-label>{{ 'shape name (must be unique)' | translate | titlecase }}</mat-label>
        <input [(ngModel)]="shapeName" (keydown.enter)="dialogRef.close(shapeName)" type="text" matInput name="shapeName" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button color="accent" mat-flat-button [mat-dialog-close]="shapeName">{{ 'save' | translate | capitalize }}</button>
      <button mat-flat-button mat-dialog-close>{{ 'close' | translate | capitalize }}</button>
    </mat-dialog-actions>

  `,
  styles: [
  ]
})
export class ShapeNameDialogComponent {

  shapeName = '';

  constructor(
    public dialogRef: MatDialogRef<ShapeNameDialogComponent>,
  ) { }

}
