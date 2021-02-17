export class Banner {

  id: number;

  constructor(layout: BannerLayout, bid: number) {
    this.layout = layout;
    this.id = bid;
  }

  layout: BannerLayout;

  public getPercentageCenterPositionInBanner(position: Point2D, objectDimensions: Dimension2D): Point2D {
    const widthDelta = this.layout.dimensions.width - objectDimensions.width <= 0
      ? this.layout.dimensions.width : this.layout.dimensions.width - objectDimensions.width;

    const heightDelta = this.layout.dimensions.height - objectDimensions.height <= 0
     ? this.layout.dimensions.height : this.layout.dimensions.height - objectDimensions.height;

    const x = (position.x / widthDelta) * 100;
    const y = (position.y / heightDelta) * 100;
    return {x, y};
  }

  public getPixelPositionFromPercentage(
    percentage: Point2D,
    objectDimensions: Dimension2D,
    scale: { scaleX: number, scaleY: number } = {scaleX: 1, scaleY: 1}
  ): Point2D {

    let widthDelta = (this.layout.dimensions.width - (objectDimensions.width * scale.scaleX));
    if (widthDelta <= 0) {
      widthDelta = this.layout.dimensions.width;
    }

    let heightDelta = (this.layout.dimensions.height - (objectDimensions.height * scale.scaleY));
    if (heightDelta <= 0) {
      heightDelta = this.layout.dimensions.height;
    }

    const x = (percentage.x / 100) * widthDelta;
    const y = (percentage.y / 100) * heightDelta;

    return {x, y};
  }

  public getScaleForLogo(logoDimensions: Dimension2D): Point2D {
    let scale = 1;
    const maxWidth = this.layout.dimensions.width / 3;

    if (logoDimensions.width > maxWidth) {
      scale = maxWidth / logoDimensions.width;
    }

    if ( (logoDimensions.width * scale) > this.layout.dimensions.height) {
      scale = this.layout.dimensions.height / logoDimensions.height;
    }

    return {x: scale, y: scale};
  }

  public getFontSizeForHeadline(): number {
    // 16px is the smallest possible value
    if (this.layout.dimensions.width > this.layout.dimensions.height) {
      return Math.max(Math.round(this.layout.dimensions.width / 10), 16);
    } else {
      return Math.max(Math.round(this.layout.dimensions.height / 10), 16);
    }
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
  headlineFontSize: number;
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
