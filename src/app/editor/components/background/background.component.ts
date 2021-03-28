import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {ImageGalleryService, UploadedImage} from '@core/services/image-gallery.service';
import {MatDialog} from '@angular/material/dialog';
import {BannerDataService} from '@core/services/banner-data.service';
import {ShapeInformation} from '@core/models/dataset';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit, OnDestroy {
  public imageFitOptions = [
    'left-top',
    'left-middle',
    'left-bottom',
    'right-top',
    'right-middle',
    'right-bottom',
    'center-top',
    'center-middle',
    'center-bottom',
  ];

  private bgChanged = new Subject<any>();

  public selectedBackgroundFit = 'center-top';
  zoom = 1;
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
    this.logoShapeInfo = this.activeDataset.find(s => s.userShapeName?.toLowerCase() === 'background');

    this.bgChanged.pipe(debounceTime(250))
      .subscribe(bgAttributes => this.konva.updateBackground(bgAttributes));
  }

  ngOnDestroy(): void {
    this.bgChanged.complete();
  }

  async openGallery(datasetKey: string, shapeInfo: ShapeInformation): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    if (img) {
      this.dataService.changeValue(datasetKey, shapeInfo, (img as UploadedImage).src);
    }
  }

  bgChangedEvent($event): void {
    this.bgChanged.next($event);
  }
}
