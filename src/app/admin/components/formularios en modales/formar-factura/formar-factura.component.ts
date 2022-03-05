import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../../core/javascript/moment';

import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import { SingletonService } from '../../../../core/services/singleton.service';
import { ConfigI } from '../../../../core/typescript/config-interface';
import { FunctionService } from '../../../../core/services/functions.service';
@Component({
  selector: 'app-formar-factura',
  templateUrl: './formar-factura.component.html',
  styleUrls: ['./formar-factura.component.scss'],
})
export class FormarFacturaComponent implements OnInit {
  @Input() factura;

  configServ = SingletonService.configServ;
  config: ConfigI;
  constructor(private fun: FunctionService) {}

  ngOnInit() {
    // this.factura.detalle_facturas = [
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    // ];
    this.configServ.getConfig().then((config: ConfigI) => {
      this.config = config;
    });
  }

  formatoNumero(num) {
    return this.fun.formatearNumero(this.fun.redondearAdos(num));
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
