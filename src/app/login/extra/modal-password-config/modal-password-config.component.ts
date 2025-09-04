<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ModalComponentI, ModalI } from '../../../admin/components/modal/modal-class';
import { fun } from '../../../core/services/functions.service';
import { SharedService } from '../../../core/services/shared.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
=======
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';
import { Ss } from '@core/services/singleton.service';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
>>>>>>> dev

@Component({
  selector: 'app-modal-password-config',
  templateUrl: './modal-password-config.component.html',
  styleUrls: ['./modal-password-config.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, FormErrorMsgComponent],
})
<<<<<<< HEAD
export class ModalPasswordConfigComponent extends MixinClass implements OnInit, ModalI {
  public modalComponent: ModalComponentI = {};
  inputs;
  form;
=======
export class ModalPasswordConfigComponent implements OnInit, IDynamicModal {
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;
  @Input() from: 'login' | 'layout' = 'login';
>>>>>>> dev

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

      fun.setTimeout(() => {
        resolve();
      }, 10);
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
<<<<<<< HEAD
      this.modalComponent.closeModal(this.modalComponent.id, { error: false });
=======
      console.log('BTN-ACEPTAR');
>>>>>>> dev

      this.modalConfig.close({ error: false });

      fun.setTimeout(() => {
        if (this.from === 'login') this.sharedServ.nextCanToast(false);
      }, 2000);
    } else {
      fun.toastError('Contraseña Incorrecta', 'ERROR');

      fun.setTimeout(() => {
        if (this.from === 'login') this.sharedServ.nextCanToast(false);
      }, 2000);
    }
  }
}
