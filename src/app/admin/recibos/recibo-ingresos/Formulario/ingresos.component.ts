import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DBservice } from '../../../../core/services/bdservice.service';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { GLOBAL } from '../../../../core/services/GLOBAL';
import * as moment from '../../../../../utils/javascript/moment';
import { NgSelectConfig } from '@ng-select/ng-select';
import { TablasComponent } from '../../../components/tablas/tablas.component';
import { TablasService } from '../../../components/tablas/tablas.service';
import { mixinClass } from '../../../mixinClass';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
})
export class IngresosComponent extends mixinClass implements OnInit, OnDestroy {
  clienteAdepositar: any;
  facturas;
  tipo_recibo = 'Pago factura';

  @ViewChild(TablasComponent) tablas: TablasComponent;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: '1',
      key: 'historyPagos',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
      estilos: [{ width: '2rem' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'NCF',
      estilos: [{ width: '7rem' }],
      key: 'numero_comprobante',
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Fecha Vencimiento',
      text_color: 'colorFecha',
      key: 'fechaV',
      color: true,
    },
    {
      titulo: 'Total facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
    {
      titulo: 'Balance factura',
      key: 'balance',
      formatoNumero: true,
    },
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
  totalPagadoPorciento: number;
  recibiendo = 0;
  restando = 0;

  constructor(private config: NgSelectConfig, private dbServ: DBservice, private tServ: TablasService) {
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
      this.clienteAdepositar.balance = this.clienteAdepositar.balance ? this.clienteAdepositar.balance : 0;

      (document.getElementById('clienteI') as any).value = `${res.data.nombre} ${res.data.apellido}`;

      this.pedirFacturasPorCliente(res.data.id, this.tServ.obj_paginate);
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

  recalcularMonto(monto_original, notas) {
    let monto = monto_original;
    for (let i = 0; i < notas.length; i++) {
      const element = notas[i];
      const totalABS = Math.abs(element.total_factura);

      if (element.tipo_factura_id === 5) monto -= totalABS;
      else if (element.tipo_factura_id === 4) monto += totalABS;
    }
    return monto;
  }

  async pedirFacturasPorCliente(cliente_id, e) {
    this.facturas = undefined;
    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalPagadoPorciento = 0;

    const page = e.page;
    const per_page = e.per_page;

    try {
      const fechaA = moment().format('YYYY-MM-DD');
      this.facturas = await this.dbServ
        .getFacturasByClienteIdAndPagada(cliente_id, false, page, per_page, true)
        .pipe(
          map(
            (fact) =>
              (fact = fact.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_equivalente).format('DD-MM-YYYY');
                val.fechaV = val.condicion === 'Crédito' ? moment(val.fecha_vencimiento).format('DD-MM-YYYY') : null;
                val.select = false;
                val.pagoT = false;
                val.pago_a_tiempo = val.fecha_vencimiento > fechaA ? true : false;
                val.colorFecha = moment(val.fecha_vencimiento).format('YYYY-MM-DD') < fechaA ? 'red' : 'black';

                val.balance = this.recalcularMonto(val.balance, val.notas);
                val.total_factura = this.recalcularMonto(val.total_factura, val.notas);
                val.monto = 0;

                val.historyPagos = val.is_viaje ? 'fas fa-truck-moving' : val.pagos.length > 0 ? 'fas fa-comment-dollar' : 'far fa-comment';
                val.colorEstado = val.is_viaje ? 'green' : val.pagos.length > 0 ? 'black' : 'gris-claro';
                val.iconHover = val.is_viaje ? false : val.pagos.length > 0 ? true : false;

                val.customStyles = {
                  'td-historyPagos': { width: '2rem', 'font-size': '1.2rem' },
                  'td-select': { width: '6rem' },
                  'td-pagoT': { width: '6rem' },
                  'td-numero_comprobante': { width: '7rem' },
                };

                val.pagos.forEach((abono) => {
                  this.totalPagado += abono.deposito;
                });

                val.subrayar = val.is_viaje;
                // val.is_viaje = !val.is_viaje;

                this.totalFacturado += val.total_factura;
                this.totalPagadoPorciento = (this.totalPagado / this.totalFacturado) * 100;
                this.totalPagadoPorciento = parseFloat(GLOBAL.numFormatTwoDecimals(this.totalPagadoPorciento));
                return val;
              })),
          ),
        )
        .toPromise();

      this.facturas = _.orderBy(this.facturas, ['id'], ['desc']);

      console.log('this.facturas ', this.facturas);

      const obj = { total: this.facturas.lenght, tabla: 'facturasPendientes' };

      this.tServ.Func_total_paginas(obj);
    } catch (error) {
      console.error(error);
      this.fun.toastError(error, 'ERROR');
    }
  }

  async necesarioStart() {
    this.enfocarInput('clienteI');
  }

  clickVerPagos(arg) {
    if (arg.column === 'historyPagos') {
      const pagos = this.facturas[arg.index].pagos;
      if (pagos.length > 0) {
        for (let i = 0; i < pagos.length; i++) {
          const pago = pagos[i];
          pago.numero_recibo = _.padStart(pago.numero_recibo, 8, '0');
          pago.recibo_created_at = moment(pago.recibo_created_at).format('DD/MM/YYYY');
        }

        const obj = { total: pagos.length, tabla: 'historial_pago' };

        this.abrirModal('historial_pago', pagos);
        this.tServ.Func_total_paginas(obj);
      }
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

    try {
      const res = await this.dbServ.createRecibo(obj).toPromise();

      this.clienteAdepositar.balance = res.data.cliente.balance;

      this.pedirFacturasPorCliente(this.clienteAdepositar.id, this.tServ.obj_paginate);
      this.resetVariables();

      const obj_print = { data: res, type: 'recibo_ingreso' };

      this.pdfServ.generatePdf(obj_print).then((res) => {
        if (res.status === 'si') {
          const objBase = { base64: res.body, filename: res.file, type: 'recibo_ingreso' };
          this._ipc.send('printBase64', objBase);
          this.layServ.nextCheckCuadreToday(true);
        }
      });
    } catch (error) {}
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
    this.restando = this.clienteAdepositar.balance - this.recibiendo;
  }

  async abrirModalFiltro(nombre) {
    if (this.fun.hasValue(nombre)) {
      const obj = { data: [], filtrarCliente: nombre };
      this.abrirModal('buscarCliente', obj);
      this.desEnfocarInput('clienteI');
    }
  }
}
