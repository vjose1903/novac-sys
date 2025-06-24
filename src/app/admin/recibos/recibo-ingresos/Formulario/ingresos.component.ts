import { HtmlElementsService } from '@core/services/html-elements.service';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import * as _ from 'lodash';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { ReciboC } from '../../recibos';
import { FacturaC, FacturasI } from '../../../facturacion/factura';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { FormCantidadEfectivoComponent } from '@components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { ModalClass } from '@components/modal/modal-class';
import { Router, ActivatedRoute } from '@angular/router';
import { MoraSelectorComponent } from '../components/mora-selector/mora-selector.component';
import { Location } from '@angular/common';
import Big from 'big.js';
import { MoraSelectorKeyI, MoraSelectorService } from '../components/mora-selector/mora-selector.service';
import { MoraCalculator } from '../utils/mora-calculator';
import { Ss } from '@core/services/singleton.service';
const moment = require('../../../../core/javascript/moment');

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: false,
})
export class IngresosComponent extends MixinClass implements OnInit, OnDestroy {
  clienteAdepositar: any;
  all_facturas = signal<FacturasI[]>([]);
  facturas = [];
  tipo_recibo = 'Pago factura';
  is_print = false;
  // =============================================
  //  TABLAS
  // =============================================

  table_config: table_config = {
    track_key: 'id',
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

  tipoFacturas;
  precioEnTurno: any;
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
      if (fun.hasValue(item.monto) && !isNaN(fun.desformatearStNumber(item.monto))) sum += fun.desformatearStNumber(item.monto);
      return sum;
    }, 0);
  });

  restando = computed(() => {
    const debiendo = this.debiendo_con_mora();
    const recibiendo = this.recibiendo();

    return debiendo - recibiendo <= 1 ? 0 : debiendo - recibiendo;
  });

  mora_general = computed(() => this.all_facturas().reduce((sum, item) => fun.desformatearStNumber(item.mora) + sum, 0));

  debiendo_con_mora = computed(() => {
    return Number(this.debiendo_sin_mora()) + Number(this.mora_general());
  });

  clienteClass = new ClienteC();
  reciboClass = new ReciboC();
  facturaClass = new FacturaC();

  htmlServ = inject(HtmlElementsService);
  location = inject(Location);
  moraSelectorService = inject(MoraSelectorService);

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
    this.facturas.length = 0;

    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalNotasCredito = 0;
    this.totalNotasDebito = 0;
    this.totalPagadoPorciento = 0;

    const fechaA = moment().format('YYYY-MM-DD');
    const parameters = { page: params.page, per_page: params.per_page, paginado: false };

    if (fun.hasValue(params.factura_a_buscar)) parameters['factura_a_buscar'] = params.factura_a_buscar;

    if (fun.hasValue(params.order_by)) parameters['order_by'] = params.order_by;

    const res = await this.clienteClass.getAll({ afterPath: `custom/get_balances/${cliente_id}`, parameters: parameters });

    await res.data.facturas.data.map((factura: FacturasI, index) => {
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
      factura.pago_a_tiempo = factura.fecha_vencimiento ? (factura.fecha_vencimiento > fechaA ? true : false) : true;
      factura.colorFecha = moment(factura.fecha_vencimiento).format('YYYY-MM-DD') < fechaA ? 'red' : 'black';
      factura.monto = fun.hasValue(factura_selected) ? fun.roundNumberToDecimal(factura_selected.monto) : '0.00';

      const moraCalculator = new MoraCalculator(factura);

      if (fun.hasValue(factura_selected)) {
        factura.porcentaje_mora = factura_selected.porcentaje_mora ?? this.porcentajeSelected;
        factura.mora = factura_selected.mora ?? moraCalculator.getMora({ porcentaje: this.porcentajeSelected });
      } else {
        factura.porcentaje_mora = this.porcentajeSelected;
        factura.mora = moraCalculator.getMora({ porcentaje: this.porcentajeSelected });
      }

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
      };

      this.facturas.push(factura);

      return factura;
    });

    this.all_facturas.set(fun.deepCloning(this.facturas));

    this.totalFacturado = res.data.balances.total_facturado;

    this.totalPagado = res.data.balances.abonado;
    this.totalNotasCredito = res.data.balances.notas_credito;
    this.totalNotasDebito = res.data.balances.notas_debito;

    this.debiendo_sin_mora.set(this.totalFacturado + this.totalNotasDebito - this.totalPagado - this.totalNotasCredito);

    this.totalPagadoPorciento = ((this.totalPagado + this.totalNotasCredito) / this.totalFacturado) * 100;
    this.totalPagadoPorciento = parseFloat(fun.roundNumberToDecimal(this.totalPagadoPorciento));

    fun.setTimeout(() => {
      if (res.data.page != params.page) {
        this.tServ.modifyPaginationById('listado_recibos', [{ page: res.data.page }]);
        this.tablaComponent.reloadPagination();
      }
    }, 100);
  }

  changeMoraGeneral(porcentaje: number) {
    this.moraSelectorService.setPorcentajeMora(porcentaje);

    this.all_facturas.update(facts =>
      facts.map(fact => {
        // Buscar si la factura existe en la tabla actual (mantiene la lógica original)
        const factura_tabla = this.facturas.find(item => fact.id == item.id);

        // Crea calculador y obtiene la nueva mora
        const moraCalculator = new MoraCalculator(fact);
        const new_mora = moraCalculator.getMora({ porcentaje: porcentaje }); // Mantiene formato original

        // Calcula el nuevo monto total con doble formateo como en el original
        const new_monto = fun.roundNumberToDecimal(Big(fun.desformatearStNumber(fact.balance)).plus(fun.desformatearStNumber(new_mora)).toNumber());

        // Actualiza la selección de facturas con doble formateo como en el original
        this.verificateFacturasSelected(fact, 'modify', new_monto, new_mora, porcentaje);
        if (fun.hasValue(factura_tabla)) {
          factura_tabla.porcentaje_mora = porcentaje;
          factura_tabla.mora = new_mora;
          factura_tabla.monto = new_monto;
        }

        // Retorna la factura actualizada con los nuevos valores
        return {
          ...fact,
          porcentaje_mora: porcentaje,
          mora: new_mora,
          monto: new_monto,
        };
      })
    );
  }

  tablePaginatorChange(arg) {
    const temp = fun.deepCloning(this.facturas);
    this.facturas.length = 0;
    temp.forEach(item => {
      let factura_selected = this.facturasSelected().find(fact => fact.id == item.id);
      let factura_from_all = this.all_facturas().find(fact => fact.id == item.id);
      if (fun.hasValue(factura_selected)) item = factura_selected;

      item.porcentaje_mora = factura_selected?.porcentaje_mora || factura_from_all?.porcentaje_mora || this.porcentajeSelected;
      item.pagoT = factura_selected?.pagoT || false;
      item.monto = fun.roundNumberToDecimal(fun.desformatearStNumber(item.monto));

      this.facturas.push(item);
    });
  }

  getDataFromMoraSelector(data: { key: MoraSelectorKeyI; value: string | number; factura_id: number }) {
    // Encontrar la factura en la tabla (mantiene la lógica original)
    const index_factura_tabla = this.facturas.findIndex(fact => fact.id == data.factura_id);
    const item_tabla = this.facturas[index_factura_tabla];

    if (data.key == MoraSelectorKeyI.mora) {
      // Si es actualización de mora directa
      item_tabla.mora = data.value;

      // Actualizar monto si aplica
      if (item_tabla.select && item_tabla.pagoT) {
        item_tabla.monto = fun.roundNumberToDecimal(Big(fun.desformatearStNumber(item_tabla.balance)).plus(fun.desformatearStNumber(item_tabla.mora)).toNumber());
      }

      // Actualizar selección
      this.verificateFacturasSelected(item_tabla, 'modify', item_tabla.monto, item_tabla.mora);
    } else {
      // Si es actualización de porcentaje
      item_tabla.porcentaje_mora = data.value;

      // Recalcular mora
      const moraCalculator = new MoraCalculator(item_tabla);
      item_tabla.mora = moraCalculator.getMora({ porcentaje: data.value });

      // Actualizar monto si aplica
      if (item_tabla.select && item_tabla.pagoT) {
        item_tabla.monto = fun.roundNumberToDecimal(Big(fun.desformatearStNumber(item_tabla.balance)).plus(fun.desformatearStNumber(item_tabla.mora)).toNumber());
      }

      // Actualizar selección
      this.verificateFacturasSelected(item_tabla, 'modify', item_tabla.monto, item_tabla.mora, data.value);
    }

    // Actualizar listado completo de facturas
    this.all_facturas.update(facts => facts.map(fact => (fact.id == data.factura_id ? fun.deepCloning(item_tabla) : fact)));
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
    let valid = this.facturasSelected().some(factura => factura.select && fun.desformatearStNumber(factura.monto) > 0);

    if (valid) valid = !this.facturasSelected().some(factura => factura.select && (isNaN(fun.desformatearStNumber(factura.monto)) || fun.isEmpty(fun.desformatearStNumber(factura.monto))));

    return valid;
  }

  cancelarIgreso() {
    this.facturas.length = 0;
    this.facturasSelected.set([]);
    this.clienteAdepositar = undefined;
    this.debiendo_sin_mora.set(0);
    this.all_facturas.set([]);
    (document.getElementById('clienteI') as any).value = null;

    this.resetVariables();

    fun.setTimeout(() => fun.enfocarInput('clienteI'), 250);
    this.router.navigateByUrl('/admin/recibos/ingresos/0/0');
  }

  abrirModalDinamicText(tipo) {
    const obj = {
      id: 'cancelar_ingreso',
      header: 'Confirmación',
      texto: '¿Seguro de que desea cancelar la operacion?.',
      siFunction: instance => {
        this.cancelarIgreso();
        instance.closeModal(instance.id);
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
        const parameters = { ...this.table_config.obj_paginate, factura_a_buscar: arg?.factura_a_buscar };
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
              instance.closeModal(instance.id);
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
            { clase: 'btn btn-blanco', function: instance => instance.closeModal(instance.id), label: 'Cerrar', disable: false as any },
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

    // Actualizar facturas en la tabla actual
    this.facturas.forEach((fact, index) => {
      this.tableInputChange({ data: fact, key: 'select', value: !allSelected, index });
    });

    // Actualizar todas las facturas
    this.all_facturas.update(facts =>
      facts.map(item => {
        // Buscar factura en tabla actual
        const factura_index = this.facturas.findIndex(fact => fact.id == item.id);
        const factura = factura_index >= 0 ? this.facturas[factura_index] : null;

        // Determinar si se debe modificar
        const modify = allSelected ? item.select : !item.select;

        // Estado nuevo
        item.select = !allSelected;

        // Actualizar selección si es necesario
        if (modify) {
          this.verificateFacturasSelected(factura ?? item, 'insert', factura_index, item.monto);
        }

        // Retornar ítem actualizado
        return {
          ...item,
          select: !allSelected,
          monto: '0.00',
          pagoT: false,
        };
      })
    );
  }

  selectAllPagoTotal() {
    const allSelected = this.areAllSelectedPagoTotal();

    // Actualizar facturas en la tabla
    this.facturas.forEach((fact, index) => {
      fact.pagoT = !allSelected;
      this.tableInputChange({ data: fact, key: 'pagoT', value: !allSelected, index });
    });

    // Actualizar todas las facturas
    this.all_facturas.update(facts =>
      facts.map(item => {
        // Actualizar estado de pago total
        item.pagoT = !allSelected;

        // Buscar factura en tabla actual
        const factura_index = this.facturas.findIndex(fact => fact.id == item.id);
        const factura = factura_index >= 0 ? this.facturas[factura_index] : null;

        // Calcular nuevo monto
        const balance = fun.desformatearStNumber(item.balance);
        const mora = fun.desformatearStNumber(item.mora);
        const new_monto = fun.roundNumberToDecimal(Big(balance).plus(mora).toNumber());

        // Actualizar selección
        this.verificateFacturasSelected(factura ?? item, 'modify', new_monto);

        // Retornar ítem actualizado
        return {
          ...item,
          monto: new_monto,
        };
      })
    );
  }

  verificateFacturasSelected(factura: FacturasI, method: 'insert' | 'modify', monto: number | string, mora?: number | string, porcentaje_mora?: number | string) {
    // Validación inicial
    const factura_en_turno = factura ? this.facturasSelected().find(fact => fact.id == factura?.id) : undefined;

    if (method == 'insert') {
      // Modo inserción
      if (fun.isEmpty(factura_en_turno)) {
        // Añadir si no existe
        this.facturasSelected.update(facts => [...facts, factura]);
      } else {
        // Eliminar si existe
        this.facturasSelected.update(facts => facts.filter(fact => fact.id != factura.id));
      }
    } else if (method == 'modify') {
      // Modo modificación
      this.facturasSelected.update(facts =>
        facts.map(fact => {
          if (fact.id == factura.id) {
            // Determinar valores a usar
            const new_mora = fun.hasValue(mora) ? mora : factura.mora;
            const new_porcentaje_mora = fun.hasValue(porcentaje_mora) ? porcentaje_mora : factura.porcentaje_mora;

            // Retornar factura actualizada
            return {
              ...fact,
              pagoT: factura.pagoT,
              monto: monto,
              mora: new_mora,
              porcentaje_mora: new_porcentaje_mora,
            };
          } else {
            return fact;
          }
        })
      );
    }
  }

  tableInputBlur(params) {
    const factura_en_turno = this.facturasSelected().find(factura => factura.id == params.data.id);

    if (fun.hasValue(factura_en_turno)) {
      const total = factura_en_turno.balance;
      const monto = fun.desformatearStNumber(factura_en_turno.monto);
      const mora = fun.desformatearStNumber(factura_en_turno.mora);

      if (isNaN(monto) || fun.isEmpty(monto)) {
        fun.toastWarning('Debe de introducir un Monto', 'AVISO');
        return;
      }

      const total_plus_mora = fun.desformatearStNumber(fun.roundNumberToDecimal(Big(total).plus(mora).toNumber()));

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

    const balance = fun.desformatearStNumber(params.data.balance);
    const mora = fun.desformatearStNumber(params.data.mora);
    let monto = fun.desformatearStNumber(params.value);
    const balance_plus_mora = fun.desformatearStNumber(fun.roundNumberToDecimal(Big(balance).plus(mora).toNumber()));

    if (params.key == 'pagoT') {
      monto = fun.roundNumberToDecimal(balance_plus_mora);

      factura.pagoT = params.value;
      if (fun.hasValue(params.index)) this.tablaComponent.resetInput('monto', 'especificar', params.index, true, monto);
    }

    if (params.key == 'monto' && params.value != factura.monto) {
      if (factura.select) {
        if (fun.isEmpty(params.value)) {
          fun.toastWarning('Debe de introducir un Monto', 'AVISO');
        }

        if (monto == balance_plus_mora) [params.newData.pagoT, factura.pagoT] = Array(2).fill(true);

        if (monto > balance_plus_mora) {
          this.ExisteMontoMayor = true;

          fun.toastError('Monto no puede ser mayor al total de la factura', 'AVISO');
          fun.enfocarInput(`input-${params.id_tabla}-monto-${params.index}`);
        } else {
          this.ExisteMontoMayor = false;
        }
      }
    }

    if (params.key == 'select') {
      if (!params.value) {
        factura.pagoT = false;
        monto = '0.00';
        if (fun.hasValue(params.index)) this.tablaComponent.resetInput('monto', 'especificar', params.index, true, monto);
      }

      factura.select = params.value;
    }

    this.all_facturas.update(facts =>
      facts.map(item => {
        if (item.id == factura.id) {
          item = fun.deepCloning(factura);

          const action = params.key == 'select' ? 'insert' : 'modify';

          this.verificateFacturasSelected(factura, action, monto);
        }

        return item;
      })
    );
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
    const formatFechaFactura = fact => `${fact.pagoT ? 'Saldo' : 'Abono'} ${fact.numero_comprobante} ${moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')}`;

    return this.facturasSelected().reduce(
      (acc, fact) => {
        const monto = Big(fun.desformatearStNumber(fact.monto));
        const mora = fun.desformatearStNumber(fact.mora);

        // Calcula la mora recibida y el depósito
        const mora_received = Math.min(monto.toNumber(), mora);
        const deposito = Math.max(0, monto.minus(mora_received).toNumber());

        acc.detalle.push({
          cabecera_factura_id: fact.id,
          pago_total: fact.pagoT,
          deposito,
          mora: mora_received,
          descripcion: this.tipo_recibo === 'Pago factura' ? formatFechaFactura(fact) : '',
          pago_a_tiempo: fact.pago_a_tiempo,
        });

        // Actualiza los totales
        acc.bruto += deposito;
        acc.mora += mora_received;
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
      balance_cliente: this.restando(),
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
