import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeNameDialogComponent } from './shape-name-dialog.component';

describe('ShapeNameDialogComponent', () => {
  let component: ShapeNameDialogComponent;
  let fixture: ComponentFixture<ShapeNameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShapeNameDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
