import { Component, OnInit, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../../core/javascript/moment';
import { NgSelectConfig } from '@ng-select/ng-select';
import { TablasService } from '../../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ReciboC } from '../../recibos';
import { RecibosService } from '../../recibos.service';
import { FacturaC } from '../../../facturacion/factura';
import { PdfService } from '../../../../core/services/pdf/pdf.service';
import { FormCantidadEfectivoComponent } from '../../../components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '../../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { fun } from '../../../../core/services/functions.service';
import { table_config } from '../../../components/new_tablas/tabla-class';
import { ModalClass } from '../../../components/modal/modal-class';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
})
export class IngresosComponent extends MixinClass implements OnInit, OnDestroy {
  clienteAdepositar: any;
  facturas = [];
  tipo_recibo = 'Pago factura';
  is_print = false;
  // =============================================
  //  TABLAS
  // =============================================

  table_config: table_config = {
    info: [
      {
        titulo: '1',
        tipo: 'icon',
        key: 'actions',
        div_class: 'd-flex justify-content-around',
        estilos: [{ width: '6%' }, { color: 'var(--transparente00)' }],
        iconsArray: [
          { key: 'ver', tooltip: 'Ver factura', text_color: 'colorNegro' },
          { key: 'historyPagos', rowTooltip: 'tooltip_history', text_color: 'colorEstado' },
        ],
      },

      { titulo: 'NCF', tipo: 'text', estilos: [{ width: '7rem' }], key: 'numero_comprobante' },
      { titulo: 'Fecha Facturacion', tipo: 'text', key: 'fecha' },
      { titulo: 'Fecha Vencimiento', tipo: 'text', text_color: 'colorFecha', key: 'fechaV' },
      { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura' },
      { titulo: 'Balance factura', tipo: 'formatoNumero', key: 'balance' },

      {
        titulo: 'Seleccione',
        tipo: 'switch',
        key: 'select',
        select_all: false,
        estilos: [{ width: '7rem', padding: '0.6rem 0rem' }],
        disable: [{ kind: 'campo', target: 'is_viaje', value: [true] }],
      },
      {
        titulo: 'Pago Total',
        tipo: 'switch',
        key: 'pagoT',
        select_all: false,
        estilos: [{ width: '6rem', padding: '0.6rem 0rem' }],
        disable: [{ kind: 'campo', target: 'select', value: [false] }],
      },
      {
        titulo: 'Monto a pagar',
        tipo: 'input',
        key: 'monto',
        can_reset: false,
        checkNumber: true,
        disable: [
          { kind: 'campo', target: 'select', value: [false] },
          { kind: 'campo', target: 'pagoT', value: [true] },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_recibos',
    padre_functions: { data_request: (params) => this.pedirNuevaData(params) },
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };

  tablaComponent;

  tipoFacturas;
  precioEnTurno: any;
  ExisteMontoMayor: boolean;
  detalleYtotal: any;
  devuelta: any;
  forma_pago: any;

  totalFacturado: number;
  totalPagado: number;
  totalNotas: number;
  totalPagadoPorciento: number;
  recibiendo = 0;
  restando = 0;
  reciboClass = new ReciboC();
  facturaClass = new FacturaC();
  debiendo;

  constructor(private config: NgSelectConfig, private tServ: TablasService, private reciboServ: RecibosService) {
    super();
    this.config.notFoundText = 'Articulo no existe';
  }

  ngOnInit() {
    this._init_mixin({ component: 'ingresos', is_routing: true });
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

  formatoNumero(num) {
    return fun.numFormatTwoDecimals(num);
  }

  areAllSelected() {
    const facturas_no_viaje = _.filter(this.facturas, (factura) => !factura.is_viaje);
    return _.every(facturas_no_viaje, (factura) => factura.select);
  }

  getIcon() {
    const allSelected = this.areAllSelected();
    return { icon: allSelected ? 'fa-check-square' : 'fa-square', tooltip: allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos' };
  }

  selectAll() {
    const allSelected = this.areAllSelected();

    this.facturas.forEach((fact, index) => {
      if (allSelected) {
        if (!fact.is_viaje && fact.select) {
          this.facturas[index].pagoT = false;
          this.facturas[index].select = false;
          this.facturas[index].monto = '0.00';

          this.tablaComponent.resetInput('monto', 'especificar', index, true, '0.00');
        }
      } else {
        if (!fact.is_viaje && !fact.select) this.facturas[index].select = true;
      }
    });

    this.sumarTotalRecibo();
  }

  async pedirFacturasPorCliente(cliente_id, params?: { per_page: number; page: number; search: string }) {
    this.facturas.length = 0;

    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalNotas = 0;
    this.totalPagadoPorciento = 0;

    const fechaA = moment().format('YYYY-MM-DD');

    const res = await this.facturaClass.getAll({ afterPath: `cliente/${cliente_id}/pagada/false`, parameters: { page: params.page, per_page: params.per_page, paginado: true } });

    res.data.map((factura) => {
      factura.secuencia = _.padStart(factura.numero_factura, 8, '0');
      factura.fecha = moment(factura.fecha_equivalente).format('DD-MM-YYYY');
      factura.fechaV = factura.condicion === 'Crédito' ? moment(factura.fecha_vencimiento).format('DD-MM-YYYY') : null;
      factura.select = false;
      factura.pagoT = false;
      factura.pago_a_tiempo = factura.fecha_vencimiento > fechaA ? true : false;
      factura.colorFecha = moment(factura.fecha_vencimiento).format('YYYY-MM-DD') < fechaA ? 'red' : 'black';
      factura.monto = '0.00';
      const modalMoviemientos = factura.pagos.length > 0 || factura.notas.length > 0;

      factura.tooltip_history = factura.is_viaje ? null : 'Movimientos realizados';
      factura.historyPagos = factura.is_viaje ? 'fas fa-truck-moving' : modalMoviemientos ? 'fas fa-comment-dollar' : 'far fa-comment';
      factura.colorEstado = factura.is_viaje ? 'green' : modalMoviemientos ? 'black' : 'gris-claro';
      factura.iconHover = factura.is_viaje ? false : modalMoviemientos ? true : false;
      factura.ver = 'far fa-eye';

      factura.customStyles = {
        actions: [
          { key: 'actions', isTd: true, estilos: 'width: 6% !important; padding: 0.6rem 0rem !important' },
          { key: 'historyPagos', estilos: 'font-size: 1rem !important' },
          { key: 'ver', estilos: 'font-size: 1rem !important' },
        ],
        select: { width: '6rem' },
        pagoT: { width: '6rem' },
        numero_comprobante: { width: '7rem' },
      };

      this.totalPagado = _.reduce(factura.pagos, (acumulado, item) => acumulado + item.deposito, this.totalPagado);
      this.totalNotas = _.reduce(factura.notas, (acumulado, item) => acumulado + Math.abs(item.total), this.totalNotas);

      factura.subrayar = factura.is_viaje;

      this.totalFacturado += factura.total_factura;
      this.totalPagadoPorciento = (this.totalPagado / this.totalFacturado) * 100;
      this.totalPagadoPorciento = parseFloat(fun.numFormatTwoDecimals(this.totalPagadoPorciento));

      this.facturas.push(factura);

      return factura;
    });

    this.facturas = _.orderBy(this.facturas, ['id'], ['desc']);
    this.debiendo = this.totalFacturado - this.totalPagado - this.totalNotas;
    this.restando = this.debiendo - this.recibiendo <= 1 ? 0 : this.debiendo - this.recibiendo;

    setTimeout(() => {
      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    }, 100);
  }

  async necesarioStart() {
    this.enfocarInput('clienteI');
  }

  isOneFacturaWithMonto() {
    const valid = _.some(this.facturas, (factura) => factura.select && fun.desformatear(factura.monto) > 0);
    return valid;
  }

  cancelarIgreso() {
    this.facturas.length = 0;

    this.clienteAdepositar = undefined;
    (document.getElementById('clienteI') as any).value = null;

    this.resetVariables();

    setTimeout(() => this.enfocarInput('clienteI'), 250);
  }

  formarDetalleRecibos() {
    const temp = [];
    let total = 0;

    const facturas_selected = _.filter(this.facturas, (factura) => factura.select);

    for (let i = 0; i < facturas_selected.length; i++) {
      const fact = facturas_selected[i];

      temp.push({
        cabecera_factura_id: fact.id,
        pago_total: fact.pagoT,
        deposito: fun.desformatear(fact.monto),
        descripcion:
          this.tipo_recibo === 'Pago factura'
            ? fact.pagoT
              ? 'Saldo ' + fact.numero_comprobante + ' ' + moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
              : 'Abono ' + fact.numero_comprobante + ' ' + moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
            : '',
        pago_a_tiempo: fact.pago_a_tiempo,
      });

      total += fun.desformatear(fact.monto);
    }

    const obj = { total_recibo: total, detalle: temp };

    return obj;
  }

  abrirModalDinamicText(tipo) {
    const obj = {
      id: 'cancelar_ingreso',
      header: 'Confirmación',
      texto: 'Seguro de que desea cancelar la operacion.',
      siFunction: (instance) => {
        this.cancelarIgreso();
        instance.closeModal(instance.id, 'cancelar');
      },
    };
    this.confirmationModal(obj);
  }

  async getDataFromModal(arg, search) {
    if (arg.modal_id === 'cambioEfectivo_IngresosComponent') {
      this.devuelta = arg.obj.devuelta;
      this.forma_pago = arg.obj.forma_pago;
      this.is_print = arg.is_print;
      this.sendIngreso();
    }

    if (arg.modal_id === 'buscarCliente') {
      if (arg?.tipo == 'data_no_found') {
        this.enfocarInput('clienteI');
        this.selectContenido('clienteI');
      } else {
        this.clienteAdepositar = arg.data;
        (document.getElementById('clienteI') as any).value = `${arg.data.nombre} ${arg.data.apellido}`;
        this.pedirFacturasPorCliente(arg.data.id, this.tServ.obj_paginate.default);
      }
    }
  }

  pedirNuevaData(params?: { per_page: number; page: number; search: string }) {
    if (fun.hasValue(this.clienteAdepositar)) {
      this.pedirFacturasPorCliente(this.clienteAdepositar.id, params);
    } else {
      fun.toastWarning('Debe de seleccionar un cliente para continuar.', 'AVISO');
    }
  }

  async confirmarIgreso() {
    if (this.ExisteMontoMayor) {
      fun.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR');
    } else {
      this.detalleYtotal = await this.formarDetalleRecibos();
      const obj = { total_factura: this.detalleYtotal.total_recibo, devuelta: 0, factura_de: 'recibo_ingreso', tipo_modal: 'devuelta', formaPago: 'Efectivo' };

      this.openNewModal({
        component: FormCantidadEfectivoComponent,
        inputs: obj,
        id: 'cambioEfectivo_IngresosComponent',
        header: 'Cantidad de efectivo',
        width: '34.375rem',
        botones: {
          ...ModalClass.noShowAceptarCancelarButtons,
          dinamico: [
            {
              clase: 'btn btn-blanco mr-2',
              function: (instance) => {
                this.closeModal(instance);
              },
              label: 'Cancelar',
              disable: false,
            },
            { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
          ],
        },
      });
    }
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.openNewModal({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p>
      ${obj.texto}
    </p>`,
      botones: {
        ...ModalClass.noShowAceptarCancelarButtons,
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'NO', disable: false },
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

  closeModal(modalInstance) {
    console.warn('modalInstance: ', modalInstance);

    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  async sendIngreso() {
    const obj = {
      cliente_id: this.clienteAdepositar.id,
      total: 0,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: this.devuelta,
      numero_recibo: null,
      estado: true,
    };

    obj.total = this.detalleYtotal.total_recibo;
    obj['detalle_recibos'] = this.detalleYtotal.detalle;

    this.reciboClass.createUpdateOne(obj).then((res) => {
      const recibo = res['data'].recibo;

      this.clienteAdepositar.balance = recibo.cliente.balance;
      const actualPagination = this.tServ.getPaginationById('listado_recibos');
      this.pedirFacturasPorCliente(this.clienteAdepositar.id, actualPagination);
      this.resetVariables();

      const obj_print = { data: recibo, type: 'recibo_ingreso' };

      if (this.is_print) {
        PdfService.generatePdf({ oPdf: obj_print, imprimir: true })
          .then(async (res) => {
            if (res.status === 'si') {
            } else fun.toastError(res.msg, 'ERROR');

            this.layServ.nextCheckCuadreToday(true);
          })
          .catch((err) => fun.toastError(err.msg, 'ERROR'));
      }
    });
  }

  resetVariables() {
    this.forma_pago = null;
    this.devuelta = null;
    this.detalleYtotal = undefined;
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'historyPagos' && (params.data.pagos.length || params.data.notas.length)) {
        this.reciboServ.abrirModalHistorial(params.data.pagos, params.data.notas);
      }
      if (params.iconKey == 'ver') {
        this.facturaClass.parseDataToPdf(params.data).then((dataFactura) => {
          this.facturaClass.handleMostrarFactura(dataFactura).then((obj_modal) => {
            const ver_datelles_btn = { clase: 'btn btn-gris mr-2', function: (instance) => this.verDetalles(params.data), label: 'Ver detalles', disable: false };
            obj_modal.botones.dinamico.push(ver_datelles_btn);
            this.openNewModal(obj_modal);
          });
        });
      }
    }
  }

  verDetalles(data) {
    const configModal = this.reciboClass.modalVerDetalles(data);

    this.openNewModal(configModal);
  }

  tableInputChange(params) {
    if (params.key == 'select') {
      if (!params.value) {
        const factura = _.find(this.facturas, { id: params.data.id });
        factura.pagoT = false;
        params.data.monto = '0.00';
      }
    }

    if (params.key == 'pagoT' && params.value) {
      params.data.monto = fun.numFormatTwoDecimals(params.data.balance);
    }

    if (params.key == 'monto') {
      if (!params.value) {
        fun.toastWarning('Debe de introducir un Monto', 'AVISO');
        fun.enfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
      }
      const total = params.data.balance;
      const monto = fun.desformatear(params.value);

      if (monto == total) params.data.pagoT = true;

      if (monto > total) {
        this.ExisteMontoMayor = true;
        fun.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        fun.enfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
      } else {
        this.ExisteMontoMayor = false;
        params.data.monto = monto;
      }
    }

    this.sumarTotalRecibo();
  }

  sumarTotalRecibo() {
    this.recibiendo = _.reduce(this.facturas, (sum, item) => fun.desformatear(item.monto) + sum, 0);
    this.restando = this.debiendo - this.recibiendo <= 1 ? 0 : this.debiendo - this.recibiendo;
  }

  async abrirModalFiltro(nombre) {
    if (fun.hasValue(nombre)) {
      const obj = {
        data: [],
        palabra_a_buscar: nombre,
        metodo: 'venta',
      };

      this.openNewModal({
        component: BuscarClienteSuplidorComponent,
        inputs: obj,
        id: 'buscarCliente',
        header: 'Buscar cliente',
        width: '900px',
        height: '500px',
        botones: ModalClass.noShowAceptarCancelarButtons,
      });
      this.desEnfocarInput('clienteI');
    }
  }
}
