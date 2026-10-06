import { loadPdfViewerComponent } from '@components/pdf-viewer/pdf-viewer.loader';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { LoaderService } from './../../../loader/loader.service';
import { TablasService } from '@components/new_tablas/tablas.service';
import { fun } from '@core/services/functions.service';
import { Ss } from '@core/services/singleton.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { ConfigI } from '@core/interface/config-interface';
import { Permisos } from '@core/typescript/permisos';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { Router } from '@angular/router';
import { ConduceC } from '../coduce';

import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'app-conduce-lista',
  templateUrl: './conduce-lista.component.html',
  styleUrls: ['./conduce-lista.component.scss'],
  standalone: false,
})
export class ConduceListaComponent extends MixinClass implements OnInit, OnDestroy {
  lista_conduces;

  table_config: table_config = {
    info: [
      { titulo: 'No. conduce', estilos: [{ width: '11%' }], key: 'numero_conduce', tipo: 'text' },
      { titulo: 'Fecha conduce', estilos: [{ width: '10%' }], key: 'fecha_equivalente', tipo: 'date' },
      { titulo: 'Cliente', key: 'cliente.nombre_completo', tipo: 'text', capitalice: true, estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }] },
      { titulo: 'Cantidad de productos', key: 'cantidad_productos', tipo: 'text', estilos: [{ width: '10%' }, { 'text-align': 'center' }] },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        key: 'actions',
        estilos: [{ width: '9%' }],
        iconsArray: [
          { key: 'ver', rowTooltip: 'tooltip_ver', text_color: 'colorNegro' },
          { key: 'anular', rowTooltip: 'tooltip_anular', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_conduces',
    padre_functions: { data_request: params => this.getConduces(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
  };

  tablaComponent;

  permissions = Permisos;
  configApp: ConfigI;

  conduceClass = new ConduceC();

  private dynamicModalServ = inject(DynamicModalService);
  private router = inject(Router);
  private tServ = inject(TablasService);
  public loadServ = inject(LoaderService);

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'lista_conduce', is_routing: true });
    this.configApp = Ss.configServ.config;
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.getConduces(this.tServ.obj_paginate.default);
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
      this.table_config.total_count = 0;
      this.tablaComponent?.changeTableConfig([{ total_count: 0 }]);

      this.conduceClass.getAll(extra).then(res => {
        res['data'] = this.mapeoRecibos(res['data']);

        this.lista_conduces = fun.deepCloning(res['data']);

        this.table_config.total_count = res.total_registros;
        this.tablaComponent?.changeTableConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {}
  }

  mapeoRecibos(data) {
    data.map(conduce => {
      conduce['numero_conduce'] = fun.padStart(conduce.numero_conduce, 8, '0');
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
          this.conduceClass.parseDataToPdf(conduce_selected).then(conduce_parsed => {
            this.makeConducePdf(conduce_parsed);
          });
          break;

        case 'anular':
          this.confirmationAnularModal(conduce_selected);
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
      .then(async res => {
        this.loadServ.isLoading.next(false);

        const fileName = res.file;
        const base64 = res.base64;
        const pageOrientation = res.pageOrientation;

        const obj_pdf = { base64: res.base64, reimprimir: true, fileName: fileName.split('.')[0] };

        const reciboModalConf = new DynamicModalClass();
        reciboModalConf.id = 'revision_conduce';
        reciboModalConf.inputs = obj_pdf;
        reciboModalConf.header = 'Revisión de conduce de mercancías';
        reciboModalConf.width = '57rem';
        reciboModalConf.height = '40rem';
        reciboModalConf.loadComponent = loadPdfViewerComponent;
        reciboModalConf.closableEsc = true;

        reciboModalConf.botones = [
          { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false },
          {
            clase: 'btn btn-verde',
            function: instance => {
              this.imprimir_base64(fileName, base64, pageOrientation);
              instance.close();
            },
            label: 'Imprimir',
            disable: false,
          },
        ];

        reciboModalConf.show();
      })
      .catch(err => {
        fun.toastError(err.msg, 'ERROR');
        this.loadServ.isLoading.next(false);
      });
  }

  confirmationAnularModal(conduce: any) {
    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: `Seguro de que desea anular el conduce <strong> #${conduce.numero_conduce} </strong>`,
      btnKind: confirmationButtons.siNo,
      onYes: () => this.anularRecibo(conduce.id),
    });
  }

  imprimir_base64(fileName, base64, pageOrientation) {
    const obj = { base64: base64, file: fileName, type: 'conduce', printer: this.configApp.printer_selected.conduce, pageOrientation: pageOrientation };
    PdfService.imprimirBase64(obj)
      .then(async res => {
        fun.toastSuccess('Conduce de mercancía reimpreso !!', 'CORRECTO');
      })
      .catch(() => {});
  }

  async anularRecibo(id) {
    try {
      const extra = { afterPath: `revertir/by_id/${id}` };
      const actualPagination = this.tServ.getPaginationById('listado_conduces');

      this.conduceClass.dynamic(extra).then(res => this.getConduces(actualPagination));
    } catch (error) {}
  }
}
