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
import { FormCantidadEfectivoComponent } from '../../../components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '../../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { fun } from '../../../../core/services/functions.service';

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
    { titulo: '1', tipo: 'icon', key: 'historyPagos', text_color: 'colorEstado', isIcon: true, color: true, estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }] },
    { titulo: 'NCF', tipo: 'text', estilos: [{ width: '7rem' }], key: 'numero_comprobante' },
    { titulo: 'Fecha Facturacion', tipo: 'text', key: 'fecha' },
    { titulo: 'Fecha Vencimiento', tipo: 'text', text_color: 'colorFecha', key: 'fechaV', color: true },
    { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura', formatoNumero: true },
    { titulo: 'Balance factura', tipo: 'formatoNumero', key: 'balance', formatoNumero: true },
    {
      titulo: 'Seleccione',
      tipo: 'inputSwitch',
      key: 'select',
      select_all: false,
      estilos: [{ width: '7rem', padding: '0.6rem 0rem' }],
      disable: [{ kind: 'campo', target: 'is_viaje', value: [true] }],
    },
    {
      titulo: 'Pago Total',
      tipo: 'inputSwitch',
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
        'td-historyPagos': { width: '2rem', 'font-size': '1rem' },
        'td-select': { width: '6rem' },
        'td-pagoT': { width: '6rem' },
        'td-numero_comprobante': { width: '7rem' },
      };

      this.totalPagado = _.reduce(factura.pagos, (acumulado, item) => acumulado + item.deposito, this.totalPagado);
      this.totalNotas = _.reduce(factura.notas, (acumulado, item) => acumulado + Math.abs(item.total), this.totalNotas);

      factura.subrayar = factura.is_viaje;

      this.totalFacturado += factura.total_factura;
      this.totalPagadoPorciento = (this.totalPagado / this.totalFacturado) * 100;
      this.totalPagadoPorciento = parseFloat(fun.numFormatTwoDecimals(this.totalPagadoPorciento));
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
    const valid = _.some(this.facturas, (factura) => factura.select && fun.desformatear(factura.monto) > 0);
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
      siFunction: this.cancelarIgreso,
    };
    this.confirmationModal(obj);
  }

  async getDataFromModal(arg, search) {
    if (arg.modal_id === 'cambioEfectivo_IngresosComponent') {
      this.devuelta = arg.obj.devuelta;
      this.forma_pago = arg.obj.forma_pago;
      this.sendIngreso();
    }

    if (arg.modal_id === 'buscarCliente') {
      this.clienteAdepositar = arg.data;

      (document.getElementById('clienteI') as any).value = `${arg.data.nombre} ${arg.data.apellido}`;
      const actualPagination = this.tServ.getPaginationById('facturasPendientes');

      this.pedirFacturasPorCliente(arg.data.id, actualPagination);
    }
  }
  async confirmarIgreso() {
    if (this.ExisteMontoMayor) {
      fun.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR');
    } else {
      this.detalleYtotal = await this.formarDetalleRecibos();
      const obj = { total_factura: this.detalleYtotal.total_recibo, devuelta: 0, factura_de: 'ingreso', tipo__: 'devuelta' };

      this.handleModalForm({
        component: FormCantidadEfectivoComponent,
        inputs: obj,
        id: 'cambioEfectivo_IngresosComponent',
        header: 'Cantidad de efectivo',
        width: '34.375rem',
        botones: {
          aceptar: { show: false, disable: false },
          cancelar: { show: false, disable: false },
          dinamico: [
            {
              clase: 'btn btn-blanco mr-2',
              function: (instance) => {
                this.closeModal(instance);
              },
              label: 'Cancelaro',
              disable: false,
            },
            { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
          ],
        },
      });
    }
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.handleModalForm({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p>
      ${obj.texto}
    </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
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
      const actualPagination = this.tServ.getPaginationById('facturasPendientes');
      this.pedirFacturasPorCliente(this.clienteAdepositar.id, actualPagination);
      this.resetVariables();

      const obj_print = { data: recibo, type: 'recibo_ingreso' };

      this.pdfServ
        .generatePdf({ oPdf: obj_print, imprimir: true })
        .then(async (res) => {
          if (res.status === 'si') {
          } else fun.toastError(res.msg, 'ERROR');

          this.layServ.nextCheckCuadreToday(true);
        })
        .catch((err) => fun.toastError(err.msg, 'ERROR'));
    });
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
        item.rowChanged.pagoT = false;
        this.tablas.resetInput('especificar', 'monto', item.index, true, 0);
      }
    }

    if (item.cambio === 'monto') {
      if (!item.value) {
        fun.toastWarning('Debe de introducir un Monto', 'AVISO');
        this.tablas.enfocarInput('input-' + item.index);
      }
      const total = item.body[item.index].balance;
      const monto = fun.desformatear(item.value);

      if (monto === total) item.rowChanged.pagoT = true;

      if (monto > total) {
        this.ExisteMontoMayor = true;
        fun.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        item.rowChanged.monto = item.rowChanged.balance;
        this.tablas.enfocarInput('input-' + item.index);
      } else {
        this.ExisteMontoMayor = false;
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

      this.handleModalForm({
        component: BuscarClienteSuplidorComponent,
        inputs: obj,
        id: 'buscarCliente',
        header: 'Buscar cliente',
        width: '900px',
        height: '500px',
        botones: {
          aceptar: { show: false, disable: false },
          cancelar: { show: false, disable: false },
        },
      });
      this.desEnfocarInput('clienteI');
    }
  }
}
