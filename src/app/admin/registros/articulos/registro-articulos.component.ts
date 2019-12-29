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
    this.dbServ
      .getArticulos()
      // .pipe(
      //   map(
      //     val =>
      //       (val = val.map(arti => {
      //         // console.log(arti);

      //         // console.log(arti.existencia);
      //         arti.medidaMostrar = this.calcularExistencia(arti.contenido_articulos, arti);
      //         return arti;
      //       })),
      //   ),
      // )
      .subscribe(res => {
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
  }

  createForm() {
    this.form = this.fb.group({
      nombre: [this.articuloSelected ? this.articuloSelected.nombre : '', Validators.required],
      tipo_articulo_id: [this.articuloSelected ? this.articuloSelected.tipo_articulo_id : '', Validators.required],
      suplidor_id: [this.articuloSelected ? this.articuloSelected.suplidor_id : '', Validators.required],
      medida: [this.articuloSelected ? this.articuloSelected.medida : '', Validators.required],
      costo_principal: [this.articuloSelected ? this.articuloSelected.costo_principal : null, Validators.required],
      precio_principal: [this.articuloSelected ? this.articuloSelected.precio_principal : null, Validators.required],
      is_detallable: [this.articuloSelected ? this.articuloSelected.is_detallable : this.isDetallable],
      fecha_ingreso: [this.articuloSelected ? this.articuloSelected.fecha_ingreso : new Date()],
      aviso_existencia: [this.articuloSelected ? this.articuloSelected.aviso_existencia : null, Validators.required],
      existencia: [0],
      medida_alerta: [this.articuloSelected ? this.articuloSelected.medida_alerta : null],
      cantidad_contenido_padre: [null],
      medida_contenido_padre: [null],
      precio_padre: [null],
      precio_libra: [null],
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
      // detallableArray: this.fb.array([]),
    });
  }

  saltar(campo) {
    if (campo !== 'send') {
      this.enfocarInput(campo);
    } else {
      this.enfocarInput('nombre');
      setTimeout(() => {
        this.submit(this.form);
      }, 250);
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
  }
  resetCompradoEn(value) {
    this.FORM.medida_contenido_padre.value = null;
    this.FORM.medida_contenido_hijo.value = null;
    this.FORM.cantidad_contenido_padre.value = null;
    this.FORM.cantidad_contenido_hijo.value = null;

    this.FORM.precio_padre.value = null;
    this.FORM.precio_libra.value = null;
    this.FORM.precio_hijo.value = null;

    if (value === 'Quintal') {
      this.calculatePrice();
    }
  }

  ngOnDestroy() {}
  // =============================================
  //  CREAR MAS INPUTS PARA DETALLE
  // =============================================

  createItem(): FormGroup {
    return this.fb.group({
      medidaDetalle: ['', Validators.required],
      costoDetalle: ['', Validators.required],
      precioDetalle: ['', Validators.required],
    });
  }

  addItem(): void {
    this.detallableArray = this.form.get('detallableArray') as FormArray;
    this.detallableArray.push(this.createItem());
  }

  removeItem(i: number) {
    const control = <FormArray>this.form.controls['detallableArray'];
    control.removeAt(i);
  }
  // =============================================
  //  VALIDACIONES DE ARRAY
  // =============================================
  getvalidateControlArray(i, campo) {
    const control = <FormArray>this.form.controls['detallableArray'];
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
      this.form.controls.costo_hijo.setValue(this.formatearNumero(this.redondearAdos(costoHijo)));
    }
  }

  editarItem(item) {
    this.borrar();
    this.titulo = 'Editar producto: ' + item.ARG.nombre;
    this.boton = 'Editar';
    this.indexEditar = item.INDEX;
    item.ARG.contenido_articulos.forEach(contenido => {
      if (contenido.referencia) {
        this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
        this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
        this.form.controls.precio_hijo.setValue(this.formatearNumero(this.redondearAdos(contenido.precio)));
        this.form.controls.costo_hijo.setValue(contenido.costo);
        this.form.controls.id_contenido_hijo.setValue(contenido.id);
        this.form.controls.referencia_hijo.setValue(contenido.referencia);
      } else {
        if (item.ARG.contenido_articulos.length === 1) {
          this.form.controls.precio_libra.setValue(this.formatearNumero(this.redondearAdos(contenido.precio)));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        } else {
          this.form.controls.cantidad_contenido_padre.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_padre.setValue(contenido.medida);
          this.form.controls.precio_padre.setValue(this.formatearNumero(this.redondearAdos(contenido.precio)));
          this.form.controls.costo_padre.setValue(contenido.costo);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        }
      }
    });

    this.form.patchValue(item.ARG);

    this.form.controls.costo_principal.setValue(this.redondearAdos(item.ARG.costo_principal));
    this.form.controls.precio_principal.setValue(this.formatearNumero(this.redondearAdos(item.ARG.precio_principal)));
  }
  abrirModal(arg?) {
    console.log(arg);

    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
    }
    this.tipoModal = '';
  }
  // =============================================
  //  Crear articulo
  // =============================================

  element: HTMLElement;
  submit(form) {
    const x = JSON.parse(JSON.stringify(form.value));

    let contenido = [];
    if (x.medida === 'Caja') {
      if (x.medida_contenido_hijo === null) {
        contenido = [
          {
            referencia: null,
            id: x.id_contenido_padre,
            costo: x.costo_padre,
            precio: this.desformatear(x.precio_padre),
            cantidad: x.cantidad_contenido_padre,
            medida: x.medida_contenido_padre,
          },
        ];
      } else {
        contenido = [
          {
            referencia: null,
            id: x.id_contenido_padre,
            costo: x.costo_padre,
            precio: this.desformatear(x.precio_padre),
            cantidad: x.cantidad_contenido_padre,
            medida: x.medida_contenido_padre,
          },
          {
            referencia: x.referencia_hijo,
            id: x.id_contenido_hijo,
            costo: x.costo_hijo,
            precio: this.desformatear(x.precio_hijo),
            cantidad: x.cantidad_contenido_hijo,
            medida: x.medida_contenido_hijo,
          },
        ];
      }
    } else {
      contenido = [
        {
          id: x.id_contenido_padre,
          costo: x.costo_padre,
          precio: this.desformatear(x.precio_libra),
          cantidad: 100,
          medida: 'Libra',
        },
      ];
    }

    const obj = {
      user_id: this.usuario.id,
      tipo_articulo_id: _.parseInt(x.tipo_articulo_id),
      nombre: x.nombre,
      costo_principal: x.costo_principal,
      precio_principal: this.desformatear(x.precio_principal),
      aviso_existencia: x.aviso_existencia,
      medida_alerta: x.medida_alerta,
      suplidor_id: x.suplidor_id,
      fecha_ingreso: x.id ? x.fecha_ingreso : moment().format('DD/MM/YYYY'),
      medida: x.medida,
      is_detallable: x.is_detallable,
      contenido_articulos_attributes: contenido,
      existencia: x.existencia,
    };

    if (x.id) {
      obj['id'] = x.id;

      this.dbServ.editarArticulo(obj).subscribe(
        res => {
          console.log(res);

          this.listaArticulos[this.indexEditar] = res;
          this.borrar();
          this.dbServ.toastSuccess('Producto editado con exito.', 'Correcto');
        },
        err => {
          console.log(err);
          this.mostrarErrores(err.error);
          // this.dbServ.toastError(err.error, 'Error');
        },
      );
      //
    } else {
      this.dbServ.createArticulo(obj).subscribe(
        res => {
          // this.listaArticulos = [...this.listaArticulos, res];
          this.artServ.next_articulo([...this.listaArticulos, res]);
          this.borrar();
          this.dbServ.toastSuccess('Producto registrado con exito.', 'Correcto');
        },
        err => {
          console.log(err);
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
    console.log(Input.value);

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
        this.dbServ.toastError('Precio introducido es invalido', 'ERROR');
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
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
}
