import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { TablasService } from '../../components/tablas/tablas.service';
import { mixinClass } from '../../mixinClass';
import { customValidators } from '../../../core/typescript/custom-validators';
import { pattern } from '../../../core/typescript/constantes';
import { SuplidorC } from './suplidores';

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
    { titulo: 'Cod.', key: 'codigo' },
    { titulo: 'Nombre', key: 'nombre' },
    { titulo: 'Rnc', key: 'documento' },
  ];
  botones = { titulo: true, borrar: true, editar: true };

  doc_is_cedula = false;
  doc_principal = 'rnc';
  documentos_de_identidad: any;

  myValidators = new customValidators();
  camposDisabled: boolean = true;
  editando: boolean = false;
  suplidorClass = new SuplidorC();

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_suplidores', _lista_subs: ['decisionModal'] });
    this.titulo = 'Registro de suplidores';
    this.boton = 'Registrar';
    this.metodo = this.route.snapshot.params['metodo'];

    this.form = this.fb.group({
      id: [null],
      nombre: [{ value: null, disabled: true }, Validators.required],
      telefono: [{ value: null, disabled: true }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      direccion: [{ value: null, disabled: true }, Validators.required],
      email: [{ value: null, disabled: true }, Validators.compose([Validators.email])],

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
    this.enfocarInput('campoRnc');
    this.marcarCheck('rnc');
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

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: page, per_page: per_page, paginado: true } };

      this.suplidorClass.getAll(extra).then((res) => {
        res['data'].map((suplidor) => {
          suplidor.documentos_de_identidad.map((docu) => {
            if (docu.principal) suplidor.documento = docu.documento;
          });
          suplidor.codigo = _.padStart(suplidor.id, 5, '0');
          return suplidor;
        });

        this.listaSuplidores = res['data'];
        const obj = { total: res['total_registros'], tabla: 'listaSuplidores' };
        this.tServ.Func_total_paginas(obj);
      });
    } catch (error) {
      this.fun.toastError('Error buscando suplidores registrados.', 'ERROR');
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

    this.doc_is_cedula = false;
    this.documentos_de_identidad = undefined;
    this.doc_principal = 'rnc';
    this.changeStateCampos(false);

    this.changeIdent(false);
    setTimeout(() => {
      this.marcarCheck('rnc');
      this.enfocarInput('campoRnc');
    }, 2);
  }

  saltar(campo) {
    const formulario = this.form.getRawValue();
    if (campo != 'send') {
      if (campo == 'campoTelefono') {
        if (!_.endsWith(formulario[this.doc_principal], '_')) {
          const docSinGuiones = _.join(_.split(formulario[this.doc_principal], '-'), '');
          if (this.doc_principal == 'cedula') {
            if (GLOBAL.ValidaCedula(docSinGuiones)) this.enfocarInput(campo);
          } else this.enfocarInput(campo);
        }
      } else this.enfocarInput(campo);
    } else {
      if (!this.formIsInvalid()) {
        this.marcarCheck('cedula');
        this.enfocarInput('cedula');

        setTimeout(() => this.submit(), 250);
      }
    }
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
  }

  checkDocumento(tipo, e?) {
    if (e.key != 'Enter') {
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
              const is_suplidor = _.find(res['data'], (item) => item.persona_is === 'Suplidor');

              if (this.fun.hasValue(is_suplidor) && is_suplidor.persona.estado) {
                this.fun.toastError(`${_.capitalize(tipo)} pertenece a un suplidor ya existente. << ${is_suplidor.persona.nombre} >>`, 'ERROR');
                this.changeStateCampos(false);
                return;
              }

              const persona = this.fun.hasValue(is_suplidor) ? is_suplidor.persona : _.head(res['data']).persona;

              this.form.patchValue(persona);

              this.patchDocumentos(persona.documentos_de_identidad);

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
        if (!_.endsWith(documento, '_')) {
          this.documentos_de_identidad = undefined;
          // this.camposDisabled = true;
          this.changeStateCampos(false);
        }
      }
    }
  }

  changeStateCampos(enable = false) {
    const actual_state = this.form.controls.nombre.status;

    ['nombre', 'telefono', 'direccion', 'email'].forEach((campo) => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }

  editarItem(item) {
    this.titulo = 'Editar suplidor: ' + item.ARG.nombre;
    this.boton = 'Editar';
    this.form.patchValue(item.ARG);
    this.documentos_de_identidad = item.ARG.documentos_de_identidad;
    this.editando = true;
    this.patchDocumentos(item.ARG.documentos_de_identidad);
    this.changeStateCampos(true);
  }

  patchDocumentos(documentos) {
    if (documentos.length) {
      documentos.forEach((doc) => {
        if (doc.descripcion === 'rnc') this.form.controls.rnc.setValue(doc.documento);
        else this.form.controls.cedula.setValue(doc.documento);
      });

      const doc_principal = _.find(documentos, (doc) => doc.principal);
      this.changeIdent(doc_principal['descripcion'] === 'cedula');
      this.doc_principal = doc_principal['descripcion'];
      this.marcarCheck(doc_principal['descripcion']);
    }
  }

  formIsInvalid() {
    let res = true;

    if (this.form.valid && !this.camposDisabled) {
      res = false;

      if (this.form.controls[this.doc_principal].value) res = false;
      else res = true;
    } else {
      res = true;
    }
    return res;
  }

  submit() {
    let formulario = this.form.getRawValue();

    const documentos_identidad = [
      { documento: formulario.cedula, descripcion: 'cedula' },
      { documento: formulario.rnc, descripcion: 'rnc' },
    ];

    documentos_identidad.map((element) => {
      const doc_backend = _.find(this.documentos_de_identidad, (doc) => _.lowerCase(doc.descripcion) === _.lowerCase(element.descripcion));
      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = element.descripcion === this.doc_principal ? true : false;
      return element;
    });

    formulario.documentos_de_identidad = _.filter(documentos_identidad, (doc) => this.fun.hasValue(doc.documento));
    formulario.estado = true;

    if (!this.form.controls[this.doc_principal].value) {
      this.fun.toastError('Debe de ingresar el documento marcado como principal', 'ERROR');
      // paso todas las validaciones
    } else {
      this.suplidorClass.createUpdateOne(formulario).then((res) => {
        this.getSuplidores(this.tServ.obj_paginate);
        this.borrar();
      });
    }
  }

  async decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));

      this.suplidorClass.deleteOne(obj.id).then((res) => {
        this.getSuplidores(this.tServ.obj_paginate);
      });
    }
  }
}
