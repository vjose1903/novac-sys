import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { MixinClass } from '@core/typescript/MixinClass';
import { ModalI } from '../../modal/modal-class';
import { table_config } from '../../new_tablas/tabla-class';
import { Ss } from '@core/services/singleton.service';
import { fun } from '@core/services/functions.service';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

@Component({
  selector: 'app-modal-seleccionar-articulo',
  templateUrl: './modal-seleccionar-articulo.component.html',
  styleUrls: ['./modal-seleccionar-articulo.component.scss'],
  standalone: false,
})
export class ModalSeleccionarArticuloComponent extends MixinClass implements OnInit, IDynamicModal {
  table_config: table_config = {
    info: [
      { titulo: '1', tipo: 'icon', key: 'estado', style: { width: '2rem', color: 'var(--transparente00)' }, iconsArray: [{ key: 'articulo_is_active', rowTooltip: 'articulo_is_active_tooltip', text_color: 'is_active_color' }] },
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion', style: { width: '44%', 'text-align': 'left', 'padding-left': '0.5rem' } },
      { titulo: 'Cantidad', tipo: 'text', key: 'cantidad', style: { width: '12%' } },
      { titulo: 'Unidad', tipo: 'text', key: 'unidad', style: { width: '14%' } },
      { titulo: 'Retirado', tipo: 'text', key: 'retirado_mostrar', style: { width: '12%' } },
      { titulo: 'Restante', tipo: 'text', key: 'restante_mostrar', style: { width: '12%' } },
      { titulo: 'Seleccione', tipo: 'switch', key: 'select', style: { width: '10.8%' }, disable: [{ kind: 'campo', target: 'disable', value: [true] }] },
    ],
    colores: true,
    id_tabla: 'tabla_adelantados',
    obj_paginate: { show: false },
  };

  articulos_selected = [];

  constructor() {
    super();
  }

  @Input() modalConfig: IModalConfiguration;
  @Input() modalWrapper: DynamicModalComponent;
  @Input() data: any;

  ngOnInit() {
    this.data.map(async articulo => {
      articulo.articulo_is_active = articulo.articulo_estado ? '' : 'fas fa-times';
      articulo.articulo_is_active_tooltip = articulo.articulo_estado ? '' : 'Articulo Inactivo';
      articulo.is_active_color = 'red';
      articulo.danger = !articulo.articulo_estado;
      articulo.customStyles = {
        estado: [{ key: 'articulo_is_active', estilos: 'font-size: 1.2rem !important' }],
      };

      return articulo;
    });
  }

  parseCantidades() {}

  tableInputChange(event) {
    const btnConfirmar = this.modalConfig.botones.find(btn => btn.id == 'btnConfirmar');
    if (event.key == 'select') this.articulos_selected = this.data.filter(item => item.select && !item.disable);

    console.log('btnConfirmar ', btnConfirmar);

    if (btnConfirmar) {
      fun.setTimeout(() => {
        console.log('this.articulos_selected.length ', this.articulos_selected.length);

        btnConfirmar.disable = this.articulos_selected.length == 0;
      }, 50);
    }
  }

  submit() {
    this.modalConfig.close({ articulos_selected: this.articulos_selected });
  }
}
