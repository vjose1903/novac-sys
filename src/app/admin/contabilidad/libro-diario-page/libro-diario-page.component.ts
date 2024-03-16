import { EntradaDiarioComponent } from './entrada-diario/entrada-diario.component';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { Permisos } from '../../../core/typescript/permisos';
import { fun } from '../../../core/services/functions.service';
import { diurnalFormBtnAceptarId, diurnalFormId, searchDiurnalCode } from './libro-diario-page.utils';
import { rowDataDividerKey, tableCellType, table_config } from '../../components/new_tablas/tabla-class';
import { Subscription } from 'rxjs';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { ModalClass } from '../../components/modal/modal-class';
import { AsientoContableC, CabezaAsietoContableI, DetalleAsientoContableI } from './asiento-contable';

@Component({
  selector: 'app-libro-diario-page',
  templateUrl: './libro-diario-page.component.html',
  styleUrls: ['./libro-diario-page.component.scss'],
})
export class LibroDiarioPageComponent extends MixinClass implements OnInit, OnDestroy {
  permissions = Permisos.cabeza_asiento_contable;
  searchDiurnalCode = searchDiurnalCode;
  desde;
  hasta;

  validationFilterList = [
    { label: 'Todos', value: null },
    { label: 'Validos', value: true },
    { label: 'Por Validar', value: false },
  ];
  validationFilterValue = null;

  table_config_diurnal: table_config = {
    info: [
      { titulo: 'Código', key: 'codigo', tipo: tableCellType.text, style: { width: '20%', 'text-align': 'left' } },
      { titulo: 'Descripcion', key: 'descripcion', tipo: tableCellType.text, style: { width: '40%', 'text-align': 'left' } },
      { titulo: 'Auxiliar', key: 'valor_auxiliar', tipo: tableCellType.formatoNumero, tachado: true, acepta_negativos: true },
      { titulo: 'Débito', key: 'valor_debito', tipo: tableCellType.formatoNumero, tachado: true },
      { titulo: 'Crédito', key: 'valor_credito', tipo: tableCellType.formatoNumero, tachado: true },
    ],
    id_tabla: 'diurnalDetail',
    redondo: false,
    obj_paginate: { show: false },
  };

  tabsVisibles = [];
  asientosContablesList: Array<CabezaAsietoContableI> = [];

  paginator = {
    page: 1,
    page_front: 0,
    per_page: 20,
    cantPagesView: 5,
    total_count: 0,
    per_page_options: [10, 15, 20, 30],
  };
  subWidth: Subscription;

  asientoContableClass = new AsientoContableC();
  filterValue;

  constructor(public cdRef: ChangeDetectorRef, public tServ: TablasService, private zone: NgZone) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'libro_diario_page', is_routing: true });
    this.subWidth = new fun().getWindowSize.subscribe((res) => {
      if (res) this.setCantPagView(res.innerWidth, 'width_page');
    });
    this.necesarioStart();
  }

  ngOnDestroy() {
    this._destroy_mixin();
    if (this.subWidth) this.subWidth.unsubscribe();
  }

  setCantPagView(width, tipo) {
    let actual = 1;

    if (tipo == 'width_page') {
      const divPaginator = document.getElementById('divPaginator');
      if (divPaginator) width = divPaginator.offsetWidth;
    }

    if (width > 385) actual = 5;
    else if (width <= 385 && width > 350) actual = 4;
    else if (width <= 350 && width > 320) actual = 3;
    else if (width <= 320 && width > 285) actual = 2;
    else if (width <= 285) actual = 1;

    const actualPage = this.tServ.getPaginatorPageByNumber(this.paginator.page, 'paginator');

    setTimeout(() => {
      this.zone.run(() => {
        if (actualPage) {
          actualPage.setAttribute('clickeado_por', 'maquina');
          actualPage.click();
          setTimeout(() => actualPage.removeAttribute('clickeado_por'), 2000);
        }

        this.paginator.cantPagesView = actual;
        this.cdRef.detectChanges();
      });
    }, 100);
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  async necesarioStart() {
    this.initDateVars();
    this.getAsientos(this.paginator).then(() => {
      this.changeTabsVisibility({ visible: true });
    });
  }

  getAsientos(params?: { per_page?: number; page?: number; search?: string }) {
    return new Promise<void>((resolve) => {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = {
        afterPath: `filtro/${palabra_a_buscar}`,
        parameters: {
          page: params.page,
          per_page: params.per_page,
          paginado: true,
          desde: fun.my_dateFormater(this.desde, false),
          hasta: fun.my_dateFormater(this.hasta, false),
          is_validated: this.validationFilterValue,
        },
      };

      this.asientoContableClass.getAll(extra).then((res) => {
        res.data.map((asiento: CabezaAsietoContableI) => {
          asiento.title = `${fun.my_dateFormater(asiento.fecha_equivalente)} - ${asiento.comentario}`;

          asiento.detalles_asientos_contables_front = this.makeFrontDetalles(asiento.detalles_asientos_contables);

          return asiento;
        });
        this.asientosContablesList = res.data;
        this.paginator.total_count = res.total_registros;
        resolve();
      });
    });
  }

  filter(from?) {
    const params = { ...this.paginator, search: this.filterValue };
    fun.awaitTyping(null, from == searchDiurnalCode ? 0 : 700).then(() => this.getAsientos(params));
  }

  makeFrontDetalles(detalles_asientos_contables: Array<DetalleAsientoContableI>) {
    let frontDetalles = [];

    detalles_asientos_contables.forEach((detalle) => {
      const tipo = detalle.valor_debito ? 'debito' : 'credito';
      const detalleControl = { tipo, ...detalle.cuenta_contable_control, ...this.parseDetalleCuenta({ valor_credito: detalle.valor_credito, valor_debito: detalle.valor_debito }) };
      frontDetalles.push(detalleControl);

      const valorAuxiliar = detalle.valor_debito ? detalle.valor_debito : detalle.valor_credito * -1;
      const detalleAuxiliar = { tipo, ...detalle.cuenta_contable_auxiliar, ...this.parseDetalleCuenta({ valor_auxiliar: valorAuxiliar }) };
      frontDetalles.push(detalleAuxiliar);
    });

    frontDetalles = this.orderDetalles(frontDetalles);

    return frontDetalles;
  }

  parseDetalleCuenta(params: { valor_auxiliar?: null | number; valor_debito?: null | number; valor_credito?: null | number }) {
    const detalleParsed = {};
    detalleParsed['valor_auxiliar'] = fun.objHas(params, 'valor_auxiliar') ? params['valor_auxiliar'] : null;
    detalleParsed['valor_debito'] = fun.objHas(params, 'valor_debito') ? params['valor_debito'] : null;
    detalleParsed['valor_credito'] = fun.objHas(params, 'valor_credito') ? params['valor_credito'] : null;
    return detalleParsed;
  }

  orderDetalles(detalles) {
    const registrosConDebito = detalles.filter((entry) => entry.tipo == 'debito');
    const registrosDebitoOrdenados = registrosConDebito.sort((a, b) => a.codigo - b.codigo);

    const registrosConCredito = detalles.filter((entry) => entry.tipo == 'credito');
    const registrosCreditoOrdenados = registrosConCredito.sort((a, b) => a.codigo - b.codigo);

    if (registrosConDebito.length > 0 && registrosConCredito.length > 0) {
      const divider = { [rowDataDividerKey]: true, label: '@' };

      detalles = [...registrosDebitoOrdenados, divider, ...registrosCreditoOrdenados];
    } else {
      detalles = [...registrosDebitoOrdenados, ...registrosCreditoOrdenados];
    }
    return detalles;
  }

  initDateVars() {
    let actual_date = new Date();
    actual_date.setDate(actual_date.getDate() - 1);

    const desde = new Date(fun.getFirstDayOfMoth(actual_date));

    this.desde = desde;
    this.hasta = actual_date;
  }

  changeTabsVisibility(params: { visible: boolean }) {
    if (params.visible) {
      const numberOfEntries = this.asientosContablesList.length;
      this.tabsVisibles = Array.from({ length: numberOfEntries }, (_, index) => index);
    } else {
      this.tabsVisibles = [];
    }
  }

  isSomeTabVisible() {
    return this.tabsVisibles.length > 0;
  }

  paginatorChange(opt) {
    setTimeout(() => {
      this.zone.run(() => {
        const page = opt.page + 1;
        const per_page = opt.rows;

        const actualPage = this.tServ.getPaginatorPageByNumber(this.paginator.page, 'paginator');

        const clickeado_por = actualPage?.getAttribute('clickeado_por');

        if (fun.hasValue(this.paginator) && (page != this.paginator.page || per_page != this.paginator.per_page) && (fun.isEmpty(clickeado_por) || clickeado_por != 'maquina')) {
          this.paginator.page = page;
          this.paginator.per_page = per_page;

          const pageFromCero = page > 0 ? page - 1 : page;
          this.paginator.page_front = pageFromCero * this.paginator.per_page;

          // if (this.paginator.is_local) {
          //   this.localPagination(page, per_page, 'paginatorChange');
          // } else {
          //   if (fun.objHas(this.config, 'padre_functions') && this.config.padre_functions?.data_request) {
          //     this.config.padre_functions.data_request({ per_page: per_page, page: page, search: null });
          //   } else {
          //     fun.logRed('----- Debe de especificar en la configuracion de la tabla cual es la funcion para pedir la data ----- ');
          //   }
          // }
        }

        this.cdRef.detectChanges();
      });
    }, 150);
  }

  editEntry(asientoContable: CabezaAsietoContableI, evento) {
    this.abrirModalForm(asientoContable);
    evento.stopPropagation();
  }

  calculateHeigthTableContainer(asientoContable: CabezaAsietoContableI) {
    const cantidadDeDetalles = asientoContable.detalles_asientos_contables_front.length;
    let proporcionalHeight = Number(`${2}.${Math.round(0.5 * cantidadDeDetalles + 0.5)}1`);
    const heightOfChildrens = proporcionalHeight * cantidadDeDetalles;

    let height = proporcionalHeight * 2 + heightOfChildrens;

    return { 'min-height': `${height}rem` };
  }

  abrirModalForm(asientoContable?) {
    const inputs = { asientoContable: asientoContable, method: fun.hasValue(asientoContable) ? 'edit' : 'new' };

    this.openNewModal({
      component: EntradaDiarioComponent,
      inputs: inputs,
      id: diurnalFormId,
      header: `${inputs.method == 'new' ? 'Nueva' : 'Editar'} entrada de libro diario`,
      width: '45rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false },
          { btnId: diurnalFormBtnAceptarId, clase: 'btn btn-verde', functioInOtherComponent: 'btn_aceptar', label: asientoContable ? 'Editar' : 'Registrar', disable: true },
        ],
      },
    });
  }

  async getDataFromModal(arg, search?) {
    if (arg.modalId == diurnalFormId) {
      this.getAsientos(this.paginator).then(() => {
        if (arg.extra.method == 'new') this.changeTabsVisibility({ visible: true });
      });
    }
  }
}
