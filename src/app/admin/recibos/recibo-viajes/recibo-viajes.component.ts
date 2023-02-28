import { MovimientosC } from './../../components/formularios en modales/movimientos-form/movimiento-model';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { EmpleadoC } from '../../registros/registro-empleados/empleado';
import { VehiculoC } from '../../registros/registro-vehiculo/vehiculo';
import { ReciboC } from '../recibos';
import { FacturaC } from '../../facturacion/factura';
import { fun } from '../../../core/services/functions.service';
import { table_config } from '../../components/new_tablas/tabla-class';
import { UntypedFormBuilder } from '@angular/forms';
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
      { titulo: 'Cliente', tipo: 'text', key: 'cliente.nombre', estilos: [{ width: '40%' }] },
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
          { key: 'make_recipt', rowTooltip: 'make_recipt_tooltip', disable: [{ kind: 'has_value', target: 'fecha_completada' }] },
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
      { id: 'camion', titulo: 'Camión', tipo: 'dropDown', optionValue: 'id', optionLabel: 'info_vehiculo', data: [], key: 'vehiculo.info_vehiculo', dropdown_key: 'vehiculo_id', remplace: { with: 'text' } },
      { id: 'chofer', titulo: 'Chofer', tipo: 'dropDown', optionValue: 'id', optionLabel: 'nombre_completo', data: [], key: 'chofer.nombre_completo', dropdown_key: 'user_id', remplace: { with: 'text' } },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        key: 'actions',
        div_class: 'd-flex justify-content-around',
        estilos: [{ width: '7%' }],

        // TODO: AGREGAR BOTON DE BORRAR MOVIMIENTO
        iconsArray: [
          { key: 'editar_btn', one_per_row: true, editing_buttons: true, tooltip: 'Editar', showCondition: [{ kind: 'campo', target: 'is_editing', value: [false, null, undefined] }] },
          { key: 'borrar_btn', tooltip: 'Borrar', showCondition: [{ kind: 'campo', target: 'is_editing', value: [false, null, undefined] }] },
          { key: 'cancelar_btn', one_per_row: true, editing_buttons: true, tooltip: 'Cancelar', showCondition: [{ kind: 'campo', target: 'is_editing', value: [true] }] },
          { key: 'guardar_btn', one_per_row: true, editing_buttons: true, tooltip: 'Guardar', showCondition: [{ kind: 'campo', target: 'is_editing', value: [true] }] },
        ],
      },
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
  movimiento_viaje_selected;
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

  // form;

  fun = fun;
  constructor(private tServ: TablasService, private fb: UntypedFormBuilder, private route: ActivatedRoute, private router: Router) {
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

  ngOnDestroy() {
    this._destroy_mixin();
  }

  necesarioStart() {
    this.checkRoute();
    this.getChoferes();
    this.getCamiones();

    // this.createForm();
  }

  // createForm() {
  //   this.form = this.fb.group({ choferes_viajes: [null, Validators.required], camiones_viajes: [null, Validators.required] });
  // }

  async checkRoute() {
    this.getViajes(this.tServ.obj_paginate.default).then(async (result) => {
      const id_documento = this.route.snapshot.params['id'];

      if (id_documento != '0') {
        const factura = this.viajes.find((viaje) => viaje.id == id_documento);

        if (fun.isEmpty(factura)) {
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

  async getChoferes() {
    const extra = { parameters: { id: true, filter_key: 'role', filter_value: 'chofer' } };
    this.userClass.getAll(extra).then((res) => {
      const config = this.config_viaje_selected.info.find((config) => config.id == 'chofer');
      config.data = res['data'];
      this.choferes = res['data'];
    });
    setTimeout(() => {}, 500);
  }

  async getCamiones() {
    const extra = { afterPath: `filtro/ `, parameters: { paginado: false, info_vehiculo: true } };
    this.vehiculoClass.getAll(extra).then((res) => {
      const config = this.config_viaje_selected.info.find((config) => config.id == 'camion');
      config.data = res['data'];
      this.camiones = res['data'];
    });
    setTimeout(() => {}, 500);
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
        viaje.make_recipt_tooltip = fun.hasValue(viaje.fecha_completada) ? 'Pedido completado' : 'Realizar recibo de ingreso';

        viaje.customStyles = {
          estado: [
            { key: 'estado', isTd: true, estilos: 'width: 3% !important; padding: 0.6rem 0rem !important' },
            { key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' },
          ],
          fecha_equivalente: { width: '13%' },
          'cliente.nombre': { width: '40%' },
          numero_comprobante: { width: '15%' },
          total_factura: { width: '20%' },
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 7% !important' },
            { key: 'ver', estilos: 'font-size: 1rem !important' },
            { key: 'make_recipt', estilos: 'font-size: 1rem !important' },
          ],
        };

        viaje['pago_a_tiempo'] = pago_a_tiempo;

        viaje.movimientos_viaje.map((movimiento_viaje) => {
          this.parseMovimientosViaje(movimiento_viaje);
          return movimiento_viaje;
        });

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

  parseMovimientosViaje(movimiento_viaje) {
    movimiento_viaje.editar_btn = 'fas fa-pencil-alt';
    movimiento_viaje.borrar_btn = 'far fa-trash-alt';
    movimiento_viaje.cancelar_btn = 'fa-solid fa-x';
    movimiento_viaje.guardar_btn = 'fa-regular fa-floppy-disk';

    movimiento_viaje.customStyles = {
      'vehiculo.info_vehiculo': { padding: '0.5rem' },
      'chofer.nombre_completo': { padding: '0.5rem' },
      actions: [
        { key: 'actions', isTd: true, estilos: 'width: 7% !important' },
        { key: 'editar_btn', estilos: 'font-size: 1rem !important' },
        { key: 'borrar_btn', estilos: 'font-size: 1rem !important' },
        { key: 'cancelar_btn', estilos: 'font-size: 1rem !important' },
        { key: 'guardar_btn', estilos: 'font-size: 1rem !important' },
      ],
    };
  }

  tableClickIcon(params) {
    if (params.id_tabla == 'lista_viajes') {
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

    if (params.id_tabla == 'movimientos_viaje') {
      if (params.iconKey != 'borrar_btn') {
        this.editMovimientoViaje(params);
      } else {
        this.confirmDeleteMovimientoViaje(params);
      }
    }
  }

  editMovimientoViaje(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'cancelar_btn') {
        if (`${params.data.id}`.includes('new_')) {
          fun.pull(this.viaje_selected.movimientos_viaje, params.data);
        }
      }
      if (params.iconKey == 'guardar_btn') {
        const row_edited = params.rowsEditing[0];

        let index_row_en_turno = this.viaje_selected.movimientos_viaje.findIndex((movimiento) => movimiento.id == row_edited.id);

        this.viaje_selected.movimientos_viaje[index_row_en_turno] = fun.duplicarJson(row_edited);

        const new_movimiento_viaje = this.viaje_selected.movimientos_viaje.map((movimiento) => {
          return { vehiculo_id: movimiento.vehiculo_id, user_id: movimiento.user_id };
        });

        const data_update = fun.pick(this.viaje_selected, ['id']);

        data_update['movimientos_viaje'] = new_movimiento_viaje;
        this.sendUpdateMovimientos(data_update, row_edited);
      }
    }
  }

  deleteMovimientoViaje(params) {
    fun.pull(this.viaje_selected.movimientos_viaje, params.data);
    let data_update = fun.pick(this.viaje_selected, ['id', 'movimientos_viaje']);

    data_update.movimientos_viaje = this.viaje_selected.movimientos_viaje.map((movimiento) => {
      return { vehiculo_id: movimiento.vehiculo_id, user_id: movimiento.user_id };
    });

    console.log('data_update ', data_update);

    this.sendUpdateMovimientos(data_update);
  }

  confirmDeleteMovimientoViaje(params) {
    let text = `Seguro que desea eliminar el movimiento realizado por: <strong>${params.data.chofer.nombre_completo}</strong>, con el camión: <strong>${params.data.vehiculo.info_vehiculo}</strong>.`;
    if (fun.isEmpty(params.data.user_id)) text = `Seguro que desea eliminar el movimiento realizado con el camión: <strong>${params.data.vehiculo.info_vehiculo}</strong>.`;
    if (fun.isEmpty(params.data.vehiculo_id)) text = `Seguro que desea eliminar el movimiento realizado por: <strong>${params.data.chofer.nombre_completo}</strong>.`;

    const obj = {
      id: 'delete_movimiento_viaje',
      header: 'Confirmación',
      texto: text,
      siFunction: (instance) => {
        this.deleteMovimientoViaje(params);
        instance.closeModal(instance.id, 'cancelar');
      },
    };

    this.confirmationModal(obj);
  }

  sendUpdateMovimientos(data_update, row_edited?) {
    this.facturaClass
      .updateOne(data_update, { afterPath: `update/movimientos_viaje` })
      .then((res_factura) => {
        if (fun.hasValue(row_edited)) {
          const viaje_modificado = this.viaje_selected.movimientos_viaje.find((movimiento) => movimiento.id == row_edited.id);
          const chofer = this.choferes.find((chofer) => chofer.id == row_edited.user_id);
          const vehiculo = this.camiones.find((camion) => camion.id == row_edited.vehiculo_id);

          viaje_modificado.chofer = fun.duplicarJson(chofer);
          viaje_modificado.user_id = chofer.id;
          viaje_modificado.vehiculo = fun.duplicarJson(vehiculo);
          viaje_modificado.vehiculo_id = vehiculo.id;

          delete viaje_modificado.is_editing;
        }
      })
      .catch((error) => {});
  }

  redirectToIngresos(factura) {
    const obj = {
      id: 'move_to_ingresos',
      header: 'Confirmación',
      texto: 'Seguro que desea dirigirse al modulo de recibos de ingreso para realizar el recibo de este pedido.',
      siFunction: (instance) => {
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

  addMovimiento() {
    const movimiento_viaje = { vehiculo_id: null, user_id: null, is_editing: true, id: `new_${fun.generateKey()}` };
    this.parseMovimientosViaje(movimiento_viaje);
    this.viaje_selected.movimientos_viaje.push(movimiento_viaje);

    this.tablaMovimientosComponent.modifyRowsEditing(movimiento_viaje, 'add');
  }

  tableClickRow(event) {
    if (event.id_tabla == 'lista_viajes') this.verViaje(event.data);
  }

  verViaje(data) {
    // this.form.reset();
    this.monto_pendiente = 0;

    this.viaje_selected = data;
    this.monto_pendiente = this.viaje_selected.balance;

    this.ultimo_pago = _.maxBy(this.viaje_selected.pagos, 'id');

    const index_viaje = this.viajes.findIndex((viaje) => viaje.id == data.id);

    setTimeout(() => {
      fun.scrollTo({ id: `row-lista_viajes-${this.tablaComponent.getIndex(index_viaje)}`, behavior: 'smooth', block: 'center', inline: 'center' });
    }, 500);
  }

  // formarDetalle() {
  //   const temp = [];

  //   const pagado_total = this.viaje_selected.total_factura === this.total_recibido;
  //   temp.push({
  //     cabecera_factura_id: this.viaje_selected.id,
  //     pago_total: pagado_total,
  //     deposito: fun.desformatear(this.total_recibido),
  //     descripcion: pagado_total
  //       ? 'Saldo ' + this.viaje_selected.numero_comprobante + ' ' + moment(this.viaje_selected.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')
  //       : 'Abono ' + this.viaje_selected.numero_comprobante + ' ' + moment(this.viaje_selected.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss'),
  //     pago_a_tiempo: this.viaje_selected.pago_a_tiempo,
  //   });

  //   return temp;
  // }

  // async IMPRIMIR() {
  //   const formulario = this.form.getRawValue();
  //   const formulario_send = { choferes_viajes: [], camiones_viajes: [] };
  //   const formMapKeys = { choferes_viajes: 'user_id', camiones_viajes: 'vehiculo_id' };

  //   for (const key in formulario) {
  //     let formItem = formulario[key];
  //     formItem.forEach((item) => {
  //       const objItem = {};
  //       objItem[formMapKeys[key]] = item.id;
  //       formulario_send[key].push(objItem);
  //     });
  //   }

  //   const obj = {
  //     cliente_id: this.viaje_selected.cliente_id,
  //     total: this.total_recibido,
  //     forma_pago: this.forma_pago,
  //     tipo_factura_id: 17,
  //     devuelta: this.devuelta,
  //     numero_recibo: null,
  //     estado: true,
  //   };

  //   obj['detalle_recibos'] = this.formarDetalle();

  //   Object.assign(obj, formulario_send);

  //   this.reciboClass.createUpdateOne(obj).then((res) => {
  //     const actualPagination = this.tServ.getPaginationById('lista_viajes');
  //     this.getViajes(actualPagination);
  //     this.resetVariables();

  //     this.reciboClass.parseDataToPdf(res['data'].recibo).then((recibo_parsed) => {
  //       const obj_print = { data: recibo_parsed, type: 'recibo_ingreso' };

  //       PdfService.generatePdf({ oPdf: obj_print, imprimir: this.is_print })
  //         .then(async (res) => {
  //           if (res.status === 'si') {
  //           } else fun.toastError(res.msg, 'ERROR');('Existe una fila en estado de edición, debe de terminar ese proceso para editar otra fila.', 'Aviso');

  //           this.getCuadre();
  //         })
  //         .catch((err) => fun.toastError(err.msg, 'ERROR'));('Existe una fila en estado de edición, debe de terminar ese proceso para editar otra fila.', 'Aviso');
  //     });
  //   });
  // }

  // resetVariables() {
  //   [this.ultimo_pago, this.viaje_selected, this.forma_pago, this.total_recibido] = Array(4).fill(undefined);
  //   [this.monto_pendiente] = Array(1).fill(0);
  //   this.have_incidencia = false;
  //   this.incidencia = '';
  // }
}
