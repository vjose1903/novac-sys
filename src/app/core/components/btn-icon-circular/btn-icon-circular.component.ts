import { fun } from '@core/services/functions.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'btn-icon-circular',
    templateUrl: './btn-icon-circular.component.html',
    styleUrls: ['./btn-icon-circular.component.scss'],
    standalone: false
})
export class BtnIconCircularComponent implements OnInit {
  @Input() id;
  @Input() icon;
  @Input() icon_size;
  @Input() size;
  @Input() tooltip;
  @Input() tooltipPosition;

  @Output() clickFunction = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {
    if (fun.isEmpty(this.icon_size)) {
      if (this.size == 'size-sm') this.icon_size = '0.9rem';
      if (this.size == 'size-md') this.icon_size = '1.3rem';
      if (this.size == 'size-lg') this.icon_size = '1.4rem';
    }
  }

  clickIcon(event) {
    this.clickFunction.emit(event);
  }
}
