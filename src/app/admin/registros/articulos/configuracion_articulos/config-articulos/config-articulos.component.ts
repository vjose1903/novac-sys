import { HtmlElementsService } from '@core/services/html-elements.service';
import { fun } from '@core/services/functions.service';
import { ModalI } from '@components/modal/modal-class';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ConfigArticuloC } from '../articulos_configuracion';

@Component({
  selector: 'app-config-articulos',
  templateUrl: './config-articulos.component.html',
  styleUrls: ['./config-articulos.component.scss'],
  standalone: false,
})
export class ConfigArticulosComponent implements OnInit, ModalI {
  form: UntypedFormGroup;
  @Input() modalWrapper: any = {};
  inputs: any;
  update_articulos = true;
  configArticuloClass = new ConfigArticuloC();

  htmlServ = inject(HtmlElementsService);
  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.createForm(this.inputs.cofig_articulos).then(() => {
      this.form.valueChanges.subscribe(res => {
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
    const modal = this.modalWrapper.instance.modalsConfig.find(modal => modal.id == this.modalWrapper.component_id);
    const btn = modal.botones.dinamico.find(boton => boton.btn_id == 'btnConfirmar');

    btn.disable = validate;
  }

  btn_aceptar() {
    const formulario = this.form.getRawValue();
    this.configArticuloClass
      .updateOne(formulario, { parameters: { update_articulos: this.update_articulos } })
      .then(res => {
        const modal = this.modalWrapper.instance.modalsConfig.find(config => config.id == this.modalWrapper.component_id);
        modal.closeModal(this.modalWrapper.component_id);
        modal.returnDataFromModal({ data: { ...res.data }, modal_id: this.modalWrapper.component_id });
      })
      .catch(err => console.error(err));
  }
}
