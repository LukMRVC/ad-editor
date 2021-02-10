import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextDecorationComponent } from './text-decoration.component';

describe('TextDecorationComponent', () => {
  let component: TextDecorationComponent;
  let fixture: ComponentFixture<TextDecorationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextDecorationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextDecorationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
