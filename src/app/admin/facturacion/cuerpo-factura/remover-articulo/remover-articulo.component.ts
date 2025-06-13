import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalI } from '@components/modal/modal-class';
import * as _ from 'lodash';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { fun } from '@core/services/functions.service';
import { timeStamp } from 'console';

@Component({
  selector: 'app-remover-articulo',
  templateUrl: './remover-articulo.component.html',
  styleUrls: ['./remover-articulo.component.scss'],
  standalone: false,
})
export class RemoverArticuloComponent implements OnInit, ModalI {
  constructor(private fb: UntypedFormBuilder) {}
  @Input() modalWrapper: any = {};
  inputs: any;
  form;

  htmlServ = inject(HtmlElementsService);

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      all: [{ value: false, disabled: false }],
      cantidad: [{ value: 0, disabled: false }, Validators.required],
      razon: [{ value: null, disabled: false }, Validators.required],
    });
  }

  saltar(campo) {
    if (campo != 'send') {
      fun.enfocarInput(campo);
    } else {
      this.btn_aceptar();
    }
  }

  changeValorCheck() {
    this.form.controls.cantidad.setValue(this.inputs.cantidad);
    fun.enfocarInput('razon');
  }

  checkCantidad() {
    const formulario = this.form.getRawValue();

    if (formulario.cantidad < 0) {
      fun.toastWarning('La cantidad no puede ser menor a 0.');
      this.form.controls.cantidad.setValue(0);
    }

    if (formulario.cantidad > this.inputs.cantidad) {
      fun.toastWarning('La cantidad no puede ser mayor a la cantidad pre-facturada.');
      this.form.controls.cantidad.setValue(this.inputs.cantidad);
    }

    this.form.controls.all.setValue(formulario.cantidad == this.inputs.cantidad);
  }

  btn_aceptar() {
    if (this.form.valid || this.inputs.data_detalle.is_defectuoso || !this.inputs.is_prefactura_selected) {
      const modal = _.find(this.modalWrapper.instance.modalsConfig, config => config.id === this.modalWrapper.component_id);
      modal.closeModal(this.modalWrapper.component_id);
      const obj = { key: this.inputs.key, modal_id: this.modalWrapper.component_id, data: this.inputs.data_detalle };

      if (this.inputs.is_prefactura_selected) obj['data'] = this.form.getRawValue();

      modal.returnDataFromModal(obj);
    } else {
      fun.toastError('Complete los campos para retirar el articulo.', 'ERROR');
    }
  }
}
