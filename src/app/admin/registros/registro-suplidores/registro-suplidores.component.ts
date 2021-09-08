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
import { customValidators } from '../../../core/typescript/custom-validators';
import { pattern } from '../../../core/typescript/constantes';

@Component({
  selector: 'app-registro-suplidores',
  templateUrl: './registro-suplidores.component.html',
  styleUrls: ['./registro-suplidores.component.scss'],
})
export class RegistroSuplidoresComponent extends mixinClass implements OnInit, OnDestroy {
  form: FormGroup;
  titulo = '';
  boton = '';
  metodo;
  pattern = pattern;

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
  doc_is_cedula = false;
  doc_principal = 'rnc';
  documentos_de_identidad: any;

  myValidators = new customValidators();
  camposDisabled: boolean = true;
  editando: boolean = false;

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
      nombre: [{ value: null, disabled: true }, Validators.required],
      telefono: [{ value: null, disabled: true }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      direccion: [{ value: null, disabled: true }, Validators.required],
      email: [{ value: null, disabled: true }, Validators.compose([Validators.pattern(/^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/)])],

      rnc: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      cedula: [null],
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

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    (radio as any).checked = true;
  }

  borrar() {
    this.form.reset();
    this.titulo = 'Registro de suplidores';
    this.boton = 'Registrar';
    this.enfocarInput('campoNombre');
    this.doc_is_cedula = false;
    this.documentos_de_identidad = undefined;
    this.doc_principal = 'rnc';
    this.marcarCheck('rnc');
    this.changeStateCampos(false);
  }

  changeIdent(arg) {
    this.doc_is_cedula = arg;

    if (arg) {
      this.form.controls.rnc.clearValidators();
      this.form.controls.cedula.setValidators(Validators.compose([Validators.required, this.myValidators.cedulaValidator(), this.myValidators.ValidateRayaAbajo()]));
    } else {
      this.form.controls.cedula.clearValidators();
      this.form.controls.rnc.setValidators(Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()]));
    }

    this.form.controls.cedula.updateValueAndValidity();
    this.form.controls.rnc.updateValueAndValidity();
    console.log('this.form ', this.form.controls);
  }

  p() {
    console.log('this.form ', this.form.controls);
  }

  checkDocumento(tipo, e?) {
    const documento = this.form.controls[tipo].value;

    let enable_campos = false;

    if (this.form.controls[tipo].valid) {
      if (this.editando && _.some(this.documentos_de_identidad, (doc) => doc.documento === documento)) {
        enable_campos = true;
        return;
      }

      this.fun
        .getPersonaByDocIdentidad({ documento: this.form.controls[tipo].value, tipo: 'cedula' })
        .then((res) => {
          if (res['data'].length) {
            console.log("res['data'] --> ", res['data']);

            const is_suplidor = _.find(res['data'], (item) => item.persona_is === 'Suplidor');

            if (this.fun.hasValue(is_suplidor) && is_suplidor.persona.estado) {
              this.fun.toastError(`Esta cedula pertenece a un suplidor ya existente. << ${is_suplidor.persona.nombre} >>`, 'ERROR', true);
              this.changeStateCampos(false);
              // this.camposDisabled = false;

              return;
            }

            // const documento = this.fun.hasValue(is_suplidor) ? _.omit(is_suplidor, ['persona', 'persona_is']) : _.omit(_.head(res['data']), ['persona', 'persona_is']);
            const persona = this.fun.hasValue(is_suplidor) ? is_suplidor.persona : _.head(res['data']).persona;

            // persona.fecha_nacimiento = this.fecha(persona.fecha_nacimiento);

            this.form.patchValue(persona);

            this.patchDocumentos(persona.documentos_de_identidad);

            if (persona.estado) this.form.controls.id.setValue(null);

            if (this.camposDisabled) enable_campos = true;

            this.documentos_de_identidad = persona.documentos_de_identidad;
            console.log('this.form.value: ', this.form.value);
            console.log('this.documentos_de_identidad: ', this.documentos_de_identidad);
          } else {
            enable_campos = true;
          }

          if (enable_campos) {
            this.changeStateCampos(true);
            // this.camposDisabled = false;
          }
        })
        .catch((err) => {
          console.error('err ', err);
        });
    } else {
      if (!_.endsWith(documento, '_')) {
        this.documentos_de_identidad = undefined;
        // this.camposDisabled = true;
        this.changeStateCampos(false);
      }
    }
  }

  changeStateCampos(enable = false) {
    const actual_state = this.form.controls.nombre.status;

    console.log('actual_state: ', actual_state);
    ['nombre', 'telefono', 'direccion', 'email'].forEach((campo) => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
    console.log('this.doc_principal --> ', this.doc_principal);
  }

  editarItem(item) {
    this.titulo = 'Editar suplidor: ' + item.ARG.nombre;
    this.boton = 'Editar';
    this.form.patchValue(item.ARG);
    this.documentos_de_identidad = item.ARG.documentos_de_identidad;
    this.editando = true;
    this.patchDocumentos(item.ARG.documentos_de_identidad);
  }

  patchDocumentos(documentos) {
    documentos.forEach((doc) => {
      console.log('doc: ', doc);

      if (doc.descripcion === 'rnc') this.form.controls.rnc.setValue(doc.documento);
      else this.form.controls.cedula.setValue(doc.documento);
    });

    const doc_principal = _.find(documentos, (doc) => doc.principal);
    this.changeIdent(doc_principal['descripcion'] === 'cedula');
    this.doc_principal = doc_principal['descripcion'];
    this.marcarCheck(doc_principal['descripcion']);
  }

  abilitarSend() {
    let res = true;

    if (this.form.valid) {
      res = false;

      if (this.form.controls[this.doc_principal].value) {
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

    const documentos_identidad = [
      { documento: obj.cedula, descripcion: 'cedula' },
      { documento: obj.rnc, descripcion: 'rnc' },
    ];

    documentos_identidad.map((element) => {
      const doc_backend = _.find(this.documentos_de_identidad, (doc) => _.lowerCase(doc.descripcion) === _.lowerCase(element.descripcion));

      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = element.descripcion === this.doc_principal ? true : false;
      return element;
    });

    obj.documentos_de_identidad = _.filter(documentos_identidad, (doc) => this.fun.hasValue(doc.documento));
    obj.estado = true;

    if (!this.form.controls[this.doc_principal].value) {
      this.dbServ.toastError('Debe de ingresar el documento marcado como principal', 'ERROR', true);

      // paso todas las validaciones
    } else {
      console.log('obj --> ', obj);

      this.dbServ.createUpdateSuplidores(obj).subscribe((res) => {
        this.getSuplidores(this.tServ.obj_paginate);
        this.borrar();
      });
    }
  }

  async decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));

      try {
        const res = await this.dbServ.borrarSuplidor(obj).toPromise();
        this.getSuplidores(this.tServ.obj_paginate);
      } catch (error) {}
    }
  }
}
