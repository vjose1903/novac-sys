import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ArticulosService } from '../../../core/services/articulos.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
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

  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  rncMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  PhotoData: any;
  doc_principal: any;

  element: HTMLElement;
  constructor(private artServ: ArticulosService, private dbServ: DBservice, private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit() {
    this.boton = 'Guardar';
    this.titulo = 'Registro de clientes';
    this.dbServ.getClientes().subscribe(res => {
      this.listaClientes = res;
    });

    this.form = this.fb.group({
      nombre: [null, Validators.required],
      apellido: [null, Validators.required],
      direccion: [null, Validators.required],
      sexo: ['', Validators.required],
      telefono: [null, Validators.required],
      rnc: [null],
      cedula: [null],
    });
  }
  getPhotoData(img) {
    this.PhotoData = img;
  }
  submit(arg) {
    if (this.doc_principal === undefined || this.doc_principal === null || this.doc_principal === ' ' || this.doc_principal === '') {
      this.dbServ.toastError('Debe de seleccionar un documento de identidad como principal', 'ERROR');
    } else {
    }
    const temp = arg.value;
    const documentos_identidad = [];
    const temp_documentos_identidad = [{ doc: temp.cedula, descripcion: 'cedula' }, { doc: temp.rnc, descripcion: 'rnc' }];

    temp.documentos_identidad_attributes = null;

    temp_documentos_identidad.forEach(element => {
      if (element.doc !== null && element.doc !== ' ' && element.doc !== '') {
        documentos_identidad.push({
          descripcion: element.descripcion,
          documento: element.doc,
          principal: element.descripcion === this.doc_principal ? true : false,
        });
      }
    });

    temp.documentos_de_identidad_attributes = documentos_identidad;

    if (this.PhotoData !== undefined) {
      temp.imagen_attributes = null;
      temp.imagen_attributes = this.PhotoData;
    }

    const obj = _.omit(temp, ['cedula', 'rnc']);

    console.log(obj);

    this.dbServ.createCliente(obj).subscribe(
      res => {
        this.listaClientes = [...this.listaClientes, res];

        this.form.reset();
        this.element = document.getElementById('campoNombre') as HTMLElement;
        this.element.focus();
        this.dbServ.toastSuccess('Cliente registrado con exito.', 'Correcto');
      },
      err => {
        console.log(err);
        this.mostrarErrores(err.error);
      },
    );
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
      key: 'medida', // ojo
    },
  ];
}
