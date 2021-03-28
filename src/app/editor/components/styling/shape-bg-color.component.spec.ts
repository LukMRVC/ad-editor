import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeBgColorComponent } from './shape-bg-color.component';

describe('ShapeBgColorComponent', () => {
  let component: ShapeBgColorComponent;
  let fixture: ComponentFixture<ShapeBgColorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShapeBgColorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeBgColorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
