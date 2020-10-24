import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { DBservice } from '../../core/services/bdservice.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { obj_paginate } from '../components/tablas/tablas.service';
import { GLOBAL } from '../../core/services/GLOBAL';
import { ModalService } from '../components/modal/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
})
export class ReciboViajesComponent implements OnInit, OnDestroy {
  @ViewChild('cardTabla', { static: false }) cardTabla: ElementRef;
  viajes;
  viaje_selected = { id: -1 } as any;
  chofer_id;
  is_chofer_selected = false;
  is_choferes_register = false;
  choferes: any;
  salio_en_chofer = false;

  info = [
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
  viajes_pendientes_cant = 0;
  viajes_completados_cant = 0;
  viajes_cant_porciento: any;
  viajes_cant: any;
  tipoModal: string;
  subObj: Subscription;
  forma_pago: any;
  total_recibido: any;
  totalPagado = 0;
  totalPagadoPorciento = 0;
  monto_pendiente = 0;
  constructor(private dbServ: DBservice, private mServ: ModalService) {}

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
    this.necesarioStart();
  }

  necesarioStart() {
    this.getViajes(obj_paginate);
    this.getChoferes();
  }

  ngOnDestroy() {
    this.subObj.unsubscribe();
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
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getViajesByCompletada(palabra_a_buscar, page, per_page, true).toPromise();

      const fechaA = moment().format('YYYY-MM-DD');
      res.data.map((fact) => {
        const pago_a_tiempo = fact.condicion === 'Contado' ? true : fact.fecha_vencimiento > fechaA ? true : false;

        fact.cliente_mostrar = fact.cliente.nombre;
        fact.fecha = moment(fact.fecha_equivalente).format('DD-MM-YYYY');
        fact.total_factura = this.recalcularMonto(fact.total_factura, fact.notas);
        fact.balance = this.recalcularMonto(fact.balance, fact.notas);
        fact['pago_a_tiempo'] = pago_a_tiempo;

        return fact;
      });

      // this.viajes = [];
      this.viajes = res.data;
      this.viajes_cant = res.total_registros ? res.total_registros : 0;

      this.viajes_completados_cant = this.viajes.filter((v) => v.fecha_completada !== null).length;
      this.viajes_pendientes_cant = this.viajes.filter((v) => v.fecha_completada === null).length;

      console.log();

      setTimeout(() => {
        this.viajes_cant_porciento = (this.viajes_completados_cant / this.viajes_cant) * 100;
      }, 5);

      console.log('this.viajes ', this.viajes);
      console.log('this.viajes_pendientes_cant ', this.viajes_pendientes_cant);
    } catch (error) {
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
    this.totalPagadoPorciento = parseFloat(GLOBAL.numFormatTwoDecimals(this.totalPagadoPorciento));

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

  accion(bool) {
    if (bool) {
      const obj = { total_factura: this.viaje_selected.total_factura, devuelta: 0, tipo__: 'no_devuelta', factura_de: 'venta' };
      this.mServ.modalTipo('cambio');
      this.tipoModal = 'cambio';
      this.abrirModal(obj);
    } else {
      this.viaje_selected = { id: -1 };
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
    const empleado = JSON.parse(this.dbServ.getEmpleado());

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
