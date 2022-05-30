import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { customValidators } from '../../../core/typescript/custom-validators';
import { pattern } from '../../../core/typescript/constantes';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { EmpleadoC } from './empleado';
import { ChangePasswordComponent } from '../../components/formularios en modales/change-password/change-password.component';
import { fun } from '../../../core/services/functions.service';
import { RolesC } from '../roles/roles';
import { table_config } from '../../components/new_tablas/tabla-class';

import { Permisos } from '../../../core/typescript/permisos';
@Component({
  selector: 'app-registro-empleados',
  templateUrl: './registro-empleados.component.html',
  styleUrls: ['./registro-empleados.component.scss'],
})
export class RegistroEmpleadosComponent extends MixinClass implements OnInit, OnDestroy {
  form: FormGroup;
  boton = '';
  pattern = pattern;

  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();

  isCreando: boolean = false;
  listaEmpleados = [];
  editando = false;
  empleadoSelected: any;
  indexBorrar: any;
  documentos_de_identidad: any;

  camposDisabled = true;
  empleadosClass = new EmpleadoC();
  rolesClass = new RolesC();
  listRoles: [];
  permissions = Permisos;

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'text', key: 'nombreCompleto' },
      { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
      { titulo: 'Cedula', tipo: 'text', key: 'documento_identidad' },
      { titulo: 'Role', tipo: 'textList', key: 'roles', key_value: 'nombre' },
    ],

    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_empleados',
    padre_functions: { data_request: (params) => this.getEmpleados(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.user.update }, borrar: { show: true, permiso: this.permissions.user.destroy } },
  };
  tablaComponent;
  formPermissions = [Permisos.user.create, Permisos.user.update];

  constructor(private fb: FormBuilder, private localeService: BsLocaleService, private tServ: TablasService) {
    super();
    this.dpConfig = Object.assign({}, { showWeekNumbers: false, maxDate: new Date(), dateInputFormat: 'DD/MM/YYYY' });
  }

  ngOnInit() {
    this.localeService.use('es');
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
    this.enfocarInput('cedula');
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.Capitalice(arg));
  }
  async getEmpleados(params?: { per_page: number; page: number; search: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };

      this.listaEmpleados.length = 0;
      this.empleadosClass.getAll(extra).then((res) => {
        res['data'].map((empleado) => {
          empleado.nombreCompleto = empleado.nombre + ' ' + empleado.apellido;
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
        if (this.editando && _.some(this.documentos_de_identidad, (doc) => doc.documento === cedula)) {
          enable_campos = true;
          return;
        }

        fun
          .getPersonaByDocIdentidad({ documento: this.form.controls[tipo].value, tipo: 'cedula' })
          .then((res) => {
            if (res['data'].length) {
              const is_user = _.find(res['data'], (item) => item.persona_is == 'User');
              const id_anterior = this.form.getRawValue().id;
              if (fun.hasValue(is_user) && is_user.persona.estado) {
                fun.toastError(`Esta cedula pertenece a un empleado ya existente. << ${is_user.persona.nombre} ${is_user.persona.apellido} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }

              const persona = _.head(res['data']).persona;
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
          if (fun.ValidaCedula(docSinGuiones)) this.enfocarInput(campo);
        }
      } else this.enfocarInput(campo);
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.submit(), 250);
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

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();

    this.enfocarInput('cedula');
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
    if (fun.hasValue(this.form)) this.form.reset();
    this.documentos_de_identidad = data.documentos_de_identidad;

    if (this.documentos_de_identidad.length) {
      const doc = data.documentos_de_identidad.filter((doc) => doc.principal === true);
      if (data.documentos_de_identidad.length > 0 && fun.hasValue(doc)) this.form.controls.cedula.setValue(doc[0].documento);
    }

    const objPerson = Object.assign({}, data, { ids_roles: (data.roles || []).map((rol) => rol.id) });
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

    documentos_identidad.map((element) => {
      // haciendo la estructura para mandar los documentos a la base de datos
      const doc_backend = _.find(this.documentos_de_identidad, (doc) => _.lowerCase(doc.descripcion) === _.lowerCase(element.descripcion));
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
      this.empleadosClass.createUpdateOne(objSend).then((res) => {
        const actualPagination = this.tServ.getPaginationById('lista_empleados');
        this.getEmpleados(actualPagination);
        this.borrar();
        this.enfocarInput('cedula');
      });
    }
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  showModal() {
    this.handleModalForm({ component: ChangePasswordComponent, id: 'changePassword', inputs: this.empleadoSelected, header: 'Cambiar contraseña', width: '30rem' });
  }
}
