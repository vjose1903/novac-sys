import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { DivisaService } from '../../registros/divisa/divisa.service';
import { fun } from '../../../core/services/functions.service';
import { anularChequeModalId, ChequeC, chequeFormAttr, chequeFormFieldId, ChequeI, chequeTableId } from './cheque.utils';
import { table_config, tableCellType } from '../../components/new_tablas/tabla-class';
import { CuentaBancariaC, CuentaBancariaI } from '../../registros/banco/cuenta-bancaria-form/cuenta_bancaria';
import { PeriodoFiscalC } from '../../registros/periodo-fiscal/periodo-fiscal';
import { DateUtils } from '../../../core/typescript/date.utils';
import { requestParameters } from '../../../core/typescript/crud-g';
import { dropdownFilterFocusInput } from '../../../core/typescript/p-dropdown.utils';
import { HtmlElementsService } from '../../../core/services/html-elements.service';
import { ImagenService } from '../../../core/services/imagen.service';
import { Permisos } from '../../../core/typescript/permisos';

@Component({
  selector: 'app-cheque',
  templateUrl: './cheque.component.html',
  styleUrl: './cheque.component.scss',
})
export class ChequeComponent extends MixinClass implements OnInit, OnDestroy {
  botonLabel: string;
  isCreando: boolean;
  minDate: Date;
  maxDate: Date;
  permissions = Permisos;
  formPermissions = [Permisos.cheque.create, Permisos.cheque.update];

  formGroup!: UntypedFormGroup;
  formInitValue: ChequeI;
  chequeFormAttr = chequeFormAttr;
  chequeFormFieldId = chequeFormFieldId;
  dropdownFilterFocusInput = dropdownFilterFocusInput;

  chequeClass = new ChequeC();
  cuentaBancariaClass = new CuentaBancariaC();
  peridoClass = new PeriodoFiscalC();

  fun = fun;

  chequeSelected: ChequeI;
  chequeList: Array<ChequeI> = [];

  cuentasBancariasList = signal<Array<CuentaBancariaI>>([]);

  cuentasBancariasFilteredList = computed(() => {
    // return this.cuentasBancariasList().filter((cuenta) => cuenta.id != this.cuentaBancariaOrigenSelected());
  });

  table_config: table_config = {
    info: [
      { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente', style: { 'text-align': 'left', width: '6rem' } },
      { titulo: 'Concepto', tipo: tableCellType.text, key: 'comentario', puntosSuspensivos: true, lineClamp: 3, style: { 'text-align': 'left', 'padding-left': '0.3rem', width: '60%' } },
      { titulo: 'Monto', tipo: tableCellType.formatoNumero, key: 'monto', style: { 'text-align': 'right', width: '20%' } },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: tableCellType.icon,
        style: { 'text-align': 'center', width: '8rem' },
        iconsArray: [
          { key: 'edit_cheque', tooltip: 'Editar', text_color: 'colorNegro' },
          { key: 'anular_cheque', tooltip: 'Anular', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: chequeTableId,
    obj_paginate: { show: true, showTotal: true, showPaginator: false },
  };

  tablaComponent;

  htmlServ = inject(HtmlElementsService);
  imgServ = inject(ImagenService);

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService, public divisaServ: DivisaService) {
    super();

  }
  
  ngOnInit(): void {
    this._init_mixin({ component: 'cheque', is_routing: true });
    this.necesarioStart();
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  async necesarioStart() {
    this.initVariables();
    await this.getCheques(fun.deepCloning(this.tServ.obj_paginate.default));
    await this.createForm().then(() => this.subscribeFormChanges());
    await this.getCuentasBancarias();
  }

  initVariables() {
    this.botonLabel = 'Guardar';
    this.isCreando = false;
    this.maxDate = new Date();
    this.minDate = undefined;
  }

  getCheques(params?: { per_page?: number; page?: number; search?: string }) {
    if (!params) params = {};
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.chequeList.length = 0;

    this.chequeClass.getAll(extra).then((res) => {
      console.log("res ", res.data);
      
      this.chequeList = res.data.map((cheque: ChequeI) => {
        // cheque[chequeFormAttr.cuenta_bancaria_origen_id] = cheque.cuenta_bancaria_origen.id;
        cheque[chequeFormAttr.divisa_id] = cheque.divisa.id;

        cheque.edit_cheque = 'fas fa-pencil-alt';
        cheque.anular_cheque = 'fa-solid fa-ban';

        cheque.customStyles = {
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 8rem !important;' },
            { key: 'edit_cheque', estilos: 'font-size: 1.1rem !important' },
            { key: 'anular_cheque', estilos: 'font-size: 1.1rem !important' },
          ],
        };
        return cheque;
      });

      console.log("chequeList ", this.chequeList);
      
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  createForm() {
    return new Promise<void>((resolve) => {
      const divisa_principal = this.divisaServ.getDivisaPrincipalInfo();

      this.formGroup = this.fb.group({
        [chequeFormAttr.id]: [null],
        [chequeFormAttr.cuenta_bancaria_id]: [{ value: null, disabled: true }, Validators.required],
        [chequeFormAttr.divisa_id]: [{ value: divisa_principal ? divisa_principal.id : null, disabled: true }, Validators.required],
        [chequeFormAttr.monto]: [{ value: '', disabled: true }, Validators.required],
        [chequeFormAttr.comentario]: [{ value: '', disabled: true }, Validators.required],
        [chequeFormAttr.fecha_equivalente]: [{ value: '', disabled: false }, Validators.required],
      });

      this.formInitValue = this.formGroup.getRawValue();
      resolve();
    });
  }

  subscribeFormChanges() {
    this.formGroup.valueChanges.subscribe((changes) => {
      console.log('changes ', changes);
    });
  }

  verificateFieldsState() {
    if (fun.isEmpty(this.formGroup)) return;

    const formulario = this.formGroup.getRawValue();
    const funct = fun.hasValue(formulario?.[chequeFormAttr.id]) ? 'disable' : 'enable';
    const fields = [chequeFormAttr.divisa_id];
    fields.forEach((field) => this.formGroup.controls[field][funct]());
  }

  enableDisableFields(func: 'enable' | 'disable') {
    const fields = [
      chequeFormAttr.cuenta_bancaria_id,
      chequeFormAttr.divisa_id,
      chequeFormAttr.monto,
      chequeFormAttr.comentario,
    ];
    fields.forEach((field) => this.formGroup.controls[field][func]({ emitEvent: false }));
  }

  formIsInvalid() {
    let res = false;

    if (this.formGroup.invalid || !this.checkIfSomethingIsDiferrent()) {
      res = true;
    }

    return res;
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = [chequeFormAttr.comentario, chequeFormAttr.cuenta_bancaria_id, chequeFormAttr.divisa_id, chequeFormAttr.fecha_equivalente, chequeFormAttr.monto];

    const formValue = fun.pick(this.formGroup.getRawValue(), pick_values);
    const initValue = fun.pick(this.formInitValue, pick_values);

    return !fun.isEqual(formValue, initValue);
  }

  async getCuentasBancarias() {
    const res = await this.cuentaBancariaClass.getAll();
    const cuentasBancarias = res.data.map((cuenta: CuentaBancariaI) => {
      cuenta.banco_name = cuenta.banco.nombre;
      cuenta.label = `${cuenta.banco_name} - ${cuenta.numero_cuenta}`;
      cuenta.disabled = !cuenta.has_chequera;
      return cuenta;
    });

    this.cuentasBancariasList.set(cuentasBancarias);
  }

  tableClickIcon(params) {
    const data = params.data;

    if (params.columnKey == 'actions') {
      if (params.iconKey == 'edit_transferencia') this.editarItem(data);
      if (params.iconKey == 'anular_transferencia') this.aunlarItem(data);
    }
  }

  aunlarItem(cheque: ChequeI) {
    this.validateOpenPeriod(DateUtils.parse(cheque.fecha_equivalente), 'anulate').then(() => {
      const identifier = cheque.numero_referencia || cheque.comentario;

      const anularFunction = (data) => {
        this.chequeClass.deleteOne(null, { afterPath: `anular/${data.id}` }).then((res) => {
          this.reloadChequesInSamePage();
        });
      };

      this.confirmationModal({
        id: anularChequeModalId,
        header: 'Confirmar',
        texto: `Seguro que desea <b class="negrita"> ANULAR </b> el Cheque.<br /><br /><b class="negrita">Origen:</b> ${cheque.cuenta_bancaria_origen.info_completa}<br /><b class="negrita">Destino:</b> ${cheque.destino_info_completa}<br /><br />${identifier}`,
        siFunction: (instance) => {
          anularFunction(cheque);
          instance.dismissModal(instance.id);
        },
      });
    });
  }

  editarItem(cheque: ChequeI) {
    this.validateOpenPeriod(DateUtils.parse(cheque.fecha_equivalente), 'update').then(() => {
      if (fun.hasValue(this.formGroup)) this.formGroup.reset();

      setTimeout(() => {
        this.botonLabel = 'Editar';
        this.enableDisableFields('enable');
        this.chequeSelected = fun.deepCloning(cheque);
        this.chequeSelected.fecha_equivalente = this.chequeSelected.fecha_equivalente ? DateUtils.parse(this.chequeSelected.fecha_equivalente) : null;
        this.chequeSelected.monto = this.chequeSelected.monto ? fun.roundNumberToDecimal(this.chequeSelected.monto) : null;

        this.formGroup.patchValue(this.chequeSelected);

        this.formInitValue = this.formGroup.getRawValue();
        this.verificateFieldsState();
        this.encapsulateMonth();
      }, 1);
    });
  }

  encapsulateMonth() {
    if (fun.isEmpty(this.formGroup)) return;

    const formulario = this.formGroup.getRawValue();
    const currentDate = formulario[chequeFormAttr.fecha_equivalente];
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    this.minDate = DateUtils.getFirstDayOfMonth({ year: year, month: month });
    this.maxDate = month == DateUtils.getActualMonth() ? this.maxDate : DateUtils.getLastDayOfMonth({ year: year, month: month });
  }

  nuevoRegistro() {
    this.isCreando = true;
    setTimeout(() => fun.enfocarInput(chequeFormFieldId.fecha_equivalente), 500);
  }

  saltar(sali_de) {
    if (sali_de != chequeFormFieldId.send) {
      let nextInput;

      if (this.formGroup.controls[chequeFormAttr.cuenta_bancaria_id].enabled) {
        if (sali_de == chequeFormFieldId.fecha_equivalente) nextInput = chequeFormFieldId.cuenta_bancaria_id;
        if (sali_de == chequeFormFieldId.cuenta_bancaria_id) nextInput = chequeFormFieldId.divisa_id;
        if (sali_de == chequeFormFieldId.divisa_id) nextInput = chequeFormFieldId.monto;
        if (sali_de == chequeFormFieldId.monto) nextInput = chequeFormFieldId.comentario;

        if (fun.hasValue(nextInput)) setTimeout(() => fun.enfocarInput(nextInput), 100);
      } else {
        fun.enfocarInput(chequeFormAttr.fecha_equivalente);
      }
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.requests(), 250);
    }
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

  dropCuentaBancariaHide(dropdownCuenta, fieldId) {
    const formulario = this.formGroup.getRawValue();
    dropdownCuenta.hide;
    if (fun.hasValue(formulario[fieldId])) this.saltar(chequeFormFieldId[fieldId]);
  }

  validateOpenPeriod(date?: any, type?: 'create' | 'update' | 'anulate') {
    return new Promise<void>((resolve, reject) => {
      const formulario = this.formGroup.getRawValue();
      date ??= formulario.fecha_equivalente;

      if (fun.hasValue(date)) {
        const fecha_equivalente = DateUtils.format({ date: date, dateFormat: 'YYYY-MM-DD' });

        const requestParameters: requestParameters = { afterPath: 'custom/is_open_month', parameters: { fecha: fecha_equivalente } };
        this.peridoClass.getAll(requestParameters).then((response) => {
          this.enableDisableFields(response.data.isOpen ? 'enable' : 'disable');

          if (!response.data.isOpen) {
            this.formGroup.controls[chequeFormAttr.fecha_equivalente].setValue(null, { emitEvent: false });
            const fechaMostrar = DateUtils.format({ date: date });
            const numMonth = date.getMonth() + 1;
            const monthLabel = DateUtils.getMonthLabelByNum(numMonth);

            fun.toastError(`Para ${fun.isEmpty(type) || type == 'create' ? 'registrar' : type == 'update' ? 'editar' : 'anular'} un cheque en la fecha: ${fechaMostrar}, debe de abrir el mes de ${fun.capitalice(monthLabel)}`);
            reject();
          } else {
            resolve();
          }
        });
      } else {
        reject();
      }
    });
  }

  borrar() {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();
    this.chequeSelected = undefined;
    this.enableDisableFields('disable');
    this.initVariables();
    this.isCreando = true;
  }

  requests() {
    const formulario = this.formGroup.getRawValue();
    const dataToSend = fun.deepCloning(formulario);
    dataToSend.fecha_equivalente = DateUtils.format({ date: formulario.fecha_equivalente, dateFormat: 'YYYY-MM-DD' });
    dataToSend.monto = fun.desformatearStNumber(formulario.monto);

    this.chequeClass.createUpdateOne(dataToSend).then((res) => {
      this.reloadChequesInSamePage();
      this.borrar();
    });
  }

  reloadChequesInSamePage() {
    const actualPagination = this.tServ.getPaginationById(chequeTableId);
    this.getCheques(actualPagination);
  }
}
