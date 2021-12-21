import { EventEmitter, OnChanges } from '@angular/core';
import { Component, OnInit, OnDestroy, Input, Output, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DBservice } from '../../../../core/services/bdservice.service';

import { GLOBAL } from '../../../../core/services/GLOBAL';
import { ModalService } from '../../modal/modal.service';

@Component({
  selector: 'app-modal-seleccinar-articulo',
  templateUrl: './modal-seleccinar-articulo.component.html',
  styleUrls: ['./modal-seleccinar-articulo.component.scss'],
})
export class ModalSeleccinarArticuloComponent implements OnInit, OnDestroy, OnChanges {
  @Input() articulos;
  @Input() returnArticulos;
  @Output() getArticulos = new EventEmitter<any>();

  info = [
    {
      titulo: 'Articulo',
      key: 'descripcion',
      estilos: [{ width: '44%' }, { 'text-align': 'left' }, { 'padding-left': '0.5rem' }],
    },
    {
      titulo: 'Cantidad',
      key: 'cantidad',
      estilos: [{ width: '12%' }],
    },
    {
      titulo: 'Unidad',
      key: 'unidad',
      estilos: [{ width: '14%' }],
    },
    {
      titulo: 'Retirado',
      key: 'retirado_mostrar',
      estilos: [{ width: '12%' }],
    },
    {
      titulo: 'Restante',
      key: 'restante_mostrar',
      estilos: [{ width: '12%' }],
    },
    {
      titulo: 'Seleccione',
      tipo: 'check',
      key: 'select',
      // estilos: [{ width: '10%' }, { display: 'flex' }, { 'justify-content': 'flex-end' }, { 'aling-items': 'center' }, { 'padding-right': '0.5rem' }],
      estilos: [{ width: '10.8%' }],

      disable: {
        getDisabled: false,
        campo: '',
      },
      title: '',
    },
  ];
  articulos_selected = [];

  subDeci: Subscription;
  constructor(private dbServ: DBservice, public mServ: ModalService) {}

  ngOnInit() {
    console.log('this.articulos --> ', this.articulos);

    this.articulos = GLOBAL.duplicarJson(this.articulos);
    this.articulos.map(async (arti) => {
      const medida = arti.retirado === 0 ? '' : arti.retirado < 100 ? 'LBS' : 'QTL';
      const cantidad = arti.retirado < 100 ? arti.retirado : arti.retirado / 100;
      const multiplo = arti.cantidad_en_unidades / arti.cantidad;
      const cant_en_unidades_actual = arti.cantidad_en_unidades - arti.retirado;
      const cant_restante = cant_en_unidades_actual / multiplo;

      arti.retirado_mostrar = cantidad + ' ' + medida;

      arti.restante_mostrar = cant_restante + ' ' + medida;

      arti.customStyles = {
        'td-descripcion': { width: '42.2%', 'text-align': 'left', 'padding-left': '0.5rem' },
        // 'td-select': { width: '10%', display: 'flex', 'justify-content': 'flex-end', 'aling-items': 'center', 'padding-right': '0.5rem' },
        'td-cantidad': { width: '9%' },
        'td-unidad': { width: '15%' },
        'td-retirado_mostrar': { width: '9%' },
        'td-restante_mostrar': { width: '15%' },
        'td-select': { width: '6.5%' },
      };

      return arti;
    });
  }

  ngOnChanges(simpleChanges) {
    if (simpleChanges && simpleChanges.returnArticulos && simpleChanges.returnArticulos.currentValue) {
      this.getArticulos.emit({ body: this.articulos_selected });
    }
  }

  ngOnDestroy(): void {
    if (this.subDeci) this.subDeci.unsubscribe();
    this.resetLista();
  }

  resetLista() {
    this.articulos_selected = [];
  }

  getInfoChange(item) {
    if (item.cambio === 'select') {
      const articulo = item.body[item.index];

      const _x_ = _.findIndex(this.articulos_selected, (arti) => {
        return arti.id === articulo.id;
      });

      if (!item.value) {
        if (this.articulos_selected[_x_]) {
          this.articulos_selected[_x_].destroy = 1;
        } else {
          articulo.destroy = 1;
          this.articulos_selected.push(articulo);
        }

        // _.pullAt(this.articulos_selected, i);
      } else {
        if (_x_ !== -1) {
          this.articulos_selected[_x_].destroy = 0;
        } else {
          this.articulos_selected.push(articulo);
        }
      }
    }
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
