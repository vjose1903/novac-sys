import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { TABLA } from '../../../components/tablas/tabla';
import { DBservice } from '../../../core/services/bdservice.service';

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
  constructor(private dbServ: DBservice, private fb: FormBuilder, private route: ActivatedRoute) {
    this.detallableArray = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.dbServ.getArticulos().subscribe(res => {
      this.listaArticulos = res;
      // LISTA_ARTICULOS.next(res);
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
      existencia: [this.articuloSelected ? this.articuloSelected.existencia : 0],

      cantidad_contenido_padre: null,
      medida_contenido_padre: null,

      medida_contenido_hijo: null,
      cantidad_contenido_hijo: null,
      // detallableArray: this.fb.array([]),
    });
  }

  resetCompradoEn() {
    this.FORM.medida_contenido_padre.value = null;
    this.FORM.medida_contenido_hijo.value = null;
    this.FORM.cantidad_contenido_padre.value = null;
    this.FORM.cantidad_contenido_hijo.value = null;
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
  calculatePrice(i?: number) {
    if (i !== undefined) {
      const control = <FormArray>this.form.controls['detallableArray'];
      const costo = (control.controls[i] as any).controls['costoDetalle'].value;
      if (costo > 0 || costo != null || costo) {
        const precio = costo / 0.9;
        (control.controls[i] as any).controls['precioDetalle'].setValue(_.round(precio, 2));
      }
    } else {
      const costo = this.form.value.costo;
      if (costo > 0 || costo != null || costo) {
        const precio = costo / 0.9;
        this.form.controls.precio.setValue(_.round(precio, 2));
      }
    }
  }

  // =============================================
  //  Crear articulo
  // =============================================

  element: HTMLElement;
  submit(form) {
    const obj = JSON.parse(JSON.stringify(form.value));
    // console.log(obj);

    this.dbServ.createArticulo(obj).subscribe(
      res => {
        this.dbServ.toastSuccess(res.titulo, res.contenido);

        this.listaArticulos = [...this.listaArticulos, res.body];
        this.form.reset();
        this.element = document.getElementById('campoNombre') as HTMLElement;
        this.element.focus();
      },
      err => {
        console.log(err);
        this.dbServ.toastError(err.titulo, err.contenido);
      },
    );
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
