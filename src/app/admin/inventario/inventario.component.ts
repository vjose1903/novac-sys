import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';

import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { ModalService } from '../components/modal/modal.service';
import { TablasService, obj_paginate_default } from '../components/tablas/tablas.service';
import { IpcService } from '../../core/services/ipc.service';
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
  cant_inventario = 0;
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
  pdfSrc: any;
  fileName: any;
  constructor(
    private dbServ: DBservice,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private actRou: ActivatedRoute,
    private tServ: TablasService,
    private mServ: ModalService,
    private _ipc: IpcService,
  ) {}

  async ngOnInit() {
    this.necesarioParaEmpezar();
    this.dbServ.getTipoArticulos().subscribe((res) => {
      this.tipo_articulos = res;
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        console.log('this.tipoModal --> ', this.tipoModal);
        if (this.tipoModal === 'visor_pdf') {
          res = { bool: res };
        }
        console.log('res--> ', res);
        this.decisionModal(res);
        this.mServ.ModalDecision(undefined);
      }
    });

    this._ipc.on('printRes', async (event: Electron.IpcMessageEvent, res) => {
      if (res.status === 'si') {
        let obj;

        this.pdfSrc = res.body;
        this.fileName = res.file;

        obj = {
          pdfSrc: res.body,
          titulo: 'Reporte de inventario',
          height: '55rem',
          reimprimir: res.reimprimir,
          fileName: res.file.split('.')[0],
        };

        this.abrirModalReporte(obj);
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
      setTimeout(() => {
        GLOBAL.quitarFocodeElectron();
      }, 5);
    });

    this._ipc.on('printReporteRes', async (event: Electron.IpcMessageEvent, res) => {
      if (res.status === 'si') {
        this.dbServ.toastSuccess('Reporte generado correctamente!!', 'CORRECTO', true);
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
      setTimeout(() => {
        GLOBAL.quitarFocodeElectron();
      }, 5);
    });
  }

  abrirModalReporte(obj) {
    this.tipoModal = 'visor_pdf';
    this.mServ.modalTipo('visor_pdf');
    this.mServ.ModalSeleccion(obj);

    this.mServ.mostrarModal(true);
  }

  ngOnDestroy() {
    this.subDeci.unsubscribe();
    this.FechaFactura = undefined;
    this.tServ.obj_paginate = obj_paginate_default;
    this.tServ.Func_total_paginas(1);
  }
  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  async necesarioParaEmpezar() {
    await this.getCantidadInventario();
    await this.formarFechaFactura(new Date());
    await this.getArticulos(this.tServ.obj_paginate);
    await this.calcularGananciasCostos();
  }

  async makeReporte() {
    let res = {} as any;

    try {
      const tipo = 'inventario';
      let params = '';

      res = await this.dbServ.makeReportes(tipo, params).toPromise();
      const obj = {
        data: res,
        type: 'reporte',
      };

      this._ipc.send('print', obj);
    } catch (error) {
      this.dbServ.toastError('Error realizando reporte.', 'ERROR', true);
    }
  }

  async getCantidadInventario() {
    try {
      const res = await this.dbServ.getCantidadInventario().toPromise();
      this.cant_inventario = res.count;
    } catch (error) {
      this.dbServ.toastError('Error buscando la cantidad de articulos en inventario.', 'ERROR');
    }
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
    this.tServ.obj_paginate['searchText'] = this.palabra_buscar;

    this.getArticulos(this.tServ.obj_paginate);
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

  resetVariables() {
    this.pdfSrc = undefined;
    this.fileName = undefined;
    this.tipoModal = undefined;
  }

  async decisionModal(arg) {
    if (arg.bool) {
      console.log('this.tipoModal --> ', this.tipoModal);

      if (this.tipoModal === 'visor_pdf') {
        const obj = {
          base64: this.pdfSrc,
          filename: this.fileName,
        };

        console.log('this.pdfSrc ==> ', this.pdfSrc);
        console.log('this.fileName ==> ', this.fileName);

        this._ipc.send('printReporte', obj);
        this.resetVariables();
      } else {
        const temp = JSON.parse(JSON.stringify(this.listaArticulos));

        this.getArticulos(this.tServ.obj_paginate);
        // this.listaArticulos = undefined;

        // temp[this.indexSelected] = [];

        // temp[this.indexSelected] = JSON.parse(JSON.stringify(arg.body));
        // this.listaArticulos = JSON.parse(JSON.stringify(temp));
      }
    }
  }
}
