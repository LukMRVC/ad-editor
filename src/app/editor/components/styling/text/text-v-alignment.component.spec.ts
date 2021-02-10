import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextVAlignmentComponent } from './text-v-alignment.component';

describe('TextVAlignmentComponent', () => {
  let component: TextVAlignmentComponent;
  let fixture: ComponentFixture<TextVAlignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextVAlignmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextVAlignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
