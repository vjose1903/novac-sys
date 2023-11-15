import { Component, OnInit } from '@angular/core';
import { ModalComponentI, ModalI } from '../../components/modal/modal-class';
import * as _ from 'lodash';
import { fun } from '../../../core/services/functions.service';

@Component({
  selector: 'app-detalle-factura',
  templateUrl: './detalle-factura.component.html',
  styleUrls: ['./detalle-factura.component.scss'],
})
export class DetalleFacturaComponent implements OnInit, ModalI {
  constructor() {}
  modalComponent: ModalComponentI = {};
  inputs: any;

  detalles = [{ label: 'Forma de pago', key: 'forma_pago', tipo: 'string' }];

  entidad;
  entidadLabel;

  ngOnInit(): void {

    const hasCliente = fun.hasValue(this.inputs.data.cliente);
    this.entidad = hasCliente ? this.inputs.data.cliente : this.inputs.data.suplidor;
    this.entidadLabel = hasCliente ? 'Cliente' : 'Suplidor';
  }

  getValue(config) {
    let value = fun.getProperty(this.inputs.data, config.key);

    if (config.tipo == 'number') value = fun.roundNumberToDecimal(value);

    return value;
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
