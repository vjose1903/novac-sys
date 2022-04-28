import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { AccionesC, PermisosC, RolesC } from './roles';
import * as _ from 'lodash';
import { TablasService } from '../../components/tablas/tablas.service';
import { fun } from '../../../core/services/functions.service';
import { Permisos } from '../../../core/typescript/permisos';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent extends MixinClass implements OnInit, OnDestroy {
  titulo;
  form: FormGroup;
  listaRoles = [];
  listaPermisos = [];

  info = [
    { titulo: 'Nombre', key: 'nombre', tipo: 'text', estilos: [{ width: '20%' }] },
    { titulo: 'Descripcion', key: 'descripcion', tipo: 'text', estilos: [{ width: '50%' }] },
    { titulo: 'Activo', key: 'estado_', tag_severity: 'estado_tag', tag_apretada: true, tipo: 'tag', estilos: [{ width: '10%' }] },
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
  palabra_buscar: any;
  permissions = Permisos;
  formPermissions = [Permisos.role.create, Permisos.role.update];
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'reg_roles', is_routing: true });
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
  }

  getRoles(event) {
    const page = event.page;
    const per_page = event.per_page;
    this.palabra_buscar = event.searchText === '' || event.searchText === null || event.searchText === undefined ? ' ' : event.searchText;

    const extra = { afterPath: `filtro/${this.palabra_buscar}`, parameters: { page: page, per_page: per_page, paginado: true } };

    this.rolesClass
      .getAll(extra)
      .then((res) => {
        res['data'].map((role) => {
          role.estado_ = role.estado ? 'SI' : 'NO';
          role.estado_tag = role.estado ? 'success' : 'danger';

          role.customStyles = { 'td-nombre': { width: '20%' }, 'td-descripcion': { width: '50%', 'text-align': 'left', 'padding-left': '0.5rem' }, 'td-estado_': { width: '10%' } };
          return role;
        });

        this.listaRoles = res['data'];

        const obj = { total: res['total_registros'], tabla: 'lista_roles' };
        this.tServ.Func_total_paginas(obj);
      })
      .catch((err) => {
        if (err.error.total_registros == 0) {
          this.listaRoles = [];
          const obj = { total: 0, tabla: 'lista_roles' };
          this.tServ.Func_total_paginas(obj);
        }
      });
  }

  parsePermisos(params: { clean: boolean }) {
    if (params.clean) {
      const all_acciones = _.flattenDeep(_.map(this.listaPermisos, 'acciones'));
      const all_acciones_selected = _.filter(all_acciones, { selected: true });
      all_acciones_selected.map((accion) => (accion.selected = false));
    } else {
      this.roleSelected.permisos_acciones.forEach((permiso_accion) => {
        const permiso_en_turno = _.find(this.listaPermisos, (item) => item.id == permiso_accion.permiso.id);
        const accion_en_turno = _.find(permiso_en_turno.acciones, (item) => item.id == permiso_accion.accion.id);
        accion_en_turno.selected = true;
      });
    }
    this.boton = params.clean ? 'Registrar' : 'Actualizar';
    this.permiso_selected = _.first(this.listaPermisos);
  }

  getPermisos() {
    this.listaPermisos.length = 0;

    this.permisosClass.getAll({ parameters: { permisos_acciones: true } }).then((res) => {
      this.listaPermisos = res.data.map((permiso) => {
        permiso.acciones = permiso.permisos_acciones.map((permiso_accion) => {
          const accion = {
            nombre: this.my_capitalize(permiso_accion.accion.nombre),
            selected: false,
            id: permiso_accion.accion.id,
            permiso_accion_id: permiso_accion.id,
            customStyles: {
              'td-nombre': { 'text-align': 'left', 'padding-left': '0.5rem', width: '75%' },
              'td-selected': { 'justify-content': 'center', 'align-items': 'center', display: 'flex', width: 'auto' },
            },
          };

          return accion;
        });

        return permiso;
      });
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
      estado: [{ value: true, disabled: false }],
    });
  }

  borrar() {
    this.form.reset({ estado: true });
    this.parsePermisos({ clean: true });
    this.enfocarInput('campo_nombre');
  }

  nuevoRegistro() {
    this.isCreando = true;
    this.parsePermisos({ clean: true });
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

  cancelar() {
    this.form.reset({ estado: true });
    this.roleSelected = undefined;
    this.isCreando = false;
  }

  editarItem(item) {
    this.borrar();
    this.roleSelected = item.ARG;
    this.form.patchValue(this.roleSelected);
    this.parsePermisos({ clean: false });
  }

  abrirModal(tipo_modal, arg) {
    this.handleModalForm({
      id: 'delete_role',
      header: 'CONFIRMACION',
      width: '30rem',
      html: `<p> Seguro que desea eliminar el rol: <strong>${arg.nombre}</strong> </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'aceptar'), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => this.eliminarRole(instance, arg),
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }

  eliminarRole(modalInstance, roleSelected) {
    this.rolesClass.deleteOne(roleSelected.id).then(() => {
      const actualPagination = this.tServ.getPaginationById('lista_roles');
      actualPagination['searchText'] = this.palabra_buscar;
      this.getRoles(actualPagination);
      modalInstance.closeModal(modalInstance.id, 'borrar');
    });
  }

  calcularAltoTablaAcciones() {
    if (fun.hasValue(this.TablasComponent)) this.TablasComponent.calcularAlto();
  }

  submit() {
    const formulario = this.form.getRawValue();

    const all_permiso_acciones = _.flattenDeep(_.map(this.listaPermisos, 'acciones'));
    const permiso_acciones_selected = _.map(_.filter(all_permiso_acciones, { selected: true }), 'permiso_accion_id');

    formulario['permisos_acciones'] = permiso_acciones_selected;

    this.rolesClass.createUpdateOne(formulario).then((res) => {
      this.isCreando = false;
      this.roleSelected = undefined;
      this.borrar();

      const actualPagination = this.tServ.getPaginationById('lista_roles');
      actualPagination['searchText'] = this.palabra_buscar;

      this.getRoles(actualPagination);
    });
  }
}
