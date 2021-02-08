import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeDataComponent } from './shape-data.component';

describe('ShapeDataComponent', () => {
  let component: ShapeDataComponent;
  let fixture: ComponentFixture<ShapeDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShapeDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
