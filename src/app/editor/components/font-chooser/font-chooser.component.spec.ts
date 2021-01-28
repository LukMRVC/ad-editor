import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FontChooserComponent } from './font-chooser.component';

describe('FontChooserComponent', () => {
  let component: FontChooserComponent;
  let fixture: ComponentFixture<FontChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FontChooserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FontChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
