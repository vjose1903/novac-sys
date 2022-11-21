import { fun } from './../../../../core/services/functions.service';
import { ModalI } from './../../../components/modal/modal-class';
import { Component, DoCheck, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-retornar-devuelto',
  templateUrl: './retornar-devuelto.component.html',
  styleUrls: ['./retornar-devuelto.component.scss'],
})
export class RetornarDevueltoComponent implements OnInit, ModalI, DoCheck {
  constructor(private fb: FormBuilder) {}
  modal: any = {};
  inputs: any;

  form;
  fun = fun;

  ngOnInit(): void {
    console.log(this.inputs);

    this.createForm();
  }

  ngDoCheck(): void {
    this.habilitarBtnAceptar();
  }

  habilitarBtnAceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    const aceptar_btn = modal.botones.aceptar;
    const formulario = this.form.getRawValue();
    const valores = [formulario.solo_devuelto, formulario.defectuoso];

    aceptar_btn.disable = _.every(valores, (valor) => fun.isEmpty(valor) || valor == 0);
  }

  createForm() {
    this.form = this.fb.group({
      solo_devuelto: [{ value: null, disabled: fun.isEmpty(this.inputs?.articulo_solo_devuelto?.cantidad) }],
      defectuoso: [{ value: null, disabled: fun.isEmpty(this.inputs?.articulo_defectuoso?.can) }],
    });
  }

  getCurrentDevuelto(cantidad) {
    if (fun.isEmpty(cantidad)) return '0.00';
    return fun.numFormatTwoDecimals(cantidad);
  }

  checkCantidad(tipo) {
    const formulario = this.form.getRawValue();

    if (formulario[tipo] < 0) {
      fun.toastWarning('La cantidad no puede ser menor a 0.');
      this.form.controls[tipo].setValue(0);
      fun.enfocarAndSelectInput(tipo);
    }

    const entidades = { solo_devuelto: this.inputs.articulo_solo_devuelto?.cantidad || 0, defectuoso: this.inputs.articulo_defectuoso?.can || 0 };

    if (formulario[tipo] > entidades[tipo]) {
      fun.toastWarning('La cantidad no puede ser mayor a la cantidad devuelta.');
      this.form.controls[tipo].setValue(entidades[tipo]);
    }
  }

  btn_aceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    const obj = { key: this.inputs.data.key, modal_id: this.modal.component_id };

    obj['data'] = this.form.getRawValue();

    modal.returnDataFromModal(obj);
  }
}
