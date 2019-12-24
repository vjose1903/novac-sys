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
  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private actRou: ActivatedRoute, private router: Router, private mServ: ModalService) {
    this.detallableArray = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.artServ.ARTICULOS.subscribe(res => {
      this.listaArticulos = res;
      console.log(res);
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
      aviso_existencia: [this.articuloSelected ? this.articuloSelected.aviso_existencia : null],
      cantidad_contenido_padre: [null],
      medida_contenido_padre: [null],
      precio_padre: [null],
      precio_libra: [null],
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
      this.submit(this.form);
    }
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  borrar() {
    this.form.reset();
    this.enfocarInput('nombre');
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

  editarItem(item) {
    this.titulo = 'Editar producto: ' + item.ARG.nombre;
    this.boton = 'Editar';
    this.indexEditar = item.INDEX;
    item.ARG.contenido_articulos.forEach(contenido => {
      if (contenido.referencia) {
        this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
        this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
        this.form.controls.precio_hijo.setValue(contenido.precio);
        this.form.controls.id_contenido_hijo.setValue(contenido.id);
        this.form.controls.referencia_hijo.setValue(contenido.referencia);
      } else {
        if (item.ARG.contenido_articulos.length === 1) {
          this.form.controls.precio_libra.setValue(contenido.precio);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        } else {
          this.form.controls.cantidad_contenido_padre.setValue(contenido.cantidad);
          this.form.controls.medida_contenido_padre.setValue(contenido.medida);
          this.form.controls.precio_padre.setValue(contenido.precio);
          this.form.controls.id_contenido_padre.setValue(contenido.id);
        }
      }
    });
    this.form.patchValue(item.ARG);
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
            costo: null,
            precio: x.precio_padre,
            cantidad: x.cantidad_contenido_padre,
            medida: x.medida_contenido_padre,
          },
        ];
      } else {
        contenido = [
          {
            referencia: null,
            id: x.id_contenido_padre,
            costo: null,
            precio: x.precio_padre,
            cantidad: x.cantidad_contenido_padre,
            medida: x.medida_contenido_padre,
          },
          {
            referencia: x.referencia_hijo,
            id: x.id_contenido_hijo,
            costo: null,
            precio: x.precio_hijo,
            cantidad: x.cantidad_contenido_hijo,
            medida: x.medida_contenido_hijo,
          },
        ];
      }
    } else {
      contenido = [
        {
          id: x.id_contenido_padre,
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
      aviso_existencia: x.aviso_existencia,
      suplidor_id: x.suplidor_id,
      fecha_ingreso: x.id ? x.fecha_ingreso : moment().format('DD/MM/YYYY'),
      medida: x.medida,
      is_detallable: x.is_detallable,
      contenido_articulos_attributes: contenido,
    };

    if (x.id) {
      obj['id'] = x.id;

      this.dbServ.editarArticulo(obj).subscribe(
        res => {
          this.listaArticulos[this.indexEditar] = res;
          this.form.reset();
          this.enfocarInput('nombre');
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
          this.form.reset();
          this.enfocarInput('nombre');
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
