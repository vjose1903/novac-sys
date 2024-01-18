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
import { CuentaBancariaI, modalCuentaBancaria, modalCuentaBancariaBtnAceptar } from './cuenta-bancaria-form/cuenta_bancaria';
import { TipoCuentaBancariaComponent } from './tipo-cuenta-bancaria/tipo-cuenta-bancaria.component';
import { ImagenService } from './../../../core/services/imagen.service';

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
    // this.openModalCuentasBancarias();
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

  removeItem(arrayId: string) {
    const arrayCuentasBancarias = this.formGroup.get('cuentas_bancarias') as UntypedFormArray;
    const index = arrayCuentasBancarias.value.findIndex((cuenta: any) => cuenta.arrayId == arrayId);
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
      console.log('res ', res);

      this.listaBancos = res.data;
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);

      this.tableClickIcon({ id_tabla: 'lista_banco', iconKey: 'edit_banco', data: this.listaBancos[0] });
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

  fillCuentasBancarias(cuentas: Array<CuentaBancariaI>) {
    cuentas.forEach((cuenta) => {
      this.addItem(cuenta);
    });
  }

  tableClickIcon(evento) {
    if ((evento.id_tabla = 'lista_banco'))
      if (evento.iconKey == 'edit_banco') {
        this.formGroup.patchValue(evento.data);
        this.bancoSelected = evento.data;

        this.fillCuentasBancarias(evento.data.cuentas_bancarias);

        this.isCreando = false;
      }
    console.log('evento ', evento);
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
    //   this.bancoServ.listabancos.find((cuenta) => cuenta.id == formValue.id),
    //   pick_values,
    // );

    // originalValue['img'] = this.bancoServ.listabancos.find((cuenta) => cuenta.id == formValue.id)?.img_banco;

    // return !fun.isEqual(formValue, originalValue);
    return true;
  }

  requests() {
    let formValue = this.formGroup.value;
    formValue = fun.omit(formValue, ['is_principal', 'img']);

    // if (this.botonLabel == 'Guardar' && (fun.isEmpty(this.photoData) || fun.isEmpty(this.photoData?.src_img))) {
    //   fun.toastError('Debe de selecciar una imagen para crear una banco', 'ERROR');
    //   return;
    // }

    // if (fun.hasValue(this.photoData?.fileName) && fun.hasValue(this.photoData?.base_64)) {
    //   let idImg = Number(`${this.photoData.id}`.replaceAll('banco-img-', ''));
    //   idImg = idImg > 0 ? idImg : null;

    //   formValue['imagenes'] = [{ file_name: this.photoData.fileName, base_64: this.photoData.src_img, id: idImg }];
    // }

    // this.bancoClass.createUpdateOne(formValue).then((res) => {
    //   this.bancoServ.getbancos();
    //   this.borrar();
    // });
  }
}
