import { HtmlElementsService } from '@core/services/html-elements.service';
import { actionFacturacion, deleteDocumentosTypes, FacturasI, request_factura_campo, tipoDocFacturacion, tipoDocFacturacionLabel } from './../../facturacion/factura';
import { Ss } from '@core/services/singleton.service';
import { serie, seriesDgiiI } from '@core/typescript/constantes';
import { Component, OnDestroy, inject, OnChanges, SimpleChanges, Input, computed, signal, effect, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { ArticuloC } from '@registros/articulos/articulo';
import { FacturaC, TiposFacturaC } from '../../facturacion/factura';
import { NcfC } from '@registros/ncf/ncf';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { NotaC } from '../notas-cred-deb/notas';
import { fun } from '@core/services/functions.service';
import { Permisos } from '@core/typescript/permisos';
import { default_per_page, table_config, tableCellType } from '@components/new_tablas/tabla-class';
import { BuscarFacturaC, shearchDocumentTableId } from './buscar-factura';
import { TitleCasePipe } from '@angular/common';
import { seriesDGII } from '@core/typescript/constantes';
import { Environment } from '@environments/environment';

import * as _ from 'lodash';
import { ConfigI } from '@core/interface/config-interface';
import { DateUtils } from '@vjose1903/dateutils';
import { confirmationButtons, IButtonDynamic, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
const moment = require('../../../core/javascript/moment');

@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
  standalone: false,
})
export class BuscarFacturaComponent extends MixinClass implements OnInit, OnChanges, OnDestroy {
  @Input() buscarPara: any;
  facturas = [];

  facturaSelected: any;
  para: string;

  noExistenComprobantes = false;
  paqueteComprobante: any;
  tipo_factura_id = null;
  valor_a_buscar: any = null;

  notasClass = new NotaC();
  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  tiposFacturasClass = new TiposFacturaC();
  ncfClass = new NcfC();
  configApp: ConfigI;

  notas: any = [];
  notaSelected: string;
  showSide: boolean = false;
  TablasComponent;
  permissions = Permisos;

  tipos_documentos = [];
  tipo_documento_selected = signal<tipoDocFacturacion>(tipoDocFacturacion.venta);

  buscar_por = null;

  campos = {
    cliente: request_factura_campo.cliente_id,
    numeroComprobante: request_factura_campo.numero_comprobante,
    numeroFactura: request_factura_campo.numero_factura,
    ultimas50: request_factura_campo.last_50,
    suplidor: request_factura_campo.suplidor_id,
  };

  facturasSerieOptions: seriesDgiiI[] = [];
  serieSelected = signal<serie>(serie.all);

  notasSerieOptions: seriesDgiiI[] = seriesDGII({ includeAll: true });
  notaSerieSelected = signal<serie>(serie.all);

  makeNotasSerieOptions: seriesDgiiI[] = seriesDGII({ includeAll: false });
  makeNotaSerieSelected = signal<serie>(serie.electronica);

  fun = fun;
  serie = serie;

  comprobantes_masks = {
    [serie.normal]: { mask: 'B9999999999', placeholder: 'B__________' },
    [serie.electronica]: { mask: 'E999999999999', placeholder: 'E____________' },
    [serie.no]: { mask: ' ', placeholder: ' ' },
  };

  comprobante_mask_selected = computed(() => this.comprobantes_masks[this.serieSelected()]);

  table_config;

  tablaComponent;

  table_notas_config: table_config = {
    info: [
      { titulo: '1', tipo: tableCellType.icon, key: 'estado', style: { width: '2rem', color: 'var(--transparente00)' }, iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
      { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente' },
      { titulo: 'Comprobante', tipo: tableCellType.text, key: 'numero_comprobante' },
      { titulo: 'Total nota', tipo: tableCellType.formatoNumero, key: 'total' },
      { titulo: 'Acciones', tipo: tableCellType.icon, key: 'actions', iconsArray: [{ key: 'view', tooltip: 'Ver Nota', text_color: 'viewColor' }], style: { width: '5rem' } },
    ],
    colores: true,
    filtrar: { local: false },
    id_tabla: 'lista_notas',
    padre_functions: { data_request: params => this.pedirNotas(params) },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
  };

  tablaNotasComponent;
  hasPermisoPreVenta: boolean = false;
  hasPermisoCotizacion: boolean = false;

  htmlServ = inject(HtmlElementsService);
  router = inject(Router);
  tServ = inject(TablasService);
  dynamicModalServ = inject(DynamicModalService);

  certificacionDate = Environment.DGII_CERTIFICATION_DATE;

  constructor() {
    super();

    effect(() => {
      if (this.serieSelected() && this.buscar_por == request_factura_campo.last_50) this.loadFacturasChangingSerie();
    });
  }

  ngOnInit(): void {
    this.configApp = Ss.configServ.config;
    this.makeNotaSerieSelected.set(this.configApp.serie_default);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._init_mixin({ component: 'buscar_factura', is_routing: true });

    this.necesarioStart();
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    this.borrar('salir');
  }

  necesarioStart() {
    this.borrar();
    this.verificatePermisos().then(async res => {
      this.selectTableConfig().then(() => this.tServ.initPagination(shearchDocumentTableId, this.table_config.obj_paginate));
      this.completarTituloPag();

      fun.enfocarInput(this.buscarPara === 'solo_ver' ? 'tipoI' : 'buscarPorI');
    });

    this.getSeriesOptions();
  }

  getSeriesOptions(includeAll: boolean = true) {
    this.facturasSerieOptions = seriesDGII({ includeAll });
  }

  verificatePermisos() {
    return new Promise<any>((resolve, reject) => {
      const promomiseList = <any>[];

      promomiseList.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.pre_venta)));
      promomiseList.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.cotizacion)));

      Promise.all(promomiseList).then(values => {
        const permisos = ['hasPermisoPreVenta', 'hasPermisoCotizacion'];

        for (let index = 0; index < permisos.length; index++) {
          const permiso = permisos[index];
          const has_permiso = values[index];
          this[permiso] = has_permiso;
        }

        resolve(true);
      });
    });
  }

  pressEscResponse(res) {
    if (fun.hasValue(res)) fun.enfocarInput('valorI');
  }

  async loadFacturasChangingSerie() {
    const actualPagination = await this.getActualPagination();
    if (actualPagination) this.tServ.modifyPaginationById(shearchDocumentTableId, [{ page: 1 }]);
    this.pedirFactura(fun.deepCloning(this.tServ.obj_paginate.default));
  }

  async getPaqueteComprobante() {
    try {
      const tipoFact = Ss.factServ.lista_tipos_facturas.find(tipo => tipo.referencia == NotaC.base_comprobante[this.makeNotaSerieSelected()][this.buscarPara]);

      const res = await this.ncfClass.getAll({ afterPath: `custom/${tipoFact.id}/true` });

      this.paqueteComprobante = res['data'] as any;

      if (this.paqueteComprobante.fecha_valida !== null) {
        const desde = this.paqueteComprobante.desde;
        const hasta = this.paqueteComprobante.hasta;
        const secuencia = this.paqueteComprobante.secuencia;

        const cant = hasta - desde;
        const cantidad = cant + 1;
        let porciento = 0;

        if (cantidad > 0 && cantidad <= 40) {
          porciento = cantidad * 0.5;
        } else if (cantidad > 40 && cantidad <= 100) {
          porciento = cantidad * 0.25;
        } else if (cantidad > 100 && cantidad <= cantidad * 500) {
          porciento = cantidad * 0.1;
        } else if (cantidad > 500) {
          porciento = cantidad * 0.04;
        }
        const limite = hasta - porciento;
        const restante = hasta - secuencia + 1;

        const msg = this.paqueteComprobante.msg == 'Ultimo comprobante de este paquete' ? `Ultimo comprobante para ${tipoFact.descripcion}.` : `Los comprobantes para ${tipoFact.descripcion} se estan agotando, solo quedan ${restante}`;

        if (secuencia >= limite) fun.toastWarning(msg, 'AVISO');
      }
    } catch (error) {
      this.noExistenComprobantes = true;
      console.error(error);
      // fun.toastError(error.error.msg, 'ERROR');
    }
  }

  completarTituloPag() {
    if (this.buscarPara == 'anular_factura') {
      this.para = 'Anular factura';
    } else if (this.buscarPara == 'nota_credito') {
      this.para = 'Nota de crédito';
    } else if (this.buscarPara == 'nota_debito') {
      this.para = 'Nota de débito';
    } else if (this.buscarPara == 'solo_ver') {
      this.para = 'Visualizar';
      this.makeTiposDocumentos();
    }
  }

  makeTiposDocumentos() {
    const tipos = [
      { condition: true, value: tipoDocFacturacion.venta, label: 'Factura de venta' },
      { condition: true, value: tipoDocFacturacion.compra, label: 'Factura de compra' },
      { condition: this.hasPermisoPreVenta, value: tipoDocFacturacion.pre_venta, label: 'Pre-Venta' },
      { condition: this.hasPermisoCotizacion, value: tipoDocFacturacion.cotizacion, label: 'Cotización' },
    ];

    tipos.forEach(tipo => {
      if (tipo.condition) this.tipos_documentos.push(tipo);
    });
  }

  onHideSide() {
    this.notas.length = 0;
  }

  async openSide() {
    this.pedirNotas(this.tServ.obj_paginate.default);
  }

  async pedirNotas(params?: { per_page?: number; page?: number; search?: string }) {
    return new Promise(async resolve => {
      this.notas.length = 0;
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true, tipo_nota: '' } };

      extra.parameters.tipo_nota = NotaC.base_comprobante[this.notaSerieSelected()][this.buscarPara];

      try {
        const res = await this.notasClass.getAll(extra);

        res['data'].forEach(nota => {
          nota.tipo = this.buscarPara;
          const estatus = this.getIsActiveInfo(nota);

          nota.secuencia = nota.numero_documento.toString().padStart(8, '0');
          nota.total = Math.abs(nota.total);
          nota.selectedColor = 'gris-claro';
          nota.viewColor = 'gris-claro';
          nota.view = 'far fa-eye-slash';
          nota.is_active = estatus.icon;
          nota.is_active_tooltip = estatus.tooltip;
          nota.is_active_color = estatus.color;

          nota.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];

          nota.customStyles = {
            actions: [{ key: 'view', estilos: 'font-size: 1.2rem !important' }],
          };

          this.notas.push(nota);
        });

        this.showSide = true;

        fun.setTimeout(() => {
          this.tablaNotasComponent.changeTableConfig([{ total_count: res.total_registros }]);
        }, 10);
      } catch (err) {
        console.error(err);
        const error = err.error;

        if (fun.isEmpty(error?.data) || error?.data?.length == 0) this.showSide = false;
      }
      resolve(true);
    });
  }

  changeNotaSerie(serie) {
    this.notaSerieSelected.set(serie);
    this.pedirNotas(this.tServ.obj_paginate.default);
  }

  mostrarListaFacturas() {
    let res = false;
    if (this.facturas && this.facturas.length > 0) {
      if (this.buscar_por == this.campos.cliente || this.buscar_por == this.campos.ultimas50 || this.buscar_por == this.campos.suplidor) {
        res = true;
      } else if (this.buscar_por == this.campos.numeroFactura && this.tipo_factura_id == '0') {
        res = true;
      } else {
        res = false;
      }
    } else {
      res = false;
    }

    return res;
  }

  async pedirFactura(params?: { per_page?: number; page?: number; search?: string }) {
    return new Promise<void>(async (resolve, reject) => {
      const documento_descripcion = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion ? 'Cotización' : this.tipo_documento_selected() == tipoDocFacturacion.pre_venta ? 'Pre-Venta' : 'Factura';

      try {
        this.facturas.length = 0;

        const valor = fun.isEmpty(this.valor_a_buscar) ? '' : this.valor_a_buscar;

        const args = {
          campo: this.buscar_por,
          valor: valor,
          tipo_factura_id: this.tipo_factura_id,
          page: params.page,
          per_page: params.per_page,
          paginado: true,
          tipo: this.tipo_documento_selected(),
          movimientos_viaje: true,
          extra_params: { serie: this.serieSelected() },
        };

        const res = await this.facturaClass.getFacturasByParams(args);

        res['data'].forEach(fact => {
          const pago_a_tiempo = this.getIsPagoAtiempo(fact);
          const estatus = this.getIsActiveInfo(fact);

          fact.secuencia = _.padStart(fact.numero_factura, 8, '0');
          fact.fechaV = fun.hasValue(fact?.fecha_vencimiento) && moment(fact?.fecha_vencimiento).isValid() ? moment(fact.fecha_vencimiento).format('DD/MM/YYYY') : '';
          fact.colorFechaV = pago_a_tiempo ? 'black' : 'red';
          fact.is_active = estatus.icon;
          fact.is_active_tooltip = estatus.tooltip;
          fact.is_active_color = estatus.color;
          fact.monto = fun.roundNumberToDecimal(fact.balance);

          fact.viewColor = 'gris-claro';
          fact.view = 'far fa-eye-slash';
          fact.delete = 'far fa-trash-alt';
          fact.duplicate = 'fa-regular fa-copy';
          fact.make_bill = 'fas fa-external-link-alt';
          fact.pay_bill = 'fas fa-external-link-alt';

          fact.coti_preventa_tooltip = fact?.estado ? (fun.hasValue(fact?.fecha_completada) ? `${documento_descripcion} ya ha sido facturada` : `Crear Factura desde ${documento_descripcion}`) : `${documento_descripcion} está anulada.`;

          fact.pago_tooltip = fact?.estado ? (fun.hasValue(fact?.fecha_completada) ? `${documento_descripcion} ya ha sido pagada` : `Pagar factura`) : `${documento_descripcion} está anulada.`;
          fact.view_compra = 'Ver Factura';
          fact.delete_compra = 'Anular Compra';

          fact.tooltip_select = 'Seleccionar Factura';

          fact.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];

          fact.customStyles = {
            actions: [
              { key: 'actions', isTd: true, estilos: 'width: 8% !important;' },
              { key: 'view', estilos: 'font-size: 1.2rem !important;' },
              { key: 'duplicate', estilos: 'font-size: 1.2rem !important;' },
              { key: 'delete', estilos: 'font-size: 1.2rem !important;' },
              { key: 'make_bill', estilos: 'font-size: 1.1rem !important;' },
              { key: 'pay_bill', estilos: 'font-size: 1.1rem !important;' },
              { key: 'selected', estilos: 'font-size: 1.1rem !important;' },
            ],
          };

          if (this.tipo_documento_selected() == tipoDocFacturacion.compra) {
            if (fun.hasValue(fact.fecha_completada) || !fact.can_pagar) {
              [fact.pago_tooltip, fact.delete_compra] = Array(2).fill('');
            }

            if (fun.hasValue(fact.pagos)) {
              [fact.delete_compra] = Array(1).fill('');
            }
          }

          if (this.para == 'Visualizar')
            fun.pull(
              fact.customStyles.actions,
              fact.customStyles.actions.find(item => item.key == 'selected')
            );

          this.facturas.push(fact);
        });

        if (this.facturas.length > 0) {
          if (this.buscar_por == this.campos.numeroComprobante) {
            // this.facturas[0].detalle_facturas.push(this.facturas[0].detalle_facturas[0])

            this.facturaClass.parseDataToPdf(this.facturas[0]).then(factura_parsed => {
              const crear_nota = this.buscarPara.includes('nota');
              this.facturaSelected = factura_parsed;
              const tipo = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion ? 'cotizacion' : this.tipo_documento_selected() == tipoDocFacturacion.pre_venta ? 'pre_venta' : 'facturacion';
              this.mostrarFactura({ factura: factura_parsed, type: tipo, crear_nota, documento: 'factura' });
            });
          } else {
            fun.setTimeout(() => {
              this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
            }, 100);
          }
        }

        resolve();
      } catch (error) {
        if (this.buscar_por == this.campos.cliente) {
          fun.toastError(`Este cliente no tiene ${documento_descripcion} del tipo seleccionada`, 'ERROR');
        } else if (this.buscar_por == this.campos.suplidor) {
          fun.toastError(`Este suplidor no tiene ${documento_descripcion} del tipo seleccionada`, 'ERROR');
        } else if (this.buscar_por == this.campos.numeroFactura) {
          fun.toastError(`No existen ${documento_descripcion} con este número.`, 'ERROR');
        } else if (this.buscar_por == this.campos.numeroComprobante) {
          fun.toastError(`La ${documento_descripcion} buscada no existe`, 'ERROR');
        }
        fun.enfocarAndSelectInput('valorI');
        console.error(error);
        reject();
      }
    });
  }

  getIsActiveInfo(documento) {
    let res = { icon: null, tooltip: null, color: null };

    if (this.tipo_documento_selected() == tipoDocFacturacion.compra) {
      res.icon = documento.estado ? (documento.can_pagar ? (documento.balance < 1 ? 'fas fa-check' : 'fas fa-exclamation-triangle') : '') : 'fas fa-times';
      res.tooltip = documento.estado ? (documento.can_pagar ? (documento.balance < 1 ? 'Factura saldada' : 'Factura pendiente de pago') : '') : 'Factura anulada';
      res.color = documento.estado ? (documento.can_pagar ? (documento.balance < 1 ? 'green' : 'yellow') : '') : 'red';
    } else {
      if (documento.tipo == tipoDocFacturacion.cotizacion || documento.tipo == tipoDocFacturacion.pre_venta) {
        const documento_descripcion = documento.tipo == tipoDocFacturacion.cotizacion ? 'Cotización' : 'Pre-Venta';

        res.icon = documento.estado ? (fun.hasValue(documento.fecha_completada) ? 'fas fa-check' : 'fas fa-exclamation-triangle') : 'fas fa-times';
        res.tooltip = documento.estado ? (fun.hasValue(documento.fecha_completada) ? `${documento_descripcion} facturada` : `${documento_descripcion} sin facturar`) : `${documento_descripcion} Inactiva`;
        res.color = documento.estado ? (fun.hasValue(documento.fecha_completada) ? 'green' : 'yellow') : 'red';

        //
      } else if (documento.tipo == tipoDocFacturacion.nota_credito || documento.tipo == tipoDocFacturacion.nota_debito) {
        res.icon = documento.estado ? 'fas fa-check' : 'fas fa-times';
        res.tooltip = documento.estado ? 'Nota Activa' : 'Nota Inactiva';
        res.color = documento.estado ? 'green' : 'red';
      } else {
        res.icon = documento.estado ? 'fas fa-check' : 'fas fa-times';
        res.tooltip = documento.estado ? 'Factura Activa' : 'Factura Inactiva';
        res.color = documento.estado ? 'green' : 'red';
      }
    }
    return res;
  }

  getIsPagoAtiempo(factura) {
    let pago_a_tiempo = true;

    if (factura.condicion != 'Crédito' || factura.pagada) return pago_a_tiempo;

    const fecha_actual = DateUtils.format({ dateFormat: 'YYYY-MM-DD' });

    pago_a_tiempo = DateUtils.format({ date: factura.fecha_vencimiento, dateFormat: 'YYYY-MM-DD' }) > fecha_actual;

    return pago_a_tiempo;
  }

  resetFacturas() {
    this.facturas.length = 0;
  }

  selectTableConfig() {
    return new Promise<void>(resolve => {
      this.table_config = fun.deepCloning(BuscarFacturaC.tables_config[this.tipo_documento_selected()]);
      this.table_config['padre_functions'] = {
        data_request: params => {
          this.pedirFactura(params);
        },
      };

      this.verificateTableActions();
      resolve();
    });
  }

  verificateTableActions() {
    const td_actions = this.table_config.info.find(item => item.key == 'actions');

    if (this.buscarPara != 'solo_ver') {
      const btn_duplicate = td_actions.iconsArray.find(item => item.id == 'duplicate');
      if (fun.hasValue(btn_duplicate)) fun.pull(td_actions.iconsArray, btn_duplicate);
    }
  }

  async changeSelect(tipo, valor) {
    this.tipo_factura_id = null;
    this.valor_a_buscar = null;

    const valorInput = document.getElementById('valorI') as any;
    if (fun.hasValue(valorInput)) valorInput.value = null;

    this.resetFacturas();
    const actualPagination = await this.getActualPagination();
    if (actualPagination) this.tServ.modifyPaginationById(shearchDocumentTableId, [{ page: 1 }]);

    const tipos_cero = [this.campos.numeroComprobante, this.campos.ultimas50, this.campos.numeroFactura, this.campos.cliente, this.campos.suplidor].map(item => `${item}`);

    if (tipos_cero.includes(valor)) this.tipo_factura_id = '0';

    if (valor == this.campos.ultimas50) this.pedirFactura(fun.deepCloning(this.tServ.obj_paginate.default));

    if (tipo == 'tipo_documento') {
      this.buscar_por = null;
      fun.setTimeout(() => {
        this.selectTableConfig().then(() => this.tServ.initPagination(shearchDocumentTableId, this.table_config.obj_paginate));
      }, 100);
    }

    if (tipo == 'buscar_por') {
      this.getSeriesOptions(valor != this.campos.numeroComprobante);

      if (valor == this.campos.numeroComprobante) {
        if (this.serieSelected() == serie.all) {
          this.serieSelected.set(serie.no);
        }
      } else {
        if (this.serieSelected() == serie.no) {
          this.serieSelected.set(serie.all);
        }
      }
    }
  }

  getProperties(tipo) {
    let res;

    if (tipo == 'label') {
      if (this.buscar_por == this.campos.cliente) res = 'Cliente';
      if (this.buscar_por == this.campos.numeroComprobante) res = 'Numero Comprobante';
      if (this.buscar_por == this.campos.numeroFactura) res = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion ? 'Número Cotización' : 'Número Factura';
      if (this.buscar_por == this.campos.suplidor) res = 'Suplidor';
    } else {
      if (this.buscar_por == this.campos.cliente) res = 'Nombre Cliente';
      if (this.buscar_por == this.campos.numeroComprobante) res = 'Escriba numero de comprobante';
      if (this.buscar_por == this.campos.numeroFactura) res = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion ? 'Escriba número de Cotización' : 'Escriba número de Factura';
      if (this.buscar_por == this.campos.suplidor) res = 'Nombre Suplidor';
    }
    return res;
  }

  changePaginate(arg) {
    this.pedirFactura(arg);
  }

  abilitarBtns() {
    let res = true;
    if (this.facturaSelected) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  borrar(tipo = '') {
    this.resetFacturas();
    const input_valor = document.getElementById('valorI') as any;
    if (tipo != 'salir' && input_valor) input_valor.value = null;

    this.tipo_documento_selected.set(tipoDocFacturacion.venta);
    this.tipo_factura_id = null;
    this.buscar_por = null;
    fun.enfocarInput(this.buscarPara === 'solo_ver' ? 'tipoI' : 'buscarPorI');
  }

  tableClickIcon(params) {
    const documento = params.data;
    if (params.id_tabla == 'lista_notas') {
      if (params.columnKey == 'actions') {
        if (params.iconKey == 'view') {
          this.notaSelected = documento;
          this.notasClass.parseDataToPdf(documento).then((data_parsed: any) => {
            this.mostrarFactura({ factura: data_parsed, type: 'nota', dataDB: params.data, documento: 'nota' });
          });
        }
      }
    } else if (params.id_tabla == shearchDocumentTableId) {
      if (params.columnKey == 'actions') {
        if (params.iconKey == 'view') {
          this.facturaClass.parseDataToPdf(documento).then(factura_parsed => {
            this.facturaSelected = factura_parsed;
            const tipo = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion ? 'cotizacion' : this.tipo_documento_selected() == tipoDocFacturacion.pre_venta ? 'pre_venta' : 'facturacion';
            this.mostrarFactura({ factura: factura_parsed, type: tipo, crear_nota: this.buscarPara.includes('nota'), documento: 'factura' });
          });
        }

        if (params.iconKey == 'delete') {
          const tipo = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion || this.tipo_documento_selected() == tipoDocFacturacion.compra ? deleteDocumentosTypes.delete : deleteDocumentosTypes.anular;
          this.confirmAnularDocumento({ ids: params.data.id, tipo: tipo, secuencia: params.data.secuencia });
        }

        const redirectPageTypes = ['duplicate', 'make_bill', 'pay_bill'];
        if (redirectPageTypes.includes(params.iconKey)) {
          const actions = {
            duplicate: { url: actionFacturacion.duplicate, modalLabel: 'duplicar', modalId: 'duplicate_bill', redirectTo: 'facturacion' },
            make_bill: { url: actionFacturacion.bill_from_cotizacion, modalLabel: 'facturar', modalId: 'make_bill', redirectTo: 'facturacion' },
            pay_bill: { url: actionFacturacion.pay_bill, modalLabel: 'pagar', modalId: 'pay_bill', redirectTo: 'pagos' },
          };

          const titleCasePipe = new TitleCasePipe();
          const tipoDocumento = titleCasePipe.transform(tipoDocFacturacionLabel[this.tipo_documento_selected()]);
          const action = actions[params.iconKey].url;
          const label = actions[params.iconKey].modalLabel;

          this.dynamicModalServ.confirmationModal({
            id: actions[params.iconKey].modalId,
            texto: `Seguro que desea <strong>${label}</strong> la ${tipoDocumento} No.: <strong>${params.data.secuencia} </strong>`,
            btnKind: confirmationButtons.siNo,
            onYes: () => {
              if (actions[params.iconKey].redirectTo == 'facturacion') {
                this.goToFacturacionPage(documento.tipo, action, documento.id);
              } else {
                this.goToPaymentPage(documento.suplidor_id, documento.id);
              }
            },
          });
        }
      }
    }
  }

  confirmAnularDocumento(params: { ids: string; tipo: string; secuencia: string }) {
    const documento_descripcion = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion ? 'Cotización' : this.tipo_documento_selected() == tipoDocFacturacion.pre_venta ? 'Pre-Venta' : 'Factura';

    this.dynamicModalServ.confirmationModal({
      id: 'confirmAnularDocumento',
      texto: `Seguro que desea anular la ${documento_descripcion} No.: <strong>${params.secuencia} </strong>`,
      btnKind: confirmationButtons.cancelarAnular,
      onYes: () => this.deleteRequest(params),
    });
  }

  deleteRequest(params: { ids: string; tipo: string }) {
    const extra = { afterPath: `custom/delete`, parameters: params };

    this.facturaClass.dynamic(extra).then(async res => {
      const info = {
        pre_venta: { label: { singular: 'Pre_Venta', plural: 'Pre_Ventas' }, key: 'numero_factura', key_label: { singular: 'número', plural: 'números' } },
        venta: { label: { singular: 'Factura', plural: 'Facturas' }, key: 'numero_comprobante', key_label: { singular: 'número de comprobante', plural: 'números de comprobantes' } },
        compra: { label: { singular: 'Factura', plural: 'Facturas' }, key: 'numero_comprobante', key_label: { singular: 'número de comprobante', plural: 'números de comprobantes' } },
        cotizacion: { label: { singular: 'Cotización', plural: 'Cotizaciones' }, key: 'numero_factura', key_label: { singular: 'número', plural: 'números' } },
      };

      const current_info = info[this.tipo_documento_selected()];
      const errors = (res.data as any).error;
      if (errors.length > 0) {
        const indicadores_temp = errors.map(documento => documento[current_info.key]);
        const indicadores = _.join(indicadores_temp, ', ');

        let msg = '';
        if (errors.length == 1) {
          msg = `La ${current_info.label.singular} con el ${current_info.key_label.singular}: <<${indicadores}>> no pudo ser borrada.`;
        } else {
          msg = `Las ${current_info.label.plural} con los ${current_info.key_label.plural}: <<${indicadores}>> no pudieron ser anuladas.`;
        }

        fun.toastError(msg, 'ERROR');
      }

      if ((res.data as any).success.length > 0) {
        const msg = errors.length == 1 ? `La ${current_info.label.singular} fue borrada correctamente.` : `Las ${current_info.label.plural} fueron borradas correctamente.`;
        fun.toastSuccess(msg, 'CORRECTO');
      }

      const actualPagination = await this.getActualPagination();
      this.pedirFactura(actualPagination);
    });
  }

  async saltar(salioDe, valor) {
    this.resetFacturas();
    let actualPagination = await this.getActualPagination();

    let siguiente_input;
    this.valor_a_buscar = valor;

    switch (salioDe) {
      case 'tipoI':
        siguiente_input = 'buscarPorI';
        break;

      case 'buscarPorI':
        siguiente_input = this.buscar_por == this.campos.numeroComprobante || this.tipo_documento_selected() == tipoDocFacturacion.cotizacion ? 'valorI' : 'campoTipoFact';
        break;

      case 'campoTipoFact':
        siguiente_input = 'valorI';
        break;

      case 'cliente':
        fun.desEnfocarInput('valorI');

        if (fun.hasValue(valor) || valor == ' ') this.abrirModalFiltro(valor);

        break;

      case 'buscarFactura':
        if (this.buscar_por == this.campos.numeroComprobante) this.valor_a_buscar = valor.toUpperCase();

        fun.desEnfocarInput('valorI');
        this.pedirFactura(actualPagination);

        break;
    }

    if (fun.hasValue(siguiente_input)) fun.enfocarInput(siguiente_input);
  }

  async abrirModalFiltro(nombre) {
    const propietarioModalConf = new DynamicModalClass();

    propietarioModalConf.id = 'buscarCliente';
    propietarioModalConf.inputs = { metodo: this.tipo_documento_selected(), include_contado: false, palabra_a_buscar: nombre };
    propietarioModalConf.header = this.tipo_documento_selected() == 'compra' ? 'Buscar Suplidor' : 'Buscar Cliente';
    propietarioModalConf.width = '57rem';
    propietarioModalConf.height = '32rem';
    propietarioModalConf.component = BuscarClienteSuplidorComponent;
    propietarioModalConf.closableEsc = true;
    propietarioModalConf.setCallback(this.processPropietarioModal.bind(this));

    propietarioModalConf.show();
  }

  async processPropietarioModal(args: ICallbackModal) {
    const { type, data } = args;

    if (type == modalCloseType.returnData) {
      if (data?.tipo == 'data_no_found') {
        fun.enfocarAndSelectInput('valorI');
      } else {
        (document.getElementById('valorI') as any).value = data.nombre_completo;
        const actualPagination = await this.getActualPagination();
        this.buscar_por = this.tipo_documento_selected() == tipoDocFacturacion.compra ? this.campos.suplidor : this.campos.cliente;
        this.valor_a_buscar = data.id;
        this.pedirFactura(actualPagination);
      }
    }
  }

  formatoNumeroFactura(num) {
    return String(num).padStart(8, '0');
  }

  editarFactura() {
    this.facturaClass.getAll({ afterPath: `custom/can_update`, parameters: { id: this.facturaSelected.id } }).then(res => {
      this.goToFacturacionPage(this.facturaSelected.tipo, actionFacturacion.update, this.facturaSelected.id);
    });
  }

  goToFacturacionPage(tipo: string, action: string, id: any) {
    fun.setTimeout(() => {
      this.router.navigateByUrl(`/admin/factura/${tipo}/${action}/${id}`);
    }, 10);
  }

  goToPaymentPage(suplidor_id: number, factura_id: number) {
    setTimeout(() => this.router.navigateByUrl(`/admin/pagos/pago_factura/${suplidor_id}/${factura_id}`), 10);
  }

  async AnularFactura() {
    try {
      const res = await this.facturaClass.createOne(null, { afterPath: `anular_factura/${this.facturaSelected.id}` });
      const actualPagination = await this.getActualPagination();
      this.pedirFactura(actualPagination);
    } catch (error) {
      console.error(error);
    }
  }

  async continuarANotas(idFactSelect?) {
    if (this.buscarPara.includes('nota')) await this.getPaqueteComprobante();

    if (this.noExistenComprobantes == false) {
      const url = `/admin/manipular/nota/${this.buscarPara === 'nota_credito' ? 'credito' : 'debito'}/${idFactSelect}/${this.makeNotaSerieSelected()}`;
      this.router.navigateByUrl(url);
    }
  }

  mostrarFactura(args: { factura: FacturasI; type: string; dataDB?: any; crear_nota?: boolean; documento?: string }) {
    const { factura, type, dataDB, crear_nota, documento } = args;

    let botonesDinamicos: IButtonDynamic[] = [{ clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false }];
    this.agregarBotones(botonesDinamicos, factura, type, crear_nota, dataDB, documento);
    const toPDFData = { data: factura, type: type };

    const dataModal = { id: 'pdfViewer-modal', header: documento == 'nota' ? 'MOSTRAR NOTA' : 'MOSTRAR FACTURA', show_estado: true };

    this.facturaClass.handleMostrarFactura(toPDFData, dataModal, botonesDinamicos);

    // PdfService.generatePdf({ oPdf: toPDFData, imprimir: false })
    //   .then(async res => {
    //     const viewPdfModalConf = new DynamicModalClass();

    //     viewPdfModalConf.id = 'pdfViewer-modal';
    //     viewPdfModalConf.inputs = {
    //       show_estado: true,
    //       estado_documento: factura.estado,
    //       base64: res.base64,
    //       documento: documento,
    //       reimprimir: res.reimprimir,
    //       fileName: res.file.split('.')[0],
    //       factura: factura,
    //     };
    //     viewPdfModalConf.header = documento == 'nota' ? 'MOSTRAR NOTA' : 'MOSTRAR FACTURA';
    //     viewPdfModalConf.width = '57rem';
    //     viewPdfModalConf.height = '70vh';
    //     viewPdfModalConf.component = PdfViewerComponent;
    //     viewPdfModalConf.closableEsc = true;

    //     this.agregarBotones(botonesDinamicos, factura, type, crear_nota, dataDB, documento);

    //     viewPdfModalConf.botones = botonesDinamicos;

    //     viewPdfModalConf.show();
    //   })
    //   .catch(err => fun.toastError(err.msg, 'ERROR'));
  }

  private agregarBotones(botonesDinamicos: IButtonDynamic[], factura: FacturasI, type: string, crear_nota: boolean, dataDB?: any, documento?: string): void {
    const botones = this.crearBotonesAccion(factura, type, dataDB, documento);

    // Agregar botón de ver detalles o facturar
    const esCotizacionOPreVenta = this.tipo_documento_selected() == tipoDocFacturacion.cotizacion || this.tipo_documento_selected() == tipoDocFacturacion.pre_venta;

    if (!esCotizacionOPreVenta) {
      botonesDinamicos.push(botones.verDetallesButton);
    } else {
      botonesDinamicos.push(botones.facturarButton);
    }

    if (crear_nota) botonesDinamicos.push(botones.crearNotaButton);

    // Agregar botones adicionales según condiciones
    if (this.para == 'Visualizar') {
      if (factura.estado) botonesDinamicos.push(botones.rePrintButton);

      if (this.buscarPara == 'solo_ver' && factura.estado && type == 'facturacion') {
        botonesDinamicos.push(botones.cloneButton);

        if (factura.serie != serie.electronica) {
          botonesDinamicos.push(botones.editButton);

          const isAfterCertificationDate = DateUtils.compareDates(this.certificacionDate, DateUtils.format({ date: factura.fecha_equivalente, dateFormat: 'YYYY-MM-DD' })) >= 0;

          if (isAfterCertificationDate) botonesDinamicos.push(botones.reemplaceButton);
        }
      }
    }
  }

  private crearBotonesAccion(factura: FacturasI, type: string, dataDB?: any, documento?: string) {
    return {
      verDetallesButton: {
        clase: 'btn btn-gris',
        function: instance => this.verDetalles(type == 'nota' ? dataDB : factura, documento),
        label: 'Ver detalles',
        disable: false,
      },
      facturarButton: {
        clase: 'btn btn-gris',
        function: instance => {
          instance.close();
          this.tableClickIcon({ id_tabla: shearchDocumentTableId, columnKey: 'actions', iconKey: 'make_bill', data: factura });
        },
        tooltip: fun.hasValue(factura.fecha_completada) ? 'Cotización ya ha sido facturada' : null,
        label: 'Facturar',
        disable: { function: () => fun.hasValue(factura.fecha_completada) },
      },
      editButton: {
        clase: 'btn btn-verde',
        function: instance => {
          this.editarFactura();
          instance.close();
        },
        label: 'Editar',
        disable: false,
      },
      rePrintButton: {
        clase: 'btn btn-amarillo',
        function: instance => this.reimprimirDocumento({ data: factura, type: type }, instance),
        label: 'Reimprimir',
        disable: false,
      },
      cloneButton: {
        clase: 'btn btn-azul',
        function: instance => {
          this.goToFacturacionPage(factura.tipo, actionFacturacion.duplicate, factura.id);
          instance.close();
        },
        label: 'Clonar',
        disable: false,
      },
      reemplaceButton: {
        clase: 'btn btn-danger',
        function: instance => this.confirmarReemplazarENCF(factura, instance),
        label: 'Reemplazar eNCF',
        disable: false,
      },
      crearNotaButton: {
        clase: 'btn btn-verde',
        function: instance => {
          this.continuarANotas(factura.id);
          instance.close();
        },
        label: 'Crear Nota',
        disable: false,
      },
    };
  }

  confirmarReemplazarENCF(factura, modalPdfInstance) {
    this.dynamicModalServ.confirmationModal({
      id: 'reemplazarENCF',
      texto: `Seguro que desea reemplazar a eNCF la factura <strong>${factura.numero_comprobante}</strong>?`,
      btnKind: confirmationButtons.siNo,
      onYes: () => this.reemplazarENCF(factura, [modalPdfInstance]),
    });
  }

  reemplazarENCF(factura, modalInstances) {
    this.facturaClass.updateOne({ id: factura.id }, { afterPath: `dgii/eNCF/replace` }).then(res => {
      modalInstances.forEach(instance => instance.close());

      this.beforeReemplazarENCF();
    });
  }

  async beforeReemplazarENCF() {
    const actualPagination = await this.getActualPagination();

    if (this.buscar_por == request_factura_campo.last_50) {
      this.pedirFactura(actualPagination);
    }
  }

  reimprimirDocumento(obj, modalInstance) {
    Ss.loadServ.isLoading.next(true);
    PdfService.generatePdf({ oPdf: obj, imprimir: true })
      .then(async res => {
        Ss.loadServ.isLoading.next(false);

        fun.toastSuccess(res.msg, 'CORRECTO');
        modalInstance.close();
      })
      .catch(err => {
        console.error('err ', err);

        Ss.loadServ.isLoading.next(false);
        fun.toastError(err.msg, 'ERROR');
      });
  }

  verDetalles(data, documento) {
    this.facturaClass.modalVerDetalles(data, documento);
  }

  async getActualPagination() {
    let actualPagination = this.tServ.getPaginationById(shearchDocumentTableId);

    if (fun.isEmpty(actualPagination)) {
      await this.tServ.initPagination(shearchDocumentTableId, this.table_config.obj_paginate);
      actualPagination = this.tServ.getPaginationById(shearchDocumentTableId);
    }

    return actualPagination;
  }
}
