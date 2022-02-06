import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { FunctionService } from '../../../core/services/functions.service';
import * as _ from 'lodash';
import { MixinClass } from '../../../core/typescript/MixinClass';

@Component({
  selector: 'app-modal-password-config',
  templateUrl: './modal-password-config.component.html',
  styleUrls: ['./modal-password-config.component.scss'],
})
export class ModalPasswordConfigComponent extends MixinClass implements OnInit {
  public modal: any = {};
  inputs;
  form;

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.createForm();
    this.enfocarInput('pass');
  }

  createForm() {
    this.form = this.fb.group({
      password: [null, Validators.minLength(6)],
    });
  }

  btn_aceptar() {
    let data = this.form.getRawValue();

    const is_correct = this.fun.decryptConfigPassword(data.password);

    if (is_correct) {
      const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
      modal.closeModal(this.modal.component_id);
      modal.getDataModal({ error: false });
      console.log('CORRECTO');
    } else {
      this.fun.toastError('Contraseña Incorrecta', 'ERROR');
    }
  }
}
