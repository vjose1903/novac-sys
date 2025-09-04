<<<<<<< HEAD
import { Ss } from './../../../core/services/singleton.service';
import { ConfigI } from './../../../core/typescript/config-interface';
import { DateUtils } from './../../../core/typescript/date.utils';
import { EntidadCuentaContableService } from './../../contabilidad/entidad-cuenta-contable/entidad-cuenta-contable.service';
import { TipoArticuloComponent } from './tipo-articulo/tipo-articulo.component';
import { ConfigService } from './../../../core/services/configuration.service';
import { HtmlElementsService } from './../../../core/services/html-elements.service';
=======
import { HtmlElementsService } from '@core/services/html-elements.service';
>>>>>>> dev
import { ConfigArticulosComponent } from './configuracion_articulos/config-articulos/config-articulos.component';
import { Component, OnInit, OnDestroy, OnChanges, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
<<<<<<< HEAD
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { ArticuloC, ArticuloI } from './articulo';
import { TipoArticuloC, TipoArticuloI, tipos_articulos } from './tipo-articulo/tipo-articulo';
import { fun } from '../../../core/services/functions.service';
import { tableCellType, table_config } from '../../components/new_tablas/tabla-class';
import { Permisos } from '../../../core/typescript/permisos';
import { NgxPermissionsService } from 'ngx-permissions';
import { ConfigArticuloC, ConfigArticuloI } from './configuracion_articulos/articulos_configuracion';
import { ModalClass } from '../../components/modal/modal-class';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../contabilidad/configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableC, entidadesContables } from '../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.utils';
import { FormEntidadCuentaContableI, tipoCategoria } from '../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { SubTipoArticuloC, SubTipoArticuloI } from './tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';
import { maxSizeTypeE } from '../../../core/directive/max-sizer.directive';
=======
import * as _ from 'lodash';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { ArticuloC, TipoArticuloC, tipos_articulos } from './articulo';

import { fun } from '@core/services/functions.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';
import { NgxPermissionsService } from 'ngx-permissions';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { ConfigArticuloC, ConfigArticuloI } from './configuracion_articulos/articulos_configuracion';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
const moment = require('../../../core/javascript/moment');
>>>>>>> dev

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss'],
  standalone: false,
})
export class RegistroArticulosComponent extends MixinClass implements OnInit, OnDestroy, OnChanges {
  // =============================================
  //  TABLAS
  // =============================================

  botonLabel = '';
  form: UntypedFormGroup;

  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaArticulos = [];
  listaTipoArticulos: TipoArticuloI[] = [];
  listaSubTipoArticulos: SubTipoArticuloI[] = [];

  optionsAlerta: any[];
  alertaMedida: any;

  articulo_no_paquete = false;
  tipoArticuloSelected: TipoArticuloI;
  subTipoArticuloSelected: SubTipoArticuloI;

  isCreando: boolean = false;

  ARRAY_FORMULA: FormArray;
  COMPRADOEN: any;
  MEDIDACAJA: any;
  is_combo = false;
  recalcular = false;

  vendido_en: any;
  listaMateriasPrimas = [];
  listaMateriasPrimasIndexed = {};

  vendidoEn = [
    { backend: 'Unidad', front: 'Unidad' },
    { backend: 'Saco', front: 'Saco' },
    { backend: 'Galon', front: 'Galón' },
    { backend: 'Bolsa', front: 'Bolsa' },
  ];

  articuloClass = new ArticuloC();
  tipoArticuloClass = new TipoArticuloC();
  configArticuloClass = new ConfigArticuloC();
  configEntContableClass = new ConfiguracionEntidadCuentaC();
  subTipoArticuloClass = new SubTipoArticuloC();

  fechaFactura: string;
  permissions = Permisos;
  formPermissions = [Permisos.articulo.create, Permisos.articulo.update];
  allPermisosTipoArticulo = Object.values(Permisos.tipo_articulo);
  hasPermissionUpdateFormula = false;
  medida_config: string;

  listaConfigArticulos: Array<ConfiguracionEntidadCuentaI> = [];
  listaEntidadCuentasContables: Array<FormEntidadCuentaContableI> = [];

  table_config: table_config = {
    info: [
<<<<<<< HEAD
      { titulo: 'Cod.', tipo: tableCellType.text, key: 'codigo', estilos: [{ width: '12%' }, { padding: '0.5rem 0rem' }, { 'padding-left': '1rem' }] },
      { titulo: 'Articulo', tipo: tableCellType.text, key: 'nombre', estilos: [{ width: '37%' }, { 'text-align': 'left' }] },
      { titulo: 'Medida', tipo: tableCellType.text, key: 'medida', estilos: [{ width: '13%' }, { padding: '0.5rem 0rem' }] },
      { titulo: 'Precio', tipo: tableCellType.formatoNumero, key: 'precio_principal', estilos: [{ width: '20%' }] },
=======
      { titulo: 'Cod.', tipo: 'text', key: 'codigo', style: { width: '3.5rem', padding: '0.5rem 0rem', 'padding-left': '0.2rem' } },
      { titulo: 'Articulo', tipo: 'text', key: 'nombre', style: { width: '37%', 'text-align': 'left' } },
      { titulo: 'Medida', tipo: 'text', key: 'medida', style: { padding: '0.5rem 0rem' } },
      { titulo: 'Precio', tipo: 'formatoNumero', key: 'precio_principal' },
>>>>>>> dev
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_articulos',
    padre_functions: { data_request: params => this.getArticulos(params) },
    filtrar: { local: false },
<<<<<<< HEAD
    obj_paginate: { show: true, showTotal: true, is_local: false },
=======
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
>>>>>>> dev
    botones: { editar: { show: true, permiso: this.permissions.articulo.update }, borrar: { show: true, permiso: this.permissions.articulo.destroy } },
  };

  tablaComponent;
<<<<<<< HEAD
  cofig_articulos: ConfigArticuloI;
  configApp: ConfigI = ConfigService.config;
  entidadContable: entidadesContables = CategoriaEntidadContableC.entidad.articulo;
  fun = fun;
  maxSizeTypeE = maxSizeTypeE;
  htmlServ = inject(HtmlElementsService);

  constructor(private fb: UntypedFormBuilder, private router: Router, private tServ: TablasService, private permissionsService: NgxPermissionsService, public entCuentaContServ: EntidadCuentaContableService) {
=======
  config_articulos: ConfigArticuloI;

  public htmlServ = inject(HtmlElementsService);
  public dynamicModalServ = inject(DynamicModalService);
  private cdRef = inject(ChangeDetectorRef);
  private fb = inject(UntypedFormBuilder);
  private router = inject(Router);
  private tServ = inject(TablasService);
  private permissionsService = inject(NgxPermissionsService);

  constructor() {
>>>>>>> dev
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_articulo', is_routing: true });
    this.createForm();
<<<<<<< HEAD

    this.medida_config = ConfigService.config.medida_producto_terminado;
=======
    this.configApp = Ss.configServ.config;
    this.medida_config = this.configApp.medida_producto_terminado;
>>>>>>> dev

    this.permissionsService.hasPermission(this.permissions.articulo.update_formula).then(result => {
      this.hasPermissionUpdateFormula = result;
    });

    this.botonLabel = 'Registrar';
    this.necesarioStart();
  }

  ngOnDestroy() {
    this._destroy_mixin();
    this.borrar();
  }

  async necesarioStart() {
    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];

    const actualPagination = this.tServ.getPaginationById('lista_articulos') || this.tServ.obj_paginate.default;

    await this.getArticulos(actualPagination);
    this.getTipoArticulos();
    this.getConfiguracionArticulo();
    this.getConfigEntidadCliente();

    fun.enfocarInput('nombre');
  }

  getConfigEntidadCliente() {
    const extra = { parameters: { filter_target: CategoriaEntidadContableC.entidad.articulo } };
    this.configEntContableClass.getAll(extra).then((res) => {
      this.listaConfigArticulos = res['data'];
    });
  }

  getConfiguracionArticulo() {
    this.configArticuloClass.getOne(1).then(config_articulos => {
      this.config_articulos = config_articulos.data;
    });
  }

  getMateriasP() {
    return new Promise(async resolve => {
      const fechaActual = this.formarFechaFactura(new Date())['FechaFactura'];

      this.articuloClass.getArticulosFiltrado({ buscar: ' ', fecha: fechaActual, paginado: false, tipo: tipos_articulos.materia_prima }).then(res => {
        this.listaMateriasPrimas = fun.deepCloning(res['data']);

        this.listaMateriasPrimasIndexed = this.listaMateriasPrimas.reduce((acu: any, item: any) => {
          acu[item.id] = item;
          return acu;
        }, {});

        resolve(true);
      });
    });
  }

  getTipoArticulos() {
<<<<<<< HEAD
    this.listaTipoArticulos.length = 0;
    this.tipoArticuloClass.getAll().then((res) => (this.listaTipoArticulos = fun.deepCloning(res.data)));
  }

  getSubTipoArticulos() {
    return new Promise<void>((resolve, reject) => {
      const parameters = { paginado: false, tipo_articulo_id: this.tipoArticuloSelected.id, showMsgs: false };
      this.listaSubTipoArticulos.length = 0;

      this.subTipoArticuloClass
        .getSubTipoArticulos(parameters)
        .then((res) => {
          this.listaSubTipoArticulos = fun.deepCloning(res.data);
          resolve();
        })
        .catch(() => reject());
    });
  }

  openModalCategorias() {
    const header = `Categorias de articulos`;
    const inputs = {};

    this.openNewModal({
      component: TipoArticuloComponent,
      inputs: inputs,
      id: 'categoria-articulos',
      header: header,
      width: '70rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false }],
      },
=======
    this.listaTipoArticulos = [];
    this.tipoArticuloClass.getAll().then(res => {
      this.listaTipoArticulos = fun.deepCloning(res.data);
>>>>>>> dev
    });
  }

  openModalConfig() {
<<<<<<< HEAD
    this.openNewModal({
      component: ConfigArticulosComponent,
      inputs: { cofig_articulos: this.cofig_articulos },
      id: 'cofig-articulos',
      header: 'Configuraciones de articulos',
      width: '50rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco', function: (instance) => this.dismissModal(instance), label: 'Cancelar', disable: false },
          { btnId: 'btnConfirmar', clase: 'btn btn-verde', functionInOtherComponent: 'btn_aceptar', label: 'Confirmar', disable: true },
        ],
      },
    });
  }

  async getDataFromModal(arg, search?) {
    if (arg.modalId == 'cofig-articulos') {
      this.cofig_articulos = arg.data;
=======
    const modalConfig = new DynamicModalClass();
    modalConfig.id = 'config_articulos';
    modalConfig.width = '40rem';
    modalConfig.component = ConfigArticulosComponent;
    modalConfig.inputs = { config_articulos: this.config_articulos };
    modalConfig.header = 'Configuraciones de articulos';

    modalConfig.botones = [
      { clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false },
      { id: 'btnConfirmar', clase: 'btn btn-green', label: 'Aceptar', disable: false },
    ];

    modalConfig.setCallback((arg: ICallbackModal) => this.processConfigArticulos(arg));
    modalConfig.show();
  }

  async processConfigArticulos(arg: ICallbackModal) {
    if (arg.type == modalCloseType.onHide) return;
>>>>>>> dev

    const { update_articulos, ...data } = arg.data;

    this.config_articulos = data;

    if (update_articulos) {
      const actualPagination = this.tServ.getPaginationById('lista_articulos');
      this.getArticulos(actualPagination);
    }
  }

  async getArticulos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    this.listaArticulos.length = 0;
<<<<<<< HEAD
    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, page: params.page, per_page: params.per_page, fecha: this.fechaFactura, paginado: true, parameters: { cuentas_contables: true } }).then((res) => {
      res.data.map(async (arti) => {
        arti.customStyles = {
          codigo: { width: '12%' },
          nombre: { width: '37%', 'text-align': 'left', 'padding-left': '0.5rem' },
          medida: { width: '13%' },
          precio_principal: { width: '20%' },
        };
      });

=======
    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, page: params.page, per_page: params.per_page, fecha: this.fechaFactura, paginado: true }).then(res => {
>>>>>>> dev
      this.listaArticulos = res.data;
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  ngOnChanges() {
    Ss.cdRef.detectChanges();
  }

  showContenido(value) {
    const array = ['Caja', 'Saco', 'Galon', 'Bolsa', 'Producto'];
    return array.includes(value);
  }

  revisarPrecio(id) {
    const input = this.form.controls[id];

    fun.revisarNumber(input, id).then(res => {
      if (!res.error) input.setValue(res.number);
    });
  }

  cambiarCalcularSaco() {
    const formulario = this.form.getRawValue();
    if (fun.hasValue(formulario.medida) && formulario.medida !== 'Quintal' && formulario.medida !== 'Libra') {
      fun.toastWarning('Solo se le puede calcular el saco a los productos comprados en Quintal o Libra', 'AVISO');
      this.form.controls.calcular_saco.setValue(false);
    }
  }

<<<<<<< HEAD
  async selectTipoArticulo(tipo_id) {
    this.tipoArticuloSelected = this.listaTipoArticulos.find((val) => val.id == Number(tipo_id));
    this.subTipoArticuloSelected = undefined;
    this.form.controls.sub_tipo_articulo_id.setValue(null);
    this.checkCuentasContables();
=======
  async selectTipoArticulo(tipo) {
    this.tipoArticuloSelected = this.listaTipoArticulos.find(val => val.id == Number(tipo));
>>>>>>> dev
    this.modificateValidators();

    this.getSubTipoArticulos().finally(() => this.modificateValidators());

    if (this.tipoArticuloSelected.codigo == 'materia_prima') {
      this.form.controls.is_materia_prima.setValue(true);
    } else {
      this.form.controls.is_materia_prima.setValue(this.articuloSelected ? this.articuloSelected.is_materia_prima : false);
    }

    if (this.tipoArticuloSelected.codigo == 'producto_terminado') {
      await this.getMateriasP().then(res => {
        this.addItem();
        this.resetCompradoEn(this.medida_config);
        this.is_combo = true;

        if (fun.hasValue(this.form)) this.form.controls.costo_principal.reset(null);
        if (fun.hasValue(this.form)) this.form.controls.precio_principal.reset(null);

        this.form.controls.medida.setValue(this.medida_config);
        this.form.controls.calcular_saco.setValue(true);
      });
    } else {
      this.resetArray();
      this.is_combo = false;
      this.form.controls.calcular_saco.setValue(false);
    }
  }

  checkCuentasContables() {
    this.listaEntidadCuentasContables = this.listaEntidadCuentasContables.filter((cuenta) => ![tipoCategoria.tipoArticulo, tipoCategoria.subTipoArticulo].includes(cuenta.tipo_categoria));
  }

<<<<<<< HEAD
  async selectSubTipoArticulo(subTipo_id) {
    this.subTipoArticuloSelected = this.listaSubTipoArticulos.find((val) => val.id == Number(subTipo_id));
  }

  modificateValidators() {
    if (fun.hasValue(this.tipoArticuloSelected)) {
      const objValidators = {
        costo_principal: { venta_normal: [Validators.required], servicio: null },
        aviso_existencia: { venta_normal: [Validators.required], servicio: null },
        vendido_en: { venta_normal: [Validators.required], servicio: null },
        medida_alerta: { venta_normal: [Validators.required], servicio: null },
        medida: { venta_normal: [Validators.required], servicio: null },
      };

      if (fun.hasValue(this.tipoArticuloSelected)) {
        for (const key in objValidators) {
          const element = objValidators[key];
          this.form.controls[key].setValidators(element[this.tipoArticuloSelected.tipo]);
          this.form.controls[key].updateValueAndValidity();
        }
      }

      this.listaSubTipoArticulos.length > 0 ? this.form.controls.sub_tipo_articulo_id.enable() : this.form.controls.sub_tipo_articulo_id.disable();
    }
=======
  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.capitalice(arg));
>>>>>>> dev
  }

  createForm() {
    this.form = this.fb.group({
      nombre: [null, Validators.required],
      tipo_articulo_id: [null, Validators.required],
      sub_tipo_articulo_id: [{ value: null, disabled: true }],
      medida: [null, Validators.required],
      costo_principal: [null, Validators.required],
      precio_principal: [null, Validators.required],
      is_detallable: [false],
      calcular_saco: [false],
      fecha_ingreso: [new Date()],
      aviso_existencia: [null, Validators.required],
      calcular_itbis: [false],
      existencia: [0],
      medida_alerta: [null, Validators.required],
      cantidad_contenido_padre: [null],
      medida_contenido_padre: [null],
      precio_padre: [null],
      precio_libra: [null],
      precio_unidad: [null],
      costo_padre: [null],
      costo_hijo: [null],
      id: [null],
      id_contenido_padre: [null],
      id_contenido_hijo: [null],
      vendido_en: [null, Validators.required],
      is_materia_prima: [false],

      referencia_padre: [null],
      referencia_hijo: [null],

      medida_contenido_hijo: [null],
      cantidad_contenido_hijo: [null],
      precio_hijo: [null],
      rowFormula: this.fb.array([]),
      otros_costos: [null],
    });

    this.ARRAY_FORMULA = this.form.get('rowFormula') as FormArray;
  }

<<<<<<< HEAD
  saltar(campo) {
    let is_invalid = true;

    if (campo != 'send' && campo != 'cantidad_formula' && campo != 'ingrediente_producir' && campo != 'in_medida_alerta') {
      fun.enfocarInput(campo);
      //
    } else if (campo == 'ingrediente_producir') {
      fun.simulateTabKeyPress();
=======
  saltar(next_campo, i?) {
    let is_invalid = true;
    const especial_fields = ['send', 'cantidad_formula', 'ingrediente_producir', 'in_medida_alerta', 'articulo_id'];
    if (!especial_fields.includes(next_campo)) {
      fun.enfocarInput(next_campo);
      //
    } else if (next_campo == 'cantidad_formula') {
      fun.setTimeout(() => fun.enfocarInput(`cantidad_formula-${i}`), 100);
>>>>>>> dev
      //
    } else if (next_campo == 'in_medida_alerta') {
      if (this.showContenido(this.form.getRawValue().medida)) {
        fun.enfocarInput('contenidoPadre');
        //
      } else {
        const formulario = this.form.getRawValue();
        let campo = '';

        if (this.tipoArticuloSelected.codigo == 'producto_terminado') {
          campo = 'send';
          //
        } else {
          campo = formulario.medida == 'Quintal' ? 'precio_libra' : formulario.medida == 'Unidad' || formulario.medida == 'Libra' ? 'send' : '';
          //
        }

        if (campo == 'send') is_invalid = this.formIsInvalid();
        else fun.enfocarInput(campo);
      }
<<<<<<< HEAD
    } else if (campo == 'cantidad_formula') {
      fun.simulateTabKeyPress();
=======
    } else if (next_campo == 'articulo_id') {
      const next_campo = `articulo_id-${i + 1}`;

      const articulo_combo = document.getElementById(next_campo);

      if (articulo_combo) fun.enfocarInput(next_campo);
      else fun.enfocarInput('otros_costos');
>>>>>>> dev
    } else {
      is_invalid = this.formIsInvalid();
    }

    if (!is_invalid) {
      fun.enfocarInput('nombre');
      this.submit();
    }
  }

  test() {
    this.resetArray();
  }

  borrar(reset = false) {
    [this.articuloSelected, this.tipoArticuloSelected, this.subTipoArticuloSelected] = Array(3).fill(undefined);

    if (fun.hasValue(this.form)) this.form.reset();
    if (fun.hasValue(this.form)) this.form.controls.is_detallable.setValue(false);
    if (fun.hasValue(this.form)) this.form.controls.existencia.setValue(0);

    this.listaEntidadCuentasContables.length = 0;
    this.listaSubTipoArticulos.length = 0;
    this.botonLabel = 'Registrar';
    [this.recalcular, this.is_combo] = Array(2).fill(false);

    if (fun.hasValue(this.ARRAY_FORMULA)) this.resetArray();
    if (reset) this.isCreando = true;
    this.modificateValidators();

    fun.enfocarInput('nombre');
  }

  resetCompradoEn(value) {
    const formulario = this.form.getRawValue();

    const fields = ['medida_alerta', 'medida_contenido_padre', 'medida_contenido_hijo', 'cantidad_contenido_padre', 'cantidad_contenido_hijo', 'precio_padre', 'precio_libra', 'precio_hijo'];

    fields.forEach(field => {
      if (fun.hasValue(this.form)) this.form.controls[field].reset(null);
    });

    if (fun.hasValue(this.form)) this.ARRAY_FORMULA.reset();

    this.COMPRADOEN = value;

    if (value === 'Quintal') {
      this.calculatePrice();
      this.form.controls.medida_contenido_padre.setValue('Libra');
    }

    if (formulario.calcular_saco && value !== 'Quintal' && value !== 'Libra') {
      fun.toastWarning('Solo se le puede calcular el saco a los productos comprados en Quintal o Libra');
      this.form.controls.calcular_saco.setValue(false);
    }

    this.fillDropAlerta(value);
  }

  // =============================================
  //  CREAR MAS INPUTS PARA DETALLE
  // =============================================

  createItem(): UntypedFormGroup {
    const permission = this.hasPermissionUpdateFormula;
    return this.fb.group({
      key: [{ value: fun.generateKey(), disabled: false }],
      id: [{ value: null, disabled: !permission }],
      articulo_id: [{ value: null, disabled: !permission }],
      cantidad_formula: [{ value: null, disabled: !permission }],
      medida_formula: [{ value: null, disabled: !permission }],
      costo_formula: [{ value: null, disabled: !permission }],
      precio_formula: [{ value: null, disabled: !permission }],
    });
  }

  resetArray() {
    this.ARRAY_FORMULA.clear();
  }

  addItem(): void {
    this.ARRAY_FORMULA.push(this.createItem());
  }

  removeItem(index: number) {
    this.ARRAY_FORMULA.removeAt(index);
  }

  checkCostoFormula(fila) {
    let res = false;
    const fila_formulario = fun.deepCloning(fila.value);
    const articulo = this.listaMateriasPrimasIndexed[fila_formulario.articulo_id];

    if (fila_formulario.costo_formula && fun.hasValue(articulo)) {
      const arrayUnidades = ['Unidad', 'Libra', 'Onza'];
      let costo_en_turno;
      let costo;
      for (const unidad_en_turno of arrayUnidades) {
        if (fun.hasValue(articulo.costos[unidad_en_turno])) {
          costo_en_turno = articulo.costos[unidad_en_turno];
          costo = fun.roundNumberToDecimal(costo_en_turno.costo);
        }
      }

      if (fun.desformatearStNumber(costo) != fun.desformatearStNumber(fila_formulario.costo_formula)) {
        res = true;
        if (!this.recalcular) this.recalcular = true;
      }
    }

    return res;
  }

  getFormControlInFormArray(index, formControlName) {
    return (this.ARRAY_FORMULA.controls[index] as FormGroup).get(formControlName);
  }

  getFormGroupInFormArray(index) {
    return this.ARRAY_FORMULA.controls[index] as FormGroup;
  }

  async getCosto(index, dropdown) {
    const unidades = { Unidad: 'Und.', Libra: 'Lbs.', Onza: 'Oz.' };
    const arrayUnidades = Object.keys(unidades);

    let extra = { afterPath: '', parameters: { costos: true } };

    this.articuloClass.getOne(this.ARRAY_FORMULA.value[index].articulo_id, extra).then(res => {
      let costo_en_turno;
      let medida_en_turno;
      for (const unidad_en_turno of arrayUnidades) {
        if (fun.hasValue(res.data['costos'][unidad_en_turno])) {
          costo_en_turno = res.data['costos'][unidad_en_turno];
          medida_en_turno = unidades[unidad_en_turno];
        }
      }

      const formGroup = this.getFormGroupInFormArray(index);
      if (fun.hasValue(formGroup)) {
        this.getFormControlInFormArray(index, 'medida_formula').setValue(medida_en_turno);
        this.getFormControlInFormArray(index, 'costo_formula').setValue(fun.roundNumberToDecimal(costo_en_turno.costo));
        this.getFormControlInFormArray(index, 'precio_formula').setValue(fun.roundNumberToDecimal(costo_en_turno.precio));
      }

      this.calculateCostoPT();
      dropdown.hide();
    });
  }

  calculateCostoPT() {
    const array = this.ARRAY_FORMULA.value;

    if (array.length > 0 && array !== undefined) {
      let sumatoriaMult = array.reduce((sum, item) => fun.desformatearStNumber(item.cantidad_formula) * fun.desformatearStNumber(item.costo_formula) + sum, 0);

      const formulario = this.form.getRawValue();

      if (fun.hasValue(formulario.otros_costos) && !isNaN(formulario.otros_costos)) {
        sumatoriaMult += fun.desformatearStNumber(formulario.otros_costos);
        this.form.controls.costo_principal.setValue(fun.roundNumberToDecimal(sumatoriaMult));
        this.calculatePrice();
        this.calculatePriceLibra();
      }
    }
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    this.router.navigateByUrl('/admin/dashboard');
  }

  // =============================================
  //  CHECK DETALLABLE
  // =============================================
  isDetallableClick() {
    this.isDetallable = !this.isDetallable;
  }

  // =============================================
  //  Calculate price
  // =============================================
  calculatePrice() {
    const formulario = this.form.getRawValue();

    const costo = fun.desformatearStNumber(formulario.costo_principal);

    if (costo > 0 && fun.hasValue(costo)) {
      // const precio = costo / 0.9;

      const precio = costo / this.configArticuloClass.getWinPercentCalc(this.config_articulos);
      const precio_rounded = fun.roundToNearestMultipleOf5(precio);
      const precioLibra = fun.roundToNearestMultipleOf5(precio_rounded / 100);

      this.form.controls.precio_principal.setValue(fun.roundNumberToDecimal(precio_rounded));
      this.form.controls.precio_libra.setValue(fun.roundNumberToDecimal(precioLibra));

      this.calculatePriceLibra();
    }
  }

  calculatePriceLibra() {
    const formulario = this.form.getRawValue();
    const medida = formulario.medida;

    const precio = fun.desformatearStNumber(formulario.precio_principal);

    const costo = fun.desformatearStNumber(formulario.costo_principal);

    if (precio > 0 && fun.hasValue(precio)) {
      const precioLibra = precio / 100;
      const costoLibra = costo / 100;
      if (medida === 'Quintal') {
        this.form.controls.precio_libra.setValue(fun.roundNumberToDecimal(precioLibra));
        this.form.controls.costo_padre.setValue(fun.roundNumberToDecimal(costoLibra));
        this.form.controls.precio_padre.setValue(fun.roundNumberToDecimal(precioLibra));
        this.form.controls.cantidad_contenido_padre.setValue(100);
      } else {
        this.calculatePricePadre();
        this.calculatePriceHijo();
      }
    }
  }

  calculatePricePadre() {
    const formulario = this.form.getRawValue();

    const precio = fun.desformatearStNumber(formulario.precio_principal);
    const precioPadreTemp = formulario.precio_padre;

    const costo = fun.desformatearStNumber(formulario.costo_principal);
    const cantidadPadre = formulario.cantidad_contenido_padre;

    if (fun.hasValue(precio) && precio > 0 && !isNaN(precio) && fun.hasValue(cantidadPadre) && cantidadPadre > 0 && !isNaN(cantidadPadre)) {
      const precioPadre = precio / cantidadPadre;
      const costoPadre = costo / cantidadPadre;

      this.form.controls.precio_padre.setValue(fun.roundNumberToDecimal(precioPadre));
      this.form.controls.costo_padre.setValue(fun.roundNumberToDecimal(costoPadre));
    }

    if (precioPadreTemp) this.calculatePriceHijo();
  }

  calculatePriceHijo() {
    const formulario = this.form.getRawValue();

    const precioP = fun.desformatearStNumber(formulario.precio_padre);

    const costoP = fun.desformatearStNumber(formulario.costo_padre);
    const cantidadHijo = formulario.cantidad_contenido_hijo;

    if (fun.hasValue(precioP) && precioP > 0 && !isNaN(precioP) && fun.hasValue(cantidadHijo) && cantidadHijo > 0 && !isNaN(cantidadHijo)) {
      const PrecioHijo = precioP / cantidadHijo;
      const costoHijo = costoP / cantidadHijo;
      this.form.controls.precio_hijo.setValue(fun.roundNumberToDecimal(PrecioHijo));
      this.form.controls.costo_hijo.setValue(fun.roundNumberToDecimal(costoHijo));
    }
  }

  formIsInvalid() {
    let res = true;
    const formulario = this.form.getRawValue();

    if (this.form.valid && !this.articulo_no_paquete) {
      if (this.tipoArticuloSelected.codigo == 'producto_terminado') {
        res = formulario.rowFormula.some(fila => fun.isEmpty(fila.articulo_id) || fun.isEmpty(fila.cantidad_formula));

        if (res) return res;
        else {
          res = fun.isEmpty(formulario.otros_costos) || fun.isEmpty(formulario.costo_principal) || fun.isEmpty(formulario.precio_principal);
          if (res) return res;
        }
      } else {
        res = false;
      }
      if (this.tipoArticuloSelected.tipo == 'venta_normal') {
        const contenido_padre_valid = !!formulario.cantidad_contenido_padre && !!formulario.precio_padre && !!formulario.costo_padre && !!formulario.medida_contenido_padre;

        if (this.COMPRADOEN == 'Quintal' || this.COMPRADOEN == 'Saco') {
          if (contenido_padre_valid) res = false;
          else res = true;
          if (res) return res;
        }

        if (this.COMPRADOEN == 'Caja') {
          if (this.MEDIDACAJA == 'Unidad') {
            if (contenido_padre_valid) res = false;
            else res = true;
          } else {
            if (contenido_padre_valid && formulario.cantidad_contenido_hijo && formulario.precio_hijo && formulario.costo_hijo && formulario.medida_contenido_hijo) res = false;
            else res = true;
          }
        }
      }
    } else res = true;

    return res;
  }

  fillDropAlerta(medida) {
    return new Promise<any>(resolve => {
      if (medida == 'Quintal') this.optionsAlerta = ['Quintal', 'Libra'];
      else if (medida == 'Libra') this.optionsAlerta = ['Libra'];
      else if (medida == 'Saco') this.optionsAlerta = ['Saco', 'Libra'];
      else if (medida == 'Caja') this.optionsAlerta = ['Caja', 'Paquete', 'Unidad'];
      else if (medida == 'Unidad') this.optionsAlerta = ['Unidad'];
      else if (medida == 'Galon') this.optionsAlerta = ['Galon', 'Onza'];
      else if (medida == 'Producto') this.optionsAlerta = ['Producto', 'Unidad'];
      else if (medida == 'Bolsa') this.optionsAlerta = ['Bolsa', 'Unidad'];
      resolve(true);
    });
  }

  seleccionarContenidoCaja() {
    const formulario = this.form.getRawValue();
    this.MEDIDACAJA = formulario.medida_contenido_padre;

    if (formulario.medida_alerta === 'Paquete' && formulario.medida_contenido_padre === 'Unidad') {
      this.articulo_no_paquete = true;
    } else {
      this.articulo_no_paquete = false;
    }
  }

  async recalcularFunc() {
    const temp = fun.deepCloning(this.tipoArticuloSelected);
    this.tipoArticuloSelected = undefined;
    this.resetArray();

    for (let indexFormula = 0; indexFormula < this.articuloSelected.formulas_productos_terminados.length; indexFormula++) {
      const ingredient = this.articuloSelected.formulas_productos_terminados[indexFormula];
      this.addItem();
      this.fillFormula(ingredient, indexFormula, true);
    }

    await this.calculateCostoPT();
    this.recalcular = null;
    this.tipoArticuloSelected = temp;
  }

  fillFormula(ingredient, indexFormula, recalcular = false) {
    try {
      const articulo_combo_id = ingredient.articulo_combo_id ?? ingredient?.articulo_combo?.id ?? ingredient.articulo_combo;
      const materiaPrima = this.listaMateriasPrimasIndexed[articulo_combo_id];

      const unidades_minimas = { Libra: 'Lbs.', Unidad: 'Und.', Onza: 'Oz.' };
      const arrayUnidades = Object.keys(unidades_minimas);

      let costo_en_turno;
      let precio_en_turno;
      let medida_en_turno;

      for (const unidad_en_turno of arrayUnidades) {
        if (fun.hasValue(materiaPrima.costos[unidad_en_turno])) {
          costo_en_turno = materiaPrima.costos[unidad_en_turno].costo;
          precio_en_turno = materiaPrima.costos[unidad_en_turno].precio;
          medida_en_turno = unidades_minimas[unidad_en_turno];
          break;
        }
      }

      const formGroup = this.getFormGroupInFormArray(indexFormula);

      if (fun.hasValue(formGroup)) {
        if (recalcular) {
          this.getFormControlInFormArray(indexFormula, 'costo_formula').setValue(fun.roundNumberToDecimal(costo_en_turno));
          this.getFormControlInFormArray(indexFormula, 'precio_formula').setValue(fun.roundNumberToDecimal(precio_en_turno));
        } else {
          this.getFormControlInFormArray(indexFormula, 'costo_formula').setValue(fun.roundNumberToDecimal(ingredient.costo));
          this.getFormControlInFormArray(indexFormula, 'precio_formula').setValue(fun.roundNumberToDecimal(ingredient.precio));
        }

        this.getFormControlInFormArray(indexFormula, 'medida_formula').setValue(medida_en_turno);
        this.getFormControlInFormArray(indexFormula, 'articulo_id').setValue(articulo_combo_id);
        this.getFormControlInFormArray(indexFormula, 'id').setValue(ingredient.id || null);
        this.getFormControlInFormArray(indexFormula, 'cantidad_formula').setValue(fun.roundNumberToDecimal(ingredient.cantidad, 4));

        const keyControl = this.getFormControlInFormArray(indexFormula, 'key');
        if (fun.isEmpty(keyControl.value)) keyControl.setValue(fun.generateKey());
      }
    } catch (error) {
      console.error(error);

      fun.toastError(recalcular ? 'Error recalculando los costos de la formula.' : 'Error rellenando los campos del formulario', 'ERROR');
    }
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  articuloIsComprado() {
    const articulos_comprados = ['venta_normal'];

    return fun.isEmpty(this.tipoArticuloSelected) ? true : articulos_comprados.includes(this.tipoArticuloSelected.tipo);
  }

  async editarItem(articulo: ArticuloI) {
    this.borrar();

    this.form.patchValue(articulo);
    this.articuloSelected = articulo;
    this.botonLabel = 'Editar';
    this.COMPRADOEN = '';
    this.MEDIDACAJA = '';

<<<<<<< HEAD
    await this.selectTipoArticulo(articulo.tipo_articulo_id);
    await this.selectSubTipoArticulo(articulo.sub_tipo_articulo_id);
    if (fun.hasValue(this.ARRAY_FORMULA)) this.resetArray();

=======
    this.tipoArticuloSelected = this.listaTipoArticulos.find(val => val.id == Number(articulo.tipo_articulo_id));
>>>>>>> dev
    this.is_combo = articulo.is_combo;

    this.listaEntidadCuentasContables = this.entCuentaContServ.parseCuentasFromBackend(articulo.cuentas_contables);

    if (articulo.is_combo || (articulo.formulas_productos_terminados && articulo.formulas_productos_terminados.length)) {
      this.COMPRADOEN = 'Quintal';
      this.form.controls.otros_costos.setValue(fun.roundNumberToDecimal(articulo.otros_costos));

      if (articulo.formulas_productos_terminados.length) {
        this.form.controls.medida.setValue(this.medida_config);
        this.resetCompradoEn(this.medida_config);

        for (let index = 0; index < articulo.formulas_productos_terminados.length; index++) {
          const ingredient = articulo.formulas_productos_terminados[index];

          this.addItem();
          this.fillFormula(ingredient, index);
        }
      } else {
        this.addItem();
      }
    } else {
      this.COMPRADOEN = articulo.medida;
    }

    if (articulo.contenido_articulos.length > 0) this.MEDIDACAJA = articulo.contenido_articulos[0].medida;

    this.fillDropAlerta(articulo.medida).then(() => {
      for (let indexContenido = 0; indexContenido < articulo.contenido_articulos.length; indexContenido++) {
        const contenido = articulo.contenido_articulos[indexContenido];

        if (articulo.contenido_articulos.length === 1) {
          if (articulo.contenido_articulos[0].medida === 'Libra') {
            this.form.controls.precio_libra.setValue(fun.roundNumberToDecimal(contenido.precio));
            this.form.controls.costo_padre.setValue(contenido.costo);
            this.form.controls.id_contenido_padre.setValue(contenido.id);
          } else {
            this.form.controls.precio_unidad.setValue(fun.roundNumberToDecimal(contenido.precio));
            this.form.controls.costo_padre.setValue(contenido.costo);
            this.form.controls.id_contenido_padre.setValue(contenido.id);
          }
        }

        if (contenido.condicion === 'hijo') {
          this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
          this.form.controls.precio_hijo.setValue(fun.roundNumberToDecimal(contenido.precio));
          this.form.controls.costo_hijo.setValue(contenido.costo);
          this.form.controls.id_contenido_hijo.setValue(contenido.id);
          this.form.controls.referencia_hijo.setValue(contenido.referencia);
        } else {
          this.form.controls.cantidad_contenido_padre.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_padre.setValue(contenido.medida);

          this.form.controls.precio_padre.setValue(fun.roundNumberToDecimal(contenido.precio));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        }
      }

      this.form.controls.costo_principal.setValue(fun.roundNumberToDecimal(articulo.costo_principal));
      this.form.controls.precio_principal.setValue(fun.roundNumberToDecimal(articulo.precio_principal));
      this.form.controls.medida_alerta.setValue(articulo.medida_alerta);
      this.modificateValidators();
    });
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['cedula', 'rnc', 'nombre', 'apellido', 'telefono', 'sexo', 'limite_credito', 'maximo_credito', 'vendedor_id', 'direccion', 'id', 'img'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);
    formValue['maximo_credito'] = fun.desformatearStNumber(formValue['maximo_credito']);
    formValue['cuentas_contables'] = fun.deepCloning(this.listaEntidadCuentasContables);

    const originalArticulo = this.listaArticulos.find((cliente) => cliente.id == formValue.id);
    const originalValue = fun.pick(originalArticulo, pick_values);

    originalValue['img'] = originalArticulo.img_cliente;
    originalValue['cedula'] = originalArticulo?.documentos_de_identidad.find((doc) => doc.descripcion == 'cedula')?.documento;
    originalValue['rnc'] = originalArticulo?.documentos_de_identidad.find((doc) => doc.descripcion == 'rnc')?.documento;
    originalValue['cuentas_contables'] = fun.deepCloning(this.entCuentaContServ.parseCuentasFromBackend(originalArticulo?.cuentas_contables));

    return !fun.isEqual(formValue, originalValue);
  }

  formarContenido() {
    const formulario = this.form.getRawValue();

    if (formulario.medida === 'Quintal' || formulario.medida === 'Saco') formulario.medida_contenido_padre = 'Libra';

    const padre = {
      referencia: null,
      articulo_id: formulario.id,
      id: fun.hasValue(formulario.id_contenido_padre) ? formulario.id_contenido_padre : null,
      costo: typeof formulario.costo_padre == 'string' ? parseFloat(formulario.costo_padre) : formulario.costo_padre,
      precio: fun.desformatearStNumber(['Caja', 'Saco', 'Producto', 'Galon'].includes(formulario.medida) ? formulario.precio_padre : formulario.precio_libra),
      cantidad: ['Caja', 'Saco', 'Producto', 'Galon'].includes(formulario.medida) ? formulario.cantidad_contenido_padre : 100,
      medida: formulario.medida_contenido_padre,
      condicion: 'padre',
    };

    const hijo = {
      referencia: formulario.referencia_hijo,
      articulo_id: formulario.id,
      id: fun.hasValue(formulario.id_contenido_hijo) ? formulario.id_contenido_hijo : null,
      costo: typeof formulario.costo_hijo == 'string' ? parseFloat(formulario.costo_hijo) : formulario.costo_hijo,
      precio: fun.desformatearStNumber(formulario.precio_hijo),
      cantidad: formulario.cantidad_contenido_hijo,
      medida: formulario.medida_contenido_hijo,
      condicion: 'hijo',
    };

    let contenido = [];
    if (fun.hasValue(formulario.medida_contenido_padre)) {
      contenido = [padre];
      if (fun.hasValue(formulario.medida_contenido_hijo)) contenido = [padre, hijo];
    }

    return contenido;
  }

<<<<<<< HEAD
  prue() {}

=======
>>>>>>> dev
  checkLongDecimales(event) {
    let check_obj = fun.checkLongDecimales(event.target.value, 4);
    event.target.value = check_obj.value;

    if (check_obj.error) fun.toastWarning('La cantidad de números decimales no puede ser mayor a 4', 'AVISO');
  }

  formarFormula() {
    const formulas = [];
    const unidades = { 'Und.': 'Unidad', 'Lbs.': 'Libra', 'Oz.': 'Onza' };
<<<<<<< HEAD
    this.ARRAY_FORMULA.value.forEach((element) => {
=======
    
    array.forEach(element => {
>>>>>>> dev
      const obj = {
        id: fun.hasValue(element.id) ? Number(element.id) : null,
        articulo_combo_id: Number(element.articulo_id),
        cantidad: fun.desformatearStNumber(element.cantidad_formula),
        costo: fun.desformatearStNumber(element.costo_formula),
        precio: fun.desformatearStNumber(element.precio_formula),
        medida: unidades[element.medida_formula],
      };
      formulas.push(obj);
    });
    return formulas;
  }

  eliminarReg(regisData) {
    const onYes = () => {
      this.articuloClass.deleteOne(regisData.id).then(res => {
        const actualPagination = this.tServ.getPaginationById('lista_articulos');
        this.getArticulos(actualPagination);
        this.borrar();
      });
    };

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: `¿Está seguro que desea eliminar el artículo <b> ${regisData.nombre}</b>?`,
      btnKind: confirmationButtons.cancelarEliminar,
      onYes: onYes.bind(this),
    });

  }

  validate_cuentas() {
    return this.entCuentaContServ.validateEntidades({ configsEntCuentas: this.listaConfigArticulos, entidad_cuentas_contables: this.listaEntidadCuentasContables });
  }

  // =============================================
  //  Crear articulo
  // =============================================

  submit() {
    const formulario = this.form.getRawValue();

    if (ConfigService.config.has_contabilidad) {
      const entidades_validation = this.validate_cuentas();

      if (!entidades_validation.error) {
        if (fun.isEmpty(formulario.id)) {
          const confirmationObj = {
            id: 'aviso_cuentas',
            texto: 'Confirme las <b class="negrita">CUENTAS CONTABLES</b>, una vez registrado el articulo, no se podrán modificar sus <b class="negrita"> CUENTAS CONTABLES </b> ¿Desea continuar?',
            header: 'Confirmación',
            siFunction: async (instance) => {
              this.sendData();
              instance.dismissModal(instance.id);
            },
            width: '30rem',
          };

          this.confirmationModal(confirmationObj);
        } else {
          this.sendData();
        }
      } else {
        fun.toastError(entidades_validation.msg, 'Error');
      }
    } else {
      this.sendData();
    }
  }

  sendData() {
    const formulario = this.form.getRawValue();

    const articuloData = {
      id: fun.hasValue(formulario.id) ? Number(formulario.id) : null,
      tipo_articulo_id: Number(formulario.tipo_articulo_id),
      sub_tipo_articulo_id: Number(formulario.sub_tipo_articulo_id),
      nombre: formulario.nombre,
      costo_principal: this.tipoArticuloSelected.tipo != 'servicio' ? fun.desformatearStNumber(formulario.costo_principal) : 0,
      precio_principal: fun.desformatearStNumber(formulario.precio_principal),
      aviso_existencia: formulario.aviso_existencia,
      medida_alerta: formulario.medida_alerta,
      fecha_ingreso: formulario.id ? formulario.fecha_ingreso : DateUtils.format(),
      medida: this.tipoArticuloSelected.tipo != 'servicio' ? formulario.medida : null,
      is_detallable: formulario.is_detallable,
      contenido_articulos: this.formarContenido(),
      existencia: formulario.existencia,
      calcular_itbis: formulario.calcular_itbis !== null ? formulario.calcular_itbis : false,
      estado: true,
      is_combo: this.is_combo,
      vendido_en: formulario.vendido_en,
      is_materia_prima: formulario.is_materia_prima,
      calcular_saco: formulario.calcular_saco,
    };

    if (ConfigService.config.has_contabilidad) articuloData['cuentas_contables'] = this.listaEntidadCuentasContables;

    if (articuloData.is_combo || (fun.hasValue(this.ARRAY_FORMULA.value) && this.ARRAY_FORMULA.value.length)) {
      articuloData['is_combo'] = true;
      articuloData['otros_costos'] = formulario.otros_costos;
      articuloData['formulas_productos_terminados'] = this.formarFormula();
    }

<<<<<<< HEAD
    this.articuloClass.createUpdateOne(articuloData).then((res) => {
=======
    this.articuloClass.createUpdateOne(obj).then(res => {
>>>>>>> dev
      this.necesarioStart();
      this.borrar();
    });
  }
}
