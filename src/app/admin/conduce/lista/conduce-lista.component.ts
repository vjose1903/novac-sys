import { ModalClass } from './../../components/modal/modal-class';
import { PdfViewerComponent } from './../../components/pdf-viewer/pdf-viewer.component';
import { PdfService } from './../../../core/services/pdf/pdf.service';
import { LoaderService } from './../../../loader/loader.service';
import { TablasService } from './../../components/new_tablas/tablas.service';
import { fun } from './../../../core/services/functions.service';
import { Ss } from './../../../core/services/singleton.service';
import { ModalService } from './../../components/modal/modal.service';
import { table_config } from './../../components/new_tablas/tabla-class';
import { ConfigI } from './../../../core/typescript/config-interface';
import { Permisos } from './../../../core/typescript/permisos';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { Router } from '@angular/router';
import { ConduceC } from '../coduce';
import * as _ from 'lodash';

@Component({
  selector: 'app-conduce-lista',
  templateUrl: './conduce-lista.component.html',
  styleUrls: ['./conduce-lista.component.scss'],
})
export class ConduceListaComponent extends MixinClass implements OnInit, OnDestroy {
  lista_conduces;

  table_config: table_config = {
    info: [
      { titulo: 'No. conduce', estilos: [{ width: '11%' }], key: 'numero_conduce', tipo: 'text' },
      { titulo: 'Fecha conduce', estilos: [{ width: '10%' }], key: 'fecha_equivalente', tipo: 'date' },
      { titulo: 'Cliente', key: 'cliente.nombre_completo', tipo: 'text', estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }] },
      { titulo: 'Cantidad de productos', key: 'cantidad_productos', tipo: 'text', estilos: [{ width: '10%' }, { 'text-align': 'center' }] },
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
    id_tabla: 'listado_conduces',
    padre_functions: { data_request: (params) => this.getConduces(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };

  tablaComponent;

  permissions = Permisos;
  configApp: ConfigI;

  conduceClass = new ConduceC();

  constructor(public mServ: ModalService, private router: Router, private tServ: TablasService, public loadServ: LoaderService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'lista_conduce', is_routing: true });
    this.configApp = Ss.configServ.getConfig({ isPromise: false }) as ConfigI;
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.getConduces(this.tServ.obj_paginate.default);
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

  navegar() {
    this.router.navigateByUrl('/admin/conduce/formulario');
  }

  async getConduces(params?: { per_page?: number; page?: number; search?: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };

      this.lista_conduces = [];
      if (fun.hasValue(this.tablaComponent)) this.tablaComponent.changeTableConfig([{ total_count: 0 }]);

      this.conduceClass.getAll(extra).then((res) => {
        res['data'] = this.mapeoRecibos(res['data']);

        this.lista_conduces = fun.duplicarJson(res['data']);

        this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {}
  }

  mapeoRecibos(data) {
    data.map((conduce) => {
      conduce['numero_conduce'] = _.padStart(conduce.numero_conduce, 8, '0');
      conduce['cantidad_productos'] = conduce.detalle_conduces.length;

      conduce['ver'] = 'far fa-eye';
      conduce['anular'] = 'far fa-trash-alt';
      conduce['tooltip_ver'] = 'Ver';
      conduce['tooltip_anular'] = 'Anular';

      conduce['iconsMoveEvents'] = [
        { key: 'ver', hover: ['text-green'], leave: ['text-black'] },
        { key: 'anular', hover: ['text-green'], leave: ['text-black'] },
      ];

      conduce['customStyles'] = {
        'cliente.nombre_completo': { 'text-align': 'start', 'padding-left': '1.5rem' },
        numero_conduce: { width: '11%' },
        cantidad_productos: { width: '10%' },
        fecha_equivalente: { width: '10%' },

        actions: [
          { key: 'actions', isTd: true, estilos: 'width: 9% !important; padding-left: 1rem !important' },
          { key: 'ver', estilos: 'font-size:1rem !important' },
          { key: 'anular', estilos: 'margin-left: 1rem !important; font-size:1rem !important' },
        ],
      };
      return conduce;
    });
    return data;
  }

  tableClickIcon(event) {
    const conduce_selected = event.data;

    if (event.columnKey) {
      switch (event.iconKey) {
        case 'ver':
          this.conduceClass.parseDataToPdf(conduce_selected).then((conduce_parsed) => {
            this.makeConducePdf(conduce_parsed);
          });
          break;

        case 'anular':
          const texto_modal = `Seguro de que desea anular el conduce <b class="negrita"> #${conduce_selected.numero_conduce} </b>`;
          const siFunction = (instance) => {
            this.anularRecibo(conduce_selected.id);
            instance.closeModal(instance.id, 'anular_conduce');
          };

          this.confirmationModal({ id: 'anular_conduce', header: 'Confirmar', texto: texto_modal, siFunction: siFunction });
          break;

        default:
          break;
      }
    }
  }

  makeConducePdf(conduce_selected) {
    const obj = { data: conduce_selected, type: 'conduce', retunBase64: true };
    this.loadServ.isLoading.next(true);

    PdfService.generatePdf({ oPdf: obj, imprimir: false })
      .then(async (res) => {
        if (res.status === 'si') {
          const fileName = res.file;
          const base64 = res.base64;
          const pageOrientation = res.pageOrientation;

          const obj_pdf = { base64: res.base64, titulo: 'Revisión de conduce de mercancías', reimprimir: true, fileName: _.first(res.file.split('.')) };

          this.loadServ.isLoading.next(false);

          this.openNewModal({
            component: PdfViewerComponent,
            inputs: obj_pdf,
            id: 'revision_conduce',
            header: obj_pdf.titulo,
            width: '900px',
            height: '40rem',
            botones: {
              ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
              dinamico: [
                { clase: 'btn btn-blanco', function: (instance) => instance.closeModal(instance.id, 'cancel'), label: 'Cerrar', disable: false },
                {
                  clase: 'btn btn-verde',
                  function: (instance) => {
                    this.imprimir_base64(fileName, base64, pageOrientation);
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

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.openNewModal({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco', function: (instance) => instance.closeModal(instance.id, obj.id), label: 'NO', disable: false },
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

  imprimir_base64(fileName, base64, pageOrientation) {
    const obj = { base64: base64, file: fileName, type: 'conduce', printer: this.configApp.printer_selected.conduce, pageOrientation: pageOrientation };
    try {
      PdfService.imprimirBase64(obj)
        .then(async (res) => {
          if (res['status'] === 'si') fun.toastSuccess('Conduce de mercancía reimpreso !!', 'CORRECTO');
          else fun.toastError(res['msg'], 'ERROR');
        })
        .catch((err) => {
          console.error(err);

          fun.toastError(err['msg'], 'ERROR');
        });
    } catch (error) {
      console.error(error);
    }
  }

  async anularRecibo(id) {
    try {
      const extra = { afterPath: `revertir/by_id/${id}` };
      const actualPagination = this.tServ.getPaginationById('listado_conduces');

      this.conduceClass.dynamic(extra).then((res) => this.getConduces(actualPagination));
    } catch (error) {}
  }
}
