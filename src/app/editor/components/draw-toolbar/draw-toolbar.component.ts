import {Component, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {CdkDragEnd} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {ShapeNameDialogComponent} from '../shape-name-dialog.component';
import {BannerDataService} from '@core/services/banner-data.service';

@Component({
  selector: 'app-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  styleUrls: ['./draw-toolbar.component.scss']
})
export class DrawToolbarComponent implements OnInit {

  constructor(
    public konva: KonvaService,
    public dialog: MatDialog,
    public dataService: BannerDataService,
  ) { }

  ngOnInit(): void {}

  dragEnd($event: CdkDragEnd): void {
    console.log($event);
  }

  async addText(): Promise<void> {
    const dlg = this.dialog.open(ShapeNameDialogComponent);
    const userShapeName = await dlg.afterClosed().toPromise();
    if (userShapeName) {
      this.dataService.addToDataset(userShapeName, 'text');
    }
  }

  async addImage(): Promise<void> {
    const dlg = this.dialog.open(ShapeNameDialogComponent);
    const userShapeName = await dlg.afterClosed().toPromise();
    if (userShapeName) {
      this.dataService.addToDataset(userShapeName, 'image');
    }
  }
}




