import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { DBservice } from '../../../core/services/bdservice.service';
import _ = require('lodash');
import { map } from 'rxjs/operators';
import { ModalService } from '../../../components/modal/modal.service';

@Component({
  selector: 'app-registro-suplidores',
  templateUrl: './registro-suplidores.component.html',
  styleUrls: ['./registro-suplidores.component.scss'],
})
export class RegistroSuplidoresComponent implements OnInit {
  form: FormGroup;
  titulo = '';
  boton = '';
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  metodo;
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  rncMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  listaSuplidores;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
    },
    {
      titulo: 'Nombre',
      key: 'nombre',
    },
    {
      titulo: 'Rnc',
      key: 'documento',
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
  element: HTMLElement;
  tipoModal: string;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice, private mServ: ModalService, private router: Router) {}

  ngOnInit() {
    this.titulo = 'Registro de suplidores';
    this.boton = 'Registrar';
    this.metodo = this.route.snapshot.params['metodo'];
    // this.titulo = 'Actualizar empleado';
    // this.boton = 'Actualizar';

    this.form = this.fb.group({
      id: [null],
      nombre: [null, Validators.required],
      telefono: [null, Validators.required],
      rnc: [null, Validators.required],
      direccion: [null, Validators.required],
      email: [null, Validators.compose([Validators.pattern(/^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/)])],
    });

    this.dbServ
      .getSuplidores()
      .pipe(
        map(
          val =>
            (val = val.map(suplidor => {
              suplidor.documentos_de_identidad.map(docu => {
                if (docu.principal) {
                  suplidor.documento = docu.documento;
                }
              });
              suplidor.codigo = _.padStart(suplidor.id, 5, '0');
              return suplidor;
            })),
        ),
      )
      .subscribe(res => {
        this.listaSuplidores = JSON.parse(JSON.stringify(res));
        console.log(res);
      });
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
  atras() {
    this.router.navigateByUrl('/admin');
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  borrar() {
    this.form.reset();
    this.enfocarInput('nombre');
  }

  editarItem(item) {
    this.form.patchValue(item.ARG);
    item.ARG.documentos_de_identidad.forEach(doc => {
      if (doc.principal) {
        this.form.controls.rnc.setValue(doc.documento);
      }
    });
  }

  submit(form) {
    const obj = JSON.parse(JSON.stringify(form.value));

    const documentos_identidad = [];
    const temp_documentos_identidad = [
      { doc: obj.cedula, descripcion: 'cedula' },
      { doc: obj.rnc, descripcion: 'rnc' },
    ];

    temp_documentos_identidad.forEach(element => {
      // haciendo la estructura para mandar los documentos a la base de datos
      if (element.doc !== null && element.doc !== ' ' && element.doc !== '' && element.doc !== undefined) {
        documentos_identidad.push({
          descripcion: element.descripcion,
          documento: element.doc,
          principal: true,
        });
      }
    });
    obj.documentos_de_identidad_attributes = documentos_identidad;

    if (obj.id === null) {
      this.dbServ.createSuplidor(obj).subscribe(
        res => {
          const obj = JSON.parse(JSON.stringify(res));

          obj.documentos_de_identidad.map(docu => {
            if (docu.principal) {
              obj.documento = docu.documento;
            }
          });
          obj.codigo = _.padStart(obj.id, 5, '0');

          this.listaSuplidores = [...this.listaSuplidores, obj];

          this.form.reset();
          this.dbServ.toastSuccess('Suplidor registrado con exito.', 'Correcto');
          this.element = document.getElementById('campoNombre') as HTMLElement;
          this.element.focus();
        },
        err => {
          console.log(err);
          
          this.mostrarErrores(err.error);
        },
      );
    } else {
    }
  }

  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.dbServ.toastError(element, 'Error');
      }
    }
  }

  // =================================================================
  // MODAL
  // =================================================================

  abrirModal(arg?) {
    console.log(arg);

    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
    }
    this.tipoModal = '';
  }
}
