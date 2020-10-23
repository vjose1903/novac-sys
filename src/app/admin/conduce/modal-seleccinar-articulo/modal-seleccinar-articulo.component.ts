import { Component, OnInit, Input, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TablasComponent } from '../../components/tablas/tablas.component';
import { DBservice } from '../../../core/services/bdservice.service';
import { GLOBAL } from '../../../core/services/GLOBAL';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { ModalService } from '../../components/modal/modal.service';

@Component({
  selector: 'app-modal-seleccinar-articulo',
  templateUrl: './modal-seleccinar-articulo.component.html',
  styleUrls: ['./modal-seleccinar-articulo.component.scss'],
})
export class ModalSeleccinarArticuloComponent implements OnInit, OnDestroy {
  @Input() articulos;
  @Output() getArticulos = new EventEmitter<any>();

  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
  info = [
    {
      titulo: 'Articulo',
      key: 'descripcion',
    },
    {
      titulo: 'Cantidad',
      key: 'cantidad',
    },
    {
      titulo: 'Unidad',
      key: 'unidad',
    },
    {
      titulo: 'Retirado',
      key: 'retirado_mostrar',
    },
    {
      titulo: 'Restante',
      key: 'restante_mostrar',
    },
    {
      titulo: 'Seleccione',
      tipo: 'check',
      key: 'select',

      disable: {
        getDisabled: false,
        campo: '',
      },
      title: '',
    },
  ];
  articulos_selected = [];

  subDeci: Subscription;
  constructor(private dbServ: DBservice, private mServ: ModalService) {}

  ngOnInit() {
    this.articulos = GLOBAL.duplicarJson(this.articulos);
    this.articulos.map(async (arti) => {
      const medida = arti.retirado === 0 ? '' : arti.retirado < 100 ? 'LBS' : 'QTL';
      const cantidad = arti.retirado < 100 ? arti.retirado : arti.retirado / 100;
      const multiplo = arti.cantidad_en_unidades / arti.cantidad;
      const cant_en_unidades_actual = arti.cantidad_en_unidades - arti.retirado;
      const cant_restante = cant_en_unidades_actual / multiplo;

      arti.retirado_mostrar = cantidad + ' ' + medida;

      arti.restante_mostrar = cant_restante + ' ' + medida;

      return arti;
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res) {
        this.mandarArticulos();
      } else {
        this.resetLista();
      }
    });
  }
  ngOnDestroy(): void {
    this.subDeci.unsubscribe();
    this.resetLista();
  }

  mandarArticulos() {
    this.getArticulos.emit({ body: this.articulos_selected });
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

      console.log('_x_ ', _x_);
      console.log('articulo ', articulo);
      console.log('this.articulos_selected ', this.articulos_selected);
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
