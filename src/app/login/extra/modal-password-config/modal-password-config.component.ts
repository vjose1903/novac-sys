import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { IModalConfiguration, ModalI } from '../../../admin/components/modal/modal-class';
import { fun } from '../../../core/services/functions.service';
import { SharedService } from '../../../core/services/shared.service';
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

  constructor(private fb: UntypedFormBuilder, private sharedServ: SharedService) {
    super();
  }

  ngOnInit(): void {
    this.createForm();
    fun.enfocarInput('pass');
  }

  createForm() {
    this.form = this.fb.group({
      password: [null, Validators.minLength(6)],
    });
  }

  btn_aceptar() {
    this.sharedServ.nextCanToast(true);
    let data = this.form.getRawValue();

    const is_correct = fun.decryptConfigPassword(data.password);

    if (is_correct) {
      this.modal.instance.resetConfig(this.modal.component_id, { error: false });

      setTimeout(() => this.sharedServ.nextCanToast(false), 2000);
    } else {
      fun.toastError('Contraseña Incorrecta', 'ERROR');
      setTimeout(() => this.sharedServ.nextCanToast(false), 2000);
    }
  }
}
