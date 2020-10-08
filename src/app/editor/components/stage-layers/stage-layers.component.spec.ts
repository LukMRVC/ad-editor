import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageLayersComponent } from './stage-layers.component';

describe('StageLayersComponent', () => {
  let component: StageLayersComponent;
  let fixture: ComponentFixture<StageLayersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StageLayersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StageLayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
