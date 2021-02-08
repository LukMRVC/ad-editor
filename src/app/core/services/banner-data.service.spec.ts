import { TestBed } from '@angular/core/testing';

import { BannerDataService } from './banner-data.service';

describe('BannerDataService', () => {
  let service: BannerDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BannerDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
