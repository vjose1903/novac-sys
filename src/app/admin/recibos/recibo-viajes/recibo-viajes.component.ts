import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { ModalService } from '../../components/modal/modal.service';
import { Subscription } from 'rxjs';
import { FunctionService } from '../../../core/services/functions.service';
import { TablasService } from '../../components/tablas/tablas.service';
import { IpcService } from '../../../core/services/ipc.service';
import { LayoutService } from '../../layout/layout.service';
import { mixinClass } from '../../mixinClass';

@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
})
export class ReciboViajesComponent extends mixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla', { static: false }) cardTabla: ElementRef;
  info = [
    {
      titulo: '1',
      key: 'estatus',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '1.5rem' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'Fecha Fact.',
      key: 'fecha',
    },
    {
      titulo: 'Cliente',
      key: 'cliente_mostrar',
    },
    {
      titulo: 'NCF',
      key: 'numero_comprobante',
    },
    {
      titulo: 'Total facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
  ];
  viajes;
  viaje_selected = { id: -1 } as any;
  ultimo_pago;
  chofer_id;
  camion_id;
  is_chofer_selected = false;
  is_choferes_register = false;

  is_camiones_register = false;
  is_camion_selected = false;
  camiones = [];
  choferes = [];
  salio_en_chofer = false;
  salio_en_camion = false;

  viajes_pendientes_cant = 0;
  viajes_completados_cant = 0;
  viajes_cant_porciento: any;
  viajes_cant: any;
  tipoModal: string;
  subObj: Subscription;
  subDeci: Subscription;
  forma_pago: any;
  total_recibido: any;
  totalPagado = 0;
  totalPagadoPorciento: any = 0;
  monto_pendiente = 0;
  have_incidencia = false;
  incidencia = '';

  constructor(
    private dbServ: DBservice,
    public _ipc: IpcService,
    public mServ: ModalService,
    public layServ: LayoutService,
    private fun: FunctionService,
    private tServ: TablasService,
  ) {
    super(mServ, _ipc, layServ);
  }

  ngOnInit() {
    this._init_mixin();
    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipo_modal === 'cambio') {
        this.forma_pago = res.data.forma_pago;
        this.total_recibido = res.data.dinero;
        this.IMPRIMIR();
        this.mServ.ModalObj(undefined);
      }
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== undefined) {
        this.reversarUltimaTransaccion(res);

        this.mServ.ModalDecision(undefined);
      }
    });
    this.necesarioStart();
  }

  initCambioMenu() {
    if (this.cambioMenu_) {
      console.log('viajes --');
      this.layServ.nextDecisionCambioMenu(true);
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
    this.subObj.unsubscribe();
    this.subDeci.unsubscribe();

    // this._ipc.removeListener('printRes');
  }

  necesarioStart() {
    this.getViajes(this.tServ.obj_paginate);
    this.getChoferes();
    this.getCamiones();
  }

  formatoNumero(num) {
    return GLOBAL.numFormatTwoDecimals(num);
  }

  async getChoferes() {
    this.dbServ.getUserByRole('C').subscribe((res) => {
      this.choferes = res;
      this.is_choferes_register = this.choferes.length > 0 ? true : false;
    });
  }
  async getCamiones() {
    this.dbServ.getVehiculosFiltrados(' ', 0, 0, false).subscribe((res) => {
      this.camiones = res;
      this.is_camiones_register = this.camiones.length > 0 ? true : false;
    });
  }

  async getViajes(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getViajesByCompletada(palabra_a_buscar, page, per_page, true).toPromise();
      console.log(' res --> ', res);

      const fechaA = moment().format('YYYY-MM-DD');
      res.data.map((fact) => {
        const pago_a_tiempo = fact.condicion === 'Contado' ? true : fact.fecha_vencimiento > fechaA ? true : false;

        fact.estatus = fact.fecha_completada ? 'fas fa-check' : fact.pagos.length > 0 ? 'far fa-check-square' : 'far fa-square';
        fact.colorEstado = fact.fecha_completada ? 'green' : fact.pagos.length > 0 ? 'yellow' : 'red';
        fact.customStyles = { 'td-estatus': { width: '1.5rem' } };
        fact.cliente_mostrar = fact.cliente.nombre;
        fact.fecha = moment(fact.fecha_equivalente).format('DD-MM-YYYY');
        fact.total_factura = this.recalcularMonto(fact.total_factura, fact.notas);
        fact.balance = this.recalcularMonto(fact.balance, fact.notas);
        fact['pago_a_tiempo'] = pago_a_tiempo;

        return fact;
      });

      this.viajes = res.data;
      this.viajes_cant = res.total_registros ? res.total_registros : 0;

      this.viajes_completados_cant = this.viajes.filter((v) => v.fecha_completada !== null).length;
      this.viajes_pendientes_cant = this.viajes.filter((v) => v.fecha_completada === null).length;

      setTimeout(() => {
        this.viajes_cant_porciento = (this.viajes_completados_cant / this.viajes_cant) * 100;
        this.viajes_cant_porciento = GLOBAL.numFormatTwoDecimals(this.viajes_cant_porciento);
      }, 5);

      this.viajes.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
    } catch (error) {
      console.error(error);

      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR', true);
      }
      //  else {
      //   this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR', true);
      // }
    }
  }

  // ----------------------------------------
  checkChofer() {
    if (this.choferes.length > 0) {
      if (this.chofer_id) {
        this.is_chofer_selected = true;
      } else {
        this.is_chofer_selected = false;
      }
    } else {
      this.is_chofer_selected = false;
    }
    this.salio_en_chofer = true;
  }

  entroEnChofer() {
    this.salio_en_chofer = false;
  }
  // ----------------------------------------
  checkCamion() {
    if (this.camiones.length > 0) {
      if (this.camion_id) {
        this.is_camion_selected = true;
      } else {
        this.is_camion_selected = false;
      }
    } else {
      this.is_camion_selected = false;
    }
    this.salio_en_camion = true;
  }

  entroEnCamion() {
    this.salio_en_camion = false;
  }
  // ----------------------------------------

  abilitarRecibir() {
    let res = false;
    if (this.is_chofer_selected && this.is_camion_selected) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  verViaje(arg) {
    this.monto_pendiente = 0;
    this.totalPagado = 0;
    this.totalPagadoPorciento = 0;

    this.viaje_selected = arg;
    this.viaje_selected.pagos.forEach((abono) => {
      this.totalPagado += abono.deposito;
    });

    this.monto_pendiente = this.viaje_selected.total_factura - this.totalPagado;
    this.totalPagadoPorciento = (this.totalPagado / this.viaje_selected.total_factura) * 100;
    this.totalPagadoPorciento = GLOBAL.numFormatTwoDecimals(this.totalPagadoPorciento);

    const lengthpagos = this.viaje_selected.pagos.length;
    this.ultimo_pago = this.viaje_selected.pagos[lengthpagos - 1];
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

  accion(bool, tipo) {
    if (bool) {
      let obj = {};
      if (tipo === 'cambio') {
        obj = { total_factura: this.monto_pendiente, devuelta: 0, tipo__: 'no_devuelta', factura_de: 'venta' };
        this.tipoModal = tipo;
      } else if (tipo === 'dinamico_texto') {
        this.tipoModal = 'reversar_transaccion';
        this.mServ.modalTipo('dinamico_texto');
        obj['texto_modal'] = 'Seguro de que desea reversar la ultima transaccion realizada a la factura ' + this.viaje_selected.numero_comprobante;
      }

      this.mServ.modalTipo(tipo);
      this.abrirModal(obj);
    } else {
      if (tipo === 'cambio' || tipo === 'cancelar') {
        this.resetVariables();
      }
    }
  }

  async reversarUltimaTransaccion(arg) {
    if (arg) {
      try {
        const res = await this.dbServ.revertirLastReciboByFacturaId(this.viaje_selected.id).toPromise();

        this.getViajes(this.tServ.obj_paginate);
        this.resetVariables();
      } catch (error) {
        console.error(error);
      }
    }
  }

  formarDetalle() {
    const temp = [];

    const pagado_total = this.viaje_selected.total_factura === this.total_recibido;
    temp.push({
      cabecera_factura_id: this.viaje_selected.id,
      pago_total: pagado_total,
      deposito: GLOBAL.desformatear(this.total_recibido),
      descripcion: pagado_total
        ? 'Saldo ' + this.viaje_selected.numero_comprobante + ' ' + this.viaje_selected.fecha_equivalente
        : 'Abono ' + this.viaje_selected.numero_comprobante + ' ' + this.viaje_selected.fecha_equivalente,
      pago_a_tiempo: this.viaje_selected.pago_a_tiempo,
    });

    return temp;
  }

  abrirModal(obj) {
    if (obj) {
      this.mServ.ModalSeleccion(obj);
    }
    this.mServ.mostrarModal(true);
  }

  IMPRIMIR() {
    const empleado = this.fun.getUser();

    const obj = {
      cliente_id: this.viaje_selected.cliente_id,
      user_id: empleado.id,
      total: this.total_recibido,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: 0,
      numero_recibo: null,
      chofer: Number(this.chofer_id),
      vehiculo_id: Number(this.camion_id),
    };

    obj['detalle_recibos_attributes'] = this.formarDetalle();

    this.dbServ.createRecibo(obj).subscribe(
      async (res) => {
        const obj = {
          data: res,
          type: 'recibo_ingreso',
        };

        this.dbServ.toastSuccess('Recibo de ingreso realizado.', 'CORRECTO');
        this.getViajes(this.tServ.obj_paginate);
        this.resetVariables();

        // this._ipc.send('print', obj);

        // await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {

        //   if (res.status) {
        //   } else {
        //     this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
        //   }
        // });
      },
      (err) => {
        console.error(err);

        if (err.error) {
          this.dbServ.toastError(err.error.msg, 'ERROR', true);
        }
        // else {
        //   this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR', true);
        // }
      },
    );
  }
  resetVariables() {
    this.ultimo_pago = undefined;
    this.viaje_selected = { id: -1 };
    this.chofer_id = undefined;
    this.camion_id = undefined;
    this.is_chofer_selected = false;
    this.is_camion_selected = false;
    this.salio_en_chofer = false;
    this.salio_en_camion = false;
    this.have_incidencia = false;
    this.forma_pago = undefined;
    this.total_recibido = undefined;
    this.monto_pendiente = 0;
    this.totalPagado = 0;
    this.totalPagadoPorciento = 0;
    this.incidencia = '';
  }
}
