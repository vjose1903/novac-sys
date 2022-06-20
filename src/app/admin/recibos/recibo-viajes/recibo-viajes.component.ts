import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { EmpleadoC } from '../../registros/registro-empleados/empleado';
import { VehiculoC } from '../../registros/registro-vehiculo/vehiculo';
import { ReciboC } from '../recibos';
import { RecibosService } from '../recibos.service';
import { FacturaC } from '../../facturacion/factura';
import { PdfService } from '../../../core/services/pdf/pdf.service';
import { FormCantidadEfectivoComponent } from '../../components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { fun } from '../../../core/services/functions.service';
import { table_config } from '../../components/new_tablas/tabla-class';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
})
export class ReciboViajesComponent extends MixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;

  table_config: table_config = {
    info: [
      { titulo: '1', tipo: 'icon', key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'colorIsActive' }] },
      { titulo: 'Fecha Fact.', tipo: 'text', key: 'fecha' },
      { titulo: 'Cliente', tipo: 'text', key: 'cliente_mostrar' },
      { titulo: 'NCF', tipo: 'text', key: 'numero_comprobante' },
      { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura' },
    ],
    padre_functions: { data_request: (params) => this.getViajes(params) },
    filtrar: { local: false },
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_viajes',
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };

  tablaComponent;

  viajes = [];
  viaje_selected;
  ultimo_pago;
  is_print = false;

  camiones = [];
  choferes = [];

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
  facturaClass = new FacturaC();

  form;

  constructor(private tServ: TablasService, private reciboServ: RecibosService, private pdfServ: PdfService, private fb: FormBuilder) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'recibos_viajes', is_routing: true });
    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  decisionModal(res: any) {
    if (fun.hasValue(res)) this.reversarUltimaTransaccion();
  }

  objDevueltoResponse(res) {
    // TODO: ver si esto esta funcionando aqui
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
    this.getViajes(this.tServ.obj_paginate.default);
    this.getChoferes();
    this.getCamiones();
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({ choferes_viajes: [null, Validators.required], camiones_viajes: [null, Validators.required] });
  }

  formatoNumero(num) {
    return fun.numFormatTwoDecimals(num);
  }

  async getChoferes() {
    const extra = { parameters: { id: true, nombreCompleto: true, filter_key: 'role', filter_value: 'C' } };
    this.userClass.getAll(extra).then((res) => (this.choferes = res['data']));
  }

  async getCamiones() {
    const extra = { afterPath: `filtro/ `, parameters: { paginado: false } };

    this.vehiculoClass.getAll(extra).then((res) => {
      this.camiones = res['data'];
      this.camiones.map((camion) => {
        // camion['selected_label'] = `${camion.marca} ${camion.modelo} de (${camion.propietario.nombre})`;
        camion['item_label'] = `${camion.marca} ${camion.modelo} - ${camion.anio} (${camion.propietario.nombre} ${camion.propietario.apellido})`;

        return camion;
      });
    });
  }
  async getViajes(params?: { per_page: number; page: number; search: string }) {
    try {
      this.viajes_completados_cant = 0;
      this.viajes_pendientes_cant = 0;
      this.viajes.length = 0;
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const res = await this.facturaClass.getAll({ afterPath: `custom/viajes/true/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } });

      const fechaA = moment().format('YYYY-MM-DD');
      res.data.forEach((viaje) => {
        const pago_a_tiempo = viaje.condicion === 'Contado' ? true : viaje.fecha_vencimiento > fechaA ? true : false;

        viaje.is_active = viaje.fecha_completada ? 'fas fa-check' : viaje.pagos.length > 0 ? 'far fa-check-square' : 'far fa-square';
        viaje.colorIsActive = viaje.fecha_completada ? 'green' : viaje.pagos.length > 0 ? 'yellow' : 'red';
        viaje.is_active_tooltip = viaje.fecha_completada ? 'Pago completo' : viaje.pagos.length > 0 ? 'Viaje abonado' : 'Viaje pendiente';

        viaje.customStyles = { estado: [{ key: 'estado', isTd: true, estilos: 'width: 2rem !important;' }] };
        viaje.cliente_mostrar = viaje.cliente.nombre;
        viaje.fecha = moment(viaje.fecha_equivalente).format('DD-MM-YYYY');
        viaje['pago_a_tiempo'] = pago_a_tiempo;

        this.viajes.push(viaje);
      });

      this.viajes_cant = res.total_registros ? res.total_registros : 0;

      this.viajes_completados_cant = this.viajes.filter((v) => fun.hasValue(v.fecha_completada)).length;
      this.viajes_pendientes_cant = this.viajes.filter((v) => fun.isEmpty(v.fecha_completada)).length;

      setTimeout(() => {
        this.viajes_cant_porciento = (this.viajes_completados_cant / this.viajes_cant) * 100;
        this.viajes_cant_porciento = fun.numFormatTwoDecimals(this.viajes_cant_porciento);
        this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
      }, 5);

      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    } catch (error) {
      console.error(error);

      if (error.error) fun.toastError(error.error.msg, 'ERROR');
    }
  }

  formIsInvalid() {
    let res = false;
    const formulario = this.form.getRawValue();
    if (fun.isEmpty(formulario.choferes_viajes) || fun.isEmpty(formulario.camiones_viajes)) res = true;

    return res;
  }

  abrir_historial() {
    const pagos = this.viaje_selected.pagos;
    const notas = this.viaje_selected.notas;

    if (pagos.length || notas.length) this.reciboServ.abrirModalHistorial(pagos, notas);
  }

  tableClickRow(event) {
    this.verViaje(event.data);
  }

  verViaje(data) {
    this.form.reset();
    this.monto_pendiente = 0;
    this.totalPagado = 0;
    this.totalPagadoPorciento = 0;

    this.selectCamionesFactura(data);
    this.viaje_selected = data;
    this.totalPagado = _.reduce(this.viaje_selected.pagos, (acumulado, item) => acumulado + item.deposito, 0);
    this.monto_pendiente = this.viaje_selected.balance;
    this.totalPagadoPorciento = (this.totalPagado / this.viaje_selected.total_factura) * 100;
    this.totalPagadoPorciento = fun.numFormatTwoDecimals(this.totalPagadoPorciento);

    this.ultimo_pago = _.maxBy(this.viaje_selected.pagos, 'id');
  }

  selectCamionesFactura(factura) {
    const camiones_selected = [];

    factura.camiones.forEach((camion_viaje) => {
      const camion_en_turno = _.find(this.camiones, { id: camion_viaje.vehiculo_id });
      if (fun.hasValue(camion_en_turno)) camiones_selected.push(camion_en_turno);
    });
    this.form.controls.camiones_viajes.setValue(camiones_selected);
  }

  async getDataFromModal(arg, search) {
    const data = arg.obj;
    if (arg.modal_id === 'cambioEfectivo_ReciboViajes') {
      this.devuelta = data.devuelta > 0 ? data.devuelta : 0;

      this.is_print = arg.is_print;
      this.forma_pago = data.forma_pago;
      this.total_recibido = data.dinero;
      this.IMPRIMIR();
    }
  }

  accion(bool, tipo) {
    if (bool) {
      let tipoModal = tipo;

      if (tipo === 'cambio') {
        const obj = { total_factura: this.monto_pendiente, devuelta: 0, tipo_modal: 'no_devuelta', factura_de: 'recibo_ingreso' };

        this.handleModalForm({
          component: FormCantidadEfectivoComponent,
          inputs: obj,
          id: 'cambioEfectivo_ReciboViajes',
          header: 'Cantidad de efectivo',
          width: '34.375rem',
          botones: {
            aceptar: { show: false, disable: false },
            cancelar: { show: false, disable: false },
            dinamico: [
              {
                clase: 'btn btn-blanco mr-2',
                function: (instance) => {
                  instance.closeModal(instance.id, 'd');
                },
                label: 'Cancelar',
                disable: false,
              },
              { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
            ],
          },
        });
      } else if (tipo === 'dinamico_texto') {
        tipoModal = 'reversar_transaccion';
        const texto = 'Seguro de que desea reversar la ultima transaccion realizada a la factura ' + this.viaje_selected.numero_comprobante;

        const objConfirmationModal = {
          id: 'reversar_transaccion',
          header: 'Confirmación',
          siFunction: (instance) => {
            this.reversarUltimaTransaccion();
            instance.closeModal(instance.id, 'reversar_transaccion');
          },
          texto,
        };

        this.confirmationModal(objConfirmationModal);
      }
    } else {
      if (tipo === 'cambio' || tipo === 'cancelar') {
        this.resetVariables();
      }
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
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, obj.id), label: 'NO', disable: false },
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

  async reversarUltimaTransaccion() {
    try {
      const extra = { afterPath: `revertir/by_factura/${this.viaje_selected.id}` };
      this.reciboClass.getAll(extra).then((res) => {
        const actualPagination = this.tServ.getPaginationById('lista_viajes');
        this.getViajes(actualPagination);
        this.resetVariables();
      });
    } catch (error) {
      console.error(error);
    }
  }

  formarDetalle() {
    const temp = [];

    const pagado_total = this.viaje_selected.total_factura === this.total_recibido;
    temp.push({
      cabecera_factura_id: this.viaje_selected.id,
      pago_total: pagado_total,
      deposito: fun.desformatear(this.total_recibido),
      descripcion: pagado_total
        ? 'Saldo ' + this.viaje_selected.numero_comprobante + ' ' + moment(this.viaje_selected.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
        : 'Abono ' + this.viaje_selected.numero_comprobante + ' ' + moment(this.viaje_selected.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss'),
      pago_a_tiempo: this.viaje_selected.pago_a_tiempo,
    });

    return temp;
  }

  async IMPRIMIR() {
    const formulario = this.form.getRawValue();
    const formulario_send = { choferes_viajes: [], camiones_viajes: [] };
    const formMapKeys = { choferes_viajes: 'user_id', camiones_viajes: 'vehiculo_id' };

    for (const key in formulario) {
      let formItem = formulario[key];
      formItem.forEach((item) => {
        const objItem = {};
        objItem[formMapKeys[key]] = item.id;
        formulario_send[key].push(objItem);
      });
    }

    const obj = {
      cliente_id: this.viaje_selected.cliente_id,
      total: this.total_recibido,
      forma_pago: this.forma_pago,
      tipo_factura_id: 17,
      devuelta: this.devuelta,
      numero_recibo: null,
      estado: true,
    };

    obj['detalle_recibos'] = this.formarDetalle();

    Object.assign(obj, formulario_send);

    this.reciboClass.createUpdateOne(obj).then((res) => {
      const actualPagination = this.tServ.getPaginationById('lista_viajes');
      this.getViajes(actualPagination);
      this.resetVariables();

      const obj_print = { data: res['data'].recibo, type: 'recibo_ingreso' };

      if (this.is_print) {
        this.pdfServ
          .generatePdf({ oPdf: obj_print, imprimir: true })
          .then(async (res) => {
            if (res.status === 'si') {
            } else fun.toastError(res.msg, 'ERROR');

            this.getCuadre();
          })
          .catch((err) => fun.toastError(err.msg, 'ERROR'));
      } else {
        this.getCuadre();
      }
    });
  }

  getCuadre() {
    this.layServ.nextCheckCuadreToday(true);
  }

  resetVariables() {
    [this.ultimo_pago, this.viaje_selected, this.forma_pago, this.total_recibido] = Array(4).fill(undefined);
    [this.monto_pendiente, this.totalPagado, this.totalPagadoPorciento] = Array(3).fill(0);
    this.have_incidencia = false;
    this.incidencia = '';
  }
}
