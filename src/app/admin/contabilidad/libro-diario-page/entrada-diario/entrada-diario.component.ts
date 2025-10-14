import { requestParameters } from '@core/typescript/crud-g';
import { PeriodoFiscalC } from './../../../registros/periodo-fiscal/periodo-fiscal';
import { fun } from '@core/services/functions.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormGroup, Validators } from '@angular/forms';
import { AsientoContableC, CabezaAsietoContableI, DetalleAsientoContableI, tipoAsiento } from '../asiento-contable';
import { diurnalFormBtnAceptarId, diurnalFormId } from '../libro-diario-page.utils';
import { DateUtils } from '@vjose1903/dateutils';
import { IDynamicModal, IModalConfiguration } from '@components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@components/dynamic-modal/dynamic-modal.component';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { FormEntradaDiarioComponent } from './form-entrada-diario/form-entrada-diario.component';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';
import { DirectivesModule } from '@core/directive/directives.module';

@Component({
  selector: 'app-entrada-diario',
  templateUrl: './entrada-diario.component.html',
  styleUrls: ['./entrada-diario.component.scss'],
  imports: [CommonModule, DatePickerModule, FormsModule, ReactiveFormsModule, FormEntradaDiarioComponent, FormErrorMsgComponent, DirectivesModule],
})
export class EntradaDiarioComponent implements OnInit, IDynamicModal {
  formGroup: UntypedFormGroup;
  formGroupInitialValue: any;
  maxDate: Date;
  constructor(private fb: FormBuilder) {}

  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  @Input() method: 'edit' | 'new';
  @Input() asientoContable: CabezaAsietoContableI;

  peridoClass = new PeriodoFiscalC();
  asientoContableClass = new AsientoContableC();
  isOpenMonth = true;

  ngOnInit(): void {
    this.necesarioStart();
  }

  necesarioStart() {
    this.maxDate = new Date();
    this.createForm(this.asientoContable).then(() => {
      this.formGroupInitialValue = this.formGroup.getRawValue();

      this.formGroup.valueChanges.subscribe(change => {
        this.validateSaveBtnState();
      });

      if (this.method == 'new') setTimeout(() => fun.enfocarInput('fecha_equivalente_input'), 250);
    });
  }

  createForm(data?) {
    return new Promise<void>(resolve => {
      this.formGroup = this.fb.group({
        id: [{ value: fun.hasValue(data) ? (this.method == 'edit' ? data.id : null) : null, disabled: false }],
        fecha_equivalente: [{ value: fun.hasValue(data) ? new Date(data.fecha_equivalente) : null, disabled: false }, Validators.required],
        tipo: [{ value: fun.hasValue(data) ? data.tipo : tipoAsiento.manual, disabled: false }],
        comentario: [{ value: fun.hasValue(data) ? data.comentario : null, disabled: false }, Validators.required],
        detalles_asientos_contables: this.fb.array([]),
      });

      resolve();
    });
  }

  createItemDiunalEntry(detalleAsiento?: any) {
    const scheduleForm = this.fb.group({
      id: [{ value: detalleAsiento ? detalleAsiento.id : null, disabled: false }],
      arrayId: [{ value: detalleAsiento ? (detalleAsiento.arrayId ? detalleAsiento.arrayId : fun.generateKey()) : fun.generateKey(), disabled: false }],
      valor_debito: [{ value: detalleAsiento ? detalleAsiento.valor_debito : null, disabled: false }],
      valor_credito: [{ value: detalleAsiento ? detalleAsiento.valor_credito : null, disabled: false }],
      cuenta_contable_auxiliar_id: [{ value: detalleAsiento ? detalleAsiento.cuenta_contable_auxiliar_id : null, disabled: false }, Validators.required],
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

    const arrayDiurnalEntries = this.formGroup.get('detalles_asientos_contables') as UntypedFormArray;
    if (!buttonIsDisable) buttonIsDisable = arrayDiurnalEntries.length == 0;

    if (this.modalConfig && this.modalConfig.changeStateButton) {
      this.modalConfig.modalWrapper.changeStateButton({ modalId: diurnalFormId, btnId: diurnalFormBtnAceptarId, disable: buttonIsDisable });
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

  validateOpenPeriod() {
    const formulario = this.formGroup.getRawValue();

    if (fun.hasValue(formulario.fecha_equivalente)) {
      const fecha_equivalente = DateUtils.format({ date: formulario.fecha_equivalente, dateFormat: 'YYYY-MM-DD' });

      const extra: requestParameters = { afterPath: 'custom/is_open_month', parameters: { fecha: fecha_equivalente } };
      this.peridoClass.getAll(extra).then(response => {
        this.isOpenMonth = response.data.isOpen;

        const stateFunction = this.isOpenMonth ? 'enable' : 'disable';
        this.formGroup.controls.comentario[stateFunction]();

        if (!this.isOpenMonth) {
          const fechaMostrar = DateUtils.format({ date: formulario.fecha_equivalente });
          this.formGroup.controls.fecha_equivalente.setValue(null, { emitEvent: false });
          const numMonth = formulario.fecha_equivalente.getMonth() + 1;
          const monthLabel = DateUtils.getMonthLabelByNum(numMonth);

          fun.toastError(`Para registrar una entrada de libro diario en la fecha: ${fechaMostrar}, debe de abrir el mes de ${fun.capitalice(monthLabel)}`);
        }
      });
    }
  }

  parseDetalleAsientos(detallesAsientos) {
    const arrayDiurnalEntries = this.formGroup.get('detalles_asientos_contables') as UntypedFormArray;
    arrayDiurnalEntries.clear();

    detallesAsientos.forEach(detalleAsiento => this.addItem(detalleAsiento));
  }

  submit() {
    const formulario = this.formGroup.getRawValue();
    const dataToSend = fun.deepCloning(formulario);
    dataToSend.fecha_equivalente = DateUtils.format({ date: formulario.fecha_equivalente, dateFormat: 'YYYY-MM-DD' });

    this.asientoContableClass
      .createUpdateOne(dataToSend)
      .then((res: any) => {
        // TODO:  revisar esto
        this.modalConfig.close({ data: { ...res.data }, extra: { method: this.method } });
      })
      .catch(err => {
        console.error('error ', err);
      });
  }

  test() {}
}
