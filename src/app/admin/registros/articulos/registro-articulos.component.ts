import { Component, OnInit, OnDestroy, ChangeDetectorRef, OnChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { DBservice } from '../../../core/services/bdservice.service';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { ModalService } from '../../components/modal/modal.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { obj_paginate, TablasService } from '../../components/tablas/tablas.service';
import { FunctionService } from '../../../core/services/functions.service';
import { LoaderService } from '../../../loader/loader.service';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss'],
})
export class RegistroArticulosComponent implements OnInit, OnDestroy, OnChanges {
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
      customClass: true,
      estilos: [{ width: '3rem' }],
    },
    {
      titulo: 'Articulo',
      key: 'nombre',
      customClass: true,
      estilos: [{ width: '13rem' }, { 'text-align': 'left' }, { 'padding-left': '1.5rem' }],
    },
    {
      titulo: 'Medida',
      key: 'medida',
      customClass: true,
      estilos: [{ width: '4rem' }],
    },
    {
      titulo: 'Precio',
      key: 'precio_principal',
      formatoNumero: true,
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };

  titulo = '';
  boton = '';
  form: FormGroup;

  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaArticulos;
  FORM: any;
  listaTipoArticulos: any;
  tipoModal: string;

  optionsAlerta: any[];
  alertaMedida: any;

  Ispaquete = false;
  seleccionModal: any;
  indexBorrar: any;
  TIPOARTICULO: any;

  ARRAY_FORMULA: FormArray;
  COMPRADOEN: any;
  MEDIDACAJA: any;
  is_combo = false;
  numIngredientes: any;
  Recalcular = false;
  ProductoEditando: any;
  clickBtnRe = false;
  subDeci: Subscription;
  obj_paginate_ = obj_paginate;
  vendido_en: any;
  listaMateriasPrimas = [];
  vendidoEn = [
    { backend: 'Unidad', front: 'Unidad' },
    { backend: 'Saco', front: 'Saco' },
    { backend: 'Galon', front: 'Galón' },
  ];
  FechaFactura: string;

  constructor(
    private dbServ: DBservice,
    private cdRef: ChangeDetectorRef,
    private fun: FunctionService,
    private fb: FormBuilder,
    private router: Router,
    private mServ: ModalService,
    private tServ: TablasService,
    private loaderService: LoaderService,
  ) {}

  ngOnInit() {
    this.createForm();
    this.FORM = this.form.controls;

    this.titulo = 'Registro de articulos';
    this.boton = 'Registrar';
    this.necesarioStart();

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
  }
  filtroFormula(item) {
    return item._destroy !== '1';
  }

  async necesarioStart() {
    await this.formarFechaFactura(new Date());
    await this.getArticulos(this.obj_paginate_);
    this.getTipoArticulos();
  }

  getMateriasP(callback = (arg) => {}) {
    this.loaderService.isLoading.next(true);
    this.dbServ.getMateriasPrimas().subscribe(
      (res) => {
        this.loaderService.isLoading.next(false);
        this.listaMateriasPrimas = GLOBAL.duplicarJson(res);
        callback({
          status: true,
        });
      },
      (err) => {
        callback({
          status: false,
        });
        this.loaderService.isLoading.next(false);
      },
    );
  }

  getTipoArticulos() {
    this.dbServ.getTipoArticulos().subscribe((res) => {
      this.listaTipoArticulos = GLOBAL.duplicarJson(res);
      console.log(this.listaTipoArticulos);
    });
  }

  formarFechaFactura(date) {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');

    this.FechaFactura = fechaTemp + ' ' + hora + ':' + minutos;
  }

  async getArticulos(e) {
    try {
      this.listaArticulos = [];
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
      const res = await this.dbServ.getArticulosFiltrados(palabra_a_buscar, page, per_page, true, false, this.FechaFactura, 'todos').toPromise();

      res.data.map(async (arti) => {
        arti.customStyles = { 'td-codigo': { width: '3rem' }, 'td-nombre': { width: '13rem', 'text-align': 'left', 'padding-left': '1.5rem' }, 'td-medida': { width: '4rem' } };
      });

      this.listaArticulos = res.data;
      // this.listaArticulos = [...this.listaArticulos, ...this.listaArticulos, ...this.listaArticulos];
      const obj = {
        total: res.total_registros,
        tabla: 'listaArticulos',
      };
      console.log(this.listaArticulos);

      this.tServ.Func_total_paginas(obj);
    } catch (error) {
      this.dbServ.toastError('Error buscando articulos registrados.', 'ERROR', true);
    }
  }

  ngOnChanges() {
    this.cdRef.detectChanges();
  }

  async selectTipoArticulo(tipo) {
    const Tipo = this.listaTipoArticulos.filter((val) => val.id === _.parseInt(tipo));
    this.TIPOARTICULO = Tipo[0].descripcion;

    if (_.lowerCase(this.TIPOARTICULO) === 'producto terminado') {
      await this.getMateriasP((res) => {
        this.addItem();
        this.form.controls.medida.setValue('Quintal');
        this.fillDropAlerta('Quintal');
        this.is_combo = true;
        this.form.controls.costo_principal.reset(null);
        this.form.controls.precio_principal.reset(null);
      });
    } else {
      this.ARRAY_FORMULA = ([] as unknown) as FormArray;
      this.is_combo = false;
    }
  }
  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }
  createForm() {
    this.form = this.fb.group({
      nombre: [null, Validators.required],
      tipo_articulo_id: [null, Validators.required],
      medida: [null, Validators.required],
      costo_principal: [null, Validators.required],
      precio_principal: [null, Validators.required],
      is_detallable: [false],
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

      referencia_padre: [null],
      referencia_hijo: [null],

      medida_contenido_hijo: [null],
      cantidad_contenido_hijo: [null],
      precio_hijo: [null],
      rowFormula: this.fb.array([]),
      otros_costos: [null],
    });
    // this.form = this.fb.group({
    //   nombre: ['Maiz'],
    //   tipo_articulo_id: [2],
    //   medida: [null],
    //   costo_principal: [null],
    //   precio_principal: [null],
    //   is_detallable: [false],
    //   fecha_ingreso: [new Date()],
    //   aviso_existencia: [2],
    //   calcular_itbis: [false],
    //   existencia: [0],
    //   medida_alerta: ['Quintal'],
    //   cantidad_contenido_padre: [null],
    //   medida_contenido_padre: [null],
    //   precio_padre: [null],
    //   precio_libra: [null],
    //   precio_unidad: [null],
    //   costo_padre: [null],
    //   costo_hijo: [null],
    //   id: [null],
    //   id_contenido_padre: [null],
    //   id_contenido_hijo: [null],
    //   vendido_en: [null],

    //   referencia_padre: [null],
    //   referencia_hijo: [null],

    //   medida_contenido_hijo: [null],
    //   cantidad_contenido_hijo: [null],
    //   precio_hijo: [null],
    //   rowFormula: this.fb.array([]),
    //   otros_costos: [null],
    // });
    this.ARRAY_FORMULA = this.form.controls['rowFormula'] as FormArray;
  }

  saltar(campo, array?, i?) {
    if (array) {
      campo = campo + i;
    }

    if (campo !== 'send') {
      this.enfocarInput(campo);
    } else {
      const continu = this.abilitarBtnSend();

      if (!continu) {
        this.enfocarInput('nombre');
        setTimeout(() => {
          this.submit(this.form);
        }, 250);
      }
    }
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  borrar() {
    this.ProductoEditando = null;
    this.form.reset();
    this.enfocarInput('nombre');
    this.form.controls.is_detallable.setValue(false);
    this.form.controls.existencia.setValue(0);
    this.titulo = 'Registro de articulos';
    this.boton = 'Registrar';
    this.TIPOARTICULO = '';
    this.clickBtnRe = false;

    if (this.is_combo) {
      this.resetArray();
    }
    this.is_combo = false;
    this.form.controls['rowFormula'].reset();

    if (this.Recalcular === true) {
      this.Recalcular = false;
    }
  }

  resetCompradoEn(value) {
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
    }
    this.fillDropAlerta(value);
  }

  ngOnDestroy() {
    this.borrar();
    this.subDeci.unsubscribe();
  }
  // =============================================
  //  CREAR MAS INPUTS PARA DETALLE
  // =============================================

  createItem(): FormGroup {
    return this.fb.group({
      id: [null],
      articulo_id: [null],
      cantidad_formula: [null],
      costo_formula: [null],
      precio_formula: [null],
      _destroy: [null],
      // costo: [null],
    });
  }

  resetArray() {
    this.ARRAY_FORMULA = this.form.get('rowFormula') as FormArray;
    // this.ARRAY_FORMULA.controls.forEach((element, i) => {
    this.ARRAY_FORMULA.value.forEach((element, i) => {
      this.removeItem(0);
    });
  }

  addItem(): void {
    this.ARRAY_FORMULA = this.form.get('rowFormula') as FormArray;
    this.ARRAY_FORMULA.push(this.createItem());
  }

  removeItem(i: number) {
    const control = this.form.controls['rowFormula'] as FormArray;
    // if (control.value[i].id) {
    //   (control.controls[i] as any).controls['_destroy'].setValue('1');
    // } else {
    control.removeAt(i);
    // }
  }

  getCosto(id, i) {
    const control = this.form.controls['rowFormula'] as FormArray;

    const MateriaPrima = this.listaMateriasPrimas.filter((val) => val.id === _.parseInt(id))[0];

    const costo = MateriaPrima.costo;
    const precio = MateriaPrima.precio;

    (control.controls[i] as any).controls['costo_formula'].setValue(GLOBAL.numFormatTwoDecimals(costo));
    (control.controls[i] as any).controls['precio_formula'].setValue(GLOBAL.numFormatTwoDecimals(precio));
  }

  calculateCostoPT() {
    let sumatoriaMult = 0;

    if (this.ARRAY_FORMULA.value.length > 0 && this.ARRAY_FORMULA.value !== undefined) {
      this.ARRAY_FORMULA.value.forEach((ingrediente: any) => {
        sumatoriaMult += GLOBAL.desformatear(ingrediente.cantidad_formula) * GLOBAL.desformatear(ingrediente.costo_formula);
      });

      const formulario = this.form.controls;
      if (formulario.otros_costos.value !== null && formulario.otros_costos.value !== undefined && formulario.otros_costos.value !== '' && formulario.otros_costos.value !== ' ') {
        sumatoriaMult += GLOBAL.desformatear(formulario.otros_costos.value);
        this.form.controls.costo_principal.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(sumatoriaMult)));
        this.calculatePrice();
        this.calculatePriceLibra();
      }
    }
  }

  checkRecalcular() {
    let res = false;
    if (this.Recalcular) {
      res = true;
    }
    return res;
  }

  // =============================================
  //  VALIDACIONES DE ARRAY
  // =============================================
  getvalidateControlArray(i, campo) {
    const control = this.form.controls['rowFormula'] as FormArray;
    if ((control.controls[i] as any).controls[campo].status === 'INVALID' && (control.controls[i] as any).controls[campo].touched) {
      return true;
    }

    return false;
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    this.router.navigateByUrl('/admin');
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
    const costoTemp = this.form.value.costo_principal;
    const costo = GLOBAL.desformatear(costoTemp);

    if (costo > 0 || costo != null || costo) {
      const precio = costo / 0.9;
      const precioLibra = precio / 100;
      this.form.controls.precio_principal.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(precio)));
      this.form.controls.precio_libra.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(precioLibra)));

      this.calculatePriceLibra();
    }
  }

  calculatePriceLibra() {
    const medida = this.form.value.medida;

    const precioTemp = this.form.value.precio_principal;
    const precio = GLOBAL.desformatear(precioTemp);

    const costoTemp = this.form.value.costo_principal;
    const costo = GLOBAL.desformatear(costoTemp);

    if (precio > 0 || precio != null || precio) {
      const precioLibra = precio / 100;
      const costoLibra = costo / 100;
      if (medida === 'Quintal') {
        this.form.controls.precio_libra.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(precioLibra)));
        this.form.controls.costo_padre.setValue(GLOBAL.redondearAdos(costoLibra));
        this.form.controls.precio_padre.setValue(GLOBAL.redondearAdos(precioLibra));
        this.form.controls.cantidad_contenido_padre.setValue(100);
      } else {
        this.calculatePricePadre();
        this.calculatePriceHijo();
      }
    }
  }

  calculatePricePadre() {
    const PrecioTemp = this.form.value.precio_principal;
    const Precio = GLOBAL.desformatear(PrecioTemp);
    const PrecioPadreTemp = this.form.value.precio_padre;

    const costoTemp = this.form.value.costo_principal;
    const costo = GLOBAL.desformatear(costoTemp);
    const cantidadPadre = this.form.value.cantidad_contenido_padre;

    if (Precio > 0 && Precio != null && Precio !== undefined && !isNaN(Precio) && cantidadPadre > 0 && cantidadPadre != null && cantidadPadre !== undefined && !isNaN(cantidadPadre)) {
      const PrecioPadre = Precio / cantidadPadre;
      const costoPadre = costo / cantidadPadre;

      this.form.controls.precio_padre.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(PrecioPadre)));
      this.form.controls.costo_padre.setValue(GLOBAL.redondearAdos(costoPadre));
    }
    if (PrecioPadreTemp) {
      this.calculatePriceHijo();
    }
  }
  calculatePriceHijo() {
    const PrecioPadreTemp = this.form.value.precio_padre;
    const PrecioP = GLOBAL.desformatear(PrecioPadreTemp);

    const costoPadreTemp = this.form.value.costo_padre;
    const costoP = GLOBAL.desformatear(costoPadreTemp);
    const cantidadHijo = this.form.value.cantidad_contenido_hijo;
    if (PrecioP > 0 && PrecioP != null && PrecioP !== undefined && !isNaN(PrecioP) && cantidadHijo > 0 && cantidadHijo != null && cantidadHijo !== undefined && !isNaN(cantidadHijo)) {
      const PrecioHijo = PrecioP / cantidadHijo;
      const costoHijo = costoP / cantidadHijo;
      this.form.controls.precio_hijo.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(PrecioHijo)));
      this.form.controls.costo_hijo.setValue(GLOBAL.redondearAdos(costoHijo));
    }
  }

  abilitarBtnSend() {
    let res = true;
    const FORM = this.form.controls;

    if (this.form.valid) {
      if (this.form.controls['tipo_articulo_id'].value === '3') {
        res = true;

        this.ARRAY_FORMULA.controls.forEach((row, i) => {
          if ((row as any).controls['articulo_id'].value && (row as any).controls['cantidad_formula'].value) {
            res = false;
          } else {
            res = true;
          }
        });
      } else {
        res = false;
      }
    } else {
      res = true;
    }
    // if (this.ARRAY_FORMULA.length === 0) {
    //     if (this.COMPRADOEN === 'Unidad') {
    //       res = false;
    //     }

    //     if (this.COMPRADOEN === 'Quintal') {
    //       if (FORM.cantidad_contenido_padre.value !== null && (FORM.precio_padre.value !== null) !== null && FORM.costo_padre.value !== null) {
    //         res = false;
    //       } else {
    //         res = true;
    //       }
    //     }

    //     if (FORM.tipo_articulo_id.value === '2') {
    //       if (FORM.vendido_en.value) {
    //         res = false;
    //       } else {
    //         res = true;
    //       }
    //     }

    //     if (this.COMPRADOEN === 'Caja') {
    //       if (this.MEDIDACAJA === 'Unidad') {
    //         if (FORM.medida_contenido_padre.value !== null && FORM.cantidad_contenido_padre !== null && (FORM.precio_padre !== null) !== null && FORM.costo_padre !== null) {
    //           res = false;
    //         } else {
    //           res = true;
    //         }
    //       } else {
    //         if (
    //           FORM.medida_contenido_hijo.value !== null &&
    //           FORM.medida_contenido_padre.value !== null &&
    //           FORM.cantidad_contenido_padre.value !== null &&
    //           (FORM.precio_padre.value !== null) !== null &&
    //           FORM.costo_padre.value !== null &&
    //           FORM.cantidad_contenido_hijo.value !== null &&
    //           (FORM.precio_hijo.value !== null) !== null &&
    //           FORM.costo_hijo.value !== null
    //         ) {
    //           res = false;
    //         } else {
    //           res = true;
    //         }
    //       }
    //     }
    //   }
    //   if (this.Ispaquete) {
    //     res = true;
    //   }
    // } else {
    //   if (this.form.valid) {
    //     if (this.ARRAY_FORMULA.controls.length > 0) {
    //       this.ARRAY_FORMULA.controls.forEach((row, i) => {
    //         if ((row as any).controls['articulo_id'].value && (row as any).controls['cantidad_formula'].value) {
    //           res = false;
    //         } else {
    //           res = true;
    //         }
    //       });
    //     }
    //   }
    // }
    return res;
  }

  fillDropAlerta(medida) {
    if (medida === 'Quintal') {
      this.optionsAlerta = ['Quintal', 'Libra'];
    } else if (medida === 'Saco') {
      this.optionsAlerta = ['Saco', 'Libra'];
    } else if (medida === 'Caja') {
      this.optionsAlerta = ['Caja', 'Paquete', 'Unidad'];
    } else if (medida === 'Unidad') {
      this.optionsAlerta = ['Unidad'];
    }
  }

  seleccionarContenidoCaja() {
    const x = this.form.controls;
    this.MEDIDACAJA = x.medida_contenido_padre.value;
    if (x.medida_alerta.value === 'Paquete' && x.medida_contenido_padre.value === 'Unidad') {
      this.Ispaquete = true;
    } else {
      this.Ispaquete = false;
    }
  }
  checkCostoFormula(formula) {
    let res = false;

    const x = GLOBAL.duplicarJson(formula.value);

    const tempArticulo = this.listaMateriasPrimas.filter((val) => val.id === x.articulo_id);
    const articulo = tempArticulo[0];
    let costo;
    if (articulo !== undefined) {
      costo = articulo.costo;
      if (costo !== GLOBAL.desformatear(x.costo_formula)) {
        res = true;
        setTimeout(() => {
          this.Recalcular = true;
        }, 10);
      }
    }

    return res;
  }

  async recalcular() {
    this.clickBtnRe = true;
    const temp = GLOBAL.duplicarJson(this.TIPOARTICULO);
    this.TIPOARTICULO = null;
    this.resetArray();

    for (let i = 0; i < this.ProductoEditando.formulas_productos_terminados.length; i++) {
      const ingredient = this.ProductoEditando.formulas_productos_terminados[i];
      this.addItem();
      this.fillFormula(ingredient, i, true);
    }

    await this.calculateCostoPT();
    this.Recalcular = null;
    this.TIPOARTICULO = temp;
  }

  fillFormula(ingredient, i, recalcular?) {
    const control = this.form.controls['rowFormula'] as FormArray;

    const TempMateriaPrima = this.listaMateriasPrimas.filter((val) => val.id === _.parseInt(ingredient.articulo_combo));

    const MateriaPrima = TempMateriaPrima[0];

    const costo = MateriaPrima.costo;
    const precio = MateriaPrima.precio;

    if (recalcular) {
      (control.controls[i] as any).controls['costo_formula'].setValue(GLOBAL.numFormatTwoDecimals(costo));
      (control.controls[i] as any).controls['precio_formula'].setValue(GLOBAL.numFormatTwoDecimals(precio));
    } else {
      (control.controls[i] as any).controls['costo_formula'].setValue(GLOBAL.numFormatTwoDecimals(ingredient.costo));
      (control.controls[i] as any).controls['precio_formula'].setValue(GLOBAL.numFormatTwoDecimals(ingredient.precio));
    }
    (control.controls[i] as any).controls['articulo_id'].setValue(ingredient.articulo_combo);
    (control.controls[i] as any).controls['cantidad_formula'].setValue(GLOBAL.numFormatTwoDecimals(ingredient.cantidad));
    (control.controls[i] as any).controls['id'].setValue(ingredient.id ? ingredient.id : null);
  }

  editarItem(item) {
    const articulo = item.ARG;

    this.borrar();
    this.ProductoEditando = item.ARG;
    this.titulo = 'Editar producto: ' + articulo.nombre;
    this.boton = 'Editar';
    this.COMPRADOEN = '';
    this.MEDIDACAJA = '';

    if (articulo.is_combo) {
      this.getMateriasP((res) => {
        this.numIngredientes = articulo.formulas_productos_terminados.length;

        this.is_combo = true;
        // articulo.formulas_productos_terminados.forEach((ingredient, i) => {
        // });
        this.TIPOARTICULO = 'Producto terminado';
        this.form.controls.medida.setValue('Quintal');
        this.fillDropAlerta('Quintal');
        articulo.formulas_productos_terminados.forEach((ingredient, i) => {
          this.addItem();
          this.fillFormula(ingredient, i);
        });
      });
    } else {
      this.is_combo = false;
      this.numIngredientes = null;
      this.COMPRADOEN = articulo.medida;
    }
    if (articulo.contenido_articulos.length > 0) {
      this.MEDIDACAJA = articulo.contenido_articulos[0].medida;
    }

    this.fillDropAlerta(articulo.medida);

    articulo.contenido_articulos.forEach((contenido) => {
      if (articulo.contenido_articulos.length === 1) {
        if (articulo.contenido_articulos[0].medida === 'Libra') {
          this.form.controls.precio_libra.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(contenido.precio)));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        } else {
          this.form.controls.precio_unidad.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(contenido.precio)));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        }
      }
      if (contenido.condicion === 'hijo') {
        this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
        this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
        this.form.controls.precio_hijo.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(contenido.precio)));
        this.form.controls.costo_hijo.setValue(contenido.costo);
        this.form.controls.id_contenido_hijo.setValue(contenido.id);
        this.form.controls.referencia_hijo.setValue(contenido.referencia);
      } else {
        this.form.controls.cantidad_contenido_padre.setValue(contenido.cantidad);
        this.form.controls.medida_contenido_padre.setValue(contenido.medida);
        this.form.controls.precio_padre.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(contenido.precio)));
        this.form.controls.costo_padre.setValue(contenido.costo);
        this.form.controls.id_contenido_padre.setValue(contenido.id);
      }
    });
    articulo['tipo_articulo_id'] = articulo['tipo_articulo_id'] + '';
    this.form.patchValue(articulo);
    // this.selectTipoArticulo(articulo.tipo_articulo_id);
    if (articulo.is_combo) {
      this.form.controls.otros_costos.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(articulo.otros_costos)));
    }
    this.form.controls.costo_principal.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(articulo.costo_principal)));
    this.form.controls.precio_principal.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(articulo.precio_principal)));
  }

  abrirModal(arg?) {
    this.seleccionModal = arg.ARG;
    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
      const obj = GLOBAL.duplicarJson(this.seleccionModal);
      this.dbServ.eliminarArticulo(obj).subscribe(
        (res) => {
          const i = _.findIndex(this.listaArticulos, (art: any) => {
            if (art.id === obj['id']) {
              return true;
            }
          });

          this.dbServ.toastSuccess('Articulo ' + obj.nombre + ' borrado.', 'CORRECTO');
          _.pullAt(this.listaArticulos, i);
          this.tipoModal = '';
          this.decisionModal = null;
          this.borrar();
        },
        (err) => {
          this.mostrarErrores(err.error);
        },
      );
    }
  }

  formarContenido() {
    const x = GLOBAL.duplicarJson(this.form.value);

    if (x.medida === 'Quintal' || x.medida === 'Saco') {
      x.medida_contenido_padre = 'Libra';
    }

    const padre = {
      referencia: null,
      id: x.id_contenido_padre,
      costo: _.isString(x.costo_padre) ? parseFloat(x.costo_padre) : x.costo_padre,
      precio: GLOBAL.desformatear(x.medida === 'Caja' || x.medida === 'Saco' ? x.precio_padre : x.precio_libra),
      cantidad: x.medida === 'Caja' || x.medida === 'Saco' ? x.cantidad_contenido_padre : 100,
      medida: x.medida_contenido_padre,
      condicion: 'padre',
    };

    const hijo = {
      referencia: x.referencia_hijo,
      id: x.id_contenido_hijo,
      costo: _.isString(x.costo_hijo) ? parseFloat(x.costo_hijo) : x.costo_hijo,
      precio: GLOBAL.desformatear(x.precio_hijo),
      cantidad: x.cantidad_contenido_hijo,
      medida: x.medida_contenido_hijo,
      condicion: 'hijo',
    };

    let contenido = [];
    if (x.medida_contenido_padre !== null) {
      if (x.medida_contenido_hijo === null) {
        contenido = [padre];
      } else {
        contenido = [padre, hijo];
      }
    }

    return contenido;
  }

  formarFormula() {
    const x = GLOBAL.duplicarJson(this.ARRAY_FORMULA.value);
    const formulas = [];
    x.forEach((element) => {
      const obj = {
        id: _.parseInt(element.id ? element.id : null),
        articulo_combo: _.parseInt(element.articulo_id),
        cantidad: GLOBAL.desformatear(element.cantidad_formula),
        costo: GLOBAL.desformatear(element.costo_formula),
        precio: GLOBAL.desformatear(element.precio_formula),
        _destroy: element._destroy ? element._destroy : null,
      };
      formulas.push(obj);
    });
    return formulas;
  }
  // =============================================
  //  Crear articulo
  // =============================================

  element: HTMLElement;
  submit(form) {
    const x = GLOBAL.duplicarJson(form.value);

    const obj = {
      user_id: this.fun.getUser().id,
      tipo_articulo_id: _.parseInt(x.tipo_articulo_id),
      nombre: x.nombre,
      costo_principal: GLOBAL.desformatear(x.costo_principal),
      precio_principal: GLOBAL.desformatear(x.precio_principal),
      aviso_existencia: x.aviso_existencia,
      medida_alerta: x.medida_alerta,
      fecha_ingreso: x.id ? x.fecha_ingreso : moment().format('DD/MM/YYYY'),
      medida: x.medida,
      is_detallable: x.is_detallable,
      contenido_articulos_attributes: this.formarContenido(),
      existencia: x.existencia,
      calcular_itbis: x.calcular_itbis !== null ? x.calcular_itbis : false,
      estado: true,
      is_combo: this.is_combo,
      vendido_en: x.vendido_en,
    };
    if (obj.is_combo) {
      obj['vendido_en'] = 'Saco';
      obj['otros_costos'] = x.otros_costos;
      obj['formulas_productos_terminados_attributes'] = this.formarFormula();
    }

    if (x.id) {
      obj['id'] = x.id;

      this.dbServ.editarArticulo(obj).subscribe(
        (res) => {
          this.getArticulos(obj_paginate);

          this.borrar();

          this.dbServ.toastSuccess('Producto editado con exito.', 'Correcto', true);
        },
        (err) => {
          this.mostrarErrores(err.error);
          // this.dbServ.toastError(err.error, 'Error', true);
        },
      );
      //
    } else {
      this.dbServ.createArticulo(obj).subscribe(
        (res) => {
          this.getArticulos(obj_paginate);

          this.borrar();
          this.dbServ.toastSuccess('Producto registrado con exito.', 'Correcto', true);
        },
        (err) => {
          this.mostrarErrores(err.error);
          // this.dbServ.toastError(err.error, 'Error', true);
        },
      );
    }
  }

  mostrarErrores(arg) {
    if (Array.isArray(arg)) {
      arg.forEach((error) => {
        this.dbServ.toastError(error, 'ERROR', true);
      });
    } else {
      for (const key in arg) {
        if (arg.hasOwnProperty(key)) {
          const element = arg[key];

          if (key !== 'status') {
            this.dbServ.toastError(element, 'ERROR', true);
          }
        }
      }
    }
  }

  checkNumbers(arg) {
    let res = false;
    for (let i = 0; i < arg.length; i++) {
      const tempCaracter = arg.charAt(i);
      if (tempCaracter !== ',') {
        const caracter = _.parseInt(tempCaracter);
        if (_.isNaN(caracter)) {
          res = true;
        }
      }
    }
    return res;
  }
  checkLongMillares(num) {
    let res = false;
    const splitNum = _.split(num, ',');
    splitNum.forEach((element, i) => {
      if (i !== 0) {
        if (element.length !== 3) {
          res = true;
        }
      }
    });
    return res;
  }

  revisarPrecio(input, id) {
    const Input = this.form.controls[input];
    const precioTEMPO = Input.value;

    if (precioTEMPO !== null && precioTEMPO !== undefined && precioTEMPO !== '' && precioTEMPO !== ' ') {
      const splitPrecio = _.split(precioTEMPO, '.');

      let precioTEMP;

      let enteros = splitPrecio[0];
      let tempdecimales = splitPrecio[1];
      if (tempdecimales === undefined) {
        tempdecimales = '00';
      }
      //
      if (splitPrecio.length > 2 || this.checkNumbers(enteros) || this.checkLongMillares(enteros) || this.checkNumbers(tempdecimales) || this.checkLongMillares(tempdecimales)) {
        this.dbServ.toastError('Valor introducido es invalido', 'ERROR', true);
        this.enfocarInput(id);
      } else {
        //
        if (splitPrecio.length === 2) {
          if (enteros === '' || enteros === ' ') {
            enteros = '0';
          }
          let decimales;
          if (tempdecimales.length > 2) {
            decimales = tempdecimales.substring(0, 2);
          } else {
            decimales = _.padEnd(tempdecimales, 2, '0');
          }
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        } else if (splitPrecio.length === 1) {
          const decimales = '00';
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        }

        Input.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(precioTEMP)));
      }
    }
  }
}
