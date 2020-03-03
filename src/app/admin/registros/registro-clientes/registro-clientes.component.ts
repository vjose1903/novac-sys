import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ObservableServcie } from '../../../core/services/observables.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { ValidateRayaAbajo } from '../../../directives/validaciones';
import { ModalService } from '../../../components/modal/modal.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
})
export class RegistroClientesComponent implements OnInit, OnDestroy {
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
  doc_principal: any;

  element: HTMLElement;

  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
  indexSeleccionado: any;
  tipoModal: string;
  seleccionModal: string;
  indexBorrar: any;
  vendedores;
  subDeci: Subscription;
  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.boton = 'Guardar';
    this.titulo = 'Registro de clientes';
    this.dbServ
      .getClientes()
      .pipe(
        map(
          cliente =>
            (cliente = cliente.map(cli => {
              cli.documentos_de_identidad.map(docu => {
                if (docu.principal) {
                  cli.documento_identidad = docu.documento;
                }
              });
              return cli;
            })),
        ),
      )
      .subscribe(res => {
        this.listaClientes = res;
        this.quitarContadoDeLista();
      });

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
      cuenta: [0],
      cedula: [null, ValidateRayaAbajo.verificarRayaAbajo],
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });

    this.dbServ.getVendedores().subscribe(res => {
      this.vendedores = res;
    });
  }
  ngOnDestroy() {
    this.subDeci.unsubscribe();
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
      if (splitPrecio.length > 2 || this.checkNumbers(enteros) || this.checkLongMillares(enteros) || this.checkNumbers(tempdecimales) || this.checkLongMillares(tempdecimales)) {
        this.dbServ.toastError('Valor introducido es invalido', 'ERROR');
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
    const cliente = temp.filter(cli => cli.nombre === 'Cliente contado');
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

    item.ARG.documentos_de_identidad.forEach(doc => {
      if (doc.descripcion === 'rnc') {
        this.form.controls.rnc.setValue(doc.documento);
      } else {
        this.form.controls.cedula.setValue(doc.documento);
      }
      if (doc.principal) {
        this.doc_principal = doc.descripcion;
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
  submit(arg) {
    let devolver = false;
    let cedulaCorrecta = false;

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

    temp_documentos_identidad.forEach(element => {
      //  esto es para saber si el documento de identidad esta mal escrito
      if (this.validarRayaAbajo(element.descripcion)) {
        Fail.push(element.descripcion);
        devolver = true;
      }
      // haciendo la estructura para mandar los documentos a la base de datos
      if (element.doc !== null && element.doc !== ' ' && element.doc !== '') {
        if (element.descripcion === 'cedula') {
          const cedulaSplit = _.split(element.doc, '-');

          const cedulaSinGuiones = _.join(cedulaSplit, '');
          if (GLOBAL.ValidaCedula2(cedulaSinGuiones)) {
            cedulaCorrecta = true;
          }
        }

        documentos_identidad.push({
          descripcion: element.descripcion,
          documento: element.doc,
          principal: element.descripcion === this.doc_principal ? true : false,
        });
      }
    });
    // entra aqui si el formato de un documento de identidad esta mal
    if (devolver) {
      Fail.forEach(doc => {
        this.dbServ.toastError('Formato de ' + doc + ' incorrecto', 'ERROR');
      });
      // entra aqui si pasa la validacion de documento de identidad
    } else {
      // entra aqui si no selecciono un documento como principal
      if (!cedulaCorrecta) {
        this.dbServ.toastError('Cedula introducida incorrecta', 'ERROR');
      } else {
        if (this.doc_principal === undefined || this.doc_principal === null || this.doc_principal === ' ' || this.doc_principal === '') {
          this.dbServ.toastError('Debe de seleccionar un documento de identidad como principal', 'ERROR');

          // paso todas las validaciones
        } else {
          temp.documentos_de_identidad_attributes = documentos_identidad;

          if (this.PhotoData !== undefined) {
            temp.imagen_attributes = null;
            temp.imagen_attributes = this.PhotoData;
          }
          temp.estado = true;

          const obj = _.omit(temp, ['cedula', 'rnc']);
          obj['balance'] = 0;
          obj.maximo_credito = GLOBAL.desformatear(obj.maximo_credito);
          if (obj.id === null) {
            obj.cuenta = obj.cuenta;
            this.dbServ.createCliente(obj).subscribe(
              res => {
                const obj = JSON.parse(JSON.stringify(res));
                obj.documentos_de_identidad.map(docu => {
                  if (docu.principal) {
                    obj.documento_identidad = docu.documento;
                  }
                });
                this.listaClientes = [...this.listaClientes, obj];

                this.doc_principal = null;
                this.dbServ.toastSuccess('Cliente registrado con exito.', 'Correcto');
                this.form.reset();
                this.enfocarInput('campoNombre');
              },
              err => {
                console.log(err);
                this.mostrarErrores(err.error);
              },
            );
          } else {
            obj.cuenta = 0;
            this.dbServ.editarCliente(obj).subscribe(
              res => {
                const obj = JSON.parse(JSON.stringify(res));
                obj.documentos_de_identidad.map(docu => {
                  if (docu.principal) {
                    obj.documento_identidad = docu.documento;
                  }
                });
                this.listaClientes[this.indexSeleccionado] = obj;

                this.doc_principal = null;

                this.borrar();
              },
              err => {
                console.log(err);
                this.mostrarErrores(err.error);
              },
            );
          }
        }
      }
    }
  }
  atras() {}
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  borrar() {
    this.form.reset();
    this.enfocarInput('campoNombre');
    this.documento_identidad = true;
    this.boton = 'Guardar';
    this.titulo = 'Registro de clientes';
    this.doc_principal = '';
  }
  changeIdent(arg) {
    this.documento_identidad = arg;
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }

  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.dbServ.toastError(element, 'Error');
      }
    }
  }

  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Nombre',
      key: 'nombre',
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
  abrirModal(arg?) {
    console.log(arg);

    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.seleccionModal = arg.ARG;
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));
      obj['estado'] = false;
      obj['documentos_de_identidad_attributes'] = obj.documentos_de_identidad;
      this.dbServ.editarCliente(obj).subscribe(
        res => {
          this.dbServ.toastSuccess('Cliente ' + obj.nombre + ' borrado.', 'CORRECTO');
          _.pullAt(this.listaClientes, this.indexBorrar);
          this.tipoModal = '';
          this.decisionModal = null;
        },
        err => {
          console.log(err);
          this.mostrarErrores(err.error);
        },
      );
    }
  }
}
