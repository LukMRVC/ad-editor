import {max} from 'rxjs/operators';

export class Banner {

  constructor(layout: BannerLayout) {
    this.layout = layout;
  }

  layout: BannerLayout;

  public getPercentageCenterPositionInBanner(position: Point2D, objectDimensions: Dimension2D): Point2D {
    const centerX = position.x + objectDimensions.width / 2;
    const centerY = position.y + objectDimensions.height / 2;

    const x = ((centerX - objectDimensions.width / 2) / (this.layout.dimensions.width - objectDimensions.width)) * 100;
    const y = ((centerY - objectDimensions.height / 2) / (this.layout.dimensions.height - objectDimensions.height)) * 100;
    return {x, y};
  }

  public getPixelPositionFromPercentage(percentage: Point2D, objectDimensions: Dimension2D): Point2D {
    const x = (percentage.x / 100) * (this.layout.dimensions.width - objectDimensions.width);
    const y = (percentage.y / 100) * (this.layout.dimensions.height - objectDimensions.height);

    return {x, y};
  }

  public getScaleForLogo(logoDimensions: Dimension2D): Point2D {
    let scale = 1;
    const maxWidth = this.layout.dimensions.width / 4;
    const maxHeight = this.layout.dimensions.height / 4;
    if (logoDimensions.width > maxWidth) {
      scale = maxWidth / logoDimensions.width;
    } else if (logoDimensions.height > maxHeight) {
      scale = maxHeight / logoDimensions.height;
    }

    return {x: scale, y: scale};
  }
}


export interface BannerLayout {
  name: string;
  dimensions: Dimension2D;
  hasLogo: boolean;
  logoPosition?: Point2D;
  headlinePosition?: Point2D;
  backgroundPosition?: Point2D;
  buttonPosition?: Point2D;

  otherElementsPosition?: Array<Point2D>;
}

export interface Dimension2D {
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}
