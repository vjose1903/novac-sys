import { Component, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { Permisos } from '../../../core/typescript/permisos';
import { fun } from '../../../core/services/functions.service';
import { searchDiurnalCode } from './libro-diario-page.utils';
import { table_config } from '../../components/new_tablas/tabla-class';

@Component({
  selector: 'app-libro-diario-page',
  templateUrl: './libro-diario-page.component.html',
  styleUrls: ['./libro-diario-page.component.scss'],
})
export class LibroDiarioPageComponent extends MixinClass implements OnInit, OnDestroy {
  permissions = Permisos.cabeza_asiento_contable;
  searchDiurnalCode = searchDiurnalCode;

  desde;
  hasta;

  table_config_diurnal: table_config = {
    info: [
      { titulo: 'Código', key: 'codigo', tipo: 'text', style: { width: '20%', 'text-align': 'left' } },
      { titulo: 'Descripcion', key: 'descripcion', tipo: 'text', style: { width: '40%', 'text-align': 'left' } },
      { titulo: 'Auxiliar', key: 'estado_', tipo: 'text' },
      { titulo: 'Débito', key: 'debito', tipo: 'text' },
      { titulo: 'Crédito', key: 'credito', tipo: 'text' },
    ],
    id_tabla: 'diurnalDetail',
    redondo: false,
    obj_paginate: { show: false },
  };

  detalle;

  temp = [
    {title:'01/10/2023 - Para registrar compra de ....'},
    {title:'05/10/2023 - Para registrar compra de ....'},
    {title:'08/10/2023 - Para registrar compra de ....'},
  ]

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'libro_diario_page', is_routing: true });
    this.necesarioStart();
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  async necesarioStart() {
    this.initDateVars();
  }

  initDateVars() {
    let actual_date = new Date();
    actual_date.setDate(actual_date.getDate() - 1);

    const desde = new Date(fun.getFirstDayOfMoth(actual_date));

    this.desde = desde;
    this.hasta = actual_date;
  }

  nuevoRegistro() {}

  filter(palabra_a_buscar) {
    console.log('palabra_a_buscar ', palabra_a_buscar);
  }
}
