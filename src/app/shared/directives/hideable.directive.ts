import {Directive, ElementRef, Input} from '@angular/core';

@Directive({
  selector: '[appHideable]',
})
export class HideableDirective {

  @Input('appHideable') direction: 'left'|'right'|'up'|'down' = 'left';

  @Input() set hide(val: boolean) {
    this.isHidden = val;
    this.toggleElement();
  }

  el: ElementRef;

  private isHidden = false;

  constructor(el: ElementRef) {
    this.el = el;
    this.el.nativeElement.style.transition = 'transform 0.3s ease-out';
  }

  private toggleElement(): void {
    if (this.isHidden) {
      switch (this.direction) {
        case 'left':
          this.el.nativeElement.style.transform = 'translateX(-100%)';
          break;
        case 'right':
          this.el.nativeElement.style.transform = 'translateX(100%)';
          break;
        case 'up':
          this.el.nativeElement.style.transform = 'translateY(-100%)';
          break;
        case 'down':
          this.el.nativeElement.style.transform = 'translateY(100%)';
          break;
        default:
          this.el.nativeElement.style.transform = 'translateX(-100%)';
          break;
      }
    } else {
      this.el.nativeElement.style.transform = null;
      this.el.nativeElement.style.transform = null;
    }
  }

}
