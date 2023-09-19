import { fun } from './../../../core/services/functions.service';
import { Permisos } from './../../../core/typescript/permisos';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { table_config } from '../../components/new_tablas/tabla-class';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { PeriodoFiscalC, PeriodoFiscalI } from './periodo-fiscal';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { CierreMensualComponent } from './cierre-mensual/cierre-mensual.component';
import { ModalClass } from '../../components/modal/modal-class';

@Component({
  selector: 'app-periodo-fiscal',
  templateUrl: './periodo-fiscal.component.html',
  styleUrls: ['./periodo-fiscal.component.scss'],
})
export class PeriodoFiscalComponent extends MixinClass implements OnInit, OnDestroy {
  listaPeriodosFiscales: Array<PeriodoFiscalI> = [];

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
            rowTooltip: 'cierre_anual_tooltip',
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
    obj_paginate: { show: true, showTotal: true,  is_local: false },
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

  async getPeriodosFiscales(params?: { per_page?: number; page?: number; search?: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const res = await this.periodoFiscalClass.getAll({ parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar } });

      this.listaPeriodosFiscales.length = 0;

      const tempLista = [];

      res.data.forEach((periodo: PeriodoFiscalI) => {
        periodo.fecha_inicio = moment(periodo.fecha_inicio, 'YYYY-MM-DD[T]HH:mm:ss').format('DD/MM/YYYY');
        periodo.fecha_cierre = moment(periodo.fecha_cierre, 'YYYY-MM-DD[T]HH:mm:ss').format('DD/MM/YYYY');

        periodo.estado_ = periodo.estado ? 'fas fa-check' : 'fas fa-times';
        periodo.colorEstado = periodo.estado ? 'green' : 'red';

        periodo.ready_to_anual_close = this.periodo_puede_cerrar(periodo);

        periodo.cierre_mensual = 'fa-regular fa-calendar-xmark';
        periodo.cierre_anual = 'fa-solid fa-calendar-days';
        periodo.cierre_anual_tooltip = this.periodo_puede_cerrar(periodo) ? 'Cierre Anual' : '';

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

      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    } catch (error) {
      console.error(error);

      fun.toastError('Error buscando Paquetes de NCF registrados.', 'ERROR');
    }
  }

  periodo_puede_cerrar(periodo: PeriodoFiscalI) {
    let res = false;

    const only_meses = fun.deepCloning(periodo.detalle_periodo_fiscal);
    delete only_meses.id;

    const is_periodo_months_all_close = Object.values(only_meses).every((item) => item == false);

    if (periodo.estado && periodo.is_open && is_periodo_months_all_close) res = true;

    return res;
  }

  actual_month_is_december() {
    const fecha_actual = new Date(moment().format());

    return fecha_actual.getMonth() + 1 == PeriodoFiscalC.numbers.diciembre;
  }

  atras() {}

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'cierre_mensual') {
        this.openNewModal({
          component: CierreMensualComponent,
          inputs: params.data,
          id: 'cierre_mensual_modal',
          header: 'Cierre Mensual',
          width: '70rem',
          height: '20rem',
          botones: {
            ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
            dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false }],
          },
        });
      }

      if (params.iconKey == 'cierre_anual') {
        this.modalCierreAnual(params.data);
      }
    }
  }

  modalCierreAnual(data?) {
    const objConfirmationModal = {
      id: 'cerrar_anio',
      header: 'Confirmar',
      texto: `Estas seguro de que deseas cerrar el Periodo Fiscal: <b>${data.fecha_inicio} - ${data.fecha_cierre}</b>`,
      width: '500px',
      siFunction: (instance) => {
        console.log('Peticion de cerrar año');

        // this.periodoFiscalClass.deleteOne(comprobanteData.id).then((res) => {
        //   const actualPagination = this.tServ.getPaginationById('lista_periodos');
        //   this.getPeriodosFiscales(actualPagination);
        //   instance.dismissModal(instance.id);
        // });
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
