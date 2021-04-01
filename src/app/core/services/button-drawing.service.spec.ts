import { TestBed } from '@angular/core/testing';

import { ButtonDrawingService } from './button-drawing.service';

describe('ButtonDrawingService', () => {
  let service: ButtonDrawingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ButtonDrawingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
