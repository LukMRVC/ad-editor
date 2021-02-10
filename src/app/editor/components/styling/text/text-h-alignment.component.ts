import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-text-h-alignment',
  template: `
    <!-- Font horizontal alignment -->
    <mat-button-toggle-group value="left" fxFlexAlign="start" (change)="this.alignmentChanged.emit($event.value)"
                             #textAlignGroup="matButtonToggleGroup">
      <mat-button-toggle value="left" aria-label="Text align left">
        <mat-icon>format_align_left</mat-icon>
      </mat-button-toggle>
      <mat-button-toggle value="center" aria-label="Text align center">
        <mat-icon>format_align_center</mat-icon>
      </mat-button-toggle>
      <mat-button-toggle value="right" aria-label="Text align right">
        <mat-icon>format_align_right</mat-icon>
      </mat-button-toggle>
      <mat-button-toggle value="justify" aria-label="Text align justify">
        <mat-icon>format_align_justify</mat-icon>
      </mat-button-toggle>
    </mat-button-toggle-group>
  `,
  styles: [
  ]
})
export class TextHAlignmentComponent {

  @Output() alignmentChanged: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

}
