import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { SharedService } from '../../../core/services/shared.service';
import { Subscription } from 'rxjs';
import { LISTA_ARTICULOS } from '../../../core/services/GLOBAL';

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
  sub: Subscription;

  listaArticulos = [];
  constructor(private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {
    this.detallableArray = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params.get('accion') === 'INS') {
        this.titulo = 'Registro de articulos';
        this.boton = 'Registrar';

        this.form = this.fb.group({
          nombre: ['', Validators.required],
          tipo: [''],
          medida: ['', Validators.required],
          costo: [],
          precio: [],
          Isdetallable: [this.isDetallable],
          detallableArray: this.fb.array([]),
        });
      } else {
        this.titulo = 'Actualizar articulos';
        this.boton = 'Actualizar';
      }
    });
    this.sub = LISTA_ARTICULOS.subscribe(res => {
      this.listaArticulos = res;
    });
    this.shServ.getArticulos().subscribe(res => {
      LISTA_ARTICULOS.next(res);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
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
  submit(form) {
    const obj = JSON.parse(JSON.stringify(form.value));
    this.shServ.createArticulo(obj).subscribe(
      res => {
        this.shServ.toastSuccess(res.titulo, res.contenido);
        LISTA_ARTICULOS.next(_.concat(this.listaArticulos, res.body));
        // console.log(res);
      },
      err => {
        console.log(err);
        // this.shServ.toastError(err.titulo, err.contenido);
      },
    );
  }

  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'code',
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
      key: 'precio',
    },
  ];
}
