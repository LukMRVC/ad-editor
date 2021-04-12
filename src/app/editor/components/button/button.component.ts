import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {Color} from '@angular-material-components/color-picker';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {ButtonDrawingService} from '@core/services/drawing/button-drawing.service';
import {BannerDataService} from '@core/services/banner-data.service';
import {ShapeInformation} from '@core/models/dataset';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit, OnDestroy {

  cornerRadius = 0;
  fontSize = 0;

  fontFillColor: Color = new Color(0, 0, 0, 255);

  buttonFillColor: Color = new Color(255, 255, 255, 255);
  padding = 5;

  private bgChanged = new Subject<any>();
  shapeInfo: ShapeInformation = null;

  constructor(
    public buttonService: ButtonDrawingService,
    public konva: KonvaService,
    public dataService: BannerDataService,
  ) { }

  ngOnInit(): void {
    this.bgChanged.pipe(debounceTime(250))
      .subscribe(conf => this.konva.updateBackgroundOfShape(conf, 'button-tag'));
    this.shapeInfo = this.dataService.getActiveDataset().find(s => s.userShapeName.slugify() === 'button');
  }

  ngOnDestroy(): void {
    this.bgChanged.complete();
  }

  backgroundChanged(conf): void {
    this.bgChanged.next(conf);
  }

}
