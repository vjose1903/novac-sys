import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';

import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { ModalService } from '../components/modal/modal.service';
import { obj_paginate, TablasService } from '../components/tablas/tablas.service';
@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent implements OnInit, OnDestroy {
  @ViewChild('cardTabla', { static: false }) cardTabla: ElementRef;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
      customClass: true,
      estilos: [{ width: '4rem' }],
    },
    {
      titulo: 'Articulo',
      key: 'nombre',
      customClass: true,
      estilos: [{ width: '35rem' }, { 'text-align': 'left' }, { 'padding-left': '2rem' }],
    },
    {
      titulo: 'Cantidad',
      key: 'cantidades',
      cantidades: true,
    },
    {
      titulo: 'Precio',
      key: 'precio_principal',
      formatoNumero: true,
    },
  ];
  botones = {
    titulo: true,
    inventario: true,
  };
  listaArticulos;
  costoTotal: number;
  gananciaTotal: number;
  tipo_articulos;
  indexSelected: any;
  tipoModal: string;
  seleccionModal: any;
  filtrado = false;
  filtro = 'todos';
  subDeci: Subscription;
  palabra_buscar;
  FechaFactura: string;
  constructor(
    private dbServ: DBservice,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private actRou: ActivatedRoute,
    private tServ: TablasService,
    private mServ: ModalService,
  ) {}

  async ngOnInit() {
    this.necesarioParaEmpezar();
    this.dbServ.getTipoArticulos().subscribe((res) => {
      this.tipo_articulos = res;
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
        this.mServ.ModalDecision(undefined);
      }
    });
  }

  ngOnDestroy() {
    this.subDeci.unsubscribe();
    this.FechaFactura = undefined;
  }
  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  async necesarioParaEmpezar() {
    await this.formarFechaFactura(new Date());
    await this.getArticulos(obj_paginate);
    await this.calcularGananciasCostos();
  }

  formarFechaFactura(date) {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');

    this.FechaFactura = fechaTemp + ' ' + (hora <= 9 ? '0' + hora : hora) + ':' + (minutos <= 9 ? '0' + minutos : minutos);
  }

  async getArticulos(e) {
    try {
      // this.listaArticulos = [];
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getArticulosFiltrados(palabra_a_buscar, page, per_page, true, false, this.FechaFactura, this.filtro).toPromise();
      this.palabra_buscar = palabra_a_buscar;

      res.data.map(async (arti) => {
        arti.customStyles = {
          'td-codigo': {
            width: '4rem',
          },
          'td-nombre': {
            width: '35rem',
            'text-align': 'left',
            'padding-left': '2rem',
          },
        };
      });

      this.listaArticulos = GLOBAL.duplicarJson(res.data);

      // this.listaArticulos = [
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      //   ...this.listaArticulos,
      // ];

      const obj = {
        total: res.total_registros,
        tabla: 'listaArticulos',
      };

      // const obj = {
      //   total: this.listaArticulos.length,
      //   tabla: 'listaArticulos',
      // };

      this.tServ.Func_total_paginas(obj);
    } catch (error) {
      this.dbServ.toastError('Error buscando articulos registrados.', 'ERROR', true);
    }
  }

  filtrarArticulos() {
    obj_paginate['searchText'] = this.palabra_buscar;

    this.getArticulos(obj_paginate);
    this.calcularGananciasCostos();
  }

  calcularGananciasCostos() {
    this.costoTotal = 0;
    this.gananciaTotal = 0;
    for (let i = 0; i < this.listaArticulos.length; i++) {
      const articulo = this.listaArticulos[i];
      const costo = articulo.costo_principal;
      const precio = articulo.precio_principal;
      const cantidad = articulo.cantidades[articulo.medida];

      this.costoTotal += costo * cantidad;
      this.gananciaTotal += precio * cantidad;
    }
  }
  movimientoInventario(arg) {
    this.indexSelected = arg.INDEX;
    this.mServ.modalTipo('inventario');
    this.tipoModal = 'inventario';
    this.seleccionModal = arg.ARG;
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }
  p() {}
  async decisionModal(arg) {
    if (arg.bool) {
      const temp = JSON.parse(JSON.stringify(this.listaArticulos));

      this.getArticulos(obj_paginate);
      // this.listaArticulos = undefined;

      // temp[this.indexSelected] = [];

      // temp[this.indexSelected] = JSON.parse(JSON.stringify(arg.body));
      // this.listaArticulos = JSON.parse(JSON.stringify(temp));
    }
  }
}
