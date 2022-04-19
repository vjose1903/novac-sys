import { Component, OnInit, Output, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { fun } from '../../../../core/services/functions.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { EmpleadoC } from '../../../registros/registro-empleados/empleado';
import { ModalI } from '../../modal/modal-class';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent extends MixinClass implements OnInit, AfterViewInit, ModalI {
  form: FormGroup;
  element: HTMLElement;
  // @Input() user;
  // @Output() cancel = new EventEmitter<any>();
  empleadoClass = new EmpleadoC();
  modal: any = {};
  inputs: any;

  constructor(private fb: FormBuilder) {
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

  btn_aceptar() {
    const objTemp = this.form.value;

    if (objTemp.password === null) {
      fun.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      const objT = this.inputs;
      const obj = _.omit(objT, ['', 'uid', 'sign_in_count', 'created_at', 'updated_at', 'documentos_de_identidad', 'documento_identidad']);
      obj['password'] = objTemp.password;
      obj['documentos_de_identidad_attributes'] = this.inputs.documentos_de_identidad;

      this.empleadoClass.createUpdateOne(obj).then(() => {
        const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
        modal.closeModal(this.modal.component_id);
        modal.getDataModal({ error: false });
      });
    }
  }
}
