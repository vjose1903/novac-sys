import { ConfigService } from './../../../core/services/configuration.service';
import { ConfigI } from './../../../core/typescript/config-interface.utils';
import { FormEntidadCuentaContableI } from './../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { EntidadCuentaContableService } from './../../contabilidad/entidad-cuenta-contable/entidad-cuenta-contable.service';
import { CategoriaEntidadContableC, entidadesContables } from './../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.utils';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from './../../contabilidad/configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { customValidators } from '../../../core/typescript/custom-validators';
import { pattern } from '../../../core/typescript/constantes';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { EmpleadoC } from './empleado.utils';
import { ChangePasswordComponent } from '../../components/formularios en modales/change-password/change-password.component';
import { fun } from '../../../core/services/functions.service';
import { RolesC } from '../roles/roles';
import { table_config } from '../../components/new_tablas/tabla-class';

import { Permisos } from '../../../core/typescript/permisos';
import { CategoriaEntidadContableService } from '../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.service';
@Component({
  selector: 'app-registro-empleados',
  templateUrl: './registro-empleados.component.html',
  styleUrls: ['./registro-empleados.component.scss'],
})
export class RegistroEmpleadosComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  boton = '';
  pattern = pattern;

  isCreando: boolean = false;
  listaEmpleados = [];
  listaConfigEmpleados: Array<ConfiguracionEntidadCuentaI> = [];
  listaEntidadCuentasContables: Array<FormEntidadCuentaContableI> = [];

  editando = false;
  empleadoSelected: any;
  indexBorrar: any;
  documentos_de_identidad: any;

  camposDisabled = true;
  empleadosClass = new EmpleadoC();
  configEntContableClass = new ConfiguracionEntidadCuentaC();
  rolesClass = new RolesC();
  listRoles: [];
  permissions = Permisos;

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'text', key: 'nombre_completo' },
      { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
      { titulo: 'Cedula', tipo: 'text', key: 'documento_identidad' },
      { titulo: 'Role', tipo: 'textList', key: 'roles', key_value: 'nombre' },
    ],

    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_empleados',
    padre_functions: { data_request: (params) => this.getEmpleados(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.user.update }, borrar: { show: true, permiso: this.permissions.user.destroy } },
  };
  tablaComponent;
  formPermissions = [Permisos.user.create, Permisos.user.update];
  maxDateBirth = new Date();

  entidadContable: entidadesContables = CategoriaEntidadContableC.entidad.user;
  cuentasContablesPermissions = [Permisos.entidad_cuenta_contable.create, Permisos.entidad_cuenta_contable.update];

  configApp: ConfigI = ConfigService.config;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService, public categoriaEntidadServ: CategoriaEntidadContableService, public entCuentaContServ: EntidadCuentaContableService) {
    super();
  }

  ngOnInit() {
    this.boton = 'Registrar';

    this._init_mixin({ component: 'reg_empleados', is_routing: true });

    this.necesarioStart();
  }

  createForm() {
    const myValidators = new customValidators();

    this.form = this.fb.group({
      id: [null],
      nombre: [{ value: null, disabled: true }, Validators.required],
      apellido: [{ value: null, disabled: true }, Validators.required],
      usuario: [{ value: null, disabled: true }, Validators.compose([Validators.required])],
      sexo: [{ value: null, disabled: true }, Validators.required],
      cedula: [{ value: null, disabled: false }, Validators.compose([myValidators.cedulaValidator(), Validators.required])],
      telefono: [{ value: null, disabled: true }, Validators.required],
      email: [{ value: null, disabled: true }, Validators.compose([Validators.email, Validators.required])],
      fecha_nacimiento: [{ value: null, disabled: true }, Validators.required],
      password: [{ value: null, disabled: true }, Validators.compose([Validators.minLength(6), Validators.required])],
      confirm_password: [{ value: null, disabled: true }, Validators.required],
      ids_roles: [{ value: null, disabled: true }, Validators.required],
    });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.createForm();
    await this.getEmpleados(this.tServ.obj_paginate.default);
    await this.getRoles();
    await this.getConfigEntidadCliente();
    fun.enfocarInput('cedula');
  }

  async getEmpleados(params?: { per_page: number; page: number; search: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };

      this.listaEmpleados.length = 0;
      this.empleadosClass.getAll(extra).then((res) => {
        res['data'].map((empleado) => {
          const doc = _.find(empleado.documentos_de_identidad, { principal: true });
          empleado.documento_identidad = fun.hasValue(doc) ? doc.documento : '----------';

          return empleado;
        });

        this.listaEmpleados = res['data'];
        this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {
      fun.toastError('Error buscando empleados registrados.', 'ERROR');
    }
  }

  getConfigEntidadCliente() {
    const extra = { parameters: { filter_target: this.entidadContable } };
    this.configEntContableClass.getAll(extra).then((res) => (this.listaConfigEmpleados = res['data']));
  }

  async getRoles() {
    await this.rolesClass.getAll().then(
      (res) => {
        this.listRoles = res.data;
      },
      (error) => {
        console.error('Error obteniendo roles: ', error);
      },
    );
  }

  checkDocumento(tipo, e?) {
    if (e.key != 'Enter') {
      const cedula = this.form.controls[tipo].value;

      let enable_campos = false;

      if (this.form.controls[tipo].valid) {
        if (this.editando && this.documentos_de_identidad.some((doc) => doc.documento === cedula)) {
          enable_campos = true;
          return;
        }

        fun
          .getPersonaByDocIdentidad({ documento: this.form.controls[tipo].value, tipo: 'cedula' })
          .then((res) => {
            if (res['data'].length) {
              const is_user = _.find(res['data'], (item) => item.persona_is === 'User');
              const id_anterior = this.form.getRawValue().id;
              if (fun.hasValue(is_user) && is_user?.persona?.estado) {
                fun.toastError(`Esta cedula pertenece a un empleado ya existente. << ${is_user.persona.nombre} ${is_user.persona.apellido} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }

              const persona = fun.hasValue(is_user) ? is_user.persona : _.head(res['data']).persona;
              const documento_persona = _.find(persona.documentos_de_identidad, (item) => item.principal);

              if (fun.hasValue(documento_persona)) this.form.controls[documento_persona.descripcion].setValue(documento_persona.documento);

              persona.id = id_anterior;
              this.form.patchValue(persona);

              if (this.camposDisabled) enable_campos = true;

              this.documentos_de_identidad = persona.documentos_de_identidad;
            } else {
              enable_campos = true;
            }

            if (enable_campos) this.changeStateCampos(true);
          })
          .catch((err) => {
            console.error('err ', err);
          });
      } else {
        if (!_.endsWith(cedula, '_')) {
          this.documentos_de_identidad = undefined;
          // this.camposDisabled = true;
          this.changeStateCampos(false);
        }
      }
    }
  }

  saltar(campo) {
    const formulario = this.form.getRawValue();
    if (campo != 'send') {
      if (campo == 'campoNombre') {
        if (!_.endsWith(formulario['cedula'], '_')) {
          const docSinGuiones = _.join(_.split(formulario['cedula'], '-'), '');
          if (fun.ValidaCedula(docSinGuiones)) fun.enfocarInput(campo);
        }
      } else fun.enfocarInput(campo);
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.submit(), 250);
    }
  }

  formIsInvalid() {
    let res = true;
    const formulario = this.form.getRawValue();

    if (this.form.valid && !this.camposDisabled) {
      res = false;
      if (fun.hasValue(formulario.cedula)) res = false;
      else res = true;
    } else {
      res = true;
    }

    const entidades_validation = this.validate_cuentas();

    const result = entidades_validation.valid ? res : !entidades_validation.valid;

    return result;
  }

  changeStateCampos(enable = false) {
    ['nombre', 'apellido', 'usuario', 'sexo', 'telefono', 'email', 'fecha_nacimiento', 'password', 'confirm_password', 'ids_roles'].forEach((campo) => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable && fun.hasValue(this.form.controls[campo])) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  nombreHasValue() {
    return !this.camposDisabled || fun.hasValue(this.form.controls.nombre.value);
  }

  cancelar() {
    if (fun.hasValue(this.form)) this.form.reset({ estado: true });
    this.borrar();
  }

  test() {
    console.log(this.listaEntidadCuentasContables);
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();

    fun.enfocarInput('cedula');
    this.boton = 'Registrar';
    this.editando = false;
    this.isCreando = true;
    [this.documentos_de_identidad, this.empleadoSelected] = Array(2).fill(undefined);

    this.listaEntidadCuentasContables = [];

    this.changeStateCampos(false);

    this.form.controls.password.setValidators(Validators.compose([Validators.minLength(6), Validators.required]));
    this.form.controls.confirm_password.setValidators(Validators.required);

    ['password', 'confirm_password'].forEach((formControl) => this.form.controls[formControl].updateValueAndValidity());
  }

  fecha(a: any) {
    const fechaFormato = moment(a).format('DD/MM/YYYY');
    return fechaFormato;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  eliminarReg(regisData) {
    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar el empleado <b>${regisData.nombre_completo}</b>?`,
      siFunction: () => {
        const actualPagination = this.tServ.getPaginationById('lista_empleados');
        this.empleadosClass.deleteOne(regisData.id).then((res) => this.getEmpleados(actualPagination));
      },
    };

    this.eliminarRegistro(objToSend);
  }

  editarItem(data) {
    this.borrar();
    if (fun.hasValue(this.form)) this.form.reset();
    this.documentos_de_identidad = data.documentos_de_identidad;

    if (this.documentos_de_identidad.length) {
      const doc = data.documentos_de_identidad.filter((doc) => doc.principal === true);
      if (data.documentos_de_identidad.length > 0 && fun.hasValue(doc)) this.form.controls.cedula.setValue(doc[0].documento);
    }

    const objPerson = Object.assign({}, data, { ids_roles: (data.roles || []).map((rol) => rol.id) });
    this.form.patchValue(objPerson);

    this.listaEntidadCuentasContables = this.entCuentaContServ.parseCuentasFromBackend(data.cuentas_contables);

    this.empleadoSelected = data;

    this.editando = true;
    this.boton = 'Editar';

    this.form.controls.password.setValidators(null);
    this.form.controls.confirm_password.setValidators(null);

    this.changeStateCampos(true);
  }

  validate_cuentas() {
    return this.entCuentaContServ.validateEntidades({ configsEntCuentas: this.listaConfigEmpleados, entidad_cuentas_contables: this.listaEntidadCuentasContables });
  }

  async submit() {
    if (ConfigService.config.has_contabilidad) {
      const entidades_validation = this.validate_cuentas();

      if (!entidades_validation.error) {
        if (!this.editando) {
          const confirmationObj = {
            id: 'aviso_cuentas',
            texto: 'Confirme las <b class="negrita">CUENTAS CONTABLES</b>, una vez registrado el empleado, no se podrán modificar sus <b class="negrita"> CUENTAS CONTABLES </b> ¿Desea continuar?',
            header: 'Confirmación',
            siFunction: async (instance) => {
              this.sendData();
              instance.closeModal('aviso_cuentas', 'cancelar');
            },
            width: '30rem',
          };

          this.confirmationModal(confirmationObj);
        } else {
          this.sendData();
        }
      } else {
        fun.toastError(entidades_validation.msg, 'Error');
      }
    } else {
      this.sendData();
    }
  }

  sendData() {
    const formulario = this.form.getRawValue();

    const documentos_identidad = [{ documento: formulario.cedula, descripcion: 'cedula' }];

    documentos_identidad.map((element) => {
      const doc_backend = _.find(this.documentos_de_identidad, (doc) => doc.descripcion.toLowerCase() == element.descripcion.toLowerCase());
      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = true;
      return element;
    });

    formulario.documentos_de_identidad = documentos_identidad;
    formulario.estado = true;

    const objSend = _.omit(formulario, ['cedula']);

    if (ConfigService.config.has_contabilidad) objSend['cuentas_contables'] = this.listaEntidadCuentasContables;

    if (!this.editando && fun.isEmpty(objSend.password)) {
      fun.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      this.empleadosClass.createUpdateOne(objSend).then((res) => {
        const actualPagination = this.tServ.getPaginationById('lista_empleados');
        this.getEmpleados(actualPagination);
        this.borrar();
        fun.enfocarInput('cedula');
      });
    }
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  openModalCategorias() {
    this.categoriaEntidadServ.openModalCategorias({ entidad: CategoriaEntidadContableC.entidad.user, id_modal: 'categorias_suplidores', inputs: { configsEntCuentas: this.listaConfigEmpleados }, openNewModal: this.openNewModal });
  }

  showModal() {
    this.openNewModal({ component: ChangePasswordComponent, id: 'changePassword', inputs: this.empleadoSelected, header: 'Cambiar contraseña', width: '30rem' });
  }
}
