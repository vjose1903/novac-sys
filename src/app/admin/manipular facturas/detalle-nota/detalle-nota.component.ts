import { Component, OnInit } from '@angular/core';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { fun } from '../../../core/services/functions.service';
import { ModalI } from '../../components/modal/modal-class';
import { table_config } from '../../components/new_tablas/tabla-class';
@Component({
  selector: 'app-detalle-nota',
  templateUrl: './detalle-nota.component.html',
  styleUrls: ['./detalle-nota.component.scss'],
})
export class DetalleNotaComponent extends MixinClass implements OnInit, ModalI {
  constructor() {
    super();
  }

  modal: any = {};
  inputs: any;
  tabIndex = 0;

  tablaComponent;

  table_config: table_config = {
    info: [
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion', estilos: [{ 'text-align': 'left' }, { width: '50%' }, { 'padding-left': '1rem' }] },
      { titulo: 'Cantidad', key: 'cantidad', tipo: 'formatoNumero', estilos: [{ width: '25%' }] },
      { titulo: 'Unidad', key: 'unidad', tipo: 'text', estilos: [{ width: '25%' }] },
    ],
    id_tabla: 'detalles_notas',
    obj_paginate: { show: false },
  };

  show: boolean = true;

  ngOnInit(): void {
    this.parseInfo();
  }

  parseInfo() {
    this.inputs.data.facturas_aplicadas.map((factura_aplicada) => {
      factura_aplicada.detalles_facturas_notas.map((detalle) => {
        detalle.descripcion = detalle.articulo.nombre;
        detalle.customStyles = {
          descripcion: { width: '50%', 'padding-left': '1rem', 'text-align': 'left' },
          cantidad: { width: '25%' },
          unidad: { width: '25%' },
        };
        return detalle;
      });
      return factura_aplicada;
    });
  }

  clickTabView(index) {
    this.show = false;
    setTimeout(() => (this.show = true), 10);
  }

  numFormat(str) {
    return fun.numFormatTwoDecimals(str);
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
