import { Injectable } from '@angular/core';
import {Banner, BannerLayout, Dimension2D} from '@core/models/banner-layout';

@Injectable({
  providedIn: 'root'
})
export class BannerService {

  constructor() { }

  public readonly computer: BannerLayout[] = [
    {
      name: 'big-square',
      dimensions:
        {width: 480, height: 480},
      hasLogo: true,
      logoPosition:
        {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 40,
      buttonPosition: {y: 80, x: 70},
    },
    {
      name: 'large-rectangle',
      dimensions: {width: 336, height: 280},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 32,
      buttonPosition: {y: 80, x: 70},
    },
    {
      name: 'rectangle',
      dimensions: {width: 300, height: 250},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 28,
      buttonPosition: {y: 80, x: 70},
    },
    {
      name: 'wide-skyscraper',
      dimensions: {width: 160, height: 600},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 24,
      buttonPosition: {y: 80, x: 70},
    },
    {
      name: 'half-page-ad',
      dimensions: {width: 300, height: 600},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 32,
      buttonPosition: {y: 80, x: 70},
    },
    {
      name: 'banner',
      dimensions: {width: 468, height: 60},
      hasLogo: false,
      // logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 5, x: 1},
      headlineFontSize: 18,
      buttonPosition: {y: 50, x: 70},
    },
    {
      name: 'leaderboard',
      dimensions: {width: 728, height: 90},
      hasLogo: false,
      // logoPosition: {y: 90, x: 90},
      headlinePosition: {y: 5, x: 1},
      headlineFontSize: 28,
      buttonPosition: {y: 60, x: 70},
    },
    {
      name: 'large-leaderboard',
      dimensions: {width: 970, height: 90},
      hasLogo: false,
      // logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 5, x: 1},
      headlineFontSize: 28,
      buttonPosition: {y: 60, x: 70},
    },
  ];

  public readonly mobile: BannerLayout[] = [
    // tslint:disable-next-line:max-line-length
    {
      name: 'wide-narrow-rectangle',
      dimensions: {width: 320, height: 100},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 16,
      buttonPosition: {y: 80, x: 90},
    },
    {
      name: 'square',
      dimensions: {width: 250, height: 250},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 16,
      buttonPosition: {y: 80, x: 90},
    },
    {
      name: 'small-square',
      dimensions: {width: 200, height: 200},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 16,
      buttonPosition: {y: 80, x: 90},
    },
  ];

  public toInstances(layouts: BannerLayout[], sort = true): Banner[] {
    if (sort) {
      layouts = layouts.sort( (a, b) => {
        const isRect = (dims: Dimension2D) => dims.width === dims.height;
        if (  isRect(a.dimensions) && isRect(b.dimensions) ) {
          return (b.dimensions.width * b.dimensions.height) - (a.dimensions.width * a.dimensions.height);
        } else if (isRect(a.dimensions) && !isRect(b.dimensions)) {
          return -1;
        } else if ( !isRect(a.dimensions) && isRect(b.dimensions)) {
          return 1;
        } else { // none are rect
          return 0;
        }

      });
    }

    return [...layouts].map( (layout, index) => new Banner(layout, index) );
  }

  public getComputerBanners(): Banner[] {
    return [...this.computer].map((layout, index) => new Banner(layout, index));
  }

  get mobileBanners(): Banner[] {
    return [...this.mobile].map((layout, index) => new Banner(layout, index));
  }
}
