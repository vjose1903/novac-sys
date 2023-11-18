import { ModalComponentI, ModalI } from './../../../components/modal/modal-class';
import { fun } from './../../../../core/services/functions.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';
import { tipoAsiento } from '../asiento-contable';

@Component({
  selector: 'app-entrada-diario',
  templateUrl: './entrada-diario.component.html',
  styleUrls: ['./entrada-diario.component.scss'],
})
export class EntradaDiarioComponent implements OnInit, ModalI {
  formGroup: UntypedFormGroup;
  constructor(private fb: FormBuilder) {}

  modalComponent: ModalComponentI;
  inputs: any;

  ngOnInit(): void {
    this.necesarioStart();
  }

  necesarioStart() {
    this.createForm();
  }

  createForm(data?) {
    this.formGroup = this.fb.group({
      id: [{ value: fun.hasValue(data) ? (this.inputs.method == 'edit' ? data.id : null) : null, disabled: false }],
      fecha_equivalente: [{ value: fun.hasValue(data) ? data.fecha_equivalente : null, disabled: false }],
      tipo: [{ value: fun.hasValue(data) ? data.tipo : tipoAsiento.manual, disabled: false }],
      comentario: [{ value: fun.hasValue(data) ? data.comentario : null, disabled: false }],
    });
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
