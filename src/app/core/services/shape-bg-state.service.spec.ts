import { TestBed } from '@angular/core/testing';

import { ComponentStateService } from './component-state.service';

describe('ShapeBgStateService', () => {
  let service: ComponentStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
