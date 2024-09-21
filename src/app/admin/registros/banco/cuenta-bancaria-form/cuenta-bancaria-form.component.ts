import { HtmlElementsService } from './../../../../core/services/html-elements.service';
import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalComponentI, ModalI } from '../../../components/modal/modal-class';
import { BancoI, ListBancoI } from '../banco.utils';
import { TipoCuentaBancariaC, TipoCuentaBancariaI } from '../tipo-cuenta-bancaria/tipo_cuenta_bancaria';
import { fun } from './../../../../core/services/functions.service';
import { ImagenService } from './../../../../core/services/imagen.service';
import { DivisaService } from './../../divisa/divisa.service';
import { CuentaBancariaI, modalCuentaBancaria, modalCuentaBancariaBtnAceptar } from './cuenta_bancaria';
import { booleanYesNo } from './../../../../core/typescript/constantes';

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
  nombreBanco: string;
  maxDate;

  hasChequeraOptions = booleanYesNo;
  htmlServ = inject(HtmlElementsService);

  constructor(private fb: UntypedFormBuilder, public divisaServ: DivisaService, public imgServ: ImagenService) {
    super();
  }

  ngOnInit(): void {
    this.necesarioStart();
    this.nombreBanco = (this.inputs?.banco?.nombre as ListBancoI)?.nombre;
  }

  async necesarioStart() {
    this.initVariables();
    await this.getTipoCuentasBancarias();

    await this.createForm(this.inputs.cuenta).then(() => {
      this.formInitialValue = this.formGroup.getRawValue();

      this.formGroup.valueChanges.subscribe((change) => {
        this.validateSaveBtnState();
      });

      setTimeout(() => fun.enfocarInput('campoDescripcion'), 200);
    });
  }

  initVariables() {
    this.maxDate = new Date();
  }

  createForm(cuenta?) {
    return new Promise<void>((resolve) => {
      const divisa_principal = this.divisaServ.getDivisaPrincipalInfo();

      this.formGroup = this.fb.group({
        arrayId: [{ value: fun.hasValue(cuenta) ? (cuenta.arrayId ? cuenta.arrayId : fun.generateKey()) : fun.generateKey(), disabled: false }],
        id: [{ value: fun.hasValue(cuenta) ? cuenta.id : null, disabled: false }],
        banco_id: [{ value: fun.hasValue(cuenta) ? cuenta.banco_id : null, disabled: false }],
        tipo_cuenta_bancaria_id: [{ value: fun.hasValue(cuenta) ? cuenta.tipo_cuenta_bancaria_id : null, disabled: false }, Validators.required],
        divisa_id: [{ value: fun.hasValue(cuenta) ? cuenta.divisa_id : divisa_principal ? divisa_principal.id : null, disabled: cuenta && fun.hasValue(cuenta?.id) }, Validators.compose([Validators.required])],
        fecha_apertura: [{ value: fun.hasValue(cuenta) ? cuenta.fecha_apertura : null, disabled: false }],
        numero_cuenta: [{ value: fun.hasValue(cuenta) ? cuenta.numero_cuenta : null, disabled: false }, Validators.compose([Validators.required])],
        balance_inicial_libro: [{ value: fun.hasValue(cuenta) ? cuenta.balance_inicial_libro : null, disabled: false }],
        balance_inicial_banco: [{ value: fun.hasValue(cuenta) ? cuenta.balance_inicial_banco : null, disabled: false }],
        fecha_primera_conciliacion: [{ value: fun.hasValue(cuenta) ? cuenta.fecha_primera_conciliacion : null, disabled: false }],
        comentario: [{ value: fun.hasValue(cuenta) ? cuenta.comentario : null, disabled: false }],
        descripcion: [{ value: fun.hasValue(cuenta) ? cuenta.descripcion : null, disabled: false }, Validators.required],
        has_chequera: [{ value: fun.hasValue(cuenta) ? (fun.hasValue(cuenta.has_chequera) ? cuenta.has_chequera : false) : false, disabled: false }],
        cuenta_contable: [{ value: fun.hasValue(cuenta) ? cuenta?.cuenta_contable : null, disabled: true }],
        nombre_cuenta: [{ value: fun.hasValue(cuenta) ? cuenta?.nombre_cuenta : null, disabled: true }],
        cuenta_contable_prima: [{ value: fun.hasValue(cuenta) ? cuenta?.cuenta_contable_prima : null, disabled: true }],
        nombre_cuenta_prima: [{ value: fun.hasValue(cuenta) ? cuenta?.nombre_cuenta_prima : null, disabled: true }],
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

  saltar(salioDe, valor?) {
    let siguiente_input = '';
    let is_enforcar = true;

    switch (salioDe) {
      case 'campoDescripcion':
        siguiente_input = 'campoNumeroCuenta';
        break;
      case 'campoNumeroCuenta':
        siguiente_input = 'campoTipoCuenta';
        break;
      case 'campoTipoCuenta':
        siguiente_input = 'campoDivisa';
        break;
      case 'campoDivisa':
        siguiente_input = 'fecha_primera_conciliacion_input';
        break;
      case 'fecha_primera_conciliacion_input':
        siguiente_input = 'campoBalanceLibro';
        break;
      case 'campoBalanceLibro':
        siguiente_input = 'campoBalanceBanco';
        break;
      case 'campoBalanceBanco':
        if (!this.formIsInvalid()) this.btn_aceptar();
        break;
    }

    if (is_enforcar) fun.enfocarInput(siguiente_input);
  }

  formIsInvalid() {
    let buttonIsDisable = this.formIsOnInitState();
    if (!buttonIsDisable) buttonIsDisable = this.formGroup.invalid;
    return buttonIsDisable;
  }

  validateSaveBtnState() {
    const buttonIsDisable = this.formIsInvalid();

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
