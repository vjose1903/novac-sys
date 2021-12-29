import { Component, OnInit, Output, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { DBservice } from '../../../../core/services/bdservice.service';
import { mixinClass } from '../../../mixinClass';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent extends mixinClass implements OnInit, AfterViewInit {
  form: FormGroup;
  element: HTMLElement;
  @Input() user;

  @Output() cancel = new EventEmitter<any>();

  constructor(private fb: FormBuilder, private dbServ: DBservice) {
    super();
  }

  ngOnInit() {
    this.form = this.fb.group({
      password: [null, Validators.minLength(6)],
      confirmPassword: [null, Validators.minLength(6)],
    });
  }
  ngAfterViewInit() {
    setTimeout(() => this.enfocarInput('pass'), 50);
  }

  accion(arg) {
    this.cancel.emit(arg);
  }

  submit(form) {
    const objTemp = form.value;

    if (objTemp.password === null) {
      this.fun.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      const objT = this.user;
      const obj = _.omit(objT, ['', 'uid', 'sign_in_count', 'created_at', 'updated_at', 'documentos_de_identidad', 'documento_identidad']);
      obj['password'] = objTemp.password;
      obj['documentos_de_identidad_attributes'] = this.user.documentos_de_identidad;

      this.dbServ.createUpdateEmpleados(obj).subscribe((res) => this.cancel.emit(false));
    }
  }
}
