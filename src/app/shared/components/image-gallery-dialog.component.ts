import { Component, OnInit } from '@angular/core';
import {ImageGalleryService} from '@core/services/image-gallery.service';
import {MatDialogRef} from '@angular/material/dialog';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';

@Component({
  selector: 'app-image-gallery-dialog',
  templateUrl: './image-gallery-dialog.component.html',
  styles: [
    `.gallery {
      max-height: 700px;
      overflow-y: auto;
      min-height: 200px;
    }

    .gallery-img {
      max-height: 100%;
      max-width: 100%;
    }

    .img-select {
      cursor: pointer;
    }
    `
  ]
})
export class ImageGalleryDialogComponent implements OnInit {

  imageUploads = new Map<number, number>();

  constructor(
    public dialogRef: MatDialogRef<ImageGalleryDialogComponent>,
    public imageService: ImageGalleryService,
  ) { }

  ngOnInit(): void {}

  upload($event: Event): void {
    const files = ($event.target as HTMLInputElement).files;
    for (let i = 0; i < files.length; ++i) {
      const file = files.item(i);
      if (this.imageService.hasImage(file)) {
        continue;
      }
      this.imageUploads.set(i, 0);
      this.imageService.uploadImage(file).subscribe(uploadPercent => {
        this.imageUploads.set(i, uploadPercent);
        if (uploadPercent === 100) {
          this.imageUploads.delete(i);
        }
      });
    }
  }

  fileDropped($event: NgxFileDropEntry[]): void {
    for (let i = 0; i < $event.length; ++i) {
      if ($event[i].fileEntry.isFile) {
        const fileEntry = $event[i].fileEntry as FileSystemFileEntry;
        this.imageUploads.set(i, 0);
        fileEntry.file((file: File) => {
          if (this.imageService.hasImage(file)) {
            return;
          }
          this.imageService.uploadImage(file).subscribe(uploadPercent => {
            this.imageUploads.set(i, uploadPercent);
            if (uploadPercent === 100) {
              this.imageUploads.delete(i);
            }
          });
        });
      }
    }
  }
}
