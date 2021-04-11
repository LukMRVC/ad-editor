import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {MatDialog} from '@angular/material/dialog';
import {BannerDataService} from '@core/services/banner-data.service';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {ShapeInformation} from '@core/models/dataset';
import {ImageGalleryDialogComponent} from '@shared/components/image-gallery-dialog.component';
import {UploadedImage} from '@core/services/image-gallery.service';
import {TextDrawingService} from '@core/services/drawing/text-drawing.service';

@Component({
  selector: 'app-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  styleUrls: ['./draw-toolbar.component.scss']
})
export class DrawToolbarComponent implements OnInit, OnDestroy {

  private shapeBgSubject$ = new Subject<{event: any, shapeNameSlug: string}>();

  public userShapeTexts = new Map<string, string>();

  constructor(
    public konva: KonvaService,
    public dialog: MatDialog,
    public dataService: BannerDataService,
    public textService: TextDrawingService,
  ) {

  }

  ngOnInit(): void {
    this.shapeBgSubject$.pipe(debounceTime(250))
      .subscribe(shapeBg => {
        this.konva.updateBackgroundOfShape(shapeBg.event, shapeBg.shapeNameSlug);
      });
  }

  ngOnDestroy(): void {
    this.shapeBgSubject$.complete();
  }

  shapeBgChanged($event, shapeNameSlug: string): void {
    this.shapeBgSubject$.next({ event: $event, shapeNameSlug });
  }

  async openGallery(datasetKey: string, shapeInfo: ShapeInformation): Promise<void> {
    const dlg = this.dialog.open(ImageGalleryDialogComponent, { width: '70%' });
    const img: UploadedImage|string = await dlg.afterClosed().toPromise();
    if (img) {
      this.dataService.changeValue(datasetKey, shapeInfo, (img as UploadedImage).name);
    }
  }

  removeUserShape(shapeInfo: ShapeInformation): void {
    this.dataService.removeUserShape(shapeInfo);
  }

  getShapeAttrs(shapeInfo: ShapeInformation): void {
    const shapeAttrs = this.konva.getShapeAttrs(shapeInfo);
    this.userShapeTexts.set(shapeInfo.userShapeName, shapeAttrs?.text ?? '');
  }
}




