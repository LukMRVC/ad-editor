import {Component} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {TextDrawingService} from '@core/services/text-drawing.service';

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
