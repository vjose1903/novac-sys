import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { TABLA } from '../../../components/tablas/tabla';
import { DBservice } from '../../../core/services/bdservice.service';
import * as moment from 'moment';
import { ObservableServcie } from '../../../core/services/observables.service';
import { map } from 'rxjs/operators';
import { ModalService } from '../../../components/modal/modal.service';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss'],
})
export class RegistroArticulosComponent implements OnInit, OnDestroy {
  titulo = '';
  boton = '';
  form: FormGroup;
  detallableArray: FormArray;
  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaArticulos = [];
  FORM: any;
  listaTipoArticulos: any;
  listaSuplidores: any;
  tipoModal: string;
  indexEditar: any;
  usuario: any;
  optionsAlerta: any[];
  alertaMedida: any;

  Ispaquete = false;
  seleccionModal: any;
  indexBorrar: any;
  TIPOARTICULO: any;

  ARRAY_FORMULA: FormArray;
  COMPRADOEN: any;
  MEDIDACAJA: any;
  isCombo = false;
  numIngredientes: any;
  Recalcular: boolean;
  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private actRou: ActivatedRoute, private router: Router, private mServ: ModalService) {
    this.detallableArray = new FormArray([new FormControl()]);
  }
  redondearAdos(num) {
    const string = num + '';
    const splitStr = _.split(string, '.');
    const enteros = splitStr[0];
    let tempdecimales = splitStr[1];
    if (splitStr.length === 1) {
      tempdecimales = '00';
    }

    const decimales = tempdecimales.substring(0, 2);
    const Arreglo = [enteros, decimales];
    const numStr = _.join(Arreglo, '.');
    return parseFloat(numStr).toFixed(2);
    // return (Math.round(num * 100) / 100).toFixed(2);
  }
  desformatear(sTnum) {
    let temp = 0;

    if (sTnum !== null) {
      if (sTnum !== undefined) {
        const x = sTnum.split(',');
        if (x.length === 1) {
          temp += parseFloat(x[0]);
          return temp;
        } else if (x.length >= 2) {
          let joined = '';
          joined = _.join(x, '');
          temp += parseFloat(joined);

          return temp;
        }
      }
    } else {
      return sTnum;
    }
  }
  formatearNumero(nStr) {
    if (nStr !== undefined) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }
  ngOnInit() {
    this.usuario = JSON.parse(this.dbServ.getEmpleado());

    // this.artServ.ARTICULOS.subscribe(res => {
    //   this.listaArticulos = res;
    // });
    this.dbServ.getArticulos().subscribe(res => {
      res.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });

      if (res !== undefined && res !== null) {
        this.listaArticulos = res;
      }
    });

    this.dbServ.getTipoArticulos().subscribe(res => {
      this.listaTipoArticulos = JSON.parse(JSON.stringify(res));
    });

    this.dbServ.getNombresSuplidores().subscribe(res => {
      this.listaSuplidores = JSON.parse(JSON.stringify(res));
    });
    this.createForm();
    this.FORM = this.form.controls;

    this.titulo = 'Registro de articulos';
    this.boton = 'Registrar';

    this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== null || res !== undefined) {
        this.decisionModal(res);
      }
    });
  }
  selectTipoArticulo(tipo) {
    const Tipo = this.listaTipoArticulos.filter(val => val.id === _.parseInt(tipo));

    this.TIPOARTICULO = Tipo[0].descripcion;
    if (this.TIPOARTICULO === 'Producto terminado') {
      this.addItem();
      this.form.controls.medida.setValue('Quintal');
      this.fillDropAlerta('Quintal');
      this.isCombo = true;
    } else {
      this.ARRAY_FORMULA = ([] as unknown) as FormArray;
      this.isCombo = false;
    }
  }
  createForm() {
    this.form = this.fb.group({
      nombre: [null],
      tipo_articulo_id: [null],
      suplidor_id: [null],
      medida: [null],
      costo_principal: [null],
      precio_principal: [null],
      is_detallable: [false],
      fecha_ingreso: [new Date()],
      aviso_existencia: [null],
      calcular_itbis: [false],
      existencia: [0],
      medida_alerta: [null],
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

      referencia_padre: [null],
      referencia_hijo: [null],

      medida_contenido_hijo: [null],
      cantidad_contenido_hijo: [null],
      precio_hijo: [null],
      rowFormula: this.fb.array([]),
      otros_costos: [null],
      // detallableArray: this.fb.array([]),
    });
    this.ARRAY_FORMULA = this.form.controls['rowFormula'] as FormArray;
  }

  saltar(campo) {
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
    this.form.reset();
    this.enfocarInput('nombre');
    this.form.controls.is_detallable.setValue(false);
    this.form.controls.existencia.setValue(0);
    this.titulo = 'Registro de articulos';
    this.boton = 'Registrar';
    this.TIPOARTICULO = '';
    this.isCombo = false;
    if (this.ARRAY_FORMULA.controls.length > 0) {
      this.ARRAY_FORMULA.controls.forEach((x, i) => {
        this.removeItem(0);
      });
    }
  }
  resetCompradoEn(value) {
    this.FORM.medida_contenido_padre.value = null;
    this.FORM.medida_contenido_hijo.value = null;
    this.FORM.cantidad_contenido_padre.value = null;
    this.FORM.cantidad_contenido_hijo.value = null;

    this.FORM.precio_padre.value = null;
    this.FORM.precio_libra.value = null;
    this.FORM.precio_hijo.value = null;

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
      _destroy: [null],
      // costo: [null],
    });
  }

  addItem(): void {
    this.ARRAY_FORMULA = this.form.get('rowFormula') as FormArray;
    this.ARRAY_FORMULA.push(this.createItem());
  }

  removeItem(i: number) {
    const control = this.form.controls['rowFormula'] as FormArray;
    control.removeAt(i);
  }
  filtroFormula(item) {
    return item.tipo_articulo_id === 2;
  }
  getCosto(id, i) {
    const control = this.form.controls['rowFormula'] as FormArray;

    const TempMateriaPrima = this.listaArticulos.filter(val => val.id === _.parseInt(id));
    const MateriaPrima = TempMateriaPrima[0];
    let costo = 0;
    if (MateriaPrima.medida === 'Quintal') {
      costo = MateriaPrima.contenido_articulos[0].costo;
    } else if (MateriaPrima.medida === 'Libra') {
      costo = MateriaPrima.costoPrincipal;
    }

    (control.controls[i] as any).controls['costo_formula'].setValue(costo);
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
    const array = this.form.get('detallableArray') as FormArray;
    if (array.length === 0) {
      this.addItem();
    } else {
      const array = this.form.get('detallableArray') as FormArray;
      if (array.length === 1 && array.valid === false) {
        this.removeItem(0);
      }
    }

    this.isDetallable = !this.isDetallable;
  }
  // =============================================
  //  Calculate price
  // =============================================
  calculatePrice() {
    const costoTemp = this.form.value.costo_principal;
    const costo = this.desformatear(costoTemp);
    if (costo > 0 || costo != null || costo) {
      const precio = costo / 0.9;
      const precioLibra = precio / 100;
      this.form.controls.precio_principal.setValue(this.formatearNumero(this.redondearAdos(precio)));
      this.form.controls.precio_libra.setValue(this.formatearNumero(this.redondearAdos(precioLibra)));

      this.calculatePriceLibra();
    }
  }
  calculatePriceLibra() {
    const medida = this.form.value.medida;

    const precioTemp = this.form.value.precio_principal;
    const precio = this.desformatear(precioTemp);

    const costoTemp = this.form.value.costo_principal;
    const costo = this.desformatear(costoTemp);

    if (precio > 0 || precio != null || precio) {
      const precioLibra = precio / 100;
      const costoLibra = costo / 100;
      if (medida === 'Quintal') {
        this.form.controls.precio_libra.setValue(this.formatearNumero(this.redondearAdos(precioLibra)));
        this.form.controls.costo_padre.setValue(this.redondearAdos(costoLibra));
      } else {
        this.calculatePricePadre();
        this.calculatePriceHijo();
      }
    }
  }

  calculatePricePadre() {
    const PrecioTemp = this.form.value.precio_principal;
    const Precio = this.desformatear(PrecioTemp);

    const costoTemp = this.form.value.costo_principal;
    const costo = this.desformatear(costoTemp);
    const cantidadPadre = this.form.value.cantidad_contenido_padre;

    if (Precio > 0 && Precio != null && Precio !== undefined && !isNaN(Precio) && cantidadPadre > 0 && cantidadPadre != null && cantidadPadre !== undefined && !isNaN(cantidadPadre)) {
      const PrecioPadre = Precio / cantidadPadre;
      const costoPadre = costo / cantidadPadre;

      this.form.controls.precio_padre.setValue(this.formatearNumero(this.redondearAdos(PrecioPadre)));
      this.form.controls.costo_padre.setValue(this.redondearAdos(costoPadre));
    }
  }
  calculatePriceHijo() {
    const PrecioPadreTemp = this.form.value.precio_padre;
    const PrecioP = this.desformatear(PrecioPadreTemp);

    const costoPadreTemp = this.form.value.costo_padre;
    const costoP = this.desformatear(costoPadreTemp);
    const cantidadHijo = this.form.value.cantidad_contenido_hijo;
    if (PrecioP > 0 && PrecioP != null && PrecioP !== undefined && !isNaN(PrecioP) && cantidadHijo > 0 && cantidadHijo != null && cantidadHijo !== undefined && !isNaN(cantidadHijo)) {
      const PrecioHijo = PrecioP / cantidadHijo;
      const costoHijo = costoP / cantidadHijo;
      this.form.controls.precio_hijo.setValue(this.formatearNumero(this.redondearAdos(PrecioHijo)));
      this.form.controls.costo_hijo.setValue(this.redondearAdos(costoHijo));
    }
  }

  abilitarBtnSend() {
    let res = true;
    const FORM = this.form.controls;

    if (this.ARRAY_FORMULA.length === 0) {
      // res = false;

      if (
        FORM.nombre.value !== null &&
        FORM.tipo_articulo_id.value !== null &&
        FORM.suplidor_id.value !== null &&
        FORM.medida.value !== null &&
        FORM.costo_principal.value !== null &&
        FORM.precio_principal.value !== null &&
        FORM.aviso_existencia.value !== null &&
        FORM.medida_alerta.value !== null
      ) {
        if (this.COMPRADOEN === 'Unidad' || this.COMPRADOEN === 'Libra') {
          res = false;
        }
        if (this.COMPRADOEN === 'Quintal') {
          if (FORM.cantidad_contenido_padre !== null && (FORM.precio_padre !== null) !== null && FORM.costo_padre !== null) {
            res = false;
          } else {
            res = true;
          }
        }
        if (this.COMPRADOEN === 'Caja') {
          if (this.MEDIDACAJA === 'Unidad') {
            if (FORM.medida_contenido_padre.value !== null && FORM.cantidad_contenido_padre !== null && (FORM.precio_padre !== null) !== null && FORM.costo_padre !== null) {
              res = false;
            } else {
              res = true;
            }
          } else {
            if (
              FORM.medida_contenido_hijo.value !== null &&
              FORM.medida_contenido_padre.value !== null &&
              FORM.cantidad_contenido_padre.value !== null &&
              (FORM.precio_padre.value !== null) !== null &&
              FORM.costo_padre.value !== null &&
              FORM.cantidad_contenido_hijo.value !== null &&
              (FORM.precio_hijo.value !== null) !== null &&
              FORM.costo_hijo.value !== null
            ) {
              res = false;
            } else {
              res = true;
            }
          }
        }
      }
      if (this.Ispaquete) {
        res = true;
      }
    } else {
      if (
        FORM.nombre.value !== null &&
        FORM.tipo_articulo_id.value !== null &&
        FORM.medida.value !== null &&
        FORM.costo_principal.value !== null &&
        FORM.precio_principal.value !== null &&
        FORM.aviso_existencia.value !== null &&
        FORM.medida_alerta.value !== null
      ) {
        if (this.ARRAY_FORMULA.controls.length > 0) {
          this.ARRAY_FORMULA.controls.forEach((row, i) => {
            if (
              (row as any).controls['articulo_id'].value !== null &&
              (row as any).controls['cantidad_formula'].value !== null &&
              (row as any).controls['articulo_id'].value !== undefined &&
              (row as any).controls['cantidad_formula'].value !== undefined &&
              (row as any).controls['articulo_id'].value !== ' ' &&
              (row as any).controls['cantidad_formula'].value !== ' ' &&
              (row as any).controls['articulo_id'].value !== '' &&
              (row as any).controls['cantidad_formula'].value !== ''
            ) {
              res = false;
            } else {
              res = true;
            }
          });
        }
      }
    }
    return res;
  }

  fillDropAlerta(medida) {
    if (medida === 'Quintal') {
      this.optionsAlerta = ['Quintal', 'Libra'];
    } else if (medida === 'Libra') {
      this.optionsAlerta = ['Libra'];
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
    this.Recalcular = true;

    const x = JSON.parse(JSON.stringify(formula.value));

    const tempArticulo = this.listaArticulos.filter(val => val.id === x.articulo_id);

    const articulo = tempArticulo[0];
    let costo;
    if (articulo !== undefined) {
      if (articulo.medida === 'Quintal') {
        costo = articulo.contenido_articulos[0].costo;
      } else if (articulo.medida === 'Libra') {
        costo = articulo.costoPrincipal;
      }
      if (costo !== x.costo_formula) {
        res = true;
      }
    }

    return res;
  }
  fillFormula(ingredient, i) {
    const control = this.form.controls['rowFormula'] as FormArray;

    const TempMateriaPrima = this.listaArticulos.filter(val => val.id === _.parseInt(ingredient.articulo_combo));
    const MateriaPrima = TempMateriaPrima[0];

    let costo = 0;
    if (MateriaPrima.medida === 'Quintal') {
      costo = MateriaPrima.contenido_articulos[0].costo;
    } else if (MateriaPrima.medida === 'Libra') {
      costo = MateriaPrima.costoPrincipal;
    }

    (control.controls[i] as any).controls['costo_formula'].setValue(costo);
    (control.controls[i] as any).controls['articulo_id'].setValue(ingredient.articulo_combo);
    (control.controls[i] as any).controls['cantidad_formula'].setValue(ingredient.cantidad);
    (control.controls[i] as any).controls['id'].setValue(ingredient.id ? ingredient.id : null);
  }
  editarItem(item) {
    const articulo = item.ARG;
    this.borrar();
    this.titulo = 'Editar producto: ' + articulo.nombre;
    this.boton = 'Editar';
    this.indexEditar = item.INDEX;
    this.COMPRADOEN = '';
    this.MEDIDACAJA = '';

    if (articulo.isCombo) {
      this.numIngredientes = articulo.formulas_productos_terminados.length;

      this.isCombo = true;
      // articulo.formulas_productos_terminados.forEach((ingredient, i) => {
      // });
      this.TIPOARTICULO = 'Producto terminado';
      this.form.controls.medida.setValue('Quintal');
      this.fillDropAlerta('Quintal');
      articulo.formulas_productos_terminados.forEach((ingredient, i) => {
        this.addItem();
        setTimeout(() => {
          this.fillFormula(ingredient, i);
        }, 5);
      });
    } else {
      this.isCombo = false;
      this.numIngredientes = null;
      this.COMPRADOEN = articulo.medida;
    }
    if (articulo.contenido_articulos.length > 0) {
      this.MEDIDACAJA = articulo.contenido_articulos[0].medida;
    }

    this.fillDropAlerta(articulo.medida);

    articulo.contenido_articulos.forEach(contenido => {
      if (articulo.contenido_articulos.length === 1) {
        if (articulo.contenido_articulos[0].medida === 'Libra') {
          this.form.controls.precio_libra.setValue(this.formatearNumero(this.redondearAdos(contenido.precio)));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        } else {
          this.form.controls.precio_unidad.setValue(this.formatearNumero(this.redondearAdos(contenido.precio)));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        }
      }
      if (contenido.condicion === 'hijo') {
        this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
        this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
        this.form.controls.precio_hijo.setValue(this.formatearNumero(this.redondearAdos(contenido.precio)));
        this.form.controls.costo_hijo.setValue(contenido.costo);
        this.form.controls.id_contenido_hijo.setValue(contenido.id);
        this.form.controls.referencia_hijo.setValue(contenido.referencia);
      } else {
        this.form.controls.cantidad_contenido_padre.setValue(contenido.cantidad);
        this.form.controls.medida_contenido_padre.setValue(contenido.medida);
        this.form.controls.precio_padre.setValue(this.formatearNumero(this.redondearAdos(contenido.precio)));
        this.form.controls.costo_padre.setValue(contenido.costo);
        this.form.controls.id_contenido_padre.setValue(contenido.id);
      }
    });

    this.form.patchValue(articulo);
    if (articulo.isCombo) {
      this.form.controls.otros_costos.setValue(this.formatearNumero(this.redondearAdos(articulo.otros_costos)));
    }
    this.form.controls.costo_principal.setValue(this.redondearAdos(articulo.costo_principal));
    this.form.controls.precio_principal.setValue(this.formatearNumero(this.redondearAdos(articulo.precio_principal)));
  }
  abrirModal(arg?) {
    this.seleccionModal = arg.ARG;
    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));
      this.dbServ.eliminarArticulo(obj).subscribe(
        res => {
          this.dbServ.toastSuccess('Articulo ' + obj.nombre + ' borrado.', 'CORRECTO');
          _.pullAt(this.listaArticulos, this.indexBorrar);
          this.tipoModal = '';
          this.decisionModal = null;
          this.borrar();
        },
        err => {
          this.mostrarErrores(err.error);
        },
      );
    }
  }
  formarContenido() {
    const x = JSON.parse(JSON.stringify(this.form.value));

    if (x.medida === 'Quintal') {
      x.medida_contenido_padre = 'Libra';
    }

    const padre = {
      referencia: null,
      id: x.id_contenido_padre,
      costo: _.isString(x.costo_padre) ? parseFloat(x.costo_padre) : x.costo_padre,
      precio: this.desformatear(x.medida === 'Caja' ? x.precio_padre : x.precio_libra),
      cantidad: x.medida === 'Caja' ? x.cantidad_contenido_padre : 100,
      medida: x.medida_contenido_padre,
      condicion: 'padre',
      calcular_itbis: x.calcular_itbis,
    };

    const hijo = {
      referencia: x.referencia_hijo,
      id: x.id_contenido_hijo,
      costo: _.isString(x.costo_hijo) ? parseFloat(x.costo_hijo) : x.costo_hijo,
      precio: this.desformatear(x.precio_hijo),
      cantidad: x.cantidad_contenido_hijo,
      medida: x.medida_contenido_hijo,
      condicion: 'hijo',
      calcular_itbis: x.calcular_itbis,
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
    const x = JSON.parse(JSON.stringify(this.ARRAY_FORMULA.value));
    const formulas = [];
    x.forEach(element => {
      const obj = {
        id: _.parseInt(element.id ? element.id : null),
        articulo_combo: _.parseInt(element.articulo_id),
        cantidad: _.parseInt(element.cantidad_formula),
        costo: element.costo_formula,
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
    const x = JSON.parse(JSON.stringify(form.value));

    const obj = {
      user_id: this.usuario.id,
      tipo_articulo_id: _.parseInt(x.tipo_articulo_id),
      nombre: x.nombre,
      costo_principal: this.desformatear(x.costo_principal),
      precio_principal: this.desformatear(x.precio_principal),
      aviso_existencia: x.aviso_existencia,
      medida_alerta: x.medida_alerta,
      suplidor_id: x.suplidor_id,
      fecha_ingreso: x.id ? x.fecha_ingreso : moment().format('DD/MM/YYYY'),
      medida: x.medida,
      is_detallable: x.is_detallable,
      contenido_articulos_attributes: this.formarContenido(),
      existencia: x.existencia,
      calcular_itbis: x.calcular_itbis !== null ? x.calcular_itbis : false,
      estado: true,
      isCombo: this.isCombo,
    };
    if (obj.isCombo) {
      obj['otros_costos'] = x.otros_costos;
      obj['formulas_productos_terminados_attributes'] = this.formarFormula();
    }

    if (x.id) {
      obj['id'] = x.id;

      this.dbServ.editarArticulo(obj).subscribe(
        res => {
          this.listaArticulos[this.indexEditar] = res;
          this.borrar();
          this.dbServ.toastSuccess('Producto editado con exito.', 'Correcto');
        },
        err => {
          this.mostrarErrores(err.error);
          // this.dbServ.toastError(err.error, 'Error');
        },
      );
      //
    } else {
      this.dbServ.createArticulo(obj).subscribe(
        res => {
          this.listaArticulos = [...this.listaArticulos, res];
          // this.artServ.next_articulo([...this.listaArticulos, res]);
          this.borrar();
          this.dbServ.toastSuccess('Producto registrado con exito.', 'Correcto');
        },
        err => {
          this.mostrarErrores(err.error);
          // this.dbServ.toastError(err.error, 'Error');
        },
      );
    }
  }

  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.dbServ.toastError(element, 'Error');
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
        this.dbServ.toastError('Valor introducido es invalido', 'ERROR');
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
      }

      Input.setValue(this.formatearNumero(precioTEMP));
    }
  }

  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
    },
    {
      titulo: 'Articulo',
      key: 'nombre',
    },
    {
      titulo: 'Medida',
      key: 'medida',
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
}
