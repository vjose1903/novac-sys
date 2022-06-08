import { Component, OnInit, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import * as moment from '../../../core/javascript/moment';
import { ArticuloC, TipoArticuloC, tipos_articulos } from './articulo';
import * as $ from 'jquery';
import { fun } from '../../../core/services/functions.service';
import { table_config } from '../../components/new_tablas/tabla-class';
import { Permisos } from '../../../core/typescript/permisos';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss'],
})
export class RegistroArticulosComponent extends MixinClass implements OnInit, OnDestroy, OnChanges {
  // =============================================
  //  TABLAS
  // =============================================

  boton = '';
  form: FormGroup;

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
  TIPOARTICULO: any;

  isCreando: boolean = false;

  ARRAY_FORMULA: FormArray;
  COMPRADOEN: any;
  MEDIDACAJA: any;
  is_combo = false;
  recalcular = false;

  vendido_en: any;
  listaMateriasPrimas = [];

  vendidoEn = [
    { backend: 'Unidad', front: 'Unidad' },
    { backend: 'Saco', front: 'Saco' },
    { backend: 'Galon', front: 'Galón' },
    { backend: 'Funda', front: 'Funda' },
  ];

  fechaFactura: string;
  articuloClass = new ArticuloC();
  tipoArticuloClass = new TipoArticuloC();
  permissions = Permisos;
  formPermissions = [Permisos.articulo.create, Permisos.articulo.update];
  hasPermissionUpdateFormula = false;

  table_config: table_config = {
    info: [
      { titulo: 'Cod.', tipo: 'text', key: 'codigo', estilos: [{ width: '12%' }, { padding: '0.5rem 0rem' }, { 'padding-left': '1rem' }] },
      { titulo: 'Articulo', tipo: 'text', key: 'nombre', estilos: [{ width: '37%' }, { 'text-align': 'left' }] },
      { titulo: 'Medida', tipo: 'text', key: 'medida', estilos: [{ width: '13%' }, { padding: '0.5rem 0rem' }] },
      { titulo: 'Precio', tipo: 'formatoNumero', key: 'precio_principal', estilos: [{ width: '20%' }] },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_articulos',
    padre_functions: { data_request: (params) => this.getArticulos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.articulo.update }, borrar: { show: true, permiso: this.permissions.articulo.destroy } },
  };
  tablaComponent;
  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private router: Router, private tServ: TablasService, private permissionsService: NgxPermissionsService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_articulo', is_routing: true });
    this.createForm();

    this.permissionsService.hasPermission(this.permissions.articulo.update_formula).then((result) => {
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

  // async filtrarArticulo(e) {
  //   this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];
  //   await this.getArticulos(e);
  // }

  async necesarioStart() {
    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];
    // await this.getArticulos(this.tServ.obj_paginate.default);
    await this.getArticulos({ page: 1, per_page: 20, search: ' ' });
    this.getTipoArticulos();
    this.enfocarInput('nombre');
  }

  getMateriasP() {
    return new Promise(async (resolve) => {
      const fechaActual = this.formarFechaFactura(new Date())['FechaFactura'];

      this.articuloClass.getArticulosFiltrado({ buscar: ' ', fecha: fechaActual, paginado: false, tipo: tipos_articulos.Materia_prima }).then((res) => {
        this.listaMateriasPrimas = fun.duplicarJson(res['data']);
        resolve(true);
      });
    });
  }

  getTipoArticulos() {
    this.listaTipoArticulos = [];
    this.tipoArticuloClass.getAll().then((res) => {
      this.listaTipoArticulos = fun.duplicarJson(res);
    });
  }

  async getArticulos(params?: { per_page: number; page: number; search: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    this.listaArticulos.length = 0;
    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, page: params.page, per_page: params.per_page, fecha: this.fechaFactura, paginado: true }).then((res) => {
      res.data.map(async (arti) => {
        arti.customStyles = {
          codigo: { width: '12%' },
          nombre: { width: '37%', 'text-align': 'left', 'padding-left': '0.5rem' },
          medida: { width: '13%' },
          precio_principal: { width: '20%' },
        };
      });

      this.listaArticulos = res.data;
      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
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

    fun.revisarPrecio(input, id).then((res) => {
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
    this.TIPOARTICULO = this.listaTipoArticulos.find((val) => val.id === _.parseInt(tipo)).descripcion;
    const tipo_check = _.lowerCase(this.TIPOARTICULO);

    if (tipo_check === 'materia prima') {
      this.form.controls.is_materia_prima.setValue(true);
    } else {
      this.form.controls.is_materia_prima.setValue(this.articuloSelected ? this.articuloSelected.is_materia_prima : false);
    }

    if (tipo_check == 'producto terminado') {
      await this.getMateriasP().then((res) => {
        this.addItem();
        this.resetCompradoEn('Producto');
        this.is_combo = true;
        this.form.controls.medida.setValue('Producto');
        this.form.controls.costo_principal.reset(null);
        this.form.controls.precio_principal.reset(null);
      });
    } else {
      this.resetArray();
      this.is_combo = false;
    }

    this.form.controls.calcular_saco.setValue(false);
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

    this.ARRAY_FORMULA = this.form.controls['rowFormula'] as FormArray;
  }

  saltar(campo, i?) {
    if (campo != 'send' && campo != 'cantidad_formula' && campo != 'ingrediente_producir') {
      this.enfocarInput(campo);
    } else if (campo == 'ingrediente_producir') {
      this.enfocarInput(`cantidad_formula-${i}`);
    } else if (campo == 'cantidad_formula') {
      const actual_campo = i >= 0 ? `#cantidad_formula-${i}` : '#vendido';
      var field = $(actual_campo)[0];

      var fields = $(actual_campo).parents('form:eq(0),body').find(':input').not('[tabindex]');

      // var index = fields.index(actual_campo);
      var index = _.findIndex(fields, field);

      if (index > -1 && index + 1 < fields.length) fields.eq(index + 1).focus();
    } else {
      const is_invalid = this.formIsInvalid();

      if (!is_invalid) {
        this.enfocarInput('nombre');
        setTimeout(() => this.submit(), 250);
      }
    }
  }

  borrar(reset = false) {
    this.articuloSelected = undefined;
    this.form.reset();
    this.enfocarInput('nombre');
    this.form.controls.is_detallable.setValue(false);
    this.form.controls.existencia.setValue(0);
    this.boton = 'Registrar';
    this.TIPOARTICULO = '';
    this.recalcular = false;
    if (this.is_combo) this.resetArray();

    this.is_combo = false;
    this.form.controls['rowFormula'].reset();

    if (reset) this.isCreando = true;
  }

  resetCompradoEn(value) {
    const formulario = this.form.getRawValue();

    const fields = ['medida_alerta', 'medida_contenido_padre', 'medida_contenido_hijo', 'cantidad_contenido_padre', 'cantidad_contenido_hijo', 'precio_padre', 'precio_libra', 'precio_hijo'];

    fields.forEach((field) => {
      this.form.controls[field].reset(null);
      console.log('.');
    });

    this.FORM.rowFormula.reset();

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

  createItem(): FormGroup {
    const permission = this.hasPermissionUpdateFormula;
    return this.fb.group({
      id: [{ value: null, disabled: !permission }],
      articulo_id: [{ value: null, disabled: !permission }],
      cantidad_formula: [{ value: null, disabled: !permission }],
      medida_formula: [{ value: null, disabled: !permission }],
      costo_formula: [{ value: null, disabled: !permission }],
      precio_formula: [{ value: null, disabled: !permission }],
      _destroy: [{ value: null, disabled: !permission }],
    });
  }

  resetArray() {
    this.ARRAY_FORMULA = this.form.get('rowFormula') as FormArray;

    this.ARRAY_FORMULA.value.forEach((element) => this.removeItem(0));
  }

  addItem(): void {
    this.ARRAY_FORMULA = this.form.get('rowFormula') as FormArray;
    this.ARRAY_FORMULA.push(this.createItem());
  }

  removeItem(i: number) {
    const control = this.form.controls['rowFormula'] as FormArray;
    control.removeAt(i);
  }

  checkCostoFormula(fila) {
    let res = false;
    const fila_formulario = fun.duplicarJson(fila.value);
    const articulo = this.listaMateriasPrimas.find((val) => Number(val.id) === Number(fila_formulario.articulo_id));

    if (fila_formulario.costo_formula && fun.hasValue(articulo)) {
      const arrayUnidades = ['Unidad', 'Libra', 'Onza'];
      let costo_en_turno;
      let costo;
      for (const unidad_en_turno of arrayUnidades) {
        if (fun.hasValue(articulo.costos[unidad_en_turno])) {
          costo_en_turno = articulo.costos[unidad_en_turno];
          costo = fun.numFormatTwoDecimals(costo_en_turno.costo);
        }
      }

      if (fun.desformatear(costo) != fun.desformatear(fila_formulario.costo_formula)) {
        res = true;
        setTimeout(() => (this.recalcular = true), 10);
      }
    }

    return res;
  }

  async getCosto(index, dropdown) {
    const control = this.form.controls['rowFormula'] as FormArray;
    const unidades = { Unidad: 'Und.', Libra: 'Lbs.', Onza: 'Oz.' };
    const arrayUnidades = Object.keys(unidades);
    (control.controls[index] as any).controls['costo_formula'].setValue(null);

    let extra = { afterPath: '', parameters: { costos: true } };

    this.articuloClass.getOne(control.value[index].articulo_id, extra).then((res) => {
      let costo_en_turno;
      let medida_en_turno;
      for (const unidad_en_turno of arrayUnidades) {
        if (fun.hasValue(res.data.costos[unidad_en_turno])) {
          costo_en_turno = res.data.costos[unidad_en_turno];
          medida_en_turno = unidades[unidad_en_turno];
        }
      }

      console.log('res.data ', res.data);

      (control.controls[index] as any).controls['medida_formula'].setValue(medida_en_turno);

      (control.controls[index] as any).controls['costo_formula'].setValue(fun.numFormatTwoDecimals(costo_en_turno.costo));
      (control.controls[index] as any).controls['precio_formula'].setValue(fun.numFormatTwoDecimals(costo_en_turno.precio));

      this.calculateCostoPT();
      dropdown.hide();
    });
  }

  calculateCostoPT() {
    const array = this.ARRAY_FORMULA.value;

    if (array.length > 0 && array !== undefined) {
      let sumatoriaMult = _.reduce(array, (sum, item) => fun.desformatear(item.cantidad_formula) * fun.desformatear(item.costo_formula) + sum, 0);

      const formulario = this.form.getRawValue();

      if (fun.hasValue(formulario.otros_costos) && !isNaN(formulario.otros_costos)) {
        sumatoriaMult += fun.desformatear(formulario.otros_costos);
        this.form.controls.costo_principal.setValue(fun.numFormatTwoDecimals(sumatoriaMult));
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

    const costo = fun.desformatear(formulario.costo_principal);

    if (costo > 0 && fun.hasValue(costo)) {
      const precio = costo / 0.9;
      const precioLibra = precio / 100;
      this.form.controls.precio_principal.setValue(fun.numFormatTwoDecimals(precio));
      this.form.controls.precio_libra.setValue(fun.numFormatTwoDecimals(precioLibra));

      this.calculatePriceLibra();
    }
  }

  calculatePriceLibra() {
    const formulario = this.form.getRawValue();
    const medida = formulario.medida;

    const precio = fun.desformatear(formulario.precio_principal);

    const costo = fun.desformatear(formulario.costo_principal);

    if (precio > 0 && fun.hasValue(precio)) {
      const precioLibra = precio / 100;
      const costoLibra = costo / 100;
      if (medida === 'Quintal') {
        this.form.controls.precio_libra.setValue(fun.numFormatTwoDecimals(precioLibra));
        this.form.controls.costo_padre.setValue(fun.redondearAdos(costoLibra));
        this.form.controls.precio_padre.setValue(fun.redondearAdos(precioLibra));
        this.form.controls.cantidad_contenido_padre.setValue(100);
      } else {
        this.calculatePricePadre();
        this.calculatePriceHijo();
      }
    }
  }

  calculatePricePadre() {
    const formulario = this.form.getRawValue();

    const precio = fun.desformatear(formulario.precio_principal);
    const precioPadreTemp = formulario.precio_padre;

    const costo = fun.desformatear(formulario.costo_principal);
    const cantidadPadre = formulario.cantidad_contenido_padre;

    if (fun.hasValue(precio) && precio > 0 && !isNaN(precio) && fun.hasValue(cantidadPadre) && cantidadPadre > 0 && !isNaN(cantidadPadre)) {
      const precioPadre = precio / cantidadPadre;
      const costoPadre = costo / cantidadPadre;

      this.form.controls.precio_padre.setValue(fun.numFormatTwoDecimals(precioPadre));
      this.form.controls.costo_padre.setValue(fun.redondearAdos(costoPadre));
    }

    if (precioPadreTemp) this.calculatePriceHijo();
  }

  calculatePriceHijo() {
    const formulario = this.form.getRawValue();

    const precioP = fun.desformatear(formulario.precio_padre);

    const costoP = fun.desformatear(formulario.costo_padre);
    const cantidadHijo = formulario.cantidad_contenido_hijo;

    if (fun.hasValue(precioP) && precioP > 0 && !isNaN(precioP) && fun.hasValue(cantidadHijo) && cantidadHijo > 0 && !isNaN(cantidadHijo)) {
      const PrecioHijo = precioP / cantidadHijo;
      const costoHijo = costoP / cantidadHijo;
      this.form.controls.precio_hijo.setValue(fun.numFormatTwoDecimals(PrecioHijo));
      this.form.controls.costo_hijo.setValue(fun.redondearAdos(costoHijo));
    }
  }

  formIsInvalid() {
    let res = true;
    const formulario = this.form.getRawValue();

    if (this.form.valid && !this.articulo_no_paquete) {
      if (formulario.tipo_articulo_id == 3) {
        res = _.some(formulario.rowFormula, (fila) => fun.isEmpty(fila.articulo_id) || fun.isEmpty(fila.cantidad_formula));

        if (res) return res;
        else {
          res = fun.isEmpty(formulario.otros_costos) || fun.isEmpty(formulario.costo_principal) || fun.isEmpty(formulario.precio_principal);
          if (res) return res;
        }
      } else {
        res = false;
      }

      const contenido_padre_valid = !!formulario.cantidad_contenido_padre && !!formulario.precio_padre && !!formulario.costo_padre && !!formulario.medida_contenido_padre;

      if (this.COMPRADOEN === 'Quintal' || this.COMPRADOEN === 'Saco') {
        if (contenido_padre_valid) res = false;
        else res = true;
        if (res) return res;
      }

      if (this.COMPRADOEN === 'Caja') {
        if (this.MEDIDACAJA === 'Unidad') {
          if (contenido_padre_valid) res = false;
          else res = true;
        } else {
          if (contenido_padre_valid && formulario.cantidad_contenido_hijo && formulario.precio_hijo && formulario.costo_hijo && formulario.medida_contenido_hijo) res = false;
          else res = true;
        }
      }
    } else res = true;

    return res;
  }

  fillDropAlerta(medida) {
    if (medida == 'Quintal') this.optionsAlerta = ['Quintal', 'Libra'];
    else if (medida == 'Libra') this.optionsAlerta = ['Libra'];
    else if (medida == 'Saco') this.optionsAlerta = ['Saco', 'Libra'];
    else if (medida == 'Caja') this.optionsAlerta = ['Caja', 'Paquete', 'Unidad'];
    else if (medida == 'Unidad') this.optionsAlerta = ['Unidad'];
    else if (medida == 'Galon') this.optionsAlerta = ['Galon', 'Onza'];
    else if (medida == 'Producto') this.optionsAlerta = ['Producto', 'Unidad'];
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
    const temp = fun.duplicarJson(this.TIPOARTICULO);
    this.TIPOARTICULO = null;
    this.resetArray();

    for (let i = 0; i < this.articuloSelected.formulas_productos_terminados.length; i++) {
      const ingredient = this.articuloSelected.formulas_productos_terminados[i];
      this.addItem();
      this.fillFormula(ingredient, i, true);
    }

    await this.calculateCostoPT();
    this.recalcular = null;
    this.TIPOARTICULO = temp;
  }

  fillFormula(ingredient, i, recalcular = false) {
    const control = this.form.controls['rowFormula'] as FormArray;

    const materiaPrima = this.listaMateriasPrimas.find((val) => val.id === Number(ingredient.articulo_combo));

    try {
      const unidades = { Unidad: 'Und.', Libra: 'Lbs.', Onza: 'Oz.' };
      const arrayUnidades = Object.keys(unidades);

      let costo_en_turno;
      let precio_en_turno;
      let medida_en_turno;
      for (const unidad_en_turno of arrayUnidades) {
        if (fun.hasValue(materiaPrima.costos[unidad_en_turno])) {
          costo_en_turno = materiaPrima.costos[unidad_en_turno].costo;
          precio_en_turno = materiaPrima.costos[unidad_en_turno].precio;
          medida_en_turno = unidades[unidad_en_turno];
        }
      }

      const control_en_turno = (control.controls[i] as any).controls;

      if (recalcular) {
        control_en_turno['costo_formula'].setValue(fun.numFormatTwoDecimals(costo_en_turno));
        control_en_turno['precio_formula'].setValue(fun.numFormatTwoDecimals(precio_en_turno));
      } else {
        control_en_turno['costo_formula'].setValue(fun.numFormatTwoDecimals(ingredient.costo));
        control_en_turno['precio_formula'].setValue(fun.numFormatTwoDecimals(ingredient.precio));
      }

      control_en_turno['medida_formula'].setValue(medida_en_turno);
      control_en_turno['articulo_id'].setValue(ingredient.articulo_combo);
      control_en_turno['id'].setValue(ingredient.id || null);

      control_en_turno['cantidad_formula'].setValue(fun.numFormatTwoDecimals(ingredient.cantidad));
    } catch (error) {
      fun.toastError(recalcular ? 'Error recalculando los costos de la formula.' : 'Error rellenando los campos del formulario', 'ERROR');
    }
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  async editarItem(articulo) {
    this.borrar();
    this.form.patchValue(articulo);
    this.articuloSelected = articulo;
    this.boton = 'Editar';
    this.COMPRADOEN = '';
    this.MEDIDACAJA = '';
    this.TIPOARTICULO = articulo.descripcion;
    this.is_combo = articulo.is_combo;

    console.log('articulo ', articulo);

    if (articulo.is_combo || (articulo.formulas_productos_terminados && articulo.formulas_productos_terminados.length)) {
      this.COMPRADOEN = 'Quintal';
      this.form.controls.otros_costos.setValue(fun.numFormatTwoDecimals(articulo.otros_costos));
      const res = await this.getMateriasP();

      if (articulo.formulas_productos_terminados.length) {
        this.form.controls.medida.setValue('Producto');
        this.resetCompradoEn('Producto');

        for (let i = 0; i < articulo.formulas_productos_terminados.length; i++) {
          const ingredient = articulo.formulas_productos_terminados[i];
          this.addItem();
          this.fillFormula(ingredient, i);
        }
      } else {
        this.addItem();
      }
    } else this.COMPRADOEN = articulo.medida;

    if (articulo.contenido_articulos.length > 0) this.MEDIDACAJA = articulo.contenido_articulos[0].medida;

    this.fillDropAlerta(articulo.medida);
    setTimeout(() => {
      for (let j = 0; j < articulo.contenido_articulos.length; j++) {
        const contenido = articulo.contenido_articulos[j];
        if (articulo.contenido_articulos.length === 1) {
          if (articulo.contenido_articulos[0].medida === 'Libra') {
            this.form.controls.precio_libra.setValue(fun.numFormatTwoDecimals(contenido.precio));
            this.form.controls.costo_padre.setValue(contenido.costo);
            this.form.controls.id_contenido_padre.setValue(contenido.id);
          } else {
            this.form.controls.precio_unidad.setValue(fun.numFormatTwoDecimals(contenido.precio));
            this.form.controls.costo_padre.setValue(contenido.costo);
            this.form.controls.id_contenido_padre.setValue(contenido.id);
          }
        }
        if (contenido.condicion === 'hijo') {
          this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
          this.form.controls.precio_hijo.setValue(fun.numFormatTwoDecimals(contenido.precio));
          this.form.controls.costo_hijo.setValue(contenido.costo);
          this.form.controls.id_contenido_hijo.setValue(contenido.id);
          this.form.controls.referencia_hijo.setValue(contenido.referencia);
        } else {
          this.form.controls.cantidad_contenido_padre.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_padre.setValue(contenido.medida);

          this.form.controls.precio_padre.setValue(fun.numFormatTwoDecimals(contenido.precio));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        }
      }
    }, 2);

    this.form.controls.tipo_articulo_id.setValue(articulo['tipo_articulo_id']);
    this.form.controls.costo_principal.setValue(fun.numFormatTwoDecimals(articulo.costo_principal));
    this.form.controls.precio_principal.setValue(fun.numFormatTwoDecimals(articulo.precio_principal));
    this.form.controls.medida_alerta.setValue(articulo.medida_alerta);
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
      id: formulario.id_contenido_padre,
      costo: _.isString(formulario.costo_padre) ? parseFloat(formulario.costo_padre) : formulario.costo_padre,
      precio: fun.desformatear(['Caja', 'Saco', 'Producto','Galon'].includes(formulario.medida) ? formulario.precio_padre : formulario.precio_libra),
      cantidad: ['Caja', 'Saco', 'Producto', 'Galon'].includes(formulario.medida) ? formulario.cantidad_contenido_padre : 100,
      medida: formulario.medida_contenido_padre,
      condicion: 'padre',
    };

    const hijo = {
      referencia: formulario.referencia_hijo,
      articulo_id: formulario.id,
      id: formulario.id_contenido_hijo,
      costo: _.isString(formulario.costo_hijo) ? parseFloat(formulario.costo_hijo) : formulario.costo_hijo,
      precio: fun.desformatear(formulario.precio_hijo),
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

  formarFormula() {
    const array = this.ARRAY_FORMULA.value;
    const formulas = [];
    const unidades = { 'Und.': 'Unidad', 'Lbs.': 'Libra', 'Oz.': 'Onza' };
    array.forEach((element) => {
      const obj = {
        id: _.parseInt(element.id ? element.id : null),
        articulo_combo: _.parseInt(element.articulo_id),
        cantidad: fun.desformatear(element.cantidad_formula),
        costo: fun.desformatear(element.costo_formula),
        precio: fun.desformatear(element.precio_formula),
        medida: unidades[element.medida_formula],
        // _destroy: element._destroy ? element._destroy : null,
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
        this.articuloClass.deleteOne(regisData.id).then((res) => {
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
      id: _.parseInt(formulario.id),
      tipo_articulo_id: _.parseInt(formulario.tipo_articulo_id),
      nombre: formulario.nombre,
      costo_principal: fun.desformatear(formulario.costo_principal),
      precio_principal: fun.desformatear(formulario.precio_principal),
      aviso_existencia: formulario.aviso_existencia,
      medida_alerta: formulario.medida_alerta,
      fecha_ingreso: formulario.id ? formulario.fecha_ingreso : moment().format('DD/MM/YYYY'),
      medida: formulario.medida,
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

    console.log("obj ", obj);


    this.articuloClass.createUpdateOne(obj).then((res) => {
      this.necesarioStart();
      this.borrar();
    });
  }
}
