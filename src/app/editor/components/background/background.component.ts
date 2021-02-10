import { Component, OnInit } from '@angular/core';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {KonvaService} from '@core/services/konva.service';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent {
  public imageFitOptions = [
    'left-top',
    'left-middle',
    'left-bottom',
    'right-top',
    'right-middle',
    'right-bottom',
    'center-top',
    'center-middle',
    'center-bottom',
  ];

  public selectedBackgroundFit = 'center-top';
  zoom = 1;

  constructor(
    public konva: KonvaService,
  ) { }
}
