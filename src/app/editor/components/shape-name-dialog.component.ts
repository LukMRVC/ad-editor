import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {BannerDataService} from '@core/services/banner-data.service';

@Component({
  selector: 'app-shape-name-dialog',
  template: `
    <mat-dialog-content>
      <mat-form-field [color]="this.hasError ? 'warn' : 'primary'" appearance="outline">
        <mat-label>{{ 'shape name (must be unique)' | translate | titlecase }}</mat-label>
        <input [(ngModel)]="shapeName" (keydown.enter)="addShape()" type="text" matInput name="shapeName" />
        <mat-error *ngIf="this.hasError">{{ 'shape already exists' | translate | capitalize }}</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button color="accent" mat-flat-button (click)="addShape()">{{ 'save' | translate | capitalize }}</button>
      <button mat-flat-button mat-dialog-close>{{ 'close' | translate | capitalize }}</button>
    </mat-dialog-actions>

  `,
  styles: [
  ]
})
export class ShapeNameDialogComponent {

  shapeName = '';
  hasError = false;

  constructor(
    public dataService: BannerDataService,
    public dialogRef: MatDialogRef<ShapeNameDialogComponent>,
  ) { }

  public addShape(): void {
    if (this.dataService.userShapes.some(shape => shape.userShapeName.slugify() === this.shapeName)) {
      this.hasError = true;
      return;
    } else {
      this.dialogRef.close(this.shapeName);
    }
  }

}
