import { CuentaBancariaFormComponent } from './cuenta-bancaria-form/cuenta-bancaria-form.component';
import { customValidators } from './../../../core/typescript/custom-validators';
import { BancoI, BancoC } from './banco.utils';
import { fun } from './../../../core/services/functions.service';
import { Permisos } from './../../../core/typescript/permisos';
import { FormArray, FormControl, FormGroup, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { table_config } from '../../components/new_tablas/tabla-class';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { CuentaBancariaI, modalCuentaBancaria, modalCuentaBancariaBtnAceptar } from './cuenta-bancaria-form/cuenta_bancaria';
import { ModalClass } from '../../components/modal/modal-class';
import { TipoCuentaBancariaComponent } from './tipo-cuenta-bancaria/tipo-cuenta-bancaria.component';

@Component({
  selector: 'app-banco',
  templateUrl: './banco.component.html',
  styleUrls: ['./banco.component.scss'],
})
export class BancoComponent extends MixinClass implements OnInit, OnDestroy {
  formGroup: UntypedFormGroup;
  formInitialValue: UntypedFormGroup;
  botonLabel: string = 'Guardar';
  isCreando: boolean = false;
  permissions = Permisos;
  formPermissions = [Permisos.banco.update, Permisos.banco.create];
  allPermisosTipoCuentaBancaria = Object.values(Permisos.tipo_cuenta_bancaria);

  bancoSelected: BancoI;
  listaBancos: Array<BancoI> = [];

  myValidators = new customValidators();
  bancoClass = new BancoC();

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'img', key: 'nombre', style: { width: '45%', 'text-align': 'start' } },
      { titulo: 'Rnc', tipo: 'text', key: 'rnc' },
      { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: 'icon',
        style: { 'text-align': 'center' },
        iconsArray: [
          { key: 'edit_divisa', rowTooltip: 'edit_divisa_tooltip', text_color: 'colorNegro', disable: [{ kind: 'campo', target: 'estado', value: [false] }] },
          { key: 'currency_change', rowTooltip: 'currency_change_tooltip', text_color: 'colorNegro', disable: [{ kind: 'campo', target: 'estado', value: [false] }] },
          { key: 'deactivate_reactivate_divisa', rowTooltip: 'deactivate_reactivate_divisa_tooltip', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_banco',
  };
  tablaComponent;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'banco', is_routing: true });

    this.necesarioStart();
    this.openModalCuentasBancarias();
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

  createItemCuentaBancaria(cuenta_bancaria?: any) {
    const scheduleForm = this.fb.group({
      id: [{ value: cuenta_bancaria ? cuenta_bancaria.id : null, disabled: false }],
    });

    return scheduleForm;
  }

  addItem(schedule?: any) {
    return new Promise<void>((resolve) => {
      const arrayCuentasBancarias = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
      arrayCuentasBancarias.push(this.createItemCuentaBancaria(schedule));
      resolve();
    });
  }

  removeItem(arrayId: string) {
    const arrayCuentasBancarias = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
    // TODO: poner la interfaz de cuenta bancaria
    const index = arrayCuentasBancarias.value.findIndex((cuenta: any) => cuenta.arrayId == arrayId);

    // arrayCuentasBancarias.removeAt(index);
  }

  getBancos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } };
    this.listaBancos.length = 0;
    this.bancoClass.getAll(extra).then((res) => {
      this.listaBancos = res.data;
    });
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  borrar() {
    if (fun.hasValue(this.formGroup)) this.formGroup.reset();
    this.bancoSelected = undefined;
    this.botonLabel = 'Guardar';
    this.isCreando = true;
  }

  openModalCuentasBancarias(cuenta?: CuentaBancariaI, banco?: BancoI) {
    //
    this.openNewModal({
      component: CuentaBancariaFormComponent,
      inputs: { cuenta, banco: { nombre: 'BHD LEON' } },
      id: modalCuentaBancaria,
      header: cuenta ? 'Actualizar cuenta bancaria' : 'Registro cuenta bancaria',
      width: '40rem',
      botones: { aceptar: { show: true, disable: true, btnId: modalCuentaBancariaBtnAceptar }, cancelar: { show: true, disable: false } },
    });
  }

  openModalTipoCuentasBancarias() {
    //
    this.openNewModal({
      component: TipoCuentaBancariaComponent,
      inputs: null,
      id: modalCuentaBancaria,
      header: 'Tipos de cuentas bancarias',
      width: '70rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false }],
      },
    });
  }

  formIsInvalid() {
    let res = false;

    if (!this.formGroup.valid || !this.formIsOnInitState()) {
      res = true;
    }

    return res;
  }

  formIsOnInitState() {
    // const pick_values = ['simbolo', 'nombre', 'current_tasa', 'id', 'img'];
    // const formValue = fun.pick(this.formGroup.getRawValue(), pick_values);

    // const originalValue = fun.pick(
    //   this.divisaServ.listaDivisas.find((cuenta) => cuenta.id == formValue.id),
    //   pick_values,
    // );

    // originalValue['img'] = this.divisaServ.listaDivisas.find((cuenta) => cuenta.id == formValue.id)?.img_divisa;

    // return !fun.isEqual(formValue, originalValue);
    return true;
  }

  requests() {
    let formValue = this.formGroup.value;
    formValue = fun.omit(formValue, ['is_principal', 'img']);

    // if (this.botonLabel == 'Guardar' && (fun.isEmpty(this.photoData) || fun.isEmpty(this.photoData?.src_img))) {
    //   fun.toastError('Debe de selecciar una imagen para crear una divisa', 'ERROR');
    //   return;
    // }

    // if (fun.hasValue(this.photoData?.fileName) && fun.hasValue(this.photoData?.base_64)) {
    //   let idImg = Number(`${this.photoData.id}`.replaceAll('divisa-img-', ''));
    //   idImg = idImg > 0 ? idImg : null;

    //   formValue['imagenes'] = [{ file_name: this.photoData.fileName, base_64: this.photoData.src_img, id: idImg }];
    // }

    // this.bancoClass.createUpdateOne(formValue).then((res) => {
    //   this.divisaServ.getDivisas();
    //   this.borrar();
    // });
  }
}
