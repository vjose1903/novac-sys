import { ImagenService } from './../../../core/services/imagen.service';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { tableCellType, table_config } from './../../components/new_tablas/tabla-class';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Permisos } from '../../../core/typescript/permisos';
import { DepositoC, DepositoI, depositoFormAttr, depositoFormFieldId, depositoTableId } from './deposito.utils';
import { fun } from '../../../core/services/functions.service';
import { DateUtils } from '../../../core/typescript/date.utils';
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
  botonLabel: string;
  isCreando: boolean;
  minDate: Date;
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
      { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente', style: { 'text-align': 'left', width: '10%' } },
      { titulo: 'Banco', tipo: tableCellType.text, key: 'cuenta_bancaria.banco.nombre', style: { 'text-align': 'left', 'padding-left': '0.3rem' } },
      { titulo: 'No. de cuenta', tipo: tableCellType.text, key: 'cuenta_bancaria.numero_cuenta', style: { 'text-align': 'left' } },
      { titulo: 'Comentario', tipo: tableCellType.text, key: 'comentario', puntosSuspensivos: true, style: { 'text-align': 'left', width: '40%' } },
      { titulo: 'Monto', tipo: tableCellType.formatoNumero, key: 'monto', style: { 'text-align': 'right', width: '10%' } },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: tableCellType.icon,
        style: { 'text-align': 'center', width: '8rem' },
        iconsArray: [
          { key: 'edit_deposito', tooltip: 'Editar', text_color: 'colorNegro' },
          { key: 'anular_deposito', tooltip: 'Anular', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: depositoTableId,
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
    this.botonLabel = 'Guardar';
    this.isCreando = false;
    this.maxDate = new Date();
    this.minDate = undefined;
  }

  getDepositos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.depositoList.length = 0;

    this.depositoClass.getAll(extra).then((res) => {
      this.depositoList = res.data.map((deposito: DepositoI) => {
        deposito[depositoFormAttr.cuenta_bancaria_id] = deposito.cuenta_bancaria.id;
        deposito[depositoFormAttr.divisa_id] = deposito.divisa.id;

        deposito.edit_deposito = 'fas fa-pencil-alt';
        deposito.anular_deposito = 'fa-solid fa-ban';

        deposito.customStyles = {
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 8rem !important;' },
            { key: 'edit_deposito', estilos: 'font-size: 1.2rem !important' },
            { key: 'anular_deposito', estilos: 'font-size: 1.2rem !important' },
          ],
        };
        return deposito;
      });
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  createForm() {
    const divisa_principal = this.divisaServ.getDivisaPrincipalInfo();

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
      const fecha_equivalente = DateUtils.format({ date: formulario.fecha_equivalente, dateFormat: 'YYYY-MM-DD' });

      const requestParameters: requestParameters = { afterPath: 'custom/is_open_month', parameters: { fecha: fecha_equivalente } };
      this.peridoClass.getAll(requestParameters).then((response) => {
        this.enableDisableFields(response.data.isOpen ? 'enable' : 'disable');

        if (!response.data.isOpen) {
          this.formGroup.controls[depositoFormAttr.fecha_equivalente].setValue(null, { emitEvent: false });
          const fechaMostrar = DateUtils.format({ date: formulario.fecha_equivalente });
          const numMonth = formulario.fecha_equivalente.getMonth() + 1;
          const monthLabel = DateUtils.getMonthLabelByNum(numMonth);

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
      if (params.iconKey == 'edit_deposito') this.editarItem(params.data);
      if (params.iconKey == 'anular_deposito') this.editarItem(params.data);
    }
  }

  editarItem(deposito: DepositoI) {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();

    setTimeout(() => {
      this.botonLabel = 'Editar';
      this.enableDisableFields('enable');
      this.depositoSelected = fun.deepCloning(deposito);
      this.depositoSelected.fecha_equivalente = this.depositoSelected.fecha_equivalente ? new Date(this.depositoSelected.fecha_equivalente) : null;
      this.depositoSelected.monto = this.depositoSelected.monto ? fun.roundNumberToDecimal(this.depositoSelected.monto) : null;

      this.formGroup.patchValue(this.depositoSelected);

      this.formInitValue = this.formGroup.getRawValue();
      this.verificateFieldsState();
      this.encapsulateMonth();
    }, 1);
  }

  encapsulateMonth() {
    if (fun.isEmpty(this.formGroup)) return;

    const formulario = this.formGroup.getRawValue();
    const currentDate = formulario[depositoFormAttr.fecha_equivalente];
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    this.minDate = DateUtils.getFirstDayOfMonth({ year: year, month: month });
    this.maxDate = month == DateUtils.getActualMonth() ? this.maxDate : DateUtils.getLastDayOfMonth({ year: year, month: month });
  }

  verificateFieldsState() {
    if (fun.isEmpty(this.formGroup)) return;

    const formulario = this.formGroup.getRawValue();
    const funct = fun.hasValue(formulario?.[depositoFormAttr.id]) ? 'disable' : 'enable';
    const fields = [depositoFormAttr.cuenta_bancaria_id, depositoFormAttr.divisa_id];
    fields.forEach((field) => this.formGroup.controls[field][funct]());
  }

  enableDisableFields(func: 'enable' | 'disable') {
    const fields = [depositoFormAttr.cuenta_bancaria_id, depositoFormAttr.divisa_id, depositoFormAttr.monto, depositoFormAttr.numero_referencia, depositoFormAttr.comentario];
    fields.forEach((field) => this.formGroup.controls[field][func]());
  }

  borrar() {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();
    this.depositoSelected = undefined;
    this.enableDisableFields('disable');
    this.initVariables();
    this.isCreando = true;
  }

  requests() {
    const formulario = this.formGroup.getRawValue();
    const dataToSend = fun.deepCloning(formulario);
    dataToSend.fecha_equivalente = DateUtils.format({ date: formulario.fecha_equivalente, dateFormat: 'YYYY-MM-DD' });
    dataToSend.monto = fun.desformatearStNumber(formulario.monto);

    this.depositoClass.createUpdateOne(dataToSend).then((res) => {
      const actualPagination = this.tServ.getPaginationById(depositoTableId);
      this.getDepositos(actualPagination);
      this.borrar();
    });
  }
}
