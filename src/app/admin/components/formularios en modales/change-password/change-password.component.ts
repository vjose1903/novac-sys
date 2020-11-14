import { Component, OnInit, Output, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { DBservice } from '../../../../core/services/bdservice.service';
import { ModalService } from '../../modal/modal.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  element: HTMLElement;
  @Input() user;

  @Output() cancel = new EventEmitter<any>();

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.form = this.fb.group({
      password: [null, Validators.minLength(5)],
      confirmPassword: [null, Validators.minLength(5)],
    });
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.enfocarInput('pass');
    }, 50);
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;

    this.element.focus();
  }
  accion(arg) {
    this.cancel.emit(arg);
  }

  submit(form) {
    const objTemp = JSON.parse(JSON.stringify(form));

    if (objTemp.password === null) {
      this.dbServ.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      const objT = this.user;
      const obj = _.omit(objT, ['', 'uid', 'sign_in_count', 'created_at', 'updated_at', 'documentos_de_identidad', 'documento_identidad']);
      obj['password'] = objTemp.password;
      obj['documentos_de_identidad_attributes'] = this.user.documentos_de_identidad;

      this.dbServ.updateEmpleados(obj).subscribe(
        (res) => {
          this.cancel.emit(false);
        },
        (err) => {
          this.dbServ.toastError(_.upperFirst(Object.keys(err.error.contenido)[0]) + ' ya existe.', err.error.titulo);
        },
      );
    }
  }
}
