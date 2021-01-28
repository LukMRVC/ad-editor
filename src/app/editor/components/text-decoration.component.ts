import {Component, OnInit, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-text-decoration',
  template: `
    <!-- Text decoration -->
    <div fxLayout="row" fxFlex fxLayoutGap="0.5rem">
      <mat-button-toggle-group multiple (change)="this.decorationChanged.emit({textDecoration: headlineTextDecoration.join(' ')})"
                               [(ngModel)]="headlineTextDecoration" >
        <mat-button-toggle value="underline" aria-label="Text align left">
          <mat-icon>format_underline</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="line-through" aria-label="Text align center">
          <mat-icon>strikethrough_s</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>

      <mat-button-toggle-group multiple (change)="this.decorationChanged.emit({fontStyle: headlineFontStyle.join(' ')})"
                               [(ngModel)]="headlineFontStyle" >
        <mat-button-toggle value="bold" aria-label="Text align left">
          <mat-icon>format_bold</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="italic" aria-label="Text align center">
          <mat-icon>format_italic</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  styles: [
  ]
})
export class TextDecorationComponent implements OnInit {

  @Output() decorationChanged = new EventEmitter<{ textDecoration?: string, fontStyle?: string }>();

  headlineTextDecoration = [];
  headlineFontStyle = [];

  constructor() { }

  ngOnInit(): void {
  }

}
