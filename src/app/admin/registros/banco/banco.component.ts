import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalClass } from '../../components/modal/modal-class';
import { table_config } from '../../components/new_tablas/tabla-class';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { fun } from './../../../core/services/functions.service';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { customValidators } from './../../../core/typescript/custom-validators';
import { Permisos } from './../../../core/typescript/permisos';
import { BancoC, BancoI } from './banco.utils';
import { CuentaBancariaFormComponent } from './cuenta-bancaria-form/cuenta-bancaria-form.component';
import { CuentaBancariaI, modalCuentaBancaria, modalCuentaBancariaBtnAceptar, modalTipoCuentaBancaria } from './cuenta-bancaria-form/cuenta_bancaria';
import { TipoCuentaBancariaComponent } from './tipo-cuenta-bancaria/tipo-cuenta-bancaria.component';
import { ImagenService } from './../../../core/services/imagen.service';

@Component({
  selector: 'app-banco',
  templateUrl: './banco.component.html',
  styleUrls: ['./banco.component.scss'],
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

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'text', key: 'nombre', style: { width: '45%', 'text-align': 'start' } },
      { titulo: 'Rnc', tipo: 'text', key: 'rnc' },
      { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: 'icon',
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
    padre_functions: { data_request: (params) => this.getBancos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, is_local: false },
  };
  tablaComponent;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService, public imgServ: ImagenService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'banco', is_routing: true });

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
    await this.createForm();
    await this.getBancos(this.tServ.obj_paginate.default);
  }

  createForm() {
    this.formGroup = this.fb.group({
      id: [{ value: null, disabled: false }],
      nombre: [{ value: null, disabled: false }, Validators.required],
      rnc: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      comentario: [{ value: null, disabled: false }],
      telefono: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      direccion: [{ value: null, disabled: false }],
      ejecutivo_cuenta: [{ value: null, disabled: false }, Validators.required],
      telefono_ejecutivo_cuenta: [{ value: null, disabled: false }, Validators.compose([Validators.required, this.myValidators.ValidateRayaAbajo()])],
      cuentas_bancarias: this.fb.array([]),
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
      nombre_cuenta: [{ value: cuenta_bancaria ? (cuenta_bancaria?.cuenta_contable ? cuenta_bancaria.cuenta_contable.descripcion : null) : null, disabled: false }],
      cuenta_contable_prima: [{ value: cuenta_bancaria ? (cuenta_bancaria?.cuenta_contable_prima ? cuenta_bancaria.cuenta_contable_prima.codigo : null) : null, disabled: false }],
      nombre_cuenta_prima: [{ value: cuenta_bancaria ? (cuenta_bancaria?.cuenta_contable_prima ? cuenta_bancaria.cuenta_contable_prima.descripcion : null) : null, disabled: false }],
    });

    return scheduleForm;
  }

  addItem(cuentaBancaria?: CuentaBancariaI) {
    return new Promise<void>((resolve) => {
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

    cuentas.forEach((cuenta) => {
      this.addItem(cuenta);
    });
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

  removeItem(arrayId: string, index: number = null) {
    const arrayCuentasBancarias = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
    if (fun.isEmpty(index)) index = arrayCuentasBancarias.value.findIndex((cuenta: any) => cuenta.arrayId == arrayId);
    arrayCuentasBancarias.removeAt(index);
  }

  getBancos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.listaBancos.length = 0;

    this.bancoClass.getAll(extra).then((res) => {
      res.data = res.data.map((banco) => {
        banco = this.parseBanco(banco);
        return banco;
      });

      this.listaBancos = res.data;
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);

      // this.tableClickIcon({ id_tabla: 'lista_banco', iconKey: 'edit_banco', data: this.listaBancos[0] });
    });
  }

  parseBanco(bancoParsed) {
    bancoParsed.edit_banco = 'fas fa-pencil-alt';
    bancoParsed.delete_banco = 'far fa-trash-alt';

    bancoParsed.edit_banco_tooltip = 'Editar';
    bancoParsed.delete_banco_tooltip = 'Borrar';

    bancoParsed.customStyles = {
      actions: [
        { key: 'actions', isTd: true, estilos: 'width: 11% !important;' },
        { key: 'edit_banco', estilos: 'font-size: 1.2rem !important;' },
        { key: 'delete_banco', estilos: 'font-size: 1.2rem !important' },
      ],
    };

    return bancoParsed;
  }

  tableClickIcon(evento) {
    if ((evento.id_tabla = 'lista_banco'))
      if (evento.iconKey == 'edit_banco') {
        this.formGroup.patchValue(evento.data);
        this.fillCuentasBancarias(evento.data.cuentas_bancarias);
        this.formInitialValue = this.formGroup.getRawValue();

        this.isCreando = false;
      }

    if (evento.iconKey == 'delete_banco') this.eliminarReg(evento.data);
  }

  eliminarReg(data) {
    const objToSend = {
      data: data,
      texto: `¿Está seguro que desea eliminar el banco: <b> ${data.nombre} </b>?`,
      siFunction: () => {
        const actualPagination = this.tServ.getPaginationById('lista_banco');
        this.bancoClass.deleteOne(data.id).then((res) => this.getBancos(actualPagination));
      },
    };

    this.eliminarRegistro(objToSend);
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  borrar(isCreando = true) {
    this.clearArrayCuentasBancarias();

    if (fun.hasValue(this.formGroup)) this.formGroup.reset();
    this.isCreando = isCreando;
  }

  openModalCuentasBancarias(cuenta?: CuentaBancariaI) {
    //

    this.openNewModal({
      component: CuentaBancariaFormComponent,
      inputs: { cuenta, banco: this.formGroup.getRawValue() },
      id: modalCuentaBancaria,
      header: cuenta ? 'Actualizar cuenta bancaria' : 'Registro cuenta bancaria',
      width: '40rem',
      botones: { aceptar: { show: true, disable: true, btnId: modalCuentaBancariaBtnAceptar }, cancelar: { show: true, disable: false } },
    });
  }

  async getDataFromModal(cuentaBancaria: CuentaBancariaI, search?) {
    if (cuentaBancaria.modalId == modalCuentaBancaria) {
      const currentCuenta = this.formGroup.get('cuentas_bancarias').value.find((cuenta) => cuenta.arrayId == cuentaBancaria.arrayId);
      const promisesArray = [];

      if (currentCuenta) promisesArray.push(this.editCuentaBancaria(currentCuenta, cuentaBancaria));
      else promisesArray.push(this.addItem(cuentaBancaria));

      Promise.all(promisesArray).then((res) => {});
    }
  }

  openModalTipoCuentasBancarias() {
    //
    this.openNewModal({
      component: TipoCuentaBancariaComponent,
      inputs: null,
      id: modalTipoCuentaBancaria,
      header: 'Tipos de cuentas bancarias',
      width: '70rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false }],
      },
    });
  }

  formIsInvalid() {
    let res = this.formGroup.invalid || this.formIsOnInitState();

    return res;
  }

  formIsOnInitState() {
    const pick_values = ['nombre', 'rnc', 'telefono', 'comentario', 'ejecutivo_cuenta', 'telefono_ejecutivo_cuenta', 'id'];
    const formValue = fun.pick(this.formGroup.getRawValue(), pick_values);

    const originalValue = fun.pick(this.formInitialValue, pick_values);
    const bancoIsOnInitState = fun.isEqual(formValue, originalValue);

    const pick_values_cuenta = ['id', 'arrayId', 'banco_id', 'tipo_cuenta_bancaria_id', 'divisa_id', 'numero_cuenta', 'comentario', 'descripcion', 'fecha_primera_conciliacion', 'fecha_apertura', 'balance_inicial_libro', 'balance_inicial_banco'];
    let cuentasIsOnInitState = this.formInitialValue.cuentas_bancarias.length == this.formGroup.getRawValue().cuentas_bancarias.length;

    const initialCuentasIndexed = this.formInitialValue.cuentas_bancarias.reduce((acc, item) => {
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

    this.bancoClass.createUpdateOne(formValue).then((res) => {
      const actualPagination = this.tServ.getPaginationById('lista_banco');
      this.getBancos(actualPagination);
      this.borrar(false);
    });
  }
}
