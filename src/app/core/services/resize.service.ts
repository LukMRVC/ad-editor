import { Injectable } from '@angular/core';
import { Node } from 'konva/types/Node';

@Injectable({
  providedIn: 'root'
})
export class ResizeService {

  public readonly computer: Size[] = [
    { name: 'rectangle', width: 300, height: 250 },
    { name: 'large-rectangle', width: 336, height: 280 },
    { name: 'leaderboard', width: 728, height: 90 },
    { name: 'half-page-ad', width: 300, height: 600 },
    { name: 'wide-skyscraper', width: 160, height: 600 },
    { name: 'large-leaderboard', width: 970, height: 90 },
    { name: 'banner', width: 468, height: 60 },
    { name: 'square', width: 250, height: 250 },
    { name: 'big-square', width: 480, height: 480 },
    { name: 'small-square', width: 200, height: 200 },
  ];

  public readonly mobile: Size[] = [
    { name: 'rectangle', width: 300, height: 250 },
    { name: 'wide-narrow-rectangle', width: 320, height: 100 },
    { name: 'square', width: 250, height: 250 },
    { name: 'small-square', width: 200, height: 200 },
  ];

  get all(): Size[] {
    return this.computer.concat(this.mobile);
  }

  constructor() { }

  public scale(objects: Node[], sizes: 'computer' | 'mobile' | 'all' = 'all'): Map<string, Size>[] {
    const newScales = [];
    this[sizes].forEach((size: Size) => {
      const scaledGroup = new Map<string, Size>();
      scaledGroup.set('bg', size);
      objects.forEach(obj => {
        scaledGroup.set(obj.id(), { width: size.width / obj.width(), height: size.height / obj.height() });

        // obj.scaleX( size.w / obj.width() );
        // obj.scaleY( size.h / obj.height() );
      });
      newScales.push(scaledGroup);
    });
    return newScales;
  }

  public resize(objects: Node[], sizes: 'computer' | 'mobile' | 'all' = 'all'): void {
    this[sizes].forEach((size: Size) => {
      const scaledGroup = new Map<string, Size>();
      scaledGroup.set('bg', size);
      objects.forEach(obj => {
        // obj.size()
        scaledGroup.set(obj.id(), { width: size.width / obj.width(), height: size.height / obj.height() });

        // obj.scaleX( size.w / obj.width() );
        // obj.scaleY( size.h / obj.height() );
      });
    });

  }


}

export interface Size {
  name?: string;
  height: number;
  width: number;
}
