import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';

import { GLOBAL } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { ModalService } from '../../components/modal/modal.service';
import { TablasService } from '../../components/tablas/tablas.service';
import { LayoutService } from '../../layout/layout.service';
import { IpcService } from '../../../core/services/ipc.service';
import { mixinClass } from '../../mixinClass';
import { customValidators } from '../../../core/typescript/custom-validators';

@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
})
export class RegistroClientesComponent extends mixinClass implements OnInit, OnDestroy {
  titulo = '';
  boton = '';
  form: FormGroup;
  detallableArray: FormArray;
  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaClientes;
  FORM: any;
  listaTipoArticulos: any;

  doc_is_cedula = true;

  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  rncMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  PhotoData: any;
  doc_principal = 'cedula';

  element: HTMLElement;

  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
  indexSeleccionado: any;
  vendedores;
  documentos_de_identidad: any;

  info = [
    {
      titulo: 'Nombre',
      key: 'nombre',
    },
    {
      titulo: 'Apellido',
      key: 'apellido',
    },
    {
      titulo: 'Telefono',
      key: 'telefono',
    },
    {
      titulo: 'Doc. identidad',
      key: 'documento_identidad',
      estilos: [{ padding: '0.6rem 0rem' }],
    },
  ];
  camposDisabled: boolean = true;
  editando: boolean = false;
  myValidators = new customValidators();

  constructor(
    private dbServ: DBservice,
    private fb: FormBuilder,

    public layServ: LayoutService,
    public _ipc: IpcService,
    public mServ: ModalService,
    private tServ: TablasService,
  ) {
    super(mServ, _ipc, layServ);
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_cliente', _lista_subs: ['decisionModal'] });
    this.boton = 'Guardar';
    this.titulo = 'Registro de clientes';

    this.createForm();

    this.necesarioStart();
    setTimeout(() => {
      this.marcarCheck('cedula');
      this.enfocarInput('cedula');
    }, 200);
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
      vendedor_id: [{ value: null, disabled: true }],
    });
  }

  async decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));
      try {
        const res = await this.dbServ.deleteCliente(obj).toPromise();
        this.getClientes(this.tServ.obj_paginate);
      } catch (error) {}
    }
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  necesarioStart() {
    this.getClientes(this.tServ.obj_paginate);
    this.getVendedores();
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }

  marcarCheck(arg) {
    const radio = document.getElementById('identificacion-' + arg) as HTMLElement;
    (radio as any).checked = true;
  }

  getVendedores() {
    this.dbServ.getEmpleados('?id=true&nombreCompleto=true&filter_key=role&filter_value=V').subscribe((res) => (this.vendedores = res['data']));
  }

  async getClientes(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getClientesFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

      res['data'].map((cliente) => {
        cliente.documentos_de_identidad.map((docu) => {
          if (docu.principal) {
            cliente.documento_identidad = docu.documento;
          }
        });
        return cliente;
      });

      this.listaClientes = res.data;

      const obj = {
        total: res.total_registros,
        tabla: 'listaClientes',
      };
      this.tServ.Func_total_paginas(obj);
      this.quitarContadoDeLista();
    } catch (error) {
      this.dbServ.toastError('Error buscando clientes registrados.', 'ERROR', true);
    }
  }

  quitarContadoDeLista() {
    const temp = JSON.parse(JSON.stringify(this.listaClientes));
    this.listaClientes = [];
    const cliente = temp.filter((cli) => cli.nombre === 'Cliente contado');
    const index = _.indexOf(temp, cliente[0]);

    _.pullAt(temp, index);
    this.listaClientes = temp;
  }

  Filtro(filtro: any) {
    return filtro.id !== 1;
  }

  getPhotoData(img) {
    this.PhotoData = img;
  }

  editarItem(item) {
    this.indexSeleccionado = item.INDEX;
    this.documentos_de_identidad = item.ARG.documentos_de_identidad;

    this.form.patchValue(item.ARG);

    this.patchDocumentos(item.ARG.documentos_de_identidad);

    this.form.controls.maximo_credito.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(item.ARG.maximo_credito)));

    this.titulo = 'Editar cliente: ' + item.ARG.nombre;
    this.boton = 'Editar';
    this.editando = true;
  }

  patchDocumentos(documentos) {
    documentos.forEach((doc) => {
      if (doc.descripcion === 'rnc') this.form.controls.rnc.setValue(doc.documento);
      else this.form.controls.cedula.setValue(doc.documento);
    });

    const doc_principal = _.find(documentos, (doc) => doc.principal);
    this.changeIdent(doc_principal['descripcion'] === 'cedula');
    this.doc_principal = doc_principal['descripcion'];
    this.marcarCheck(doc_principal['descripcion']);
  }

  changeStateCampos(enable = false) {
    const actual_state = this.form.controls.nombre.status;

    console.log('actual_state: ', actual_state);
    ['nombre', 'apellido', 'direccion', 'sexo', 'telefono', 'limite_credito', 'maximo_credito', 'vendedor_id'].forEach((campo) => {
      enable ? this.form.controls[campo].enable() : this.form.controls[campo].disable();
      if (!enable) this.form.controls[campo].reset();

      this.camposDisabled = !enable;
    });
  }

  async checkDocumento(tipo, e?) {
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

            console.log('is_cliente --> ', is_cliente);
            console.log("res['data'] --> ", res['data']);

            if (this.fun.hasValue(is_cliente) && is_cliente.persona.estado) {
              this.fun.toastError(
                `${_.capitalize(tipo)} pertenece a un cliente ya existente. << ${is_cliente.persona.nombre} ${is_cliente.persona.apellido} >>`,
                'ERROR',
                true,
              );
              this.changeStateCampos(false);
              // this.camposDisabled = false;
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

      console.log('this.form ', this.form.getRawValue());
    } else {
      console.log("_.endsWith(cedula, '_') --> ", _.endsWith(documento, '_'));

      if (!_.endsWith(documento, '_')) {
        this.documentos_de_identidad = undefined;
        // this.camposDisabled = true;
        this.changeStateCampos(false);
      }
    }
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

  revisarPrecio(id) {
    const input = this.form.controls[id];
    this.fun.revisarPrecio(input, id);
  }

  submit(arg) {
    const obj = JSON.parse(JSON.stringify(arg.value));

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

    if (!this.form.controls[this.doc_principal].value) {
      this.dbServ.toastError('Debe de ingresar el documento marcado como principal', 'ERROR', true);

      // paso todas las validaciones
    } else {
      obj.documentos_de_identidad = documentos_identidad;

      if (this.PhotoData !== undefined) {
        obj.imagen_attributes = null;
        obj.imagen_attributes = this.PhotoData;
      }
      obj.estado = true;

      obj['balance'] = 0;
      obj.maximo_credito = GLOBAL.desformatear(obj.maximo_credito);

      this.dbServ.createUpdateClientes(obj).subscribe((res) => {
        this.getClientes(this.tServ.obj_paginate);
        this.borrar();
        this.enfocarInput('cedula');
      });
    }
  }

  borrar() {
    this.form.reset();
    this.enfocarInput('cedula');
    this.doc_is_cedula = true;
    this.documentos_de_identidad = undefined;
    this.boton = 'Guardar';
    this.titulo = 'Registro de clientes';
    this.doc_principal = 'cedula';
    this.editando = false;
    this.marcarCheck('cedula');
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
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }
}
