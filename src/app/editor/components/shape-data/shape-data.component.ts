import { Component, OnInit } from '@angular/core';
import {BannerDataService, ShapeInformation} from '@core/services/banner-data.service';
import {MatDialog} from '@angular/material/dialog';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {UploadedImage} from '@core/services/image-gallery.service';

@Component({
  selector: 'app-shape-data',
  templateUrl: './shape-data.component.html',
  styleUrls: ['./shape-data.component.scss']
})
export class ShapeDataComponent implements OnInit {

  selectedSet: string;

  constructor(
    public dataService: BannerDataService,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.selectedSet = this.dataService.datasets.keys().next().value;
  }

  changeValue(datasetKey: string, shapeInfo: ShapeInformation, $event: Event): void {
    // console.log($event);
    this.dataService.changeValue(datasetKey, shapeInfo, ($event.target as HTMLInputElement).value);

  }

  async openGallery(): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    console.log(img);
  }

  changeDataset(key: string): void {
    this.selectedSet = key;
    this.dataService.setActiveDataset(key);
  }
}
