import { rowDataDividerKey, tableCellType, table_config } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';
import { MixinClass } from '@core/typescript/MixinClass';
import { fun } from '@core/services/functions.service';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CuentaContableC } from '../../../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
import { dropdownFilterFocusInput } from '@core/typescript/p-dropdown.utils';
import { DetalleAsientoContableI } from '../../asiento-contable';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { BtnIconModule } from '@core/components/btn-icon-circular/btn-icon-circular.module';
import { TablasModule } from '@core/components/new_tablas/tablas.module';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

@Component({
  selector: 'form-entrada-diario',
  templateUrl: './form-entrada-diario.component.html',
  styleUrls: ['./form-entrada-diario.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule, BtnIconModule, TablasModule],
})
export class FormEntradaDiarioComponent extends MixinClass implements OnInit, OnChanges {
  cuentasAuxiliares = [];
  formGroup: UntypedFormGroup;

  totalDebito = '0.00';
  totalCredito = '0.00';
  permissions = Permisos.cabeza_asiento_contable;

  table_diurnal_entry: table_config = {
    info: [
      { titulo: 'Cuenta auxiliar', key: 'cuenta_auxiliar_info', tipo: tableCellType.text, puntosSuspensivos: true, style: { width: '50%', 'text-align': 'left', 'padding-left': '0.3rem' } },
      { titulo: 'Débito', key: 'valor_debito', tipo: tableCellType.formatoNumero, tachado: true, style: { width: '17%', 'text-align': 'right' } },
      { titulo: 'Crédito', key: 'valor_credito', tipo: tableCellType.formatoNumero, tachado: true, style: { width: '17%', 'text-align': 'right' } },
    ],
    id_tabla: 'diurnalEntry',
    table_size: 'sm',
    redondo: false,
    colorTitulo: false,
    obj_paginate: { show: false },
    botones: { editar: { show: true, permiso: this.permissions.update }, borrar: { show: true, permiso: this.permissions.destroy } },
  };

  detalleAsiento = [];
  cuentaContableClass = new CuentaContableC();
  isEditing: boolean;

  @Output() getDetalleAsientos = new EventEmitter();
  @Input() isOpenMonth;
  @Input() initialDetalleAsientos = [];

  public dynamicModalServ = inject(DynamicModalService);
  private fb = inject(FormBuilder);

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.necesarioStart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('isOpenMonth' in changes) {
      this.changeFormState();
    }
  }

  async necesarioStart() {
    await this.getCuentasAuxiliares();
    this.createForm();
    if (Array.isArray(this.initialDetalleAsientos)) {
      this.llenarDetalles(this.initialDetalleAsientos);
    }
  }

  llenarDetalles(detallesAsiento: Array<DetalleAsientoContableI>) {
    for (let index = 0; index < detallesAsiento.length; index++) {
      const detalle = detallesAsiento[index];
      this.formGroup.patchValue(detalle);
      this.addEntry();
    }
  }

  createForm(data?) {
    return new Promise<void>(resolve => {
      this.formGroup = this.fb.group({
        id: [{ value: fun.hasValue(data) ? data.id : null, disabled: false }],
        arrayId: [{ value: fun.hasValue(data) ? data.arrayId : fun.generateKey(), disabled: false }],
        cuenta_contable_auxiliar_id: [{ value: fun.hasValue(data) ? data.cuenta_contable_auxiliar_id : null, disabled: false }],
        valor_debito: [{ value: fun.hasValue(data) ? data.valor_debito : null, disabled: false }],
        valor_credito: [{ value: fun.hasValue(data) ? data.valor_credito : null, disabled: false }],
      });
      resolve();
    });
  }

  changeFormState() {
    const stateFunction = this.isOpenMonth ? 'enable' : 'disable';
    if (this.formGroup) {
      this.formGroup.controls.cuenta_contable_auxiliar_id[stateFunction]();
      this.formGroup.controls.valor_debito[stateFunction]();
      this.formGroup.controls.valor_credito[stateFunction]();
    }
  }

  dropCuentaAuxiliarHide(arg) {
    const formulario = this.formGroup.getRawValue();

    if (fun.hasValue(formulario.cuenta_contable_auxiliar_id)) this.saltar('campoCuentaAuxiliar');
  }

  dropCuentaAuxiliarFocus(drop) {
    dropdownFilterFocusInput(drop);
  }

  checkAmountInputState() {
    const formulario = this.formGroup.getRawValue();

    this.formGroup.controls.valor_debito.enable();
    this.formGroup.controls.valor_credito.enable();

    if (fun.hasValue(formulario.valor_debito) && Number(formulario.valor_debito) > 0) this.formGroup.controls.valor_credito.disable();
    if (fun.hasValue(formulario.valor_credito) && Number(formulario.valor_credito) > 0) this.formGroup.controls.valor_debito.disable();
  }

  async getCuentasAuxiliares(filter_target = '') {
    const extra = { parameters: { filter_target: filter_target, iterator: false, only_aux: true, label: true } };

    const res = await this.cuentaContableClass.getAll(extra);
    this.cuentasAuxiliares = res.data;
  }

  saltar(currentInputId) {
    if (currentInputId == 'campoCuentaAuxiliar') fun.enfocarAndSelectInput('campoDebito');
  }

  checkAmount(input) {
    fun.revisarNumber(input, input.id).then(res => {
      if (!res.error) input.value = fun.is_number(input.value) ? res.number : null;
    });
  }

  convertAmount(type: 'focus' | 'blur', input, formControlName) {
    if (type == 'focus') {
      this.formGroup.controls[formControlName].setValue(fun.is_number(input.value) ? fun.desformatearStNumber(input.value) : null);
      input.select();
    }
    if (type == 'blur') {
      if (fun.is_number(input.value) && input.value > 0) {
        this.formGroup.controls[formControlName].setValue(fun.is_number(input.value) ? fun.roundNumberToDecimal(input.value) : null);
      } else {
        this.formGroup.controls[formControlName].setValue(null);
      }
    }
  }

  disableBtnAdd() {
    const formulario = this.formGroup.getRawValue();
    let res = true;

    if (fun.hasValue(formulario.cuenta_contable_auxiliar_id) && (fun.hasValue(formulario.valor_debito) || fun.hasValue(formulario.valor_credito))) {
      res = false;
    }

    return res;
  }

  changeIsEditingState(isEditing) {
    this.isEditing = isEditing;

    const formFunction = isEditing ? 'disable' : 'enable';

    this.formGroup.controls.cuenta_contable_auxiliar_id[formFunction]();
  }

  addEntry() {
    const formulario = this.formGroup.getRawValue();
    const diurnalEntry = formulario;
    const cuentaAuxiliar = this.cuentasAuxiliares.find(aux => aux.id == formulario.cuenta_contable_auxiliar_id);

    diurnalEntry['cuenta_auxiliar_info'] = cuentaAuxiliar.label;
    diurnalEntry['valor_debito'] = formulario.valor_debito ? fun.desformatearStNumber(formulario.valor_debito) : null;
    diurnalEntry['valor_credito'] = formulario.valor_credito ? fun.desformatearStNumber(formulario.valor_credito) : null;

    this.detalleAsiento.push(diurnalEntry);

    this.orderDetalles();

    this.formGroup.reset({ arrayId: fun.generateKey() });
    this.checkAmountInputState();

    this.changeIsEditingState(false);
    const currentFocused = fun.getCuerrentFocusedElement();

    fun.desEnfocarInput(currentFocused.id);
    fun.clickInput('campoCuentaAuxiliar', 'class');
  }

  orderDetalles() {
    const registrosConDebito = this.detalleAsiento.filter(entry => entry.valor_debito !== null && !entry.rowDivider);
    const registrosDebitoOrdenados = registrosConDebito.sort((a, b) => a.valor_debito - b.valor_debito);

    const registrosConCredito = this.detalleAsiento.filter(entry => entry.valor_credito !== null && !entry.rowDivider);
    const registrosCreditoOrdenados = registrosConCredito.sort((a, b) => a.valor_credito - b.valor_credito);

    if (registrosConDebito.length > 0 && registrosConCredito.length > 0) {
      const divider = { [rowDataDividerKey]: true, style: { padding: '0.2rem 0rem', background: 'var(--primary02)' } };

      this.detalleAsiento = [...registrosDebitoOrdenados, divider, ...registrosCreditoOrdenados];
    } else {
      this.detalleAsiento = [...registrosDebitoOrdenados, ...registrosCreditoOrdenados];
    }
    this.calcularTotales();
    this.returnDetalles();
  }

  validateAdd() {
    const formulario = this.formGroup.getRawValue();

    if (fun.isEmpty(formulario.cuenta_contable_auxiliar_id) || (fun.isEmpty(formulario.valor_debito) && fun.isEmpty(formulario.valor_credito))) {
      fun.toastWarning('Debe completar el detalle para añadirlo.', 'AVISO');
    } else {
      this.addEntry();
    }
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  editarItem(data) {
    if (this.isEditing) {
      fun.toastWarning('Debe terminar de editar el detalle que está editando.', 'AVISO');
    } else {
      const diurnalEntry = fun.deepCloning(data);

      diurnalEntry.valor_debito = data.valor_debito ? fun.roundNumberToDecimal(data.valor_debito) : null;
      diurnalEntry.valor_credito = data.valor_credito ? fun.roundNumberToDecimal(data.valor_credito) : null;

      this.formGroup.patchValue(diurnalEntry);
      this.removerDetalle(data.arrayId);

      this.changeIsEditingState(true);
      this.checkAmountInputState();
      this.orderDetalles();
    }
  }

  calcularTotales() {
    const registrosConDebito = this.detalleAsiento.filter(entry => entry.valor_debito !== null && !entry.rowDivider);
    const registrosConCredito = this.detalleAsiento.filter(entry => entry.valor_credito !== null && !entry.rowDivider);

    const totalDebito = registrosConDebito.reduce((acumulado, item) => acumulado + item.valor_debito, 0);
    const totalCredito = registrosConCredito.reduce((acumulado, item) => acumulado + item.valor_credito, 0);

    this.totalDebito = fun.roundNumberToDecimal(totalDebito);
    this.totalCredito = fun.roundNumberToDecimal(totalCredito);
  }

  eliminarReg(data) {
    const siFunc = instance => {
      this.removerDetalle(data.arrayId);
      instance.dismissModal(instance.id);
    };

    this.dynamicModalServ.confirmationModal({
      id: 'eliminarDiurnalEntryDetail',
      texto: `Seguro que desea remover el detalle de: <strong>${data.cuenta_auxiliar_info}</strong> `,
      btnKind: confirmationButtons.cancelarEliminar,
      onYes: siFunc.bind(this),
    });
  }

  removerDetalle(arrayId) {
    this.detalleAsiento = this.detalleAsiento.filter(entry => entry.arrayId != arrayId);
    this.orderDetalles();
  }

  returnDetalles() {
    const detallesWithOutDivider = this.detalleAsiento.filter(detalle => !(rowDataDividerKey in detalle));
    this.getDetalleAsientos.emit(detallesWithOutDivider);
  }
}
