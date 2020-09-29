import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawToolbarComponent } from './draw-toolbar.component';

describe('DrawToolbarComponent', () => {
  let component: DrawToolbarComponent;
  let fixture: ComponentFixture<DrawToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrawToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
