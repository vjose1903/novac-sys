import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { ModalService } from '../../components/modal/modal.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { TablasService } from '../../components/tablas/tablas.service';
import { LayoutService } from '../../layout/layout.service';
import { IpcService } from '../../../core/services/ipc.service';
import { mixinClass } from '../../mixinClass';

@Component({
  selector: 'app-registro-suplidores',
  templateUrl: './registro-suplidores.component.html',
  styleUrls: ['./registro-suplidores.component.scss'],
})
export class RegistroSuplidoresComponent extends mixinClass implements OnInit, OnDestroy {
  form: FormGroup;
  titulo = '';
  boton = '';
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  metodo;
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  rncMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  listaSuplidores;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
    },
    {
      titulo: 'Nombre',
      key: 'nombre',
    },
    {
      titulo: 'Rnc',
      key: 'documento',
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
  element: HTMLElement;
  documento_identidad = false;
  doc_principal = 'rnc';
  documentos_de_identidad: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private dbServ: DBservice,
    public mServ: ModalService,
    private router: Router,
    private tServ: TablasService,
    public layServ: LayoutService,
    public _ipc: IpcService,
  ) {
    super(mServ, _ipc, layServ);
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_suplidores', _lista_subs: ['decisionModal'] });
    this.titulo = 'Registro de suplidores';
    this.boton = 'Registrar';
    this.metodo = this.route.snapshot.params['metodo'];
    this.marcarCheck('rnc');

    this.form = this.fb.group({
      id: [null],
      nombre: [null, Validators.required],
      telefono: [null, Validators.required],
      rnc: [null],
      cedula: [null],
      direccion: [null, Validators.required],
      email: [null, Validators.compose([Validators.pattern(/^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/)])],
    });

    this.nesesarioStart();
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async nesesarioStart() {
    await this.getSuplidores(this.tServ.obj_paginate);
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }

  async getSuplidores(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getSuplidoresFiltrados(palabra_a_buscar, page, per_page, true).toPromise();
      console.log('res ---> ', res);

      res.data.map((suplidor) => {
        suplidor.documentos_de_identidad.map((docu) => {
          if (docu.principal) {
            suplidor.documento = docu.documento;
          }
        });
        suplidor.codigo = _.padStart(suplidor.id, 5, '0');
        return suplidor;
      });

      this.listaSuplidores = res.data;
    } catch (error) {
      this.dbServ.toastError('Error buscando suplidores registrados.', 'ERROR', true);
    }
  }

  validarRayaAbajo(input) {
    const form = this.form.controls;
    if (form[input] && form[input].value !== null) {
      if (_.endsWith(form[input].value, '_')) {
        return true;
      } else {
        return false;
      }
    }
  }
  atras() {
    this.router.navigateByUrl('/admin/dashboard');
  }

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    (radio as any).checked = true;
  }

  borrar() {
    this.form.reset();
    this.titulo = 'Registro de suplidores';
    this.boton = 'Registrar';
    this.enfocarInput('campoNombre');
    this.documento_identidad = false;
    this.doc_principal = 'rnc';
    this.marcarCheck('rnc');
  }

  changeIdent(arg) {
    this.documento_identidad = arg;
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }

  editarItem(item) {
    this.titulo = 'Editar suplidor: ' + item.ARG.nombre;
    this.boton = 'Editar';
    this.form.patchValue(item.ARG);
    this.documentos_de_identidad = item.ARG.documentos_de_identidad;

    item.ARG.documentos_de_identidad.forEach((doc) => {
      if (doc.descripcion === 'rnc') {
        this.form.controls.rnc.setValue(doc.documento);
      } else {
        this.form.controls.cedula.setValue(doc.documento);
      }

      if (doc.principal) {
        this.doc_principal = doc.descripcion;
      }
    });
  }

  abilitarSend() {
    let res = true;
    if (this.form.valid) {
      res = false;

      if (this.form.controls[this.doc_principal].value && !this.validarRayaAbajo(this.doc_principal)) {
        res = false;
      } else {
        res = true;
      }
    } else {
      res = true;
    }
    return res;
  }

  submit(form) {
    const obj = JSON.parse(JSON.stringify(form.value));
    let devolver = false;

    const Fail = [];
    const documentos_identidad = [];
    const temp_documentos_identidad = [
      { doc: obj.cedula, descripcion: 'cedula' },
      { doc: obj.rnc, descripcion: 'rnc' },
    ];

    if (this.validarRayaAbajo('telefono')) {
      Fail.push('Telefono');
      devolver = true;
    }

    temp_documentos_identidad.forEach((element) => {
      //  esto es para saber si el documento de identidad esta mal escrito
      if (this.validarRayaAbajo(element.descripcion)) {
        Fail.push(element.descripcion);
        devolver = true;
      }
      // haciendo la estructura para mandar los documentos a la base de datos
      if (element.doc !== null && element.doc !== ' ' && element.doc !== '') {
        const doc_backend = _.find(this.documentos_de_identidad, (doc) => _.lowerCase(doc.descripcion) === _.lowerCase(element.descripcion));
        documentos_identidad.push({
          id: doc_backend ? doc_backend.id : null,
          descripcion: element.descripcion,
          documento: element.doc,
          principal: element.descripcion === this.doc_principal ? true : false,
        });
      }
    });
    obj.documentos_de_identidad = documentos_identidad;
    obj.estado = true;

    // entra aqui si el formato de un documento de identidad esta mal
    if (devolver) {
      Fail.forEach((doc) => {
        this.dbServ.toastError('Formato de ' + doc + ' incorrecto', 'ERROR', true);
      });
      // entra aqui si pasa la validacion de documento de identidad
    } else {
      if (this.doc_principal === undefined || this.doc_principal === null || this.doc_principal === ' ' || this.doc_principal === '') {
        this.dbServ.toastError('Debe de seleccionar un documento de identidad como principal', 'ERROR', true);

        // paso todas las validaciones
      } else {
        if (obj.id === null) {
          this.dbServ.createSuplidor(obj).subscribe(
            (res) => {
              this.getSuplidores(this.tServ.obj_paginate);

              this.dbServ.toastSuccess('Suplidor registrado con exito.', 'Correcto');
              this.borrar();
            },
            (err) => {
              console.error(err);

              this.mostrarErrores(err.error.msg);
            },
          );
        } else {
          this.dbServ.editarSuplidor(obj).subscribe(
            (res) => {
              this.getSuplidores(this.tServ.obj_paginate);

              this.dbServ.toastSuccess('Suplidor editado con exito.', 'Correcto');
              this.borrar();
            },
            (err) => {
              console.error(err);
              this.mostrarErrores(err.error);
            },
          );
        }
      }
    }
  }

  mostrarErrores(arg) {
    console.log('::::::', arg);
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

  async decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));

      try {
        const res = await this.dbServ.borrarSuplidor(obj).toPromise();
        this.dbServ.toastSuccess('Empleado ' + obj.nombre + ' borrado.', 'CORRECTO');
        this.getSuplidores(this.tServ.obj_paginate);
      } catch (error) {
        this.mostrarErrores(error.error);
      }
    }
  }
}
