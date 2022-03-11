import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { ModalI } from '../../../admin/components/new_modal/modal-class';
import { MixinClass } from '../../../core/typescript/MixinClass';

@Component({
  selector: 'app-modal-password-config',
  templateUrl: './modal-password-config.component.html',
  styleUrls: ['./modal-password-config.component.scss'],
})
export class ModalPasswordConfigComponent extends MixinClass implements OnInit, ModalI {
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
    this.fun.nextCanToast(true);
    let data = this.form.getRawValue();

    const is_correct = this.fun.decryptConfigPassword(data.password);

    if (is_correct) {
      const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
      modal.closeModal(this.modal.component_id);
      modal.getDataModal({ error: false });
      
      setTimeout(() => this.fun.nextCanToast(false), 2000);
    } else {
      this.fun.toastError('Contraseña Incorrecta', 'ERROR');
      setTimeout(() => this.fun.nextCanToast(false), 2000);
    }
  }
}
