import { Component, OnInit, OnDestroy, inject, resource, computed, signal } from '@angular/core';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { customValidators } from '@core/typescript/custom-validators';
import { ClienteC } from './cliente';
import { EmpleadoCatalogService } from '../registro-empleados/services/empleado-catalog.service';
import { ProvinciaC } from '../../../core/typescript/classes/provincia.model';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { Permisos } from '../../../core/typescript/permisos';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DgiiConsultarPersonaService } from '@core/services/dgii-consultar-persona.service';
@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
  standalone: false,
})
export class RegistroClientesComponent extends MixinClass implements OnInit, OnDestroy {
  boton = '';
  form: UntypedFormGroup;

  listaClientes: any;
  FORM: any;
  isCreando: boolean = false;
  doc_is_cedula = true;

  PhotoData: any;
  doc_principal = 'cedula';

  vendedores;
  documentos_de_identidad: any;

  camposDisabled: boolean = true;
  editando: boolean = false;
  myValidators = new customValidators();
  clienteSelected;
  clienteClass = new ClienteC();
  provinciaClass = new ProvinciaC();
  clienteSortFields = ['nombre', 'apellido'];
  fun = fun;
  permissions = Permisos;
  formPermissions = [Permisos.cliente.create, Permisos.cliente.update];

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'text', key: 'nombre', sort: { key: 'nombre', order: null } },
      { titulo: 'Apellido', tipo: 'text', key: 'apellido', sort: { key: 'apellido', order: null } },
      { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
      { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_clientes',
    padre_functions: { data_request: params => this.getClientes(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.cliente.update }, borrar: { show: true, permiso: this.permissions.cliente.destroy } },
  };
  tablaComponent;

  provincia_id = signal<number | null>(null);
  documento_identidad = signal<string | null>(null);
  private documentoEnConsulta: string | null = null;
  private ultimaConsultaDocumento: string | null = null;
  private ultimaConsultaAt = 0;

  readonly provincias = resource({
    loader: () => {
      return this.provinciaClass.getAllProvincias();
    },
  });

  readonly municipios = computed(() => {
    if (this.provincias.value() == undefined || fun.isEmpty(this.provincia_id())) return [];

    const municipios = this.provincias.value().find(prov => {
      return prov.id == this.provincia_id();
    }).municipios;

    return municipios;
  });

  public htmlServ = inject(HtmlElementsService);
  public dynamicModalServ = inject(DynamicModalService);
  private dgiiConsultarPersonaServ = inject(DgiiConsultarPersonaService);
  private empleadoCatalogServ = inject(EmpleadoCatalogService);
  private fb = inject(UntypedFormBuilder);
  private tServ = inject(TablasService);

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_cliente', is_routing: true });
    this.boton = 'Guardar';

    this.createForm().then(() => {
      this.watchChanges();
    });

    this.necesarioStart();
  }

  createForm() {
    return new Promise<void>(resolve => {
      this.form = this.fb.group({
        id: [null],
        rnc: [{ value: null, disabled: false }],
        cedula: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.cedulaValidator(), this.myValidators.ValidateRayaAbajo()])],

        nombre: [{ value: null, disabled: true }, Validators.required],
        apellido: [{ value: null, disabled: true }, Validators.required],
        direccion: [{ value: null, disabled: true }, Validators.required],
        sexo: [{ value: null, disabled: true }, Validators.required],
        telefono: [{ value: null, disabled: true }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
        limite_credito: [{ value: 30, disabled: true }, Validators.required],
        maximo_credito: [{ value: null, disabled: true }, Validators.required],
        vendedor_id: [{ value: null, disabled: true }, Validators.required],
        provincia_id: [{ value: null, disabled: true }],
        municipio_id: [{ value: null, disabled: true }, Validators.required],
      });

      // this.form.valueChanges.subscribe(val => {
      //   p(' ');
      //   console.log('val ', val);
      //   console.log('this.form ', this.form);
      // });

      resolve();
    });
  }

  watchChanges() {
    this.form.controls.provincia_id.valueChanges.subscribe(prov => {
      this.provincia_id.set(prov);

      const func = fun.hasValue(prov) ? 'enable' : 'disable';
      this.form.controls.municipio_id[func]();
    });

    this.form.valueChanges.subscribe(val => {
      this.documento_identidad.set(val.cedula || val.rnc);
    });
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  necesarioStart() {
    this.getClientes(this.tServ.obj_paginate.default);
    this.getVendedores();
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.capitalice(arg));
  }

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    if (radio) (radio as any).checked = true;

    this.changeIdent(arg == 'cedula');
    this.setDocumentoPrincipal(arg);
  }

  async getVendedores() {
    this.vendedores = await this.empleadoCatalogServ.getVendedores({ force: true });
    if (this.vendedores.length) this.form.controls.vendedor_id.setValue(this.vendedores[0].id);
  }

  async getClientes(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const sort = this.getClientesSortParams();

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true, ...sort } };

    this.clienteClass.getAll(extra).then(res => {
      res['data'].map(cliente => {
        const doc = cliente.documentos_de_identidad.find(doc => doc.principal);
        cliente.documento_identidad = fun.hasValue(doc) ? doc.documento : '----------';
        return cliente;
      });

      this.listaClientes = res['data'];

      this.table_config.total_count = res.total_registros;
      this.tablaComponent?.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  getClientesSortParams() {
    const sort = this.tServ.parseSort(this.table_config);
    if (!fun.hasValue(sort.order_by)) return {};

    const orderBy = sort.order_by
      .split(',')
      .map(item => {
        const [campo, direccion = 'asc'] = item.split(':');
        if (!this.clienteSortFields.includes(campo)) return null;
        return `${campo}:${direccion == 'desc' ? 'desc' : 'asc'}`;
      })
      .filter(item => fun.hasValue(item));

    if (orderBy.length == 1 && orderBy[0].startsWith('nombre:')) orderBy.push('apellido:asc');
    if (orderBy.length == 1 && orderBy[0].startsWith('apellido:')) orderBy.push('nombre:asc');

    return orderBy.length ? { order_by: orderBy.join(',') } : {};
  }

  getPhotoData(img) {
    this.PhotoData = img;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  editarItem(data) {
    this.documentos_de_identidad = data.documentos_de_identidad ?? [];

    this.form.patchValue(data);

    this.patchDocumentos(data.documentos_de_identidad);

    this.form.controls.maximo_credito.setValue(fun.roundNumberToDecimal(data.maximo_credito));
    this.clienteSelected = fun.deepCloning(data);

    this.boton = 'Editar';
    this.editando = true;
    this.changeStateCampos(true);
  }

  eliminarReg(regisData) {
    const onYes = () => {
      const actualPagination = this.tServ.getPaginationById('lista_clientes');
      this.clienteClass.deleteOne(regisData.id).then(res => this.getClientes(actualPagination));
    };

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: `¿Está seguro que desea eliminar el/la cliente <b>${regisData.nombre_completo}</b>?`,
      btnKind: confirmationButtons.cancelarEliminar,
      onYes: onYes.bind(this),
    });
  }

  patchDocumentos(documentos) {
    if (documentos.length) {
      documentos.forEach(doc => {
        if (doc.descripcion === 'rnc') this.form.controls.rnc.setValue(doc.documento);
        else this.form.controls.cedula.setValue(doc.documento);
      });

      const doc_principal = documentos.find(doc => doc.principal);

      fun.setTimeout(() => {
        this.marcarCheck(doc_principal.descripcion);
      }, 1);
    }
  }

  changeStateCampos(enable = false) {
    ['nombre', 'apellido', 'direccion', 'sexo', 'telefono', 'limite_credito', 'maximo_credito', 'vendedor_id', 'provincia_id', 'municipio_id'].forEach(campo => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable && fun.hasValue(this.form.controls[campo])) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });

    const func = fun.hasValue(this.form.controls.provincia_id.value) ? 'enable' : 'disable';
    this.form.controls.municipio_id[func]();
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
            .then(async (res: any) => {
            if (res['data'].length) {
              const is_cliente = res.data.find(item => item.persona_is.toLowerCase() == 'cliente');
              const id_anterior = this.form.getRawValue().id;

              if (fun.hasValue(is_cliente) && is_cliente?.persona?.estado) {
                fun.toastError(`${fun.capitalice(tipo)} pertenece a un cliente ya existente. << ${is_cliente.persona.nombre} ${is_cliente.persona.apellido} >>`, 'ERROR');
                if (!this.editando) enable_campos = false;
                return;
              }

              const persona = fun.hasValue(is_cliente) ? is_cliente?.persona : res['data'][0].persona;
              persona.id = id_anterior;

              const documento_persona = persona.documentos_de_identidad.find(item => item.principal);

              if (fun.hasValue(documento_persona)) {
                this.doc_is_cedula = documento_persona.descripcion == 'cedula' ? true : false;
                this.form.controls[documento_persona.descripcion].setValue(documento_persona.documento);
              }

              const default_values = this.getFormDefaultValues();
              this.form.patchValue({ ...persona, ...default_values });

              this.patchDocumentos(persona.documentos_de_identidad);

              if (this.camposDisabled) enable_campos = true;

              this.documentos_de_identidad = persona.documentos_de_identidad ?? [];
            } else {
              const dgiiPersona = await this.dgiiConsultarPersonaServ.consultarPersona(documento);

              if (dgiiPersona) {
                this.form.controls.nombre.setValue(dgiiPersona.nombre);
                this.form.controls.apellido.setValue(dgiiPersona.apellido);
              } else {
                this.form.controls.nombre.reset();
                this.form.controls.apellido.reset();
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
        if (!this.editando && documento?.endsWith('_')) {
          this.documentos_de_identidad = [];
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
        const documentoPrincipal = formulario[this.doc_principal] ?? '';

        if (!documentoPrincipal.endsWith('_')) {
          const docSinGuiones = documentoPrincipal.split('-').join('');
          if (this.doc_principal == 'cedula') {
            if (fun.ValidaCedula(docSinGuiones)) fun.enfocarInput(campo);
          } else fun.enfocarInput(campo);
        }
      } else if (campo == 'municipio_select') {
        if (fun.hasValue(formulario.provincia_id)) fun.enfocarInput(campo);
      } else fun.enfocarInput(campo);
    } else if (campo == 'campoDir') {
      if (fun.hasValue(formulario.municipio_id)) fun.enfocarInput(campo);
    } else {
      if (!this.formIsInvalid()) {
        fun.setTimeout(() => this.submit(), 250);
      }
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

  revisarPrecio(id) {
    const input = this.form.controls[id];
    fun.revisarNumber(input, id).then(res => {
      if (!res.error) input.setValue(res.number);
    });
  }

  p() {}

  submit() {
    const formulario = this.form.getRawValue();

    const documentos_identidad = [
      { documento: formulario.cedula, descripcion: 'cedula' },
      { documento: formulario.rnc, descripcion: 'rnc' },
    ];

    const documentos_registrados = this.documentos_de_identidad ?? [];
    documentos_identidad.map(element => {
      const doc_backend = documentos_registrados.find(doc => doc.descripcion.toLowerCase() == element.descripcion.toLowerCase());

      element['id'] = doc_backend ? doc_backend.id : null;
      element['principal'] = element.descripcion === this.doc_principal ? true : false;
      return element;
    });

    formulario.documentos_de_identidad = documentos_identidad.filter(doc => fun.hasValue(doc.documento));

    if (!this.form.controls[this.doc_principal].value) {
      fun.toastError('Debe de ingresar el documento marcado como principal', 'ERROR');
    } else {
      // paso todas las validaciones
      formulario.documentos_de_identidad = documentos_identidad;

      if (this.PhotoData !== undefined) {
        formulario.imagen_attributes = this.PhotoData;
      }

      formulario.estado = true;

      formulario['balance'] = 0;
      formulario.maximo_credito = fun.desformatearStNumber(formulario.maximo_credito);

      this.clienteClass.createUpdateOne(formulario).then(res => {
        const actualPagination = this.tServ.getPaginationById('lista_clientes');
        this.getClientes(actualPagination);
        this.borrar();
        fun.enfocarInput('cedula');
      });
    }
  }

  nuevoRegistro() {
    this.isCreando = true;

    fun.setTimeout(() => {
      this.marcarCheck('cedula');
      fun.enfocarInput('cedula');
    }, 200);
  }

  getFormDefaultValues() {
    return { limite_credito: 30, vendedor_id: this.vendedores[0].id };
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.doc_is_cedula = true;
    this.documentos_de_identidad = [];
    this.boton = 'Guardar';
    this.editando = false;
    this.changeStateCampos(false);
    this.clienteSelected = undefined;
    this.isCreando = true;

    // valores por defecto formulario
    const default_values = this.getFormDefaultValues();

    this.form.patchValue(default_values);

    fun.setTimeout(() => {
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
function Signal<T>(arg0: null) {
  throw new Error('Function not implemented.');
}
