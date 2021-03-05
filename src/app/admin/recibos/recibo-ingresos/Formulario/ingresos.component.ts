import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DBservice } from '../../../../core/services/bdservice.service';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { GLOBAL } from '../../../../core/services/GLOBAL';
import * as moment from 'moment';
import { NgSelectConfig } from '@ng-select/ng-select';
import { TablasComponent } from '../../../components/tablas/tablas.component';
import { ModalService } from '../../../components/modal/modal.service';
import { TablasService } from '../../../components/tablas/tablas.service';
import { IpcService } from '../../../../core/services/ipc.service';
import { FunctionService } from '../../../../core/services/functions.service';

import { LayoutService } from '../../../../admin/layout/layout.service';
import { mixinClass } from '../../../mixinClass';
import { PdfService } from '../../../../core/services/pdf/pdf.service';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
})
export class IngresosComponent extends mixinClass implements OnInit, OnDestroy {
  element: any;
  listaClientes;
  clienteAdepositar: any;
  Facturas;
  tipo_recibo = 'Pago factura';
  facturas_selected = [];
  articuloEnTurno = null;
  articuloEnTurnoid = null;
  medidaEnTurno = null;

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
      customClass: true,
      estilos: [{ width: '2rem' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'NCF',
      customClass: true,
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
      customClass: true,
      estilos: [{ width: '7rem' }],
      disable: {
        getDisabled: true,
        campo: 'is_viaje',
      },
      title: '',
    },
    {
      titulo: 'Pago Total',
      tipo: 'check',
      key: 'pagoT',
      customClass: true,
      estilos: [{ width: '6rem' }],
      disable: {
        getDisabled: true,
        campo: 'select',
      },
      title: '',
    },
    {
      titulo: 'Monto a pagar',
      tipo: 'input',
      key: 'monto',
      checkNumber: true,
      disable: {
        getDisabled: true,
        campo: 'select',
        campo2: 'pagoT',
      },
      title: '',
    },
  ];
  tipoFacturas;
  AllSelected = false;
  precioEnTurno: any;
  ExisteMontoMayor: boolean;
  tipoModal: string;
  detalleYtotal: any;
  Devuelta: any;
  forma_pago: any;

  totalFacturado: number;
  totalPagado: number;
  totalPagadoPorciento: number;
  recibiendo = 0;
  restando = 0;

  constructor(
    private config: NgSelectConfig,
    public mServ: ModalService,
    private fun: FunctionService,
    private dbServ: DBservice,
    public _ipc: IpcService,
    private tServ: TablasService,
    public layServ: LayoutService,
    public pdfServ: PdfService,
  ) {
    super(mServ, _ipc, layServ);
    this.config.notFoundText = 'Articulo no existe';
  }

  ngOnInit() {
    this._init_mixin({ _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res'] });

    this.necesarioStart();
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  decisionModal(res: any) {
    if (res && this.tipoModal === 'cancelar_ingreso') {
      this.cancelarIgreso();
    }
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarCliente') {
      this.clienteAdepositar = res.data;

      this.clienteAdepositar.balance = this.clienteAdepositar.balance ? this.clienteAdepositar.balance : 0;

      (document.getElementById('clienteI') as any).value = res.data.nombre;
      this.pedirFacturasPorCliente(res.data.id, this.tServ.obj_paginate);
    } else if (res && res.tipo_modal === 'cambio') {
      this.Devuelta = res.data.devuelta;
      this.forma_pago = res.data.forma_pago;
      this.sendIngreso();
    }
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  getIcon() {
    if (this.AllSelected) {
      return { icon: 'fa-check-square', tooltip: 'Deseleccionar Todos' };
    } else {
      return { icon: 'fa-square', tooltip: 'Seleccionar Todos' };
    }
  }
  selectAll() {
    this.AllSelected = !this.AllSelected;
    let select = false;
    if (this.AllSelected) {
      select = false;
    } else {
      select = true;
    }

    this.Facturas.forEach((fact, j) => {
      if (select) {
        if (fact.is_viaje && fact.select) {
          this.Facturas[j].pagoT = false;
          this.Facturas[j].select = false;
          this.Facturas[j].monto = 0;

          this.tablas.resetInput('especificar', 'monto', j, true, 0);

          const i = this.facturas_selected.indexOf(fact);
          _.pullAt(this.facturas_selected, i);
        }
      } else {
        if (fact.is_viaje && !fact.select) {
          this.Facturas[j].monto = GLOBAL.numFormatTwoDecimals(this.Facturas[j].total_factura);
          this.Facturas[j].select = true;
          this.facturas_selected.push(fact);
        }
      }
    });

    this.sumarTotalRecibo();
  }

  recalcularMonto(monto_original, notas) {
    let monto = monto_original;
    for (let i = 0; i < notas.length; i++) {
      const element = notas[i];
      const totalABS = Math.abs(element.total_factura);

      if (element.tipo_factura_id === 5) {
        monto -= totalABS;
      } else if (element.tipo_factura_id === 4) {
        monto += totalABS;
      }
    }
    return monto;
  }

  async pedirFacturasPorCliente(cliente_id, e) {
    this.Facturas = undefined;
    this.totalFacturado = 0;
    this.totalPagado = 0;
    this.totalPagadoPorciento = 0;

    const page = e.page;
    const per_page = e.per_page;

    try {
      const fechaA = moment().format('YYYY-MM-DD');
      this.Facturas = await this.dbServ
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
                // val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));

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
                val.is_viaje = !val.is_viaje;

                this.totalFacturado += val.total_factura;
                this.totalPagadoPorciento = (this.totalPagado / this.totalFacturado) * 100;
                this.totalPagadoPorciento = parseFloat(GLOBAL.numFormatTwoDecimals(this.totalPagadoPorciento));
                return val;
              })),
          ),
        )
        .toPromise();

      this.Facturas.sort((a, b) => {
        return a.id < b.id ? 1 : -1;
      });
      let total = 0;

      this.Facturas.forEach((element) => {
        total += element.balance;
      });

      const obj = {
        total: this.Facturas.lenght,
        tabla: 'facturasPendientes',
      };

      this.tServ.Func_total_paginas(obj);
    } catch (error) {
      console.error(error);
      this.dbServ.toastError(error, 'ERROR', true);
    }
  }
  async necesarioStart() {
    this.enfocarInput('clienteI');
  }

  clickVerPagos(arg) {
    if (arg.column === 'historyPagos') {
      const pagos = this.Facturas[arg.index].pagos;
      if (pagos.length > 0) {
        for (let i = 0; i < pagos.length; i++) {
          const pago = pagos[i];
          pago.numero_recibo = _.padStart(pago.numero_recibo, 8, '0');
          pago.recibo_created_at = moment(pago.fecha_equivalente).format('DD/MM/YYYY');
        }
        this.mServ.modalTipo('historial_pago');
        // this.mServ.ModalTablaHeight(true);

        const obj = {
          total: pagos.length,
          tabla: 'historial_pago',
        };

        this.tServ.Func_total_paginas(obj);
        this.abrirModal(pagos);
      }
    }
  }

  abilitarBtnConfirmar() {
    let res = true;

    if (this.facturas_selected.length > 0) {
      res = false;
    }

    return res;
  }

  cancelarIgreso() {
    this.Facturas = null;
    this.clienteAdepositar = undefined;
    (document.getElementById('clienteI') as any).value = null;
    this.AllSelected = false;
    this.resetVariables();
    setTimeout(() => {
      this.enfocarInput('clienteI');
    }, 250);
  }

  formarDetalleRecibos() {
    const temp = [];
    let total = 0;
    for (let i = 0; i < this.facturas_selected.length; i++) {
      const fact = this.facturas_selected[i];

      temp.push({
        cabecera_factura_id: fact.id,
        pago_total: fact.pagoT,
        deposito: GLOBAL.desformatear(fact.monto),
        descripcion:
          this.tipo_recibo === 'Pago factura'
            ? fact.pagoT
              ? 'Saldo ' + fact.numero_comprobante + ' ' + fact.fecha_equivalente
              : 'Abono ' + fact.numero_comprobante + ' ' + fact.fecha_equivalente
            : '',
        pago_a_tiempo: fact.pago_a_tiempo,
      });

      total += GLOBAL.desformatear(fact.monto);
    }

    const obj = {
      total_recibo: total,
      detalle: temp,
    };

    return obj;
  }

  abrirModal(arg?) {
    if (arg) {
      this.mServ.ModalSeleccion(arg);
    }
    this.mServ.mostrarModal(true);
  }

  abrirModalDinamicText(tipo) {
    const obj = {};
    if (tipo === 'cancelar') {
      this.tipoModal = 'cancelar_ingreso';
      this.mServ.modalTipo('dinamico_texto');

      obj['texto_modal'] = 'Seguro de que desea cancelar la operacion.';
    }
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  async confirmarIgreso() {
    if (this.ExisteMontoMayor) {
      this.dbServ.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR', true);
    } else {
      this.detalleYtotal = await this.formarDetalleRecibos();
      const obj = { total_factura: this.detalleYtotal.total_recibo, devuelta: 0, factura_de: 'ingreso', tipo__: 'devuelta' };
      this.mServ.modalTipo('cambio');
      this.tipoModal = 'cambio';
      this.abrirModal(obj);
    }
  }

  async sendIngreso() {
    const empleado = this.fun.getUser();

    // const tipo = this.tipoFacturas.filter((val) => val.descripcion === this.tipo_recibo)[0];
    const obj = {
      cliente_id: this.clienteAdepositar.id,
      user_id: empleado.id,
      total: 0,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: this.Devuelta,
      numero_recibo: null,
      estado: true,
    };

    obj.total = this.detalleYtotal.total_recibo;
    obj['detalle_recibos_attributes'] = this.detalleYtotal.detalle;

    try {
      const res = await this.dbServ.createRecibo(obj).toPromise();

      this.dbServ.toastSuccess('Recibo de ingreso realizado.', 'CORRECTO');
      this.clienteAdepositar.balance = res.cliente.balance;

      this.pedirFacturasPorCliente(this.clienteAdepositar.id, this.tServ.obj_paginate);
      this.resetVariables();

      const obj_print = {
        data: res,
        type: 'recibo_ingreso',
      };

      this.pdfServ.generatePdf(obj_print, (res) => {
        if (res.status === 'si') {
          const objBase = {
            base64: res.body,
            filename: res.file,
            type: 'recibo_ingreso',
          };
          this._ipc.send('printBase64', objBase);
        }
      });
    } catch (error) {
      this.dbServ.toastError(error.error.msg, 'ERROR', true);
    }
  }

  ipcBase64Resonse(res) {
    if (res.status === 'si') {
    } else {
      this.dbServ.toastError(res.msg, 'ERROR', true);
    }
  }

  resetVariables() {
    this.forma_pago = null;
    this.Devuelta = null;
    this.detalleYtotal = undefined;
    this.facturas_selected = [];
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  selectContenido(arg) {
    this.element = document.getElementById(arg);
    this.element.select();
  }

  getInfoChange(item) {
    if (item.cambio === 'pagoT' && item.value) {
      this.tablas.resetInput('balance', 'monto', item.index, true);
      this.modificarFacturaSelected(item);
    }
    if (item.cambio === 'select') {
      if (!item.value) {
        this.Facturas[item.index].pagoT = false;
        this.tablas.resetInput('especificar', 'monto', item.index, true, 0);

        const i = this.facturas_selected.indexOf(item.body[item.index]);
        _.pullAt(this.facturas_selected, i);
      } else {
        this.facturas_selected.push(item.body[item.index]);
      }
    }

    if (item.cambio === 'monto') {
      if (!item.value) {
        this.dbServ.toastWarning('Debe de introducir un Monto', 'AVISO');
        this.tablas.enfocarInput('input-' + item.index);
      }
      const total = item.body[item.index].balance;
      const monto = GLOBAL.desformatear(item.value);

      if (monto === total) {
        this.Facturas[item.index].pagoT = true;
      }

      if (monto > total) {
        this.ExisteMontoMayor = true;
        this.dbServ.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        this.Facturas[item.index].monto = this.Facturas[item.index].balance;
        this.tablas.enfocarInput('input-' + item.index);
      } else {
        this.ExisteMontoMayor = false;
      }
      this.modificarFacturaSelected(item);
    }
    this.sumarTotalRecibo();
  }

  sumarTotalRecibo() {
    this.recibiendo = 0;
    this.restando = 0;

    this.facturas_selected.forEach((factura) => {
      this.recibiendo += GLOBAL.desformatear(factura.monto);

      this.restando = this.clienteAdepositar.balance - this.recibiendo;
    });
  }

  modificarFacturaSelected(item) {
    const index = _.findIndex(this.facturas_selected, (fact: any) => {
      return fact.id === item.body[item.index].id;
    });

    if (index !== -1) {
      this.facturas_selected[index] = item.body[item.index];
    }
  }

  async abrirModalFiltro(nombre) {
    if (nombre || nombre === ' ') {
      this.mServ.modalTipo('buscarCliente');
      const obj = {
        data: [],
        filtrarCliente: nombre,
      };

      this.mServ.ModalSeleccion(obj);
      this.mServ.mostrarModal(true);
      // this.mServ.ModalTablaHeight(true);
    }
  }

  async saltar(campo, valor?) {
    if (valor === 'Pago factura') {
      this.enfocarInput(campo);
    } else if (valor === 'Compra adelantada') {
      this.medidaEnTurno = null;
    }
  }
}
