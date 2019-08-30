import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { invalid } from '@angular/compiler/src/render3/view/util';

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
  constructor(private fb: FormBuilder, private route: ActivatedRoute) {
    this.detallableArray = new FormArray([
      new FormControl()
    ]);

  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params.get('accion') === 'INS') {
        this.titulo = 'Registro de articulos';
        this.boton = 'Registrar';

        this.form = this.fb.group({
          nombre: ['', Validators.required],
          tipo: [''],
          medida: [''],
          costo: [],
          precio: [],
          Isdetallable: [this.isDetallable],
          detallableArray: this.fb.array([])
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
      medidaDetalle: ["0", Validators.required],
      costoDetalle: ['', Validators.required],
      precioDetalle: ['', Validators.required]
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
  //  BOTON ATRAS
  // =============================================
  atras() {
    window.history.back();
  }

  // =============================================
  //  CHECK DETALLABLE
  // =============================================
  isDetallableClick() {
    var array = this.form.get('detallableArray') as FormArray
    if (array.length == 0) {
      this.addItem()
    } else {
      var array = this.form.get('detallableArray') as FormArray
      if (array.length == 1 && array.valid == false) {
        this.removeItem(0);
      }
    }
    
    this.isDetallable = !this.isDetallable;
  }
  
  
  // =============================================
  //  Calculate price
  // =============================================
  calculatePrice(){
    var costo = this.form.value.costo
    console.log('costo sin calcular');
    console.log(costo)
    console.log('============================');
    
    if(costo > 0 || costo != null || costo){
      this.form = this.fb.control()
      this.form.value.precio = (costo / 0.9)
      console.log('precio calculado');
      
      console.log(Math.fround(costo / 0.9))
    }
  }

}
