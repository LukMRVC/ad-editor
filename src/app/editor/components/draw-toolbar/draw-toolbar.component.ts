import { Component, OnInit } from '@angular/core';
import {KonvaService} from '../../../shared/services/konva.service';

const DEFAULT_CIRCLE_CONFIG = {
  draggable: true,
  radius: 30,
  x: 30,
  y: 30,
  fill: 'red',
  stroke: 'black',
};

const DEFAULT_RECT_CONFIG = {
  fill: 'red',
  stroke: 'black',
  width: 30,
  height: 30,
  x: 0,
  y: 0,
  draggable: true,
};

const DEFAULT_REG_POLYGON_CONFIG = {
  x: 15,
  y: 15,
  stroke: 'black',
  fill: 'red',
  draggable: true,
  sides: 3,
  radius: 30,
};

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

  drawCircle(): void {
    this.konva.circle(DEFAULT_CIRCLE_CONFIG);
  }

  drawRect(): void {
    this.konva.rect(DEFAULT_RECT_CONFIG);
  }

  drawRegularPolygon(): void {
    this.konva.regularPolygon(DEFAULT_REG_POLYGON_CONFIG);
  }
}




