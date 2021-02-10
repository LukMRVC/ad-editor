import {Component, OnInit} from '@angular/core';
import {Color} from '@angular-material-components/color-picker';
import {FormControl} from '@angular/forms';
import {KonvaService} from '@core/services/konva.service';

@Component({
  selector: 'app-headline',
  templateUrl: './headline.component.html',
  styleUrls: ['./headline.component.scss']
})
export class HeadlineComponent {

  headlineText = '';

  constructor() { }

}
