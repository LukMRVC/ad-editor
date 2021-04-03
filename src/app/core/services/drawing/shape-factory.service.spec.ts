import { TestBed } from '@angular/core/testing';
import { ShapeFactoryService } from './shape-factory.service';
import Konva from 'konva';

describe('ShapeFactoryService', () => {
  let service: ShapeFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShapeFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create circle', () => {
    expect(service).toBeTruthy();
    expect(service.createShape({ shapeType: 'circle' })).toBe(Konva.Circle);
  });
});
