import { Component, OnInit } from '@angular/core';
import {ImageGalleryService} from '@core/services/image-gallery.service';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-image-gallery-dialog',
  templateUrl: './image-gallery-dialog.component.html',
  styles: [
    `.gallery {
      max-height: 500px;
      overflow-y: auto;
      min-height: 200px;
    }

    .mat-gallery-img {
      margin: .5rem;
      max-width: 25%;
      border: 1px solid #e0e0e0;
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

  ngOnInit(): void {
  }

  upload($event: Event): void {
    const files = ($event.target as HTMLInputElement).files;
    for (let i = 0; i < files.length; ++i) {
      const file = files.item(i);
      this.imageUploads.set(i, 0);
      this.imageService.uploadImage(file).subscribe(uploadPercent => {
        this.imageUploads.set(i, uploadPercent);
        if (uploadPercent === 100) {
          this.imageUploads.delete(i);
        }
      });
    }
  }
}
