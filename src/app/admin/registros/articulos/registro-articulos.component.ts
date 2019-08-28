import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss']
})
export class RegistroArticulosComponent implements OnInit {
  titulo = '';
  boton = '';
  form: FormGroup;
  detallableArray: FormArray;

  isDetallable = false;
  constructor(private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params.get('accion') === 'INS') {
        this.titulo = 'Registro de articulos';
        this.boton = 'Registrar';

        this.form = this.fb.group({
          nombre: [],
          tipo: [''],
          medida: [''],
          costo: [],
          precio: [],
          Isdetallable: [this.isDetallable],
          detallableArray: this.fb.array([this.createItem()])
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
      medidaDetalle: '',
      costoDetalle: '',
      precioDetalle: ''
    });
  }

  addItem(): void {
    this.detallableArray = this.form.get('detallableArray') as FormArray;
    this.detallableArray.push(this.createItem());
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
    this.isDetallable = !this.isDetallable;
  }

}
