import { Component, OnInit } from '@angular/core';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {KonvaService} from '@core/services/konva.service';
import {ImageGalleryService} from '@core/services/image-gallery.service';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent implements OnInit {

  public imageSources: string[] = [];

  constructor(
    public konva: KonvaService,
    public imageService: ImageGalleryService,
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
          this.konva.drawLogo({ image, width: image.width, height: image.height, draggable: true });
        };
      }
    };
    reader.readAsDataURL(file);
  }

}
