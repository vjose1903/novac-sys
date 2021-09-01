import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from '../../../../utils/javascript/moment';
import { DBservice } from '../../../core/services/bdservice.service';
import { ModalService } from '../../components/modal/modal.service';
import { TablasService } from '../../components/tablas/tablas.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { LayoutService } from '../../layout/layout.service';
import { IpcService } from '../../../core/services/ipc.service';
import { mixinClass } from '../../mixinClass';
import { customValidators } from '../../../core/typescript/custom-validators';
import { pattern } from '../../../core/typescript/constantes';
import { EmpleadoC } from './empleado';
@Component({
  selector: 'app-registro-empleados',
  templateUrl: './registro-empleados.component.html',
  styleUrls: ['./registro-empleados.component.scss'],
})
export class RegistroEmpleadosComponent extends mixinClass implements OnInit, OnDestroy {
  form: FormGroup;
  titulo = '';
  boton = '';
  pattern = pattern;

  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();

  rolesF = { V: 'Vendedora', A: 'Administradora', U: 'Cajera', C: 'Chofer' };
  rolesM = { V: 'Vendedor', A: 'Administrador', U: 'Cajero', C: 'Chofer' };

  info = [
    {
      titulo: 'Nombre',
      key: 'nombreCompleto',
    },
    {
      titulo: 'Telefono',
      key: 'telefono',
    },
    {
      titulo: 'Cedula',
      key: 'documento_identidad', // ojo
    },
    {
      titulo: 'Role',
      key: 'role_', // ojo
    },
  ];

  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };

  listaEmpleados;
  editando = false;
  usuarioSelected: any;
  indexBorrar: any;
  documentos_de_identidad: any;

  documento_valido = true;

  constructor(
    private fb: FormBuilder,
    public layServ: LayoutService,
    public _ipc: IpcService,
    private dbServ: DBservice,
    private router: Router,
    public mServ: ModalService,
    private tServ: TablasService,
    private localeService: BsLocaleService,
  ) {
    super(mServ, _ipc, layServ);
    this.dpConfig = Object.assign(
      {},
      {
        // locale:'es',
        showWeekNumbers: false,
        maxDate: new Date(),
        dateInputFormat: 'DD/MM/YYYY',
      },
    );
  }

  ngOnInit() {
    this.localeService.use('es');
    this.titulo = 'Registro de empleados';
    this.boton = 'Registrar';

    this._init_mixin({ component: 'reg_empleados', _lista_subs: ['decisionModal'] });

    this.necesarioStart();

    this.createForm();
  }

  createForm() {
    const myValidators = new customValidators();

    this.form = this.fb.group({
      id: [{ value: null, disabled: true }],
      nombre: [{ value: null, disabled: true }, Validators.required],
      apellido: [{ value: null, disabled: true }, Validators.required],
      usuario: [{ value: null, disabled: true }, Validators.compose([Validators.required])],
      sexo: [{ value: '', disabled: true }, Validators.required],
      cedula: [{ value: '', disabled: false }, Validators.compose([myValidators.cedulaValidator(), Validators.required])],
      telefono: [{ value: null, disabled: true }, Validators.required],
      email: [{ value: null, disabled: true }, Validators.compose([Validators.pattern(/^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/), Validators.required])],
      fecha_nacimiento: [{ value: null, disabled: true }, Validators.required],
      password: [{ value: null, disabled: true }, Validators.compose([Validators.minLength(6), Validators.required])],
      confirm_password: [{ value: null, disabled: true }, Validators.required],
      // estado: [true],
      role: [{ value: null, disabled: true }, Validators.required],
    });
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.getEmpleados(this.tServ.obj_paginate);
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }

  async getEmpleados(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getEmpleadosFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

      res.data.map((cli) => {
        cli.nombreCompleto = cli.nombre + ' ' + cli.apellido;
        cli.role_ = cli.sexo === 'm' ? this.rolesM[cli.role] : this.rolesF[cli.role];
        cli.documentos_de_identidad.map((docu) => {
          if (docu.principal) {
            cli.documento_identidad = docu.documento;
          }
        });
        return cli;
      });

      this.listaEmpleados = res.data;
      const obj = {
        total: res.total_registros,
        tabla: 'listaEmpleados',
      };
      this.tServ.Func_total_paginas(obj);
    } catch (error) {
      this.dbServ.toastError('Error buscando empleados registrados.', 'ERROR', true);
    }
  }

  checkDocumento(tipo) {
    if (this.form.controls[tipo].valid) {
      this.fun
        .getPersonaByDocIdentidad({ documento: this.form.controls[tipo].value, tipo: 'cedula', tabla_origen: 'user' })
        .then((res) => {
          console.log('res ', res);
        })
        .catch((err) => {
          console.error('err ', err);
        });
    }
  }

  atras() {
    this.router.navigateByUrl('/admin/dashboard');
  }

  borrar() {
    this.form.reset();
    this.enfocarInput('cedula');
    this.titulo = 'Registro de empleados';
    this.boton = 'Registrar';
    this.editando = false;
    this.documentos_de_identidad = undefined;
  }

  fecha(a: any) {
    moment.locale('es');
    const fechaFormato = moment(a).format('DD/MM/YYYY');
    return fechaFormato;
  }

  editarItem(item) {
    this.documentos_de_identidad = item.ARG.documentos_de_identidad;
    const doc = item.ARG.documentos_de_identidad.filter((doc) => doc.principal === true);

    if (item.ARG.documentos_de_identidad.length > 0 && this.fun.hasValue(doc)) this.form.controls.cedula.setValue(doc[0].documento);

    item.ARG.fecha_nacimiento = this.fecha(item.ARG.fecha_nacimiento);
    this.form.patchValue(item.ARG);
    this.usuarioSelected = item.ARG;
    this.editando = true;
    this.titulo = 'Editar empleado: ' + item.ARG.nombre;
    this.boton = 'Editar';
  }

  submit(form) {
    const objTemp = JSON.parse(JSON.stringify(form));

    // const documentos_identidad = [];

    const documentos_identidad = [
      { documento: objTemp.cedula, descripcion: 'cedula' },
      // { doc: objTemp.rnc, descripcion: 'rnc' },
    ];

    documentos_identidad.map((element) => {
      // haciendo la estructura para mandar los documentos a la base de datos
      const doc_backend = _.find(this.documentos_de_identidad, (doc) => _.lowerCase(doc.descripcion) === _.lowerCase(element.descripcion));

      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = true;
      return element;
    });

    objTemp.documentos_de_identidad = documentos_identidad;
    objTemp.estado = true;
    const objSend = _.omit(objTemp, ['cedula']);

    if (!this.editando && objSend.password === null) {
      this.dbServ.toastError('Contraseña no puede estar vacia !!!', 'ERROR', true);
    } else {
      this.dbServ.createUpdateEmpleados(objSend).subscribe((res) => {
        this.getEmpleados(this.tServ.obj_paginate);
        this.borrar();
        this.enfocarInput('cedula');
      });
    }
  }

  decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));
      this.dbServ.deleteEmpleados(obj).subscribe((res) => this.getEmpleados(this.tServ.obj_paginate));
    }
  }
}
