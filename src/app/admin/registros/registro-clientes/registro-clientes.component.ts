import { DocumentoDeIdentidadI } from './../../../core/typescript/documentos_de_identidad.utils';
import { entidadesContables } from './../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.utils';
import { EntidadCuentaContableService } from './../../contabilidad/entidad-cuenta-contable/entidad-cuenta-contable.service';
import { ConfigService } from './../../../core/services/configuration.service';
import { ConfigI } from '../../../core/typescript/config-interface';
import { CategoriaEntidadContableService } from './../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { getImgUrlServer } from '../../../core/typescript/imagen.utils';
import { customValidators } from '../../../core/typescript/custom-validators';
import { ClienteC, ClienteI } from './cliente';
import { EmpleadoC } from '../registro-empleados/empleado.utils';
import { fun } from '../../../core/services/functions.service';
import { table_config } from '../../components/new_tablas/tabla-class';
import { Permisos } from '../../../core/typescript/permisos';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../contabilidad/configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableC } from '../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.utils';
import { FormEntidadCuentaContableI } from '../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { PhotoDataI } from '../../components/img-viewer-edit/img-viewer-edit.utils';
import { IModalConfiguration } from '../../components/modal/modal-class';
import { maxSizeTypeE } from '../../../core/directive/max-sizer.directive';

@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
})
export class RegistroClientesComponent extends MixinClass implements OnInit, OnDestroy {
  botonLabel = '';
  form: UntypedFormGroup;

  listaClientes: ClienteI[] = [];
  listaConfigClientes: Array<ConfiguracionEntidadCuentaI> = [];
  listaEntidadCuentasContables: Array<FormEntidadCuentaContableI> = [];

  FORM: any;
  isCreando: boolean = false;
  doc_is_cedula = true;

  photoData: PhotoDataI;
  doc_principal = 'cedula';

  vendedores;
  documentos_de_identidad: DocumentoDeIdentidadI[];

  camposDisabled: boolean = true;
  editando: boolean = false;
  myValidators = new customValidators();
  clienteSelected: ClienteI;
  clienteClass = new ClienteC();
  empleadosClass = new EmpleadoC();
  configEntContableClass = new ConfiguracionEntidadCuentaC();
  permissions = Permisos;
  formPermissions = [Permisos.cliente.create, Permisos.cliente.update];

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
      { titulo: 'Apellido', tipo: 'text', key: 'apellido' },
      { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
      { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_clientes',
    padre_functions: { data_request: (params) => this.getClientes(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.cliente.update }, borrar: { show: true, permiso: this.permissions.cliente.destroy } },
  };
  tablaComponent;

  configApp: ConfigI = ConfigService.config;
  entidadContable: entidadesContables = CategoriaEntidadContableC.entidad.cliente;

  maxSizeTypeE = maxSizeTypeE;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService, public categoriaEntidadServ: CategoriaEntidadContableService, public entCuentaContServ: EntidadCuentaContableService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_cliente', is_routing: true });
    this.botonLabel = 'Guardar';

    this.createForm();

    this.necesarioStart();
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
      rnc: [{ value: null, disabled: false }],
      cedula: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.cedulaValidator(), this.myValidators.ValidateRayaAbajo()])],
      balance: [{ value: 0, disabled: false }],
      nombre: [{ value: null, disabled: true }, Validators.required],
      apellido: [{ value: null, disabled: true }, Validators.required],
      direccion: [{ value: null, disabled: true }, Validators.required],
      sexo: [{ value: null, disabled: true }, Validators.required],
      telefono: [{ value: null, disabled: true }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      limite_credito: [{ value: null, disabled: true }, Validators.required],
      maximo_credito: [{ value: null, disabled: true }, Validators.required],
      vendedor_id: [{ value: null, disabled: true }, Validators.required],
      img: [{ value: null, disabled: false }],
    });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  necesarioStart() {
    this.getClientes(this.tServ.obj_paginate.default);
    this.getConfigEntidadCliente();
    this.getVendedores();
  }

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    if (radio) (radio as any).checked = true;

    this.changeIdent(arg == 'cedula');
    this.setDocumentoPrincipal(arg);
  }

  getVendedores() {
    const extra = { parameters: { id: true, filter_key: 'role', filter_value: 'vendedor' } };
    this.empleadosClass.getAll(extra).then((res) => (this.vendedores = res['data']));
  }

  async getClientes(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.listaClientes.length = 0;
    this.clienteClass.getAll(extra).then((res) => {
      res['data'].map((cliente) => {
        cliente.img_cliente = getImgUrlServer(cliente?.imagen?.file_name);
        const doc = _.find(cliente.documentos_de_identidad, { principal: true });
        cliente.documento_identidad = fun.hasValue(doc) ? doc.documento : '----------';
        return cliente;
      });

      this.listaClientes = res['data'];

      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  getConfigEntidadCliente() {
    const extra = { parameters: { filter_target: CategoriaEntidadContableC.entidad.cliente } };
    this.configEntContableClass.getAll(extra).then((res) => (this.listaConfigClientes = res['data']));
  }

  getPhotoData(img: PhotoDataI) {
    this.photoData = img;
    this.form.controls.img.setValue(img.src_img);
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  editarItem(data: ClienteI) {
    this.documentos_de_identidad = data.documentos_de_identidad;

    this.form.patchValue(data);
    this.patchDocumentos(data.documentos_de_identidad);
    this.form.controls.maximo_credito.setValue(fun.roundNumberToDecimal(data.maximo_credito));

    this.listaEntidadCuentasContables = this.entCuentaContServ.parseCuentasFromBackend(data.cuentas_contables);

    this.photoData = { src_img: data?.img_cliente, id: data?.imagen?.id };
    this.form.controls.img.setValue(data.img_cliente);

    this.clienteSelected = fun.deepCloning(data);

    this.botonLabel = 'Editar';
    this.editando = true;
    this.changeStateCampos(true);
  }

  eliminarReg(regisData) {
    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar el/la cliente <b>${regisData.nombre_completo}</b>?`,
      siFunction: () => {
        const actualPagination = this.tServ.getPaginationById('lista_clientes');
        this.clienteClass.deleteOne(regisData.id).then((res) => this.getClientes(actualPagination));
      },
    };

    this.eliminarRegistro(objToSend);
  }

  patchDocumentos(documentos) {
    if (documentos.length) {
      documentos.forEach((doc) => {
        if (doc.descripcion === 'rnc') this.form.controls.rnc.setValue(doc.documento);
        else this.form.controls.cedula.setValue(doc.documento);
      });

      const doc_principal = _.find(documentos, (doc) => doc.principal);

      setTimeout(() => this.marcarCheck(doc_principal['descripcion']), 1);
    }
  }

  changeStateCampos(enable = false) {
    ['nombre', 'apellido', 'direccion', 'sexo', 'telefono', 'limite_credito', 'maximo_credito', 'vendedor_id'].forEach((campo) => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable && fun.hasValue(this.form.controls[campo])) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  async checkDocumento(tipo, e?) {
    if (e.key != 'Enter') {
      const documento = this.form.controls[tipo].value;

      let enable_campos = false;

      if (this.form.controls[tipo].valid) {
        if (this.editando && this.documentos_de_identidad.some((doc) => doc.documento === documento)) {
          enable_campos = true;
          return;
        }

        await fun
          .getPersonaByDocIdentidad({ documento: this.form.controls[tipo].value, tipo: tipo })
          .then((res) => {
            if (res['data'].length) {
              const is_cliente = _.find(res['data'], (item) => item.persona_is === 'Cliente');
              const id_anterior = this.form.getRawValue().id;

              if (fun.hasValue(is_cliente) && is_cliente?.persona?.estado) {
                fun.toastError(`${fun.capitalice(tipo)} pertenece a un cliente ya existente. << ${is_cliente.persona.nombre} ${is_cliente.persona.apellido} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }

              const persona = fun.hasValue(is_cliente) ? is_cliente?.persona : _.head(res['data']).persona;
              persona.id = id_anterior;

              const documento_persona = _.find(persona.documentos_de_identidad, (item) => item.principal);

              if (fun.hasValue(documento_persona)) {
                this.doc_is_cedula = documento_persona.descripcion == 'cedula' ? true : false;
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
          .catch((err) => {
            console.error('err ', err);
          });
      } else {
        if (!this.editando && _.endsWith(documento, '_')) {
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
        if (!_.endsWith(formulario[this.doc_principal], '_')) {
          const docSinGuiones = _.join(_.split(formulario[this.doc_principal], '-'), '');
          if (this.doc_principal == 'cedula') {
            if (fun.ValidaCedula(docSinGuiones)) fun.enfocarInput(campo);
          } else fun.enfocarInput(campo);
        }
      } else fun.enfocarInput(campo);
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.submit(), 250);
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
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['cedula', 'rnc', 'nombre', 'apellido', 'telefono', 'sexo', 'limite_credito', 'maximo_credito', 'vendedor_id', 'direccion', 'id', 'img'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);
    formValue['maximo_credito'] = fun.desformatearStNumber(formValue['maximo_credito']);
    formValue['cuentas_contables'] = fun.deepCloning(this.listaEntidadCuentasContables);

    const originalCliente = this.listaClientes.find((cliente) => cliente.id == formValue.id);
    const originalValue = fun.pick(originalCliente, pick_values);

    originalValue['img'] = originalCliente?.img_cliente;
    originalValue['cedula'] = originalCliente?.documentos_de_identidad.find((doc) => doc.descripcion == 'cedula')?.documento;
    originalValue['rnc'] = originalCliente?.documentos_de_identidad.find((doc) => doc.descripcion == 'rnc')?.documento;
    originalValue['cuentas_contables'] = fun.deepCloning(this.entCuentaContServ.parseCuentasFromBackend(originalCliente?.cuentas_contables));

    return !fun.isEqual(formValue, originalValue);
  }

  revisarPrecio(id) {
    const input = this.form.controls[id];
    fun.revisarNumber(input, id).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  validate_cuentas() {
    return this.entCuentaContServ.validateEntidades({ configsEntCuentas: this.listaConfigClientes, entidad_cuentas_contables: this.listaEntidadCuentasContables });
  }

  submit() {
    if (ConfigService.config.has_contabilidad) {
      const entidades_validation = this.validate_cuentas();

      if (!entidades_validation.error) {
        if (!this.editando) {
          const confirmationObj = {
            id: 'aviso_cuentas',
            texto: 'Confirme las <b class="negrita">CUENTAS CONTABLES</b>, una vez registrado el cliente, no se podrán modificar sus <b class="negrita"> CUENTAS CONTABLES </b> ¿Desea continuar?',
            header: 'Confirmación',
            siFunction: async (instance) => {
              this.sendData();
              instance.dismissModal(instance.id);
            },
            width: '30rem',
          };

          this.confirmationModal(confirmationObj);
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
    const formulario = this.form.getRawValue();

    const documentos_identidad = [
      { documento: formulario.cedula, descripcion: 'cedula' },
      { documento: formulario.rnc, descripcion: 'rnc' },
    ];

    documentos_identidad.map((element) => {
      const doc_backend = _.find(this.documentos_de_identidad, (doc) => doc.descripcion.toLowerCase() == element.descripcion.toLowerCase());

      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = element.descripcion === this.doc_principal ? true : false;
      return element;
    });

    formulario.documentos_de_identidad = _.filter(documentos_identidad, (doc) => fun.hasValue(doc.documento));

    if (!this.form.controls[this.doc_principal].value) {
      fun.toastError('Debe de ingresar el documento marcado como principal', 'ERROR');

      // paso todas las validaciones
    } else {
      formulario.documentos_de_identidad = documentos_identidad;

      if (fun.hasValue(this.photoData?.fileName) && fun.hasValue(this.photoData?.base_64)) {
        let idImg = Number(`${this.photoData.id}`.replaceAll('cliente-img-', ''));
        idImg = idImg > 0 ? idImg : null;

        formulario['imagenes'] = [{ file_name: this.photoData.fileName, base_64: this.photoData.src_img, id: idImg }];
      }

      formulario.estado = true;

      formulario.maximo_credito = fun.desformatearStNumber(formulario.maximo_credito);

      if (ConfigService.config.has_contabilidad) formulario['cuentas_contables'] = this.listaEntidadCuentasContables;

      const objSend = _.omit(formulario, ['img']);

      this.clienteClass.createUpdateOne(objSend).then((res) => {
        const actualPagination = this.tServ.getPaginationById('lista_clientes');
        this.getClientes(actualPagination);
        this.borrar();
        fun.enfocarInput('cedula');
      });
    }
  }

  nuevoRegistro() {
    this.isCreando = true;

    setTimeout(() => {
      this.marcarCheck('cedula');
      fun.enfocarInput('cedula');
    }, 200);
  }

  openModalCategorias() {
    this.categoriaEntidadServ.openModalCategorias({ entidad: CategoriaEntidadContableC.entidad.cliente, id_modal: 'categorias_clientes', inputs: { configsEntCuentas: this.listaConfigClientes }, openNewModal: this.openNewModal.bind(this) });
  }

  onHideModal(modalConfig: IModalConfiguration) {
    if (modalConfig.id == 'categorias_clientes') {
      this.categoriaEntidadServ.setCategoriaChange();
    }
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.form.controls.balance.setValue(0);

    [this.doc_is_cedula, this.isCreando] = Array(2).fill(true);
    [this.documentos_de_identidad, this.clienteSelected, this.photoData] = Array(3).fill(undefined);
    this.botonLabel = 'Guardar';
    this.editando = false;
    this.changeStateCampos(false);

    this.listaEntidadCuentasContables = [];

    setTimeout(() => {
      fun.enfocarInput('cedula');
      this.marcarCheck('cedula');
    }, 2);
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

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }
}
