import { Component, OnInit } from '@angular/core';
import {KonvaService} from '../../../shared/services/konva.service';

@Component({
  selector: 'app-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  styleUrls: ['./draw-toolbar.component.scss']
})
export class DrawToolbarComponent implements OnInit {

  constructor(
    public konva: KonvaService
  ) { }

  ngOnInit(): void {
  }

}
