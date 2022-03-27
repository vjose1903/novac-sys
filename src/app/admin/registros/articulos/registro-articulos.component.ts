import { Component, OnInit, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { TablasService } from '../../components/tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { ArticuloC, TipoArticuloC, tipos_articulos } from './articulo';
import * as $ from 'jquery';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss'],
})
export class RegistroArticulosComponent extends MixinClass implements OnInit, OnDestroy, OnChanges {
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    { titulo: 'Cod.', tipo: 'text', key: 'codigo', estilos: [{ width: '11%' }, { padding: '0.5rem 0rem' }] },
    { titulo: 'Articulo', tipo: 'text', key: 'nombre', estilos: [{ width: '37%' }, { 'text-align': 'left' }, { 'padding-left': '0.5rem' }] },
    { titulo: 'Medida', tipo: 'text', key: 'medida', estilos: [{ width: '13%' }, { padding: '0.5rem 0rem' }] },
    { titulo: 'Precio', tipo: 'formatoNumero', key: 'precio_principal', formatoNumero: true, estilos: [{ width: '20%' }] },
  ];

  botones = { titulo: true, borrar: true, editar: true };

  boton = '';
  form: FormGroup;

  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaArticulos;
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
  productoEditando: any;

  vendido_en: any;
  listaMateriasPrimas = [];

  vendidoEn = [
    { backend: 'Unidad', front: 'Unidad' },
    { backend: 'Saco', front: 'Saco' },
    { backend: 'Galon', front: 'Galón' },
  ];

  fechaFactura: string;
  articuloClass = new ArticuloC();
  tipoArticuloClass = new TipoArticuloC();
  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private router: Router, private tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_articulo', is_routing: true, _lista_subs: ['decisionModal'] });
    this.createForm();
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

  filtroFormula(item) {
    return item._destroy !== '1';
  }

  async filtrarArticulo(e) {
    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];
    await this.getArticulos(e);
  }

  async necesarioStart() {
    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];
    await this.getArticulos(this.tServ.obj_paginate.default);
    this.getTipoArticulos();
    this.enfocarInput('nombre');
  }

  getMateriasP() {
    return new Promise(async (resolve) => {
      const fechaActual = this.formarFechaFactura(new Date())['FechaFactura'];

      this.articuloClass.getArticulosFiltrado({ buscar: ' ', fecha: fechaActual, paginado: false, tipo: tipos_articulos.Materia_prima }).then((res) => {
        this.listaMateriasPrimas = this.fun.duplicarJson(res['data']);
        resolve(true);
      });
    });
  }

  getTipoArticulos() {
    this.listaTipoArticulos = [];
    this.tipoArticuloClass.getAll().then((res) => {
      this.listaTipoArticulos = this.fun.duplicarJson(res);
    });
  }

  async getArticulos(e) {
    const page = e.page;
    const per_page = e.per_page;
    const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, page: page, per_page: per_page, fecha: this.fechaFactura, paginado: true }).then((res) => {
      res.data.map(async (arti) => {
        arti.customStyles = {
          'td-codigo': { width: '11%' },
          'td-nombre': { width: '39%', 'text-align': 'left', 'padding-left': '0.5rem' },
          'td-medida': { width: '13%' },
          'td-precio_principal': { width: '18%' },
        };
      });

      this.listaArticulos = res.data;

      const obj = { total: res.total_registros, tabla: 'listaArticulos' };

      this.tServ.Func_total_paginas(obj);
    });
  }

  ngOnChanges() {
    this.cdRef.detectChanges();
  }

  revisarPrecio(id) {
    const input = this.form.controls[id];

    this.fun.revisarPrecio(input, id).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  cambiarCalcularSaco() {
    const formulario = this.form.getRawValue();
    if (this.fun.hasValue(formulario.medida) && formulario.medida !== 'Quintal' && formulario.medida !== 'Libra') {
      this.fun.toastWarning('Solo se le puede calcular el saco a los productos comprados en Quintal o Libra', 'AVISO');
      this.form.controls.calcular_saco.setValue(false);
    }
  }

  async selectTipoArticulo(tipo) {
    this.TIPOARTICULO = this.listaTipoArticulos.find((val) => val.id === _.parseInt(tipo)).descripcion;
    const tipo_check = _.lowerCase(this.TIPOARTICULO);

    if (tipo_check === 'materia prima') {
      this.form.controls.is_materia_prima.setValue(true);
    } else {
      this.form.controls.is_materia_prima.setValue(this.productoEditando ? this.productoEditando.is_materia_prima : false);
    }

    if (tipo_check !== 'producto terminado' && tipo_check !== 'materia prima') this.form.controls.calcular_saco.setValue(false);

    if (tipo_check === 'producto terminado') {
      await this.getMateriasP().then((res) => {
        this.addItem();
        this.resetCompradoEn('Quintal');
        this.fillDropAlerta('Quintal');
        this.is_combo = true;
        this.form.controls.medida.setValue('Quintal');
        this.form.controls.calcular_saco.setValue(true);
        this.form.controls.costo_principal.reset(null);
        this.form.controls.precio_principal.reset(null);
      });
    } else {
      this.resetArray();
      this.is_combo = false;
    }
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(this.fun.Capitalice(arg));
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

  borrar() {
    this.productoEditando = null;
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
  }

  resetCompradoEn(value) {
    const formulario = this.form.getRawValue();

    this.form.controls.medida_contenido_padre.setValue(null);
    this.form.controls.medida_contenido_hijo.setValue(null);
    this.form.controls.cantidad_contenido_padre.setValue(null);
    this.form.controls.cantidad_contenido_hijo.setValue(null);

    this.form.controls.precio_padre.setValue(null);
    this.form.controls.precio_libra.setValue(null);
    this.form.controls.precio_hijo.setValue(null);

    this.FORM.rowFormula.reset();

    this.form.controls.medida_alerta.setValue(null);
    this.COMPRADOEN = value;

    if (value === 'Quintal') {
      this.calculatePrice();
      this.form.controls.medida_contenido_padre.setValue('Libra');
    }

    if (formulario.calcular_saco && value !== 'Quintal' && value !== 'Libra') {
      this.fun.toastWarning('Solo se le puede calcular el saco a los productos comprados en Quintal o Libra');
      this.form.controls.calcular_saco.setValue(false);
    }
    this.fillDropAlerta(value);
  }

  // =============================================
  //  CREAR MAS INPUTS PARA DETALLE
  // =============================================

  createItem(): FormGroup {
    return this.fb.group({
      id: [null],
      articulo_id: [null],
      cantidad_formula: [null],
      medida_formula: [null],
      costo_formula: [null],
      precio_formula: [null],
      _destroy: [null],
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

  async getCosto(index, dropdown) {
    const control = this.form.controls['rowFormula'] as FormArray;

    (control.controls[index] as any).controls['costo_formula'].setValue(null);

    let extra = { afterPath: '', parameters: { costos: true } };

    this.articuloClass.getOne(control.value[index].articulo_id, extra).then((res) => {
      const costos = res.data.costos.Libra || res.data.costos.Unidad;
      const medida = this.fun.hasValue(res.data.costos.Unidad) ? 'Und.' : 'Lbs.';

      (control.controls[index] as any).controls['medida_formula'].setValue(medida);

      (control.controls[index] as any).controls['costo_formula'].setValue(this.fun.numFormatTwoDecimals(costos.costo));
      (control.controls[index] as any).controls['precio_formula'].setValue(this.fun.numFormatTwoDecimals(costos.precio));

      this.calculateCostoPT();
      dropdown.hide();
    });
  }

  calculateCostoPT() {
    const array = this.ARRAY_FORMULA.value;

    if (array.length > 0 && array !== undefined) {
      let sumatoriaMult = _.reduce(array, (sum, item) => this.fun.desformatear(item.cantidad_formula) * this.fun.desformatear(item.costo_formula) + sum, 0);

      const formulario = this.form.getRawValue();

      if (this.fun.hasValue(formulario.otros_costos) && !isNaN(formulario.otros_costos)) {
        sumatoriaMult += this.fun.desformatear(formulario.otros_costos);
        this.form.controls.costo_principal.setValue(this.fun.numFormatTwoDecimals(sumatoriaMult));
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

    const costo = this.fun.desformatear(formulario.costo_principal);

    if (costo > 0 && this.fun.hasValue(costo)) {
      const precio = costo / 0.9;
      const precioLibra = precio / 100;
      this.form.controls.precio_principal.setValue(this.fun.numFormatTwoDecimals(precio));
      this.form.controls.precio_libra.setValue(this.fun.numFormatTwoDecimals(precioLibra));

      this.calculatePriceLibra();
    }
  }

  calculatePriceLibra() {
    const formulario = this.form.getRawValue();
    const medida = formulario.medida;

    const precio = this.fun.desformatear(formulario.precio_principal);

    const costo = this.fun.desformatear(formulario.costo_principal);

    if (precio > 0 && this.fun.hasValue(precio)) {
      const precioLibra = precio / 100;
      const costoLibra = costo / 100;
      if (medida === 'Quintal') {
        this.form.controls.precio_libra.setValue(this.fun.numFormatTwoDecimals(precioLibra));
        this.form.controls.costo_padre.setValue(this.fun.redondearAdos(costoLibra));
        this.form.controls.precio_padre.setValue(this.fun.redondearAdos(precioLibra));
        this.form.controls.cantidad_contenido_padre.setValue(100);
      } else {
        this.calculatePricePadre();
        this.calculatePriceHijo();
      }
    }
  }

  calculatePricePadre() {
    const formulario = this.form.getRawValue();

    const precio = this.fun.desformatear(formulario.precio_principal);
    const precioPadreTemp = formulario.precio_padre;

    const costo = this.fun.desformatear(formulario.costo_principal);
    const cantidadPadre = formulario.cantidad_contenido_padre;

    if (this.fun.hasValue(precio) && precio > 0 && !isNaN(precio) && this.fun.hasValue(cantidadPadre) && cantidadPadre > 0 && !isNaN(cantidadPadre)) {
      const precioPadre = precio / cantidadPadre;
      const costoPadre = costo / cantidadPadre;

      this.form.controls.precio_padre.setValue(this.fun.numFormatTwoDecimals(precioPadre));
      this.form.controls.costo_padre.setValue(this.fun.redondearAdos(costoPadre));
    }

    if (precioPadreTemp) this.calculatePriceHijo();
  }

  calculatePriceHijo() {
    const formulario = this.form.getRawValue();

    const precioP = this.fun.desformatear(formulario.precio_padre);

    const costoP = this.fun.desformatear(formulario.costo_padre);
    const cantidadHijo = formulario.cantidad_contenido_hijo;

    if (this.fun.hasValue(precioP) && precioP > 0 && !isNaN(precioP) && this.fun.hasValue(cantidadHijo) && cantidadHijo > 0 && !isNaN(cantidadHijo)) {
      const PrecioHijo = precioP / cantidadHijo;
      const costoHijo = costoP / cantidadHijo;
      this.form.controls.precio_hijo.setValue(this.fun.numFormatTwoDecimals(PrecioHijo));
      this.form.controls.costo_hijo.setValue(this.fun.redondearAdos(costoHijo));
    }
  }

  formIsInvalid() {
    let res = true;
    const formulario = this.form.getRawValue();

    if (this.form.valid && !this.articulo_no_paquete) {
      if (formulario.tipo_articulo_id == 3) {
        res = _.some(formulario.rowFormula, (fila) => this.fun.isEmpty(fila.articulo_id) || this.fun.isEmpty(fila.cantidad_formula));

        if (res) return res;
        else {
          res = this.fun.isEmpty(formulario.otros_costos) || this.fun.isEmpty(formulario.costo_principal) || this.fun.isEmpty(formulario.precio_principal);
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

  checkCostoFormula(fila) {
    let res = false;

    const fila_formulario = this.fun.duplicarJson(fila.value);

    const articulo = this.listaMateriasPrimas.find((val) => Number(val.id) === Number(fila_formulario.articulo_id));

    if (fila_formulario.costo_formula && this.fun.hasValue(articulo)) {
      const costo_temp = this.fun.hasValue(articulo.costos.Unidad) ? articulo.costos.Unidad.costo : articulo.costos.Libra.costo;
      const costo = this.fun.numFormatTwoDecimals(costo_temp);

      if (this.fun.desformatear(costo) !== this.fun.desformatear(fila_formulario.costo_formula)) {
        res = true;
        setTimeout(() => (this.recalcular = true), 10);
      }
    }

    return res;
  }

  async recalcularFunc() {
    const temp = this.fun.duplicarJson(this.TIPOARTICULO);
    this.TIPOARTICULO = null;
    this.resetArray();

    for (let i = 0; i < this.productoEditando.formulas_productos_terminados.length; i++) {
      const ingredient = this.productoEditando.formulas_productos_terminados[i];
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
      const costo = materiaPrima?.costos?.Libra?.costo || materiaPrima?.costos?.Unidad?.costo;
      const precio = materiaPrima?.costos?.Libra?.precio || materiaPrima?.costos?.Unidad?.precio;

      const medida = this.fun.hasValue(materiaPrima.costos.Unidad) ? 'Und.' : 'Lbs.';
      const control_en_turno = (control.controls[i] as any).controls;

      if (recalcular) {
        control_en_turno['costo_formula'].setValue(this.fun.numFormatTwoDecimals(costo));
        control_en_turno['precio_formula'].setValue(this.fun.numFormatTwoDecimals(precio));
      } else {
        control_en_turno['costo_formula'].setValue(this.fun.numFormatTwoDecimals(ingredient.costo));
        control_en_turno['precio_formula'].setValue(this.fun.numFormatTwoDecimals(ingredient.precio));
      }

      control_en_turno['medida_formula'].setValue(medida);
      control_en_turno['articulo_id'].setValue(ingredient.articulo_combo);
      control_en_turno['id'].setValue(ingredient.id || null);

      control_en_turno['cantidad_formula'].setValue(this.fun.numFormatTwoDecimals(ingredient.cantidad));
    } catch (error) {
      this.fun.toastError(recalcular ? 'Error recalculando los costos de la formula.' : 'Error rellenando los campos del formulario', 'ERROR');
    }
  }

  async editarItem(item) {
    const articulo = item.ARG;

    this.borrar();
    this.form.patchValue(articulo);
    this.productoEditando = item.ARG;
    this.boton = 'Editar';
    this.COMPRADOEN = '';
    this.MEDIDACAJA = '';
    this.TIPOARTICULO = articulo.descripcion;
    this.is_combo = articulo.is_combo;

    if (articulo.is_combo || (articulo.formulas_productos_terminados && articulo.formulas_productos_terminados.length)) {
      this.COMPRADOEN = 'Quintal';
      this.form.controls.otros_costos.setValue(this.fun.numFormatTwoDecimals(articulo.otros_costos));
      const res = await this.getMateriasP();

      if (articulo.formulas_productos_terminados.length) {
        this.form.controls.medida.setValue('Quintal');
        this.fillDropAlerta('Quintal');

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
            this.form.controls.precio_libra.setValue(this.fun.numFormatTwoDecimals(contenido.precio));
            this.form.controls.costo_padre.setValue(contenido.costo);
            this.form.controls.id_contenido_padre.setValue(contenido.id);
          } else {
            this.form.controls.precio_unidad.setValue(this.fun.numFormatTwoDecimals(contenido.precio));
            this.form.controls.costo_padre.setValue(contenido.costo);
            this.form.controls.id_contenido_padre.setValue(contenido.id);
          }
        }
        if (contenido.condicion === 'hijo') {
          this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
          this.form.controls.precio_hijo.setValue(this.fun.numFormatTwoDecimals(contenido.precio));
          this.form.controls.costo_hijo.setValue(contenido.costo);
          this.form.controls.id_contenido_hijo.setValue(contenido.id);
          this.form.controls.referencia_hijo.setValue(contenido.referencia);
        } else {
          this.form.controls.cantidad_contenido_padre.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_padre.setValue(contenido.medida);

          this.form.controls.precio_padre.setValue(this.fun.numFormatTwoDecimals(contenido.precio));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        }
      }
    }, 2);

    this.form.controls.tipo_articulo_id.setValue(articulo['tipo_articulo_id']);
    this.form.controls.costo_principal.setValue(this.fun.numFormatTwoDecimals(articulo.costo_principal));
    this.form.controls.precio_principal.setValue(this.fun.numFormatTwoDecimals(articulo.precio_principal));
  }

  decisionModal(arg) {
    if (arg) {
      const obj = this.fun.duplicarJson(this.seleccionModal);
      this.articuloClass.deleteOne(obj.id).then((res) => {
        const actualPagination = this.tServ.getPaginationById('listaArticulos');
        this.getArticulos(actualPagination);
        this.borrar();
      });
    }
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
      precio: this.fun.desformatear(formulario.medida === 'Caja' || formulario.medida === 'Saco' ? formulario.precio_padre : formulario.precio_libra),
      cantidad: formulario.medida === 'Caja' || formulario.medida === 'Saco' ? formulario.cantidad_contenido_padre : 100,
      medida: formulario.medida_contenido_padre,
      condicion: 'padre',
    };

    const hijo = {
      referencia: formulario.referencia_hijo,
      articulo_id: formulario.id,
      id: formulario.id_contenido_hijo,
      costo: _.isString(formulario.costo_hijo) ? parseFloat(formulario.costo_hijo) : formulario.costo_hijo,
      precio: this.fun.desformatear(formulario.precio_hijo),
      cantidad: formulario.cantidad_contenido_hijo,
      medida: formulario.medida_contenido_hijo,
      condicion: 'hijo',
    };

    let contenido = [];
    if (this.fun.hasValue(formulario.medida_contenido_padre)) {
      contenido = [padre];
      if (this.fun.hasValue(formulario.medida_contenido_hijo)) contenido = [padre, hijo];
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

    array.forEach((element) => {
      const obj = {
        id: _.parseInt(element.id ? element.id : null),
        articulo_combo: _.parseInt(element.articulo_id),
        cantidad: this.fun.desformatear(element.cantidad_formula),
        costo: this.fun.desformatear(element.costo_formula),
        precio: this.fun.desformatear(element.precio_formula),
        medida: element.medida_formula == 'Und.' ? 'Unidad' : 'Libra',
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
          const actualPagination = this.tServ.getPaginationById('listaArticulos');
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
      costo_principal: this.fun.desformatear(formulario.costo_principal),
      precio_principal: this.fun.desformatear(formulario.precio_principal),
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
      obj['vendido_en'] = 'Saco';
      obj['otros_costos'] = formulario.otros_costos;
      obj['formulas_productos_terminados'] = this.formarFormula();
    }

    this.articuloClass.createUpdateOne(obj).then((res) => {
      this.necesarioStart();
      this.borrar();
    });
  }
}
