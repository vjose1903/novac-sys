import { HtmlElementsService } from '@core/services/html-elements.service';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { Component, OnInit, OnDestroy, inject, signal, computed, Input } from '@angular/core';
import * as _ from 'lodash';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { ReciboC } from '../../recibos';
import { FacturaC, FacturasI, tipoDocFacturacion } from '../../../facturacion/factura';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { FormCantidadEfectivoComponent } from '@components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { Router } from '@angular/router';
import { MoraSelectorComponent } from '../components/mora-selector/mora-selector.component';
import { Location } from '@angular/common';
import Big from 'big.js';
import { MoraSelectorKeyI, MoraSelectorService } from '../components/mora-selector/mora-selector.service';
import { MoraCalculator } from '../utils/mora-calculator';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import moment from '../../../../core/javascript/moment';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: false,
})
export class IngresosComponent extends MixinClass implements OnInit, OnDestroy {
  @Input() cliente_id: string;
  @Input() factura_id: string;

  clienteAdepositar = signal<any>(null);
  all_facturas = signal<FacturasI[]>([]);
  facturas = [];
  tipo_recibo = 'Pago factura';
  is_print = false;
  isSubmitting = false;
  private clienteBalanceRequestId = 0;
  // =============================================
  //  TABLAS
  // =============================================

  table_config: table_config = {
    track_key: 'id',
    copyDataDeep: false,
    info: [
      {
        titulo: '1',
        tipo: 'icon',
        key: 'actions',
        div_class: 'd-flex justify-content-around',
        style: { width: '6%', color: 'var(--transparente00)' },
        iconsArray: [
          { key: 'ver', tooltip: 'Ver factura', text_color: 'colorNegro' },
          { key: 'historyPagos', rowTooltip: 'tooltip_history', text_color: 'colorEstado' },
          { key: 'pedido', rowTooltip: 'tooltip_pedido', text_color: 'colorPedido', showCondition: [{ kind: 'campo', target: 'is_viaje', value: [true] }] },
        ],
      },

      { titulo: 'NCF', tipo: 'text', style: { width: '6rem' }, key: 'numero_comprobante' },
      { titulo: 'Fecha Fact.', alert_msg: 'Fecha de facturacion de la factura', tipo: 'date', key: 'fecha_equivalente', sort: { key: 'fecha_equivalente', order: null }, style: { width: '9rem' } },
      { titulo: 'Fecha Venc.', alert_msg: 'Fecha de vencimiento de la factura', tipo: 'text', text_color: 'colorFecha', key: 'fechaV' },
      { titulo: 'Monto', tipo: 'formatoNumero', key: 'total_factura' },
      { titulo: 'Pendiente', tipo: 'formatoNumero', key: 'balance' },
      { titulo: 'Mora', tipo: 'none', rowTransform: { component: (rowData: any) => MoraSelectorComponent, inputs: { key: 'mora', returnData: data => this.getDataFromMoraSelector.bind(this)(data) } } },
      {
        titulo: 'Seleccione',
        tipo: 'switch',
        key: 'select',
        select_all: false,
        style: { width: '5rem' },
      },
      {
        titulo: 'Pago Total',
        tipo: 'switch',
        key: 'pagoT',
        select_all: false,
        style: { width: '5rem' },
        disable: [{ kind: 'campo', target: 'select', value: [false] }],
      },
      {
        titulo: 'Monto',
        alert_msg: 'Monto a pagar',
        tipo: 'input',
        key: 'monto',
        can_reset: false,
        inputEvents: 'formatoNumero',
        style: { width: '13%' },
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
    obj_paginate: { show: true, showTotal: false, page: 1, per_page: 20, per_page_options: [3, ...default_per_page], search: ' ', is_local: true, key: 'id' },
  };

  tablaComponent;

  ExisteMontoMayor: boolean = false;
  detalleYtotal: any;
  devuelta: any;
  forma_pago: any;

  totalFacturado: number;
  totalPagado: number;
  totalNotasDebito: number;
  totalNotasCredito: number;
  totalPagadoPorciento: number;
  debiendo_sin_mora = signal<number>(0);

  facturasSelected = signal<FacturasI[]>([]);
  porcentajeSelected = 2;

  recibiendo = computed(() => {
    if (this.facturasSelected().length == 0) return 0;
    return this.facturasSelected().reduce((sum, item) => {
      if (fun.hasValue(item.monto)) sum += this.parseMonto(item.monto);
      return sum;
    }, 0);
  });

  restando = computed(() => {
    const debiendo = this.debiendo_con_mora();
    const recibiendo = this.recibiendo();

    return debiendo - recibiendo <= 1 ? 0 : debiendo - recibiendo;
  });

  mora_general = computed(() => this.all_facturas().reduce((sum, item) => this.parseMonto(item.mora) + sum, 0));

  debiendo_con_mora = computed(() => {
    return Number(this.debiendo_sin_mora()) + Number(this.mora_general());
  });

  clienteClass = new ClienteC();
  reciboClass = new ReciboC();
  facturaClass = new FacturaC();

  htmlServ = inject(HtmlElementsService);
  location = inject(Location);
  moraSelectorService = inject(MoraSelectorService);
  dynamicModalServ = inject(DynamicModalService);
  tServ = inject(TablasService);
  router = inject(Router);

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'ingresos', is_routing: true });
    this.necesarioStart();
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  goBack() {
    this.location.back();
  }

  formatoNumero(num) {
    return fun.roundNumberToDecimal(num);
  }

  areAllSelected() {
    return this.all_facturas().every(factura => factura.select);
  }

  areAllSelectedPagoTotal() {
    return this.all_facturas().every(factura => factura.pagoT);
  }

  getIcon() {
    const allSelected = this.areAllSelected();
    return { icon: allSelected ? 'fa-check-square' : 'fa-square', tooltip: allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos' };
  }

  async pedirFacturasPorCliente(cliente_id, params?: { per_page?: number; page?: number; search?: string; factura_a_buscar?: any; order_by?: string }) {
    params = params ?? this.table_config.obj_paginate;
    const requestId = ++this.clienteBalanceRequestId;
    this.facturas.length = 0;
    this.resetBalances();

    try {
      const res = await this.clienteClass.getAll({ afterPath: `custom/get_balances/${cliente_id}`, parameters: this.getBalancesParams(params) });
      if (requestId !== this.clienteBalanceRequestId || this.clienteAdepositar()?.id != cliente_id) return;

      const facturasResponse = res.data?.facturas?.data ?? [];

      this.facturas = facturasResponse.map((factura: FacturasI) => this.mapFacturaPendiente(factura, params));
      this.all_facturas.set(fun.deepCloning(this.facturas));
      this.setBalances(res.data?.balances ?? {});
      this.syncResponsePage(res.data, params);
    } catch (error) {
      if (requestId !== this.clienteBalanceRequestId) return;
      fun.toastError('No se pudieron cargar las facturas del cliente', 'ERROR');
    }
  }

  getBalancesParams(params: { per_page?: number; page?: number; factura_a_buscar?: any; order_by?: string }) {
    const parameters: any = { page: params.page, per_page: params.per_page, paginado: false };
    if (fun.hasValue(params.factura_a_buscar)) parameters['factura_a_buscar'] = params.factura_a_buscar;
    if (fun.hasValue(params.order_by)) parameters['order_by'] = params.order_by;
    return parameters;
  }

  mapFacturaPendiente(factura: FacturasI, params: { factura_a_buscar?: any }) {
    const fechaA = moment().format('YYYY-MM-DD');
    let factura_selected = this.facturasSelected().find(fact => fact.id == factura.id);

    if (fun.hasValue(params.factura_a_buscar) && factura.id == params.factura_a_buscar) {
      factura_selected = factura;
      factura_selected.monto = '0.00';
      factura_selected.pagoT = false;
      this.verificateFacturasSelected(factura_selected, 'insert', factura_selected.monto);
    }

    factura.secuencia = _.padStart(factura.numero_factura, 8, '0');
    factura.fechaV = factura.condicion === 'Crédito' ? moment(factura.fecha_vencimiento).format('DD/MM/YYYY') : null;
    factura.select = fun.hasValue(factura_selected);
    factura.pagoT = fun.hasValue(factura_selected) ? factura_selected.pagoT : false;
    factura.pago_a_tiempo = factura.fecha_vencimiento ? factura.fecha_vencimiento > fechaA : true;
    factura.colorFecha = moment(factura.fecha_vencimiento).format('YYYY-MM-DD') < fechaA ? 'red' : 'black';
    factura.monto = fun.hasValue(factura_selected) ? fun.roundNumberToDecimal(factura_selected.monto) : '0.00';

    this.setFacturaMora(factura, factura_selected);
    this.setFacturaIcons(factura);

    return factura;
  }

  setFacturaMora(factura: FacturasI, factura_selected?: FacturasI) {
    const moraCalculator = new MoraCalculator(factura);

    factura.porcentaje_mora = factura_selected?.porcentaje_mora ?? this.porcentajeSelected;
    factura.mora = factura_selected?.mora ?? moraCalculator.getMora({ porcentaje: this.porcentajeSelected });
  }

  setFacturaIcons(factura: FacturasI) {
    const modalMoviemientos = (factura.pagos ?? []).length > 0 || (factura.notas ?? []).length > 0;

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
    };
  }

  setBalances(balances: any) {
    this.totalFacturado = this.parseMonto(balances.total_facturado);
    this.totalPagado = this.parseMonto(balances.abonado);
    this.totalNotasCredito = this.parseMonto(balances.notas_credito);
    this.totalNotasDebito = this.parseMonto(balances.notas_debito);
    this.debiendo_sin_mora.set(this.totalFacturado + this.totalNotasDebito - this.totalPagado - this.totalNotasCredito);

    const porcentajePagado = this.totalFacturado > 0 ? ((this.totalPagado + this.totalNotasCredito) / this.totalFacturado) * 100 : 0;
    this.totalPagadoPorciento = parseFloat(fun.roundNumberToDecimal(porcentajePagado));
  }

  resetBalances() {
    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalNotasCredito = 0;
    this.totalNotasDebito = 0;
    this.totalPagadoPorciento = 0;
  }

  syncResponsePage(data: any, params: { page?: number }) {
    fun.setTimeout(() => {
      if (data?.page == params.page) return;

      const pageToSet = data?.page && data.page > 0 ? data.page : 1;
      this.tServ.modifyPaginationById('listado_recibos', [{ page: pageToSet }]);
      this.tablaComponent?.reloadPagination();
    }, 100);
  }

  changeMoraGeneral(porcentaje: number) {
    this.porcentajeSelected = porcentaje;
    this.moraSelectorService.setPorcentajeMora(porcentaje);

    this.all_facturas.update(facts =>
      facts.map(fact => {
        const factura_tabla = this.facturas.find(item => fact.id == item.id);
        const moraCalculator = new MoraCalculator(fact);
        const new_mora = moraCalculator.getMora({ porcentaje: porcentaje });
        const new_monto = fact.select && fact.pagoT ? this.getMontoTotalFactura(fact.balance, new_mora) : fact.monto ?? '0.00';

        this.verificateFacturasSelected(fact, 'modify', new_monto, new_mora, porcentaje);
        if (fun.hasValue(factura_tabla)) {
          factura_tabla.porcentaje_mora = porcentaje;
          factura_tabla.mora = new_mora;
          factura_tabla.monto = new_monto;
        }

        return {
          ...fact,
          porcentaje_mora: porcentaje,
          mora: new_mora,
          monto: new_monto,
        };
      })
    );

    this.syncTablaFacturasCopy();
  }

  tablePaginatorChange(arg) {
    const temp = fun.deepCloning(this.facturas);
    this.facturas.length = 0;
    temp.forEach(item => {
      let factura_selected = this.facturasSelected().find(fact => fact.id == item.id);
      let factura_from_all = this.all_facturas().find(fact => fact.id == item.id);
      if (fun.hasValue(factura_selected)) item = factura_selected;

      item.porcentaje_mora = factura_selected?.porcentaje_mora || factura_from_all?.porcentaje_mora || this.porcentajeSelected;
      item.mora = factura_selected?.mora ?? factura_from_all?.mora ?? new MoraCalculator(item).getMora({ porcentaje: item.porcentaje_mora });
      item.pagoT = factura_selected?.pagoT || false;
      item.monto = fun.roundNumberToDecimal(fun.desformatearStNumber(item.monto));

      this.facturas.push(item);
    });
  }

  getDataFromMoraSelector(data: { key: MoraSelectorKeyI; value: string | number; factura_id: number }) {
    const index_factura_tabla = this.facturas.findIndex(fact => fact.id == data.factura_id);
    const item_tabla = this.facturas[index_factura_tabla];
    if (!item_tabla) return;

    if (data.key == MoraSelectorKeyI.mora) {
      item_tabla.mora = data.value;
    } else {
      item_tabla.porcentaje_mora = data.value;

      const moraCalculator = new MoraCalculator(item_tabla);
      item_tabla.mora = moraCalculator.getMora({ porcentaje: data.value });
    }

    if (item_tabla.select && item_tabla.pagoT) item_tabla.monto = this.getMontoTotalFactura(item_tabla.balance, item_tabla.mora);

    this.verificateFacturasSelected(item_tabla, 'modify', item_tabla.monto, item_tabla.mora, item_tabla.porcentaje_mora);
    this.all_facturas.update(facts => facts.map(fact => (fact.id == data.factura_id ? fun.deepCloning(item_tabla) : fact)));
  }

  async necesarioStart() {
    this.checkRoute();
  }

  async checkRoute() {
    const cliente_id = Number(this.cliente_id);
    const factura_id = Number(this.factura_id);

    if (cliente_id && factura_id) {
      const cliente_response = await this.clienteClass.getOne(cliente_id);

      this.processPropietarioModal({
        data: cliente_response.data,
        modalId: 'buscarCliente',
        factura_a_buscar: factura_id,
        type: modalCloseType.returnData,
      } as any);
    } else {
      fun.enfocarInput('clienteI');
    }
  }

  isOneFacturaWithMonto() {
    let valid = this.facturasSelected().some(factura => factura.select && this.parseMonto(factura.monto) > 0);

    if (valid) valid = !this.facturasSelected().some(factura => factura.select && this.isInvalidMonto(factura.monto));

    return valid;
  }

  cancelarIngreso() {
    this.clearClienteState();

    const clienteInput = document.getElementById('clienteI') as HTMLInputElement;
    if (clienteInput) clienteInput.value = '';

    this.router.navigateByUrl('/admin/recibos/ingresos/0/0');
    fun.setTimeout(() => fun.enfocarInput('clienteI'), 250);
  }

  abrirModalDinamicText(tipo: 'cancelar' | 'nuevo') {
    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: tipo == 'cancelar' ? `¿Seguro de que desea cancelar el <strong>Recibo de ingresos</strong>?` : `¿Seguro de que desea iniciar una nueva búsqueda para el <strong>Recibo de ingresos</strong>?`,
      btnKind: confirmationButtons.siNo,
      onYes: () => this.cancelarIngreso(),
    });
  }

  getCantidadArticulos() {
    return this.facturasSelected().length;
  }

  pedirNuevaData(params?: { per_page: number; page: number; search: string }) {
    if (fun.hasValue(this.clienteAdepositar())) {
      const order_by = this.tServ.parseSort(this.table_config);
      params = { ...params, ...order_by };
      this.pedirFacturasPorCliente(this.clienteAdepositar().id, params);
    } else {
      fun.toastWarning('Debe de seleccionar un cliente para continuar.', 'AVISO');
    }
  }

  resetVariables() {
    this.forma_pago = null;
    this.devuelta = null;
    this.detalleYtotal = undefined;
    this.facturasSelected.set([]);
    this.porcentajeSelected = 2;
    this.ExisteMontoMayor = false;
  }

  clearClienteState() {
    this.clienteBalanceRequestId++;
    this.facturas = [];
    this.facturasSelected.set([]);
    this.all_facturas.set([]);
    this.clienteAdepositar.set(null);
    this.debiendo_sin_mora.set(0);
    this.resetBalances();
    this.resetVariables();
    this.resetFacturasPagination();
  }

  resetFacturasPagination() {
    if (this.tServ.getPaginationById('listado_recibos')) {
      this.tServ.modifyPaginationById('listado_recibos', [
        { page: 1 },
        { page_front: 0 },
        { search: ' ' },
        { ant_page: null },
      ]);
    }

    this.table_config.obj_paginate = {
      ...this.table_config.obj_paginate,
      page: 1,
      page_front: 0,
      search: ' ',
      ant_page: null,
    } as any;
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'pedido') {
        if (params.data.is_viaje) {
          this.dynamicModalServ.confirmationModal({
            id: 'move_to_viajes',
            texto: '¿Seguro que desea dirigirse al modulo de viajes para modificar los datos del pedido?.',
            btnKind: confirmationButtons.siNo,
            onYes: () => {
              this.router.navigateByUrl(`/admin/recibos/viajes/${params.data.id}`);
            },
          });
        }
      }
      if (params.iconKey == 'historyPagos' && ((params.data.pagos ?? []).length || (params.data.notas ?? []).length)) {
        this.facturaClass.abrirModalHistorial(params.data.pagos, params.data.notas);
      }

      if (params.iconKey == 'ver') {
        this.facturaClass.parseDataToPdf(params.data).then(dataFactura => {
          let botonesDinamicos = [
            { clase: 'btn btn-gris', function: instance => this.verDetalles(params.data), label: 'Ver detalles', disable: false as any },
            { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false as any },
          ];

          const toPDFData = { data: dataFactura, type: 'facturacion' };

          const dataModal = { id: 'mostrarFacturaIngreso', header: 'MOSTRAR FACTURA', show_estado: false };

          this.facturaClass.handleMostrarFactura(toPDFData, dataModal, botonesDinamicos);
        });
      }
    }
  }

  verDetalles(data) {
    this.facturaClass.modalVerDetalles(data, 'recibo');
  }

  selectAll() {
    const allSelected = this.areAllSelected();
    const newSelected = !allSelected;

    this.facturas.forEach((fact, index) => {
      this.tableInputChange({ data: fact, key: 'select', value: newSelected, index });
    });

    this.all_facturas.update(facts =>
      facts.map(item => {
        const factura = this.getFacturaEnTabla(item.id);
        const modify = item.select !== newSelected;

        item.select = newSelected;
        item.pagoT = false;
        item.monto = '0.00';

        if (modify) {
          this.verificateFacturasSelected(factura ?? item, 'insert', item.monto);
        }

        return {
          ...item,
        };
      })
    );
  }

  selectAllPagoTotal() {
    const allSelected = this.areAllSelectedPagoTotal();
    const newPagoTotal = !allSelected;

    this.facturas.forEach((fact, index) => {
      fact.pagoT = newPagoTotal;
      this.tableInputChange({ data: fact, key: 'pagoT', value: newPagoTotal, index });
    });

    this.all_facturas.update(facts =>
      facts.map(item => {
        item.pagoT = newPagoTotal;

        const factura = this.getFacturaEnTabla(item.id);
        const new_monto = newPagoTotal ? this.getMontoTotalFactura(item.balance, item.mora) : '0.00';

        this.verificateFacturasSelected(factura ?? item, 'modify', new_monto, item.mora, item.porcentaje_mora);

        return {
          ...item,
          monto: new_monto,
        };
      })
    );
  }

  getFacturaEnTabla(facturaId: number) {
    return this.facturas.find(fact => fact.id == facturaId) ?? null;
  }

  syncTablaFacturasCopy() {
    if (!this.tablaComponent?.copyData) return;
    this.tablaComponent.copyData = [...this.all_facturas()];
  }

  verificateFacturasSelected(factura: FacturasI, method: 'insert' | 'modify', monto: number | string, mora?: number | string, porcentaje_mora?: number | string) {
    if (!factura) return;

    const factura_en_turno = this.facturasSelected().find(fact => fact.id == factura.id);

    if (method == 'insert') {
      if (fun.isEmpty(factura_en_turno)) {
        this.facturasSelected.update(facts => [...facts, factura]);
      } else {
        this.facturasSelected.update(facts => facts.filter(fact => fact.id != factura.id));
      }
    } else if (method == 'modify') {
      this.facturasSelected.update(facts =>
        facts.map(fact =>
          fact.id == factura.id
            ? {
                ...fact,
                pagoT: factura.pagoT,
                monto,
                mora: fun.hasValue(mora) ? mora : factura.mora,
                porcentaje_mora: fun.hasValue(porcentaje_mora) ? porcentaje_mora : factura.porcentaje_mora,
              }
            : fact
        )
      );
    }
  }

  tableInputBlur(params) {
    const factura_en_turno = this.facturasSelected().find(factura => factura.id == params.data.id);

    if (fun.hasValue(factura_en_turno)) {
      const total = factura_en_turno.balance;
      const monto = this.parseMonto(factura_en_turno.monto);
      const mora = this.parseMonto(factura_en_turno.mora);

      if (this.isInvalidMonto(factura_en_turno.monto)) {
        fun.toastWarning('Debe de introducir un Monto', 'AVISO');
        return;
      }

      const total_plus_mora = this.parseMonto(this.getMontoTotalFactura(total, mora));

      if (monto > total_plus_mora + 0.4) {
        this.ExisteMontoMayor = true;

        fun.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        fun.enfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
      }
    } else {
      fun.desEnfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
    }
  }

  tableInputChange(params) {
    const factura = this.facturas.find(fact => fact.id == params.data.id);
    if (!factura) return;

    let monto: number | string = this.parseMonto(params.value);

    switch (params.key) {
      case 'pagoT':
        monto = this.handlePagoTotalChange(factura, params);
        break;

      case 'monto':
        monto = this.handleMontoChange(factura, params);
        break;

      case 'select':
        monto = this.handleSelectChange(factura, params);
        break;
    }

    const action = params.key == 'select' ? 'insert' : 'modify';
    this.verificateFacturasSelected(factura, action, monto);

    this.all_facturas.update(facts => facts.map(item => (item.id == factura.id ? fun.deepCloning(factura) : item)));
  }

  handlePagoTotalChange(factura: FacturasI, params): string {
    const monto = this.getMontoTotalFactura(params.data.balance, params.data.mora);

    factura.pagoT = params.value;
    factura.monto = monto;
    this.resetMontoInput(params, monto);

    return monto;
  }

  handleMontoChange(factura: FacturasI, params): number | string {
    if (!factura.select || params.value == factura.monto) return this.parseMonto(params.value);

    if (this.isInvalidMonto(params.value)) fun.toastWarning('Debe de introducir un Monto', 'AVISO');

    const monto = this.parseMonto(params.value);
    const balance_plus_mora = this.parseMonto(this.getMontoTotalFactura(params.data.balance, params.data.mora));

    if (monto == balance_plus_mora) {
      if (params.newData) params.newData.pagoT = true;
      factura.pagoT = true;
    }

    if (monto > balance_plus_mora) {
      this.ExisteMontoMayor = true;
      fun.toastError('Monto no puede ser mayor al total de la factura', 'AVISO');
      fun.enfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
    } else {
      this.ExisteMontoMayor = false;
    }

    factura.monto = params.value;
    return monto;
  }

  handleSelectChange(factura: FacturasI, params): string {
    const monto = '0.00';

    factura.select = params.value;
    factura.monto = monto;
    if (!params.value) factura.pagoT = false;
    this.resetMontoInput(params, monto);

    return monto;
  }

  resetMontoInput(params, monto: string | number) {
    if (fun.hasValue(params.index)) this.tablaComponent.resetInput('monto', 'especificar', params.index, true, monto);
  }

  async abrirModalFiltro(nombre) {
    if (fun.hasValue(nombre)) {
      const propietarioModalConf = new DynamicModalClass();

      propietarioModalConf.id = 'buscarCliente';
      propietarioModalConf.inputs = { metodo: 'venta', palabra_a_buscar: nombre };
      propietarioModalConf.header = 'BUSCAR CLIENTE';
      propietarioModalConf.width = '57rem';
      propietarioModalConf.height = '32rem';
      propietarioModalConf.component = BuscarClienteSuplidorComponent;
      propietarioModalConf.closableEsc = true;
      propietarioModalConf.focusOnShow = false;
      propietarioModalConf.secondDetectChanges = false;
      propietarioModalConf.transitionOptions = '0ms';
      propietarioModalConf.setCallback(this.processPropietarioModal.bind(this));
      propietarioModalConf.show();

      (document.getElementById('clienteI') as HTMLInputElement)?.blur();
    }
  }

  processPropietarioModal(args: ICallbackModal) {
    const { data, type, factura_a_buscar = undefined } = args as any;

    if (type == modalCloseType.onHide && fun.isEmpty(this.clienteAdepositar())) {
      fun.enfocarInput('clienteI');
    }

    if (type == modalCloseType.returnData) {
      if (data?.tipo == 'data_no_found') {
        fun.enfocarAndSelectInput('clienteI');
      } else {
        this.clearClienteState();
        this.clienteAdepositar.set(data);
        (document.getElementById('clienteI') as any).value = data.nombre_completo;
        const parameters = { ...this.table_config.obj_paginate, page: 1, page_front: 0, search: ' ', factura_a_buscar: factura_a_buscar };
        this.pedirFacturasPorCliente(data.id, parameters);
      }
    }
  }

  formarDetalleRecibos() {
    return this.facturasSelected().reduce(
      (acc, fact) => {
        const detalle = this.getDetalleReciboFromFactura(fact);

        acc.detalle.push(detalle);
        acc.bruto += detalle.deposito;
        acc.mora += detalle.mora;
        acc.total_recibo += this.parseMonto(fact.monto);

        return acc;
      },
      { bruto: 0, mora: 0, total_recibo: 0, detalle: [] as any[] }
    );
  }

  getDetalleReciboFromFactura(fact: FacturasI) {
    const monto = Big(this.parseMonto(fact.monto));
    const mora = this.parseMonto(fact.mora);
    const mora_received = Math.min(monto.toNumber(), mora);
    const deposito = Math.max(0, monto.minus(mora_received).toNumber());

    return {
      cabecera_factura_id: fact.id,
      pago_total: fact.pagoT,
      deposito,
      mora: mora_received,
      descripcion: this.tipo_recibo === 'Pago factura' ? this.getDescripcionDetalle(fact) : '',
      pago_a_tiempo: fact.pago_a_tiempo,
    };
  }

  getDescripcionDetalle(fact: FacturasI) {
    return `${fact.pagoT ? 'Saldo' : 'Abono'} ${fact.numero_comprobante} ${moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')}`;
  }

  async confirmarIgreso() {
    if (this.isSubmitting) return;

    if (this.ExisteMontoMayor || this.hasMontoMayor()) {
      fun.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR');
    } else if (this.hasSelectedSinMonto()) {
      fun.toastError('Todas las facturas seleccionadas deben de tener un monto a pagar', 'ERROR');
    } else {
      this.detalleYtotal = await this.formarDetalleRecibos();
      this.openCantidadEfectivoModal();
    }
  }

  openCantidadEfectivoModal() {
    const cantidadEfectivoModalConfig = new DynamicModalClass();

    cantidadEfectivoModalConfig.id = 'cambioEfectivo';
    cantidadEfectivoModalConfig.inputs = { total_factura: this.detalleYtotal.total_recibo, metodo: tipoDocFacturacion.recibo_ingreso, formaPago: 'Efectivo' };
    cantidadEfectivoModalConfig.header = 'Cantidad de efectivo';
    cantidadEfectivoModalConfig.width = '35rem';
    cantidadEfectivoModalConfig.component = FormCantidadEfectivoComponent;
    cantidadEfectivoModalConfig.closableEsc = true;
    cantidadEfectivoModalConfig.botones = [
      { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
      { id: 'btnConfirmar', clase: 'btn btn-verde', functionInOtherComponent: 'btn_aceptar', label: 'Confirmar', disable: true },
    ];

    cantidadEfectivoModalConfig.setCallback(this.recibirCambiosEfectivo.bind(this));
    cantidadEfectivoModalConfig.show();
  }

  async recibirCambiosEfectivo(args: ICallbackModal) {
    if (args.type !== modalCloseType.returnData) return;

    const { is_print, obj } = args.data;

    this.devuelta = obj.devuelta;
    this.forma_pago = obj.forma_pago;
    this.is_print = is_print;

    await this.sendIngreso();
  }

  async sendIngreso() {
    if (this.isSubmitting) return;

    if (!this.clienteAdepositar() || !this.detalleYtotal?.detalle?.length) {
      fun.toastError('No hay datos suficientes para crear el recibo', 'ERROR');
      return;
    }

    this.isSubmitting = true;

    try {
      const res = await this.reciboClass.createUpdateOne(this.getReciboPayload());
      const recibo = res['data'].recibo;

      const actualPagination = this.tServ.getPaginationById('listado_recibos');
      await this.pedirFacturasPorCliente(this.clienteAdepositar().id, actualPagination);

      this.resetVariables();
      const recibo_parsed = await this.reciboClass.parseDataToPdf(recibo);
      const obj_print = { data: recibo_parsed, type: 'recibo_ingreso' };

      PdfService.generatePdf({ oPdf: obj_print, imprimir: this.is_print })
        .then(async res => {
          this.layServ.nextCheckCuadreToday(true);
        })
        .catch(() => {});
    } catch (error) {
      fun.toastError('No se pudo crear el recibo de ingreso', 'ERROR');
    } finally {
      this.isSubmitting = false;
    }
  }

  getReciboPayload() {
    return {
      cliente_id: this.clienteAdepositar().id,
      bruto: this.detalleYtotal.bruto,
      mora: this.detalleYtotal.mora,
      total: this.detalleYtotal.total_recibo,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: this.devuelta,
      numero_recibo: null,
      estado: true,
      detalle_recibos: this.detalleYtotal.detalle,
      balance_cliente: this.restando(),
    };
  }

  private parseMonto(value: any): number {
    const monto = fun.desformatearStNumber(value);
    return isNaN(monto) ? 0 : monto;
  }

  private getMontoTotalFactura(balance: any, mora: any): string {
    return fun.roundNumberToDecimal(Big(this.parseMonto(balance)).plus(this.parseMonto(mora)).toNumber());
  }

  private isInvalidMonto(value: any): boolean {
    const monto = fun.desformatearStNumber(value);
    return isNaN(monto) || fun.isEmpty(monto);
  }

  private hasSelectedSinMonto(): boolean {
    return this.facturasSelected().some(factura => factura.select && this.parseMonto(factura.monto) <= 0);
  }

  private hasMontoMayor(): boolean {
    return this.facturasSelected().some(factura => {
      if (!factura.select) return false;

      const monto = this.parseMonto(factura.monto);
      const total_plus_mora = this.parseMonto(this.getMontoTotalFactura(factura.balance, factura.mora));

      return monto > total_plus_mora + 0.4;
    });
  }
}
