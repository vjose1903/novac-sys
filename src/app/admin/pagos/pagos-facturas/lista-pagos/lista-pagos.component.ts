import { Ss } from './../../../../core/services/singleton.service';
import { ConfigService } from './../../../../core/services/configuration.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { TablasService } from '../../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ReciboC } from '../../class/ingresos/recibos';
import { PagoC } from '../../class/pagos/pagos';
import { PdfService } from '../../../../core/services/pdf/pdf.service';
import { PdfViewerComponent } from '../../../components/pdf-viewer/pdf-viewer.component';
import { fun } from '../../../../core/services/functions.service';
import { Permisos } from '../../../../core/typescript/permisos';
import { table_config } from '../../../components/new_tablas/tabla-class';
import { ModalClass } from '../../../components/modal/modal-class';
import { tableConfigPagos, tipoPagoE } from './pagos.config';
import { PagosService } from '../pagos.service';

@Component({
  selector: 'app-lista-pagos',
  templateUrl: './lista-pagos.component.html',
  styleUrls: ['./lista-pagos.component.scss'],
})
export class ListaPagosComponent extends MixinClass implements OnInit, OnDestroy {
  static tablePagosId = 'listado_pagos';

  table_config: table_config = {
    colores: true,
    padding: '0.5rem',
    id_tabla: ListaPagosComponent.tablePagosId,
    padre_functions: { data_request: (params) => this.getPagos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, is_local: false },
  };
  tablaComponent;

  lista_pagos;
  rowSelected: any;
  reciboClass = new ReciboC();
  pagoClass = new PagoC();

  permissions = Permisos;
  constructor(private router: Router, private tServ: TablasService, private route: ActivatedRoute, public pagosService: PagosService) {
    super();
  }

  async ngOnInit() {
    this._init_mixin({ component: 'lista_recibos', is_routing: true });
    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      arg['verificar'] = true;

      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  mapeoPagos(data) {
    data.map((pago) => {
      const numberKey = this.pagosService.isReciboIngreso ? 'numero_recibo' : 'numero';
      pago[numberKey] = String(pago[numberKey]).padStart(8, '0');

      const detalleKey = this.pagosService.isReciboIngreso ? 'detalle_recibos' : 'pago_factura_detalles';
      pago['numero_factura'] = pago[detalleKey].length === 1 ? pago[detalleKey][0].descripcion.split(' ')[1] : 'Varios...';

      pago['ver'] = 'far fa-eye';
      pago['anular'] = 'far fa-trash-alt';
      pago['tooltip_ver'] = 'Ver';
      pago['tooltip_anular'] = 'Anular';

      pago['iconsMoveEvents'] = [
        { key: 'ver', hover: ['text-green'], leave: ['text-black'] },
        { key: 'anular', hover: ['text-green'], leave: ['text-black'] },
      ];

      const entidadKey = this.pagosService.isReciboIngreso ? 'cliente.nombre_completo' : 'suplidor.nombre_completo';

      pago['customStyles'] = {
        [entidadKey]: { 'text-align': 'start', 'padding-left': '1.5rem' },
        [numberKey]: { width: '8%' },
        fecha_equivalente: { width: '10%' },
        numero_factura: { width: '12%' },
        total: { width: '12%', 'text-align': 'end', 'padding-right': '1.5rem' },
        actions: [
          { key: 'actions', isTd: true, estilos: 'width: 9% !important; padding-left: 1rem !important' },
          { key: 'ver', estilos: 'font-size:1rem !important' },
          { key: 'anular', estilos: 'margin-left: 1rem !important; font-size:1rem !important' },
        ],
      };

      return pago;
    });

    return data;
  }

  async necesarioStart() {
    this.pagosService.tipoPago.set(this.route.snapshot.params['tipo'] as tipoPagoE);
    this.table_config.info = tableConfigPagos[this.pagosService.tipoPago()];
    await this.getPagos(this.tServ.obj_paginate.default);
  }

  async getPagos(params?: { per_page?: number; page?: number; search?: string }) {
    try {
      const classToQuery = { [tipoPagoE.recibosIngresos]: this.reciboClass, [tipoPagoE.pagosFacturas]: this.pagoClass };

      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };

      classToQuery[this.pagosService.tipoPago()].getAll(extra).then((res) => {
        res['data'] = this.mapeoPagos(res['data']);
        this.lista_pagos = fun.deepCloning(res['data']);

        this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {}
  }

  navegar() {
    this.router.navigateByUrl(`/admin/pagos/${this.pagosService.tipoPago()}/0/0`);
  }

  tableClickIcon(event) {
    const recibo_selected = event.data;

    if (event.columnKey) {
      switch (event.iconKey) {
        case 'ver':
          this.makePagoPdf(recibo_selected);
          break;

        case 'anular':
          const numberKey = this.pagosService.isReciboIngreso ? 'numero_recibo' : 'numero';
          const label = this.pagosService.isReciboIngreso ? 'recibo' : 'pago';
          const texto_modal = `Seguro de que desea anular el ${label} <b class="negrita"> #${recibo_selected[numberKey]} </b>`;

          const siFunction = (instance) => {
            this.anularPago(recibo_selected.id);
            instance.dismissModal(instance.id);
          };

          this.confirmationModal({ id: 'anular_pago', header: 'Confirmar', texto: texto_modal, siFunction: siFunction });
          break;

        default:
          break;
      }
    }
  }

  makePagoPdf(arg) {
    const pago_selected = this.lista_pagos.find((pago) => pago.id === arg.id);

    const classToQuery = { [tipoPagoE.recibosIngresos]: this.reciboClass, [tipoPagoE.pagosFacturas]: this.pagoClass };

    classToQuery[this.pagosService.tipoPago()].parseDataToPdf(pago_selected).then((pago_parsed) => {
      const obj = { data: pago_parsed, type: this.pagosService.tipoPago(), retunBase64: true };
      this.generarPdf(obj);
    });
  }

  generarPdf(obj) {
    Ss.loadServ.isLoading.next(true);

    PdfService.generatePdf({ oPdf: obj, imprimir: false })
      .then(async (res) => {
        if (res.status === 'si') {
          const fileName = res.file;
          const base64 = res.base64;
          const pageOrientation = res.pageOrientation;

          const titulo = this.pagosService.isReciboIngreso ? 'Revisión de recibo de ingreso' : 'Revisión de pago de factura';

          const obj_pdf = { base64: res.base64, titulo: titulo, reimprimir: true, fileName: _.first(res.file.split('.')) };

          Ss.loadServ.isLoading.next(false);

          this.openNewModal({
            component: PdfViewerComponent,
            inputs: obj_pdf,
            id: 'revision_pago',
            header: obj_pdf.titulo,
            width: '900px',
            height: '40rem',
            botones: {
              ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
              dinamico: [
                { clase: 'btn btn-blanco mr-2', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false },
                { clase: 'btn btn-gris mr-2', function: (instance) => this.verDetalles(obj.data), label: 'Ver detalles', disable: false },
                {
                  clase: 'btn btn-verde',
                  function: (instance) => {
                    this.imprimir_base64(fileName, base64, pageOrientation);
                    instance.dismissModal(instance.id);
                  },
                  label: 'Imprimir',
                  disable: false,
                },
              ],
            },
          });
        }
      })
      .catch((err) => {
        Ss.loadServ.isLoading.next(false);
      });
  }

  verDetalles(data) {
    const classToUse = { [tipoPagoE.recibosIngresos]: this.reciboClass, [tipoPagoE.pagosFacturas]: this.pagoClass };

    const configModal = classToUse[this.pagosService.tipoPago()].modalVerDetalles(data);
    this.openNewModal(configModal);
  }

  imprimir_base64(fileName, base64, pageOrientation) {
    const obj = { base64: base64, file: fileName, type: 'recibo_ingreso', printer: ConfigService.config.printer_selected.recibo_ingreso, pageOrientation: pageOrientation };
    try {
      PdfService.imprimirBase64(obj)
        .then(async (res) => {
          if (res['status'] === 'si') fun.toastSuccess('Recibo de ingreso reimpreso !!', 'CORRECTO');
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

  async anularPago(id) {
    try {
      const extra = { afterPath: `revertir/by_id/${id}` };
      const actualPagination = this.tServ.getPaginationById(ListaPagosComponent.tablePagosId);
      const classToQuery = { [tipoPagoE.recibosIngresos]: this.reciboClass, [tipoPagoE.pagosFacturas]: this.pagoClass };

      classToQuery[this.pagosService.tipoPago()].dynamic(extra).then((res) => this.getPagos(actualPagination));
    } catch (error) {}
  }
}
