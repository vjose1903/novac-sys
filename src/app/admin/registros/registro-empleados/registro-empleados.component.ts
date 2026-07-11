import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
const moment = require('../../../core/javascript/moment');
import { MixinClass } from '@core/typescript/MixinClass';
import { customValidators } from '@core/typescript/custom-validators';
import { pattern } from '@core/typescript/constantes';
import { TablasService } from '@components/new_tablas/tablas.service';
import { EmpleadoC } from './empleado';
import { ChangePasswordComponent } from '@components/formularios en modales/change-password/change-password.component';
import { fun } from '@core/services/functions.service';
import { RolesC } from '../roles/roles';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { DgiiConsultarPersonaService } from '@core/services/dgii-consultar-persona.service';

import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { confirmationButtons, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

@Component({
  selector: 'app-registro-empleados',
  templateUrl: './registro-empleados.component.html',
  styleUrls: ['./registro-empleados.component.scss'],
  standalone: false,
})
export class RegistroEmpleadosComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  boton = '';
  pattern = pattern;

  isCreando: boolean = false;
  listaEmpleados = [];
  editando = false;
  empleadoSelected: any;
  indexBorrar: any;
  documentos_de_identidad: any;
  documentoEnConsulta: string | null = null;
  ultimaConsultaDocumento: string | null = null;
  ultimaConsultaAt = 0;

  camposDisabled = true;
  empleadosClass = new EmpleadoC();
  rolesClass = new RolesC();
  listRoles: [];
  permissions = Permisos;

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'text', key: 'nombre_completo' },
      { titulo: 'Teléfono', tipo: 'text', key: 'telefono' },
      { titulo: 'Cedula', tipo: 'text', key: 'documento_identidad' },
      { titulo: 'Role', tipo: 'textList', key: 'roles', key_value: 'nombre' },
    ],

    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_empleados',
    padre_functions: { data_request: params => this.getEmpleados(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.user.update }, borrar: { show: true, permiso: this.permissions.user.destroy } },
  };
  tablaComponent;
  formPermissions = [Permisos.user.create, Permisos.user.update];
  maxDateBirth = new Date();

  public htmlServ = inject(HtmlElementsService);
  public dynamicModalServ = inject(DynamicModalService);
  private dgiiConsultarPersonaServ = inject(DgiiConsultarPersonaService);
  private fb = inject(UntypedFormBuilder);
  private tServ = inject(TablasService);

  constructor() {
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
      nombre: [{ value: null, disabled: true }, Validators.compose([Validators.required, Validators.minLength(3)])],
      apellido: [{ value: null, disabled: true }, Validators.compose([Validators.required, Validators.minLength(3)])],
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

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.createForm();
    await this.getEmpleados(this.tServ.obj_paginate.default);
    await this.getRoles();
    fun.enfocarInput('cedula');
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.capitalice(arg));
  }
  async getEmpleados(params?: { per_page?: number; page?: number; search?: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };

      this.listaEmpleados.length = 0;
      this.empleadosClass.getAll(extra).then(res => {
        res['data'].map(empleado => {
          const doc = _.find(empleado.documentos_de_identidad, { principal: true });
          empleado.documento_identidad = fun.hasValue(doc) ? doc.documento : '----------';

          return empleado;
        });

        this.listaEmpleados = res['data'];
        this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {
      fun.toastError('Error buscando empleados registrados.', 'ERROR');
    }
  }

  async getRoles() {
    await this.rolesClass.getAll().then(
      res => {
        this.listRoles = res.data;
      },
      error => {
        console.error('Error obteniendo roles: ', error);
      }
    );
  }

  async checkDocumento(tipo, e?) {
    if (e.key != 'Enter') {
      const cedula = this.form.controls[tipo].value ?? '';
      const documentoNormalizado = cedula.replace(/\s+/g, '');
      const ahora = Date.now();

      if (this.documentoEnConsulta === documentoNormalizado) return;
      if (this.ultimaConsultaDocumento === documentoNormalizado && ahora - this.ultimaConsultaAt < 1000) return;

      let enable_campos = false;

      if (this.form.controls[tipo].valid) {
        if (this.editando && this.documentos_de_identidad.some(doc => doc.documento === cedula)) {
          enable_campos = true;
          return;
        }

        this.documentoEnConsulta = documentoNormalizado;
        this.ultimaConsultaDocumento = documentoNormalizado;
        this.ultimaConsultaAt = ahora;

        try {
          await fun
            .getPersonaByDocIdentidad({ documento: cedula, tipo: 'cedula' })
            .then(async res => {
            if (res['data'].length) {
              const is_user = _.find(res['data'], item => item.persona_is === 'User');
              const id_anterior = this.form.getRawValue().id;
              if (fun.hasValue(is_user) && is_user?.persona?.estado) {
                fun.toastError(`Esta cedula pertenece a un empleado ya existente. << ${is_user.persona.nombre} ${is_user.persona.apellido} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }

              const persona = fun.hasValue(is_user) ? is_user.persona : _.head(res['data']).persona;
              const documento_persona = _.find(persona.documentos_de_identidad, item => item.principal);

              if (fun.hasValue(documento_persona)) this.form.controls[documento_persona.descripcion].setValue(documento_persona.documento);

              persona.id = id_anterior;
              this.form.patchValue(persona);

              if (this.camposDisabled) enable_campos = true;

              this.documentos_de_identidad = persona.documentos_de_identidad;
            } else {
              const dgiiPersona = await this.dgiiConsultarPersonaServ.consultarPersona(cedula);

              if (dgiiPersona) {
                this.form.controls.nombre.setValue(dgiiPersona.nombre);
                this.form.controls.apellido.setValue(dgiiPersona.apellido);
              } else {
                this.form.controls.nombre.reset();
                this.form.controls.apellido.reset();
              }

              enable_campos = true;
            }

            if (enable_campos) this.changeStateCampos(true);
          })
          .catch(err => {
            console.error('err ', err);
          });
        } finally {
          this.documentoEnConsulta = null;
        }
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
        const documento = formulario['cedula'] ?? '';

        if (!_.endsWith(documento, '_')) {
          const docSinGuiones = _.join(_.split(documento, '-'), '');
          if (fun.ValidaCedula(docSinGuiones)) fun.enfocarInput(campo);
        }
      } else fun.enfocarInput(campo);
    } else {
      if (!this.formIsInvalid()) {
        fun.setTimeout(() => this.submit(), 250);
      }
    }
  }

  formIsInvalid() {
    let res = true;
    if (this.form.valid && !this.camposDisabled) {
      res = false;
      if (this.form.controls['cedula'].value) res = false;
      else res = true;
    } else {
      res = true;
    }
    return res;
  }

  changeStateCampos(enable = false) {
    ['nombre', 'apellido', 'usuario', 'sexo', 'telefono', 'email', 'fecha_nacimiento', 'password', 'confirm_password', 'ids_roles'].forEach(campo => {
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

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();

    fun.enfocarInput('cedula');
    this.boton = 'Registrar';
    this.editando = false;
    this.documentos_de_identidad = undefined;
    // this.camposDisabled = true;
    this.changeStateCampos(false);

    this.form.controls.password.setValidators(Validators.compose([Validators.minLength(6), Validators.required]));
    this.form.controls.confirm_password.setValidators(Validators.required);

    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirm_password.updateValueAndValidity();

    this.empleadoSelected = undefined;
    this.isCreando = true;
  }

  fecha(a: any) {
    // moment.locale('es');
    const fechaFormato = moment(a).format('DD/MM/YYYY');

    return fechaFormato;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  eliminarReg(regisData) {
    const onYes = () => {
      const actualPagination = this.tServ.getPaginationById('lista_empleados');
      this.empleadosClass.deleteOne(regisData.id).then(res => this.getEmpleados(actualPagination));
    };

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: `¿Está seguro que desea eliminar el empleado <b>${regisData.nombre_completo}</b>?`,
      btnKind: confirmationButtons.cancelarEliminar,
      onYes: onYes.bind(this),
    });
  }

  editarItem(data) {
    if (fun.hasValue(this.form)) this.form.reset();
    this.documentos_de_identidad = data.documentos_de_identidad;

    if (this.documentos_de_identidad.length) {
      const doc = data.documentos_de_identidad.filter(doc => doc.principal === true);
      if (data.documentos_de_identidad.length > 0 && fun.hasValue(doc)) this.form.controls.cedula.setValue(doc[0].documento);
    }

    data.sexo = data.sexo ? data.sexo.toUpperCase() : '';

    const objPerson = Object.assign({}, data, { ids_roles: (data.roles || []).map(rol => rol.id) });
    this.form.patchValue(objPerson);

    this.empleadoSelected = data;
    this.editando = true;
    this.boton = 'Editar';

    this.form.controls.password.setValidators(null);
    this.form.controls.confirm_password.setValidators(null);

    this.changeStateCampos(true);
  }

  submit() {
    const formulario = this.form.getRawValue();

    const documentos_identidad = [{ documento: formulario.cedula, descripcion: 'cedula' }];

    documentos_identidad.map(element => {
      // haciendo la estructura para mandar los documentos a la base de datos
      const doc_backend = _.find(this.documentos_de_identidad, doc => doc.descripcion.toLowerCase() == element.descripcion.toLowerCase());
      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = true;
      return element;
    });

    formulario.documentos_de_identidad = documentos_identidad;
    formulario.estado = true;

    const objSend = _.omit(formulario, ['cedula']);

    if (!this.editando && fun.isEmpty(objSend.password)) {
      fun.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      this.empleadosClass.createUpdateOne(objSend).then(res => {
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

  showModal() {
    const modalConfig = new DynamicModalClass();
    modalConfig.width = '30rem';
    modalConfig.component = ChangePasswordComponent;
    modalConfig.inputs = { empleado: fun.deepCloning(this.empleadoSelected) };
    modalConfig.id = 'changePassword';
    modalConfig.header = 'Cambiar contraseña';

    modalConfig.botones = [
      { clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false },
      { id: 'btn_aceptar', clase: 'btn btn-green', label: 'Aceptar', disable: false },
    ];

    modalConfig.show();
  }
}
