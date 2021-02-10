import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild} from '@angular/core';

import {KonvaService} from '@core/services/konva.service';
import {Subscription} from 'rxjs';
import {BannerService} from '@core/services/banner.service';
import {BannerDataService} from '@core/services/banner-data.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements AfterViewInit, OnDestroy {

  @ViewChild('stageWrapper') stageWrapper: ElementRef;
  private subscription: Subscription = new Subscription();

  constructor(
    public konva: KonvaService,
    public bannerService: BannerService,
    public dataService: BannerDataService,
  ) { }

  ngAfterViewInit(): void {
    console.log(this.stageWrapper);
    this.konva.init({
      container: 'stage',
      draggable: true,
      dragBoundFunc: (pos) => {
        let x = pos.x;
        let y = pos.y;
        if (pos.x > 500) {
          x = 500;
        } else if (pos.x < -500) {
          x = -500;
        }

        if (pos.y > 500) {
          y = 500;
        } else if (pos.y < -500) {
          y = -500;
        }

        return { x, y };
      },
      width: this.stageWrapper.nativeElement.offsetWidth,
      height: this.stageWrapper.nativeElement.offsetHeight,
    });

    this.dataService.setBanners(this.bannerService.getComputerBanners());
    // this.konva.drawHeadline({ draggable: true, padding: 10, /*text: 'Test text', fontStyle: 'italic bold' */});
    // this.konva.drawButton();
  }

  ngOnDestroy(): void {
    console.log(`Destroying editor component`);
    this.subscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize($event): void {
    this.konva.getInstance().width(this.stageWrapper.nativeElement.offsetWidth);
    this.konva.getInstance().height(this.stageWrapper.nativeElement.offsetHeight);
  }

  @HostListener('document:keydown.delete')
  onDeletePressed(): void {
    // this.konva.deleteSelected();
  }

}
