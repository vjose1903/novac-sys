import { HtmlElementsService } from './../../../../core/services/html-elements.service';
import { Ss } from './../../../../core/services/singleton.service';
import { ClienteC } from './../../../registros/registro-clientes/cliente';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import * as _ from 'lodash';
import { TablasService } from '../../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ReciboC } from '../../recibos';
import { FacturaC, FacturasI } from '../../../facturacion/factura';
import { PdfService } from '../../../../core/services/reports/pdf/pdf.service';
import { FormCantidadEfectivoComponent } from '../../../components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '../../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { fun } from '../../../../core/services/functions.service';
import { default_per_page, table_config } from '../../../components/new_tablas/tabla-class';
import { ModalClass } from '../../../components/modal/modal-class';
import { Router, ActivatedRoute } from '@angular/router';
import { MoraSelectorComponent } from '../components/mora-selector/mora-selector.component';
import { Location } from '@angular/common';
import Big from 'big.js';
const moment = require('../../../../core/javascript/moment');

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: false,
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
          { key: 'pedido', rowTooltip: 'tooltip_pedido', text_color: 'colorPedido', showCondition: [{ kind: 'campo', target: 'is_viaje', value: [true] }] },
        ],
      },

      { titulo: 'NCF', tipo: 'text', estilos: [{ width: '7rem' }], key: 'numero_comprobante' },
      { titulo: 'Fecha Fact.', alert_msg: 'Fecha de facturacion de la factura', tipo: 'date', key: 'fecha_equivalente', sort: { key: 'fecha_equivalente', order: null }, style: { width: '9rem' } },
      { titulo: 'Fecha Venc.', alert_msg: 'Fecha de vencimiento de la factura', tipo: 'text', text_color: 'colorFecha', key: 'fechaV' },
      { titulo: 'Monto', tipo: 'formatoNumero', key: 'total_factura' },
      { titulo: 'Pendiente', tipo: 'formatoNumero', key: 'balance' },
      { titulo: 'Mora', tipo: 'none', rowTransform: { component: (rowData: any) => MoraSelectorComponent, inputs: { key: 'mora', returnDara: data => this.getDataFromMoraSelector.bind(this)(data) } } },
      {
        titulo: 'Seleccione',
        tipo: 'switch',
        key: 'select',
        select_all: false,
        style: { width: '7rem', padding: '0.6rem 0rem' },
      },
      {
        titulo: 'Pago Total',
        tipo: 'switch',
        key: 'pagoT',
        select_all: false,
        style: { width: '6rem', padding: '0.6rem 0rem' },
        disable: [{ kind: 'campo', target: 'select', value: [false] }],
      },
      {
        titulo: 'Monto a pagar',
        tipo: 'input',
        key: 'monto',
        can_reset: false,
        inputEvents: 'formatoNumero',
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
    padre_functions: { data_request: params => this.pedirNuevaData(params) },
    obj_paginate: { show: true, showTotal: false, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
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
  totalNotasDebito: number;
  totalNotasCredito: number;
  totalPagadoPorciento: number;
  totalRegistros;
  totalPaginas;
  debiendo_sin_mora = signal<number>(0);

  facturasSelected = signal<FacturasI[]>([]);
  mora = signal<number>(0);

  recibiendo = computed(() => this.facturasSelected().reduce((sum, item) => fun.desformatearStNumber(item.monto) + sum, 0));

  restando = computed(() => {
    const debiendo = this.debiendo_con_mora();
    const recibiendo = this.recibiendo();

    return debiendo - recibiendo <= 1 ? 0 : debiendo - recibiendo;
  });

  debiendo_con_mora = computed(() => {
    return Number(this.debiendo_sin_mora()) + Number(this.mora());
  });

  clienteClass = new ClienteC();
  reciboClass = new ReciboC();
  facturaClass = new FacturaC();

  htmlServ = inject(HtmlElementsService);
  location = inject(Location);

  constructor(
    private tServ: TablasService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'ingresos', is_routing: true });
    this.necesarioStart();
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  goBack() {
    this.location.back();
  }

  formatoNumero(num) {
    return fun.roundNumberToDecimal(num);
  }

  areAllSelected() {
    const facturas_no_viaje = this.facturas.filter(factura => !factura.is_viaje);
    return _.every(facturas_no_viaje, factura => factura.select);
  }

  getIcon() {
    const allSelected = this.areAllSelected();
    return { icon: allSelected ? 'fa-check-square' : 'fa-square', tooltip: allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos' };
  }

  async pedirFacturasPorCliente(cliente_id, params?: { per_page?: number; page?: number; search?: string; factura_a_buscar?: any; order_by?: string }) {
    this.facturas.length = 0;

    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalNotasCredito = 0;
    this.totalNotasDebito = 0;
    this.totalPagadoPorciento = 0;

    const fechaA = moment().format('YYYY-MM-DD');
    const parameters = { page: params.page, per_page: params.per_page, paginado: true };

    if (fun.hasValue(params.factura_a_buscar)) parameters['factura_a_buscar'] = params.factura_a_buscar;

    if (fun.hasValue(params.order_by)) parameters['order_by'] = params.order_by;

    const res = await this.clienteClass.getAll({ afterPath: `custom/get_balances/${cliente_id}`, parameters: parameters });

    await res.data.facturas.data.map((factura, index) => {
      let factura_selected = this.facturasSelected().find(fact => fact.id == factura.id);

      if (fun.hasValue(params.factura_a_buscar) && factura.id == params.factura_a_buscar) {
        factura_selected = factura;
        factura_selected.monto = '0.00';
        factura_selected.pagoT = false;
        this.verificateFacturasSelected(factura_selected, 'insert', index, true);
      }

      factura.secuencia = _.padStart(factura.numero_factura, 8, '0');
      factura.fechaV = factura.condicion === 'Crédito' ? moment(factura.fecha_vencimiento).format('DD/MM/YYYY') : null;
      factura.select = fun.hasValue(factura_selected);
      factura.pagoT = fun.hasValue(factura_selected) ? factura_selected.pagoT : false;
      factura.pago_a_tiempo = factura.fecha_vencimiento > fechaA ? true : false;
      factura.colorFecha = moment(factura.fecha_vencimiento).format('YYYY-MM-DD') < fechaA ? 'red' : 'black';
      factura.monto = fun.hasValue(factura_selected) ? factura_selected.monto : '0.00';
      const modalMoviemientos = factura.pagos.length > 0 || factura.notas.length > 0;

      factura.tooltip_pedido = 'Modificar datos del pedido';
      factura.colorPedido = 'green';
      factura.pedido = 'fas fa-truck-moving';

      factura.tooltip_history = 'Movimientos realizados';
      factura.historyPagos = modalMoviemientos ? 'fas fa-comment-dollar' : 'far fa-comment';
      factura.colorEstado = modalMoviemientos ? 'black' : 'gris-claro';
      factura.iconHover = factura.is_viaje ? false : modalMoviemientos ? true : false;
      factura.ver = 'far fa-eye';

      factura.customStyles = {
        actions: [
          { key: 'actions', isTd: true, estilos: 'width: 6% !important; padding: 0.6rem 0rem !important' },
          { key: 'historyPagos', estilos: 'font-size: 1rem !important' },
          { key: 'pedido', estilos: 'font-size: 1rem !important' },
          { key: 'ver', estilos: 'font-size: 1rem !important' },
        ],
        select: { width: '6rem' },
        pagoT: { width: '6rem' },
        numero_comprobante: { width: '7rem' },
      };

      this.facturas.push(factura);

      return factura;
    });

    this.totalFacturado = res.data.balances.total_facturado;

    this.totalPagado = res.data.balances.abonado;
    this.totalNotasCredito = res.data.balances.notas_credito;
    this.totalNotasDebito = res.data.balances.notas_debito;

    this.debiendo_sin_mora.set(this.totalFacturado + this.totalNotasDebito - this.totalPagado - this.totalNotasCredito);

    this.totalPagadoPorciento = ((this.totalPagado + this.totalNotasCredito) / this.totalFacturado) * 100;
    this.totalPagadoPorciento = parseFloat(fun.roundNumberToDecimal(this.totalPagadoPorciento));

    setTimeout(() => {
      this.tablaComponent.changeTableConfig([{ total_count: res.data.facturas.total_registros }]);
      this.totalRegistros = res.data.facturas.total_registros;
      this.totalPaginas = res.data.facturas.total_paginas;

      if (res.data.page != params.page) {
        this.tServ.modifyPaginationById('listado_recibos', [{ page: res.data.page }]);

        setTimeout(() => {
          Ss.cdRef.detectChanges();
          const actualPagination = this.tServ.getPaginationById('listado_recibos');
          Ss.cdRef.detectChanges();
        }, 500);
      }
    }, 100);
  }

  getDataFromMoraSelector(data: FacturasI[]) {
    fun.awaitTyping(null, 10).then(() => {
      const total_mora = data.reduce((sum, item, index) => {
        const index_factura = this.facturas.findIndex(fact => fact.id == item.id);
        this.verificateFacturasSelected(item, 'modify', index_factura, item.monto, item.mora);
        const mora = fun.desformatearStNumber(item.mora);

        if (fun.hasValue(mora) && !isNaN(mora) && mora > 0) return mora + sum;
        else return sum;
      }, 0);

      this.mora.set(total_mora);
    });
  }

  async necesarioStart() {
    this.checkRoute();
  }

  async checkRoute() {
    const cliente_id = this.route.snapshot.params['cliente_id'];
    const factura_id = this.route.snapshot.params['factura_id'];

    if (cliente_id != '0' && factura_id != '0') {
      const cliente_response = await this.clienteClass.getOne(cliente_id);
      this.getDataFromModal({ data: cliente_response.data, modal_id: 'buscarCliente', factura_a_buscar: factura_id });
    } else {
      fun.enfocarInput('clienteI');
    }
  }

  isOneFacturaWithMonto() {
    const valid = this.facturasSelected().some(factura => factura.select && fun.desformatearStNumber(factura.monto) > 0);
    return valid;
  }

  cancelarIgreso() {
    this.facturas.length = 0;
    this.facturasSelected.set([]);
    this.clienteAdepositar = undefined;
    (document.getElementById('clienteI') as any).value = null;

    this.resetVariables();

    setTimeout(() => fun.enfocarInput('clienteI'), 250);
  }

  abrirModalDinamicText(tipo) {
    const obj = {
      id: 'cancelar_ingreso',
      header: 'Confirmación',
      texto: '¿Seguro de que desea cancelar la operacion?.',
      siFunction: instance => {
        this.cancelarIgreso();
        instance.closeModal(instance.id, 'cancelar');
      },
    };
    this.confirmationModal(obj);
  }

  getCantidadArticulos() {
    return this.facturasSelected().length;
  }

  async getDataFromModal(arg, search?) {
    if (arg.modal_id == 'cambioEfectivo_IngresosComponent') {
      this.devuelta = arg.obj.devuelta;
      this.forma_pago = arg.obj.forma_pago;
      this.is_print = arg.is_print;

      this.sendIngreso();
    }

    if (arg.modal_id == 'buscarCliente') {
      if (arg?.tipo == 'data_no_found') {
        fun.enfocarAndSelectInput('clienteI');
      } else {
        this.clienteAdepositar = arg.data;
        (document.getElementById('clienteI') as any).value = arg.data.nombre_completo;
        const parameters = { ...this.tServ.obj_paginate.default, factura_a_buscar: arg?.factura_a_buscar };
        this.pedirFacturasPorCliente(arg.data.id, parameters);
      }
    }
  }

  pedirNuevaData(params?: { per_page: number; page: number; search: string }) {
    if (fun.hasValue(this.clienteAdepositar)) {
      const order_by = this.tServ.parseSort(this.table_config);
      params = { ...params, ...order_by };
      this.pedirFacturasPorCliente(this.clienteAdepositar.id, params);
    } else {
      fun.toastWarning('Debe de seleccionar un cliente para continuar.', 'AVISO');
    }
  }

  resetVariables() {
    this.forma_pago = null;
    this.devuelta = null;
    this.detalleYtotal = undefined;
    this.facturasSelected.set([]);
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'pedido') {
        if (params.data.is_viaje) {
          const obj = {
            id: 'move_to_viajes',
            header: 'Confirmación',
            texto: '¿Seguro que desea dirigirse al modulo de viajes para modificar los datos del pedido?.',
            siFunction: instance => {
              this.router.navigateByUrl(`/admin/recibos/viajes/${params.data.id}`);
              instance.closeModal(instance.id, 'cancelar');
            },
          };
          this.confirmationModal(obj);
        }
      }
      if (params.iconKey == 'historyPagos' && (params.data.pagos.length || params.data.notas.length)) {
        this.facturaClass.abrirModalHistorial(params.data.pagos, params.data.notas, this.openNewModal.bind(this));
      }

      if (params.iconKey == 'ver') {
        this.facturaClass.parseDataToPdf(params.data).then(dataFactura => {
          let botonesDinamicos = [
            { clase: 'btn btn-gris', function: instance => this.verDetalles(params.data), label: 'Ver detalles', disable: false as any },
            { clase: 'btn btn-blanco', function: instance => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false as any },
          ];
          const toPDFData = { data: dataFactura, type: 'facturacion' };

          const dataModal = { id: 'mostrarFacturaIngreso', header: 'MOSTRAR FACTURA' };

          this.facturaClass.handleMostrarFactura(toPDFData, dataModal, botonesDinamicos).then(obj_modal => this.openNewModal(obj_modal));
        });
      }
    }
  }

  verDetalles(data) {
    const configModal = this.reciboClass.modalVerDetalles(data);
    this.openNewModal(configModal);
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
      if (!fact.is_viaje) this.verificateFacturasSelected(fact, 'insert', index, !allSelected);
    });
  }

  verificateFacturasSelected(factura, method, index, monto, mora?) {
    const factura_en_turno = this.facturasSelected().find(fact => fact.id == factura.id);

    if (method == 'insert') {
      if (monto) {
        if (fun.isEmpty(factura_en_turno)) this.facturasSelected.update(facts => [...facts, factura]);
      } else {
        this.facturasSelected.update(facts => facts.filter(fact => fact.id != factura.id));
      }
    } else if (method == 'modify') {
      this.facturasSelected.update(facts => facts.map(fact => (fact.id == factura.id ? fun.deepCloning(factura) : fact)));

      this.facturasSelected.update(facts =>
        facts.map(fact => {
          if (fact.id == factura.id) {
            return fun.hasValue(mora) ? { ...fact, monto: monto, mora: mora } : { ...fact, monto: monto };
          } else {
            return fact;
          }
        })
      );
      this.tablaComponent.resetInput('monto', 'especificar', index, true, monto);
    }
  }

  tableInputBlur(params) {
    const factura_en_turno = this.facturasSelected().find(factura => factura.id == params.data.id);
    if (fun.hasValue(factura_en_turno)) {
      const total = factura_en_turno.balance;
      const monto = fun.desformatearStNumber(factura_en_turno.monto);
      const mora = fun.desformatearStNumber(factura_en_turno.mora);

      if (monto > mora + total) {
        this.ExisteMontoMayor = true;
        fun.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        fun.enfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
      }
    } else {
      fun.desEnfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
    }
  }

  tableInputChange(params) {
    const balance = fun.desformatearStNumber(params.data.balance);
    const mora = fun.desformatearStNumber(params.data.mora);
    const monto = fun.desformatearStNumber(params.value);
    const monto_original = params.value;

    if (params.key == 'pagoT' && params.value) {
      const monto = params.data.select ? fun.roundNumberToDecimal(balance + mora) : '0.00';
      this.verificateFacturasSelected(params.data, 'modify', params.index, monto);
    }

    if (params.key == 'monto' && params.value != params.data.monto) {
      if (params.data.select) {
        if (fun.isEmpty(params.value)) fun.toastWarning('Debe de introducir un Monto', 'AVISO');

        if (monto == balance + mora) [params.newData.pagoT, params.data.pagoT] = Array(2).fill(true);

        if (monto > balance + mora) {
          this.ExisteMontoMayor = true;
          fun.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
          fun.enfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
        } else {
          this.ExisteMontoMayor = false;
        }

        this.verificateFacturasSelected(params.newData, 'modify', params.index, monto_original);
      }
    }

    if (params.key == 'select') {
      const factura = this.facturas.find(fact => fact.id == params.data.id);

      if (!params.value) {
        factura.pagoT = false;
        params.data.monto = '0.00';
        this.tablaComponent.resetInput('monto', 'especificar', params.index, true, '0.00');
      }

      this.verificateFacturasSelected(factura, 'insert', params.index, params.value);
    }
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
        botones: fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
      });
      fun.desEnfocarInput('clienteI');
    }
  }

  formarDetalleRecibos() {
    return this.facturasSelected().reduce(
      (acc, fact) => {
        const monto = Big(fun.desformatearStNumber(fact.monto));
        const mora = fun.desformatearStNumber(fact.mora);
        const deposito = monto.minus(mora).toNumber();

        acc.detalle.push({
          cabecera_factura_id: fact.id,
          pago_total: fact.pagoT,
          deposito: deposito,
          mora: mora,
          descripcion:
            this.tipo_recibo === 'Pago factura'
              ? fact.pagoT
                ? 'Saldo ' + fact.numero_comprobante + ' ' + moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
                : 'Abono ' + fact.numero_comprobante + ' ' + moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
              : '',
          pago_a_tiempo: fact.pago_a_tiempo,
        });

        acc.bruto += deposito;
        acc.mora += mora;
        acc.total_recibo += monto.toNumber();

        return acc;
      },
      { bruto: 0, mora: 0, total_recibo: 0, detalle: [] }
    );
  }

  async confirmarIgreso() {
    if (this.ExisteMontoMayor) {
      fun.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR');
    } else if (this.facturasSelected().some(factura => factura.monto == 0)) {
      fun.toastError('Todas las facturas seleccionadas deben de tener un monto a pagar', 'ERROR');
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
          ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
          dinamico: [
            { clase: 'btn btn-blanco', function: instance => this.closeModal(instance), label: 'Cancelar', disable: false },
            { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
          ],
        },
      });
    }
  }

  async sendIngreso() {
    const obj = {
      cliente_id: this.clienteAdepositar.id,
      bruto: this.detalleYtotal.bruto,
      mora: this.detalleYtotal.mora,
      total: this.detalleYtotal.total_recibo,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: this.devuelta,
      numero_recibo: null,
      estado: true,
      detalle_recibos: this.detalleYtotal.detalle,
    };

    this.reciboClass.createUpdateOne(obj).then(res => {
      const recibo = res['data'].recibo;

      const actualPagination = this.tServ.getPaginationById('listado_recibos');
      this.pedirFacturasPorCliente(this.clienteAdepositar.id, actualPagination);

      this.resetVariables();
      this.reciboClass.parseDataToPdf(recibo).then(recibo_parsed => {
        const obj_print = { data: recibo_parsed, type: 'recibo_ingreso' };

        PdfService.generatePdf({ oPdf: obj_print, imprimir: this.is_print })
          .then(async res => {
            this.layServ.nextCheckCuadreToday(true);
          })
          .catch(err => fun.toastError(err.msg, 'ERROR'));
      });
    });
  }
}
