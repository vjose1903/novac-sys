import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ObservableServcie } from '../../../core/services/observables.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { ValidateRayaAbajo } from '../../../directives/validaciones';

@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
})
export class RegistroClientesComponent implements OnInit {
  titulo = '';
  boton = '';
  form: FormGroup;
  detallableArray: FormArray;
  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaClientes = [];
  FORM: any;
  listaTipoArticulos: any;

  documento_identidad = true;

  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  rncMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  PhotoData: any;
  doc_principal: any;

  element: HTMLElement;
  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private route: ActivatedRoute) {}

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
      apellido: [null, Validators.required],
      direccion: [null, Validators.required],
      sexo: ['', Validators.required],
      telefono: [null, Validators.required],
      rnc: [null, ValidateRayaAbajo.verificarRayaAbajo],
      limite_credito: ['', Validators.required],
      cedula: [null, ValidateRayaAbajo.verificarRayaAbajo],
    });
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
      if (this.doc_principal === undefined || this.doc_principal === null || this.doc_principal === ' ' || this.doc_principal === '') {
        this.dbServ.toastError('Debe de seleccionar un documento de identidad como principal', 'ERROR');

        // paso todas las validaciones
      } else {
        temp.documentos_de_identidad_attributes = documentos_identidad;

        if (this.PhotoData !== undefined) {
          temp.imagen_attributes = null;
          temp.imagen_attributes = this.PhotoData;
        }

        const obj = _.omit(temp, ['cedula', 'rnc']);

        this.dbServ.createCliente(obj).subscribe(
          res => {
            const obj = JSON.parse(JSON.stringify(res));
            obj.documentos_de_identidad.map(docu => {
              if (docu.principal) {
                obj.documento_identidad = docu.documento;
              }
            });
            this.listaClientes = [...this.listaClientes, obj];

            this.form.reset();
            this.doc_principal = null;
            this.dbServ.toastSuccess('Cliente registrado con exito.', 'Correcto');
            this.element = document.getElementById('campoNombre') as HTMLElement;
            this.element.focus();
          },
          err => {
            console.log(err);
            this.mostrarErrores(err.error);
          },
        );
      }
    }
  }
  atras(temp) {}

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
}
