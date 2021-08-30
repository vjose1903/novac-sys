import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';
import { ValidateRayaAbajo } from '../../../directives/validaciones';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { ModalService } from '../../components/modal/modal.service';
import { TablasService } from '../../components/tablas/tablas.service';
import { LayoutService } from '../../layout/layout.service';
import { IpcService } from '../../../core/services/ipc.service';
import { mixinClass } from '../../mixinClass';

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

  documento_identidad = true;

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
      key: 'documento_identidad', // ojo
    },
  ];
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

    this.form = this.fb.group({
      nombre: [null, Validators.required],
      id: [null],
      apellido: [null, Validators.required],
      direccion: [null, Validators.required],
      sexo: ['', Validators.required],
      telefono: [null, Validators.required],
      rnc: [null, ValidateRayaAbajo.verificarRayaAbajo],
      limite_credito: ['', Validators.required],
      maximo_credito: ['', Validators.required],
      vendedor_id: [''],
      cedula: [null, ValidateRayaAbajo.verificarRayaAbajo],
    });

    this.necesarioStart();
    setTimeout(() => this.marcarCheck('cedula'), 200);
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

  checkNumbers(arg) {
    let res = false;
    for (let i = 0; i < arg.length; i++) {
      const tempCaracter = arg.charAt(i);
      if (tempCaracter !== ',') {
        const caracter = _.parseInt(tempCaracter);
        if (_.isNaN(caracter)) {
          res = true;
        }
      }
    }
    return res;
  }

  checkLongMillares(num) {
    let res = false;
    const splitNum = _.split(num, ',');
    splitNum.forEach((element, i) => {
      if (i !== 0) {
        if (element.length !== 3) {
          res = true;
        }
      }
    });
    return res;
  }

  revisarPrecio(input, id) {
    const Input = this.form.controls[input];

    const precioTEMPO = Input.value;
    if (precioTEMPO !== null && precioTEMPO !== undefined && precioTEMPO !== '' && precioTEMPO !== ' ') {
      const splitPrecio = _.split(precioTEMPO, '.');
      let precioTEMP;
      let enteros = splitPrecio[0];
      let tempdecimales = splitPrecio[1];
      if (tempdecimales === undefined) {
        tempdecimales = '00';
      }
      //
      if (
        splitPrecio.length > 2 ||
        this.checkNumbers(enteros) ||
        this.checkLongMillares(enteros) ||
        this.checkNumbers(tempdecimales) ||
        this.checkLongMillares(tempdecimales)
      ) {
        this.dbServ.toastError('Valor introducido es invalido', 'ERROR', true);
        this.enfocarInput(id);
      } else {
        //
        if (splitPrecio.length === 2) {
          if (enteros === '' || enteros === ' ') {
            enteros = '0';
          }
          let decimales;
          if (tempdecimales.length > 2) {
            decimales = tempdecimales.substring(0, 2);
          } else {
            decimales = _.padEnd(tempdecimales, 2, '0');
          }
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        } else if (splitPrecio.length === 1) {
          const decimales = '00';
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        }
      }

      Input.setValue(GLOBAL.formatearNumero(precioTEMP));
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
    console.log('this.documentos_de_identidad ---> ', this.documentos_de_identidad);

    item.ARG.documentos_de_identidad.forEach((doc) => {
      if (doc.descripcion === 'rnc') {
        this.documento_identidad = false;
        this.form.controls.rnc.setValue(doc.documento);
      } else {
        this.documento_identidad = true;
        this.form.controls.cedula.setValue(doc.documento);
      }
      if (doc.principal) {
        this.doc_principal = doc.descripcion;
        this.marcarCheck(doc.descripcion);
      }
    });

    this.form.patchValue(item.ARG);

    this.form.controls.maximo_credito.setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(item.ARG.maximo_credito)));

    this.titulo = 'Editar cliente: ' + item.ARG.nombre;
    this.boton = 'Editar';
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

  submit(arg) {
    let devolver = false;
    let docCorrecto = false;

    const Fail = [];

    const temp = JSON.parse(JSON.stringify(arg.value));
    const documentos_identidad = [];

    const temp_documentos_identidad = [
      { doc: temp.cedula, descripcion: 'cedula' },
      { doc: temp.rnc, descripcion: 'rnc' },
    ];

    temp.documentos_identidad_attributes = null;
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
      let docSplit;
      if (this.fun.hasValue(element.doc)) {
        const doc_backend = _.find(this.documentos_de_identidad, (doc) => _.lowerCase(doc.descripcion) === _.lowerCase(element.descripcion));
        if (element.descripcion === 'cedula') {
          docSplit = _.split(element.doc, '-');

          const docSinGuiones = _.join(docSplit, '');
          if (GLOBAL.ValidaCedula(docSinGuiones)) {
            docCorrecto = true;
          }
        } else {
          docSplit = _.split(element.doc, '-');
          const docSinGuiones = _.join(docSplit, '');
          if (docSinGuiones.length === 9) {
            docCorrecto = true;
          }
        }

        documentos_identidad.push({
          id: doc_backend ? doc_backend.id : null,
          descripcion: element.descripcion,
          documento: element.doc,
          principal: element.descripcion === this.doc_principal ? true : false,
        });
      }
    });

    // entra aqui si el formato de un documento de identidad esta mal
    if (devolver) {
      Fail.forEach((doc) => {
        this.dbServ.toastError('Formato de ' + doc + ' incorrecto', 'ERROR', true);
      });
      // entra aqui si pasa la validacion de documento de identidad
    } else {
      // entra aqui si no selecciono un documento como principal
      if (!docCorrecto) {
        this.dbServ.toastError('Cedula introducida incorrecta', 'ERROR', true);
      } else {
        if (this.doc_principal === undefined || this.doc_principal === null || this.doc_principal === ' ' || this.doc_principal === '') {
          this.dbServ.toastError('Debe de seleccionar un documento de identidad como principal', 'ERROR', true);

          // paso todas las validaciones
        } else {
          temp.documentos_de_identidad = documentos_identidad;

          if (this.PhotoData !== undefined) {
            temp.imagen_attributes = null;
            temp.imagen_attributes = this.PhotoData;
          }
          temp.estado = true;

          const obj = _.omit(temp, ['cedula', 'rnc']);
          obj['balance'] = 0;
          obj.maximo_credito = GLOBAL.desformatear(obj.maximo_credito);

          this.dbServ.createUpdateClientes(obj).subscribe((res) => {
            this.getClientes(this.tServ.obj_paginate);
            this.borrar();
            this.enfocarInput('campoNombre');
          });
        }
      }
    }
  }
  atras() {}

  borrar() {
    this.form.reset();
    this.enfocarInput('campoNombre');
    this.documento_identidad = true;
    this.documentos_de_identidad = undefined;
    this.boton = 'Guardar';
    this.titulo = 'Registro de clientes';
    this.doc_principal = 'cedula';
    this.marcarCheck('cedula');
  }
  changeIdent(arg) {
    this.documento_identidad = arg;
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }
}
