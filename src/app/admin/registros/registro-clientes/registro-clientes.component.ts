import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { TablasService } from '../../components/tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { customValidators } from '../../../core/typescript/custom-validators';
import { ClienteC } from './cliente';
import { EmpleadoC } from '../registro-empleados/empleado';

@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
})
export class RegistroClientesComponent extends MixinClass implements OnInit, OnDestroy {
  boton = '';
  form: FormGroup;

  listaClientes;
  FORM: any;
  isCreando: boolean = false;
  doc_is_cedula = true;

  PhotoData: any;
  doc_principal = 'cedula';

  indexSeleccionado: any;
  vendedores;
  documentos_de_identidad: any;

  info = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Apellido', tipo: 'text', key: 'apellido' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
  ];
  botones = { titulo: true, borrar: true, editar: true };

  camposDisabled: boolean = true;
  editando: boolean = false;
  myValidators = new customValidators();
  clienteSelected;
  clienteClass = new ClienteC();
  empleadosClass = new EmpleadoC();

  constructor(private fb: FormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_cliente', is_routing: true, _lista_subs: ['decisionModal'] });
    this.boton = 'Guardar';

    this.createForm();

    this.necesarioStart();
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
      rnc: [{ value: null, disabled: false }],
      cedula: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.cedulaValidator(), this.myValidators.ValidateRayaAbajo()])],

      nombre: [{ value: null, disabled: true }, Validators.required],
      apellido: [{ value: null, disabled: true }, Validators.required],
      direccion: [{ value: null, disabled: true }, Validators.required],
      sexo: [{ value: null, disabled: true }, Validators.required],
      telefono: [{ value: null, disabled: true }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      limite_credito: [{ value: null, disabled: true }, Validators.required],
      maximo_credito: [{ value: null, disabled: true }, Validators.required],
      vendedor_id: [{ value: null, disabled: true }, Validators.required],
    });
  }

  async decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));
      const actualPagination = this.tServ.getPaginationById('lista_clientes');
      this.clienteClass.deleteOne(obj.id).then((res) => this.getClientes(actualPagination));
    }
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
    this.getVendedores();
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(this.fun.Capitalice(arg));
  }

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    if (radio) (radio as any).checked = true;

    this.changeIdent(arg == 'cedula');
    this.setDocumentoPrincipal(arg);
  }

  getVendedores() {
    const extra = { parameters: { id: true, nombreCompleto: true, filter_key: 'role', filter_value: 'V' } };
    this.empleadosClass.getAll(extra).then((res) => (this.vendedores = res['data']));
  }

  async getClientes(e) {
    const page = e.page;
    const per_page = e.per_page;
    const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: page, per_page: per_page, paginado: true } };

    this.clienteClass.getAll(extra).then((res) => {
      res['data'].map((cliente) => {
        cliente.documentos_de_identidad.map((docu) => {
          if (docu.principal) cliente.documento_identidad = docu.documento;
        });
        return cliente;
      });

      this.listaClientes = res['data'];

      const obj = { total: res['total_registros'], tabla: 'lista_clientes' };
      this.tServ.Func_total_paginas(obj);
    });
  }

  getPhotoData(img) {
    this.PhotoData = img;
  }

  editarItem(item) {
    this.indexSeleccionado = item.INDEX;
    this.documentos_de_identidad = item.ARG.documentos_de_identidad;

    this.form.patchValue(item.ARG);

    this.patchDocumentos(item.ARG.documentos_de_identidad);

    this.form.controls.maximo_credito.setValue(this.fun.formatearNumero(this.fun.redondearAdos(item.ARG.maximo_credito)));
    this.clienteSelected = this.fun.duplicarJson(item.ARG);

    this.boton = 'Editar';
    this.editando = true;
    this.changeStateCampos(true);
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
    const actual_state = this.form.controls.nombre.status;

    ['nombre', 'apellido', 'direccion', 'sexo', 'telefono', 'limite_credito', 'maximo_credito', 'vendedor_id'].forEach((campo) => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  async checkDocumento(tipo, e?) {
    if (e.key != 'Enter') {
      const documento = this.form.controls[tipo].value;

      let enable_campos = false;

      if (this.form.controls[tipo].valid) {
        if (this.editando && _.some(this.documentos_de_identidad, (doc) => doc.documento === documento)) {
          enable_campos = true;
          return;
        }

        await this.fun
          .getPersonaByDocIdentidad({ documento: this.form.controls[tipo].value, tipo: tipo })
          .then((res) => {
            if (res['data'].length) {
              const is_cliente = _.find(res['data'], (item) => item.persona_is === 'Cliente');

              if (this.fun.hasValue(is_cliente) && is_cliente.persona.estado) {
                this.fun.toastError(`${_.capitalize(tipo)} pertenece a un cliente ya existente. << ${is_cliente.persona.nombre} ${is_cliente.persona.apellido} >>`, 'ERROR');
                const documento_original = _.find(this.documentos_de_identidad, (item) => item.principal);
                this.doc_is_cedula = documento_original.descripcion == 'cedula' ? true : false;
                const otro_doc = documento_original.descripcion == 'cedula' ? 'rnc' : 'cedula';
                this.form.controls[documento_original.descripcion].setValue(documento_original.documento);
                this.form.controls[otro_doc].setValue(null);
                if (!this.editando) enable_campos = false;
                return;
              }

              // const documento = this.fun.hasValue(is_cliente) ? _.omit(is_cliente, ['persona', 'persona_is']) : _.omit(_.head(res['data']), ['persona', 'persona_is']);
              const persona = this.fun.hasValue(is_cliente) ? is_cliente.persona : _.head(res['data']).persona;

              // persona.fecha_nacimiento = this.fecha(persona.fecha_nacimiento);

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
            if (this.fun.ValidaCedula(docSinGuiones)) this.enfocarInput(campo);
          } else this.enfocarInput(campo);
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
      if (this.form.controls[this.doc_principal].value) res = false;
      else res = true;
    } else {
      res = true;
    }
    return res;
  }

  revisarPrecio(id) {
    const input = this.form.controls[id];
    this.fun.revisarPrecio(input, id).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  submit() {
    const formulario = this.form.getRawValue();

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

    if (!this.form.controls[this.doc_principal].value) {
      this.fun.toastError('Debe de ingresar el documento marcado como principal', 'ERROR');

      // paso todas las validaciones
    } else {
      formulario.documentos_de_identidad = documentos_identidad;

      if (this.PhotoData !== undefined) {
        formulario.imagen_attributes = null;
        formulario.imagen_attributes = this.PhotoData;
      }
      formulario.estado = true;

      formulario['balance'] = 0;
      formulario.maximo_credito = this.fun.desformatear(formulario.maximo_credito);

      this.clienteClass.createUpdateOne(formulario).then((res) => {
        const actualPagination = this.tServ.getPaginationById('lista_clientes');
        this.getClientes(actualPagination);
        this.borrar();
        this.enfocarInput('cedula');
      });
    }
  }

  nuevoRegistro() {
    this.isCreando = true;

    setTimeout(() => {
      this.marcarCheck('cedula');
      this.enfocarInput('cedula');
    }, 200);
  }

  borrar() {
    this.form.reset();
    this.doc_is_cedula = true;
    this.documentos_de_identidad = undefined;
    this.boton = 'Guardar';
    this.editando = false;
    this.changeStateCampos(false);
    this.clienteSelected = undefined;
    this.isCreando = true;

    setTimeout(() => {
      this.enfocarInput('cedula');
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
}
