import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalI } from '../../modal/modal-class';
import { table_config } from '../../new_tablas/tabla-class';
import { TablasService } from '../../tablas/tablas.service';
@Component({
  selector: 'app-modal-historial-pagos',
  templateUrl: './modal-historial-pagos.component.html',
  styleUrls: ['./modal-historial-pagos.component.scss'],
})
export class ModalHistorialPagosComponent extends MixinClass implements OnInit, ModalI {
  activeIndex = 0;

  table_pagos_config: table_config = {
    info: [
      { titulo: 'NO. recibo', tipo: 'text', key: 'numero_recibo' },
      { titulo: 'Abonado', tipo: 'formatoNumero', key: 'deposito' },
      { titulo: 'Fecha abono', tipo: 'text', key: 'fecha_equivalente' },
    ],
    colores: true,
    id_tabla: 'listado_pagos',
  };
  tablaPagosComponent;

  table_notas_config: table_config = {
    info: [
      { titulo: 'NO. comprobante', tipo: 'text', key: 'numero_comprobante' },
      { titulo: 'Crédito', tipo: 'formatoNumero', key: 'total' },
      { titulo: 'Fecha nota', tipo: 'text', key: 'fecha_equivalente' },
    ],
    colores: true,
    id_tabla: 'listado_notas',
  };
  tablaNotasComponent;

  constructor(private tServ: TablasService) {
    super();
  }
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
        // this.tServ.Func_total_paginas(obj);
      } else this.activeIndex = 1;
    } else {
      if (cantidad > 0) {
        this.activeIndex = index;
        const obj = { total: cantidad, tabla: 'historial_movimientos' };
        // this.tServ.Func_total_paginas(obj);
      } else this.activeIndex = 0;
    }
  }

  arrayHasData(tipo) {
    return { disable: this.inputs[tipo].length === 0, cant: this.inputs[tipo].length };
  }
}
