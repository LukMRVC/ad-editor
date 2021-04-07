import Konva from 'konva';

export class Dataset {

  public datasetName: string;
  public ordering: number;
  public shapes: ShapeInformation[] = [];

  public constructor(name: string, ordering: number = null, shapeInfo: ShapeInformation[] = []) {
    this.datasetName = name;
    this.ordering = ordering;
    if (ordering === null) {
      this.ordering = 1;
    }

    this.shapes = shapeInfo;
  }


}

export interface ShapeInformation {
  userShapeName: string;
  isText?: boolean;
  isImage?: boolean;
  isButton?: boolean;
  shapeType?: string;
  shapeConfig?: Konva.ShapeConfig;
  bannerShapeConfig?: Map<number, Konva.ShapeConfig>;
  serializedBannerShapeConfig?: any[],
}
