import { Component, OnInit } from '@angular/core';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {KonvaService} from '@core/services/konva.service';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit {

  public imageSources: string[] = [];

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
  zoom: number = 1;

  constructor(
    public konva: KonvaService,
  ) { }

  ngOnInit(): void {
  }

  fileDropped($event: NgxFileDropEntry[]): void {
    for (const droppedFile of $event) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file( (file: File) => this.readFile(file));
      }
    }
  }

  onFileChange($event: Event): void {

    const file = ($event.target as HTMLInputElement).files[0];
    if (file !== null && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      this.readFile(file);
    }
  }

  readFile(file: Blob): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (reader.readyState === reader.DONE) {
        this.imageSources.push(reader.result as string);
        const image = new Image();
        image.src = reader.result as string;
        image.onload = () => {
          this.konva.drawBackground({ image, draggable: true, transformable: false });
        };
      }
    };
    reader.readAsDataURL(file);
  }
}
