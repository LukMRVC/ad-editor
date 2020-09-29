import {AfterViewInit, Component, OnInit} from '@angular/core';
import {KonvaService} from '../../../shared/services/konva.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit {

  constructor(
    public konva: KonvaService
  ) { }

  ngAfterViewInit(): void {
    this.konva.init({ container: 'canvas-stage', width: 600, height: 800 });
    const layer = this.konva.layer();
    const circle = this.konva.circle({
      x: this.konva.getInstance().width() / 2,
      y: this.konva.getInstance().height() / 2,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 5,
    });
    layer.add(circle);
    this.konva.getInstance().add(layer);
    layer.draw();
  }

}
