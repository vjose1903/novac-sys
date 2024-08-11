import { HtmlElementsService } from './../../../core/services/html-elements.service';
import { ImagenService } from './../../../core/services/imagen.service';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { tableCellType, table_config } from './../../components/new_tablas/tabla-class';
import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Permisos } from '../../../core/typescript/permisos';
import { TransferenciaC, TransferenciaI, TransferenciaType, anularTransferenciaModalId, nombreBancoTerceroConfig, transferenciaFormAttr, transferenciaFormFieldId, transferenciaTableId, transferenciasType } from './transferencia.utils';
import { fun } from '../../../core/services/functions.service';
import { DateUtils } from '../../../core/typescript/date.utils';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { CuentaBancariaC, CuentaBancariaI } from '../../registros/banco/cuenta-bancaria-form/cuenta_bancaria';
import { requestParameters } from '../../../core/typescript/crud-g';
import { PeriodoFiscalC } from '../../registros/periodo-fiscal/periodo-fiscal';
import { dropdownFilterFocusInput } from '../../../core/typescript/p-dropdown.utils';
import { DivisaService } from '../../registros/divisa/divisa.service';
import { ListaBancoC, ListBancoI } from '../../registros/banco/banco.utils';

@Component({
  selector: 'app-transferencias',
  templateUrl: './transferencias.component.html',
  styleUrls: ['./transferencias.component.scss'],
})
export class TransferenciasComponent extends MixinClass implements OnInit, OnDestroy {
  formGroup: UntypedFormGroup;
  formInitValue: TransferenciaI;
  botonLabel: string;
  isCreando: boolean;
  minDate: Date;
  maxDate: Date;
  permissions = Permisos;
  formPermissions = [Permisos.transferencia.create, Permisos.transferencia.update];

  transferenciaSelected: TransferenciaI;
  transferenciaList: Array<TransferenciaI> = [];

  cuentasBancariasList: Array<CuentaBancariaI> = [];

  transferenciaClass = new TransferenciaC();
  cuentaBancariaClass = new CuentaBancariaC();
  listaBancosClass = new ListaBancoC();
  peridoClass = new PeriodoFiscalC();

  fun = fun;
  transferenciaFormAttr = transferenciaFormAttr;
  selectedTransferenciaType = signal<TransferenciaType>(TransferenciaType.terceros);
  TransferenciaType = TransferenciaType;
  transferenciaFormFieldId = transferenciaFormFieldId;

  table_config: table_config = {
    info: [
      { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente', style: { 'text-align': 'left', width: '13%' } },
      { titulo: 'No. de cuenta', tipo: tableCellType.text, key: 'cuenta_bancaria.numero_cuenta', style: { 'text-align': 'left', width: '15%', 'padding-left': '0.3rem', 'padding-right': '0.3rem' } },
      { titulo: 'Banco', tipo: tableCellType.text, key: 'cuenta_bancaria.banco.nombre', style: { 'text-align': 'left', width: '25%' } },
      { titulo: 'Comentario', tipo: tableCellType.text, key: 'comentario', puntosSuspensivos: true, style: { 'text-align': 'left', 'padding-left': '0.3rem', width: '30%' } },
      { titulo: 'Monto', tipo: tableCellType.formatoNumero, key: 'monto', style: { 'text-align': 'right', width: '10%' } },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: tableCellType.icon,
        style: { 'text-align': 'center', width: '8rem' },
        iconsArray: [
          { key: 'edit_transferencia', tooltip: 'Editar', text_color: 'colorNegro' },
          { key: 'anular_transferencia', tooltip: 'Anular', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: transferenciaTableId,
    obj_paginate: { show: true, showTotal: true, showPaginator: false },
  };

  tablaComponent;
  transferenciasType = transferenciasType;
  nombreBancoTerceroConfig = nombreBancoTerceroConfig;

  htmlServ = inject(HtmlElementsService);

  bancosList: Array<ListBancoI> = [];

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService, public divisaServ: DivisaService, public imgServ: ImagenService) {
    super();

    effect(() => {
      this.nombreBancoTerceroConfig.required = this.selectedTransferenciaType() == TransferenciaType.terceros;
    });
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'transferencia', is_routing: true });
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

  test(a) {
    console.log('a:  ', a);
  }

  async necesarioStart() {
    this.initVariables();
    await this.getTransferencias(fun.deepCloning(this.tServ.obj_paginate.default));
    await this.createForm();
    await this.getCuentasBancarias();
    await this.getNombresBancos();
  }

  initVariables() {
    this.botonLabel = 'Guardar';
    this.isCreando = false;
    this.maxDate = new Date();
    this.minDate = undefined;
  }

  getTransferencias(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.transferenciaList.length = 0;

    this.transferenciaClass.getAll(extra).then((res) => {
      this.transferenciaList = res.data.map((transferencia: TransferenciaI) => {
        transferencia[transferenciaFormAttr.cuenta_bancaria_origen_id] = transferencia.cuenta_bancaria.id;
        transferencia[transferenciaFormAttr.divisa_id] = transferencia.divisa.id;

        transferencia.edit_transferencia = 'fas fa-pencil-alt';
        transferencia.anular_transferencia = 'fa-solid fa-ban';

        transferencia.customStyles = {
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 8rem !important;' },
            { key: 'edit_transferencia', estilos: 'font-size: 1.2rem !important' },
            { key: 'anular_transferencia', estilos: 'font-size: 1.2rem !important' },
          ],
        };
        return transferencia;
      });
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  createForm() {
    const divisa_principal = this.divisaServ.getDivisaPrincipalInfo();

    this.formGroup = this.fb.group({
      [transferenciaFormAttr.id]: [null],
      [transferenciaFormAttr.cuenta_bancaria_origen_id]: [{ value: null, disabled: true }, Validators.required],
      [transferenciaFormAttr.cuenta_bancaria_destino_id]: [{ value: null, disabled: true }],
      [transferenciaFormAttr.nombre_banco_tercero]: [{ value: null, disabled: true }, Validators.required],
      [transferenciaFormAttr.cuenta_bancaria_tercero]: [{ value: null, disabled: true }],
      [transferenciaFormAttr.divisa_id]: [{ value: divisa_principal ? divisa_principal.id : null, disabled: true }, Validators.required],
      [transferenciaFormAttr.monto]: [{ value: '', disabled: true }, Validators.required],
      [transferenciaFormAttr.comentario]: [{ value: '', disabled: true }, Validators.required],
      [transferenciaFormAttr.numero_referencia]: [{ value: '', disabled: true }],
      [transferenciaFormAttr.fecha_equivalente]: [{ value: '', disabled: false }, Validators.required],
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

  async getNombresBancos() {
    this.listaBancosClass.getAll().then((res) => (this.bancosList = res.data));
  }

  dropCuentaBancariaHide(dropdownCuenta, fieldId) {
    const formulario = this.formGroup.getRawValue();
    dropdownCuenta.hide;
    if (fun.hasValue(formulario[fieldId])) this.saltar(transferenciaFormFieldId[fieldId]);
  }

  dropCuentaBancariaFocus(drop) {
    dropdownFilterFocusInput(drop);
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
    if (sali_de != transferenciaFormFieldId.send) {
      let nextInput;

      if (this.formGroup.controls[transferenciaFormAttr.cuenta_bancaria_origen_id].enabled) {
        if (sali_de == transferenciaFormFieldId.fecha_equivalente) nextInput = transferenciaFormFieldId.cuenta_bancaria_origen_id;

        if (sali_de == transferenciaFormFieldId.cuenta_bancaria_origen_id) {
          if (this.selectedTransferenciaType() == TransferenciaType.misCuentas) nextInput = transferenciaFormFieldId.cuenta_bancaria_destino_id;
          else nextInput = this.nombreBancoTerceroConfig.fieldId;
        }

        if (sali_de == transferenciaFormFieldId.cuenta_bancaria_destino_id) nextInput = transferenciaFormFieldId.divisa_id;
        if (sali_de == this.nombreBancoTerceroConfig.fieldId) nextInput = transferenciaFormFieldId.cuenta_bancaria_tercero;
        if (sali_de == transferenciaFormFieldId.cuenta_bancaria_tercero) nextInput = transferenciaFormFieldId.divisa_id;
        if (sali_de == transferenciaFormFieldId.divisa_id) nextInput = transferenciaFormFieldId.monto;
        if (sali_de == transferenciaFormFieldId.monto) nextInput = transferenciaFormFieldId.numero_referencia;
        if (sali_de == transferenciaFormFieldId.numero_referencia) nextInput = transferenciaFormFieldId.comentario;

        if (fun.hasValue(nextInput)) setTimeout(() => fun.enfocarInput(nextInput), 100);
      } else {
        fun.enfocarInput(transferenciaFormAttr.fecha_equivalente);
      }
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
          this.formGroup.controls[transferenciaFormAttr.fecha_equivalente].setValue(null, { emitEvent: false });
          const fechaMostrar = DateUtils.format({ date: formulario.fecha_equivalente });
          const numMonth = formulario.fecha_equivalente.getMonth() + 1;
          const monthLabel = DateUtils.getMonthLabelByNum(numMonth);

          fun.toastError(`Para registrar una transferencia en la fecha: ${fechaMostrar}, debe de abrir el mes de ${fun.capitalice(monthLabel)}`);
        }
      });
    }
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = [
      transferenciaFormAttr.comentario,
      transferenciaFormAttr.cuenta_bancaria_origen_id,
      transferenciaFormAttr.divisa_id,
      transferenciaFormAttr.fecha_equivalente,
      transferenciaFormAttr.monto,
      transferenciaFormAttr.numero_referencia,
    ];

    const formValue = fun.pick(this.formGroup.getRawValue(), pick_values);
    const initValue = fun.pick(this.formInitValue, pick_values);

    return !fun.isEqual(formValue, initValue);
  }

  nuevoRegistro() {
    this.isCreando = true;
    setTimeout(() => fun.enfocarInput(transferenciaFormFieldId.fecha_equivalente), 500);
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'edit_transferencia') this.editarItem(params.data);
      if (params.iconKey == 'anular_transferencia') {
        const identifier = params.data.numero_referencia ?? params.data.comentario;

        this.confirmationModal({
          id: anularTransferenciaModalId,
          header: 'Confirmar',
          texto: `Seguro que desea <b class="negrita"> ANULAR </b> la Transferencia <b class="negrita">${identifier}</b>`,
          // texto: params.data.estado
          //   ? `Seguro que desea <b class="negrita"> DESACTIVAR </b> la divisa <b class="negrita">${params.data.nombre}</b>`
          //   : `Seguro que desea <b class="negrita"> REACTIVAR </b> la divisa <b class="negrita">${params.data.nombre}</b>`,
          siFunction: (instance) => {
            this.anularTransferencia(params.data);
            instance.dismissModal(instance.id);
          },
        });
      }
    }
  }

  anularTransferencia(data) {
    this.transferenciaClass.deleteOne(null, { afterPath: `anular/${data.id}` }).then((res) => {
      this.reloadTransferenciasInSamePage();
    });
  }

  editarItem(transferencia: TransferenciaI) {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();

    setTimeout(() => {
      this.botonLabel = 'Editar';
      this.enableDisableFields('enable');
      this.transferenciaSelected = fun.deepCloning(transferencia);
      this.transferenciaSelected.fecha_equivalente = this.transferenciaSelected.fecha_equivalente ? new Date(this.transferenciaSelected.fecha_equivalente) : null;
      this.transferenciaSelected.monto = this.transferenciaSelected.monto ? fun.roundNumberToDecimal(this.transferenciaSelected.monto) : null;

      this.formGroup.patchValue(this.transferenciaSelected);

      this.formInitValue = this.formGroup.getRawValue();
      this.verificateFieldsState();
      this.encapsulateMonth();
    }, 1);
  }

  encapsulateMonth() {
    if (fun.isEmpty(this.formGroup)) return;

    const formulario = this.formGroup.getRawValue();
    const currentDate = formulario[transferenciaFormAttr.fecha_equivalente];
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    this.minDate = DateUtils.getFirstDayOfMonth({ year: year, month: month });
    this.maxDate = month == DateUtils.getActualMonth() ? this.maxDate : DateUtils.getLastDayOfMonth({ year: year, month: month });
  }

  verificateFieldsState() {
    if (fun.isEmpty(this.formGroup)) return;

    const formulario = this.formGroup.getRawValue();
    const funct = fun.hasValue(formulario?.[transferenciaFormAttr.id]) ? 'disable' : 'enable';
    const fields = [transferenciaFormAttr.cuenta_bancaria_origen_id, transferenciaFormAttr.divisa_id];
    fields.forEach((field) => this.formGroup.controls[field][funct]());
  }

  enableDisableFields(func: 'enable' | 'disable') {
    const fields = [
      transferenciaFormAttr.cuenta_bancaria_origen_id,
      transferenciaFormAttr.cuenta_bancaria_destino_id,
      transferenciaFormAttr.divisa_id,
      transferenciaFormAttr.monto,
      transferenciaFormAttr.numero_referencia,
      transferenciaFormAttr.comentario,
      transferenciaFormAttr.nombre_banco_tercero,
      transferenciaFormAttr.cuenta_bancaria_tercero,
    ];
    fields.forEach((field) => this.formGroup.controls[field][func]({ emitEvent: false }));
  }

  borrar() {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();
    this.transferenciaSelected = undefined;
    this.enableDisableFields('disable');
    this.initVariables();
    this.isCreando = true;
  }

  requests() {
    const formulario = this.formGroup.getRawValue();
    const dataToSend = fun.deepCloning(formulario);
    dataToSend.fecha_equivalente = DateUtils.format({ date: formulario.fecha_equivalente, dateFormat: 'YYYY-MM-DD' });
    dataToSend.monto = fun.desformatearStNumber(formulario.monto);

    console.log('dataToSend ', dataToSend);

    this.transferenciaClass.createUpdateOne(dataToSend).then((res) => {
      this.reloadTransferenciasInSamePage();
      this.borrar();
    });
  }

  reloadTransferenciasInSamePage() {
    const actualPagination = this.tServ.getPaginationById(transferenciaTableId);
    this.getTransferencias(actualPagination);
  }
}
