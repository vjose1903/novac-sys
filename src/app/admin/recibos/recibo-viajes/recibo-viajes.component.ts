import { HtmlElementsService } from '@core/services/html-elements.service';
import { MovimientosC } from '@components/formularios en modales/movimientos-form/movimiento-model';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import * as _ from 'lodash';
const moment = require('../../../core/javascript/moment');
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { EmpleadoC } from '@registros/registro-empleados/empleado';
import { VehiculoC } from '@registros/registro-vehiculo/vehiculo';
import { ReciboC } from '../recibos';
import { FacturaC } from '../../facturacion/factura';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ss } from '@core/services/singleton.service';
import { confirmationButtons, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
  standalone: false,
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
        style: { width: '3%', color: 'var(--transparente00)', padding: '0.6rem 0rem' },
        iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }],
      },
      { titulo: 'Fecha Fact.', tipo: 'date', key: 'fecha_equivalente', style: { width: '13%' } },
      { titulo: 'Cliente', tipo: 'text', key: 'cliente.nombre_completo', style: { width: '40%' } },
      { titulo: 'NCF', tipo: 'text', key: 'numero_comprobante', style: { width: '15%' } },
      { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura', style: { width: '20%' } },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        key: 'actions',
        div_class: 'd-flex justify-content-around',
        style: { width: '7%' },
        iconsArray: [
          { key: 'ver', tooltip: 'Ver factura', text_color: 'colorNegro' },
          { key: 'make_recipt', rowTooltip: 'make_recipt_tooltip', disable: [{ kind: 'has_value', target: 'fecha_completada' }] },
        ],
      },
    ],
    padre_functions: { data_request: params => this.getViajes(params) },
    padding: '0.5rem',
    filtrar: { local: false },
    colores: true,
    id_tabla: 'lista_viajes',
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
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
        style: { width: '7%' },
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

  htmlServ = inject(HtmlElementsService);
  dynamicModalServ = inject(DynamicModalService);
  tServ = inject(TablasService);
  fb = inject(UntypedFormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);

  fun = fun;
  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'recibos_viajes', is_routing: true });
    this.necesarioStart();
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
    this.getViajes(this.tServ.obj_paginate.default).then(async result => {
      const id_documento = this.route.snapshot.params['id'];

      if (id_documento != '0') {
        const factura = this.viajes.find(viaje => viaje.id == id_documento);

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
    this.userClass.getAll(extra).then(res => {
      const config = this.config_viaje_selected.info.find(config => config.id == 'chofer');
      config.data = res['data'];
      this.choferes = res['data'];
    });
    fun.setTimeout(() => {}, 500);
  }

  async getCamiones() {
    const extra = { afterPath: `filtro/ `, parameters: { paginado: false, info_vehiculo: true } };
    this.vehiculoClass.getAll(extra).then(res => {
      const config = this.config_viaje_selected.info.find(config => config.id == 'camion');
      config.data = res['data'];
      this.camiones = res['data'];
    });
    fun.setTimeout(() => {}, 500);
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
      res.data.forEach(viaje => {
        const pago_a_tiempo = viaje.condicion == 'Contado' ? true : viaje.fecha_vencimiento > fechaA ? true : false;

        viaje.is_active = viaje.fecha_completada ? 'fas fa-check' : viaje.pagos.length > 0 ? 'far fa-check-square' : 'far fa-square';
        viaje.is_active_color = viaje.fecha_completada ? 'green' : viaje.pagos.length > 0 ? 'yellow' : 'red';
        viaje.is_active_tooltip = viaje.fecha_completada ? 'Pago completo' : viaje.pagos.length > 0 ? 'Viaje abonado' : 'Viaje pendiente';
        viaje.ver = 'far fa-eye';
        viaje.make_recipt = 'fas fa-external-link-alt';
        viaje.make_recipt_tooltip = fun.hasValue(viaje.fecha_completada) ? 'Pedido completado' : 'Realizar recibo de ingreso';

        viaje.customStyles = {
          estado: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }],

          actions: [
            { key: 'ver', estilos: 'font-size: 1rem !important' },
            { key: 'make_recipt', estilos: 'font-size: 1rem !important' },
          ],
        };

        viaje['pago_a_tiempo'] = pago_a_tiempo;

        viaje.movimientos_viaje.map(movimiento_viaje => {
          this.parseMovimientosViaje(movimiento_viaje);
          return movimiento_viaje;
        });

        this.viajes.push(viaje);
      });

      this.viajes_cant = res.total_registros ? res.total_registros : 0;

      this.viajes_completados_cant = this.viajes.filter(v => fun.hasValue(v.fecha_completada)).length;
      this.viajes_pendientes_cant = this.viajes.filter(v => fun.isEmpty(v.fecha_completada)).length;

      fun.setTimeout(() => {
        this.viajes_cant_porciento = (this.viajes_completados_cant / this.viajes_cant) * 100;
        this.viajes_cant_porciento = fun.roundNumberToDecimal(this.viajes_cant_porciento);
        this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
      }, 5);

      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);

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
          this.facturaClass.parseDataToPdf(params.data).then(dataFactura => {
            let botonesDinamicos = [
              { clase: 'btn btn-gris', function: instance => this.verDetalles(params.data), label: 'Ver detalles', disable: false as any },
              { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false as any },
            ];

            const toPDFData = { data: dataFactura, type: 'facturacion' };
            const dataModal = { id: 'mostrarFacturaIngreso', header: 'MOSTRAR FACTURA', show_estado: false };

            this.facturaClass.handleMostrarFactura(toPDFData, dataModal, botonesDinamicos);
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
      const data = params.data;
      if (params.iconKey == 'cancelar_btn') {
        if (data.isAdded && (fun.isEmpty(data.vehiculo_id) || fun.isEmpty(data.user_id))) this.removeMovimientoInfo(data);
      }
      if (params.iconKey == 'guardar_btn') {
        const [row_edited] = params.rowsEditing;

        let is_completed = true;
        const data_update = fun.pick(this.viaje_selected, ['id']);
        if (fun.isEmpty(row_edited)) {
          is_completed = false;
        } else {
          let index_row_en_turno = this.viaje_selected.movimientos_viaje.findIndex(movimiento => movimiento.id == row_edited.id);

          this.viaje_selected.movimientos_viaje[index_row_en_turno] = fun.deepCloning(row_edited);

          const new_movimiento_viaje = this.viaje_selected.movimientos_viaje.map(movimiento => {
            return fun.pick(movimiento, ['vehiculo_id', 'user_id']);
          });

          is_completed = new_movimiento_viaje.every(movimiento => {
            return fun.hasValue(movimiento?.user_id) && fun.hasValue(movimiento?.vehiculo_id);
          });

          data_update['movimientos_viaje'] = new_movimiento_viaje;
        }

        if (!is_completed) {
          fun.toastError('Debe de ingresar todos los datos', 'Error');
        } else {
          this.sendUpdateMovimientos(data_update, row_edited);
        }
      }
    }
  }

  deleteMovimientoViaje(params) {
    this.removeMovimientoInfo(params.data);
    let data_update = fun.pick(this.viaje_selected, ['id', 'movimientos_viaje']);

    data_update.movimientos_viaje = this.viaje_selected.movimientos_viaje.map(movimiento => {
      return { vehiculo_id: movimiento.vehiculo_id, user_id: movimiento.user_id };
    });

    this.sendUpdateMovimientos(data_update);
  }

  removeMovimientoInfo(data) {
    fun.pull(this.viaje_selected.movimientos_viaje, data);
  }

  confirmDeleteMovimientoViaje(params) {
    const data = params.data;
    if (data.isAdded && fun.isEmpty(data.user_id) && fun.isEmpty(data.vehiculo_id)) {
      this.removeMovimientoInfo(params.data);
    } else {
      let text = `Seguro que desea eliminar el movimiento realizado por: <strong>${data.chofer.nombre_completo}</strong>, con el camión: <strong>${data.vehiculo.info_vehiculo}</strong>.`;
      if (fun.isEmpty(data.user_id)) text = `Seguro que desea eliminar el movimiento realizado con el camión: <strong>${data.vehiculo.info_vehiculo}</strong>.`;
      if (fun.isEmpty(data.vehiculo_id)) text = `Seguro que desea eliminar el movimiento realizado por: <strong>${params.data.chofer.nombre_completo}</strong>.`;

      this.dynamicModalServ.confirmationModal({
        id: 'delete_movimiento_viaje',
        texto: text,
        btnKind: confirmationButtons.siNo,
        onYes: () => this.deleteMovimientoViaje(params),
      });
    }
  }

  sendUpdateMovimientos(data_update, row_edited?) {
    this.facturaClass
      .updateOne(data_update, { afterPath: `update/movimientos_viaje` })
      .then(res_factura => {
        if (fun.hasValue(row_edited)) {
          const viaje_modificado = this.viaje_selected.movimientos_viaje.find(movimiento => movimiento.id == row_edited.id);
          const chofer = this.choferes.find(chofer => chofer.id == row_edited.user_id);
          const vehiculo = this.camiones.find(camion => camion.id == row_edited.vehiculo_id);

          viaje_modificado.chofer = fun.deepCloning(chofer);
          viaje_modificado.user_id = chofer.id;
          viaje_modificado.vehiculo = fun.deepCloning(vehiculo);
          viaje_modificado.vehiculo_id = vehiculo.id;

          delete viaje_modificado.is_editing;
          this.tServ.modifyRowsEditing(row_edited, 'remove');
        }
      })
      .catch(error => {});
  }

  redirectToIngresos(factura) {
    const onYes = () => {
      this.router.navigateByUrl(`/admin/recibos/ingresos/${factura.cliente_id}/${factura.id}`);
    };

    this.dynamicModalServ.confirmationModal({
      id: 'move_to_ingresos',
      texto: 'Seguro que desea dirigirse al modulo de recibos de ingreso para <strong>realizar el recibo de este pedido</strong>.',
      btnKind: confirmationButtons.siNo,
      onYes: () => onYes(),
    });
  }

  verDetalles(data) {
    this.facturaClass.modalVerDetalles(data);
  }

  abrir_historial() {
    const pagos = this.viaje_selected.pagos;
    const notas = this.viaje_selected.notas;

    if (pagos.length || notas.length) this.facturaClass.abrirModalHistorial(pagos, notas);
  }

  addMovimiento() {
    const movimiento_viaje = { vehiculo_id: null, user_id: null, is_editing: true, id: fun.generateKey(), isAdded: true };
    this.parseMovimientosViaje(movimiento_viaje);
    this.viaje_selected.movimientos_viaje.push(movimiento_viaje);

    fun.setTimeout(() => {
      this.tServ.modifyRowsEditing(movimiento_viaje, 'add');
    }, 10);
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

    const index_viaje = this.viajes.findIndex(viaje => viaje.id == data.id);

    fun.setTimeout(() => {
      fun.scrollTo({ id: `row-lista_viajes-${this.tablaComponent.getIndex(index_viaje)}`, behavior: 'smooth', block: 'center', inline: 'center' });
    }, 500);
  }
}
