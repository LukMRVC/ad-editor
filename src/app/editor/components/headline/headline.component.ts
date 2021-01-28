import {Component, OnInit} from '@angular/core';
import {Color} from '@angular-material-components/color-picker';
import {FormControl} from '@angular/forms';
import {KonvaService} from '@core/services/konva.service';

@Component({
  selector: 'app-headline',
  templateUrl: './headline.component.html',
  styleUrls: ['./headline.component.scss']
})
export class HeadlineComponent implements OnInit {

  headlineText = '';
  headlineTextPadding = 10;
  fillColor: Color = new Color(0, 0, 0, 255);

  fontSizeControl: FormControl = new FormControl();
  fontLineHeight = 1;
  fontLetterSpacing = 0;
  fontScaling = 0;

  shadow = { enabled: false, color: new Color(0, 0, 0, 255), blur: 3, offsetY: 0, offsetX: 0 };

  constructor(
    public konva: KonvaService,
  ) { }


  ngOnInit(): void {
    this.fontSizeControl.setValue(10);
  }

}
