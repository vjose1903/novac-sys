import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { AccionesC, PermisosC, RolesC } from './roles';
import * as _ from 'lodash';
import { TablasService } from '../../components/tablas/tablas.service';

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
    { titulo: 'Nombre', key: 'nombre', tipo: 'text', estilos: [{ width: '20%' }] },
    { titulo: 'Descripcion', key: 'descripcion', tipo: 'text', estilos: [{ width: '50%' }] },
    { titulo: 'Activo', key: 'activo_', tag_severity: 'activo_tag', tag_apretada: true, tipo: 'tag', estilos: [{ width: '10%' }] },
  ];

  infoPermisos = [
    { titulo: 'Descripcion', key: 'nombre', tipo: 'text', estilos: [{ 'text-align': 'left' }, { 'padding-left': '0.5rem' }, { width: '75%' }] },
    { titulo: 'Activo', key: 'selected', tipo: 'inputSwitch', estilos: [{ width: '25%' }] },
  ];

  botones = { titulo: true, borrar: true, editar: true };
  boton: string;

  rolesClass = new RolesC();
  permisosClass = new PermisosC();
  accionesClass = new AccionesC();

  roleSelected: any;
  permiso_selected: any;

  isCreando: boolean = false;
  TablasComponent;
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'reg_roles', is_routing: true, _lista_subs: ['decisionModal'] });
    this.necesarioStart();
    this.createForm();

    this.titulo = 'Registro de roles';
    this.boton = 'Registrar';
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  async necesarioStart() {
    this.getRoles(this.tServ.obj_paginate.default);
    this.getPermisos();
    this.listaRoles = [{ nombre: 'Administrador', descripcion: 'Administrador del sistema', activo: true, activo_: 'SI', activo_tag: 'success' }];
  }

  getRoles(event) {
    const page = event.page;
    const per_page = event.per_page;
    const palabra_a_buscar = event.searchText === '' || event.searchText === null || event.searchText === undefined ? ' ' : event.searchText;

    // const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: page, per_page: per_page, paginado: true } };
    const extra = { afterPath: ``, parameters: { permisos_acciones: true } };

    this.rolesClass.getAll(extra).then((res) => {
      res['data'].map((role) => {
        role.activo_ = role.activo ? 'SI' : 'NO';
        role.activo_tag = role.activo ? 'success' : 'danger';
        role.customStyles = { 'td-nombre': { width: '20%' }, 'td-descripcion': { width: '50%', 'text-align': 'left', 'padding-left': '0.5rem' }, 'td-activo_': { width: '10%' } };
        return role;
      });

      this.listaRoles = res['data'];

      const obj = { total: res['total_registros'], tabla: 'lista_clientes' };
      this.tServ.Func_total_paginas(obj);
    });
  }

  getPermisos() {
    this.listaPermisos.length = 0;

    this.permisosClass.getAll({ parameters: { acciones: true } }).then((res) => {
      this.listaPermisos = res.data.map((permiso) => {
        permiso.acciones = permiso.acciones.map((accion) => {
          // accion.selected = _.some(this.inputs.data.acciones, (item) => item.id == accion.id);
          accion.selected = false;
          accion.nombre = this.my_capitalize(accion.nombre);

          accion['customStyles'] = {
            'td-nombre': { 'text-align': 'left', 'padding-left': '0.5rem', width: '75%' },
            'td-selected': { 'justify-content': 'center', 'align-items': 'center', display: 'flex', width: 'auto' },
          };
          return accion;
        });
        delete permiso.permisoAccions;

        // _.omit(permiso, )

        return permiso;
      });
      this.permiso_selected = _.first(this.listaPermisos);
    });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  createForm() {
    this.form = this.fb.group({
      id: [{ value: null, disabled: false }],
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

  nuevoRegistro() {
    this.isCreando = true;
  }

  iconCantSelected(permiso) {
    const almenos_uno = _.some(permiso.acciones, (item) => item.selected);
    const todos = _.every(permiso.acciones, (item) => item.selected);
    let res = almenos_uno ? { tooltip: 'Algunos seleccionados', icon: 'far fa-check-square' } : { tooltip: 'Ninguno seleccionado', icon: 'far fa-square' };

    if (todos) res = { tooltip: 'Todos seleccionados', icon: 'fas fa-check' };

    return res;
  }

  getContenidoStyle() {
    const style: any = {};
    style['grid-template-columns'] = this.roleSelected || this.isCreando ? 'auto auto' : '0% auto';
    style['column-gap'] = this.roleSelected || this.isCreando ? '0.5rem' : '0rem';

    return style;
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
      const all_permiso_acciones = _.flattenDeep(_.map(this.listaPermisos, 'acciones'));
      const permiso_acciones_selected = _.map(_.filter(all_permiso_acciones, { selected: true }), 'id');

      res = permiso_acciones_selected.length == 0;
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

  calcularAltoTablaAcciones() {
    this.fun.awaitTyping().then(() => {
      if (this.fun.hasValue(this.TablasComponent)) this.TablasComponent.calcularAlto();
    });
  }

  submit() {
    const formulario = this.form.getRawValue();

    const all_permiso_acciones = _.flattenDeep(_.map(this.listaPermisos, 'acciones'));
    const permiso_acciones_selected = _.map(_.filter(all_permiso_acciones, { selected: true }), 'id');

    formulario['permisos_acciones'] = permiso_acciones_selected;

    new RolesC().createUpdateOne(formulario).then((res) => {
      this.isCreando = false;
      this.roleSelected = undefined;
    });
  }
}
