import { TestBed } from '@angular/core/testing';

import { TextDrawingService } from './text-drawing.service';

describe('TextDrawingService', () => {
  let service: TextDrawingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextDrawingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
