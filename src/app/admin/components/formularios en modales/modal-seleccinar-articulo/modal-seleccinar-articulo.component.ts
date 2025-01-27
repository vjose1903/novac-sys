import { EventEmitter } from '@angular/core';
import { Component, OnInit, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalI } from '../../modal/modal-class';
import { table_config } from '../../new_tablas/tabla-class';

@Component({
    selector: 'app-modal-seleccinar-articulo',
    templateUrl: './modal-seleccinar-articulo.component.html',
    styleUrls: ['./modal-seleccinar-articulo.component.scss'],
    standalone: false
})
export class ModalSeleccinarArticuloComponent extends MixinClass implements OnInit, ModalI {
  table_config: table_config = {
    info: [
      { titulo: '1', tipo: 'icon', key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'articulo_is_active', rowTooltip: 'articulo_is_active_tooltip', text_color: 'is_active_color' }] },
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion', estilos: [{ width: '44%' }, { 'text-align': 'left' }, { 'padding-left': '0.5rem' }] },
      { titulo: 'Cantidad', tipo: 'text', key: 'cantidad', estilos: [{ width: '12%' }] },
      { titulo: 'Unidad', tipo: 'text', key: 'unidad', estilos: [{ width: '14%' }] },
      { titulo: 'Retirado', tipo: 'text', key: 'retirado_mostrar', estilos: [{ width: '12%' }] },
      { titulo: 'Restante', tipo: 'text', key: 'restante_mostrar', estilos: [{ width: '12%' }] },
      { titulo: 'Seleccione', tipo: 'switch', key: 'select', estilos: [{ width: '10.8%' }], disable: [{ kind: 'campo', target: 'disable', value: [true] }] },
    ],
    colores: true,
    id_tabla: 'tabla_adelantados',
    obj_paginate: { show: false },
  };

  articulos_selected = [];

  constructor() {
    super();
  }

  modal: any = {};
  inputs: any;

  btn_aceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    modal.returnDataFromModal({ data: this.articulos_selected, modal_id: this.modal.component_id });
  }

  ngOnInit() {
    this.inputs.map(async (arti) => {
      arti.articulo_is_active = arti.articulo_estado ? '' : 'fas fa-times';
      arti.articulo_is_active_tooltip = arti.articulo_estado ? '' : 'Articulo Inactivo';
      arti.is_active_color = 'red';
      arti.danger = !arti.articulo_estado;
      arti.customStyles = {
        estado: [
          { key: 'estado', isTd: true, estilos: 'width: 2rem !important;' },
          { key: 'articulo_is_active', estilos: 'font-size: 1.2rem !important' },
        ],
        descripcion: { width: '42.2%', 'text-align': 'left', 'padding-left': '0.5rem' },
        cantidad: { width: '9%' },
        unidad: { width: '15%' },
        retirado_mostrar: { width: '9%' },
        restante_mostrar: { width: '15%' },
        select: { width: '6.5%' },
      };

      return arti;
    });
  }

  parseCantidades() {}

  tableInputChange(event) {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    if (event.key == 'select') this.articulos_selected = _.filter(this.inputs, { select: true, disable: false });

    setTimeout(() => (modal.botones.dinamico[1].disable = this.articulos_selected.length == 0), 50);
  }
}
