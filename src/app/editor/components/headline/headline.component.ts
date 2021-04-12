import {Component, OnInit} from '@angular/core';
import {TextDrawingService} from '@core/services/drawing/text-drawing.service';
import {BannerDataService} from '@core/services/banner-data.service';
import {ShapeInformation} from '@core/models/dataset';

@Component({
  selector: 'app-headline',
  templateUrl: './headline.component.html',
  styleUrls: ['./headline.component.scss']
})
export class HeadlineComponent implements OnInit {

  headlineText = '';

  shapeInfo: ShapeInformation = null;

  constructor(
    public textService: TextDrawingService,
    public dataService: BannerDataService,
  ) { }


  ngOnInit(): void {
    this.shapeInfo = this.dataService.getActiveDataset().find(s => s.userShapeName.slugify() === 'headline');
  }
}
