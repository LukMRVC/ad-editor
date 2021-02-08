import { Component, OnInit } from '@angular/core';
import {BannerDataService, ShapeInformation} from '@core/services/banner-data.service';
import Konva from 'konva';
import {MatDialog} from '@angular/material/dialog';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';

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
    console.log($event);
    if (shapeInfo.isText) {
      const datasetShapeInfos = this.dataService.datasets.get(datasetKey);
      datasetShapeInfos.map( datasetShapeInfo => {
        if (datasetShapeInfo.userShapeName === shapeInfo.userShapeName) {
          (datasetShapeInfo.shapeConfig as Konva.TextConfig).text = ($event.target as HTMLInputElement).value;
        }
        return datasetShapeInfo;
      });
      this.dataService.datasets.set(datasetKey, datasetShapeInfos);
    }

  }

  async openGallery(): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img = await dlg.afterClosed().toPromise();

    console.log(img);
  }
}
