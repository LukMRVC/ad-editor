import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextHAlignmentComponent } from './text-h-alignment.component';

describe('TextAlignmentComponent', () => {
  let component: TextHAlignmentComponent;
  let fixture: ComponentFixture<TextHAlignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextHAlignmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextHAlignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
