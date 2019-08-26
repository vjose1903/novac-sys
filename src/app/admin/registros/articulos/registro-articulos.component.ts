import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss']
})
export class RegistroArticulosComponent implements OnInit {
  titulo=''
  boton=''
  form:FormGroup
  isDetallabe= false
  constructor(private fb: FormBuilder,
              private route:ActivatedRoute
              ) {
    this.form= this.fb.group({
      nombre:[],
      tipo:[""],
      medida:[""],
      costo:[],  
      precio:[],
      detallable:[this.isDetallabe],
      
    })
   }
  ngOnInit() {
    this.route.paramMap.subscribe(params=>{
      if(params.get("accion")=="INS"){
        this.titulo="Registro de articulos"
        this.boton="Registrar"

      }else{
        this.titulo="Actualizar articulos"
        this.boton="Actualizar"
      }
    })
  }
// =============================================
//  BOTON ATRAS
// =============================================
atras(){
  window.history.back()
}

// =============================================
//  CHECK DETALLABLE
// =============================================
  isDetallable(){
    this.isDetallabe=!this.isDetallabe
  
  }
}