import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'evenOdd'
})
export class EvenOddPipe implements PipeTransform {

  transform(value: any[], filter: 'even'|'odd'): any[] {
    if ( !value || (filter !== 'even' && filter !== 'odd')) {
      return [];
    }
    return value.filter( (val, idx) => filter === 'even' ? idx % 2 === 1 : idx % 2 === 0);
  }

}
