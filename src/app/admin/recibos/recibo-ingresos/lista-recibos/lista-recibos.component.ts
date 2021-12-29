import { Component, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { TablasService } from '../../../components/tablas/tablas.service';
import { GLOBAL } from '../../../../core/services/GLOBAL';
import { mixinClass } from '../../../mixinClass';
import { LoaderService } from '../../../../loader/loader.service';
import { ReciboC } from '../../recibos';

@Component({
  selector: 'app-lista-recibos',
  templateUrl: './lista-recibos.component.html',
  styleUrls: ['./lista-recibos.component.scss'],
})
export class ListaRecibosComponent extends mixinClass implements OnInit, OnDestroy {
  info = [
    {
      titulo: '1',
      key: 'tipo_recibo',
      text_tooltip: 'tooltip_tipo',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
      estilos: [{ width: '3%' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'No. recibo',
      estilos: [{ width: '8%' }],
      key: 'numero_recibo',
    },
    {
      titulo: 'Cliente',
      key: 'cliente_',
      estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }],
    },
    {
      titulo: 'No. factura',
      key: 'numero_factura',
      estilos: [{ width: '12%' }],
    },
    {
      titulo: 'Total recibido',
      key: 'total',
      formatoNumero: true,
      estilos: [{ width: '12%' }, { 'text-align': 'end' }],
    },
    {
      titulo: '2',
      key: 'ver',
      text_color: 'colorNegro',
      text_tooltip: 'tooltip_ver',
      isIcon: true,
      color: true,
      estilos: [{ width: '0%' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'Acciones',
      key: 'anular',
      text_color: 'colorNegro',
      text_tooltip: 'tooltip_anular',
      isIcon: true,
      color: true,
      estilos: [{ width: '9%' }, { color: '#000' }],
    },
  ];
  lista_recibos;
  rowSelected: any;
  reciboClass = new ReciboC();

  constructor(private router: Router, private tServ: TablasService, public loadServ: LoaderService) {
    super();
  }

  async ngOnInit() {
    this._init_mixin({ component: 'lista_recibos', _lista_subs: ['decisionModal', 'printBase64Res'] });
    this.necesarioStart();
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  async printBase64Res(res) {
    if (res.status === 'si') this.fun.toastSuccess('Recibo de ingreso reimpreso !!', 'CORRECTO');
    else this.fun.toastError(res.msg, 'ERROR');
  }

  ipcPrintResponse(res) {
    console.log('res --> ', res);

    if (res.status === 'si') {
      // this.fileName = res.file;
      // this.pdfSrc = res.body;
      // const obj = {
      //   pdfSrc: this.pdfSrc,
      //   titulo: 'Revisión de recibo de ingreso',
      //   height: '25rem',
      //   reimprimir: true,
      //   fileName: this.fileName.split('.')[0],
      // };
      // this.loadServ.isLoading.next(true);
      // this.abrirModal('visor_pdf', obj);
    } else {
      this.fun.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
    }
  }

  mapeoRecibos(res) {
    res.map((recibo) => {
      recibo['tipo_recibo'] = recibo.chofer ? 'fas fa-truck-moving' : 'fas fa-comment-dollar';
      recibo['numero_recibo'] = _.padStart(recibo.numero_recibo, 8, '0');
      recibo['cliente_'] = `${recibo.cliente.nombre} ${recibo.cliente.apellido}`;
      recibo['numero_factura'] = recibo.detalle_recibos.length === 1 ? recibo.detalle_recibos[0].descripcion.split(' ')[1] : 'Varios...';
      recibo['ver'] = 'far fa-eye';
      recibo['anular'] = 'far fa-trash-alt';
      recibo['tooltip_tipo'] = recibo.chofer ? 'Factura de Viaje' : 'Factura a crédito';
      recibo['tooltip_ver'] = 'Ver';
      recibo['tooltip_anular'] = 'Anular';

      recibo['iconsMoveEvents'] = [
        { key: 'ver', hover: ['text-green'], leave: ['text-black'] },
        { key: 'anular', hover: ['text-green'], leave: ['text-black'] },
      ];

      recibo['customStyles'] = {
        'td-tipo_recibo': { width: '3%', 'font-size': '1.2rem' },
        'td-cliente_': { 'text-align': 'start', 'padding-left': '1.5rem' },
        'td-numero_recibo': { width: '8%' },
        'td-numero_factura': { width: '12%' },
        'td-total': { width: '12%', 'text-align': 'end', 'padding-right': '1.5rem' },
        'td-ver': { width: '4%', 'padding-left': '1rem' },
        'td-anular': { width: '4%' },
      };

      return recibo;
    });
    return res;
  }

  async necesarioStart() {
    await this.getRecibos(this.tServ.obj_paginate);
  }

  async getRecibos(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const extra = {
        afterPath: `filtro/${palabra_a_buscar}`,
        parameters: { page: page, per_page: per_page, paginado: true },
      };

      this.reciboClass.getAll(extra).then((res) => {
        res['data'] = this.mapeoRecibos(res['data']);
        this.lista_recibos = GLOBAL.duplicarJson(res['data']);

        const obj = { total: res['total_registros'], tabla: 'listaRecibos' };
        this.tServ.Func_total_paginas(obj);
      });
    } catch (error) {}
  }

  navegar() {
    this.router.navigateByUrl('/admin/recibos/ingresos/new');
  }

  clickIcon(arg) {
    this.rowSelected = arg.row;
    switch (arg.column) {
      case 'ver':
        this.getReciboBase64(arg.row);
        break;

      case 'anular':
        const obj = { texto_modal: `Seguro de que desea anular el recibo #${arg.row.numero_recibo}` };
        this.abrirModal('dinamico_texto', obj, 'anular');
        break;

      default:
        break;
    }
  }

  getReciboBase64(arg) {
    const recibo_selected = _.find(this.lista_recibos, (recibo) => recibo.id === arg.id);
    const obj = { data: recibo_selected, type: 'recibo_ingreso', retunBase64: true };
    this.generarPdf(obj);
  }

  generarPdf(obj) {
    this.loadServ.isLoading.next(true);
    this.pdfServ
      .generatePdf(obj)
      .then((res) => {
        if (res.status === 'si') {
          this.fileName = res.file;
          this.pdfSrc = res.body;
          obj = { pdfSrc: res.body, titulo: 'Revisión de recibo de ingreso', height: '25rem', reimprimir: true, fileName: res.file.split('.')[0] };

          this.abrirModal('visor_pdf', obj, undefined, (res_visor) => this.loadServ.isLoading.next(false));
        }
      })
      .catch((error) => {
        this.loadServ.isLoading.next(false);
      });
  }

  imprimir_base64() {
    const obj = { base64: this.pdfSrc, filename: this.fileName, type: 'recibo_ingreso' };
    this._ipc.send('printBase64', obj);
  }

  async anularRecibo(id) {
    try {
      const extra = { afterPath: `revertir/by_id/${id}` };
      this.reciboClass.getAll(extra).then((res) => this.getRecibos(this.tServ.obj_paginate));
    } catch (error) {}
  }

  decisionModal(res) {
    if (res) {
      switch (this.tipoModal) {
        case 'visor_pdf':
          this.imprimir_base64();
          break;

        case 'anular':
          this.anularRecibo(this.rowSelected.id);
          break;

        default:
          break;
      }
    }
    this.rowSelected = undefined;
  }
}
