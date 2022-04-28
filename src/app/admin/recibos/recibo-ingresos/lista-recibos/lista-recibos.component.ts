import { Component, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { TablasService } from '../../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { LoaderService } from '../../../../loader/loader.service';
import { ReciboC } from '../../recibos';
import { PdfService } from '../../../../core/services/pdf/pdf.service';
import { PdfViewerComponent } from '../../../components/pdf-viewer/pdf-viewer.component';
import { fun } from '../../../../core/services/functions.service';
import { Permisos } from '../../../../core/typescript/permisos';
@Component({
  selector: 'app-lista-recibos',
  templateUrl: './lista-recibos.component.html',
  styleUrls: ['./lista-recibos.component.scss'],
})
export class ListaRecibosComponent extends MixinClass implements OnInit, OnDestroy {
  info = [
    {
      titulo: '1',
      key: 'tipo_recibo',
      text_tooltip: 'tooltip_tipo',
      text_color: 'colorEstado',
      tipo: 'icon',
      isIcon: true,
      color: true,
      estilos: [{ width: '3%' }, { color: 'var(--transparente00)' }],
    },
    { titulo: 'No. recibo', estilos: [{ width: '8%' }], key: 'numero_recibo', tipo: 'text' },
    { titulo: 'Cliente', key: 'cliente_', tipo: 'text', estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }] },
    { titulo: 'No. factura', key: 'numero_factura', tipo: 'text', estilos: [{ width: '12%' }] },
    { titulo: 'Total recibido', key: 'total', tipo: 'text', formatoNumero: true, estilos: [{ width: '12%' }, { 'text-align': 'end' }] },
    {
      titulo: '7',
      key: 'ver',
      text_color: 'colorNegro',
      text_tooltip: 'tooltip_ver',
      tipo: 'icon',
      isIcon: true,
      color: true,
      estilos: [{ width: '0%' }, { color: 'var(--transparente00)' }],
    },
    {
      titulo: 'Acciones',
      key: 'anular',
      text_color: 'colorNegro',
      text_tooltip: 'tooltip_anular',
      tipo: 'icon',
      isIcon: true,
      color: true,
      estilos: [{ width: '9%' }, { color: '#000' }],
    },
  ];
  pdfSrc;
  fileName;
  lista_recibos;
  rowSelected: any;
  reciboClass = new ReciboC();
  permissions = Permisos;

  constructor(private router: Router, private tServ: TablasService, public loadServ: LoaderService, private pdfServ: PdfService) {
    super();
  }

  async ngOnInit() {
    this._init_mixin({ component: 'lista_recibos', is_routing: true });
    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
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
        tipo_recibo: { width: '3%', 'font-size': '1rem' },
        cliente_: { 'text-align': 'start', 'padding-left': '1.5rem' },
        numero_recibo: { width: '8%' },
        numero_factura: { width: '12%' },
        total: { width: '12%', 'text-align': 'end', 'padding-right': '1.5rem' },
        ver: { width: '4%', 'padding-left': '1rem', 'font-size': '1rem' },
        anular: { width: '4%', 'font-size': '1rem' },
      };

      return recibo;
    });
    return res;
  }

  async necesarioStart() {
    await this.getRecibos(this.tServ.obj_paginate.default);
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
        this.lista_recibos = fun.duplicarJson(res['data']);

        const obj = { total: res['total_registros'], tabla: 'listaRecibos' };
        // this.tServ.Func_total_paginas(obj);
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
        const obj = {
          texto_modal: `Seguro de que desea anular el recibo <b class="negrita"> #${arg.row.numero_recibo} </b>`,
          siFunction: (instance) => {
            this.anularRecibo(this.rowSelected.id);
            instance.closeModal(instance.id, 'anular_recibo');
          },
        };

        this.confirmationModal({
          id: 'anular_recibo',
          header: 'Confirmar',
          texto: obj.texto_modal,
          siFunction: obj.siFunction,
        });
        break;

      default:
        break;
    }
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.handleModalForm({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, obj.id), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => obj.siFunction(instance),
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }

  getReciboBase64(arg) {
    const recibo_selected = _.find(this.lista_recibos, (recibo) => recibo.id === arg.id);
    const obj = { data: recibo_selected, type: 'recibo_ingreso', retunBase64: true };
    this.generarPdf(obj);
  }

  generarPdf(obj) {
    this.loadServ.isLoading.next(true);

    this.pdfServ
      .generatePdf({ oPdf: obj, imprimir: false })
      .then(async (res) => {
        if (res.status === 'si') {
          this.fileName = res.file;
          this.pdfSrc = res.body;
          const obj_pdf = { pdfSrc: res.body, titulo: 'Revisión de recibo de ingreso', height: '25rem', reimprimir: true, fileName: res.file.split('.')[0] };

          this.loadServ.isLoading.next(false);

          this.handleModalForm({
            component: PdfViewerComponent,
            inputs: obj_pdf,
            id: 'revision_recibo',
            header: obj_pdf.titulo,
            width: '900px',
            height: obj_pdf.height,
            botones: {
              aceptar: { show: false, disable: false },
              cancelar: { show: false, disable: false },
              dinamico: [
                { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancel'), label: 'Cerrar', disable: false },
                {
                  clase: 'btn btn-verde',
                  function: (instance) => {
                    this.imprimir_base64();
                    instance.closeModal(instance.id, 'cancel');
                  },
                  label: 'Imprimir',
                  disable: false,
                },
              ],
            },
          });
        }
      })
      .catch(() => this.loadServ.isLoading.next(false));
  }

  imprimir_base64() {
    const obj = { base64: this.pdfSrc, filename: this.fileName, type: 'recibo_ingreso' };
    this.pdfServ
      .imprimirBase64(obj)
      .then(async (res) => {
        if (res['status'] === 'si') fun.toastSuccess('Recibo de ingreso reimpreso !!', 'CORRECTO');
        else fun.toastError(res['msg'], 'ERROR');
      })
      .catch((err) => fun.toastError(err['msg'], 'ERROR'));
  }

  async anularRecibo(id) {
    try {
      const extra = { afterPath: `revertir/by_id/${id}` };
      const actualPagination = this.tServ.getPaginationById('listaRecibos');
      this.reciboClass.getAll(extra).then((res) => this.getRecibos(actualPagination));
    } catch (error) {}
  }
}
