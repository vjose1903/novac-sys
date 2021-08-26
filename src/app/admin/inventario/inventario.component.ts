import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { DBservice } from '../../core/services/bdservice.service';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from '../../../utils/javascript/moment';
import { ModalService } from '../components/modal/modal.service';
import { TablasService, obj_paginate_default } from '../components/tablas/tablas.service';
import { IpcService } from '../../core/services/ipc.service';
import { LayoutService } from '../layout/layout.service';
import { mixinClass } from '../mixinClass';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { LoaderService } from '../../../app/loader/loader.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent extends mixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
      estilos: [{ width: '4rem' }],
    },
    {
      titulo: 'Articulo',
      key: 'nombre',
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
  seleccionModal: any;
  filtrado = false;
  filtro = 'todos';

  palabra_buscar;
  FechaFactura: string;
  pdfSrc: any;
  fileName: any;

  constructor(
    private dbServ: DBservice,
    private tServ: TablasService,
    public mServ: ModalService,
    public _ipc: IpcService,
    public layServ: LayoutService,
    public pdfServ: PdfService,
    public loadServ: LoaderService,
  ) {
    super(mServ, _ipc, layServ);
  }

  async ngOnInit() {
    this._init_mixin({ component: 'inventario', _lista_subs: ['decisionModal', 'printBase64Res'] });
    this.necesarioParaEmpezar();
    this.dbServ.getTipoArticulos().subscribe((res) => {
      this.tipo_articulos = res;
    });
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  async ipcBase64Resonse(res) {
    if (res.status === 'si') {
      this.dbServ.toastSuccess('Reporte generado correctamente!!', 'CORRECTO', true);
    } else {
      this.dbServ.toastError(res.msg, 'ERROR', true);
    }
  }

  async decisionModal(arg) {
    if (this.tipoModal === 'visor_pdf') {
      arg = { bool: arg };
    }

    if (arg.bool) {
      if (this.tipoModal === 'visor_pdf') {
        const obj = {
          base64: this.pdfSrc,
          filename: this.fileName,
        };

        this._ipc.send('printBase64', obj);
        this.resetVariables();
      } else {
        this.getArticulos(this.tServ.obj_paginate);
      }
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();

    this.FechaFactura = undefined;
    this.tServ.obj_paginate = obj_paginate_default;
    this.tServ.Func_total_paginas(1);
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  async necesarioParaEmpezar() {
    this.FechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];
    await this.getCantidadInventario();
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
      this.loadServ.isLoading.next(true);
      this.generarPdf(obj);
      // this._ipc.send('print', obj);
    } catch (error) {
      this.dbServ.toastError('Error realizando reporte.', 'ERROR', true);
    }
  }

  generarPdf(obj) {
    this.pdfServ.generatePdf(obj, (res) => {
      if (res.status === 'si') {
        obj = {
          pdfSrc: res.body,
          titulo: 'Reporte de inventario',
          height: '83vh',
          reimprimir: res.reimprimir,
          fileName: res.file.split('.')[0],
        };

        this.loadServ.isLoading.next(false);

        this.abrirModal('visor_pdf', obj);
      }
    });
  }

  async getCantidadInventario() {
    try {
      const res = await this.dbServ.getCantidadInventario().toPromise();
      this.cant_inventario = res.count;
    } catch (error) {
      this.dbServ.toastError('Error buscando la cantidad de articulos en inventario.', 'ERROR');
    }
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
    this.abrirModal('inventario', arg.ARG);
  }

  resetVariables() {
    this.pdfSrc = undefined;
    this.fileName = undefined;
    this.tipoModal = undefined;
  }
}
