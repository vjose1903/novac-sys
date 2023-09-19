import { MixinClass } from './../../../../core/typescript/MixinClass';
import { table_config } from './../../../components/new_tablas/tabla-class';
import { fun } from './../../../../core/services/functions.service';
import { IModalConfiguration, ModalComponentI, ModalI } from './../../../components/modal/modal-class';
import { Component, DoCheck, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-retornar-devuelto',
  templateUrl: './retornar-devuelto.component.html',
  styleUrls: ['./retornar-devuelto.component.scss'],
})
export class RetornarDevueltoComponent extends MixinClass implements OnInit, ModalI, DoCheck {
  constructor(private fb: UntypedFormBuilder) {
    super();
  }
  modalComponent: ModalComponentI= {};
  inputs: any;

  form;
  fun = fun;

  table_config: table_config = {
    info: [
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion' },
      { titulo: 'Tipo', tipo: 'text', key: 'tipo' },
      { titulo: 'Cantidad', tipo: 'formatoNumero', key: 'cantidad' },
    ],
    colores: true,
    id_tabla: 'retornar_articulo',
    filtrar: { show: false, local: true },
    obj_paginate: { show: true, showTotal: false, showDropDown: false, per_page: 9999, is_local: true },
  };

  articuloSelected;

  tablaComponent;

  ngOnInit() {
    this.createForm();
  }

  ngDoCheck() {
    this.btnAceptarIsDisabled();
  }

  tableClickRow(event) {
    this.form.controls['defectuoso'].disable();
    this.form.controls['solo_devuelto'].disable();

    this.articuloSelected = fun.duplicarJson(event.data);

    const currentControl = this.articuloSelected.is_defectuoso ? 'defectuoso' : 'solo_devuelto';
    this.form.controls[currentControl].enable();

    const currentKey = currentControl == 'defectuoso' ? 'articulo_defectuoso' : 'articulo_solo_devuelto';
    this.inputs['articulo_solo_devuelto'] = null;
    this.inputs['articulo_defectuoso'] = null;

    this.inputs[currentKey] = fun.duplicarJson(event.data);
    this.inputs['data'] = fun.duplicarJson(event.data.producto_origin);

    this.enfocarInitInput();
  }

  enfocarInitInput() {
    let input_enfocar;

    if (fun.hasValue(this.inputs?.data) || fun.hasValue(this.inputs?.articulo_solo_devuelto) || fun.hasValue(this.inputs?.articulo_defectuoso)) {
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
    const modal = _.find(this.modalComponent.modalsConfig, (config) => config.id === this.modalComponent.id);
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

    const dataToReturn = { key: this.inputs.data.key, modalId: this.modalComponent.id };
    const informacion_retornar = this.form.getRawValue();

    dataToReturn['data'] = {
      solo_devuelto: { key: this.inputs.articulo_solo_devuelto?.key, cantidad: informacion_retornar.solo_devuelto, origin: this.inputs?.articulo_solo_devuelto?.producto_origin },
      defectuoso: { key: this.inputs.articulo_defectuoso?.key, cantidad: informacion_retornar.defectuoso, origin: this.inputs?.articulo_defectuoso?.producto_origin },
    };

    if (this.inputs.data.is_devuelto) {
      dataToReturn['data'][this.inputs.tipo] = { key: this.inputs.data?.key, cantidad: informacion_retornar.devuelto, origin: this.inputs?.data?.producto_origin };
    }

    this.modalComponent.closeModal(this.modalComponent.id, dataToReturn);
  }
}
