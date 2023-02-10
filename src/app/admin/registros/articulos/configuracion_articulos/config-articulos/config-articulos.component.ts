import { fun } from './../../../../../core/services/functions.service';
import { ModalI } from './../../../../components/modal/modal-class';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { ConfigArticuloC } from '../articulos_configuracion';

@Component({
  selector: 'app-config-articulos',
  templateUrl: './config-articulos.component.html',
  styleUrls: ['./config-articulos.component.scss'],
})
export class ConfigArticulosComponent implements OnInit, ModalI {
  form: FormGroup;
  modal: any = {};
  inputs: any;
  update_articulos = true;
  configArticuloClass = new ConfigArticuloC();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm(this.inputs.cofig_articulos).then(() => {
      this.form.valueChanges.subscribe((res) => {
        this.disableBtnConfirm(!this.form.valid);
      });
    });
  }

  createForm(data) {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [data.id],
        porciento_ganancia: [{ value: data.porciento_ganancia, disabled: false }, Validators.compose([Validators.required, Validators.min(1), Validators.max(100)])],
      });

      setTimeout(() => resolve(true), 10);
    });
  }

  changeUpdateArticulos() {
    this.update_articulos = !this.update_articulos;
  }

  disableBtnConfirm(validate) {
    const modal = this.modal.instance.modalsConfig.find((modal) => modal.id == this.modal.component_id);
    const btn = modal.botones.dinamico.find((boton) => boton.btn_id == 'btnConfirmar');

    btn.disable = validate;
  }

  btn_aceptar() {
    const formulario = this.form.getRawValue();
    this.configArticuloClass
      .updateOne(formulario, { parameters: { update_articulos: this.update_articulos } })
      .then((res) => {
        const modal = this.modal.instance.modalsConfig.find((config) => config.id == this.modal.component_id);
        modal.closeModal(this.modal.component_id);
        modal.returnDataFromModal({ data: { ...res.data }, modal_id: this.modal.component_id });
      })
      .catch((err) => console.error(err));
  }
}
