import { TestBed } from '@angular/core/testing';

import { PolylineDrawingService } from './polyline-drawing.service';

describe('PolylineDrawingService', () => {
  let service: PolylineDrawingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolylineDrawingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
