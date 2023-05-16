import { fun } from './../../../../core/services/functions.service';
import { ModalI } from './../../../components/modal/modal-class';
import { Component, OnInit } from '@angular/core';

import { DivisaI } from '../divisa.utils';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-tasa-de-cambio',
  templateUrl: './tasa-de-cambio.component.html',
  styleUrls: ['./tasa-de-cambio.component.scss'],
})
export class TasaDeCambioComponent implements OnInit, ModalI {
  modal: any = {};
  inputs: { divisa: DivisaI };

  form: UntypedFormGroup;

  desde;
  hasta;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.setDefaultRange();
    this.createForm(this.inputs.divisa);
    this.getHistorialCambiosTasas();
  }

  createForm(divisa: DivisaI) {
    this.form = this.fb.group({
      tasa: [{ value: divisa.current_tasa, disabled: divisa.is_principal }, Validators.required],
    });
  }

  setDefaultRange() {
    let desde_temp = new Date();
    desde_temp.setDate(desde_temp.getDate() - 30);
    const desde = new Date(fun.getFirstDayOfMoth(desde_temp));

    this.desde = desde;
    this.hasta = new Date();
  }

  verificateChangeOfCurrency() {
    const formValue = this.form.getRawValue();
    return formValue.tasa == this.inputs.divisa.current_tasa;
  }

  getHistorialCambiosTasas() {}

  btn_aceptar() {}
}
