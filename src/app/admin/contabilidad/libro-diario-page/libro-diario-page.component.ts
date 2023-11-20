import { EntradaDiarioComponent } from './entrada-diario/entrada-diario.component';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { Permisos } from '../../../core/typescript/permisos';
import { fun } from '../../../core/services/functions.service';
import { diurnalFormBtnAceptarId, diurnalFormId, searchDiurnalCode } from './libro-diario-page.utils';
import { table_config } from '../../components/new_tablas/tabla-class';
import { Subscription } from 'rxjs';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { ModalClass } from '../../components/modal/modal-class';

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

  table_config_diurnal: table_config = {
    info: [
      { titulo: 'Código', key: 'codigo', tipo: 'text', style: { width: '20%', 'text-align': 'left' } },
      { titulo: 'Descripcion', key: 'descripcion', tipo: 'text', style: { width: '40%', 'text-align': 'left' } },
      { titulo: 'Auxiliar', key: 'estado_', tipo: 'text' },
      { titulo: 'Débito', key: 'debito', tipo: 'text' },
      { titulo: 'Crédito', key: 'credito', tipo: 'text' },
    ],
    id_tabla: 'diurnalDetail',
    redondo: false,
    obj_paginate: { show: false },
  };

  detalle;
  tabsVisibles = [];
  temp = [
    { title: '01/10/2023 - Para registrar compra de ....' },
    { title: '05/10/2023 - Para registrar compra de ....' },
    { title: '08/10/2023 - Para registrar compra de ....' },
    { title: '08/10/2023 - Para registrar compra de ....' },
    { title: '08/10/2023 - Para registrar compra de ....' },
    { title: '08/10/2023 - Para registrar compra de ....' },
  ];

  paginator = {
    page: 0,
    page_front: 0,
    per_page: 20,
    cantPagesView: 5,
    total_count: 3,
    per_page_options: [10, 15, 20, 30],
  };
  subWidth: Subscription;
  constructor(public cdRef: ChangeDetectorRef, public tServ: TablasService, private zone: NgZone) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'libro_diario_page', is_routing: true });
    this.subWidth = new fun().getWindowSize.subscribe((res) => {
      if (res) this.setCantPagView(res.innerWidth, 'width_page');
    });
    this.necesarioStart();

    this.abrirModalForm();
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
    this.changeTabsVisibility({ visible: true });
    this.initDateVars();
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
      const numberOfEntries = this.temp.length;
      this.tabsVisibles = Array.from({ length: numberOfEntries }, (_, index) => index);
    } else {
      this.tabsVisibles = [];
    }
  }

  isSomeTabVisible() {
    return this.tabsVisibles.length > 0;
  }

  filter(palabra_a_buscar) {
    console.log('palabra_a_buscar ', palabra_a_buscar);
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

  editEntry(asientoContable) {}

  abrirModalForm(asientoContable?) {
    const inputs = {};

    this.openNewModal({
      component: EntradaDiarioComponent,
      inputs: inputs,
      id: diurnalFormId,
      header: 'Entrada de libro diario',
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
}
