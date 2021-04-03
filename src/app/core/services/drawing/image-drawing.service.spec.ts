import { TestBed } from '@angular/core/testing';

import { ImageDrawingService } from './image-drawing.service';

describe('ImageService', () => {
  let service: ImageDrawingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageDrawingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
