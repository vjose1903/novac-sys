import { Permisos } from './../../../../core/typescript/permisos';
import { fun } from './../../../../core/services/functions.service';
import { DivisaService } from './../../divisa/divisa.service';
import { Component, OnInit } from '@angular/core';
import { ModalComponentI, ModalI } from '../../../components/modal/modal-class';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { getImgUrlServer } from '../../../../core/typescript/imagen.utils';
import { CuentaBancariaI, modalCuentaBancaria, modalCuentaBancariaBtnAceptar } from './cuenta_bancaria';
import { BancoI } from '../banco.utils';
import { TipoCuentaBancariaC, TipoCuentaBancariaI } from '../tipo-cuenta-bancaria/tipo_cuenta_bancaria';

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

  constructor(private fb: UntypedFormBuilder, public divisaServ: DivisaService) {
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
        id: [{ value: null, disabled: false }],
        banco_id: [{ value: null, disabled: false }],
        tipo_cuenta_bancaria_id: [{ value: null, disabled: false }, Validators.required],
        divisa_id: [{ value: cuenta ? null : divisa_principal ? divisa_principal.id : null, disabled: false }, Validators.compose([Validators.required])],
        fecha_apertura: [{ value: null, disabled: false }],
        numero_cuenta: [{ value: null, disabled: false }, Validators.compose([Validators.required])],
        balance_inicial_libro: [{ value: null, disabled: false }],
        balance_inicial_banco: [{ value: null, disabled: false }],
        fecha_primera_conciliacion: [{ value: null, disabled: false }],
        comentario: [{ value: null, disabled: false }],
        descripcion: [{ value: null, disabled: false }, Validators.required],
        cuenta_contable: [{ value: null, disabled: true }],
        nombre_cuenta: [{ value: null, disabled: true }],
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

  getImgUrlServer(fileName) {
    return getImgUrlServer(fileName);
  }

  getDivisaInfoById(id: number, property?: string) {
    const divisa = this.divisaServ.getDivisaInfoById(id);

    return fun.hasValue(property) ? fun.getProperty(divisa, property) : divisa;
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

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
