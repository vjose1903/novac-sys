import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalComponentI, ModalI } from '../../../components/modal/modal-class';
import { BancoI } from '../banco.utils';
import { TipoCuentaBancariaC, TipoCuentaBancariaI } from '../tipo-cuenta-bancaria/tipo_cuenta_bancaria';
import { fun } from './../../../../core/services/functions.service';
import { ImagenService } from './../../../../core/services/imagen.service';
import { DivisaService } from './../../divisa/divisa.service';
import { CuentaBancariaI, modalCuentaBancaria, modalCuentaBancariaBtnAceptar } from './cuenta_bancaria';

@Component({
  selector: 'app-cuenta-bancaria-form',
  templateUrl: './cuenta-bancaria-form.component.html',
  styleUrls: ['./cuenta-bancaria-form.component.scss'],
})
export class CuentaBancariaFormComponent extends MixinClass implements OnInit, ModalI {
  modalComponent: ModalComponentI;
  inputs: { cuenta: CuentaBancariaI; banco: BancoI };
  fun = fun;
  formGroup: UntypedFormGroup;
  formInitialValue: CuentaBancariaI;

  listaTipoCuentasBancarias: Array<TipoCuentaBancariaI> = [];
  tipoCuentaBancariaClass = new TipoCuentaBancariaC();

  CuentaBancariaSelected;
  maxDate;

  constructor(private fb: UntypedFormBuilder, public divisaServ: DivisaService, public imgServ: ImagenService) {
    super();
  }

  ngOnInit(): void {
    this.necesarioStart();
  }

  async necesarioStart() {
    this.initVariables();
    await this.getTipoCuentasBancarias();

    await this.createForm(this.inputs.cuenta).then(() => {
      this.formInitialValue = this.formGroup.getRawValue();

      this.formGroup.valueChanges.subscribe((change) => {
        this.validateSaveBtnState();
      });
    });
  }

  initVariables() {
    this.maxDate = new Date();
  }

  createForm(cuenta?) {
    return new Promise<void>((resolve) => {
      const divisa_principal = this.divisaServ.getDivisaPrincipalInfo();

      this.formGroup = this.fb.group({
        arrayId: [{ value: cuenta ? (cuenta.arrayId ? cuenta.arrayId : fun.generateKey()) : fun.generateKey(), disabled: false }],
        id: [{ value: cuenta ? cuenta.id : null, disabled: false }],
        banco_id: [{ value: cuenta ? cuenta.banco_id : null, disabled: false }],
        tipo_cuenta_bancaria_id: [{ value: cuenta ? cuenta.tipo_cuenta_bancaria_id : null, disabled: false }, Validators.required],
        divisa_id: [{ value: cuenta ? cuenta.divisa_id : divisa_principal ? divisa_principal.id : null, disabled: cuenta && fun.hasValue(cuenta?.id) }, Validators.compose([Validators.required])],
        fecha_apertura: [{ value: cuenta ? cuenta.fecha_apertura : null, disabled: false }],
        numero_cuenta: [{ value: cuenta ? cuenta.numero_cuenta : null, disabled: false }, Validators.compose([Validators.required])],
        balance_inicial_libro: [{ value: cuenta ? cuenta.balance_inicial_libro : null, disabled: false }],
        balance_inicial_banco: [{ value: cuenta ? cuenta.balance_inicial_banco : null, disabled: false }],
        fecha_primera_conciliacion: [{ value: cuenta ? cuenta.fecha_primera_conciliacion : null, disabled: false }],
        comentario: [{ value: cuenta ? cuenta.comentario : null, disabled: false }],
        descripcion: [{ value: cuenta ? cuenta.descripcion : null, disabled: false }, Validators.required],
        cuenta_contable: [{ value: cuenta ? cuenta?.cuenta_contable : null, disabled: true }],
        nombre_cuenta: [{ value: cuenta ? cuenta?.nombre_cuenta : null, disabled: true }],
        cuenta_contable_prima: [{ value: cuenta ? cuenta?.cuenta_contable_prima : null, disabled: true }],
        nombre_cuenta_prima: [{ value: cuenta ? cuenta?.nombre_cuenta_prima : null, disabled: true }],
      });
      resolve();
    });
  }

  getTipoCuentasBancarias() {
    const extra = { parameters: { paginado: false } };

    this.listaTipoCuentasBancarias.length = 0;
    this.tipoCuentaBancariaClass.getAll(extra).then((res) => {
      this.listaTipoCuentasBancarias = fun.deepCloning(res.data);
    });
  }

  saltar(saliDe: string) {}

  showDivisaDrop(event, dropdown) {
    if (fun.hasValue(event.relatedTarget)) dropdown.show();
  }

  validateSaveBtnState() {
    let buttonIsDisable = this.formIsOnInitState();
    if (!buttonIsDisable) buttonIsDisable = this.formGroup.invalid;

    if (this.modalComponent && this.modalComponent.changeStateButton) {
      this.modalComponent.changeStateButton({ modalId: modalCuentaBancaria, btnId: modalCuentaBancariaBtnAceptar, disable: buttonIsDisable });
    }
  }

  formIsOnInitState() {
    if (this.formGroup) {
      const formulario = this.formGroup.getRawValue();
      const formIsOriginal = fun.isEqual(this.formInitialValue, formulario);

      return formIsOriginal;
    } else {
      return true;
    }
  }

  showPrimaFields() {
    const formulario = this.formGroup.getRawValue();

    return fun.hasValue(formulario.divisa_id) ? !this.divisaServ.listaDivisasIndexada[formulario.divisa_id].is_principal : false;
  }

  btn_aceptar() {
    const formulario = this.formGroup.getRawValue();

    this.modalComponent.closeModal(this.modalComponent.id, formulario);
  }
}
