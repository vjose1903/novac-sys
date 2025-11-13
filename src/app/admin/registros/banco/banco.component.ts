import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { tableCellType, table_config } from '@components/new_tablas/tabla-class';
import { TablasService } from '@components/new_tablas/tablas.service';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { customValidators } from '@core/typescript/custom-validators';
import { Permisos } from '@core/typescript/permisos';
import { BancoC, bancoFormAttr, bancoFormFieldId, BancoI, ListaBancoC, ListBancoI, nombreBancoConfig } from './banco.utils';
import { CuentaBancariaFormComponent } from './cuenta-bancaria-form/cuenta-bancaria-form.component';
import { CuentaBancariaI, modalCuentaBancaria, modalCuentaBancariaBtnAceptar, modalTipoCuentaBancaria } from './cuenta-bancaria-form/cuenta_bancaria';
import { TipoCuentaBancariaComponent } from './tipo-cuenta-bancaria/tipo-cuenta-bancaria.component';
import { ImagenService } from '@core/services/imagen.service';
import { pairwise, startWith } from 'rxjs';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

@Component({
  selector: 'app-banco',
  templateUrl: './banco.component.html',
  styleUrls: ['./banco.component.scss'],
  standalone: false,
})
export class BancoComponent extends MixinClass implements OnInit, OnDestroy {
  formGroup: UntypedFormGroup;
  formInitialValue: any;
  isCreando: boolean = false;
  permissions = Permisos;
  formPermissions = [Permisos.banco.update, Permisos.banco.create];
  allPermisosTipoCuentaBancaria = Object.values(Permisos.tipo_cuenta_bancaria);

  listaBancos: Array<BancoI> = [];

  myValidators = new customValidators();
  bancoClass = new BancoC();
  listaBancosClass = new ListaBancoC();

  bancoFormAttr = bancoFormAttr;
  bancoFormFieldId = bancoFormFieldId;
  nombreBancoConfig = nombreBancoConfig;
  bancosList: Array<ListBancoI> = [];

  readFormChanges = false;

  table_config: table_config = {
    info: [
      { titulo: '1', tipo: tableCellType.icon, key: 'incomplete', style: { width: '2rem', color: 'var(--transparente00)' }, iconsArray: [{ key: 'incomplete', tooltip: 'Información Incompleta', text_color: 'incomplete_color' }] },
      { titulo: 'Nombre', tipo: tableCellType.text, key: 'nombre.nombre', style: { width: '45%', 'text-align': 'start' } },
      { titulo: 'Rnc', tipo: tableCellType.text, key: 'rnc' },
      { titulo: 'Telefono', tipo: tableCellType.text, key: 'telefono' },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: tableCellType.icon,
        style: { width: '11%', 'text-align': 'center' },
        iconsArray: [
          { key: 'edit_banco', rowTooltip: 'edit_banco_tooltip', text_color: 'colorNegro', disable: [{ kind: 'campo', target: 'estado', value: [false] }] },
          { key: 'delete_banco', rowTooltip: 'delete_banco_tooltip', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_banco',
    padre_functions: { data_request: params => this.getBancos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, is_local: false },
  };
  tablaComponent;

  htmlServ = inject(HtmlElementsService);
  public dynamicModalServ = inject(DynamicModalService);
  private fb = inject(UntypedFormBuilder);
  private tServ = inject(TablasService);
  public imgServ = inject(ImagenService);

  constructor() {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'banco', is_routing: true });

    this.necesarioStart();
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.createForm().then(async () => {
      await this.subscribeFormChanges();
      await this.getNombresBancos();
      await this.getBancos(this.tServ.obj_paginate.default);
    });
  }

  createForm() {
    return new Promise<void>(resolve => {
      this.formGroup = this.fb.group({
        id: [{ value: null, disabled: false }],
        [bancoFormAttr.nombre]: [{ value: null, disabled: false }, Validators.required],
        [bancoFormAttr.rnc]: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
        [bancoFormAttr.comentario]: [{ value: null, disabled: false }],
        [bancoFormAttr.telefono]: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
        [bancoFormAttr.direccion]: [{ value: null, disabled: false }],
        [bancoFormAttr.ejecutivo_cuenta]: [{ value: null, disabled: false }, Validators.required],
        [bancoFormAttr.telefono_ejecutivo_cuenta]: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
        [bancoFormAttr.cuentas_bancarias]: this.fb.array([]),
      });

      this.formInitialValue = this.formGroup.getRawValue();
      resolve();
    });
  }

  subscribeFormChanges() {
    this.formGroup.valueChanges.pipe(startWith(this.formGroup.value), pairwise()).subscribe(([previousValue, currentValue]) => {
      if (this.readFormChanges && !fun.isEqual(previousValue.nombre, currentValue.nombre)) {
        if (fun.isEmpty(currentValue.nombre)) this.formGroup.controls[bancoFormAttr.rnc].setValue(null, { emitEvent: false });
        else this.formGroup.controls[bancoFormAttr.rnc].setValue(currentValue.nombre.identificador, { emitEvent: false });
      }
    });
  }

  createItemCuentaBancaria(cuenta_bancaria?: CuentaBancariaI) {
    const scheduleForm = this.fb.group({
      id: [{ value: cuenta_bancaria ? cuenta_bancaria.id : null, disabled: false }],
      arrayId: [{ value: cuenta_bancaria ? (cuenta_bancaria.arrayId ? cuenta_bancaria.arrayId : fun.generateKey()) : fun.generateKey(), disabled: false }],
      banco_id: [{ value: cuenta_bancaria ? cuenta_bancaria.banco_id : null, disabled: false }],
      tipo_cuenta_bancaria_id: [{ value: cuenta_bancaria ? cuenta_bancaria.tipo_cuenta_bancaria_id : null, disabled: false }],
      divisa_id: [{ value: cuenta_bancaria ? cuenta_bancaria.divisa_id : null, disabled: false }],
      numero_cuenta: [{ value: cuenta_bancaria ? cuenta_bancaria.numero_cuenta : null, disabled: false }],
      comentario: [{ value: cuenta_bancaria ? cuenta_bancaria.comentario : null, disabled: false }],
      descripcion: [{ value: cuenta_bancaria ? cuenta_bancaria.descripcion : null, disabled: false }],
      fecha_primera_conciliacion: [{ value: cuenta_bancaria ? cuenta_bancaria.fecha_primera_conciliacion : null, disabled: false }],
      fecha_apertura: [{ value: cuenta_bancaria ? cuenta_bancaria.fecha_apertura : null, disabled: false }],
      balance_inicial_libro: [{ value: cuenta_bancaria ? cuenta_bancaria.balance_inicial_libro : null, disabled: false }],
      balance_inicial_banco: [{ value: cuenta_bancaria ? cuenta_bancaria.balance_inicial_banco : null, disabled: false }],
      cuenta_contable: [{ value: cuenta_bancaria ? (cuenta_bancaria?.cuenta_contable ? cuenta_bancaria.cuenta_contable.codigo : null) : null, disabled: false }],
      has_chequera: [{ value: cuenta_bancaria ? (cuenta_bancaria?.has_chequera ? cuenta_bancaria.has_chequera : false) : false, disabled: false }],
      nombre_cuenta: [{ value: cuenta_bancaria ? (cuenta_bancaria?.cuenta_contable ? cuenta_bancaria.cuenta_contable.descripcion : null) : null, disabled: false }],
      cuenta_contable_prima: [{ value: cuenta_bancaria ? (cuenta_bancaria?.cuenta_contable_prima ? cuenta_bancaria.cuenta_contable_prima.codigo : null) : null, disabled: false }],
      nombre_cuenta_prima: [{ value: cuenta_bancaria ? (cuenta_bancaria?.cuenta_contable_prima ? cuenta_bancaria.cuenta_contable_prima.descripcion : null) : null, disabled: false }],
    });

    return scheduleForm;
  }

  addItem(cuentaBancaria?: CuentaBancariaI) {
    return new Promise<void>(resolve => {
      const arrayCuentasBancarias = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
      arrayCuentasBancarias.push(this.createItemCuentaBancaria(cuentaBancaria));
      resolve();
    });
  }

  clearArrayCuentasBancarias() {
    const arrayCuentasBancarias = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
    arrayCuentasBancarias.clear();
  }

  fillCuentasBancarias(cuentas: Array<CuentaBancariaI>) {
    this.clearArrayCuentasBancarias();

    cuentas.forEach(cuenta => {
      this.addItem(cuenta);
    });
  }

  async getNombresBancos() {
    this.listaBancosClass.getAll().then(res => (this.bancosList = res.data));
  }

  editCuentaBancaria(previousData, editedData) {
    new Promise<void>((resolve, reject) => {
      Object.assign(previousData, editedData);

      const arrayCuentas = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
      const indexCuentaEdited = arrayCuentas.value.findIndex((schedule: any) => schedule.arrayId === editedData.arrayId);

      arrayCuentas.controls[indexCuentaEdited].patchValue(editedData);

      resolve();
    });
  }

  saltar(salioDe, valor?) {
    let siguiente_input = '';
    let is_enforcar = true;

    switch (salioDe) {
      case this.nombreBancoConfig.fieldId:
        siguiente_input = bancoFormFieldId[bancoFormAttr.rnc];
        break;
      case bancoFormFieldId[bancoFormAttr.rnc]:
        siguiente_input = bancoFormFieldId[bancoFormAttr.telefono];
        break;
      case bancoFormFieldId[bancoFormAttr.telefono]:
        siguiente_input = bancoFormFieldId[bancoFormAttr.comentario];
        break;
      case bancoFormFieldId[bancoFormAttr.comentario]:
        siguiente_input = bancoFormFieldId[bancoFormAttr.ejecutivo_cuenta];
        break;
      case bancoFormFieldId[bancoFormAttr.ejecutivo_cuenta]:
        siguiente_input = bancoFormFieldId[bancoFormAttr.telefono_ejecutivo_cuenta];
        break;
      case bancoFormFieldId[bancoFormAttr.telefono_ejecutivo_cuenta]:
        is_enforcar = false;
        siguiente_input = bancoFormFieldId.send;
        break;
    }

    if (is_enforcar) fun.enfocarInput(siguiente_input);
    else {
      if (siguiente_input == bancoFormFieldId.send) this.requests();
    }
  }

  removeItem(arrayId: string, index: number = null) {
    const arrayCuentasBancarias = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
    if (fun.isEmpty(index)) index = arrayCuentasBancarias.value.findIndex((cuenta: any) => cuenta.arrayId == arrayId);
    arrayCuentasBancarias.removeAt(index);
  }

  getBancos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.listaBancos.length = 0;

    this.bancoClass.getAll(extra).then(res => {
      res.data = res.data.map((banco: BancoI) => {
        banco = this.parseBanco(banco);
        banco.warning_bg = fun.isEmpty(banco.rnc) || fun.isEmpty(banco.telefono) || fun.isEmpty(banco.ejecutivo_cuenta) || fun.isEmpty(banco.telefono_ejecutivo_cuenta);
        banco.incomplete_color = 'warning';
        banco.incomplete = banco.warning_bg ? 'fas fa-exclamation-triangle' : '';

        banco.customStyles = {
          actions: [
            { key: 'edit_banco', estilos: 'font-size: 1.1rem !important' },
            { key: 'delete_banco', estilos: 'font-size: 1.1rem !important' },
          ],
        };
        return banco;
      });

      this.listaBancos = res.data;
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  parseBanco(bancoParsed) {
    bancoParsed.nombre = this.bancosList.find(banco => banco.nombre == bancoParsed.nombre);

    bancoParsed.edit_banco = 'fas fa-pencil-alt';
    bancoParsed.delete_banco = 'far fa-trash-alt';

    bancoParsed.edit_banco_tooltip = 'Editar';
    bancoParsed.delete_banco_tooltip = 'Borrar';

    return bancoParsed;
  }

  tableClickIcon(evento) {
    if ((evento.id_tabla = 'lista_banco')) {
      if (evento.iconKey == 'edit_banco') this.editItem(evento.data);
      if (evento.iconKey == 'delete_banco') this.eliminarReg(evento.data);
    }
  }

  editItem(data: BancoI) {
    this.readFormChanges = false;
    this.formGroup.patchValue(data, { emitEvent: false });
    this.fillCuentasBancarias(data.cuentas_bancarias);

    this.formInitialValue = this.formGroup.getRawValue();

    setTimeout(() => (this.readFormChanges = true), 500);
    this.isCreando = false;
  }

  eliminarReg(data) {
    const onYes = () => {
      const actualPagination = this.tServ.getPaginationById('lista_banco');
      this.bancoClass.deleteOne(data.id).then(res => this.getBancos(actualPagination));
    };

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: `¿Está seguro que desea eliminar el banco: <b> ${data.nombre} </b>?`,
      btnKind: confirmationButtons.cancelarEliminar,
      onYes: onYes.bind(this),
    });
  }

  nuevoRegistro() {
    this.isCreando = true;
    setTimeout(() => {
      fun.enfocarInput(this.nombreBancoConfig.fieldId);
      this.readFormChanges = true;
    }, 500);
  }

  test() {
    this.formIsOnInitState(true);
  }

  borrar(isCreando = true) {
    this.clearArrayCuentasBancarias();

    if (fun.hasValue(this.formGroup)) this.formGroup.reset();
    this.isCreando = isCreando;

    if (!this.isCreando) this.readFormChanges = false;
  }

  openModalCuentasBancarias(cuenta?: CuentaBancariaI) {
    //

    const modalConfig = new DynamicModalClass();
    modalConfig.id = modalCuentaBancaria;
    modalConfig.width = '40rem';
    modalConfig.component = CuentaBancariaFormComponent;
    modalConfig.inputs = { cuenta, banco: this.formGroup.getRawValue() };
    modalConfig.header = cuenta ? 'Actualizar cuenta bancaria' : 'Registro cuenta bancaria';

    modalConfig.botones = [
      { clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cancelar', disable: false },
      { id: modalCuentaBancariaBtnAceptar, clase: 'btn btn-verde', label: 'Aceptar', disable: true },
    ];

    modalConfig.setCallback((arg: ICallbackModal) => this.processCuentaBancaria(arg));
    modalConfig.show();
  }

  processCuentaBancaria(arg: ICallbackModal) {
    if (arg.type == modalCloseType.onHide) return;
    // TODO: revisar esto
    const cuentaBancaria = arg.data;

    const currentCuenta = this.formGroup.get('cuentas_bancarias').value.find(cuenta => cuenta.arrayId == cuentaBancaria.arrayId);
    const promisesArray = [];

    if (currentCuenta) promisesArray.push(this.editCuentaBancaria(currentCuenta, cuentaBancaria));
    else promisesArray.push(this.addItem(cuentaBancaria));

    Promise.all(promisesArray).then(res => {});
  }

  openModalTipoCuentasBancarias() {
    //
    const modalConfig = new DynamicModalClass();
    modalConfig.id = modalTipoCuentaBancaria;
    modalConfig.width = '70rem';
    modalConfig.component = TipoCuentaBancariaComponent;
    modalConfig.header = 'Tipos de cuentas bancarias';

    modalConfig.botones = [{ clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cancelar', disable: false }];

    modalConfig.show();
  }

  formIsInvalid() {
    let res = this.formGroup.invalid || this.formIsOnInitState();

    return res;
  }

  formIsOnInitState(log = false) {
    const pick_values = ['nombre', 'rnc', 'telefono', 'comentario', 'ejecutivo_cuenta', 'telefono_ejecutivo_cuenta'];
    const formValue = fun.pick(this.formGroup.getRawValue(), pick_values);

    const originalValue = fun.pick(this.formInitialValue, pick_values);
    const bancoIsOnInitState = fun.isEqual(formValue, originalValue);

    let cuentasIsOnInitState = this.formInitialValue?.cuentas_bancarias.length == this.formGroup.getRawValue().cuentas_bancarias.length;

    const pick_values_cuenta = [
      'arrayId',
      'banco_id',
      'tipo_cuenta_bancaria_id',
      'divisa_id',
      'numero_cuenta',
      'comentario',
      'descripcion',
      'fecha_primera_conciliacion',
      'fecha_apertura',
      'balance_inicial_libro',
      'balance_inicial_banco',
      'has_chequera',
    ];

    const initialCuentasIndexed = this.formInitialValue?.cuentas_bancarias.reduce((acc, item) => {
      acc[item.arrayId] = fun.pick(item, pick_values_cuenta);
      return acc;
    }, {});

    for (const formCuentaBancaria of this.formGroup.getRawValue().cuentas_bancarias) {
      const formCuentaBancariaPicked = fun.pick(formCuentaBancaria, pick_values_cuenta);
      const initialCurrentCuenta = initialCuentasIndexed[formCuentaBancaria.arrayId];

      cuentasIsOnInitState = fun.isEqual(formCuentaBancariaPicked, initialCurrentCuenta);

      if (!cuentasIsOnInitState) break;
    }

    return bancoIsOnInitState && cuentasIsOnInitState;
  }

  requests() {
    let formValue = this.formGroup.getRawValue();

    formValue.cuentas_bancarias.map((cuenta_bancaria: CuentaBancariaI) => {
      let cuenta_parsed = cuenta_bancaria;
      if (fun.isEmpty(cuenta_bancaria)) delete cuenta_parsed.id;
      delete cuenta_parsed.arrayId;

      return cuenta_parsed;
    });

    if (typeof formValue.nombre != 'string') formValue.nombre = formValue.nombre.nombre;

    this.bancoClass.createUpdateOne(formValue).then(res => {
      const actualPagination = this.tServ.getPaginationById('lista_banco');
      this.getBancos(actualPagination);
      this.borrar(false);
    });
  }
}
