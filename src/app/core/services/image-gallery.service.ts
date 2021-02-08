import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageGalleryService {

  private images: UploadedImage[] = [];

  constructor() { }

  public uploadImage(file: File): Observable<number> {

    return new Observable<number>(subscriber => {
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
  }
}

export interface UploadedImage {
  id: string;
  src: string;
  name: string;
  type?: string;
  size?: number;
}
