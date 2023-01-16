import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { EmpleadoC } from '../../registros/registro-empleados/empleado';
import { VehiculoC } from '../../registros/registro-vehiculo/vehiculo';
import { ReciboC } from '../recibos';
import { FacturaC } from '../../facturacion/factura';
import { PdfService } from '../../../core/services/pdf/pdf.service';
import { fun } from '../../../core/services/functions.service';
import { table_config } from '../../components/new_tablas/tabla-class';
import { FormBuilder, Validators } from '@angular/forms';
import { ModalClass } from '../../components/modal/modal-class';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
})
export class ReciboViajesComponent extends MixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;

  table_config: table_config = {
    info: [
      {
        titulo: '1',
        tipo: 'icon',
        key: 'estado',
        div_class: 'd-flex justify-content-around',
        estilos: [{ width: '3%' }, { color: 'var(--transparente00)' }],
        iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }],
      },
      { titulo: 'Fecha Fact.', tipo: 'date', key: 'fecha_equivalente', estilos: [{ width: '13%' }] },
      { titulo: 'Cliente', tipo: 'text', key: 'cliente_mostrar', estilos: [{ width: '40%' }] },
      { titulo: 'NCF', tipo: 'text', key: 'numero_comprobante', estilos: [{ width: '15%' }] },
      { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura', estilos: [{ width: '20%' }] },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        key: 'actions',
        div_class: 'd-flex justify-content-around',
        estilos: [{ width: '7%' }],
        iconsArray: [
          { key: 'ver', tooltip: 'Ver factura', text_color: 'colorNegro' },
          { key: 'make_recipt', rowTooltip: 'make_recipt_tooltip' },
        ],
      },
    ],
    padre_functions: { data_request: (params) => this.getViajes(params) },
    padding: '0.5rem',
    filtrar: { local: false },
    colores: true,
    id_tabla: 'lista_viajes',
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };

  config_viaje_selected: table_config = {
    info: [
      { titulo: 'Camión', tipo: 'text', key: 'vehiculo.info_vehiculo' },
      { titulo: 'Chofer', tipo: 'text', key: 'chofer.nombre_completo' },
    ],
    filtrar: { show: false },
    padding: '0.5rem',
    id_tabla: 'movimientos_viaje',
    obj_paginate: { show: false },
  };

  tablaComponent;
  tablaMovimientosComponent;

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

  monto_pendiente = 0;
  have_incidencia = false;
  incidencia = '';
  devuelta: any;
  userClass = new EmpleadoC();
  vehiculoClass = new VehiculoC();
  reciboClass = new ReciboC();
  facturaClass = new FacturaC();

  form;

  fun = fun;
  constructor(private tServ: TablasService, private fb: FormBuilder, private route: ActivatedRoute, private router: Router) {
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

  ngOnDestroy() {
    this._destroy_mixin();
  }

  necesarioStart() {
    this.checkRoute();
    this.getChoferes();
    this.getCamiones();
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({ choferes_viajes: [null, Validators.required], camiones_viajes: [null, Validators.required] });
  }

  async checkRoute() {
    this.getViajes(this.tServ.obj_paginate.default).then(async (result) => {
      const id_documento = this.route.snapshot.params['id'];

      if (id_documento != '0') {
        const res = await this.facturaClass.getFacturaById(id_documento);
        const factura = res['data'];

        if (!this.viajes.some((viaje) => viaje.id == factura.id)) {
          const inputSearch = document.getElementById('search-lista_viajes') as any;

          if (fun.hasValue(inputSearch)) {
            inputSearch.value = factura?.cliente?.nombre;
            fun.keyboardEvent(inputSearch, 'keyup', ['Shift']);
          }
        }

        this.verViaje(factura);
      }
    });
  }

  formatoNumero(num) {
    return fun.numFormatTwoDecimals(num);
  }

  async getChoferes() {
    const extra = { parameters: { id: true, nombreCompleto: true, filter_key: 'role', filter_value: 'chofer' } };
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
    return new Promise<any>(async (resolve, reject) => {
      this.viajes_completados_cant = 0;
      this.viajes_pendientes_cant = 0;
      this.viajes.length = 0;
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const res = await this.facturaClass.getAll({
        afterPath: 'custom/viajes',
        parameters: { page: params.page, per_page: params.per_page, paginado: true, movimientos_viaje: true, estado: true, palabra_a_buscar: palabra_a_buscar },
      });

      const fechaA = moment().format('YYYY-MM-DD');
      res.data.forEach((viaje) => {
        const pago_a_tiempo = viaje.condicion == 'Contado' ? true : viaje.fecha_vencimiento > fechaA ? true : false;

        viaje.is_active = viaje.fecha_completada ? 'fas fa-check' : viaje.pagos.length > 0 ? 'far fa-check-square' : 'far fa-square';
        viaje.is_active_color = viaje.fecha_completada ? 'green' : viaje.pagos.length > 0 ? 'yellow' : 'red';
        viaje.is_active_tooltip = viaje.fecha_completada ? 'Pago completo' : viaje.pagos.length > 0 ? 'Viaje abonado' : 'Viaje pendiente';
        viaje.ver = 'far fa-eye';
        viaje.make_recipt = 'fas fa-external-link-alt';
        viaje.make_recipt_tooltip = 'Realizar recibo de ingreso';

        viaje.customStyles = {
          estado: [
            { key: 'estado', isTd: true, estilos: 'width: 3% !important; padding: 0.6rem 0rem !important' },
            { key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' },
          ],
          fecha_equivalente: { width: '13%' },
          cliente_mostrar: { width: '40%' },
          numero_comprobante: { width: '15%' },
          total_factura: { width: '20%' },
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 7% !important' },
            { key: 'ver', estilos: 'font-size: 1rem !important' },
            { key: 'make_recipt', estilos: 'font-size: 1rem !important' },
          ],
        };

        viaje.cliente_mostrar = viaje.cliente.nombre;
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

      resolve(true);
    });
  }

  formIsInvalid() {
    let res = false;
    const formulario = this.form.getRawValue();
    if (fun.isEmpty(formulario.choferes_viajes) || fun.isEmpty(formulario.camiones_viajes)) res = true;

    return res;
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'ver') {
        this.facturaClass.parseDataToPdf(params.data).then((dataFactura) => {
          this.facturaClass.handleMostrarFactura(dataFactura).then((obj_modal) => {
            const ver_datelles_btn = { clase: 'btn btn-gris mr-2', function: (instance) => this.verDetalles(params.data), label: 'Ver detalles', disable: false };
            obj_modal.botones.dinamico.push(ver_datelles_btn);
            this.openNewModal(obj_modal);
          });
        });
      }
      if (params.iconKey == 'make_recipt') this.redirectToIngresos(params.data);
    }
  }

  redirectToIngresos(factura) {
    const obj = {
      id: 'move_to_ingresos',
      header: 'Confirmación',
      texto: 'Seguro que desea dirigirse al modulo de recibos de ingreso para realizar el recibo de este pedido.',
      siFunction: (instance) => {
        console.log('factura ', factura);

        this.router.navigateByUrl(`/admin/recibos/ingresos/${factura.cliente_id}/${factura.id}`);
        instance.closeModal(instance.id, 'cancelar');
      },
    };

    this.confirmationModal(obj);
  }

  verDetalles(data) {
    const configModal = this.facturaClass.modalVerDetalles(data);
    this.openNewModal(configModal);
  }

  abrir_historial() {
    const pagos = this.viaje_selected.pagos;
    const notas = this.viaje_selected.notas;

    if (pagos.length || notas.length) this.facturaClass.abrirModalHistorial(pagos, notas, this.openNewModal);
  }

  tableClickRow(event) {
    if (event.id_tabla == 'lista_viajes') this.verViaje(event.data);
  }

  verViaje(data) {
    this.form.reset();
    this.monto_pendiente = 0;
    this.selectCamionesFactura(data);
    this.viaje_selected = data;
    this.monto_pendiente = this.viaje_selected.balance;

    this.ultimo_pago = _.maxBy(this.viaje_selected.pagos, 'id');
  }

  selectCamionesFactura(factura) {
    const camiones_selected = [];
    console.log('factura ', factura);

    factura.movimientos_viaje.forEach((movimiento_viaje) => {
      console.log('movimiento_viaje ', movimiento_viaje);

      // const camion_en_turno = _.find(this.camiones, { id: movimiento_viaje.vehiculo_id });
      // if (fun.hasValue(camion_en_turno)) camiones_selected.push(camion_en_turno);

      // const camion_en_turno = _.find(this.camiones, { id: movimiento_viaje.vehiculo_id });
      // if (fun.hasValue(camion_en_turno)) camiones_selected.push(camion_en_turno);
    });

    this.form.controls.camiones_viajes.setValue(camiones_selected);
  }

  async getDataFromModal(arg, search?) {
    const data = arg.obj;
    if (arg.modal_id === 'cambioEfectivo_ReciboViajes') {
      this.devuelta = data.devuelta > 0 ? data.devuelta : 0;

      this.is_print = arg.is_print;
      this.forma_pago = data.forma_pago;
      this.total_recibido = data.dinero;
      this.IMPRIMIR();
    }
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.openNewModal({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p>
        ${obj.texto}
      </p>`,
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
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

      this.reciboClass.parseDataToPdf(res['data'].recibo).then((recibo_parsed) => {
        const obj_print = { data: recibo_parsed, type: 'recibo_ingreso' };

        PdfService.generatePdf({ oPdf: obj_print, imprimir: this.is_print })
          .then(async (res) => {
            if (res.status === 'si') {
            } else fun.toastError(res.msg, 'ERROR');

            this.getCuadre();
          })
          .catch((err) => fun.toastError(err.msg, 'ERROR'));
      });
    });
  }

  getCuadre() {
    this.layServ.nextCheckCuadreToday(true);
  }

  resetVariables() {
    [this.ultimo_pago, this.viaje_selected, this.forma_pago, this.total_recibido] = Array(4).fill(undefined);
    [this.monto_pendiente] = Array(1).fill(0);
    this.have_incidencia = false;
    this.incidencia = '';
  }
}
