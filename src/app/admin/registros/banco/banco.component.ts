import { customValidators } from './../../../core/typescript/custom-validators';
import { BancoI, BancoC } from './banco.utils';
import { fun } from './../../../core/services/functions.service';
import { Permisos } from './../../../core/typescript/permisos';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { table_config } from '../../components/new_tablas/tabla-class';
import { TablasService } from '../../components/new_tablas/tablas.service';

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
  formPermissions = [Permisos.configuracion_entidad_cuenta.update];

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
    });
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
