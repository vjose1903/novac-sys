import { table_config } from './../../../../components/new_tablas/tabla-class';
import { Permisos } from './../../../../../core/typescript/permisos';
import { MixinClass } from './../../../../../core/typescript/MixinClass';
import { fun } from './../../../../../core/services/functions.service';
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, FormBuilder } from '@angular/forms';
import { CuentaContableC } from '../../../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';

@Component({
  selector: 'form-entrada-diario',
  templateUrl: './form-entrada-diario.component.html',
  styleUrls: ['./form-entrada-diario.component.scss'],
})
export class FormEntradaDiarioComponent extends MixinClass implements OnInit {
  cuentasAuxiliares = [];
  formGroup: UntypedFormGroup;
  formLastValue;

  totalDebito = '0.00';
  totalCredito = '0.00';
  permissions = Permisos.cabeza_asiento_contable;

  table_diurnal_entry: table_config = {
    info: [
      { titulo: 'Cuenta auxiliar', key: 'cuenta_auxiliar_info', tipo: 'text', style: { width: '50%', 'text-align': 'left' } },
      { titulo: 'Débito', key: 'valor_debito', tipo: 'text', style: { width: '20%', 'text-align': 'left' } },
      { titulo: 'Crédito', key: 'valor_credito', tipo: 'text', style: { width: '20%', 'text-align': 'left' } },
    ],
    id_tabla: 'diurnalEntry',
    redondo: false,
    colorTitulo: false,
    obj_paginate: { show: false },
    botones: { editar: { show: true, permiso: this.permissions.update }, borrar: { show: true, permiso: this.permissions.destroy } },
  };

  detalle;
  cuentaContableClass = new CuentaContableC();

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.getCuentasAuxiliares();
    this.createForm().then(() => this.subscribeChangesForm());
  }

  createForm(data?) {
    return new Promise<void>((resolve) => {
      this.formGroup = this.fb.group({
        id: [{ value: fun.hasValue(data) ? data.id : null, disabled: false }],
        cuenta_contable_auxiliar_id: [{ value: fun.hasValue(data) ? data.cuenta_contable_auxiliar_id : null, disabled: false }],
        valor_debito: [{ value: fun.hasValue(data) ? data.valor_debito : null, disabled: false }],
        valor_credito: [{ value: fun.hasValue(data) ? data.valor_credito : null, disabled: false }],
      });
      resolve();
    });
  }

  subscribeChangesForm() {
    this.formLastValue = this.formGroup.value;

    this.formGroup.valueChanges.subscribe((changes) => {
      if (!fun.isEqual(changes, this.formLastValue)) {
        // console.log('changes ', changes);
        this.formLastValue = changes;
      }
    });
  }

  checkAmountInputState() {
    const formulario = this.formGroup.value;

    this.formGroup.controls.valor_debito.enable();
    this.formGroup.controls.valor_credito.enable();

    if (fun.hasValue(formulario.valor_debito) && Number(formulario.valor_debito) > 0) this.formGroup.controls.valor_credito.disable();
    if (fun.hasValue(formulario.valor_credito) && Number(formulario.valor_credito) > 0) this.formGroup.controls.valor_debito.disable();
  }

  async getCuentasAuxiliares(filter_target = '') {
    const extra = { parameters: { filter_target: filter_target, iterator: false, only_aux: true, label: true } };

    const res = await this.cuentaContableClass.getAll(extra);
    this.cuentasAuxiliares = res.data;
  }

  async filter(arg?) {
    if (arg == 'init' || arg == 'clear' || (fun.objHas(arg, 'value') && arg?.originalEvent?.type != 'click')) {
      let filter_target = arg?.value;
      filter_target = fun.isEmpty(filter_target) ? '' : filter_target;

      if (arg == 'init' || arg == 'clear') {
        this.getCuentasAuxiliares(filter_target);
      } else {
        fun.awaitTyping().then(async () => this.getCuentasAuxiliares(filter_target));
      }
    }
  }

  checkAmount(input) {
    fun.revisarNumber(input, input.id).then((res) => {
      if (!res.error) input.value = fun.is_number(input.value) ? res.number : null;
    });
  }

  convertAmount(type: 'focus' | 'blur', input, formControlName) {
    if (type == 'focus') {
      this.formGroup.controls[formControlName].setValue(fun.is_number(input.value) ? fun.desformatearStNumber(input.value) : null);
      input.select();
    }
    if (type == 'blur') {
      if (fun.is_number(input.value) && input.value > 0) {
        this.formGroup.controls[formControlName].setValue(fun.is_number(input.value) ? fun.roundNumberToDecimal(input.value) : null);
      } else {
        this.formGroup.controls[formControlName].setValue(null);
      }
    }
  }

  disableBtnAdd() {
    const formulario = this.formGroup.value;
    let res = true;

    if (fun.hasValue(formulario.cuenta_contable_auxiliar_id) && (fun.hasValue(formulario.valor_debito) || fun.hasValue(formulario.valor_credito))) {
      res = false;
    }

    return res;
  }

  parseEntry() {
    // cuenta_auxiliar_info
  }

  addEntry() {
    console.log('Añadir entrada');
  }
}
