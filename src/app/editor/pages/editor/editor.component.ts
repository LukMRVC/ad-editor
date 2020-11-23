import {AfterContentInit, AfterViewInit, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
// @ts-ignore
import {KonvaService} from '@core/services/konva.service';
import {Subscription} from 'rxjs';
import {LayerData} from '../../components/stage-layers/stage-layers.component';
import {buffer} from 'rxjs/operators';
import {$} from 'protractor';

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
      radius: 100,
      fill: '#ff0000ff',
      stroke: '#000000ff',
      strokeWidth: 5,
      draggable: true,
    });
    const tr = this.konva.transformer();
    layer.add(circle);
    layer.add(tr);
    stage.add(layer);
    this.subscription.add(this.konva.onClickTap$.subscribe( (e) => {
      if (e.target.getClassName() === 'Text') {
        this.konva.updateSelectedObjectType('text');
      }
      if (e.target === stage) {
        tr.nodes([]);
        layer.draw();
        return;
      }
      const metaPressed = e.evt.ctrlKey || e.evt.metaKey;
      const isSelected = tr.nodes().indexOf(e.target) >= 0;
      if (!metaPressed && !isSelected) {
        tr.nodes([e.target]);
      } else if (metaPressed && isSelected) {
        const nodes = tr.nodes().filter( node => node !== e.target );
        tr.nodes(nodes);
      } else if (metaPressed && !isSelected) {
        tr.nodes(tr.nodes().concat([e.target]));
      }
      layer.batchDraw();
    }));
    layer.batchDraw();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  resizeCanvas(): void {
    this.konva.getInstance().width(this.canvasWidth);
    this.konva.getInstance().height(this.canvasHeight);
  }

  @HostListener('document:keydown.delete')
  onDeletePressed(): void {
    this.konva.deleteSelected();
  }

  imageUploaded($imageData: { file: File, buffer: ArrayBuffer }): void {
    const blob = new Blob( [$imageData.buffer], { type: $imageData.file.type });
    const urlCreate = window.URL || window.webkitURL;
    const imageUrl = urlCreate.createObjectURL(blob);
    const image = new window.Image();
    // image.width = this.canvasWidth / 2;
    image.src = imageUrl;
    image.onload = () => this.konva.image({ image, scaleX: 0.3, scaleY: 0.3, draggable: true });
  }

  moveObjectInLayer(direction: 'down' | 'down-one' | 'up-one' | 'up'): void {
    this.konva.moveObjectZIndices(direction);
  }
}
