import {AfterViewInit, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BannerDataService} from '@core/services/banner-data.service';
import {Banner} from '@core/models/banner-layout';
import {ShapeInformation} from '@core/models/dataset';

@Component({
  selector: 'app-shape-display-dialog',
  templateUrl: './shape-display-dialog.component.html',
  styles: [
  ]
})
export class ShapeDisplayDialogComponent implements OnInit, AfterViewInit {

  bannerSizes: Banner[];
  disableAnimations = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public datasetData: ShapeInformation[],
    public bannerData: BannerDataService,
  ) { }

  ngOnInit(): void {
    this.bannerSizes = this.bannerData.getActiveBanners();
    console.log(this.datasetData);
  }

  // Expansion panel flickering workaround
  ngAfterViewInit(): void {
    setTimeout(() => this.disableAnimations = false);
  }

  someSizes(shapeInfo: ShapeInformation): boolean {
    return Array.from(shapeInfo?.bannerShapeConfig?.values() ?? []).some(cfg => !!cfg?.shouldDraw)
      && !this.allSizes(shapeInfo);
  }

  allSizes(shapeInfo: ShapeInformation): boolean {
    return Array.from(shapeInfo?.bannerShapeConfig?.values() ?? []).every(cfg => !!cfg?.shouldDraw);
  }

  isDrawnOnBanner(shapeInfo: ShapeInformation, i: number): boolean {
    const bannerCfg = shapeInfo?.bannerShapeConfig?.get(i);
    if (!bannerCfg) {
      return false;
    } else {
      return bannerCfg.shouldDraw;
    }
  }

  toggleDrawingOnBanner(shapeInfo: ShapeInformation, bannerIdx: number, checked: boolean): void {
    const bannerCfg = shapeInfo?.bannerShapeConfig?.get(bannerIdx);
    if (bannerCfg) {
      bannerCfg.shouldDraw = checked;
    }
  }

  toggleAllDrawingOnBanner(shapeInfo: ShapeInformation, checked: boolean): void {
    for (const [idx, ] of this.bannerSizes.entries()) {
      this.toggleDrawingOnBanner(shapeInfo, idx, checked);
    }
  }
}
