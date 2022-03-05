import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { RolesC } from './roles';
import * as _ from 'lodash';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent extends MixinClass implements OnInit, OnDestroy {
  titulo;
  form;
  listaRoles = [];
  listaPermisos = [];
  info = [
    { titulo: '#', key: 'i', tipo: 'index', estilos: [{ width: '5%' }] },
    { titulo: 'Nombre', key: 'name', tipo: 'text', estilos: [{ width: '20%' }] },
    { titulo: 'Descripcion', key: 'descripcion', tipo: 'text', estilos: [{ width: '45%' }] },
    { titulo: 'Activo', key: 'activo_', tag_severity: 'activo_tag', tag_apretada: true, tipo: 'tag', estilos: [{ width: '10%' }] },
  ];

  infoPermisos = [
    { titulo: 'Descripcion', key: 'nombre', tipo: 'text' },
    { titulo: 'Seleccionado', key: 'selected', tipo: 'inputSwitch' },
  ];

  botones = { titulo: true, borrar: true, editar: true };
  boton: string;
  metodo: any;

  rolesClass = new RolesC();
  roleSelected: any;
  permiso_selected: any;

  constructor(private fb: FormBuilder, private route: ActivatedRoute) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'reg_roles', _lista_subs: ['decisionModal'] });
    this.createForm();

    this.titulo = 'Registro de roles';
    this.boton = 'Registrar';
    this.metodo = this.route.snapshot.params['metodo'];
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  initCambioMenu(arg) {
    console.log('arg ', arg);

    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  createForm() {
    this.form = this.fb.group({
      id: [{ value: null }],
      nombre: [{ value: null, disabled: false }, Validators.required],
      descripcion: [{ value: null, disabled: false }, Validators.required],
      activo: [{ value: true, disabled: false }],
    });
  }

  decisionModal(arg) {
    if (arg) {
      const obj = this.fun.duplicarJson(this.seleccionModal);
    }
  }

  getRoles(event) {}

  iconCantSelected(permiso) {
    const almenos_uno = _.some(permiso.acciones, (item) => item.selected);
    const todos = _.every(permiso.acciones, (item) => item.selected);
    let res = almenos_uno ? { tooltip: 'Algunos seleccionados', icon: 'far fa-check-square' } : { tooltip: 'Ninguno seleccionado', icon: 'far fa-square' };

    if (todos) res = { tooltip: 'Todos seleccionados', icon: 'fas fa-check' };

    return res;
  }

  selectPermiso(data) {
    this.permiso_selected = data;
  }

  selectOrDeselectAll(permiso) {
    const some_true = _.some(permiso.acciones, (accion) => accion.selected);
    const all_true = _.every(permiso.acciones, (accion) => accion.selected);

    permiso.acciones.map((accion) => (accion.selected = some_true ? false : !all_true));
  }

  saltar(input) {}

  formIsInvalid() {
    let res = true;
    if (this.form.valid) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  borrar() {
    this.form.reset();
    this.roleSelected = undefined;
  }

  editarItem(item) {}

  abrirModal(tipo_modal, arg) {}

  submit() {}
}
