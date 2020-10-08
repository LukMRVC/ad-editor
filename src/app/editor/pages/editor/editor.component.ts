import {AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '../../../shared/services/konva.service';
import {Subscription} from 'rxjs';
import {LayerData} from '../../components/stage-layers/stage-layers.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterContentInit, OnDestroy {

  canvasWidth = 600;
  canvasHeight = 400;
  private subscription: Subscription = new Subscription();

  constructor(
    public konva: KonvaService
  ) { }

  ngAfterContentInit(): void {
    this.konva.init({ container: 'canvas-stage', width: this.canvasWidth, height: this.canvasHeight });
    const stage = this.konva.getInstance();
    const layer = this.konva.layer({ name: 'Layer 1', id: '123' });
    const circle = this.konva.circle({
      x: this.konva.getInstance().width() / 2,
      y: this.konva.getInstance().height() / 2,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 5,
      draggable: true,
    });
    const tr = this.konva.transformer();
    layer.add(circle);
    layer.add(tr);
    stage.add(layer);
    this.subscription.add(this.konva.onClickTap$.subscribe( (e) => {
      if (e.target === stage) {
        tr.nodes([]);
        layer.draw();
        return;
      }
      const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      const isSelected = tr.nodes().indexOf(e.target) >= 0;
      if (!metaPressed && !isSelected) {
        tr.nodes([e.target]);
      } else if (metaPressed && isSelected) {
        const nodes = tr.nodes().filter( node => node !== e.target );
        tr.nodes(nodes);
      } else if (metaPressed && !isSelected) {
        tr.nodes(tr.nodes().concat([e.target]));
      }
      layer.draw();
    }));
    layer.draw();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  resizeCanvas(): void {
    this.konva.getInstance().width(this.canvasWidth);
    this.konva.getInstance().height(this.canvasHeight);
  }

}
