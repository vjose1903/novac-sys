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

    let input_enfocar;

    if (this.inputs?.data?.is_devuelto) {
      input_enfocar = 'devuelto';
    } else {
      if (fun.hasValue(this.inputs?.articulo_solo_devuelto?.cantidad)) {
        input_enfocar = 'solo_devuelto';
      } else {
        input_enfocar = 'defectuoso';
      }
    }

    fun.enfocarAndSelectInput(input_enfocar);
  }

  ngDoCheck(): void {
    this.btnAceptarIsDisabled();
  }

  createForm() {
    this.form = this.fb.group({
      devuelto: [{ value: null, disabled: false }],
      solo_devuelto: [{ value: null, disabled: fun.isEmpty(this.inputs?.articulo_solo_devuelto?.cantidad) }],
      defectuoso: [{ value: null, disabled: fun.isEmpty(this.inputs?.articulo_defectuoso?.cantidad) }],
    });
  }

  saltar(sali_de) {
    if (this.checkCantidad(sali_de)) {
      let nextFunction = this.btn_aceptar.bind(this);

      if (sali_de == 'solo_devuelto' && fun.hasValue(this.inputs?.articulo_defectuoso?.cantidad)) {
        fun.enfocarAndSelectInput('defectuoso');
        nextFunction = undefined;
      }

      if (typeof nextFunction == 'function') nextFunction();
    }
  }

  btnAceptarIsDisabled() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    const aceptar_btn = modal.botones.aceptar;
    const formulario = this.form.getRawValue();
    const valores = [formulario.solo_devuelto, formulario.defectuoso, formulario.devuelto];

    aceptar_btn.disable = _.every(valores, (valor) => fun.isEmpty(valor) || valor == 0);
    return aceptar_btn.disable;
  }

  getCurrentDevuelto(cantidad) {
    if (fun.isEmpty(cantidad)) return '0.00';
    return fun.numFormatTwoDecimals(cantidad);
  }

  checkCantidad(tipo) {
    const formulario = this.form.getRawValue();
    let todo_bien = true;

    if (formulario[tipo] < 0) {
      fun.toastWarning('La cantidad no puede ser menor a 0.');
      this.form.controls[tipo].setValue(0);
      fun.enfocarAndSelectInput(tipo);
      todo_bien = false;
    }

    const entidades = { solo_devuelto: this.inputs.articulo_solo_devuelto?.cantidad || 0, defectuoso: this.inputs.articulo_defectuoso?.cantidad || 0, devuelto: this.inputs?.data?.cantidad || 0 };

    if (formulario[tipo] > entidades[tipo]) {
      fun.toastWarning('La cantidad no puede ser mayor a la cantidad devuelta.');
      this.form.controls[tipo].setValue(entidades[tipo]);
      fun.enfocarAndSelectInput(tipo);
      todo_bien = false;
    }
    return todo_bien;
  }

  btn_aceptar() {
    if (this.btnAceptarIsDisabled()) {
      fun.toastError('Complete los campos para retornar el articulo.', 'ERROR');
      return;
    }

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
