import { Component, OnInit } from '@angular/core';
import {BannerDataService} from '@core/services/banner-data.service';
import {MatDialog} from '@angular/material/dialog';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {UploadedImage} from '@core/services/image-gallery.service';
import {KonvaService} from '@core/services/konva.service';
import {ShapeInformation} from '@core/models/dataset';
import {ShapeNameDialogComponent} from '../shape-name-dialog.component';

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

  // TODO: move to corresponding shape name
  // async displayOptions(dataset: ShapeInformation[]): Promise<void> {
  //   const dlg = this.dialog.open(ShapeDisplayDialogComponent, { maxWidth: '70%', minWidth: '50%', data: dataset });
  //   const result = await dlg.afterClosed().toPromise();
  //   // console.log(result);
  //   this.konva.redrawShapes();
  // }

  async addShape(shapeType: 'image'|'text'|'rect'|'circle'): Promise<void> {
    const dlg = this.dialog.open(ShapeNameDialogComponent);
    const userShapeName = await dlg.afterClosed().toPromise();
    if (userShapeName) {
      this.dataService.addShape(userShapeName, shapeType);
    }
  }
}
