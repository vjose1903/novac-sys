import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../../core/javascript/moment';

import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import { SingletonService } from '../../../../core/services/singleton.service';
import { ModalI } from '../../new_modal/modal-class';
@Component({
  selector: 'app-formar-factura',
  templateUrl: './formar-factura.component.html',
  styleUrls: ['./formar-factura.component.scss'],
})
export class FormarFacturaComponent implements OnInit, ModalI {
  // @Input() factura;
  num_telefono;
  rnc;
  configServ = SingletonService.configServ;
  constructor() {}
  modal: any;
  inputs: any;
  btn_aceptar() {}

  ngOnInit() {
    // this.factura.detalle_facturas = [
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    //   ...this.factura.detalle_facturas,
    // ];
    console.log('LOS DATOS QUE LLEGAN: ', this.inputs);
    
    this.configServ.getConfig().then((config) => {
      this.num_telefono = config.telefono_empresa;
      this.rnc = config.rnc_empresa;
    });
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
