import { Component, OnInit } from '@angular/core';
import {BannerDataService} from '@core/services/banner-data.service';
import {MatDialogRef} from '@angular/material/dialog';
import {KonvaService} from '@core/services/konva.service';

@Component({
  selector: 'app-export-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'export' | translate | capitalize }}</h2>
    <mat-dialog-content>
      <div fxLayout="column" fxLayoutGap=".5rem">
        <div fxLayout="row" fxLayoutGap="1rem" fxLayoutAlign="space-evenly stretch" >
          <div #bannerCheckboxes fxLayout="column" fxLayoutGap="0.25rem">
            <mat-checkbox [(ngModel)]="includeTemplate">{{ 'include template' | translate | titlecase }}</mat-checkbox>
            <mat-checkbox [indeterminate]="this.selectedDatasets.length > 0 && this.selectedDatasets.length !== this.dataService.datasets.length"
                          [checked]="this.selectedDatasets.length === this.dataService.datasets.length"
                          (change)="setAll($event.checked)" color="primary">{{ 'all datasets' | translate | titlecase }}</mat-checkbox>
            <ul style="list-style-type: none;">
              <li *ngFor="let dataset of dataService.datasets">
                <mat-checkbox (change)="pushOrRemove($event.checked, dataset.datasetName)"
                              [checked]="selectedDatasets.includes(dataset.datasetName)" color="accent">
                  {{ dataset.datasetName }}
                </mat-checkbox>
              </li>
            </ul>
          </div>

          <div #outputFormatDiv fxLayout="column" fxLayoutGap=".25rem">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'output format' | translate | titlecase }}</mat-label>
              <mat-select (valueChange)="calcMaxEstimatedSize()" [(ngModel)]="outputFormat">
                <mat-option value="jpeg">JPG</mat-option>
                <mat-option value="png">PNG</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'pixel ratio' | translate | titlecase }}</mat-label>
              <input (change)="calcMaxEstimatedSize()" min="1" step="1" type="number" matInput [(ngModel)]="pixelRatio">
            </mat-form-field>

            <div *ngIf="outputFormat === 'jpeg'">
              <div>
                <mat-form-field appearance="outline">
                  <mat-label>{{ 'image quality' | translate | titlecase }}</mat-label>
                  <input (ngModelChange)="calcMaxEstimatedSize();" type="number" matInput [(ngModel)]="jpegQuality" min="1" max="100">
                </mat-form-field>
              </div>
              <label>{{ 'image quality' | translate | titlecase }}</label>
              <mat-slider (change)="calcMaxEstimatedSize()" [(ngModel)]="jpegQuality" min="1" max="100" color="accent" thumbLabel></mat-slider>
            </div>
          </div>
        </div>
        <h4>{{ 'biggest estimated file size' | translate | capitalize }}: {{ this.maxEstimatedSize }} KB</h4>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button color="primary" (click)="closeDialog()" mat-raised-button>{{ 'export' | translate | capitalize }}</button>
    </mat-dialog-actions>
  `,
  styles: [
  ]
})
export class ExportDialogComponent implements OnInit {

  outputFormat = 'png';
  jpegQuality = 100;
  selectedDatasets: string[] = [];
  includeTemplate = true;
  pixelRatio = 1;
  maxEstimatedSize = 0;

  constructor(
    public dataService: BannerDataService,
    public dlgRef: MatDialogRef<ExportDialogComponent>,
    public konvaService: KonvaService,
  ) { }

  ngOnInit(): void {
    this.selectedDatasets = this.dataService.datasets.map(d => d.datasetName);
    this.calcMaxEstimatedSize();
  }

  public async calcMaxEstimatedSize(): Promise<void> {
    const sizes = [];
    for (const group of this.konvaService.getBannerGroups()) {
      const img = await this.konvaService.exportGroupToImage(group, this.exportSettings());
      const imgSize = this.calcImageSizeFromBase64(img);
      sizes.push(Math.round(imgSize / 1024) );
    }
    this.maxEstimatedSize = Math.max(...sizes);
  }

  public setAll(checked: boolean): void {
    if (checked) {
      this.selectedDatasets = this.dataService.datasets.map(d => d.datasetName);
    } else {
      this.selectedDatasets = [];
    }
  }

  public pushOrRemove(checked: boolean, datasetName: string): void {
    if (checked) {
      this.selectedDatasets.push(datasetName);
    } else {
      this.selectedDatasets.splice(this.selectedDatasets.indexOf(datasetName), 1);
    }
  }

  private exportSettings(): ExportDialogResult {
    return {
      withTemplate: this.includeTemplate,
      datasets: this.selectedDatasets,
      mimeType: (`image/${this.outputFormat}` as 'image/jpeg'|'image/png'),
      quality: this.jpegQuality / 100,
      pixelRatio: this.pixelRatio,
    };
  }

  closeDialog(): void {
    this.dlgRef.close(this.exportSettings());
  }

  public calcImageSizeFromBase64(base64img: string): number {
    // some magic constants taken from
    // https://stackoverflow.com/questions/29939635/how-to-get-file-size-of-newly-created-image-if-src-is-base64-string/49750491#49750491
    return 4 * Math.ceil( base64img.length / 3 ) * 0.5624896334383812;
  }
}

export interface ExportDialogResult {
  withTemplate: boolean;
  datasets: string[];
  mimeType: 'image/jpeg'|'image/png';
  quality: number;
  pixelRatio: number;
}
