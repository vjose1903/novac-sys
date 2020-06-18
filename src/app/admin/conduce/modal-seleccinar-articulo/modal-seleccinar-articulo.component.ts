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
  @Output() getArtculos = new EventEmitter<any>();

  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
  info = [
    {
      titulo: 'Articulo',
      key: 'articulo',
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
      key: 'retirado',
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
    this.getArtculos.emit({ body: this.articulos_selected });
  }
  resetLista() {
    this.articulos_selected = [];
  }

  getInfoChange(item) {
    if (item.cambio === 'select') {
      if (!item.value) {
        const i = this.articulos_selected.indexOf(item.body[item.index]);
        _.pullAt(this.articulos_selected, i);
      } else {
        this.articulos_selected.push(item.body[item.index]);
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
