import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../../../utils/javascript/moment';
import { AppConfig } from '../../../../../environments/environment';

import { GLOBAL } from '../../../../core/services/GLOBAL';
@Component({
  selector: 'app-formar-factura',
  templateUrl: './formar-factura.component.html',
  styleUrls: ['./formar-factura.component.scss'],
})
export class FormarFacturaComponent implements OnInit {
  @Input() factura;
  num_telefono = AppConfig.num_telefono;
  rnc = AppConfig.rnc;
  constructor() {}

  ngOnInit() {
    // this.factura.detalle_facturas = [
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    // ];
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }
  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }
  formatoFecha(fecha) {
    moment.locale('es');
    return moment(fecha).format('DD/MM/YYYY');
  }
  formatoHora(fecha) {
    moment.locale('es');
    return moment(fecha).format('hh:mm a');
  }
}
