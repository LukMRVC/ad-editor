import { Component, OnInit } from '@angular/core';
import {BannerDataService} from '@core/services/banner-data.service';
import {MatDialog} from '@angular/material/dialog';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {UploadedImage} from '@core/services/image-gallery.service';
import {KonvaService} from '@core/services/konva.service';
import {ShapeInformation} from '@core/models/dataset';
import {ShapeNameDialogComponent} from '../shape-name-dialog.component';
import {ShapeDisplayDialogComponent} from '@shared/components/shape-display-dialog.component';
import {UnknownColumnError} from '@core/unknown-column-error';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-shape-data',
  templateUrl: './shape-data.component.html',
  styleUrls: ['./shape-data.component.scss'],
})
export class ShapeDataComponent implements OnInit {

  selectedSet: string;
  isHidden = false;

  constructor(
    public dataService: BannerDataService,
    public dialog: MatDialog,
    public konva: KonvaService,
    public snackBar: MatSnackBar,
    public translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.selectedSet = this.dataService.datasets.keys().next().value;
  }

  async openGallery(datasetKey: string, shapeInfo: ShapeInformation): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    if (img) {
      this.dataService.changeValue(datasetKey, shapeInfo, (img as UploadedImage).name);
    }
  }

  changeDataset(key: string): void {
    this.selectedSet = key;
    this.dataService.setActiveDataset(key);
  }

  async displayOptions(): Promise<void> {
    const dlg = this.dialog.open(ShapeDisplayDialogComponent, {
      maxWidth: '70%', minWidth: '50%', data: this.dataService.getActiveDataset()
    });
    await dlg.afterClosed().toPromise();
    this.dataService.setActiveDataset(this.dataService.activeDataset);
  }

  async addShape(shapeType: 'image'|'text'|'rect'|'circle'): Promise<void> {
    const dlg = this.dialog.open(ShapeNameDialogComponent);
    const userShapeName = await dlg.afterClosed().toPromise();
    if (userShapeName) {
      this.dataService.addShape(userShapeName, shapeType);
      if (shapeType === 'image') {
        const addedShape = this.dataService.getActiveDataset().find(s => s.userShapeName === userShapeName);
        await this.openGallery(this.dataService.activeDataset, addedShape);
      }
    }
  }

  async uploadDatasets($event: Event): Promise<void> {
    // try {
    await this.dataService.uploadDatasets($event);
    // } catch (error) {
    //   if (error instanceof UnknownColumnError) {
    //     const msg = await this.translateService.get('unknown header in csv file').toPromise();
    //     this.snackBar.open(msg, 'OK', { duration: 2500 });
    //   }
    // }
  }
}
