import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { DBservice } from '../../core/services/bdservice.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { obj_paginate } from '../components/tablas/tablas.service';
import { GLOBAL } from '../../core/services/GLOBAL';
import { ModalService } from '../components/modal/modal.service';
import { Subscription } from 'rxjs';
import { FunctionService } from '../../core/services/functions.service';

@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
})
export class ReciboViajesComponent implements OnInit, OnDestroy {
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
  is_chofer_selected = false;
  is_choferes_register = false;
  choferes: any;
  salio_en_chofer = false;

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
  constructor(private dbServ: DBservice, private mServ: ModalService, private fun: FunctionService) {}

  ngOnInit() {
    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipo_modal === 'cambio') {
        console.log(res.data);

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

  necesarioStart() {
    this.getViajes(obj_paginate);
    this.getChoferes();
  }

  ngOnDestroy() {
    this.subObj.unsubscribe();
    this.subDeci.unsubscribe();
  }

  formatoNumero(num) {
    return GLOBAL.numFormatTwoDecimals(num);
  }

  async getChoferes() {
    this.dbServ.getUserByRole('C').subscribe((res) => {
      this.choferes = res;
      this.is_choferes_register = this.choferes.length > 0 ? true : false;
      console.log('choferes ', this.choferes);
      console.log('is_choferes_register ', this.is_choferes_register);
    });
  }

  async getViajes(e) {
    this.viajes = undefined;
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getViajesByCompletada(palabra_a_buscar, page, per_page, true).toPromise();

      const fechaA = moment().format('YYYY-MM-DD');
      res.data.map((fact) => {
        const pago_a_tiempo = fact.condicion === 'Contado' ? true : fact.fecha_vencimiento > fechaA ? true : false;

        fact.estatus = fact.fecha_completada ? 'fas fa-check' : fact.pagos.length > 0 ? 'far fa-check-square' : 'far fa-square';
        fact.colorEstado = fact.fecha_completada ? 'green' : fact.pagos.length > 0 ? 'yellow' : 'red';
        fact.customStyles = [{ 'td-estatus': { estilos: [{ width: '1.5rem' }] } }];
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

      console.log(';;;;;;;;;; this.viajes ', this.viajes);
    } catch (error) {
      console.error(error);

      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR');
      } else {
        this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR');
      }
    }
  }
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

    console.log(arg);
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
      if (tipo === 'cambio') {
        this.resetVariables();
      }
    }
  }

  async reversarUltimaTransaccion(arg) {
    if (arg) {
      try {
        const res = await this.dbServ.revertirLastReciboByFacturaId(this.viaje_selected.id).toPromise();

        this.getViajes(obj_paginate);
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
    console.log('-------- aqui imprimir -------');
    const empleado = this.fun.getUser();

    console.log(this.viaje_selected.cliente_id);

    const obj = {
      cliente_id: this.viaje_selected.cliente_id,
      user_id: empleado.id,
      total: this.total_recibido,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: 0,
      numero_recibo: null,
      chofer: Number(this.chofer_id),
    };

    obj['detalle_recibos_attributes'] = this.formarDetalle();
    console.log(obj);

    this.dbServ.createRecibo(obj).subscribe(
      async (res) => {
        console.log(res);
        const obj = {
          data: res,
          type: 'recibo_ingreso',
        };

        this.dbServ.toastSuccess('Recibo de ingreso realizado.', 'CORRECTO');
        this.getViajes(obj_paginate);
        this.resetVariables();

        // this._ipc.send('print', obj);

        // await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
        //   console.log(res);

        //   if (res.status) {
        //   } else {
        //     this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
        //   }
        // });
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
    this.ultimo_pago = undefined;
    this.viaje_selected = { id: -1 };
    this.chofer_id = undefined;
    this.is_chofer_selected = false;
    this.is_choferes_register = false;
    this.salio_en_chofer = false;
    this.forma_pago = undefined;
    this.total_recibido = undefined;
    this.monto_pendiente = 0;
    this.totalPagado = 0;
    this.totalPagadoPorciento = 0;
  }
}
