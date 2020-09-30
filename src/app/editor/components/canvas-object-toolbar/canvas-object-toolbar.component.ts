import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '../../../shared/services/konva.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-canvas-object-toolbar',
  templateUrl: './canvas-object-toolbar.component.html',
  styleUrls: ['./canvas-object-toolbar.component.scss']
})
export class CanvasObjectToolbarComponent implements OnInit, OnDestroy {

  canvasObjectType: 'image' | 'text' | 'shape' | 'background';

  typeSubscription: Subscription;

  constructor(
    public konva: KonvaService
  ) {
    this.typeSubscription = this.konva.$selectedObjectType.subscribe(objectType => this.canvasObjectType = objectType);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.typeSubscription.unsubscribe();
  }

}
