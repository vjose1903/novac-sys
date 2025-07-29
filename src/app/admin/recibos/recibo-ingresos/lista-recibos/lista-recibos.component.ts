import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { LoaderService } from '../../../../loader/loader.service';
import { ReciboC } from '../../recibos';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { PdfViewerComponent } from '@components/pdf-viewer/pdf-viewer.component';
import { fun } from '@core/services/functions.service';
import { Permisos } from '@core/typescript/permisos';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { FacturaC } from '@admin/facturacion/factura';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'app-lista-recibos',
  templateUrl: './lista-recibos.component.html',
  styleUrls: ['./lista-recibos.component.scss'],
  standalone: false,
})
export class ListaRecibosComponent extends MixinClass implements OnInit, OnDestroy {
  table_config: table_config = {
    info: [
      { titulo: 'No. recibo', style: { width: '8%' }, key: 'numero_recibo', tipo: 'text' },
      { titulo: 'Fecha recibo', style: { width: '10%' }, key: 'fecha_equivalente', tipo: 'date' },
      { titulo: 'Cliente', key: 'cliente.nombre_completo', tipo: 'text', style: { 'text-align': 'start', 'padding-left': '1.5rem' } },
      { titulo: 'No. factura', key: 'numero_factura', tipo: 'text', style: { width: '12%' } },
      { titulo: 'Total recibido', key: 'total', tipo: 'formatoNumero', style: { width: '12%', 'text-align': 'end' } },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        key: 'actions',
        style: { width: '9%', color: '#000' },
        iconsArray: [
          { key: 'ver', rowTooltip: 'tooltip_ver', text_color: 'colorNegro' },
          { key: 'anular', rowTooltip: 'tooltip_anular', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_recibos',
    padre_functions: { data_request: params => this.getRecibos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
  };
  tablaComponent;

  lista_recibos;
  rowSelected: any;
  reciboClass = new ReciboC();
  facturaClass = new FacturaC();

  permissions = Permisos;
  configApp: ConfigI;

  dynamicModalServ = inject(DynamicModalService);
  router = inject(Router);
  tServ = inject(TablasService);
  loadServ = inject(LoaderService);

  constructor() {
    super();
  }

  async ngOnInit() {
    this._init_mixin({ component: 'lista_recibos', is_routing: true });
    this.configApp = Ss.configServ.config;
    this.necesarioStart();
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  mapeoRecibos(data) {
    return data.map(recibo => {
      const { detalle_recibos } = recibo;
      const esUnSoloDetalle = detalle_recibos.length === 1;

      return {
        ...recibo,
        numero_recibo: recibo.numero_recibo.toString().padStart(8, '0'),
        numero_factura: esUnSoloDetalle ? detalle_recibos[0].descripcion.split(' ')[1] : 'Varios...',
        ver: 'far fa-eye',
        anular: 'far fa-trash-alt',
        tooltip_ver: 'Ver',
        tooltip_anular: 'Anular',
        iconsMoveEvents: [
          { key: 'ver', hover: ['text-green'], leave: ['text-black'] },
          { key: 'anular', hover: ['text-green'], leave: ['text-black'] },
        ],
        customStyles: {
          actions: [
            { key: 'ver', estilos: 'font-size:1rem !important' },
            { key: 'anular', estilos: 'margin-left: 1rem !important; font-size:1rem !important' },
          ],
        },
      };
    });
  }

  async necesarioStart() {
    await this.getRecibos(this.tServ.obj_paginate.default);
  }

  async getRecibos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = {
      afterPath: `filtro/${palabra_a_buscar}`,
      parameters: {
        page: params.page,
        per_page: params.per_page,
        paginado: true,
      },
    };

    try {
      const res = await this.reciboClass.getAll(extra);
      res.data = this.mapeoRecibos(res.data);
      this.lista_recibos = fun.deepCloning(res.data);
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    } catch (error) {
      console.error('Error al obtener recibos:', error);
    }
  }

  navegar() {
    this.router.navigateByUrl('/admin/recibos/ingresos/0/0');
  }

  tableClickIcon(event) {
    const recibo_selected = event.data;

    if (event.columnKey) {
      switch (event.iconKey) {
        case 'ver':
          this.makeReciboPdf(recibo_selected);
          break;

        case 'anular':
          this.dynamicModalServ.confirmationModal({
            id: 'confirmAnularDocumento',
            texto: `Seguro de que desea anular el recibo <b class="negrita"> #${recibo_selected.numero_recibo} </b>`,
            header: 'Confirmación',
            btnKind: confirmationButtons.cancelarAnular,
            onYes: () => this.anularRecibo(recibo_selected.id),
          });

          break;

        default:
          break;
      }
    }
  }

  makeReciboPdf(arg) {
    const recibo_selected = this.lista_recibos.find(recibo => recibo.id === arg.id);

    this.reciboClass.parseDataToPdf(recibo_selected).then(recibo_parsed => {
      const obj = { data: recibo_parsed, type: 'recibo_ingreso', retunBase64: true };
      this.generarPdf(obj);
    });
  }

  generarPdf(obj) {
    this.loadServ.isLoading.next(true);

    PdfService.generatePdf({ oPdf: obj, imprimir: false })
      .then(res => {
        this.loadServ.isLoading.next(false);

        const { file: fileName, base64, pageOrientation } = res;
        const obj_pdf = {
          base64,
          reimprimir: true,
          fileName: fileName.split('.')[0],
        };

        const reciboModalConf = new DynamicModalClass();
        reciboModalConf.id = 'revision_recibo';
        reciboModalConf.inputs = obj_pdf;
        reciboModalConf.header = 'Revisión de recibo de ingreso';
        reciboModalConf.width = '56.25rem';
        reciboModalConf.height = '40rem';
        reciboModalConf.component = PdfViewerComponent;
        reciboModalConf.closableEsc = true;

        reciboModalConf.botones = [
          { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false },
          { clase: 'btn btn-gris', function: instance => this.verDetalles(obj.data), label: 'Ver detalles', disable: false },
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

  verDetalles(data) {
    this.facturaClass.modalVerDetalles(data, 'recibo');
  }

  imprimir_base64(fileName, base64, pageOrientation) {
    const obj = {
      base64,
      file: fileName,
      type: 'recibo_ingreso',
      printer: this.configApp.printer_selected.recibo_ingreso,
      pageOrientation,
    };

    PdfService.imprimirBase64(obj)
      .then(res => {
        if (res.status === 'si') fun.toastSuccess('Recibo de ingreso reimpreso !!', 'CORRECTO');
        else fun.toastError(res.msg, 'ERROR');
      })
      .catch(err => {
        console.error(err);
        fun.toastError(err.msg, 'ERROR');
      });
  }

  async anularRecibo(id) {
    try {
      const extra = { afterPath: `revertir/by_id/${id}` };
      const actualPagination = this.tServ.getPaginationById('listado_recibos');

      this.reciboClass.dynamic(extra).then(res => this.getRecibos(actualPagination));
    } catch (error) {}
  }
}
