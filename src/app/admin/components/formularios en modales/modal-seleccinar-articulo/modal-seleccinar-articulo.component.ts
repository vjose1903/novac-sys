import { EventEmitter, OnChanges } from '@angular/core';
import { Component, OnInit, OnDestroy, Input, Output, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { GLOBAL } from '../../../../core/services/GLOBAL';
import { mixinClass } from '../../../mixinClass';
import { ArticuloC } from '../../../registros/articulos/articulo';

@Component({
  selector: 'app-modal-seleccinar-articulo',
  templateUrl: './modal-seleccinar-articulo.component.html',
  styleUrls: ['./modal-seleccinar-articulo.component.scss'],
})
export class ModalSeleccinarArticuloComponent extends mixinClass implements OnInit, OnDestroy, OnChanges {
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

      disable: [{ kind: 'campo', target: 'disable', value: [true] }],

      title: '',
    },
  ];

  articulos_selected = [];

  subDeci: Subscription;
  articuloClass = new ArticuloC();
  articulosParsed = false;
  constructor() {
    super();
  }

  ngOnInit() {
    const fechaActual = this.formarFechaFactura(new Date())['FechaFactura'];
    console.log('this.articulos --> ', this.articulos);

    this.articulos = GLOBAL.duplicarJson(this.articulos);
    // TODO: MOVER ESTE PARSO PARA ANTES DE ABRIR EL MODAL
    let conteo = 0;
    this.articulos.map(async (arti) => {
      this.articuloClass.getArticulosFiltrado({ buscar: arti.codigo, fecha: fechaActual, parameters: { contenido: true } }).then((res_articulo) => {
        const articulo = _.first(res_articulo);
        const abreviaturas = { Caja: 'Caj.', Unidad: 'Uni.', Paquetes: 'Paq.', Libra: 'Lbs.', Quintal: 'Qtl.' };
        const contenidos_format = this.formatContenidos(articulo.contenido);

        const arrayMostrar = [
          { num: arti.retirado, medida: '' },
          { num: arti.cantidad_en_unidades - arti.retirado, medida: '' },
        ];

        for (let j = 0; j < arrayMostrar.length; j++) {
          const element = arrayMostrar[j];

          for (let i = 0; i < contenidos_format.length; i++) {
            const contenido = contenidos_format[i];
            console.log('  ');

            console.log('element.num >= contenido[1] ', `${element.num} >= ${contenido[1]}`);
            if (element.num >= contenido[1]) {
              const cantidad = element.num / contenido[1];
              element.medida = `${cantidad} ${abreviaturas[contenido[0]]}`;
              break;
            }
          }
        }

        arti.retirado_mostrar = arrayMostrar[0].medida;
        arti.restante_mostrar = arrayMostrar[1].medida;

        arti.customStyles = {
          'td-descripcion': { width: '42.2%', 'text-align': 'left', 'padding-left': '0.5rem' },
          // 'td-select': { width: '10%', display: 'flex', 'justify-content': 'flex-end', 'aling-items': 'center', 'padding-right': '0.5rem' },
          'td-cantidad': { width: '9%' },
          'td-unidad': { width: '15%' },
          'td-retirado_mostrar': { width: '9%' },
          'td-restante_mostrar': { width: '15%' },
          'td-select': { width: '6.5%' },
        };

        conteo++;
        if (conteo >= this.articulos.length) setTimeout(() => (this.articulosParsed = true), 250);

        return arti;
      });
    });
  }

  formatContenidos(contenidos) {
    const contenido = [];
    for (var cont in contenidos) {
      if (!_.includes(cont, 'Saco')) contenido.push([cont, contenidos[cont]]);
    }

    return contenido.sort((a, b) => a[1] + b[1]);
  }

  parseCantidades() {}

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
