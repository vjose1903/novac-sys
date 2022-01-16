import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';
import * as moment from '../../../../utils/javascript/moment';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { TablasService } from '../../components/tablas/tablas.service';
import { mixinClass } from '../../mixinClass';
import { EmpleadoC } from '../../registros/registro-empleados/empleado';
import { VehiculoC } from '../../registros/registro-vehiculo/vehiculo';
import { ReciboC } from '../recibos';
import { RecibosService } from '../recibos.service';

@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
})
export class ReciboViajesComponent extends mixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;
  info = [
    { titulo: '1', key: 'estatus', text_color: 'colorEstado', isIcon: true, color: true, estilos: [{ width: '1.5rem' }, { color: '#8ef3a3' }] },
    { titulo: 'Fecha Fact.', key: 'fecha' },
    { titulo: 'Cliente', key: 'cliente_mostrar' },
    { titulo: 'NCF', key: 'numero_comprobante' },
    { titulo: 'Total facturado', key: 'total_factura', formatoNumero: true },
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
  forma_pago: any;
  total_recibido: any;
  totalPagado = 0;
  totalPagadoPorciento: any = 0;
  monto_pendiente = 0;
  have_incidencia = false;
  incidencia = '';
  devuelta: any;
  userClass = new EmpleadoC();
  vehiculoClass = new VehiculoC();
  reciboClass = new ReciboC();

  constructor(private dbServ: DBservice, private tServ: TablasService, private reciboServ: RecibosService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'recibos_viajes', _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res'] });
    this.necesarioStart();
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  decisionModal(res: any) {
    if (this.fun.hasValue(res)) this.reversarUltimaTransaccion(res);
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'cambio') {
      this.devuelta = res.data.devuelta > 0 ? res.data.devuelta : 0;
      this.forma_pago = res.data.forma_pago;
      this.total_recibido = res.data.dinero;
      this.IMPRIMIR();
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
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
    const extra = { parameters: { id: true, nombreCompleto: true, filter_key: 'role', filter_value: 'C' } };
    this.userClass.getAll(extra).then((res) => {
      this.choferes = res['data'];
      this.is_choferes_register = this.choferes.length > 0 ? true : false;
    });
  }

  async getCamiones() {
    const extra = { afterPath: `filtro/ `, parameters: { paginado: false } };

    this.vehiculoClass.getAll(extra).then((res) => {
      this.camiones = res['data'];

      this.is_camiones_register = this.camiones.length > 0 ? true : false;
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

        fact.estatus = fact.fecha_completada ? 'fas fa-check' : fact.pagos.length > 0 ? 'far fa-check-square' : 'far fa-square';
        fact.colorEstado = fact.fecha_completada ? 'green' : fact.pagos.length > 0 ? 'yellow' : 'red';
        fact.customStyles = { 'td-estatus': { width: '1.5rem' } };
        fact.cliente_mostrar = fact.cliente.nombre;
        fact.fecha = moment(fact.fecha_equivalente).format('DD-MM-YYYY');
        fact['pago_a_tiempo'] = pago_a_tiempo;

        return fact;
      });

      this.viajes = res.data;
      this.viajes_cant = res.total_registros ? res.total_registros : 0;

      this.viajes_completados_cant = this.viajes.filter((v) => this.fun.hasValue(v.fecha_completada)).length;
      this.viajes_pendientes_cant = this.viajes.filter((v) => this.fun.isEmpty(v.fecha_completada)).length;

      setTimeout(() => {
        this.viajes_cant_porciento = (this.viajes_completados_cant / this.viajes_cant) * 100;
        this.viajes_cant_porciento = GLOBAL.numFormatTwoDecimals(this.viajes_cant_porciento);
      }, 5);

      this.viajes = _.orderBy(this.viajes, ['id'], ['desc']);
    } catch (error) {
      console.error(error);

      if (error.error) this.fun.toastError(error.error.msg, 'ERROR');
    }
  }

  // ----------------------------------------
  checkChofer() {
    if (this.choferes.length > 0) {
      this.is_chofer_selected = this.fun.hasValue(this.chofer_id);
    } else this.is_chofer_selected = false;

    this.salio_en_chofer = true;
  }

  entroEnChofer() {
    this.salio_en_chofer = false;
  }
  // ----------------------------------------
  checkCamion() {
    if (this.camiones.length > 0) {
      this.is_camion_selected = this.fun.hasValue(this.camion_id);
    } else this.is_camion_selected = false;

    this.salio_en_camion = true;
  }

  entroEnCamion() {
    this.salio_en_camion = false;
  }
  // ----------------------------------------

  abilitarRecibir() {
    let res = false;
    if (this.is_chofer_selected && this.is_camion_selected) res = false;
    else res = true;

    return res;
  }

  abrir_historial() {
    const pagos = this.viaje_selected.pagos;
    const notas = this.viaje_selected.notas;

    if (pagos.length || notas.length) this.reciboServ.abrirModalHistorial(pagos, notas);
  }
  verViaje(arg) {
    this.monto_pendiente = 0;
    this.totalPagado = 0;
    this.totalPagadoPorciento = 0;

    this.viaje_selected = arg;

    this.totalPagado = _.reduce(this.viaje_selected.pagos, (acumulado, item) => acumulado + item.deposito, 0);

    this.monto_pendiente = this.viaje_selected.balance;
    this.totalPagadoPorciento = (this.totalPagado / this.viaje_selected.total_factura) * 100;
    this.totalPagadoPorciento = GLOBAL.numFormatTwoDecimals(this.totalPagadoPorciento);

    this.ultimo_pago = _.maxBy(this.viaje_selected.pagos, 'id');
  }

  accion(bool, tipo) {
    if (bool) {
      let tipoModal = tipo;
      let obj = {};
      if (tipo === 'cambio') obj = { total_factura: this.monto_pendiente, devuelta: 0, tipo__: 'no_devuelta', factura_de: 'venta' };
      else if (tipo === 'dinamico_texto') {
        tipoModal = 'reversar_transaccion';
        obj['texto_modal'] = 'Seguro de que desea reversar la ultima transaccion realizada a la factura ' + this.viaje_selected.numero_comprobante;
      }

      this.abrirModal(tipo, obj, tipoModal);
    } else {
      if (tipo === 'cambio' || tipo === 'cancelar') {
        this.resetVariables();
      }
    }
  }

  async reversarUltimaTransaccion(arg) {
    if (arg) {
      try {
        const extra = { afterPath: `revertir/by_factura/${this.viaje_selected.id}` };
        this.reciboClass.getAll(extra).then((res) => {
          this.getViajes(this.tServ.obj_paginate);
          this.resetVariables();
        });
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
        ? 'Saldo ' + this.viaje_selected.numero_comprobante + ' ' + moment(this.viaje_selected.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
        : 'Abono ' + this.viaje_selected.numero_comprobante + ' ' + moment(this.viaje_selected.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss'),
      pago_a_tiempo: this.viaje_selected.pago_a_tiempo,
    });

    return temp;
  }

  async IMPRIMIR() {
    const obj = {
      cliente_id: this.viaje_selected.cliente_id,
      total: this.total_recibido,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: this.devuelta,
      numero_recibo: null,
      chofer: Number(this.chofer_id),
      vehiculo_id: Number(this.camion_id),
      estado: true,
    };

    obj['detalle_recibos'] = this.formarDetalle();

    this.reciboClass.createUpdateOne(obj).then((res) => {
      this.getViajes(this.tServ.obj_paginate);
      this.resetVariables();

      const obj_print = { data: res, type: 'recibo_ingreso' };

      this.pdfServ.generatePdf(obj_print).then((res) => {
        if (res.status === 'si') {
          const objBase = { base64: res.body, filename: res.file, type: 'recibo_ingreso' };
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
