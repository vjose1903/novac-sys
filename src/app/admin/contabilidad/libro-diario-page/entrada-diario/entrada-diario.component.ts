import { ModalComponentI, ModalI } from './../../../components/modal/modal-class';
import { fun } from './../../../../core/services/functions.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormArray, UntypedFormGroup, Validators } from '@angular/forms';
import { tipoAsiento } from '../asiento-contable';
import { diurnalFormBtnAceptarId, diurnalFormId } from '../libro-diario-page.utils';

@Component({
  selector: 'app-entrada-diario',
  templateUrl: './entrada-diario.component.html',
  styleUrls: ['./entrada-diario.component.scss'],
})
export class EntradaDiarioComponent implements OnInit, ModalI {
  formGroup: UntypedFormGroup;
  formGroupInitialValue: any;
  maxDate: Date;
  constructor(private fb: FormBuilder) {}

  modalComponent: ModalComponentI;
  inputs: any;

  ngOnInit(): void {
    this.necesarioStart();
  }

  necesarioStart() {
    this.maxDate = new Date();
    this.createForm().then(() => {
      this.formGroupInitialValue = this.formGroup.value;

      this.formGroup.valueChanges.subscribe((change) => {
        this.validateSaveBtnState();
      });
    });
  }

  createForm(data?) {
    return new Promise<void>((resolve) => {
      this.formGroup = this.fb.group({
        id: [{ value: fun.hasValue(data) ? (this.inputs.method == 'edit' ? data.id : null) : null, disabled: false }],
        fecha_equivalente: [{ value: fun.hasValue(data) ? data.fecha_equivalente : null, disabled: false }, Validators.required],
        tipo: [{ value: fun.hasValue(data) ? data.tipo : tipoAsiento.manual, disabled: false }],
        comentario: [{ value: fun.hasValue(data) ? data.comentario : null, disabled: false }, Validators.required],
        detalles_asientos_contables: this.fb.array([]),
      });
      resolve();
    });
  }

  createItemDiunalEntry(departmentLine?: any) {
    const scheduleForm = this.fb.group({
      id: [{ value: departmentLine ? departmentLine.id : null, disabled: false }],
      valor_debito: [{ value: departmentLine ? departmentLine.valor_debito : null, disabled: false }],
      valor_credito: [{ value: departmentLine ? departmentLine.valor_credito : null, disabled: false }],
      cuenta_contable_auxiliar_id: [{ value: departmentLine ? departmentLine.cuenta_contable_auxiliar_id : null, disabled: false }, Validators.required],
    });

    return scheduleForm;
  }

  addItem(diurnalEntry?: any): void {
    const arrayDiurnalEntries = this.formGroup.get('detalles_asientos_contables') as UntypedFormArray;
    arrayDiurnalEntries.push(this.createItemDiunalEntry(diurnalEntry));
  }

  removeItem(index: number) {
    const arrayDiurnalEntries = this.formGroup.get('detalles_asientos_contables') as UntypedFormArray;
    arrayDiurnalEntries.removeAt(index);
  }

  validateSaveBtnState() {
    let buttonIsDisable = this.formIsOnInitState();
    if (!buttonIsDisable) buttonIsDisable = this.formGroup.invalid;

    if (this.modalComponent && this.modalComponent.changeStateButton) {
      this.modalComponent.changeStateButton({ modalId: diurnalFormId, btnId: diurnalFormBtnAceptarId, disable: buttonIsDisable });
    }
  }

  formIsOnInitState() {
    if (this.formGroup) {
      const formulario = this.formGroup.getRawValue();
      const formIsOriginal = fun.isEqual(this.formGroupInitialValue, formulario);

      return formIsOriginal;
    } else {
      return true;
    }
  }

  test() {
    this.modalComponent.changeStateButton({ modalId: diurnalFormId, btnId: diurnalFormBtnAceptarId, disable: false });
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
