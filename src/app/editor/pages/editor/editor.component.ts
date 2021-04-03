import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild} from '@angular/core';

import {KonvaService} from '@core/services/konva.service';
import {Subscription} from 'rxjs';
import {BannerService} from '@core/services/banner.service';
import {BannerDataService} from '@core/services/banner-data.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {ImageDrawingService} from '@core/services/drawing/image-drawing.service';
import {PolylineDrawingService} from '@core/services/drawing/polyline-drawing.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements AfterViewInit, OnDestroy {

  @ViewChild('stageWrapper') stageWrapper: ElementRef;
  contextMenu: {visibility: string, top: string, left: string} = {visibility: 'none', top: '', left: ''};
  private subscription: Subscription = new Subscription();

  public contextMenuActions: {name: string, action: any}[] = [];
  downloadTargetId: string;

  constructor(
    public konva: KonvaService,
    public bannerService: BannerService,
    public dataService: BannerDataService,
    public imageDrawingService: ImageDrawingService,
    public shapeDrawingService: PolylineDrawingService,
  ) { }

  ngAfterViewInit(): void {
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

    this.konva.displayContextMenuEvent$.subscribe(event => {
      this.contextMenuActions = event.actions;
      this.contextMenu.visibility = 'flex';
      const containerRect = this.stageWrapper.nativeElement.getBoundingClientRect();
      this.contextMenu.top = `${containerRect.top + event.pos.y}px`;
      this.contextMenu.left = `${containerRect.left + event.pos.x}px`;
    });
    // this.konva.onContextMenu$.subscribe( event => {
    //   if (event.target === this.konva.getInstance()) {
    //     return;
    //   }
    //   this.contextMenu.visibility = 'flex';
    //   const ancestor = event.target.findAncestor('Group', true);
    //   // console.log(ancestor);
    //   // console.log(ancestor.id());
    //   console.assert(ancestor !== undefined);
    //   this.downloadTargetId = ancestor.id();
    //   const containerRect = this.stageWrapper.nativeElement.getBoundingClientRect();
    //   this.contextMenu.top = containerRect.top + this.konva.getInstance().getPointerPosition().y + 'px';
    //   this.contextMenu.left = containerRect.left + this.konva.getInstance().getPointerPosition().x + 'px';
    // });

    this.dataService.setBanners(this.bannerService.getComputerBanners());
    // this.konva.drawHeadline({ draggable: true, padding: 10, /*text: 'Test text', fontStyle: 'italic bold' */});
    // this.konva.drawButton();
  }

  ngOnDestroy(): void {
    console.log(`Destroying editor component`);
    this.subscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    this.konva.getStage().width(this.stageWrapper.nativeElement.offsetWidth);
    this.konva.getStage().height(this.stageWrapper.nativeElement.offsetHeight);
  }

  @HostListener('document:keydown.control')
  onCtrlKeyDown(): void {
    this.konva.shouldTransformRelatives = false;
  }

  @HostListener('document:keydown.pagedown', ['$event'])
  onPageDown($event): void {
    $event.preventDefault();
    this.konva.moveObjectZIndices('Down');
  }

  @HostListener('document:keydown.pageup', ['$event'])
  onPageUp($event): void {
    $event.preventDefault();
    this.konva.moveObjectZIndices('Up');
  }

  @HostListener('document:keyup.Control')
  onCtrlKeyUp(): void {
    this.konva.shouldTransformRelatives = true;
  }

  @HostListener('document:keydown.delete')
  onDeletePressed(): void {
    // this.konva.deleteSelected();
  }

  reorderDatasets($event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.dataService.datasets, $event.previousIndex, $event.currentIndex);
  }
}
