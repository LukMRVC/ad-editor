import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {KonvaService} from '@core/services/konva.service';
import {Subscription} from 'rxjs';
import {BannerService} from '@core/services/banner.service';
import {BannerDataService} from '@core/services/banner-data.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {ImageDrawingService} from '@core/services/drawing/image-drawing.service';
import {PolylineDrawingService} from '@core/services/drawing/polyline-drawing.service';
import {MatDialog} from '@angular/material/dialog';
import {BannerDialogComponent} from '../../components/banner-dialog.component';
import {Banner} from '@core/models/banner-layout';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ExportDialogComponent} from '../../components/export-dialog.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements AfterViewInit, OnDestroy {

  public readonly title = 'AdEditor';
  @ViewChild('projectImportInput') importInput: ElementRef<HTMLInputElement>;
  @ViewChild('stageWrapper') stageWrapper: ElementRef;
  contextMenu: {visibility: string, top: string, left: string} = {visibility: 'none', top: '', left: ''};
  private subscription: Subscription = new Subscription();

  public contextMenuActions: {name: string, action: any}[] = [];

  constructor(
    public konva: KonvaService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    private bannerService: BannerService,
    public dataService: BannerDataService,
    public imageDrawingService: ImageDrawingService,
    public shapeDrawingService: PolylineDrawingService,
  ) { }

  async ngAfterViewInit(): Promise<void> {
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

    const bannerDialog = this.dialog.open(BannerDialogComponent, { width: '70%' });
    const banners: Banner[] = await bannerDialog.afterClosed().toPromise();
    // const banners = this.bannerService.getComputerBanners();
    if (banners) {
      this.dataService.setBanners(banners);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  saveProject(): void {
    const projectJsonData = this.dataService.serialized();
    const dataUri = `data:application/json;charset=UTF-8,${encodeURIComponent(projectJsonData)}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUri;
    downloadLink.download = 'project.ade';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  async importProject(): Promise<void> {
    const file = this.importInput.nativeElement.files[0];
    const fileContent = await file.text();
    try {
      this.dataService.import(fileContent);
    } catch (err) {
      console.error(err);
      this.snackBar.open('Project could not be imported', 'OK', { duration: 2500 });
    }
  }

  async exportBanners(): Promise<void> {
    const dialog = this.dialog.open(ExportDialogComponent, { width: '60%' });
    const toExport = await dialog.afterClosed().toPromise();
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
