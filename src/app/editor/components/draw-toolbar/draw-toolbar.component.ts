import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {CdkDragEnd} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  styleUrls: ['./draw-toolbar.component.scss']
})
export class DrawToolbarComponent implements OnInit {

  @Output() imageUploaded = new EventEmitter<{ file: File, buffer: ArrayBuffer }>();


  constructor(
    public konva: KonvaService,
  ) { }

  ngOnInit(): void {
  }


  dragEnd($event: CdkDragEnd): void {
    console.log($event);
  }

}




