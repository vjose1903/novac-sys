import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';

@Component({
  selector: 'app-modal-password-config',
  templateUrl: './modal-password-config.component.html',
  styleUrls: ['./modal-password-config.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FormErrorMsgComponent],
})
export class ModalPasswordConfigComponent implements OnInit, IDynamicModal {
  @Input() modalConfig: IModalConfiguration;
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
      this.subscribeFormChanges();
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

  subscribeFormChanges() {
    this.changeStateButton(!this.formGroup.valid);

    this.formGroup.valueChanges.subscribe(value => this.changeStateButton(!this.formGroup.valid));
  }

  changeStateButton(disable: boolean) {
    this.modalConfig.modalWrapper.changeStateButton({ modalId: this.modalConfig.id, btnId: 'aceptarBtn', disable });
  }

  btn_aceptar() {
    if (this.from === 'login') this.sharedServ.nextCanToast(true);
    let data = this.formGroup.getRawValue();

    const is_correct = fun.decryptConfigPassword(data.password);

    if (is_correct) {
      console.log('BTN-ACEPTAR');

      this.modalConfig.close({ error: false });

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
