import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { parseDate, BsDatepickerConfig } from 'ngx-bootstrap';
import { PhotosService } from '../../../core/services/photos.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { DBservice } from '../../../core/services/bdservice.service';
import { map } from 'rxjs/operators';
import { ModalService } from '../../../components/modal/modal.service';
@Component({
  selector: 'app-registro-empleados',
  templateUrl: './registro-empleados.component.html',
  styleUrls: ['./registro-empleados.component.scss'],
})
export class RegistroEmpleadosComponent implements OnInit {
  form: FormGroup;
  titulo = '';
  boton = '';
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  element: HTMLElement;
  cedulaMask = [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/];

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
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
  listaEmpleados: any;
  tipoModal: string;
  indexSeleccionado: any;
  editando = false;
  usuarioSelected: any;
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice, private router: Router, private mServ: ModalService) {
    this.dpConfig = Object.assign(
      {},
      {
        // locale:'es',
        showWeekNumbers: false,
        maxDate: new Date(),
      },
    );
  }

  ngOnInit() {
    this.titulo = 'Registro de empleados';
    this.boton = 'Registrar';

    // this.titulo = 'Actualizar empleado';
    // this.boton = 'Actualizar';
    this.dbServ
      .getEmpleados()
      .pipe(
        map(
          emple =>
            (emple = emple.map(cli => {
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
        res.sort((a, b) => {
          return a.id > b.id ? 1 : -1;
        });
        this.listaEmpleados = JSON.parse(JSON.stringify(res));
      });

    this.form = this.fb.group({
      id: [null],
      nombre: [null, Validators.required],
      apellido: [null, Validators.required],
      usuario: [null, Validators.compose([Validators.required])],
      sexo: ['', Validators.required],
      cedula: [''],
      telefono: [null, Validators.required],
      email: [null, Validators.compose([Validators.pattern(/^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/)])],
      fecha_nacimiento: [null, Validators.required],
      password: [null],
      estado: [true],
      role: [null, Validators.required],
    });
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
    this.enfocarInput('campoNombre');
    this.titulo = 'Registro de empleados';
    this.boton = 'Registrar';
    this.editando = false;
  }

  fecha(a: any) {
    moment.locale('es');
    const fechaFormato = moment(a).format('MM/DD/YYYY');
    return fechaFormato;
  }

  editarItem(item) {
    this.indexSeleccionado = item.INDEX;
    const doc = item.ARG.documentos_de_identidad.filter(doc => doc.principal === true);
    if (doc) {
      this.form.controls.cedula.setValue(doc[0].documento);
    }
    item.ARG.fecha_nacimiento = this.fecha(item.ARG.fecha_nacimiento);
    this.form.patchValue(item.ARG);
    this.usuarioSelected = item.ARG;
    this.editando = true;
    this.titulo = 'Editar empleado: ' + item.ARG.nombre;
    this.boton = 'Editar';
  }

  submit(form) {
    const objTemp = JSON.parse(JSON.stringify(form));

    const documentos_identidad = [];
    const temp_documentos_identidad = [
      { doc: objTemp.cedula, descripcion: 'cedula' },
      // { doc: objTemp.rnc, descripcion: 'rnc' },
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
    objTemp.documentos_de_identidad_attributes = documentos_identidad;
    const objSend = _.omit(objTemp, ['cedula']);
    // console.log(objSend);

    if (!this.editando && objSend.password === null) {
      this.dbServ.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      if (objSend.id) {
        objSend['id'] = objSend.id;

        this.dbServ.updateEmpleados(objSend).subscribe(
          res => {
            this.dbServ.toastSuccess('Usuario Editado', 'Correcto');

            const docu = res.data.documentos_de_identidad.filter(doc => doc.principal === true);
            res.data.documento_identidad = docu[0].documento;

            this.listaEmpleados[this.indexSeleccionado] = res.data;
            this.borrar();
          },
          err => {
            this.dbServ.toastError(_.upperFirst(Object.keys(err.error.contenido)[0]) + ' ya existe.', err.error.titulo);
          },
        );
      } else {
        this.dbServ.createEmpleados(objSend).subscribe(
          res => {
            this.listaEmpleados = [...this.listaEmpleados, res];
            this.dbServ.toastSuccess('Usuario Creado', 'Correcto');
            this.form.reset();
            this.enfocarInput('campoNombre');
          },
          err => {
            this.dbServ.toastError(_.upperFirst(Object.keys(err.error.contenido)[0]) + ' ya existe.', err.error.titulo);
          },
        );
      }
    }
  }

  abrirModal(arg?) {
    console.log(arg);
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg);
    this.mServ.mostrarModal(true);
  }
  cambiarPassword(arg?) {
    this.mServ.modalTipo('password');
    this.tipoModal = 'password';
    this.mServ.ModalSeleccion(this.usuarioSelected);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
    }
    this.tipoModal = '';
  }
}
