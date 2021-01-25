import { Component, OnDestroy, OnInit } from '@angular/core';
import { DBservice } from '../../../../core/services/bdservice.service';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { IpcService } from '../../../../core/services/ipc.service';
import { ModalService } from '../../../components/modal/modal.service';
import { myElectron } from '../../../../core/services/electron';
import { TablasService } from '../../../components/tablas/tablas.service';
import { GLOBAL } from '../../../../core/services/GLOBAL';
import { modalClass } from '../../../components/modal/modal';

@Component({
  selector: 'app-lista-recibos',
  templateUrl: './lista-recibos.component.html',
  styleUrls: ['./lista-recibos.component.scss'],
})
export class ListaRecibosComponent extends modalClass implements OnInit, OnDestroy {
  info = [
    {
      titulo: '1',
      key: 'tipo_recibo',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '3%' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'No. recibo',
      customClass: true,
      estilos: [{ width: '8%' }],
      key: 'numero_recibo',
    },
    {
      titulo: 'Cliente',
      key: 'cliente_',
      customClass: true,
      estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }],
    },
    {
      titulo: 'No. factura',
      key: 'numero_factura',
      customClass: true,
      estilos: [{ width: '12%' }],
    },
    {
      titulo: 'Total recibido',
      key: 'total',
      formatoNumero: true,
      customClass: true,
      estilos: [{ width: '12%' }, { 'text-align': 'end' }],
    },
    {
      titulo: '2',
      key: 'ver',
      text_color: 'colorNegro',
      text_tooltip: 'tooltip_print',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '0%' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'Acciones',
      key: 'anular',
      text_color: 'colorNegro',
      text_tooltip: 'tooltip_anular',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '9%' }, { color: '#000' }],
    },
  ];
  lista_recibos;
  rowSelected: any;

  constructor(public dbServ: DBservice, private router: Router, public _ipc: IpcService, public mServ: ModalService, private tServ: TablasService) {
    super(mServ, _ipc);
  }
  async ngOnInit() {
    console.log('lita recibos');

    this.necesarioStart();
    this.getInit(['printRes', 'decisionModal', 'printBase64Res']);
  }

  ngOnDestroy() {
    // this._ipc.removeListener('printRes');
    this.getDestroy();
  }

  ipcPrintResponse(res) {
    if (res.status === 'si') {
      this.fileName = res.file;
      this.pdfSrc = res.body;

      const obj = {
        pdfSrc: this.pdfSrc,
        titulo: 'Revisión de recibo de ingreso',
        height: '25rem',
        reimprimir: true,
        fileName: this.fileName.split('.')[0],
      };

      this.abrirModal('visor_pdf', 'visor_pdf', obj);
    } else {
      this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR', true);
    }
  }

  ipcBase64Resonse(res) {
    console.log('ipcBase64Resonse --> ', res);
  }

  mapeoRecibos(res) {
    res.map((recibo) => {
      recibo['tipo_recibo'] = recibo.chofer ? 'fas fa-truck-moving' : 'fas fa-comment-dollar';
      recibo['numero_recibo'] = _.padStart(recibo.numero_recibo, 8, '0');
      recibo['cliente_'] = `${recibo.cliente.nombre} ${recibo.cliente.apellido}`;
      recibo['numero_factura'] = recibo.detalle_recibos.length === 1 ? recibo.detalle_recibos[0].descripcion.split(' ')[1] : 'Varios...';
      recibo['ver'] = 'far fa-eye';
      recibo['anular'] = 'far fa-trash-alt';
      recibo['tooltip_print'] = 'Ver';
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
    await this.getLast50Recibos(true);
  }

  async getLast50Recibos(load) {
    try {
      let res = await this.dbServ.getRecibosLimit(50, load).toPromise();
      res = this.mapeoRecibos(res);
      this.lista_recibos = GLOBAL.duplicarJson(res);

      const obj = {};
      obj['total'] = res.length;
      obj['tabla'] = 'listaRecibos';
      this.tServ.Func_total_paginas(obj);
    } catch (error) {
      console.error('Error buscando recibos --> ', error);
    }
  }

  navegar() {
    this.router.navigateByUrl('/admin/ingresos/new');
  }

  clickIcon(arg) {
    this.rowSelected = arg.row;
    switch (arg.column) {
      case 'ver':
        this.getReciboBase64(arg.row);
        break;

      case 'anular':
        const obj = { texto_modal: `Seguro de que desea anular el recibo #${arg.row.numero_recibo}` };
        this.abrirModal('anular', 'dinamico_texto', obj);
        break;

      default:
        break;
    }
  }

  async filtrarRecibos(e) {
    const obj = {};
    try {
      console.log('filtrando');

      if (e.searchText !== '' && e.searchText !== ' ') {
        const page = e.page;
        const per_page = e.per_page;
        const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
        const res = await this.dbServ.getRecibosFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

        this.lista_recibos = this.mapeoRecibos(res.data);

        obj['total'] = res.total_registros;
        obj['tabla'] = 'listaRecibos';
        this.tServ.Func_total_paginas(obj);
      } else {
        console.log('ultimos 50');
        this.getLast50Recibos(false);
      }
    } catch (error) {
      this.dbServ.toastError('Error buscando recibos registrados.', 'ERROR', true);
    }
  }

  getReciboBase64(arg) {
    const recibo_selected = _.find(this.lista_recibos, (recibo) => recibo.id === arg.id);
    // let ids = '';

    // recibo_selected.detalle_recibos.map((detalle) => {
    //   ids += detalle['cabecera_factura_id'];

    //   detalle['total_factura'] = 0;

    //   return detalle;
    // });

    const obj = {
      data: recibo_selected,
      type: 'recibo_ingreso',
      retunBase64: true,
    };

    this._ipc.send('print', obj);
  }

  imprimir_base64() {
    const obj = {
      base64: this.pdfSrc,
      filename: this.fileName,
      type: 'recibo_ingreso',
    };

    this._ipc.send('printBase64', obj);
  }

  async anularRecibo(id) {
    try {
      const res = await this.dbServ.revertirReciboById(id).toPromise();
      this.getLast50Recibos(false);
      this.dbServ.toastSuccess(res.msg, 'CORRECTO');
    } catch (error) {
      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR');
      }
    }
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
