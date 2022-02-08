import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import * as moment from '../../../../core/javascript/moment';
import { NgSelectConfig } from '@ng-select/ng-select';
import { TablasComponent } from '../../../components/tablas/tablas.component';
import { TablasService } from '../../../components/tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ReciboC } from '../../recibos';
import { RecibosService } from '../../recibos.service';
import { FacturaC } from '../../../facturacion/factura';
import { PdfService } from '../../../../core/services/pdf/pdf.service';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
})
export class IngresosComponent extends MixinClass implements OnInit, OnDestroy {
  clienteAdepositar: any;
  facturas;
  tipo_recibo = 'Pago factura';

  @ViewChild(TablasComponent) tablas: TablasComponent;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    { titulo: '1', key: 'historyPagos', text_color: 'colorEstado', isIcon: true, color: true, estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }] },
    { titulo: 'NCF', estilos: [{ width: '7rem' }], key: 'numero_comprobante' },
    { titulo: 'Fecha Facturacion', key: 'fecha' },
    { titulo: 'Fecha Vencimiento', text_color: 'colorFecha', key: 'fechaV', color: true },
    { titulo: 'Total facturado', key: 'total_factura', formatoNumero: true },
    { titulo: 'Balance factura', key: 'balance', formatoNumero: true },
    {
      titulo: 'Seleccione',
      tipo: 'check',
      key: 'select',
      select_all: false,
      estilos: [{ width: '7rem', padding: '0.6rem 0rem' }],
      disable: [{ kind: 'campo', target: 'is_viaje', value: [true] }],
    },
    {
      titulo: 'Pago Total',
      tipo: 'check',
      key: 'pagoT',
      select_all: false,
      estilos: [{ width: '6rem', padding: '0.6rem 0rem' }],
      disable: [{ kind: 'campo', target: 'select', value: [false] }],
    },
    {
      titulo: 'Monto a pagar',
      tipo: 'input',
      key: 'monto',
      checkNumber: true,
      disable: [
        { kind: 'campo', target: 'select', value: [false] },
        { kind: 'campo', target: 'pagoT', value: [true] },
      ],
      title: '',
    },
  ];
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

  constructor(private config: NgSelectConfig, private tServ: TablasService, private reciboServ: RecibosService, private pdfServ: PdfService) {
    super();
    this.config.notFoundText = 'Articulo no existe';
  }

  ngOnInit() {
    this._init_mixin({ component: 'ingresos', _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res', 'noFiltro'] });

    this.necesarioStart();
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  decisionModal(res: any) {
    if (res && this.tipoModal === 'cancelar_ingreso') this.cancelarIgreso();
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarCliente') {
      this.clienteAdepositar = res.data;

      (document.getElementById('clienteI') as any).value = `${res.data.nombre} ${res.data.apellido}`;
      const actualPagination = this.tServ.getPaginationById('facturasPendientes');

      this.pedirFacturasPorCliente(res.data.id, actualPagination);
    } else if (res && res.tipo_modal === 'cambio') {
      this.devuelta = res.data.devuelta;
      this.forma_pago = res.data.forma_pago;
      this.sendIngreso();
    }
  }

  noFiltroResponse(res) {
    if (res.tipo == 'buscarCliente') {
      this.enfocarInput('clienteI');
      this.selectContenido('clienteI');
    }
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
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

    this.facturas.forEach((fact, j) => {
      if (allSelected) {
        if (!fact.is_viaje && fact.select) {
          this.facturas[j].pagoT = false;
          this.facturas[j].select = false;
          this.facturas[j].monto = 0;

          this.tablas.resetInput('especificar', 'monto', j, true, 0);
        }
      } else {
        if (!fact.is_viaje && !fact.select) this.facturas[j].select = true;
      }
    });

    this.sumarTotalRecibo();
  }

  async pedirFacturasPorCliente(cliente_id, e) {
    this.facturas = undefined;
    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalNotas = 0;
    this.totalPagadoPorciento = 0;

    const page = e.page;
    const per_page = e.per_page;

    const fechaA = moment().format('YYYY-MM-DD');

    const factTemp = await this.facturaClass.getAll({ afterPath: `cliente/${cliente_id}/pagada/false`, parameters: { page, per_page, paginado: false } });
    this.facturas = factTemp.data;

    this.facturas.map((factura) => {
      factura.secuencia = _.padStart(factura.numero_factura, 8, '0');
      factura.fecha = moment(factura.fecha_equivalente).format('DD-MM-YYYY');
      factura.fechaV = factura.condicion === 'Crédito' ? moment(factura.fecha_vencimiento).format('DD-MM-YYYY') : null;
      factura.select = false;
      factura.pagoT = false;
      factura.pago_a_tiempo = factura.fecha_vencimiento > fechaA ? true : false;
      factura.colorFecha = moment(factura.fecha_vencimiento).format('YYYY-MM-DD') < fechaA ? 'red' : 'black';
      factura.monto = 0;
      const modalMoviemientos = factura.pagos.length > 0 || factura.notas.length > 0;
      factura.historyPagos = factura.is_viaje ? 'fas fa-truck-moving' : modalMoviemientos ? 'fas fa-comment-dollar' : 'far fa-comment';
      factura.colorEstado = factura.is_viaje ? 'green' : modalMoviemientos ? 'black' : 'gris-claro';
      factura.iconHover = factura.is_viaje ? false : modalMoviemientos ? true : false;

      factura.customStyles = {
        'td-historyPagos': { width: '2rem', 'font-size': '1.2rem' },
        'td-select': { width: '6rem' },
        'td-pagoT': { width: '6rem' },
        'td-numero_comprobante': { width: '7rem' },
      };

      this.totalPagado = _.reduce(factura.pagos, (acumulado, item) => acumulado + item.deposito, this.totalPagado);
      this.totalNotas = _.reduce(factura.notas, (acumulado, item) => acumulado + Math.abs(item.total_factura), this.totalNotas);

      factura.subrayar = factura.is_viaje;

      this.totalFacturado += factura.total_factura;
      this.totalPagadoPorciento = (this.totalPagado / this.totalFacturado) * 100;
      this.totalPagadoPorciento = parseFloat(GLOBAL.numFormatTwoDecimals(this.totalPagadoPorciento));
      return factura;
    });

    this.facturas = _.orderBy(this.facturas, ['id'], ['desc']);
    this.debiendo = this.totalFacturado - this.totalPagado - this.totalNotas;

    this.restando = this.debiendo - this.recibiendo <= 1 ? 0 : this.debiendo - this.recibiendo;
    const obj = { total: this.facturas.lenght, tabla: 'facturasPendientes' };

    this.tServ.Func_total_paginas(obj);
  }

  // 134215.75+27725+106099.56+139550.75+2970+159379.56+110629.31+92004.56+32554.89
  async necesarioStart() {
    this.enfocarInput('clienteI');
  }

  clickVerPagos(arg) {
    if (arg.column === 'historyPagos') {
      const pagos = this.facturas[arg.index].pagos;
      const notas = this.facturas[arg.index].notas;
      if (pagos.length || notas.length) this.reciboServ.abrirModalHistorial(pagos, notas);
    }
  }

  isOneFacturaWithMonto() {
    const valid = _.some(this.facturas, (factura) => factura.select && GLOBAL.desformatear(factura.monto) > 0);
    return valid;
  }

  cancelarIgreso() {
    this.facturas = null;
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
        deposito: GLOBAL.desformatear(fact.monto),
        descripcion:
          this.tipo_recibo === 'Pago factura'
            ? fact.pagoT
              ? 'Saldo ' + fact.numero_comprobante + ' ' + moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
              : 'Abono ' + fact.numero_comprobante + ' ' + moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
            : '',
        pago_a_tiempo: fact.pago_a_tiempo,
      });

      total += GLOBAL.desformatear(fact.monto);
    }

    const obj = { total_recibo: total, detalle: temp };

    return obj;
  }

  abrirModalDinamicText(tipo) {
    const obj = {};
    if (tipo === 'cancelar') obj['texto_modal'] = 'Seguro de que desea cancelar la operacion.';

    this.abrirModal('dinamico_texto', obj, 'cancelar_ingreso');
  }

  async confirmarIgreso() {
    if (this.ExisteMontoMayor) {
      this.fun.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR');
    } else {
      this.detalleYtotal = await this.formarDetalleRecibos();
      const obj = { total_factura: this.detalleYtotal.total_recibo, devuelta: 0, factura_de: 'ingreso', tipo__: 'devuelta' };
      this.abrirModal('cambio', obj);
    }
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
      const actualPagination = this.tServ.getPaginationById('facturasPendientes');
      this.pedirFacturasPorCliente(this.clienteAdepositar.id, actualPagination);
      this.resetVariables();

      const obj_print = { data: recibo, type: 'recibo_ingreso' };

      this.pdfServ.generatePdf(obj_print).then((res_pdf) => {
        if (res_pdf.status === 'si') {
          const objBase = { base64: res_pdf.body, filename: res_pdf.file, type: 'recibo_ingreso' };
          this._ipc.send('printBase64', objBase);
          this.layServ.nextCheckCuadreToday(true);
        }
      });
    });
  }

  printBase64Res(res) {
    if (res.status === 'si') {
    } else this.fun.toastError(res.msg, 'ERROR');
  }

  resetVariables() {
    this.forma_pago = null;
    this.devuelta = null;
    this.detalleYtotal = undefined;
  }

  getInfoChange(item) {
    if (item.cambio === 'pagoT' && item.value) {
      this.tablas.resetInput('balance', 'monto', item.index, true);
    }
    if (item.cambio === 'select') {
      if (!item.value) {
        this.facturas[item.index].pagoT = false;
        this.tablas.resetInput('especificar', 'monto', item.index, true, 0);
      }
    }

    if (item.cambio === 'monto') {
      if (!item.value) {
        this.fun.toastWarning('Debe de introducir un Monto', 'AVISO');
        this.tablas.enfocarInput('input-' + item.index);
      }
      const total = item.body[item.index].balance;
      const monto = GLOBAL.desformatear(item.value);

      if (monto === total) this.facturas[item.index].pagoT = true;

      if (monto > total) {
        this.ExisteMontoMayor = true;
        this.fun.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        this.facturas[item.index].monto = this.facturas[item.index].balance;
        this.tablas.enfocarInput('input-' + item.index);
      } else {
        this.ExisteMontoMayor = false;
      }
    }
    this.sumarTotalRecibo();
  }

  sumarTotalRecibo() {
    this.recibiendo = _.reduce(this.facturas, (sum, item) => GLOBAL.desformatear(item.monto) + sum, 0);
    this.restando = this.debiendo - this.recibiendo <= 1 ? 0 : this.debiendo - this.recibiendo;
  }

  async abrirModalFiltro(nombre) {
    if (this.fun.hasValue(nombre)) {
      const obj = { data: [], filtrarCliente: nombre };
      this.abrirModal('buscarCliente', obj);
      this.desEnfocarInput('clienteI');
    }
  }
}
