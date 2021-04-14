const GUIDELINE_OFFSET = 5;

import Konva from 'konva';

export interface LineGuideStops {
  vertical: number[];
  horizontal: number[];
}

export function getLineGuideStops(group: Konva.Group, skipShape: Konva.Shape, drawnShapeNames: string[]): LineGuideStops {
  // we can snap to stage borders and the center of the stage
  const vertical: any[] = [];
  const horizontal: any[] = [];

  // and we snap over edges and center of each object on the canvas
  for (const shapeName of drawnShapeNames) {
    group.find(`.${shapeName}`).each((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      const box = guideItem.getClientRect();
      // and we can snap to all edges of shapes
      vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
      horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
    });
  }

  return {
    vertical: vertical.flat(),
    horizontal: horizontal.flat(),
  };
}

export interface SnappingEdges {
  vertical: {guide: number; offset: number; snap: string; }[];
  horizontal: {guide: number; offset: number; snap: string; }[];
}

export function getObjectSnappingEdges(node: Konva.Node): SnappingEdges {
  const box = node.getClientRect();
  const absPos = node.absolutePosition();

  return {
    vertical: [
      {
        guide: Math.round(box.x),
        offset: Math.round(absPos.x - box.x),
        snap: 'start',
      },
      {
        guide: Math.round(box.x + box.width / 2),
        offset: Math.round(absPos.x - box.x - box.width / 2),
        snap: 'center',
      },
      {
        guide: Math.round(box.x + box.width),
        offset: Math.round(absPos.x - box.x - box.width),
        snap: 'end',
      },
    ],
    horizontal: [
      {
        guide: Math.round(box.y),
        offset: Math.round(absPos.y - box.y),
        snap: 'start',
      },
      {
        guide: Math.round(box.y + box.height / 2),
        offset: Math.round(absPos.y - box.y - box.height / 2),
        snap: 'center',
      },
      {
        guide: Math.round(box.y + box.height),
        offset: Math.round(absPos.y - box.y - box.height),
        snap: 'end',
      },
    ],
  };
}

export interface LineGuide {
  lineGuide: number;
  offset: number;
  orientation: string;
  snap: string;
}

// find all snapping possibilities
export function getGuides(lineGuideStops: LineGuideStops, itemBounds: SnappingEdges): LineGuide[] {
  const resultV = [];
  const resultH = [];

  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      // if the distance between guild line and object snap point is close we can consider this for snapping
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide,
          diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  lineGuideStops.horizontal.forEach((lineGuide) => {
    itemBounds.horizontal.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide,
          diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  const guides = [];

  // find closest snap
  const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: 'V',
      snap: minV.snap,
    });
  }
  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: 'H',
      snap: minH.snap,
    });
  }
  return guides;
}
