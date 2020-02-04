import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { ModalService } from '../../../components/modal/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registro-suplidores',
  templateUrl: './registro-suplidores.component.html',
  styleUrls: ['./registro-suplidores.component.scss'],
})
export class RegistroSuplidoresComponent implements OnInit, OnDestroy {
  form: FormGroup;
  titulo = '';
  boton = '';
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  metodo;
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  rncMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];
  listaSuplidores;
  subDeci: Subscription;
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
  documento_identidad = false;
  doc_principal: any;
  indexSelected: any;
  seleccionModal: any;
  indexBorrar: any;

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
      rnc: [null],
      cedula: [null],
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
        res.sort((a, b) => {
          return a.id > b.id ? 1 : -1;
        });
        this.listaSuplidores = JSON.parse(JSON.stringify(res));
      });
    this.subDeci = this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
  }
  ngOnDestroy(): void {
    this.subDeci.unsubscribe();
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
    this.titulo = 'Registro de suplidores';
    this.boton = 'Registrar';
    this.enfocarInput('campoNombre');
    this.documento_identidad = false;
    this.doc_principal = '';
  }
  changeIdent(arg) {
    this.documento_identidad = arg;
  }
  setDocumentoPrincipal(doc) {
    this.doc_principal = doc;
  }
  editarItem(item) {
    this.indexSelected = item.INDEX;
    this.titulo = 'Editar suplidor: ' + item.ARG.nombre;
    this.boton = 'Editar';
    this.form.patchValue(item.ARG);
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
  }

  submit(form) {
    const obj = JSON.parse(JSON.stringify(form.value));
    let devolver = false;

    const Fail = [];
    const documentos_identidad = [];
    const temp_documentos_identidad = [
      { doc: obj.cedula, descripcion: 'cedula' },
      { doc: obj.rnc, descripcion: 'rnc' },
    ];
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
    obj.documentos_de_identidad_attributes = documentos_identidad;
    obj.estado = true;
    // entra aqui si el formato de un documento de identidad esta mal
    if (devolver) {
      Fail.forEach(doc => {
        this.dbServ.toastError('Formato de ' + doc + ' incorrecto', 'ERROR');
      });
      // entra aqui si pasa la validacion de documento de identidad
    } else {
      if (this.doc_principal === undefined || this.doc_principal === null || this.doc_principal === ' ' || this.doc_principal === '') {
        this.dbServ.toastError('Debe de seleccionar un documento de identidad como principal', 'ERROR');

        // paso todas las validaciones
      } else {
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
              this.dbServ.toastSuccess('Suplidor registrado con exito.', 'Correcto');
              this.borrar();
            },
            err => {
              console.log(err);

              this.mostrarErrores(err.error);
            },
          );
        } else {
          this.dbServ.editarSuplidor(obj).subscribe(
            res => {
              const obj = JSON.parse(JSON.stringify(res));
              obj.documentos_de_identidad.map(docu => {
                if (docu.principal) {
                  obj.documento = docu.documento;
                }
              });
              obj.codigo = _.padStart(obj.id, 5, '0');

              this.listaSuplidores[this.indexSelected] = obj;

              this.dbServ.toastSuccess('Suplidor editado con exito.', 'Correcto');
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
    this.seleccionModal = arg.ARG;
    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
      const obj = JSON.parse(JSON.stringify(this.seleccionModal));
      obj['estado'] = false;
      obj['documentos_de_identidad_attributes'] = obj.documentos_de_identidad;
      this.dbServ.editarSuplidor(obj).subscribe(
        res => {
          this.dbServ.toastSuccess('Empleado ' + obj.nombre + ' borrado.', 'CORRECTO');
          _.pullAt(this.listaSuplidores, this.indexBorrar);
          this.tipoModal = '';
          this.indexBorrar = -1;
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
