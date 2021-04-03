import {Component} from '@angular/core';
import {TextDrawingService} from '@core/services/drawing/text-drawing.service';

@Component({
  selector: 'app-headline',
  templateUrl: './headline.component.html',
  styleUrls: ['./headline.component.scss']
})
export class HeadlineComponent {

  headlineText = '';

  constructor(
    public textService: TextDrawingService,
  ) { }

}
