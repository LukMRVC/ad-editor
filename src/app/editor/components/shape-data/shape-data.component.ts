import { Component, OnInit } from '@angular/core';
import {BannerDataService, ShapeInformation} from '@core/services/banner-data.service';
import {MatDialog} from '@angular/material/dialog';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {UploadedImage} from '@core/services/image-gallery.service';
import {ShapeDisplayDialogComponent} from '@shared/components/shape-display-dialog.component';
import {KonvaService} from '@core/services/konva.service';

@Component({
  selector: 'app-shape-data',
  templateUrl: './shape-data.component.html',
  styleUrls: ['./shape-data.component.scss']
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

  changeValue(datasetKey: string, shapeInfo: ShapeInformation, $event: Event): void {
    // console.log($event);
    this.dataService.changeValue(datasetKey, shapeInfo, ($event.target as HTMLInputElement).value);
  }

  async openGallery(datasetKey: string, shapeInfo: ShapeInformation): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    if (img) {
      this.dataService.changeValue(datasetKey, shapeInfo, (img as UploadedImage).src);
    }
    // console.log(imgSrc);
  }

  changeDataset(key: string): void {
    this.selectedSet = key;
    this.dataService.setActiveDataset(key);
  }

  async displayOptions(dataset: ShapeInformation[]): Promise<void> {
    const dlg = this.dialog.open(ShapeDisplayDialogComponent, { maxWidth: '70%', minWidth: '50%', data: dataset });
    const result = await dlg.afterClosed().toPromise();
    console.log(result);
    this.konva.redrawShapes();
  }
}
