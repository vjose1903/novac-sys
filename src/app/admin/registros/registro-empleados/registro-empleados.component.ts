import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { parseDate, BsDatepickerConfig } from 'ngx-bootstrap';
import { PhotosService } from '../../../core/services/photos.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
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
      password: [null, Validators.required],
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
    this.enfocarInput('nombre');
  }

  editarItem(item) {
    console.log(item.ARG);

    this.form.patchValue(item.ARG);
  }

  submit(form) {
    const obj = JSON.parse(JSON.stringify(form));

    console.log(obj);

    // this.dbServ.createEmpleados(obj).subscribe(
    //   res => {
    //     this.dbServ.toastSuccess('Usuario Creado', 'Correcto');
    //   },
    //   err => {
    //     this.dbServ.toastError(_.upperFirst(Object.keys(err.error.contenido)[0]) + ' ya existe.', err.error.titulo);
    //   },
    // );
  }

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
