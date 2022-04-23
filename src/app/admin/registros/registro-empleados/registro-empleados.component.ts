import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { customValidators } from '../../../core/typescript/custom-validators';
import { pattern } from '../../../core/typescript/constantes';
import { TablasService } from '../../components/tablas/tablas.service';
import { EmpleadoC } from './empleado';
import { ChangePasswordComponent } from '../../components/formularios en modales/change-password/change-password.component';
import { fun } from '../../../core/services/functions.service';
import { RolesC } from '../roles/roles';
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

  rolesF = { V: 'Vendedora', A: 'Administradora', U: 'Cajera', C: 'Chofer' };
  rolesM = { V: 'Vendedor', A: 'Administrador', U: 'Cajero', C: 'Chofer' };

  info = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombreCompleto' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Cedula', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Role', tipo: 'textList', key: 'roles', key_value: 'nombre' },
  ];

  botones = { titulo: true, borrar: true, editar: true };

  isCreando: boolean = false;
  listaEmpleados;
  editando = false;
  empleadoSelected: any;
  indexBorrar: any;
  documentos_de_identidad: any;

  camposDisabled = true;
  empleadosClass = new EmpleadoC();
  rolesClass = new RolesC();
  listRoles: [];

  constructor(private fb: FormBuilder, private localeService: BsLocaleService, private tServ: TablasService) {
    super();
    this.dpConfig = Object.assign(
      {},
      {
        showWeekNumbers: false,
        maxDate: new Date(),
        dateInputFormat: 'DD/MM/YYYY',
      },
    );
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

  async getEmpleados(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: page, per_page: per_page, paginado: true } };

      this.empleadosClass.getAll(extra).then((res) => {
        res['data'].map((cli) => {
          cli.nombreCompleto = cli.nombre + ' ' + cli.apellido;
          cli.role_ = cli.sexo === 'm' ? this.rolesM[cli.role] : this.rolesF[cli.role];
          cli.documentos_de_identidad.map((docu) => {
            if (docu.principal) cli.documento_identidad = docu.documento;
          });
          return cli;
        });

        this.listaEmpleados = res['data'];
        const obj = { total: res['total_registros'], tabla: 'listaEmpleados' };
        this.tServ.Func_total_paginas(obj);
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
        console.log('Error obteniendo roles: ', error);
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
              const is_user = _.find(res['data'], (item) => item.persona_is === 'User');

              if (fun.hasValue(is_user) && is_user.persona.estado) {
                fun.toastError(`Esta cedula pertenece a un empleado ya existente. << ${is_user.persona.nombre} ${is_user.persona.apellido} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }
              const documento_original = _.find(this.documentos_de_identidad, (item) => item.principal);
              console.log('🚀 ~ RegistroEmpleadosComponent ~ .then ~ documento_original', documento_original);
              console.log('🚀 ~ RegistroEmpleadosComponent ~ .then ~ this.documentos_de_identidad', this.documentos_de_identidad);
              this.form.controls[documento_original.descripcion].setValue(documento_original.documento);

              // const documento = fun.hasValue(is_user) ? _.omit(is_user, ['persona', 'persona_is']) : _.omit(_.head(res['data']), ['persona', 'persona_is']);
              const persona = fun.hasValue(is_user) ? is_user.persona : _.head(res['data']).persona;

              // persona.fecha_nacimiento = this.fecha(persona.fecha_nacimiento);

              this.form.patchValue(persona);
              if (persona.estado) this.form.controls.id.setValue(null);

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
      if (!enable) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  nombreHasValue() {
    return !this.camposDisabled || fun.hasValue(this.form.controls.nombre.value);
  }

  cancelar() {
    this.form.reset({ estado: true });
    this.borrar();
  }

  borrar() {
    this.form.reset();

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

  editarItem(item) {
    this.form.reset();
    this.documentos_de_identidad = item.ARG.documentos_de_identidad;

    if (this.documentos_de_identidad.length) {
      const doc = item.ARG.documentos_de_identidad.filter((doc) => doc.principal === true);
      if (item.ARG.documentos_de_identidad.length > 0 && fun.hasValue(doc)) this.form.controls.cedula.setValue(doc[0].documento);
    }
    const objPerson = Object.assign({}, item.ARG, { ids_roles: (item.ARG.roles || []).map((rol) => rol.id) });
    this.form.patchValue(objPerson);

    this.empleadoSelected = item.ARG;
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
    // formulario['ids_roles'] = formulario.roles;
    formulario.estado = true;

    const objSend = _.omit(formulario, ['cedula']);

    if (!this.editando && objSend.password === null) {
      fun.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      this.empleadosClass.createUpdateOne(objSend).then((res) => {
        const actualPagination = this.tServ.getPaginationById('listaEmpleados');
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

  eliminarReg(regisData) {
    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar el empleado <b>${regisData.nombre_completo}</b>?`,
      siFunction: () => {
        const actualPagination = this.tServ.getPaginationById('listaEmpleados');
        this.empleadosClass.deleteOne(regisData.id).then((res) => this.getEmpleados(actualPagination));
      },
    };

    this.eliminarRegistro(objToSend);
  }
}
