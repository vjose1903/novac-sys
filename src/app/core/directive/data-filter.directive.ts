import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { fun } from '../services/functions.service';

@Directive({
  selector: '[DataFilter]',
})
export class DataFilterDirective {
  @Input('DataFilter') copyData: string;
  @Input('filterTarget') targets: Array<string>;

  @Output() onFilter = new EventEmitter<any>();

  @HostListener('input') oninput() {
    fun.my_filter_data(this.copyData, this.el['nativeElement']['value'], this.targets).then((res) => {
      this.onFilter.emit(res);
    });
  }

  constructor(private el: ElementRef) {}
}
