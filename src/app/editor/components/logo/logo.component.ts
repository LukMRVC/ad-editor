import { Component } from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {ImageGalleryService} from '@core/services/image-gallery.service';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent {

  public imageSources: string[] = [];

  constructor(
    public konva: KonvaService,
    public imageService: ImageGalleryService,
  ) { }


}
