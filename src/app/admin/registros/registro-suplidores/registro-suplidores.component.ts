import { DivisaService } from './../divisa/divisa.service';
import { entidadesContables } from './../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.utils';
import { EntidadCuentaContableService } from './../../contabilidad/entidad-cuenta-contable/entidad-cuenta-contable.service';
import { ConfigI } from '@core/interface/config-interface';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { customValidators } from '@core/typescript/custom-validators';
import { pattern } from '@core/typescript/constantes';
import { SuplidorC, SuplidorI } from './suplidores';
import { fun } from '@core/services/functions.service';
import { default_per_page, tableCellType, table_config } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';
import { CategoriaEntidadContableService } from '../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.service';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../contabilidad/configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableC } from '../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.utils';
import { FormEntidadCuentaContableI } from '../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { maxSizeTypeE } from '@core/directive/max-sizer.directive';
import { ImagenService } from '@core/services/imagen.service';
import { documentoIdentidad } from '@core/typescript/documentos_de_identidad.utils';
import * as _ from 'lodash';
import { Ss } from '@core/services/singleton.service';
import { confirmationButtons, ICallbackModal, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'app-registro-suplidores',
  templateUrl: './registro-suplidores.component.html',
  styleUrls: ['./registro-suplidores.component.scss'],
  standalone: false,
})
export class RegistroSuplidoresComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;

  botonLabel = '';
  metodo;
  pattern = pattern;

  listaSuplidores: SuplidorI[] = [];
  listaConfigSuplidores: Array<ConfiguracionEntidadCuentaI> = [];
  listaConfigSuplidoresCopy: Array<ConfiguracionEntidadCuentaI> = [];
  listaEntidadCuentasContables: Array<FormEntidadCuentaContableI> = [];
  currentDivisaNacional: boolean = false;

  suplidorSelected;
  doc_is_cedula = false;
  doc_principal = documentoIdentidad.rnc;
  documentos_de_identidad: any;

  isCreando: boolean = false;

  myValidators = new customValidators();
  camposDisabled: boolean = true;
  editando: boolean = false;
  suplidorClass = new SuplidorC();
  configEntContableClass = new ConfiguracionEntidadCuentaC();

  permissions = Permisos;
  table_config: table_config = {
    info: [
      { titulo: 'Divisa', tipo: tableCellType.img, key: 'img_divisa', rowTooltip: 'img_divisa_tooltip', style: { 'padding-left': '0.5rem', 'padding-right': '0.5rem', width: '4rem' } },
      { titulo: 'Cod.', tipo: tableCellType.text, key: 'codigo', style: { width: '9%' } },
      { titulo: 'Nombre', tipo: tableCellType.text, key: 'nombre', style: { 'text-align': 'start', 'padding-left': '1rem' } },
      { titulo: 'Rnc', tipo: tableCellType.text, key: 'documento_identidad', style: { width: '17.5%' } },
    ],

    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_suplidores',
    padre_functions: { data_request: params => this.getSuplidores(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.suplidor.update }, borrar: { show: true, permiso: this.permissions.suplidor.destroy }, styles: { width: '5.5rem' } },
  };
  tablaComponent;
  formPermissions = [Permisos.suplidor.create, Permisos.suplidor.update];

  entidadContable: entidadesContables = CategoriaEntidadContableC.entidad.suplidor;
  configApp!: ConfigI;
  fun = fun;
  maxSizeTypeE = maxSizeTypeE;

  public htmlServ = inject(HtmlElementsService);
  public dynamicModalServ = inject(DynamicModalService);
  private fb = inject(UntypedFormBuilder);
  private route = inject(ActivatedRoute);
  private tServ = inject(TablasService);
  public categoriaEntidadServ = inject(CategoriaEntidadContableService);
  public entCuentaContServ = inject(EntidadCuentaContableService);
  public imgServ = inject(ImagenService);
  public divisaServ = inject(DivisaService);

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_suplidores', is_routing: true });

    this.botonLabel = 'Registrar';
    this.metodo = this.route.snapshot.params['metodo'];
    this.configApp = Ss.configServ.config;

    this.nesesarioStart();
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async nesesarioStart() {
    await this.createForm();
    await this.getSuplidores(this.tServ.obj_paginate.default);
    await this.getConfigEntidadSuplidores();

    fun.enfocarInput('rnc');
    this.marcarCheck('rnc');
  }

  async createForm() {
    this.form = this.fb.group({
      id: [null],
      nombre: [{ value: null, disabled: true }, Validators.required],
      divisa_id: [{ value: null, disabled: true }, Validators.required],
      telefono: [{ value: null, disabled: true }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      direccion: [{ value: null, disabled: true }, Validators.required],
      email: [{ value: null, disabled: true }, Validators.compose([Validators.email])],

      rnc: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      cedula: [null],
    });
  }

  async getSuplidores(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };

    this.listaSuplidores.length = 0;
    this.suplidorClass.getAll(extra).then(res => {
      res['data'].map(suplidor => {
        const doc = suplidor.documentos_de_identidad.find(doc => doc.principal == true);
        suplidor.documento_identidad = fun.hasValue(doc) ? doc.documento : '----------';
        suplidor.img_divisa = suplidor?.divisa?.imagen?.file_name ? this.imgServ.getImgUrlServer(suplidor?.divisa?.imagen?.file_name) : 'assets/img/no-divisa.png';
        suplidor.img_divisa_tooltip = suplidor?.divisa?.nombre ? suplidor?.divisa?.nombre : 'Divisa no registrada';
        suplidor.codigo = String(suplidor.id).padStart(5, '0');

        return suplidor;
      });

      this.listaSuplidores = res['data'] as SuplidorI[];
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  getConfigEntidadSuplidores() {
    const extra = { parameters: { filter_target: CategoriaEntidadContableC.entidad.suplidor } };
    this.configEntContableClass.getAll(extra).then(res => {
      this.listaConfigSuplidoresCopy = res['data'];
      this.listaConfigSuplidores = fun.deepCloning(this.listaConfigSuplidoresCopy);
    });
  }

  filterConfig() {
    const copyList = fun.deepCloning(this.listaConfigSuplidoresCopy);

    if (this.currentDivisaNacional) this.listaConfigSuplidores = copyList.filter(config => config.is_nacional);
    else this.listaConfigSuplidores = fun.deepCloning(copyList);
  }

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    if (radio) (radio as any).checked = true;
    this.changeIdent(arg == documentoIdentidad.cedula);
    this.setDocumentoPrincipal(arg);
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();

    this.botonLabel = 'Registrar';
    this.doc_is_cedula = false;
    [this.documentos_de_identidad, this.suplidorSelected] = Array(2).fill(undefined);
    this.isCreando = true;
    this.editando = false;
    this.changeStateCampos(false);

    this.listaEntidadCuentasContables = [];

    fun.setTimeout(() => {
      this.marcarCheck('rnc');
      fun.enfocarInput('rnc');
    }, 2);
  }

  saltar(campo) {
    const formulario = this.form.getRawValue();
    if (campo != 'send') {
      if (campo == 'campoTelefono') {
        if (!formulario[this.doc_principal].endsWith('_')) {
          const docSinGuiones = formulario[this.doc_principal].split('-').join('');
          if (this.doc_principal == documentoIdentidad.cedula) {
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

  changeDivisa(event?) {
    const formulario = this.form.getRawValue();
    const current_divisa = this.imgServ.getDivisaInfoById(formulario.divisa_id);
    this.currentDivisaNacional = current_divisa ? current_divisa?.is_principal : false;
    this.filterConfig();

    if (fun.hasValue(event) && fun.hasValue(event?.originalEvent) && fun.hasValue(event?.originalEvent?.type) && event?.originalEvent?.type == 'click') {
      setTimeout(() => fun.enfocarInput('campoDir'), 100);
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
        if (this.editando && this.documentos_de_identidad.some(doc => doc.documento === documento)) {
          enable_campos = true;
          return;
        }

        fun
          .getPersonaByDocIdentidad({ documento: this.form.controls[tipo].value, tipo: 'cedula' })
          .then(res => {
            if (res['data'].length) {
              const is_suplidor = res['data'].find(item => item.persona_is === 'Suplidor');
              const id_anterior = this.form.getRawValue().id;

              if (fun.hasValue(is_suplidor) && is_suplidor?.persona?.estado) {
                fun.toastError(`${fun.capitalice(tipo)} pertenece a un suplidor ya existente. << ${is_suplidor.persona.nombre} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }

              const persona = fun.hasValue(is_suplidor) ? is_suplidor?.persona : res['data'][0].persona;
              persona.id = id_anterior;
              const documento_persona = persona.documentos_de_identidad.find(item => item.principal == true);

              if (fun.hasValue(documento_persona)) {
                this.doc_is_cedula = documento_persona.descripcion == documentoIdentidad.cedula ? true : false;
                this.form.controls[documento_persona.descripcion].setValue(documento_persona.documento);
              }

              this.form.patchValue(persona);

              this.patchDocumentos(persona.documentos_de_identidad);

              if (this.camposDisabled) enable_campos = true;

              this.documentos_de_identidad = persona.documentos_de_identidad;
            } else {
              enable_campos = true;
            }

            if (enable_campos) this.changeStateCampos(true);
          })
          .catch(err => {
            console.error('err ', err);
          });
      } else {
        if (!documento.endsWith('_')) {
          this.documentos_de_identidad = undefined;
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

  openModalCategorias() {
    const callback = (arg: ICallbackModal) => {
      if (arg.type != modalCloseType.onHide) return;

      this.categoriaEntidadServ.setCategoriaChange();
    };

    this.categoriaEntidadServ.openModalCategorias({ entidad: CategoriaEntidadContableC.entidad.suplidor, id_modal: 'categorias_suplidores', inputs: { configsEntCuentas: this.listaConfigSuplidores }, callback });
  }

  changeStateCampos(enable = false) {
    ['nombre', 'telefono', 'direccion', 'email', 'divisa_id'].forEach(campo => {
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
    this.botonLabel = 'Editar';
    this.form.patchValue(data);
    this.form.controls.divisa_id.setValue(data?.divisa?.id);

    this.documentos_de_identidad = data.documentos_de_identidad;
    this.patchDocumentos(this.documentos_de_identidad);
    if (fun.hasValue(this.documentos_de_identidad)) this.doc_is_cedula = this.documentos_de_identidad[0].descripcion == documentoIdentidad.rnc ? false : true;

    this.editando = true;
    this.suplidorSelected = fun.deepCloning(data);

    this.listaEntidadCuentasContables = this.entCuentaContServ.parseCuentasFromBackend(data.cuentas_contables);

    this.suplidorSelected = fun.deepCloning(data);
    this.changeDivisa();

    this.changeStateCampos(true);
    this.patchDocumentos(data.documentos_de_identidad);

    fun.setTimeout(() => fun.enfocarInput('rnc'), 1);
  }

  patchDocumentos(documentos) {
    if (documentos.length) {
      documentos.forEach(doc => {
        if (doc.descripcion === documentoIdentidad.rnc) this.form.controls.rnc.setValue(doc.documento);
        else this.form.controls.cedula.setValue(doc.documento);
      });

      const doc_principal = documentos.find(doc => doc.principal == true);

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

    const entidades_validation = this.validate_cuentas();

    const result = entidades_validation.valid ? res : !entidades_validation.valid;

    return result || !this.checkIfSomethingIsDiferrent();
    // return result;
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['cedula', 'rnc', 'nombre', 'telefono', 'direccion', 'email', 'id'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);
    formValue['cuentas_contables'] = fun.deepCloning(this.listaEntidadCuentasContables);

    const originalSuplidor = this.listaSuplidores.find(suplidor => suplidor.id == formValue.id);
    const originalValue = fun.pick(originalSuplidor, pick_values);

    originalValue['cedula'] = originalSuplidor?.documentos_de_identidad.find(doc => doc.descripcion == documentoIdentidad.cedula)?.documento;
    originalValue['rnc'] = originalSuplidor?.documentos_de_identidad.find(doc => doc.descripcion == documentoIdentidad.rnc)?.documento;
    originalValue['cuentas_contables'] = fun.deepCloning(this.entCuentaContServ.parseCuentasFromBackend(originalSuplidor?.cuentas_contables));

    return !fun.isEqual(formValue, originalValue);
  }

  test(e?) {}

  validate_cuentas() {
    return this.entCuentaContServ.validateEntidades({ configsEntCuentas: this.listaConfigSuplidores, entidad_cuentas_contables: this.listaEntidadCuentasContables });
  }

  submit() {
    if (this.configApp.has_contabilidad) {
      const entidades_validation = this.validate_cuentas();

      if (!entidades_validation.error) {
        if (!this.editando) {
          this.dynamicModalServ.confirmationModal({
            id: 'aviso_cuentas',
            texto: 'Confirme las <b class="negrita">CUENTAS CONTABLES</b>, una vez registrado el suplidor, no se podrán modificar sus <b class="negrita"> CUENTAS CONTABLES </b> ¿Desea continuar?',
            btnKind: confirmationButtons.cancelarContinuar,
            onYes: this.sendData.bind(this),
          });
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
    let formulario = this.form.getRawValue();

    const documentos_identidad = [
      { documento: formulario.cedula, descripcion: documentoIdentidad.cedula },
      { documento: formulario.rnc, descripcion: documentoIdentidad.rnc },
    ];

    documentos_identidad.map(element => {
      const doc_backend = this.documentos_de_identidad?.find(doc => doc.descripcion.toLowerCase() == element.descripcion.toLowerCase());
      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = element.descripcion === this.doc_principal ? true : false;
      return element;
    });

    formulario.documentos_de_identidad = documentos_identidad.filter(doc => fun.hasValue(doc.documento));
    formulario.estado = true;

    if (this.configApp.has_contabilidad) formulario['cuentas_contables'] = this.listaEntidadCuentasContables;

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
