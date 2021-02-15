import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeDisplayDialogComponent } from './shape-display-dialog.component';

describe('ShapeDisplayDialogComponent', () => {
  let component: ShapeDisplayDialogComponent;
  let fixture: ComponentFixture<ShapeDisplayDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShapeDisplayDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeDisplayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
