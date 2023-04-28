import { fun } from './../../../core/services/functions.service';
import { Permisos } from './../../../core/typescript/permisos';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { table_config } from '../../components/new_tablas/tabla-class';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { FacturaC, TiposFacturaC } from '../../facturacion/factura';
import { PeriodoFiscalC } from './periodo-fiscal';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';

@Component({
  selector: 'app-periodo-fiscal',
  templateUrl: './periodo-fiscal.component.html',
  styleUrls: ['./periodo-fiscal.component.scss'],
})
export class PeriodoFiscalComponent extends MixinClass implements OnInit, OnDestroy {
  listaPeriodosFiscales = [];

  periodoSelected;

  periodoFiscalClass = new PeriodoFiscalC();
  permissions = Permisos;

  table_config: table_config = {
    info: [
      { titulo: 'Fecha de inicio', tipo: 'text', key: 'fecha_inicio' },
      { titulo: 'Fecha de cierre', tipo: 'text', key: 'fecha_cierre' },
      { titulo: 'Activo', tipo: 'icon', key: 'estado_', estilos: [{ width: '5rem' }], iconsArray: [{ key: 'estado_', text_color: 'colorEstado' }] },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        column_gap: '1rem',
        key: 'actions',
        estilos: [{ width: '10%' }, { color: '#000' }],
        iconsArray: [
          { key: 'cierre_mensual', tooltip: 'Cierre Mensual', text_color: 'colorNegro' },
          {
            key: 'cierre_anual',
            tooltip: 'Cierre Anual',
            text_color: 'colorNegro',
            disable: [{ kind: 'campo', target: 'ready_to_anual_close', value: [false] }],
          },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_periodos',
    padre_functions: { data_request: (params) => this.getPeriodosFiscales(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };
  tablaComponent;

  constructor(private tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_periodo_fiscal', is_routing: true });
    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.getPeriodosFiscales(this.tServ.obj_paginate.default);
  }

  async getPeriodosFiscales(params?: { per_page: number; page: number; search: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const res = await this.periodoFiscalClass.getAll({ parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar } });

      this.listaPeriodosFiscales.length = 0;

      const tempLista = [];

      res.data.forEach((periodo) => {
        periodo.fecha_inicio = moment(periodo.fecha_inicio, 'YYYY-MM-DD[T]HH:mm:ss').format('DD/MM/YYYY');
        periodo.fecha_cierre = moment(periodo.fecha_cierre, 'YYYY-MM-DD[T]HH:mm:ss').format('DD/MM/YYYY');

        periodo.estado_ = periodo.estado ? 'fas fa-check' : 'fas fa-times';
        periodo.colorEstado = periodo.estado ? 'green' : 'red';

        periodo.ready_to_anual_close = this.periodo_puede_cerrar(periodo);

        periodo.cierre_mensual = 'fa-regular fa-calendar-xmark';
        periodo.cierre_anual = 'fa-solid fa-calendar-days';

        periodo.customStyles = {
          estado_: { width: '5rem', 'font-size': '1.1rem' },
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 10% !important;' },
            { key: 'cierre_mensual', estilos: 'font-size: 1.2rem !important;' },
            { key: 'cierre_anual', estilos: 'font-size: 1.2rem !important' },
          ],
        };

        tempLista.push(periodo);
      });

      this.listaPeriodosFiscales = tempLista;

      // this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    } catch (error) {
      console.error(error);

      fun.toastError('Error buscando Paquetes de NCF registrados.', 'ERROR');
    }
  }

  periodo_puede_cerrar(args) {
    let res = false;

    const fecha_actual = new Date(moment().format());
    const fecha_actual_month = Number(fecha_actual.getMonth() + 1);
    const fecha_actual_year = Number(fecha_actual.getFullYear());

    console.log('Args', args);

    // args.fecha_cierre = '01/12/2022';
    // TODO: hacer una funcion que me devuelva el numero del mes pasandole el mes en letras
    // TODO: agregar una condicion de que si todos los meses estan cerrados para poder cerrar el año

    const fecha_cierre = new Date(moment(args.fecha_cierre, 'DD/MM/YYYY').format());
    const fecha_cierre_month = Number(fecha_cierre.getMonth() + 1);
    const fecha_cierre_year = Number(fecha_cierre.getFullYear());

    if (args.estado && ((fecha_actual_month == fecha_cierre_month && fecha_actual_year == fecha_cierre_year) || (fecha_cierre_year < fecha_actual_year && fecha_cierre_month == 12))) res = true;

    return res;
  }

  saltar(campo) {
    if (campo != 'send') fun.enfocarInput(campo);
    else {
      if (!this.formIsInvalid()) setTimeout(() => this.submit(), 250);
    }
  }

  formIsInvalid() {
    let res = true;
    return res;
  }

  atras() {}

  tableClick_action(params) {
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  eliminarReg(data?) {
    const comprobanteData = data;
    comprobanteData.nombre = 'comprobante para ' + comprobanteData.tipoC_ + ' numero: ' + comprobanteData.codigo;

    const objConfirmationModal = {
      id: 'eliminar_comprobante',
      header: 'Confirmar',
      texto: `Desea eliminar comprobante para <b>${comprobanteData.tipoC_}</b> numero: <b>${comprobanteData.codigo}</b>`,
      width: '510px',
      siFunction: (instance) => {
        this.periodoFiscalClass.deleteOne(comprobanteData.id).then((res) => {
          const actualPagination = this.tServ.getPaginationById('lista_periodos');
          this.getPeriodosFiscales(actualPagination);
          instance.closeModal(instance.id, 'eliminar_comprobante');
        });
      },
    };
    this.confirmationModal(objConfirmationModal);
  }

  abrirNuevoPeriodo() {
    console.log('funcion para endpoit de abrir nuevo periodo');
  }

  async submit() {
    const obj = {
      id: this.periodoSelected ? this.periodoSelected.id : null,
      status: true,
    };

    try {
      const res = await this.periodoFiscalClass.createUpdateOne(obj);
      const actualPagination = this.tServ.getPaginationById('lista_periodos');
      this.getPeriodosFiscales(actualPagination);
    } catch (error) {
      console.error(error);
    }
  }
}
