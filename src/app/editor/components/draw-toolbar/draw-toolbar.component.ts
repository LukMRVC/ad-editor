import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {MatDialog} from '@angular/material/dialog';
import {BannerDataService} from '@core/services/banner-data.service';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  styleUrls: ['./draw-toolbar.component.scss']
})
export class DrawToolbarComponent implements OnInit, OnDestroy {

  private shapeBgSubject$ = new Subject<{event: any, shapeNameSlug: string}>();

  constructor(
    public konva: KonvaService,
    public dialog: MatDialog,
    public dataService: BannerDataService,
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
}




