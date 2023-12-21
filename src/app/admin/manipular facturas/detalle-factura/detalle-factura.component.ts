import { Component, OnInit } from '@angular/core';
import { ModalI } from '../../components/modal/modal-class';
import * as _ from 'lodash';
import { fun } from '../../../core/services/functions.service';

@Component({
  selector: 'app-detalle-factura',
  templateUrl: './detalle-factura.component.html',
  styleUrls: ['./detalle-factura.component.scss'],
})
export class DetalleFacturaComponent implements OnInit, ModalI {
  constructor() {}
  modal: any = {};
  inputs: any;

  detalles = [{ label: 'Forma de pago', key: 'forma_pago', tipo: 'string' }];

  ngOnInit(): void {}

  getValue(config) {
    let value = _.get(this.inputs.data, config.key);

    if (config.tipo == 'number') value = fun.roundNumberToDecimal(value);

    return value;
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
