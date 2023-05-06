import { fun } from './../../../../../core/services/functions.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalI } from './../../../../components/modal/modal-class';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cuentas-contables-form',
  templateUrl: './cuentas-contables-form.component.html',
  styleUrls: ['./cuentas-contables-form.component.scss'],
})
export class CuentasContablesFormComponent implements OnInit, ModalI {
  modal: any = {};
  inputs: any;

  form: UntypedFormGroup;
  fun = fun;
  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.createForm(this.inputs.data).then(() => this.escucharCambiosEnForm());
  }

  escucharCambiosEnForm() {
    let form_is_invalid = !this.form.valid;

    this.form.valueChanges.subscribe((res) => {
      if (fun.hasValue(res)) {
        form_is_invalid = !this.form.valid;
        this.disableBtnConfirm(form_is_invalid);
      }
    });

    this.disableBtnConfirm(form_is_invalid);
  }

  createForm(data?) {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [null],

        cuenta_is_control: [{ value: fun.hasValue(data) ? data.is_control : false, disabled: false }, Validators.required],
        cuenta_is_auxiliar: [{ value: fun.hasValue(data) ? !data.is_control : true, disabled: false }, Validators.required],
      });
      resolve(true);
    });
  }

  checkTypeAccount(formControlName) {
    const campo_opuesto = { cuenta_is_control: 'cuenta_is_auxiliar', cuenta_is_auxiliar: 'cuenta_is_control' };
    const actual_value = this.form.controls[formControlName].value;

    if (actual_value) {
      this.form.controls[formControlName].setValue(true);
      return;
    }

    this.form.controls[campo_opuesto[formControlName]].setValue(!this.form.controls[campo_opuesto[formControlName]].value);
  }

  getCuentaControlLabel(cuenta_control) {
    let label = `${cuenta_control?.codigo} - ${cuenta_control?.descripcion}`;

    if (fun.isEmpty(cuenta_control)) label = ' - No Aplica - ';
    return label;
  }

  disableBtnConfirm(validate) {
    const modal = this.modal.instance.modalsConfig.find((modal) => modal.id == this.modal.component_id);
    const btn = modal.botones.aceptar;

    btn.disable = validate;
  }

  btn_aceptar() {
    console.log('boton aceptar');
  }
}
