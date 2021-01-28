import { Injectable } from '@angular/core';
import {Banner, BannerLayout} from '@core/models/banner-layout';

@Injectable({
  providedIn: 'root'
})
export class BannerService {

  constructor() { }

  // get computerBanners(): Banner[] {
  //   return [...this.computer].map(layout => new Banner(layout));
  // }

  private readonly computer: BannerLayout[] = [
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
      name: 'small-square',
      dimensions: {width: 200, height: 200},
      hasLogo: false,
      // logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 5, x: 1},
      headlineFontSize: 24,
      buttonPosition: {y: 80, x: 70},
    },
    {
      name: 'square',
      dimensions: {width: 250, height: 250},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 24,
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

  private readonly mobile: BannerLayout[] = [
    // tslint:disable-next-line:max-line-length
    {
      name: 'rectangle',
      dimensions: {width: 300, height: 250},
      hasLogo: true,
      logoPosition: {y: 5, x: 90},
      headlinePosition: {y: 25, x: 1},
      headlineFontSize: 16,
      buttonPosition: {y: 80, x: 90},
    },
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

  public getComputerBannes(): Banner[] {
    return [...this.computer].map(layout => new Banner(layout));
  }

  get mobileBanners(): Banner[] {
    return [...this.mobile].map(layout => new Banner(layout));
  }
}
