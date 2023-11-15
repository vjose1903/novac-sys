import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalComponentI, ModalI } from '../../modal/modal-class';
import { table_config } from '../../new_tablas/tabla-class';
import { fun } from '../../../../core/services/functions.service';
@Component({
  selector: 'app-modal-historial-pagos',
  templateUrl: './modal-historial-pagos.component.html',
  styleUrls: ['./modal-historial-pagos.component.scss'],
})
export class ModalHistorialPagosComponent extends MixinClass implements OnInit, ModalI, AfterViewInit {
  @ViewChild('TabViewHistorial') tabViewHistorial: any;
  activeIndex = 0;

  table_pagos_config: table_config = {
    info: [
      { titulo: 'NO. Pago', tipo: 'text', key: 'numero' },
      { titulo: 'Pagado', tipo: 'formatoNumero', key: 'deposito' },
      { titulo: 'Fecha pago', tipo: 'text', key: 'fecha_equivalente' },
    ],
    colores: true,
    id_tabla: 'listado_pagos',
  };
  tablaPagosComponent;

  table_recibos_config: table_config = {
    info: [
      { titulo: 'NO. recibo', tipo: 'text', key: 'numero_recibo' },
      { titulo: 'Abonado', tipo: 'formatoNumero', key: 'deposito' },
      { titulo: 'Fecha abono', tipo: 'text', key: 'fecha_equivalente' },
    ],
    colores: true,
    id_tabla: 'listado_recibos',
  };
  tablaRecibosComponent;

  table_notas_config: table_config = {
    info: [
      { titulo: 'NO. comprobante', tipo: 'text', key: 'numero_comprobante' },
      { titulo: 'Tipo', tipo: 'text', key: 'tipo_label' },
      { titulo: 'Monto', tipo: 'formatoNumero', key: 'total' },
      { titulo: 'Fecha nota', tipo: 'text', key: 'fecha_equivalente' },
    ],
    colores: true,
    id_tabla: 'listado_notas',
  };
  tablaNotasComponent;

  show = true;

  showPagos = true;
  showRecibos = true;
  showNotas = true;

  currentTabs = {};

  constructor() {
    super();
  }

  modalComponent: ModalComponentI = {};
  inputs: any;

  ngOnInit() {
    if (fun.objHas(this.inputs, 'config')) {
      if (fun.objHas(this.inputs.config, 'showPagos')) this.showPagos = this.inputs.config.showPagos;
      if (fun.objHas(this.inputs.config, 'showRecibos')) this.showRecibos = this.inputs.config.showRecibos;
      if (fun.objHas(this.inputs.config, 'showNotas')) this.showNotas = this.inputs.config.showNotas;
    }
  }

  ngAfterViewInit(): void {
    for (let index = 0; index < this.tabViewHistorial.tabs.length; index++) {
      const tab = this.tabViewHistorial.tabs[index];
      const header = tab._header.split(' ')[0].toLowerCase();
      if (!this.arrayHasData(header).disable) {
        this.activeIndex = index;
        break;
      }
    }

    this.tabViewHistorial.tabs.forEach((tab, index) => {
      const header = tab._header.split(' ')[0].toLowerCase();
      this.currentTabs[index] = header;
    });
  }

  clickTabView(index) {
    this.show = false;
    const tipo = this.currentTabs[index];
    const cantidad = this.arrayHasData(tipo).cant;

    if (index == 0) {
      if (cantidad > 0) {
        this.activeIndex = index;
      } else this.activeIndex = 1;
    } else {
      if (cantidad > 0) {
        this.activeIndex = index;
      } else this.activeIndex = 0;
    }
    setTimeout(() => (this.show = true), 10);
  }

  arrayHasData(tipo) {
    return { disable: this.inputs[tipo]?.length == 0, cant: this.inputs[tipo]?.length };
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
