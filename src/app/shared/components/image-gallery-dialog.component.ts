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
    }`
  ]
})
export class ImageGalleryDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ImageGalleryDialogComponent>,
    public imageService: ImageGalleryService,
  ) { }

  ngOnInit(): void {
  }

}
