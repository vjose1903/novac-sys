import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-registro-articulos',
  templateUrl: './registro-articulos.component.html',
  styleUrls: ['./registro-articulos.component.scss']
})
export class RegistroArticulosComponent implements OnInit {

  constructor() { }
  form:FormGroup
  ngOnInit() {
  }

}
