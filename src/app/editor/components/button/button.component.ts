import {Component, OnDestroy, OnInit} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {Color} from '@angular-material-components/color-picker';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit, OnDestroy {

  cornerRadius = 0;
  fontSize = 0;

  fontFillColor: Color = new Color(0, 0, 0, 255);

  buttonFillColor: Color = new Color(255, 255, 255, 255);
  padding = 5;

  private bgChanged = new Subject<any>();

  constructor(
    public konva: KonvaService,
  ) { }

  ngOnInit(): void {
    this.bgChanged.pipe(debounceTime(250))
      .subscribe(conf => this.konva.updateBackgroundOfShape(conf, 'button-tag'));
  }

  ngOnDestroy(): void {
    this.bgChanged.complete();
  }

  backgroundChanged(conf): void {
    this.bgChanged.next(conf);
  }

}
