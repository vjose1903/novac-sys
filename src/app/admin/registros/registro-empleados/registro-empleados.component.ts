import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { PhotosService } from '../../../core/services/photos.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { DBservice } from '../../../core/services/bdservice.service';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ModalService } from '../../components/modal/modal.service';
import { TablasService } from '../../components/tablas/tablas.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
@Component({
  selector: 'app-registro-empleados',
  templateUrl: './registro-empleados.component.html',
  styleUrls: ['./registro-empleados.component.scss'],
})
export class RegistroEmpleadosComponent implements OnInit, OnDestroy {
  form: FormGroup;
  titulo = '';
  boton = '';
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  element: HTMLElement;
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
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
  tipoModal: string;
  indexSeleccionado: any;
  editando = false;
  usuarioSelected: any;
  seleccionModal: any;
  indexBorrar: any;
  subDeci: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private dbServ: DBservice,
    private router: Router,
    private mServ: ModalService,
    private tServ: TablasService,
  ) {
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
    this.titulo = 'Registro de empleados';
    this.boton = 'Registrar';

    // this.titulo = 'Actualizar empleado';
    // this.boton = 'Actualizar';

    this.necesarioStart();
    this.form = this.fb.group({
      id: [null],
      nombre: [null, Validators.required],
      apellido: [null, Validators.required],
      usuario: [null, Validators.compose([Validators.required])],
      sexo: ['', Validators.required],
      cedula: [''],
      telefono: [null, Validators.required],
      email: [null, Validators.compose([Validators.pattern(/^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/)])],
      fecha_nacimiento: [null, Validators.required],
      password: [null],
      // estado: [true],
      role: [null, Validators.required],
    });
    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
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

  ngOnDestroy(): void {
    this.subDeci.unsubscribe();
  }

  atras() {
    this.router.navigateByUrl('/admin/dashboard');
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  borrar() {
    this.form.reset();
    this.enfocarInput('campoNombre');
    this.titulo = 'Registro de empleados';
    this.boton = 'Registrar';
    this.editando = false;
  }

  fecha(a: any) {
    moment.locale('es');
    const fechaFormato = moment(a).format('DD/MM/YYYY');
    return fechaFormato;
  }

  editarItem(item) {
    this.indexSeleccionado = item.INDEX;
    const doc = item.ARG.documentos_de_identidad.filter((doc) => doc.principal === true);

    if (item.ARG.documentos_de_identidad.length > 0 && doc !== [] && doc !== null && doc !== undefined) {
      this.form.controls.cedula.setValue(doc[0].documento);
    }

    item.ARG.fecha_nacimiento = this.fecha(item.ARG.fecha_nacimiento);
    this.form.patchValue(item.ARG);
    this.usuarioSelected = item.ARG;
    this.editando = true;
    this.titulo = 'Editar empleado: ' + item.ARG.nombre;
    this.boton = 'Editar';
  }

  submit(form) {
    const objTemp = JSON.parse(JSON.stringify(form));

    const documentos_identidad = [];
    const temp_documentos_identidad = [
      { doc: objTemp.cedula, descripcion: 'cedula' },
      // { doc: objTemp.rnc, descripcion: 'rnc' },
    ];

    temp_documentos_identidad.forEach((element) => {
      // haciendo la estructura para mandar los documentos a la base de datos
      if (element.doc !== null && element.doc !== ' ' && element.doc !== '' && element.doc !== undefined) {
        documentos_identidad.push({
          descripcion: element.descripcion,
          documento: element.doc,
          principal: true,
        });
      }
    });
    objTemp.documentos_de_identidad_attributes = documentos_identidad;
    objTemp.estado = true;
    const objSend = _.omit(objTemp, ['cedula']);

    if (!this.editando && objSend.password === null) {
      this.dbServ.toastError('Contraseña no puede estar vacia !!!', 'ERROR', true);
    } else {
      if (objSend.id) {
        objSend['id'] = objSend.id;

        this.dbServ.updateEmpleados(objSend).subscribe(
          (res) => {
            this.dbServ.toastSuccess('Usuario Editado', 'Correcto');

            this.getEmpleados(this.tServ.obj_paginate);
            this.borrar();
          },
          (err) => {
            this.dbServ.toastError(err.error.msg, 'ERROR', true);
          },
        );
      } else {
        this.dbServ.createEmpleados(objSend).subscribe(
          (res) => {
            this.getEmpleados(this.tServ.obj_paginate);
            this.dbServ.toastSuccess('Usuario Creado', 'Correcto');

            this.borrar();
            this.enfocarInput('campoNombre');
          },
          (err) => {
            this.mostrarErrores(err.error.errors.full_messages);
          },
        );
      }
    }
  }

  abrirModal(arg?) {
    this.mServ.modalTipo('borrar');
    this.indexBorrar = arg.INDEX;
    this.seleccionModal = arg.ARG;
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }

  cambiarPassword(arg?) {
    this.mServ.modalTipo('password');
    this.tipoModal = 'password';
    this.mServ.ModalSeleccion(this.usuarioSelected);
    this.mServ.mostrarModal(true);
  }

  decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));
      obj['estado'] = false;
      obj['documentos_de_identidad_attributes'] = obj.documentos_de_identidad;
      this.dbServ.updateEmpleados(obj).subscribe(
        (res) => {
          this.dbServ.toastSuccess('Empleado ' + obj.nombre + ' borrado.', 'CORRECTO');
          _.pullAt(this.listaEmpleados, this.indexBorrar);
          this.tipoModal = '';
          this.indexBorrar = -1;
          // this.decisionModal = null;
        },
        (err) => {
          this.mostrarErrores(err.error.errors);
        },
      );
    }
  }

  mostrarErrores(arg) {
    if (Array.isArray(arg)) {
      arg.forEach((error) => {
        this.dbServ.toastError(error, 'ERROR', true);
      });
    } else {
      for (const key in arg) {
        if (arg.hasOwnProperty(key)) {
          const element = arg[key];

          if (key !== 'status') {
            this.dbServ.toastError(element, 'ERROR', true);
          }
        }
      }
    }
  }
}
