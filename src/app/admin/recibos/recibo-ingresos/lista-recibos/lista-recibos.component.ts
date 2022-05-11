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
import { table_config } from '../../../components/new_tablas/tabla-class';
@Component({
  selector: 'app-lista-recibos',
  templateUrl: './lista-recibos.component.html',
  styleUrls: ['./lista-recibos.component.scss'],
})
export class ListaRecibosComponent extends MixinClass implements OnInit, OnDestroy {
  table_config: table_config = {
    info: [
      { titulo: '|', tipo: 'icon', key: 'tipo_', estilos: [{ width: '3%' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'tipo_recibo', rowTooltip: 'tooltip_tipo', text_color: 'colorEstado' }] },

      { titulo: 'No. recibo', estilos: [{ width: '8%' }], key: 'numero_recibo', tipo: 'text' },
      { titulo: 'Cliente', key: 'cliente_', tipo: 'text', estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }] },
      { titulo: 'No. factura', key: 'numero_factura', tipo: 'text', estilos: [{ width: '12%' }] },
      { titulo: 'Total recibido', key: 'total', tipo: 'formatoNumero', estilos: [{ width: '12%' }, { 'text-align': 'end' }] },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        key: 'actions',
        estilos: [{ width: '9%' }, { color: '#000' }],
        iconsArray: [
          { key: 'ver', rowTooltip: 'tooltip_ver', text_color: 'colorNegro' },
          { key: 'anular', rowTooltip: 'tooltip_anular', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_recibos',
    padre_functions: { data_request: (params) => this.getRecibos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };
  tablaComponent;

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
      recibo['tipo_recibo'] = recibo.choferes_viajes.length ? 'fas fa-truck-moving' : 'fas fa-comment-dollar';
      recibo['numero_recibo'] = _.padStart(recibo.numero_recibo, 8, '0');
      recibo['cliente_'] = `${recibo.cliente.nombre} ${recibo.cliente.apellido}`;
      recibo['numero_factura'] = recibo.detalle_recibos.length === 1 ? recibo.detalle_recibos[0].descripcion.split(' ')[1] : 'Varios...';
      recibo['ver'] = 'far fa-eye';
      recibo['anular'] = 'far fa-trash-alt';
      recibo['tooltip_tipo'] = recibo.choferes_viajes.length ? 'Factura de Viaje' : 'Factura a crédito';
      recibo['tooltip_ver'] = 'Ver';
      recibo['tooltip_anular'] = 'Anular';

      recibo['iconsMoveEvents'] = [
        { key: 'ver', hover: ['text-green'], leave: ['text-black'] },
        { key: 'anular', hover: ['text-green'], leave: ['text-black'] },
      ];

      recibo['customStyles'] = {
        tipo_: [
          { key: 'tipo_', isTd: true, estilos: 'width: 3% !important; font-size: 1rem !important' },
          { key: 'tipo_recibo', estilos: 'font-size: 1rem !important' },
        ],
        cliente_: { 'text-align': 'start', 'padding-left': '1.5rem' },
        numero_recibo: { width: '8%' },
        numero_factura: { width: '12%' },
        total: { width: '12%', 'text-align': 'end', 'padding-right': '1.5rem' },
        actions: [
          { key: 'actions', isTd: true, estilos: 'width: 9% !important; padding-left: 1rem !important' },
          { key: 'ver', estilos: 'font-size:1rem !important' },
          { key: 'anular', estilos: 'margin-left: 1rem !important; font-size:1rem !important' },
        ],
      };

      return recibo;
    });
    return res;
  }

  async necesarioStart() {
    await this.getRecibos(this.tServ.obj_paginate.default);
  }

  async getRecibos(params?: { per_page: number; page: number; search: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };

      this.reciboClass.getAll(extra).then((res) => {
        res['data'] = this.mapeoRecibos(res['data']);
        this.lista_recibos = fun.duplicarJson(res['data']);

        this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {}
  }

  navegar() {
    this.router.navigateByUrl('/admin/recibos/ingresos/new');
  }

  tableClickIcon(event) {
    console.log('arg ', event);
    const recibo_selected = event.data;

    if (event.columnKey) {
      switch (event.iconKey) {
        case 'ver':
          this.getReciboBase64(recibo_selected);
          break;

        case 'anular':
          const texto_modal = `Seguro de que desea anular el recibo <b class="negrita"> #${recibo_selected.numero_recibo} </b>`;
          const siFunction = (instance) => {
            this.anularRecibo(recibo_selected.id);
            instance.closeModal(instance.id, 'anular_recibo');
          };

          this.confirmationModal({
            id: 'anular_recibo',
            header: 'Confirmar',
            texto: texto_modal,
            siFunction: siFunction,
          });
          break;

        default:
          break;
      }
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
