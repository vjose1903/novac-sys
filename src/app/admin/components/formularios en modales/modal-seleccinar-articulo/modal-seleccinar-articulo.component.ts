import { EventEmitter, OnChanges } from '@angular/core';
import { Component, OnInit, OnDestroy, Input, Output, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { fun } from '../../../../core/services/functions.service';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ArticuloC } from '../../../registros/articulos/articulo';
import { ModalI } from '../../modal/modal-class';

@Component({
  selector: 'app-modal-seleccinar-articulo',
  templateUrl: './modal-seleccinar-articulo.component.html',
  styleUrls: ['./modal-seleccinar-articulo.component.scss'],
})
export class ModalSeleccinarArticuloComponent extends MixinClass implements OnInit, OnDestroy, OnChanges, ModalI {
  // @Input() articulos;
  @Input() returnArticulos;
  @Output() getArticulos = new EventEmitter<any>();

  info = [
    { titulo: 'Articulo', tipo: 'text', key: 'descripcion', estilos: [{ width: '44%' }, { 'text-align': 'left' }, { 'padding-left': '0.5rem' }] },
    { titulo: 'Cantidad', tipo: 'text', key: 'cantidad', estilos: [{ width: '12%' }] },
    { titulo: 'Unidad', tipo: 'text', key: 'unidad', estilos: [{ width: '14%' }] },
    { titulo: 'Retirado', tipo: 'text', key: 'retirado_mostrar', estilos: [{ width: '12%' }] },
    { titulo: 'Restante', tipo: 'text', key: 'restante_mostrar', estilos: [{ width: '12%' }] },
    { titulo: 'Seleccione', tipo: 'inputSwitch', key: 'select', estilos: [{ width: '10.8%' }], disable: [{ kind: 'campo', target: 'disable', value: [true] }], title: '' },
  ];

  articulos_selected = [];

  constructor() {
    super();
  }
  modal: any = {};
  inputs: any;
  btn_aceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    modal.getDataModal({ data: this.articulos_selected, modal_id: this.modal.component_id });
  }

  ngOnInit() {
    this.inputs = fun.duplicarJson(this.inputs);

    this.inputs.map(async (arti) => {
      arti.customStyles = {
        'td-descripcion': { width: '42.2%', 'text-align': 'left', 'padding-left': '0.5rem' },
        'td-cantidad': { width: '9%' },
        'td-unidad': { width: '15%' },
        'td-retirado_mostrar': { width: '9%' },
        'td-restante_mostrar': { width: '15%' },
        'td-select': { width: '6.5%' },
      };

      return arti;
    });
  }

  parseCantidades() {}

  ngOnChanges(simpleChanges) {
    if (simpleChanges && simpleChanges.returnArticulos && simpleChanges.returnArticulos.currentValue) {
      this.getArticulos.emit({ body: this.articulos_selected });
    }
  }

  ngOnDestroy(): void {
    this.resetLista();
  }

  resetLista() {
    this.articulos_selected = [];
  }

  getInfoChange(item) {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);

    if (item.cambio == 'select') this.articulos_selected = _.filter(item.body, { select: true, disable: false });

    setTimeout(() => {
      modal.botones.dinamico[1].disable;
      modal.botones.dinamico[1].disable = this.articulos_selected.length == 0;
    }, 50);
  }

  modificarFacturaSelected(item) {
    const index = _.findIndex(this.articulos_selected, (arti: any) => {
      return arti.id === item.body[item.index].id;
    });
    if (index !== -1) {
      this.articulos_selected[index] = item.body[item.index];
    }
  }
}
