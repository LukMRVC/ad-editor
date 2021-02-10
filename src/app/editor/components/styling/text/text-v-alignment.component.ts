import { Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-text-v-alignment',
  template: `
    <!-- Font vertical alignment -->
    <mat-button-toggle-group value="left" fxFlexAlign="start" (change)="this.alignmentChanged.emit($event.value)"
                             #textVerticalAlignGroup="matButtonToggleGroup">
      <mat-button-toggle value="bottom" aria-label="Text align bottom">
        <mat-icon>vertical_align_bottom</mat-icon>
      </mat-button-toggle>
      <mat-button-toggle value="middle" aria-label="Text align middle">
        <mat-icon>vertical_align_center</mat-icon>
      </mat-button-toggle>
      <mat-button-toggle value="top" aria-label="Text align top">
        <mat-icon>vertical_align_top</mat-icon>
      </mat-button-toggle>
    </mat-button-toggle-group>
  `,
  styles: [
  ]
})
export class TextVAlignmentComponent {

  @Output() alignmentChanged: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }


}
