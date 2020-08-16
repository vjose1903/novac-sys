import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { NgSelectConfig } from '@ng-select/ng-select';
import { TablasComponent } from '../components/tablas/tablas.component';
import { ModalService } from '../components/modal/modal.service';
import { obj_paginate } from '../components/tablas/tablas.service';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
})
export class IngresosComponent implements OnInit, OnDestroy {
  element: any;
  listaClientes;
  clienteAdepositar: any;
  Facturas;
  tipo_recibo = 'Pago factura';
  facturas_selected = [];
  articuloEnTurno = null;
  articuloEnTurnoid = null;
  medidaEnTurno = null;
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: '',
      key: 'historyPagos',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
    },
    {
      titulo: 'Numero Fact',
      key: 'secuencia',
    },
    {
      titulo: 'Tipo',
      key: 'tipo_factura',
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Fecha Vencimiento',
      key: 'fechaV',
      color: true,
    },
    {
      titulo: 'Total tacturado',
      key: 'total_factura',
      formatoNumero: true,
    },
    {
      titulo: 'Balance tactura',
      key: 'balance',
      formatoNumero: true,
    },
    {
      titulo: 'Seleccione',
      tipo: 'check',
      key: 'select',

      disable: {
        getDisabled: false,
        campo: '',
      },
      title: '',
    },
    {
      titulo: 'Pago Total',
      tipo: 'check',
      key: 'pagoT',
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
  sub: Subscription;
  articulos: any;
  precioEnTurno: any;
  ExisteMontoMayor: boolean;
  tipoModal: string;
  detalleYtotal: any;
  Devuelta: any;
  forma_pago: any;
  altoDiv: number;

  obj_paginate_ = obj_paginate;

  constructor(private config: NgSelectConfig, private mServ: ModalService, private obsServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder) {
    this.config.notFoundText = 'Articulo no existe';
  }

  ngOnInit() {
    this.necesarioStar();

    this.sub = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipoModal === 'buscarCliente') {
        this.clienteAdepositar = res;
        (document.getElementById('clienteI') as any).value = res.nombre;
        this.pedirFacturasPorCliente(res.id);
        this.mServ.ModalObj(undefined);
      } else if (res && res.tipoModal === 'cambio') {
        this.Devuelta = res.devuelta;
        this.forma_pago = res.forma_pago;
        this.sendIngreso();
        this.mServ.ModalObj(undefined);
      }
    });
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
        if (fact.select) {
          this.Facturas[j].pagoT = true;
          this.Facturas[j].select = false;
          this.tablas.resetInput('total_factura', 'monto', j, true);

          const i = this.facturas_selected.indexOf(fact);
          _.pullAt(this.facturas_selected, i);
        }
      } else {
        if (!fact.select) {
          this.Facturas[j].select = true;
          this.facturas_selected.push(fact);
        }
      }
    });
    console.log(this.facturas_selected);
  }

  selectArticulo(arg, valor?) {
    if (arg === 'articulo') {
      this.medidaEnTurno = -1;
    } else if (arg === 'medida') {
      this.precioEnTurno = this.articuloEnTurno.medidas.filter((val) => val.medida === valor)[0].precio;
    }
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

  calcularHeigth() {
    setTimeout(() => {
      console.log(document.getElementById('cardTabla'));

      this.altoDiv = document.getElementById('cardTabla').offsetHeight - 10;
    }, 10);
  }

  async pedirFacturasPorCliente(cliente_id) {
    try {
      const fechaA = moment().format('YYYY-MM-DD');
      this.Facturas = await this.dbServ
        .getFacturasByClienteIdAndPagada(cliente_id, false)
        .pipe(
          map(
            (fact) =>
              (fact = fact.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_facturacion).format('DD-MM-YYYY');
                val.fechaV = moment(val.fecha_vencimiento).format('DD-MM-YYYY');
                val.select = false;
                val.pagoT = true;
                val.pago_a_tiempo = val.fecha_vencimiento > fechaA ? true : false;
                val.text_color = val.fecha_vencimiento < fechaA ? 'red' : 'black';

                val.balance = this.recalcularMonto(val.balance, val.notas);
                val.total_factura = this.recalcularMonto(val.total_factura, val.notas);
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));
                val.historyPagos = val.pagos.length > 0 ? 'fas fa-comment-dollar' : 'far fa-comment';
                val.colorEstado = val.pagos.length > 0 ? 'black' : 'gris-claro';
                val.iconHover = val.pagos.length > 0 ? true : false;

                return val;
              })),
          ),
        )
        .toPromise();
      this.Facturas.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
      let total = 0;

      this.Facturas.forEach((element) => {
        total += element.balance;
      });
      this.calcularHeigth();
      console.log(total);
    } catch (error) {
      console.error(error);
      this.dbServ.toastError(error, 'ERROR');
    }
  }
  async necesarioStar() {
    await this.getTipoFacturas();

    this.enfocarInput('clienteI');
  }

  clickVerPagos(arg) {
    const pagos = arg.pagos;
    if (pagos.length > 0) {
      for (let i = 0; i < pagos.length; i++) {
        const pago = pagos[i];
        pago.numero_recibo = _.padStart(pago.numero_recibo, 8, '0');
        pago.recibo_created_at = moment(pago.recibo_created_at).format('DD/MM/YYYY');
      }
      this.mServ.modalTipo('historial_pago');
      console.log(pagos);

      this.abrirModal(pagos);
    }
  }

  async getTipoFacturas() {
    try {
      this.tipoFacturas = await this.dbServ.getTiposRecibos().toPromise();
      console.log(this.tipoFacturas);
    } catch (error) {
      console.error(error);
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
    this.enfocarInput('clienteI');
    (document.getElementById('clienteI') as any).value = null;
    this.AllSelected = false;
    this.resetVariables();
  }

  formarDetalleRecibos() {
    const temp = [];
    let total = 0;
    for (let i = 0; i < this.facturas_selected.length; i++) {
      const fact = this.facturas_selected[i];
      console.log(fact);

      temp.push({
        cabecera_factura_id: fact.id,
        pago_total: fact.pagoT,
        deposito: GLOBAL.desformatear(fact.monto),
        descripcion: this.tipo_recibo === 'Pago factura' ? (fact.pagoT ? 'Saldo Factura ' + fact.secuencia : 'Abono ' + fact.monto + ' pesos a factura ' + fact.secuencia) : '',
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

  async confirmarIgreso() {
    if (this.ExisteMontoMayor) {
      this.dbServ.toastError('Revisar pagos, existe uno con un monto mayor al balance de la factura', 'ERROR');
    } else {
      this.detalleYtotal = await this.formarDetalleRecibos();
      const obj = { total_factura: this.detalleYtotal.total_recibo, devuelta: 0, factura_de: 'ingreso', tipo__: 'devuelta' };
      this.mServ.modalTipo('cambio');
      this.tipoModal = 'cambio';
      this.abrirModal(obj);
    }
  }

  sendIngreso() {
    const empleado = JSON.parse(this.dbServ.getEmpleado());

    const tipo = this.tipoFacturas.filter((val) => val.descripcion === this.tipo_recibo)[0];
    const obj = {
      cliente_id: this.clienteAdepositar.id,
      user_id: empleado.id,
      total: 0,
      forma_pago: this.forma_pago,
      tipo_recibo_id: tipo.id,
      devuelta: this.Devuelta,
    };

    obj.total = this.detalleYtotal.total_recibo;
    obj['detalle_recibos_attributes'] = this.detalleYtotal.detalle;
    console.log(obj);

    this.dbServ.createRecibo(obj).subscribe(
      (res) => {
        console.log(res);
        this.dbServ.toastSuccess('Recibo de ingreso realizado.', 'CORRECTO');
        const nuevoBalance = this.clienteAdepositar.balance - res.total;
        this.clienteAdepositar.balance = GLOBAL.duplicarJson(nuevoBalance);
        this.pedirFacturasPorCliente(this.clienteAdepositar.id);
        this.resetVariables();
      },
      (err) => {
        console.error(err);
        console.log('-----');
        console.log('-----');
        console.log('-----');

        if (err.error) {
          this.dbServ.toastError(err.error.msg, 'ERROR');
        } else {
          this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR');
        }
      },
    );
  }
  resetVariables() {
    console.log('//////////////////////');

    console.log('reseteo de vaiables');
    console.log('//////////////////////');

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
        this.Facturas[item.index].pagoT = true;
        this.tablas.resetInput('balance', 'monto', item.index, true);

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
      const total = item.body[item.index].total_factura;
      const monto = GLOBAL.desformatear(item.value);

      if (monto > total) {
        this.ExisteMontoMayor = true;
        this.dbServ.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        this.tablas.enfocarInput('input-' + item.index);
      } else {
        this.ExisteMontoMayor = false;
      }
      this.modificarFacturaSelected(item);
    }
    console.log(this.facturas_selected);
  }

  modificarFacturaSelected(item) {
    const index = _.findIndex(this.facturas_selected, (fact: any) => {
      return fact.id === item.body[item.index].id;
    });
    if (index !== -1) {
      this.facturas_selected[index] = item.body[item.index];
    }
  }

  quitarContadoDeLista() {
    const temp = JSON.parse(JSON.stringify(this.listaClientes));
    this.listaClientes = [];
    const cliente = temp.filter((cli) => cli.nombre === 'Cliente contado');
    const index = _.indexOf(temp, cliente[0]);

    _.pullAt(temp, index);
    this.listaClientes = temp;
  }

  async pedirClientes(e, buscando) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = buscando === '' || buscando === null || buscando === undefined ? ' ' : buscando;

      const res = await this.dbServ.getClientesFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

      res.data.map((cli) => {
        cli.nombre = GLOBAL.Capitalice(cli.nombre);
        cli.apellido = GLOBAL.Capitalice(cli.apellido);
        cli.documentos_de_identidad.map((docu) => {
          if (docu.principal) {
            cli.documento_identidad = docu.documento;
          }
        });
        return cli;
      });

      this.listaClientes = res.data;
    } catch (error) {
      console.error(error);
      this.dbServ.toastError('Error buscando clientes registrados.', 'ERROR');
    }
  }

  async abrirModalFiltro(nombre) {
    await this.pedirClientes(this.obj_paginate_, nombre);

    this.mServ.modalTipo('buscarCliente');

    const obj = {
      data: this.listaClientes,
      filtrarCliente: nombre,
    };

    this.mServ.ModalSeleccion(obj);

    this.mServ.mostrarModal(true);
    this.mServ.ModalTablaHeight(true);
  }

  async saltar(campo, valor?) {
    if (valor === 'Pago factura') {
      this.enfocarInput(campo);
    } else if (valor === 'Compra adelantada') {
      this.medidaEnTurno = null;
    }
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
