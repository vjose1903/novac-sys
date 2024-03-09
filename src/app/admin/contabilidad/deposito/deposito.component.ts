import { ImagenService } from './../../../core/services/imagen.service';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { table_config } from './../../components/new_tablas/tabla-class';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Permisos } from '../../../core/typescript/permisos';
import { DepositoC, DepositoI, depositoFormAttr, depositoFormFieldId } from './deposito.utils';
import { fun } from '../../../core/services/functions.service';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { CuentaBancariaC, CuentaBancariaI } from '../../registros/banco/cuenta-bancaria-form/cuenta_bancaria';
import { requestParameters } from '../../../core/typescript/crud-g';
import { PeriodoFiscalC } from '../../registros/periodo-fiscal/periodo-fiscal';
import { dropdownFilterFocusInput } from '../../../core/typescript/p-dropdown.utils';
import { DivisaService } from '../../registros/divisa/divisa.service';

@Component({
  selector: 'app-deposito',
  templateUrl: './deposito.component.html',
  styleUrls: ['./deposito.component.scss'],
})
export class DepositoComponent extends MixinClass implements OnInit, OnDestroy {
  formGroup: UntypedFormGroup;
  formInitValue: DepositoI;
  botonLabel: string = 'Guardar';
  isCreando: boolean = false;
  maxDate: Date;
  permissions = Permisos;
  formPermissions = [Permisos.deposito.create, Permisos.deposito.update];

  depositoSelected: DepositoI;
  depositoList: Array<DepositoI> = [];

  cuentasBancariasList: Array<CuentaBancariaI> = [];

  depositoClass = new DepositoC();
  cuentaBancariaClass = new CuentaBancariaC();
  peridoClass = new PeriodoFiscalC();

  fun = fun;
  depositoFormAttr = depositoFormAttr;
  depositoFormFieldId = depositoFormFieldId;

  table_config: table_config = {
    info: [
      { titulo: '', tipo: 'tag', key: 'es_principal', tag_color: 'green', tooltip: 'Divisa Principal', tag_apretada: true, estilos: [{ width: '2rem' }] },
      { titulo: 'Imagen', tipo: 'img', key: 'img_divisa', estilos: [{ 'padding-left': '0.5rem' }, { 'padding-right': '0.5rem' }, { width: '5rem' }] },
      { titulo: 'Simbolo', tipo: 'text', key: 'simbolo', estilos: [{ width: '10%' }] },
      { titulo: 'Nombre', tipo: 'text', key: 'nombre', estilos: [{ 'text-align': 'left' }, { 'padding-left': '0.3rem' }] },
      { titulo: 'Tasa actual', tipo: 'text', key: 'tasa_actual', estilos: [{ 'text-align': 'center' }, { width: '8%' }] },
      { titulo: 'Estado', tipo: 'tag', key: 'status', row_tag_color: 'status_tag_color', estilos: [{ 'text-align': 'center' }, { width: '10%' }] },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: 'icon',
        estilos: [{ 'text-align': 'center' }, { width: '7rem' }],
        iconsArray: [
          { key: 'edit_divisa', rowTooltip: 'edit_divisa_tooltip', text_color: 'colorNegro', disable: [{ kind: 'campo', target: 'estado', value: [false] }] },
          { key: 'currency_change', rowTooltip: 'currency_change_tooltip', text_color: 'colorNegro', disable: [{ kind: 'campo', target: 'estado', value: [false] }] },
          { key: 'deactivate_reactivate_divisa', rowTooltip: 'deactivate_reactivate_divisa_tooltip', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_divisa',
    obj_paginate: { show: true, showTotal: true, showPaginator: false },
  };
  tablaComponent;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService, public divisaServ: DivisaService, public imgServ: ImagenService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'deposito', is_routing: true });

    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    this.initVariables();
    await this.getDepositos(fun.deepCloning(this.tServ.obj_paginate.default));
    await this.createForm();
    await this.getCuentasBancarias();
  }

  initVariables() {
    this.maxDate = new Date();
  }

  getDepositos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.depositoList.length = 0;

    this.depositoClass.getAll(extra).then((res) => {
      this.depositoList = res.data.map((banco) => {
        // banco = this.parseBanco(banco);
        return banco;
      });
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  createForm() {
    const divisa_principal = this.divisaServ.getDivisaPrincipalInfo();
    console.log('divisa_principal ', divisa_principal);

    this.formGroup = this.fb.group({
      [depositoFormAttr.id]: [null],
      [depositoFormAttr.cuenta_bancaria_id]: [{ value: null, disabled: true }, Validators.required],
      [depositoFormAttr.divisa_id]: [{ value: divisa_principal ? divisa_principal.id : null, disabled: true }, Validators.required],
      [depositoFormAttr.monto]: [{ value: '', disabled: true }, Validators.required],
      [depositoFormAttr.comentario]: [{ value: '', disabled: true }, Validators.required],
      [depositoFormAttr.numero_referencia]: [{ value: '', disabled: true }],
      [depositoFormAttr.fecha_equivalente]: [{ value: '', disabled: false }, Validators.required],
    });
    this.formInitValue = this.formGroup.getRawValue();
  }

  async getCuentasBancarias() {
    const res = await this.cuentaBancariaClass.getAll();
    this.cuentasBancariasList = res.data.map((cuenta: CuentaBancariaI) => {
      cuenta.banco_name = cuenta.banco.nombre;
      cuenta.label = `${cuenta.banco_name} - ${cuenta.numero_cuenta}`;
      return cuenta;
    });
  }

  dropCuentaBancariaHide(arg) {
    const formulario = this.formGroup.getRawValue();

    if (fun.hasValue(formulario[depositoFormAttr.cuenta_bancaria_id])) this.saltar(depositoFormFieldId.cuenta_bancaria_id);
  }

  dropCuentaBancariaFocus(drop) {
    dropdownFilterFocusInput(drop);
  }

  showDivisaDrop(event, dropdown) {
    if (fun.hasValue(event.relatedTarget)) dropdown.show();
  }

  formatearMonto(formFieldName) {
    const input = this.formGroup.controls[formFieldName];
    fun.revisarNumber(input, formFieldName).then((res) => {
      input.setValue(res.error ? '' : res.number);
    });
  }

  desformatearMonto(formFieldName) {
    const input = this.formGroup.controls[formFieldName];
    const value = fun.is_number(input.value) ? fun.desformatearStNumber(input.value) : null;
    input.setValue(value);
    fun.enfocarAndSelectInput(formFieldName);
  }

  saltar(sali_de) {
    if (sali_de != depositoFormFieldId.send) {
      let nextInput;

      if (sali_de == depositoFormFieldId.cuenta_bancaria_id) nextInput = depositoFormFieldId.divisa_id;
      if (sali_de == depositoFormFieldId.divisa_id) nextInput = depositoFormFieldId.monto;
      if (sali_de == depositoFormFieldId.monto) nextInput = depositoFormFieldId.numero_referencia;
      if (sali_de == depositoFormFieldId.numero_referencia) nextInput = depositoFormFieldId.comentario;

      if (fun.hasValue(nextInput)) setTimeout(() => fun.enfocarInput(nextInput), 100);
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.requests(), 250);
    }
  }

  formIsInvalid() {
    let res = false;

    if (this.formGroup.invalid || !this.checkIfSomethingIsDiferrent()) {
      res = true;
    }

    return res;
  }

  validateOpenPeriod() {
    const formulario = this.formGroup.getRawValue();

    if (fun.hasValue(formulario.fecha_equivalente)) {
      const fecha_equivalente = fun.my_dateFormater(formulario.fecha_equivalente, false);

      const requestParameters: requestParameters = { afterPath: 'custom/is_open_month', parameters: { fecha: fecha_equivalente } };
      this.peridoClass.getAll(requestParameters).then((response) => {
        this.enableDisableFields(response.data.isOpen ? 'enable' : 'disable');

        if (!response.data.isOpen) {
          const fechaMostrar = fun.my_dateFormater(formulario.fecha_equivalente);
          const numMonth = formulario.fecha_equivalente.getMonth() + 1;
          const monthLabel = PeriodoFiscalC.getMonthLabelByNum(numMonth);

          fun.toastError(`Para registrar un deposito en la fecha: ${fechaMostrar}, debe de abrir el mes de ${fun.capitalice(monthLabel)}`);
        }
      });
    }
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = [depositoFormAttr.comentario, depositoFormAttr.cuenta_bancaria_id, depositoFormAttr.divisa_id, depositoFormAttr.fecha_equivalente, depositoFormAttr.monto, depositoFormAttr.numero_referencia];

    const formValue = fun.pick(this.formGroup.getRawValue(), pick_values);
    const initValue = fun.pick(this.formInitValue, pick_values);

    return !fun.isEqual(formValue, initValue);
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'edit_divisa') this.editarItem(params.data);
    }
  }

  editarItem(deposito: DepositoI) {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();

    setTimeout(() => {
      this.botonLabel = 'Editar';
      this.enableDisableFields('enable');
      this.depositoSelected = fun.deepCloning(deposito);
      this.formGroup.patchValue(deposito);

      this.formInitValue = this.formGroup.getRawValue();
    }, 1);
  }

  enableDisableFields(func: 'enable' | 'disable') {
    const fields = [depositoFormAttr.cuenta_bancaria_id, depositoFormAttr.divisa_id, depositoFormAttr.monto, depositoFormAttr.numero_referencia, depositoFormAttr.comentario];
    fields.forEach((field) => this.formGroup.controls[field][func]());
  }

  borrar() {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();
    this.depositoSelected = undefined;
    this.enableDisableFields('disable');
    this.botonLabel = 'Guardar';
    this.isCreando = true;
  }

  requests() {
    const formulario = this.formGroup.getRawValue();
    const dataToSend = fun.deepCloning(formulario);
    dataToSend.fecha_equivalente = fun.my_dateFormater(formulario.fecha_equivalente, false);
    console.log('dataToSend ', dataToSend);

    // this.depositoClass.createUpdateOne(formValue).then((res) => {
    //   this.getDepositos();
    //   this.borrar();
    // });
  }
}
