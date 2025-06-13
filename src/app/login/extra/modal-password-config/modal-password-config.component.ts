import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalI } from '@components/modal/modal-class';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';

@Component({
  selector: 'app-modal-password-config',
  templateUrl: './modal-password-config.component.html',
  styleUrls: ['./modal-password-config.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FormErrorMsgComponent],
})
export class ModalPasswordConfigComponent implements OnInit, ModalI {
  @Input() modalWrapper: any = {};
  @Input() from: 'login' | 'layout' = 'login';

  formGroup: UntypedFormGroup;
  inputs: any;

  constructor(
    private fb: UntypedFormBuilder,
    private sharedServ: SharedService
  ) {}

  ngOnInit(): void {
    this.createForm().then(() => {
      fun.enfocarInput('input_password');
    });
  }

  createForm() {
    return new Promise<void>(resolve => {
      this.formGroup = this.fb.group({
        password: [null, Validators.compose([Validators.required, Validators.minLength(6)])],
      });
      
      setTimeout(() => resolve(), 10);
    });
  }

  btn_aceptar() {
    if (this.from === 'login') this.sharedServ.nextCanToast(true);
    let data = this.formGroup.getRawValue();

    const is_correct = fun.decryptConfigPassword(data.password);

    if (is_correct) {
      const modal = this.modalWrapper.instance.modalsConfig.find(config => config.id === this.modalWrapper.component_id);
      modal.closeModal(this.modalWrapper.component_id);
      modal.returnDataFromModal({ error: false });
      setTimeout(() => {
        if (this.from === 'login') this.sharedServ.nextCanToast(false);
      }, 2000);
    } else {
      fun.toastError('Contraseña Incorrecta', 'ERROR');
      setTimeout(() => {
        if (this.from === 'login') this.sharedServ.nextCanToast(false);
      }, 2000);
    }
  }
}
