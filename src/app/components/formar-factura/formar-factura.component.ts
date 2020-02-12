import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
@Component({
  selector: 'app-formar-factura',
  templateUrl: './formar-factura.component.html',
  styleUrls: ['./formar-factura.component.scss'],
})
export class FormarFacturaComponent implements OnInit {
  @Input() factura;
  constructor() {}

  ngOnInit() {}
  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }
  formatoFecha(fecha) {
    return moment(fecha).format('DD/MM/YYYY');
  }
}
