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
    this.createForm();
  }

  ngDoCheck(): void {
    this.habilitarBtnAceptar();
  }

  createForm() {
    this.form = this.fb.group({
      devuelto: [{ value: null, disabled: false }],
      solo_devuelto: [{ value: null, disabled: fun.isEmpty(this.inputs?.articulo_solo_devuelto?.cantidad) }],
      defectuoso: [{ value: null, disabled: fun.isEmpty(this.inputs?.articulo_defectuoso?.cantidad) }],
    });
  }

  habilitarBtnAceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    const aceptar_btn = modal.botones.aceptar;
    const formulario = this.form.getRawValue();
    const valores = [formulario.solo_devuelto, formulario.defectuoso, formulario.devuelto];

    aceptar_btn.disable = _.every(valores, (valor) => fun.isEmpty(valor) || valor == 0);
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

    const entidades = { solo_devuelto: this.inputs.articulo_solo_devuelto?.cantidad || 0, defectuoso: this.inputs.articulo_defectuoso?.cantidad || 0, devuelto: this.inputs?.data?.cantidad || 0 };

    if (formulario[tipo] > entidades[tipo]) {
      fun.toastWarning('La cantidad no puede ser mayor a la cantidad devuelta.');
      this.form.controls[tipo].setValue(entidades[tipo]);
    }
  }

  btn_aceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    const obj = { key: this.inputs.data.key, modal_id: this.modal.component_id };
    const informacion_retornar = this.form.getRawValue();

    obj['data'] = {
      solo_devuelto: { key: this.inputs.articulo_solo_devuelto?.key, cantidad: informacion_retornar.solo_devuelto, origin: this.inputs?.articulo_solo_devuelto?.producto_origin },
      defectuoso: { key: this.inputs.articulo_defectuoso?.key, cantidad: informacion_retornar.defectuoso, origin: this.inputs?.articulo_defectuoso?.producto_origin },
    };

    if (this.inputs.data.is_devuelto) {
      obj['data'][this.inputs.tipo] = { key: this.inputs.data?.key, cantidad: informacion_retornar.devuelto, origin: this.inputs?.data?.producto_origin };
    }

    modal.returnDataFromModal(obj);
  }
}
