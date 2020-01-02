import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { DBservice } from '../../core/services/bdservice.service';
import { ModalService } from '../modal/modal.service';

import * as _ from 'lodash';
import * as moment from 'moment';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {
  form: FormGroup;
  @Input() user;

  @Output() cancel = new EventEmitter<any>();

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    console.log(this.user);

    this.form = this.fb.group({
      password: [null, Validators.minLength(5)],
      confirmPassword: [null, Validators.minLength(5)],
    });
  }

  accion(arg) {
    this.cancel.emit(arg);
  }

  submit(form) {
    const objTemp = JSON.parse(JSON.stringify(form));

    if (objTemp.password === null) {
      this.dbServ.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      const obj = this.user;
      obj['password'] = this.form.controls.password.value;

      this.dbServ.updateEmpleados(obj).subscribe(
        res => {
          this.cancel.emit(false);
        },
        err => {
          this.dbServ.toastError(_.upperFirst(Object.keys(err.error.contenido)[0]) + ' ya existe.', err.error.titulo);
        },
      );
    }
  }
}
