import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import { ModalI } from '../../new_modal/modal-class';
import { TablasService } from '../../tablas/tablas.service';
@Component({
  selector: 'app-modal-historial-pagos',
  templateUrl: './modal-historial-pagos.component.html',
  styleUrls: ['./modal-historial-pagos.component.scss'],
})
export class ModalHistorialPagosComponent implements OnInit, ModalI {
  // @Input() detalles;
  activeIndex = 0;

  info_pagos = [
    { titulo: 'NO. recibo', key: 'numero_recibo' },
    { titulo: 'Abonado', key: 'deposito', formatoNumero: true },
    { titulo: 'Fecha abono', key: 'fecha_equivalente' },
  ];

  info_notas = [
    { titulo: 'NO. comprobante', key: 'numero_comprobante' },
    { titulo: 'Crédito', key: 'total_factura', formatoNumero: true },
    { titulo: 'Fecha nota', key: 'fecha_equivalente' },
  ];

  constructor(private tServ: TablasService) {}
  modal: any = {};
  inputs: any;
  btn_aceptar() {
    throw new Error('Method not implemented.');
  }

  ngOnInit() {
    this.activeIndex = this.arrayHasData('abonos').cant > 0 ? 0 : 1;
  }

  clickTabView(index) {
    const tipo = index == 0 ? 'abonos' : 'notas';
    const cantidad = this.arrayHasData(tipo).cant;

    if (index == 0) {
      if (cantidad > 0) {
        this.activeIndex = index;
        const obj = { total: cantidad, tabla: 'historial_movimientos' };
        this.tServ.Func_total_paginas(obj);
      } else this.activeIndex = 1;
    } else {
      if (cantidad > 0) {
        this.activeIndex = index;
        const obj = { total: cantidad, tabla: 'historial_movimientos' };
        this.tServ.Func_total_paginas(obj);
      } else this.activeIndex = 0;
    }
  }

  arrayHasData(tipo) {
    return { disable: this.inputs[tipo].length === 0, cant: this.inputs[tipo].length };
  }
}
