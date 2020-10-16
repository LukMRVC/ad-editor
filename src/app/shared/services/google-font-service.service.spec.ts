import { TestBed } from '@angular/core/testing';

import { GoogleFontService } from './google-font.service';

describe('GoogleFontServiceService', () => {
  let service: GoogleFontService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleFontService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
