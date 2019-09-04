import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss'],
})
export class RegistroArticulosComponent implements OnInit {
  titulo = '';
  boton = '';
  form: FormGroup;
  detallableArray: FormArray;

  isDetallable = false;

  medida: boolean;

  constructor(private fb: FormBuilder, private route: ActivatedRoute) {
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
    const pipe = new DecimalPipe('en');

    if (i !== undefined) {
      const control = <FormArray>this.form.controls['detallableArray'];
      const costo = (control.controls[i] as any).controls['costoDetalle'].value;
      if (costo > 0 || costo != null || costo) {
        const precio = costo / 0.9;
        (control.controls[i] as any).controls['precioDetalle'].setValue(pipe.transform(precio, '0.2-2'));
      }
    } else {
      const costo = this.form.value.costo;
      if (costo > 0 || costo != null || costo) {
        const precio = costo / 0.9;
        this.form.controls.precio.setValue(pipe.transform(precio, '0.2-2'));
      }
    }
  }
}
