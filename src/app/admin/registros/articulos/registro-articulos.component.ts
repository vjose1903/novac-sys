import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { TABLA } from '../../../components/tablas/tabla';
import { DBservice } from '../../../core/services/bdservice.service';
import * as moment from 'moment';

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
  constructor(private dbServ: DBservice, private fb: FormBuilder, private route: ActivatedRoute) {
    this.detallableArray = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.dbServ.getArticulos().subscribe(res => {
      this.listaArticulos = res;
      // LISTA_ARTICULOS.next(res);
    });
    this.dbServ.getTipoArticulos().subscribe(res => {
      this.listaTipoArticulos = res;
    });

    this.createForm();
    this.FORM = this.form.controls;
    this.route.paramMap.subscribe(params => {
      if (params.get('accion') === 'INS') {
        this.titulo = 'Registro de articulos';
        this.boton = 'Registrar';
      } else {
        this.titulo = 'Actualizar articulos';
        this.boton = 'Actualizar';
      }
    });
  }

  createForm() {
    this.form = this.fb.group({
      nombre: [this.articuloSelected ? this.articuloSelected.nombre : '', Validators.required],
      tipo_articulo_id: [this.articuloSelected ? this.articuloSelected.tipo_articulo_id : ''],
      medida: [this.articuloSelected ? this.articuloSelected.medida : '', Validators.required],
      costo_principal: [this.articuloSelected ? this.articuloSelected.costo_principal : null],
      precio_principal: [this.articuloSelected ? this.articuloSelected.precio_principal : null],
      is_detallable: [this.articuloSelected ? this.articuloSelected.is_detallable : this.isDetallable],
      fecha_ingreso: [this.articuloSelected ? this.articuloSelected.fecha_ingreso : new Date()],
      // existencia: [this.articuloSelected ? this.articuloSelected.existencia : 0],
      cantidad_contenido_padre: null,
      medida_contenido_padre: null,
      precio_padre: null,
      precio_libra: null,

      medida_contenido_hijo: null,
      cantidad_contenido_hijo: null,
      precio_hijo: null,
      // detallableArray: this.fb.array([]),
    });
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
    window.history.back();
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
    const costo = this.form.value.costo_principal;
    if (costo > 0 || costo != null || costo) {
      const precio = costo / 0.9;
      const precioLibra = precio / 100;
      this.form.controls.precio_principal.setValue(_.round(precio, 2));
      this.form.controls.precio_libra.setValue(_.round(precioLibra, 2));
    }
  }

  calculatePricePadre() {
    const Precio = this.form.value.precio_principal;
    const cantidadPadre = this.form.value.cantidad_contenido_padre;

    if (Precio > 0 || Precio != null || Precio) {
      const PrecioPadre = Precio / cantidadPadre;
      this.form.controls.precio_padre.setValue(_.round(PrecioPadre, 2));
    }
  }
  calculatePriceHijo() {
    const PrecioPadre = this.form.value.precio_padre;
    const cantidadHijo = this.form.value.cantidad_contenido_hijo;
    if (PrecioPadre > 0 || PrecioPadre != null || PrecioPadre) {
      const PrecioHijo = PrecioPadre / cantidadHijo;
      this.form.controls.precio_hijo.setValue(_.round(PrecioHijo, 2));
    }
  }

  // =============================================
  //  Crear articulo
  // =============================================

  element: HTMLElement;
  submit(form) {
    const x = JSON.parse(JSON.stringify(form.value));

    let contenido = [];
    if (x.medida === 'Caja') {
      contenido = [
        {
          costo: null,
          precio: x.precio_padre,
          cantidad: x.cantidad_contenido_padre,
          medida: x.medida_contenido_padre,
        },
        {
          costo: null,
          precio: x.precio_hijo,
          cantidad: x.cantidad_contenido_hijo,
          medida: x.medida_contenido_hijo,
        },
      ];
    } else {
      contenido = [
        {
          costo: null,
          precio: x.precio_libra,
          cantidad: 100,
          medida: 'Libra',
        },
      ];
    }

    const obj = {
      tipo_articulo_id: _.parseInt(x.tipo_articulo_id),
      nombre: x.nombre,
      costo_principal: x.costo_principal,
      precio_principal: x.precio_principal,
      // existencia: '',
      fecha_ingreso: moment().format('DD/MM/YYYY'),
      medida: x.medida,
      is_detallable: x.is_detallable,
      contenido_articulos_attributes: contenido,
    };

    console.log(obj);

    // this.dbServ.createArticulo(obj).subscribe(
    //   res => {
    //     this.dbServ.toastSuccess(res.titulo, res.contenido);

    //     // this.listaArticulos = [...this.listaArticulos, res.body];
    //     // this.form.reset();
    //     // this.element = document.getElementById('campoNombre') as HTMLElement;
    //     // this.element.focus();
    //   },
    //   err => {
    //     console.log(err);
    //     this.dbServ.toastError(err.titulo, err.contenido);
    //   },
    // );
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
}
