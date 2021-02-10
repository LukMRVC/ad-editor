import { Component, OnInit } from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {Color} from '@angular-material-components/color-picker';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {

  cornerRadius = 0;
  fontSize = 0;

  fontFillColor: Color = new Color(0, 0, 0, 255);

  buttonFillColor: Color = new Color(255, 255, 255, 255);
  padding = 5;

  constructor(
    public konva: KonvaService,
  ) { }

  ngOnInit(): void {
  }

}
