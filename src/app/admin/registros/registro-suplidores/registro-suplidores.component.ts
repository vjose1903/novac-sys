import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { customValidators } from '@core/typescript/custom-validators';
import { pattern } from '@core/typescript/constantes';
import { SuplidorC } from './suplidores';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { DgiiConsultarPersonaService } from '@core/services/dgii-consultar-persona.service';

@Component({
  selector: 'app-registro-suplidores',
  templateUrl: './registro-suplidores.component.html',
  styleUrls: ['./registro-suplidores.component.scss'],
  standalone: false,
})
export class RegistroSuplidoresComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;

  boton = '';
  metodo;
  pattern = pattern;

  listaSuplidores = [];

  suplidorSelected;
  doc_is_cedula = false;
  doc_principal = 'rnc';
  documentos_de_identidad: any;
  documentoEnConsulta: string | null = null;
  ultimaConsultaDocumento: string | null = null;
  ultimaConsultaAt = 0;

  isCreando: boolean = false;

  myValidators = new customValidators();
  camposDisabled: boolean = true;
  editando: boolean = false;
  suplidorClass = new SuplidorC();
  suplidorSortFields = ['nombre'];
  permissions = Permisos;
  table_config: table_config = {
    info: [
      { titulo: 'Cod.', tipo: 'text', key: 'codigo' },
      { titulo: 'Nombre', tipo: 'text', key: 'nombre', sort: { key: 'nombre', order: null } },
      { titulo: 'Rnc', tipo: 'text', key: 'documento_identidad' },
    ],

    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_suplidores',
    padre_functions: { data_request: params => this.getSuplidores(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.suplidor.update }, borrar: { show: true, permiso: this.permissions.suplidor.destroy } },
  };
  tablaComponent;
  formPermissions = [Permisos.suplidor.create, Permisos.suplidor.update];

  public htmlServ = inject(HtmlElementsService);
  public dynamicModalServ = inject(DynamicModalService);
  private dgiiConsultarPersonaServ = inject(DgiiConsultarPersonaService);
  private fb = inject(UntypedFormBuilder);
  private route = inject(ActivatedRoute);
  private tServ = inject(TablasService);

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_suplidores', is_routing: true });

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

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async nesesarioStart() {
    await this.getSuplidores(this.tServ.obj_paginate.default);
    fun.enfocarInput('rnc');
    this.marcarCheck('rnc');
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.capitalice(arg));
  }

  async getSuplidores(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const sort = this.getSuplidoresSortParams();

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true, ...sort } };

    this.listaSuplidores.length = 0;
    this.suplidorClass.getAll(extra).then(res => {
      res['data'].map(suplidor => {
        const doc = _.find(suplidor.documentos_de_identidad, { principal: true });
        suplidor.documento_identidad = fun.hasValue(doc) ? doc.documento : '----------';

        suplidor.codigo = _.padStart(suplidor.id, 5, '0');
        return suplidor;
      });

      this.listaSuplidores = res['data'];
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  getSuplidoresSortParams() {
    const sort = this.tServ.parseSort(this.table_config);
    if (!fun.hasValue(sort.order_by)) return {};

    const orderBy = sort.order_by
      .split(',')
      .map(item => {
        const [campo, direccion = 'asc'] = item.split(':');
        if (!this.suplidorSortFields.includes(campo)) return null;
        return `${campo}:${direccion == 'desc' ? 'desc' : 'asc'}`;
      })
      .filter(item => fun.hasValue(item));

    return orderBy.length ? { order_by: orderBy.join(',') } : {};
  }

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    if (radio) (radio as any).checked = true;
    this.changeIdent(arg == 'cedula');
    this.setDocumentoPrincipal(arg);
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.boton = 'Registrar';

    this.doc_is_cedula = false;
    this.documentos_de_identidad = undefined;

    this.suplidorSelected = undefined;
    this.isCreando = true;
    this.changeStateCampos(false);

    fun.setTimeout(() => {
      this.marcarCheck('rnc');
      fun.enfocarInput('rnc');
    }, 2);
  }

  saltar(campo) {
    const formulario = this.form.getRawValue();
    if (campo != 'send') {
      if (campo == 'campoTelefono') {
        const documento = formulario[this.doc_principal] ?? '';

        if (!_.endsWith(documento, '_')) {
          const docSinGuiones = _.join(_.split(documento, '-'), '');
          if (this.doc_principal == 'cedula') {
            if (fun.ValidaCedula(docSinGuiones)) fun.enfocarInput(campo);
          } else fun.enfocarInput(campo);
        }
      } else fun.enfocarInput(campo);
    } else {
      if (!this.formIsInvalid()) {
        this.marcarCheck('cedula');
        fun.enfocarInput('cedula');

        fun.setTimeout(() => this.submit(), 250);
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

  async checkDocumento(tipo, e?) {
    if (e.key != 'Enter') {
      const documento = this.form.controls[tipo].value ?? '';
      const documentoNormalizado = documento.replace(/\s+/g, '');
      const ahora = Date.now();

      if (this.documentoEnConsulta === documentoNormalizado) return;
      if (this.ultimaConsultaDocumento === documentoNormalizado && ahora - this.ultimaConsultaAt < 1000) return;

      let enable_campos = false;

      if (this.form.controls[tipo].valid) {
        if (this.editando && this.documentos_de_identidad.some(doc => doc.documento === documento)) {
          enable_campos = true;
          return;
        }

        this.documentoEnConsulta = documentoNormalizado;
        this.ultimaConsultaDocumento = documentoNormalizado;
        this.ultimaConsultaAt = ahora;

        try {
          await fun
            .getPersonaByDocIdentidad({ documento: documento, tipo: tipo })
            .then(async res => {
            if (res['data'].length) {
              const is_suplidor = _.find(res['data'], item => item.persona_is === 'Suplidor');
              const id_anterior = this.form.getRawValue().id;

              if (fun.hasValue(is_suplidor) && is_suplidor?.persona?.estado) {
                fun.toastError(`${_.capitalize(tipo)} pertenece a un suplidor ya existente. << ${is_suplidor.persona.nombre} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }

              const persona = fun.hasValue(is_suplidor) ? is_suplidor?.persona : _.head(res['data']).persona;
              persona.id = id_anterior;
              const documento_persona = _.find(persona.documentos_de_identidad, item => item.principal);

              if (fun.hasValue(documento_persona)) {
                this.doc_is_cedula = documento_persona.descripcion == 'cedula' ? true : false;
                this.form.controls[documento_persona.descripcion].setValue(documento_persona.documento);
              }

              this.form.patchValue(persona);

              this.patchDocumentos(persona.documentos_de_identidad);

              if (this.camposDisabled) enable_campos = true;

              this.documentos_de_identidad = persona.documentos_de_identidad;
            } else {
              const dgiiPersona = await this.dgiiConsultarPersonaServ.consultarPersona(documento);

              if (dgiiPersona) {
                this.form.controls.nombre.setValue(`${dgiiPersona.nombre ?? ''} ${dgiiPersona.apellido ?? ''}`.trim());
              } else {
                this.form.controls.nombre.reset();
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
        if (!_.endsWith(documento, '_')) {
          this.documentos_de_identidad = undefined;
          // this.camposDisabled = true;
          this.changeStateCampos(false);
        }
      }
    }
  }

  nuevoRegistro() {
    this.isCreando = true;

    fun.setTimeout(() => {
      this.marcarCheck('rnc');
      fun.enfocarInput('rnc');
    }, 200);
  }

  changeStateCampos(enable = false) {
    const actual_state = this.form.controls.nombre.status;

    ['nombre', 'telefono', 'direccion', 'email'].forEach(campo => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable && fun.hasValue(this.form.controls[campo])) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  eliminarReg(regisData) {
    const onYes = () => {
      this.suplidorClass.deleteOne(regisData.id).then(res => {
        const actualPagination = this.tServ.getPaginationById('lista_suplidores');
        this.getSuplidores(actualPagination);
      });
    };

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: `¿Está seguro que desea eliminar el suplidor <b>${regisData.nombre_completo}</b>?`,
      btnKind: confirmationButtons.cancelarEliminar,
      onYes: onYes.bind(this),
    });
  }

  editarItem(data) {
    this.boton = 'Editar';
    this.form.patchValue(data);
    this.documentos_de_identidad = data.documentos_de_identidad;
    this.editando = true;
    this.suplidorSelected = fun.deepCloning(data);

    this.changeStateCampos(true);

    this.patchDocumentos(data.documentos_de_identidad);
    fun.setTimeout(() => fun.enfocarInput('rnc'), 1);
  }

  patchDocumentos(documentos) {
    if (documentos.length) {
      documentos.forEach(doc => {
        if (doc.descripcion === 'rnc') this.form.controls.rnc.setValue(doc.documento);
        else this.form.controls.cedula.setValue(doc.documento);
      });

      const doc_principal = documentos.find(doc => doc.principal);

      fun.setTimeout(() => this.marcarCheck(doc_principal['descripcion']), 1);
    } else {
      ['rnc', 'cedula'].forEach(docType => {
        this.form.controls[docType].setValue(null);
      });
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

    documentos_identidad.map(element => {
      const doc_backend = _.find(this.documentos_de_identidad, doc => doc.descripcion.toLowerCase() == element.descripcion.toLowerCase());
      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = element.descripcion === this.doc_principal ? true : false;
      return element;
    });

    formulario.documentos_de_identidad = _.filter(documentos_identidad, doc => fun.hasValue(doc.documento));
    formulario.estado = true;

    if (!this.form.controls[this.doc_principal].value) {
      fun.toastError('Debe de ingresar el documento marcado como principal', 'ERROR');
      // paso todas las validaciones
    } else {
      this.suplidorClass.createUpdateOne(formulario).then(res => {
        const actualPagination = this.tServ.getPaginationById('lista_suplidores');
        this.getSuplidores(actualPagination);
        this.borrar();
      });
    }
  }
}
