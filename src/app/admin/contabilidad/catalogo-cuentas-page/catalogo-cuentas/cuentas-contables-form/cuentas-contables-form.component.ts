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
  inputs: { data: any; dataOriginal: any; method: 'edit' | 'add'; cuenta_control: any };

  form: UntypedFormGroup;
  fun = fun;

  origenList = [
    { value: 'D', label: 'Débito' },
    { value: 'C', label: 'Crédito' },
  ];

  tipoList = [
    { value: 'R', label: 'Real' },
    { value: 'N', label: 'Nominal' },
  ];

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.createForm(this.inputs.data).then(() => this.escucharCambiosEnForm());
    this.disableSelects();
  }

  escucharCambiosEnForm() {
    let form_is_invalid = !this.form.valid;

    this.form.valueChanges.subscribe((res) => {
      if (fun.hasValue(res)) {
        form_is_invalid = !this.form.valid;

        const something_is_different = this.checkIfSomethingIsDiferrent();

        this.disableBtnConfirm(form_is_invalid || (!form_is_invalid && !something_is_different));
      }
    });

    const something_is_different = this.checkIfSomethingIsDiferrent();

    this.disableBtnConfirm(form_is_invalid || (!form_is_invalid && !something_is_different));
  }

  checkIfSomethingIsDiferrent() {
    const formValue = this.parseData(this.form.getRawValue());
    const originalValue = this.parseData(this.inputs.dataOriginal);
    originalValue['origen'] = this.getValueOrigenOrTipo(originalValue.origen);
    originalValue['tipo'] = this.getValueOrigenOrTipo(originalValue.tipo);

    return !fun.isEqual(formValue, originalValue);
  }

  createForm(data?) {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: fun.hasValue(data) ? (this.inputs.method == 'edit' ? data.id : null) : null, disabled: false }],
        grupo_cuenta_id: [{ value: data.grupo_cuenta_id, disabled: false }],
        cuenta_control_id: [{ value: data.cuenta_control_id, disabled: false }],

        cuenta_is_control: [{ value: fun.hasValue(data) ? (this.inputs.method == 'edit' ? data.is_control : false) : false, disabled: false }, Validators.required],
        cuenta_is_auxiliar: [{ value: fun.hasValue(data) ? (this.inputs.method == 'edit' ? !data.is_control : true) : true, disabled: false }, Validators.required],
        descripcion: [{ value: fun.hasValue(data) ? (this.inputs.method == 'edit' ? data.descripcion : '') : '', disabled: false }, Validators.required],
        codigo: [{ value: fun.hasValue(data) ? (this.inputs.method == 'edit' ? data.codigo : '') : '', disabled: true }],
        origen: [{ value: fun.hasValue(data) ? this.getValueOrigenOrTipo(data.origen) : '', disabled: false }, Validators.required],
        tipo: [{ value: fun.hasValue(data) ? this.getValueOrigenOrTipo(data.tipo) : '', disabled: false }, Validators.required],
      });
      resolve(true);
    });
  }

  getValueOrigenOrTipo(value) {
    const objValues = { débito: 'D', debito: 'D', crédito: 'C', credito: 'C', real: 'R', nominal: 'N' };
    return objValues[value.toLowerCase()];
  }

  checkTypeAccount(formControlName) {
    const campo_opuesto = { cuenta_is_control: 'cuenta_is_auxiliar', cuenta_is_auxiliar: 'cuenta_is_control' };
    const actual_value = this.form.controls[formControlName].value;

    if (actual_value) {
      this.form.controls[formControlName].setValue(true);
      return;
    }

    this.form.controls[campo_opuesto[formControlName]].setValue(!this.form.controls[campo_opuesto[formControlName]].value);

    this.disableSelects();
  }

  saltar(sali_de) {
    if (sali_de != 'send') {
    } else {
    }
  }

  getCuentaControlLabel(cuenta_control) {
    let label = `${cuenta_control?.codigo} - ${cuenta_control?.descripcion}`;

    if (fun.isEmpty(cuenta_control)) label = ' - No Aplica - ';
    return label;
  }

  disableSelects() {
    setTimeout(() => {
      const formValue = this.form.getRawValue();
      const selects = ['origen', 'tipo'];

      selects.forEach((select) => {
        formValue.cuenta_is_control ? this.form.controls[select].enable() : this.form.controls[select].disable();

        if (formValue.cuenta_is_auxiliar) this.form.controls[select].setValue(this.getValueOrigenOrTipo(this.inputs.dataOriginal[select]));
      });
    }, 1);
  }

  disableBtnConfirm(validate) {
    const modal = this.modal.instance.modalsConfig.find((modal) => modal.id == this.modal.component_id);
    const btn = modal.botones.aceptar;

    btn.disable = validate;
  }

  parseData(data) {
    data = fun.remplaceKeyFromJson(data, [{ old_key: 'cuenta_is_control', new_key: 'is_control' }]);

    if (this.inputs.method == 'add') {
      data.cuenta_control_id = this.inputs.dataOriginal.id;
    }

    const keys_to_pick = ['descripcion', 'id', 'is_control', 'origen', 'tipo', 'grupo_cuenta_id', 'cuenta_control_id'];
    data = fun.pick(data, keys_to_pick);

    return data;
  }

  btn_aceptar() {
    const dataToSend = this.parseData(this.form.getRawValue());

    const modal = this.modal.instance.modalsConfig.find((config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);

    modal.returnDataFromModal({ obj: dataToSend, modal_id: this.modal.component_id });
  }
}
