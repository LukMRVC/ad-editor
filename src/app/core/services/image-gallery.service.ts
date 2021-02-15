import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageGalleryService {

  private images: UploadedImage[] = [];

  constructor() {
    if (localStorage.getItem('cachedImages') !== null) {
      this.images = JSON.parse(localStorage.getItem('cachedImages'));
    }
  }

  public uploadImage(file: File): Observable<number> {

    return new Observable<number>(subscriber => {

      if (this.hasImage(file)) {
        subscriber.next(100);
        subscriber.complete();
        return;
      }

      const reader = new FileReader();

      reader.onprogress = (progress: ProgressEvent<FileReader>) => {
        if (progress.lengthComputable) {
          subscriber.next( Math.round( ( progress.loaded / progress.total ) * 100)  );
        }
      };

      reader.onload = (e: ProgressEvent<FileReader>) => {
        subscriber.next(100);
        this.images.push({
          id: this.genImageId(),
          src: reader.result as string,
          name: file.name,
          type: file.type,
          size: file.size,
        });
        subscriber.complete();

        localStorage.setItem('cachedImages', JSON.stringify(this.images));
      };
      reader.readAsDataURL(file);
    });
  }

  // Simple ID generation
  // taken from https://stackoverflow.com/a/60035555/6803924
  private genImageId(): string {
    const stringArr = [];
    for (let i = 0; i < 6; i++){
      // tslint:disable-next-line:no-bitwise
      const S4 = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      stringArr.push(S4);
    }
    return stringArr.join('-');

  }

  public getImages(): UploadedImage[] {
    return this.images;
  }

  removeImage(id: string): void {
    this.images.splice(this.images.findIndex(img => img.id === id), 1);
    localStorage.setItem('cachedImages', JSON.stringify(this.images));
  }

  hasImage(file: File): boolean {
    return this.images.findIndex(img => img.name === file.name) !== -1;
  }

  public getImageInstanceByName(imgName: string): HTMLImageElement {
    const img = new Image();
    // console.log(`Finding ${imgName} in `, this.images);
    const imgData = this.images.find(i => i.name === imgName);
    img.src = imgData.src;
    return img;
  }
}

export interface UploadedImage {
  id: string;
  src: string;
  name: string;
  type?: string;
  size?: number;
}
