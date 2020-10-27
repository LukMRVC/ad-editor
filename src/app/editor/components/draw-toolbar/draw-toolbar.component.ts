import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';

const DEFAULT_CIRCLE_CONFIG = {
  draggable: true,
  radius: 80,
  x: 30,
  y: 30,
  fill: '#ff0000ff',
  stroke: '#000000ff',
};

const DEFAULT_RECT_CONFIG = {
  fill: '#ff0000ff',
  stroke: '#000000ff',
  width: 30,
  height: 30,
  x: 0,
  y: 0,
  draggable: true,
};

const DEFAULT_REG_POLYGON_CONFIG = {
  x: 15,
  y: 15,
  stroke: '#000000ff',
  fill: '#ff0000ff',
  draggable: true,
  sides: 3,
  radius: 30,
};

const DEFAULT_TEXT_CONFIG = {
  fontSize: 30,
  fontFamily: 'Calibri',
  x: 20,
  y: 15,
  fill: '#000000ff',
  strokeEnabled: false,
  text: 'Text',
  draggable: true,
};

@Component({
  selector: 'app-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  styleUrls: ['./draw-toolbar.component.scss']
})
export class DrawToolbarComponent implements OnInit {

  @ViewChild('imageInput') imageInput: ElementRef;

  @Output() imageUploaded = new EventEmitter<{ file: File, buffer: ArrayBuffer }>();

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

  onFileChange($event: any): void {
    const inputNode = this.imageInput.nativeElement;
    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (reader.readyState === reader.DONE) {
          // console.log(reader.result);
          this.imageUploaded.emit( { file: inputNode.files[0], buffer: reader.result as ArrayBuffer } );
        }
      };
      const file = reader.readAsArrayBuffer(inputNode.files[0]);
    }
  }

  drawText(): void {
    this.konva.text(DEFAULT_TEXT_CONFIG);
  }
}




