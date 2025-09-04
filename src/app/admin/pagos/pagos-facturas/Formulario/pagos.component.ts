import { HtmlElementsService } from '@core/services/html-elements.service';
import { Ss } from '@core/services/singleton.service';
import { Component, OnInit, OnDestroy, inject, signal, computed, Input } from '@angular/core';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ReciboC } from '../../class/ingresos/recibos';
import { ClienteC } from '../../../registros/registro-clientes/cliente';
import { SuplidorC } from '../../../registros/registro-suplidores/suplidores';
import { FacturaC, FacturasI, tipoDocFacturacion } from '../../../facturacion/factura';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { FormCantidadEfectivoComponent } from '@components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { fun } from '../../../../core/services/functions.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { Router, ActivatedRoute } from '@angular/router';
import { PagosService } from '../pagos.service';
import { DocumentoDevuelta, TipoCantidadEfectivo } from '@components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.model';
import { PagoC } from '../../class/pagos/pagos';
import { tipoPagoE } from '../lista-pagos/pagos.config';
import { MoraSelectorComponent } from '../components/mora-selector/mora-selector.component';
import { Location } from '@angular/common';
import Big from 'big.js';
import { MoraSelectorKeyI, MoraSelectorService } from '../components/mora-selector/mora-selector.service';
import { MoraCalculator } from '../utils/mora-calculator';
import { DynamicModalClass } from '../../../../core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '../../../../core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '../../../../core/components/dynamic-modal/dynamic-modal.service';
const moment = require('../../../../core/javascript/moment');
import { DateUtils } from '@vjose1903/dateutils';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss'],
  standalone: false,
})
export class PagosComponent extends MixinClass implements OnInit, OnDestroy {
  static modalBuscarEntidadId = 'buscarEntidad';
  static tablaPagosId = 'listaPagos';

  @Input() tipo: string;
  @Input() entidad_id: string;
  @Input() factura_id: string;

  entidadAdepositar = signal<any>(null);
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
      { titulo: 'NCF', tipo: 'text', style: { width: '7rem' }, key: 'numero_comprobante' },
      { titulo: 'Fecha Fact.', alert_msg: 'Fecha de facturación de la factura', tipo: 'date', key: 'fecha_equivalente', sort: { key: 'fecha_equivalente', order: null }, style: { width: '9rem' } },
      { titulo: 'Fecha Venc.', alert_msg: 'Fecha de vencimiento de la factura', tipo: 'text', text_color: 'colorFecha', key: 'fechaV' },
      { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura' },
      { titulo: 'Balance factura', tipo: 'formatoNumero', key: 'balance' },
      { titulo: 'Mora', tipo: 'none', rowTransform: { component: (rowData: any) => MoraSelectorComponent, inputs: { key: 'mora', returnData: data => this.getDataFromMoraSelector.bind(this)(data) } } },
      {
        titulo: 'Seleccione',
        tipo: 'switch',
        key: 'select',
        select_all: false,
        style: { width: '5rem', padding: '0.6rem 0rem' },
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
    id_tabla: PagosComponent.tablaPagosId,
    padre_functions: { data_request: params => this.pedirNuevaData(params) },
    obj_paginate: { show: true, showTotal: false, page: 1, per_page: 20, per_page_options: [3, ...default_per_page], search: ' ', is_local: false },
  };

  tablaComponent;

  tipoFacturaId: number;
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
  totalRegistros: number;
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
  suplidorClass = new SuplidorC();
  reciboClass = new ReciboC();
  facturaClass = new FacturaC();
  pagoClass = new PagoC();

  htmlServ = inject(HtmlElementsService);
  location = inject(Location);
  moraSelectorService: MoraSelectorService = inject(MoraSelectorService);
  dynamicModalServ = inject(DynamicModalService);
  tServ: TablasService = inject(TablasService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  pagosService = inject(PagosService);
  layServ = Ss.layServ;

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'pagos', is_routing: true });
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

  async pedirPagosPorEntidad(entidad_id, params?: { per_page?: number; page?: number; search?: string; factura_a_buscar?: any; order_by?: string }) {
    this.facturas.length = 0;

    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalNotasCredito = 0;
    this.totalNotasDebito = 0;
    this.totalPagadoPorciento = 0;

    const fechaA = DateUtils.format({ dateFormat: 'YYYY-MM-DD' });
    const parameters = { page: params.page, per_page: params.per_page, paginado: true };

    if (fun.hasValue(params.factura_a_buscar)) parameters['factura_a_buscar'] = params.factura_a_buscar;

    if (fun.hasValue(params.order_by)) parameters['order_by'] = params.order_by;

    const classDinamic = this.pagosService.isReciboIngreso ? 'clienteClass' : 'suplidorClass';

    const res = await this[classDinamic].getAll({ afterPath: `custom/get_balances/${entidad_id}`, parameters: parameters });

    await res.data.facturas.data.map((factura: FacturasI, index) => {
      const fechaVencimiento = DateUtils.format({ date: factura.fecha_vencimiento, dateFormat: 'YYYY-MM-DD' });

      let factura_selected = this.facturasSelected().find(fact => fact.id == factura.id);

      if (fun.hasValue(params.factura_a_buscar) && factura.id == params.factura_a_buscar) {
        factura_selected = factura;
        factura_selected.monto = '0.00';
        factura_selected.pagoT = false;
        this.verificateFacturasSelected(factura_selected, 'insert', factura_selected.monto);
      }

      factura.secuencia = String(factura.numero_factura).padStart(8, '0');
      factura.fechaV = factura.condicion === 'Crédito' ? DateUtils.format({ date: factura.fecha_vencimiento, dateFormat: 'DD/MM/YYYY' }) : null;
      factura.select = fun.hasValue(factura_selected);
      factura.pagoT = fun.hasValue(factura_selected) ? factura_selected.pagoT : false;
      factura.pago_a_tiempo = factura.fecha_vencimiento ? fechaVencimiento > fechaA : true;
      factura.colorFecha = DateUtils.format({ date: factura.fecha_vencimiento, dateFormat: 'YYYY-MM-DD' }) < fechaA ? 'red' : 'black';
      factura.monto = fun.hasValue(factura_selected) ? fun.roundNumberToDecimal(factura_selected.monto) : '0.00';

      const moraCalculator = new MoraCalculator(factura);

      if (fun.hasValue(factura_selected)) {
        factura.porcentaje_mora = factura_selected.porcentaje_mora ?? this.porcentajeSelected;
        factura.mora = factura_selected.mora ?? moraCalculator.getMora({ porcentaje: this.porcentajeSelected });
      } else {
        factura.porcentaje_mora = this.porcentajeSelected;
        factura.mora = moraCalculator.getMora({ porcentaje: this.porcentajeSelected });
      }

      const modalMoviemientos = factura.recibos.length > 0 || factura.notas.length > 0 || factura.pagos.length > 0;

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

    setTimeout(() => {
      if (this.tablaComponent) {
        this.tablaComponent.changeTableConfig([{ total_count: res.data.facturas.total_registros }]);
        this.totalRegistros = res.data.facturas.total_registros;

        if (res.data.page != params.page) {
          // Validar que res.data.page sea válido antes de usarlo
          const pageToSet = res.data.page && res.data.page > 0 ? res.data.page : 1;

          this.tServ.modifyPaginationById(PagosComponent.tablaPagosId, [{ page: pageToSet }]);

          this.tablaComponent.reloadPagination();
        }
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
    // Los parámetros vienen automáticamente via withComponentInputBinding()
    const entidad_id = this.entidad_id == '0' ? null : Number(this.entidad_id);
    const factura_id = this.factura_id == '0' ? null : Number(this.factura_id);

    // Configurar el tipo de pago desde el input
    this.pagosService.tipoPago.set(this.tipo as tipoPagoE);
    this.tipoFacturaId = Ss.factServ.lista_tipos_facturas?.find(tipoFactura => tipoFactura.descripcion.toLowerCase() == this.pagosService.tipoPago())?.id;

    if (fun.hasValue(entidad_id)) {
      const classDinamic = this.pagosService.isReciboIngreso ? 'clienteClass' : 'suplidorClass';

      const entidad_response = await this[classDinamic].getOne(entidad_id);
      this.processPropietarioModal({
        data: entidad_response.data,
        factura_a_buscar: factura_id,
        type: modalCloseType.returnData,
      } as any);
    } else {
      fun.enfocarInput('entidadI');
    }
  }

  isOneFacturaWithMonto() {
    let valid = this.facturasSelected().some(factura => factura.select && fun.desformatearStNumber(factura.monto) > 0);

    if (valid) valid = !this.facturasSelected().some(factura => factura.select && (isNaN(fun.desformatearStNumber(factura.monto)) || fun.isEmpty(fun.desformatearStNumber(factura.monto))));

    return valid;
  }

  cancelarIngreso() {
    // Limpiar arrays y signals
    this.facturas = [];
    this.facturasSelected.set([]);
    this.all_facturas.set([]);

    // Resetear variables de estado
    this.entidadAdepositar.set(null);
    this.debiendo_sin_mora.set(0);

    // Limpiar input de la entidad
    const entidadInputId = this.pagosService.isReciboIngreso ? 'clienteI' : 'entidadI';
    const entidadInput = document.getElementById(entidadInputId) as HTMLInputElement;
    if (entidadInput) entidadInput.value = '';

    // Resetear variables adicionales
    this.resetVariables();

    // Navegar y enfocar input después de un breve delay
    if (this.pagosService.isReciboIngreso) {
      this.router.navigateByUrl('/admin/recibos/ingresos/0/0');
      fun.setTimeout(() => fun.enfocarInput('clienteI'), 250);
    } else {
      fun.setTimeout(() => fun.enfocarInput('entidadI'), 250);
    }
  }

  abrirModalDinamicText(tipo: 'cancelar' | 'nuevo') {
    const entidadTipo = this.pagosService.isReciboIngreso ? 'Recibo de ingresos' : 'Pago de facturas';
    const textoModal = tipo == 'cancelar' ? `¿Seguro de que desea cancelar el <strong>${entidadTipo}</strong>?` : `¿Seguro de que desea iniciar una nueva búsqueda para el <strong>${entidadTipo}</strong>?`;

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: textoModal,
      btnKind: confirmationButtons.siNo,
      onYes: () => this.cancelarIngreso(),
    });
  }

  getCantidadArticulos() {
    return this.facturasSelected().length;
  }

  pedirNuevaData(params?: { per_page?: number; page?: number; search?: string }) {
    if (fun.hasValue(this.entidadAdepositar())) {
      const order_by = this.tServ.parseSort(this.table_config);
      params = { ...params, ...order_by };
      this.pedirPagosPorEntidad(this.entidadAdepositar().id, params);
    } else {
      fun.toastWarning(`Debe de seleccionar un ${this.pagosService.isReciboIngreso ? 'cliente' : 'suplidor'} para continuar.`, 'AVISO');
    }
  }

  resetVariables() {
    this.forma_pago = null;
    this.devuelta = null;
    this.detalleYtotal = undefined;
    this.facturasSelected.set([]);
    this.porcentajeSelected = 2;
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
      if (params.iconKey == 'historyPagos' && (params.data.pagos.length || params.data.notas.length || params.data.recibos.length)) {
        const config = {};
        const configKey = this.pagosService.isReciboIngreso ? 'showPagos' : 'showRecibos';
        config[configKey] = false;

        this.facturaClass.abrirModalHistorial({ pagos: params.data.pagos, notas: params.data.notas, recibos: params.data.recibos, config });
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

    // Actualizar facturas en la tabla actual
    this.facturas.forEach((fact, index) => {
      if (allSelected) {
        if (fact.select) {
          this.facturas[index].pagoT = false;
          this.facturas[index].select = false;
          this.facturas[index].monto = '0.00';
          this.tablaComponent.resetInput('monto', 'especificar', index, true, '0.00');
        }
      } else {
        if (!fact.select) this.facturas[index].select = true;
      }
      this.verificateFacturasSelected(fact, 'insert', !allSelected ? fact.monto : '0.00');
    });

    // Actualizar todas las facturas
    this.all_facturas.update(facts =>
      facts.map(item => {
        // Determinar si se debe modificar
        const modify = allSelected ? item.select : !item.select;

        // Actualizar selección si es necesario
        if (modify) {
          this.verificateFacturasSelected(item, 'insert', item.monto);
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
      const entidadModalConf = new DynamicModalClass();

      entidadModalConf.id = PagosComponent.modalBuscarEntidadId;
      entidadModalConf.inputs = {
        metodo: this.pagosService.isReciboIngreso ? tipoDocFacturacion.venta : tipoDocFacturacion.compra,
        palabra_a_buscar: nombre,
      };
      entidadModalConf.header = this.pagosService.isReciboIngreso ? 'BUSCAR CLIENTE' : 'BUSCAR SUPLIDOR';
      entidadModalConf.width = '57rem';
      entidadModalConf.height = '32rem';
      entidadModalConf.component = BuscarClienteSuplidorComponent;
      entidadModalConf.closableEsc = true;
      entidadModalConf.setCallback(this.processPropietarioModal.bind(this));
      entidadModalConf.show();

      fun.desEnfocarInput('entidadI');
    }
  }

  // Método para procesar el modal de selección de entidad (híbrido)
  processPropietarioModal(args: ICallbackModal) {
    const { data, type, factura_a_buscar = undefined } = args as any;

    if (type == modalCloseType.onHide && fun.isEmpty(this.entidadAdepositar())) {
      const inputId = this.pagosService.isReciboIngreso ? 'clienteI' : 'entidadI';
      fun.enfocarInput(inputId);
    }

    if (type == modalCloseType.returnData) {
      if (data?.tipo == 'data_no_found') {
        const inputId = this.pagosService.isReciboIngreso ? 'clienteI' : 'entidadI';
        fun.enfocarAndSelectInput(inputId);
      } else {
        this.entidadAdepositar.set(data);
        const inputId = this.pagosService.isReciboIngreso ? 'clienteI' : 'entidadI';
        (document.getElementById(inputId) as any).value = data.nombre_completo;
        const parameters = { ...this.table_config.obj_paginate, factura_a_buscar: factura_a_buscar };
        this.pedirPagosPorEntidad(data.id, parameters);
      }
    }
  }

  // Método híbrido para formar detalles de pagos/recibos
  formarDetallePagos() {
    if (this.pagosService.isReciboIngreso) {
      // Lógica para recibos de ingreso con mora
      const formatFechaFactura = fact => `${fact.pagoT ? 'Saldo' : 'Abono'} ${fact.numero_comprobante} ${DateUtils.format({ date: fact.fecha_equivalente, dateFormat: 'YYYY-MM-DD', hourFormat: 'HH:mm:ss' })}`;

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
    } else {
      // Lógica para pagos de facturas (sin mora)
      const temp = [];
      let total = 0;

      for (let i = 0; i < this.facturasSelected().length; i++) {
        const fact = this.facturasSelected()[i];

        temp.push({
          cabecera_factura_id: fact.id,
          pago_total: fact.pagoT,
          deposito: fun.desformatearStNumber(fact.monto),
          descripcion:
            this.tipo_recibo === 'Pago factura'
              ? fact.pagoT
                ? 'Saldo ' + fact.numero_comprobante + ' ' + DateUtils.format({ date: fact.fecha_equivalente, dateFormat: 'YYYY-MM-DD', hourFormat: 'HH:mm:ss' })
                : 'Abono ' + fact.numero_comprobante + ' ' + DateUtils.format({ date: fact.fecha_equivalente, dateFormat: 'YYYY-MM-DD', hourFormat: 'HH:mm:ss' })
              : '',
          pago_a_tiempo: fact.pago_a_tiempo,
        });

        total += fun.desformatearStNumber(fact.monto);
      }

      return { total_recibo: total, detalle: temp };
    }
  }

  async confirmarPago() {
    if (this.ExisteMontoMayor) {
      fun.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR');
    } else if (this.facturasSelected().some(factura => factura.monto == 0)) {
      fun.toastError('Todas las facturas seleccionadas deben de tener un monto a pagar', 'ERROR');
    } else {
      this.detalleYtotal = await this.formarDetallePagos();

      const tipo_modal = this.pagosService.isReciboIngreso ? TipoCantidadEfectivo.devuelta : TipoCantidadEfectivo.noDevuelta;
      const documento = this.pagosService.isReciboIngreso ? DocumentoDevuelta.reciboIngreso : DocumentoDevuelta.pagoFactura;

      const inputs = { total_factura: this.detalleYtotal.total_recibo, devuelta: 0, documento: documento, tipo_modal: tipo_modal, formaPago: 'Efectivo' };

      const cantidadEfectivoModalConfig = new DynamicModalClass();

      cantidadEfectivoModalConfig.id = 'cambioEfectivo_IngresosComponent';
      cantidadEfectivoModalConfig.inputs = inputs;
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
  }

  async recibirCambiosEfectivo(args: ICallbackModal) {
    if (args.type !== modalCloseType.returnData) return;

    const { is_print, obj } = args.data;

    // Actualizar propiedades del componente
    this.devuelta = obj.devuelta;
    this.forma_pago = obj.forma_pago;
    this.is_print = is_print;

    // Enviar a base de datos
    this.sendPago();
  }

  async sendPago() {
    const obj: any = {
      total: this.detalleYtotal.total_recibo,
      forma_pago: this.forma_pago,
      tipo_factura_id: this.tipoFacturaId,
      devuelta: this.devuelta,
      estado: true,
    };

    // Configuración híbrida según el tipo de pago
    if (this.pagosService.isReciboIngreso) {
      obj.cliente_id = this.entidadAdepositar().id;
      obj.bruto = this.detalleYtotal.bruto || 0;
      obj.mora = this.detalleYtotal.mora || 0;
      obj.detalle_recibos = this.detalleYtotal.detalle;
      obj.balance_cliente = this.restando();
    } else {
      obj.suplidor_id = this.entidadAdepositar().id;
      obj.pago_factura_detalles = this.detalleYtotal.detalle;
    }

    const classToQuery = { [tipoPagoE.recibosIngresos]: this.reciboClass, [tipoPagoE.pagosFacturas]: this.pagoClass };

    classToQuery[this.pagosService.tipoPago()].createUpdateOne(obj).then(res => {
      const pago = this.pagosService.isReciboIngreso ? res['data'].recibo : res['data'];

      const actualPagination = this.tServ.getPaginationById(PagosComponent.tablaPagosId);
      this.pedirPagosPorEntidad(this.entidadAdepositar().id, actualPagination);

      this.resetVariables();
      classToQuery[this.pagosService.tipoPago()].parseDataToPdf(pago).then(recibo_parsed => {
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
