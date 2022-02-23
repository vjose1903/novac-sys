import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  titulo;
  form;
  listaRoles = [];
  info: [
    { titulo: '#'; key: 'i'; tipo: 'index'; estilos: [{ width: '5%' }] },
    { titulo: 'Nombre'; key: 'name'; tipo: 'text'; estilos: [{ width: '20%' }] },
    { titulo: 'Descripcion'; key: 'descripcion'; tipo: 'text'; estilos: [{ width: '45%' }] },
    { titulo: 'Activo'; key: 'activo_'; tag_severity: 'activo_tag'; tipo: 'tag'; estilos: [{ width: '10%' }] },
  ];

  botones = { titulo: true, borrar: true, editar: true };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
    });
  }

  formIsInvalid() {
    let res = true;
    if (this.form.valid) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }
}
