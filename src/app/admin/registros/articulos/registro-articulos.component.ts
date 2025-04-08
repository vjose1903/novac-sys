import { HtmlElementsService } from '@core/services/html-elements.service';
import { ConfigArticulosComponent } from './configuracion_articulos/config-articulos/config-articulos.component';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, OnChanges, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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
import { ModalClass } from '@components/modal/modal-class';
const moment = require('../../../core/javascript/moment');
const $ = require('jquery');

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

  boton = '';
  form: UntypedFormGroup;

  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaArticulos = [];
  FORM: any;
  listaTipoArticulos: any;

  optionsAlerta: any[];
  alertaMedida: any;

  articulo_no_paquete = false;
  tipoArticuloSelected: any;

  isCreando: boolean = false;

  ARRAY_FORMULA: UntypedFormArray;
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
    { backend: 'Funda', front: 'Funda' },
  ];

  articuloClass = new ArticuloC();
  tipoArticuloClass = new TipoArticuloC();
  configArticuloClass = new ConfigArticuloC();

  fechaFactura: string;
  permissions = Permisos;
  formPermissions = [Permisos.articulo.create, Permisos.articulo.update];
  hasPermissionUpdateFormula = false;
  configApp: ConfigI;
  medida_config: string;

  table_config: table_config = {
    info: [
      { titulo: 'Cod.', tipo: 'text', key: 'codigo', style: { width: '3.5rem', padding: '0.5rem 0rem', 'padding-left': '0.2rem' } },
      { titulo: 'Articulo', tipo: 'text', key: 'nombre', style: { width: '37%', 'text-align': 'left' } },
      { titulo: 'Medida', tipo: 'text', key: 'medida', style: { padding: '0.5rem 0rem' } },
      { titulo: 'Precio', tipo: 'formatoNumero', key: 'precio_principal' },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_articulos',
    padre_functions: { data_request: params => this.getArticulos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.articulo.update }, borrar: { show: true, permiso: this.permissions.articulo.destroy } },
  };
  tablaComponent;
  cofig_articulos: ConfigArticuloI;

  htmlServ = inject(HtmlElementsService);

  constructor(
    private cdRef: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private router: Router,
    private tServ: TablasService,
    private permissionsService: NgxPermissionsService
  ) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_articulo', is_routing: true });
    this.createForm();
    this.configApp = Ss.configServ.getConfig({ isPromise: false }) as ConfigI;
    this.medida_config = this.configApp.medida_producto_terminado;

    this.permissionsService.hasPermission(this.permissions.articulo.update_formula).then(result => {
      this.hasPermissionUpdateFormula = result;
    });

    this.FORM = this.form.controls;

    this.boton = 'Registrar';
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
    this.borrar();
  }

  async necesarioStart() {
    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];

    const actualPagination = this.tServ.getPaginationById('lista_articulos') || this.tServ.obj_paginate.default;

    await this.getArticulos(actualPagination);
    this.getTipoArticulos();
    this.getConfiguracionArticulo();

    fun.enfocarInput('nombre');
  }

  getConfiguracionArticulo() {
    this.configArticuloClass.getOne(1).then(cofig_articulos => {
      this.cofig_articulos = cofig_articulos.data;
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
    this.listaTipoArticulos = [];
    this.tipoArticuloClass.getAll().then(res => {
      this.listaTipoArticulos = fun.deepCloning(res.data);
    });
  }

  openModalConfig() {
    this.openNewModal({
      component: ConfigArticulosComponent,
      inputs: { cofig_articulos: this.cofig_articulos },
      id: 'cofig_articulos',
      header: 'Configuraciones de articulos',
      width: '50rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco', function: instance => this.closeModal(instance), label: 'Cancelar', disable: false },
          { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
        ],
      },
    });
  }

  async getDataFromModal(arg, search?) {
    if (arg.modal_id == 'cofig_articulos') {
      this.cofig_articulos = arg.data;

      const actualPagination = this.tServ.getPaginationById('lista_articulos');
      this.getArticulos(actualPagination);
    }
  }

  async getArticulos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    this.listaArticulos.length = 0;
    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, page: params.page, per_page: params.per_page, fecha: this.fechaFactura, paginado: true }).then(res => {
      this.listaArticulos = res.data;
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  ngOnChanges() {
    this.cdRef.detectChanges();
  }

  showContenido(value) {
    const array = ['Caja', 'Saco', 'Galon', 'Funda', 'Producto'];
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

  async selectTipoArticulo(tipo) {
    this.tipoArticuloSelected = this.listaTipoArticulos.find(val => val.id == Number(tipo));
    this.modificateValidators();

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

  modificateValidators() {
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
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.Capitalice(arg));
  }

  createForm() {
    this.form = this.fb.group({
      nombre: [null, Validators.required],
      tipo_articulo_id: [null, Validators.required],
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

  saltar(campo, i?) {
    let is_invalid = true;
    if (campo != 'send' && campo != 'cantidad_formula' && campo != 'ingrediente_producir' && campo != 'in_medida_alerta') {
      fun.enfocarInput(campo);
      //
    } else if (campo == 'ingrediente_producir') {
      fun.enfocarInput(`cantidad_formula-${i}`);
      //
    } else if (campo == 'in_medida_alerta') {
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
    } else if (campo == 'cantidad_formula') {
      const actual_campo = i >= 0 ? `#cantidad_formula-${i}` : '#vendido';
      var field = $(actual_campo)[0];

      var fields = $(actual_campo).parents('form:eq(0),body').find(':input').not('[tabindex]');

      var index = _.findIndex(fields, field);

      if (index > -1 && index + 1 < fields.length) fields.eq(index + 1).focus();
    } else {
      is_invalid = this.formIsInvalid();
    }

    if (!is_invalid) {
      fun.enfocarInput('nombre');
      this.submit();
    }
  }

  borrar(reset = false) {
    [this.articuloSelected, this.tipoArticuloSelected] = Array(2).fill(undefined);

    if (fun.hasValue(this.form)) this.form.reset();
    if (fun.hasValue(this.form)) this.form.controls.is_detallable.setValue(false);
    if (fun.hasValue(this.form)) this.form.controls.existencia.setValue(0);

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

    if (fun.hasValue(this.FORM)) this.FORM.rowFormula.reset();

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
    return ((this.form.get('rowFormula') as FormArray).controls[index] as FormGroup).get(formControlName);
  }

  getFormGroupInFormArray(index) {
    return (this.form.get('rowFormula') as FormArray).controls[index] as FormGroup;
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
      let sumatoriaMult = _.reduce(array, (sum, item) => fun.desformatearStNumber(item.cantidad_formula) * fun.desformatearStNumber(item.costo_formula) + sum, 0);

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

      const precio = costo / this.configArticuloClass.getWinPercerntCalc(this.cofig_articulos);
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
      else if (medida == 'Funda') this.optionsAlerta = ['Funda', 'Unidad'];
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

    for (let i = 0; i < this.articuloSelected.formulas_productos_terminados.length; i++) {
      const ingredient = this.articuloSelected.formulas_productos_terminados[i];
      this.addItem();
      this.fillFormula(ingredient, i, true);
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

  async editarItem(articulo) {
    this.borrar();

    this.form.patchValue(articulo);
    this.articuloSelected = articulo;
    this.boton = 'Editar';
    this.COMPRADOEN = '';
    this.MEDIDACAJA = '';

    this.tipoArticuloSelected = this.listaTipoArticulos.find(val => val.id == Number(articulo.tipo_articulo_id));
    this.is_combo = articulo.is_combo;

    if (articulo.is_combo || (articulo.formulas_productos_terminados && articulo.formulas_productos_terminados.length)) {
      this.COMPRADOEN = 'Quintal';
      this.form.controls.otros_costos.setValue(fun.roundNumberToDecimal(articulo.otros_costos));

      await this.getMateriasP().then(() => {
        if (articulo.formulas_productos_terminados.length) {
          this.form.controls.medida.setValue(this.medida_config);
          this.resetCompradoEn(this.medida_config);

          const formGroup = this.getFormGroupInFormArray(0);

          for (let index = 0; index < articulo.formulas_productos_terminados.length; index++) {
            const ingredient = articulo.formulas_productos_terminados[index];

            this.addItem();
            this.fillFormula(ingredient, index);
          }
        } else {
          this.addItem();
        }
      });
    } else this.COMPRADOEN = articulo.medida;

    if (articulo.contenido_articulos.length > 0) this.MEDIDACAJA = articulo.contenido_articulos[0].medida;

    this.fillDropAlerta(articulo.medida).then(() => {
      for (let j = 0; j < articulo.contenido_articulos.length; j++) {
        const contenido = articulo.contenido_articulos[j];
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

      this.form.controls.tipo_articulo_id.setValue(articulo['tipo_articulo_id']);
      this.form.controls.costo_principal.setValue(fun.roundNumberToDecimal(articulo.costo_principal));
      this.form.controls.precio_principal.setValue(fun.roundNumberToDecimal(articulo.precio_principal));
      this.form.controls.medida_alerta.setValue(articulo.medida_alerta);
      this.modificateValidators();
    });
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  formarContenido() {
    const formulario = this.form.getRawValue();

    if (formulario.medida === 'Quintal' || formulario.medida === 'Saco') formulario.medida_contenido_padre = 'Libra';

    const padre = {
      referencia: null,
      articulo_id: formulario.id,
      id: fun.hasValue(formulario.id_contenido_padre) ? formulario.id_contenido_padre : null,
      costo: _.isString(formulario.costo_padre) ? parseFloat(formulario.costo_padre) : formulario.costo_padre,
      precio: fun.desformatearStNumber(['Caja', 'Saco', 'Producto', 'Galon'].includes(formulario.medida) ? formulario.precio_padre : formulario.precio_libra),
      cantidad: ['Caja', 'Saco', 'Producto', 'Galon'].includes(formulario.medida) ? formulario.cantidad_contenido_padre : 100,
      medida: formulario.medida_contenido_padre,
      condicion: 'padre',
    };

    const hijo = {
      referencia: formulario.referencia_hijo,
      articulo_id: formulario.id,
      id: fun.hasValue(formulario.id_contenido_hijo) ? formulario.id_contenido_hijo : null,
      costo: _.isString(formulario.costo_hijo) ? parseFloat(formulario.costo_hijo) : formulario.costo_hijo,
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

  prue() {
    // var keypressEvent = $.Event('keydown', { which: 9, keyCode: 9 });
    // $(`#nombre`).siblings();

    ($(`#articulo_id-0`)[0].firstChild as any).focus();
    // var fields = $(`#cantidad_formula-0`).parents('form:eq(0),body').find(':input').not('[tabindex]');
    // var index = fields.index($(`#cantidad_formula-0`));
    // if (index > -1 && index + 1 < fields.length) fields.eq(index + 1).focus();
    // if (index > -1 && index + 1 < fields.length) fields.eq(index + 1).focus();

    // $(`#nombre`).trigger(keypressEvent);
  }

  checkLongDecimales(event) {
    let check_obj = fun.checkLongDecimales(event.target.value, 4);
    event.target.value = check_obj.value;

    if (check_obj.error) fun.toastWarning('La cantidad de números decimales no puede ser mayor a 4', 'AVISO');
  }

  formarFormula() {
    const array = this.ARRAY_FORMULA.value;
    const formulas = [];
    const unidades = { 'Und.': 'Unidad', 'Lbs.': 'Libra', 'Oz.': 'Onza' };
    array.forEach(element => {
      const obj = {
        id: fun.hasValue(element.id) ? Number(element.id) : null,
        articulo_combo: Number(element.articulo_id),
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
    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar el artículo <b> ${regisData.nombre}</b>?`,
      siFunction: () => {
        this.articuloClass.deleteOne(regisData.id).then(res => {
          const actualPagination = this.tServ.getPaginationById('lista_articulos');
          this.getArticulos(actualPagination);
          this.borrar();
        });
      },
    };

    this.eliminarRegistro(objToSend);
  }

  // =============================================
  //  Crear articulo
  // =============================================

  submit() {
    const formulario = this.form.getRawValue();

    const obj = {
      id: fun.hasValue(formulario.id) ? Number(formulario.id) : null,
      tipo_articulo_id: Number(formulario.tipo_articulo_id),
      nombre: formulario.nombre,
      costo_principal: this.tipoArticuloSelected.tipo != 'servicio' ? fun.desformatearStNumber(formulario.costo_principal) : 0,
      precio_principal: fun.desformatearStNumber(formulario.precio_principal),
      aviso_existencia: formulario.aviso_existencia,
      medida_alerta: formulario.medida_alerta,
      fecha_ingreso: formulario.id ? formulario.fecha_ingreso : moment().format('DD/MM/YYYY'),
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

    const array = this.ARRAY_FORMULA.value;

    if (obj.is_combo || (array && array.length)) {
      obj['is_combo'] = true;
      obj['otros_costos'] = formulario.otros_costos;
      obj['formulas_productos_terminados'] = this.formarFormula();
    }

    this.articuloClass.createUpdateOne(obj).then(res => {
      this.necesarioStart();
      this.borrar();
    });
  }
}
