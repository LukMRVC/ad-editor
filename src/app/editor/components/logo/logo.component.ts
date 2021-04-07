import {Component, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {ImageGalleryService, UploadedImage} from '@core/services/image-gallery.service';
import {ShapeInformation} from '@core/models/dataset';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {BannerDataService} from '@core/services/banner-data.service';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent implements OnInit {

  activeDataset = null;
  logoShapeInfo = null;

  constructor(
    public konva: KonvaService,
    public imageService: ImageGalleryService,
    public dialog: MatDialog,
    public dataService: BannerDataService,
  ) {}

  ngOnInit(): void {
    this.activeDataset = this.dataService.getActiveDataset();
    this.logoShapeInfo = this.activeDataset.find(s => s.userShapeName?.toLowerCase() === 'logo');
  }

  async openGallery(datasetKey: string, shapeInfo: ShapeInformation): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    if (img) {
      this.dataService.changeValue(datasetKey, shapeInfo, (img as UploadedImage).name);
    }
  }

}
