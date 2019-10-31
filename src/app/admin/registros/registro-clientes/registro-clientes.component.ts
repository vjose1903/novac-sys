import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ArticulosService } from '../../../core/services/articulos.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute } from '@angular/router';

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

    temp_documentos_identidad.forEach(element => {
      if (element.doc !== null && element.doc !== ' ' && element.doc !== '') {
        documentos_identidad.push({
          descripcion: element.descripcion,
          documento: element.doc,
          principal: element.descripcion === this.doc_principal ? true : false,
        });
      }
    });

    console.log(documentos_identidad);
    temp.imagen_attributes = null;
    temp.documentos_identidad_attributes = null;
    // console.log(obj);
  }
  atras(temp) {}

  changeIdent(arg) {
    this.documento_identidad = arg;
  }

  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
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
