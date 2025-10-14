import { DivisaService } from './divisa.service';
import { DivisaC, DivisaI } from './divisa.utils';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { fun } from '@services/functions.service';
import { Permisos } from '@core/typescript/permisos';
import { tableCellType, table_config } from '@components/new_tablas/tabla-class';
import { MixinClass } from '@core/typescript/MixinClass';
import { PhotoDataI } from '@components/img-viewer-edit/img-viewer-edit.utils';
import { TasaDeCambioComponent } from './tasa-de-cambio/tasa-de-cambio.component';
import { DynamicModalClass } from '@components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, modalActionsE } from '@components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'app-divisa',
  templateUrl: './divisa.component.html',
  styleUrls: ['./divisa.component.scss'],
  standalone: false,
})
export class DivisaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  botonLabel: string = 'Guardar';
  isCreando: boolean = false;
  permissions = Permisos;
  formPermissions = [Permisos.configuracion_entidad_cuenta.update];

  divisaSelected: DivisaI;

  divisaClass = new DivisaC();

  fun = fun;

  table_config: table_config = {
    info: [
      { titulo: '', tipo: tableCellType.tag, key: 'es_principal', tag_color: 'green', tooltip: 'Divisa Principal', tag_apretada: true, estilos: [{ width: '2rem' }] },
      { titulo: 'Imagen', tipo: tableCellType.img, key: 'img_divisa', estilos: [{ 'padding-left': '0.5rem' }, { 'padding-right': '0.5rem' }, { width: '5rem' }] },
      { titulo: 'Simbolo', tipo: tableCellType.text, key: 'simbolo', estilos: [{ width: '10%' }] },
      { titulo: 'Nombre', tipo: tableCellType.text, key: 'nombre', estilos: [{ 'text-align': 'left' }, { 'padding-left': '0.3rem' }] },
      { titulo: 'Tasa actual', tipo: tableCellType.text, key: 'tasa_actual', estilos: [{ 'text-align': 'center' }, { width: '8%' }] },
      { titulo: 'Estado', tipo: tableCellType.tag, key: 'status', row_tag_color: 'status_tag_color', estilos: [{ 'text-align': 'center' }, { width: '10%' }] },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: tableCellType.icon,
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
  photoData: PhotoDataI;

  public dynamicModalServ = inject(DynamicModalService);
  private fb = inject(UntypedFormBuilder);
  public divisaServ = inject(DivisaService);

  constructor() {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'divisa', is_routing: true });

    this.necesarioStart();
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.createForm();
    await this.divisaServ.getDivisas().then(divisas => {
      this.tablaComponent.changeTableConfig([{ total_count: divisas.length }]);
    });
    fun.enfocarInput('cedula');
  }

  createForm() {
    this.form = this.fb.group({
      id: [{ value: null, disabled: false }],
      simbolo: [{ value: null, disabled: false }, Validators.required],
      nombre: [{ value: null, disabled: false }, Validators.required],
      is_principal: [{ value: false, disabled: false }],
      current_tasa: [{ value: null, disabled: false }],
      predeterminado: [{ value: false, disabled: false }],
      img: [{ value: null, disabled: false }],
    });
    this.checkFormValidator();
  }

  checkFormValidator() {
    const validators = this.botonLabel == 'Guardar' ? Validators.compose([Validators.required, Validators.min(1)]) : null;
    this.form.controls.current_tasa.setValidators(validators);

    this.botonLabel == 'Guardar' ? this.form.controls.current_tasa.enable() : this.form.controls.current_tasa.disable();

    this.form.controls.current_tasa.updateValueAndValidity();
  }

  formIsInvalid() {
    let res = false;

    if (!this.form.valid || !this.checkIfSomethingIsDiferrent()) {
      res = true;
    }

    return res;
  }

  getPhotoData(img: PhotoDataI) {
    this.photoData = img;
    this.form.controls.img.setValue(img.src_img);
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['simbolo', 'nombre', 'current_tasa', 'id', 'img'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);

    const originalValue = fun.pick(
      this.divisaServ.listaDivisas.find(cuenta => cuenta.id == formValue.id),
      pick_values
    );

    originalValue['img'] = this.divisaServ.listaDivisas.find(cuenta => cuenta.id == formValue.id)?.img_divisa;

    return !fun.isEqual(formValue, originalValue);
  }

  nuevoRegistro() {
    this.checkFormValidator();
    this.isCreando = true;
  }

  saltar(sali_de) {
    if (sali_de != 'send') {
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.requests(), 250);
    }
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      const divisa = params.data;

      if (params.iconKey == 'edit_divisa') this.editarItem(divisa);
      if (params.iconKey == 'currency_change') {
        this.openModalCurrencyChange(divisa);
      }
      if (params.iconKey == 'deactivate_reactivate_divisa') {
        this.dynamicModalServ.confirmationModal({
          id: 'deactivate_or_reactivate_divisa',
          header: 'Confirmar',
          btnKind: params.data.estado ? confirmationButtons.cancelarDesactivar : confirmationButtons.cancelarActivar,
          texto: params.data.estado
            ? `Seguro que desea <b class="negrita"> DESACTIVAR </b> la divisa <b class="negrita">${params.data.nombre}</b>`
            : `Seguro que desea <b class="negrita"> REACTIVAR </b> la divisa <b class="negrita">${params.data.nombre}</b>`,
          onYes: () => this.deactivateOrReactivateAccount(params.data),
        });
      }
    }
  }

  openModalCurrencyChange(divisa: DivisaI) {
    const modalConfig = new DynamicModalClass();
    modalConfig.id = 'tasa_de_cambio';
    modalConfig.width = '30rem';
    modalConfig.component = TasaDeCambioComponent;
    modalConfig.inputs = { divisa };
    modalConfig.header = 'Actualizar Tasa de cambio';

    modalConfig.botones = [{ clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false }];

    modalConfig.show();
  }

  editarItem(divisa: DivisaI) {
    if (fun.hasValue(this.form)) this.form.reset();

    setTimeout(() => {
      this.botonLabel = 'Editar';
      this.divisaSelected = fun.deepCloning(divisa);
      this.form.patchValue(divisa);

      this.photoData = { src_img: divisa.img_divisa, id: divisa.imagen.id };
      this.form.controls.img.setValue(divisa.img_divisa);
    }, 1);
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.divisaSelected = undefined;
    this.botonLabel = 'Guardar';
    this.checkFormValidator();
    this.photoData = undefined;
    this.isCreando = true;
    this.form.controls.img.setValue(null);
  }

  deactivateOrReactivateAccount(data) {
    this.divisaClass.updateOne({ id: data.id }, { afterPath: 'deactivate_or_reactivate', parameters: { status: !data.estado } }).then(res => {
      this.divisaServ.getDivisas();
    });
  }

  requests() {
    let formValue = this.form.value;
    formValue = fun.omit(formValue, ['is_principal', 'img']);

    if (this.botonLabel == 'Editar') delete formValue.current_tasa;

    if (this.botonLabel == 'Guardar' && (fun.isEmpty(this.photoData) || fun.isEmpty(this.photoData?.src_img))) {
      fun.toastError('Debe de selecciar una imagen para crear una divisa', 'ERROR');
      return;
    }

    if (fun.hasValue(this.photoData?.fileName) && fun.hasValue(this.photoData?.base_64)) {
      let idImg = Number(`${this.photoData.id}`.replaceAll('divisa-img-', ''));
      idImg = idImg > 0 ? idImg : null;

      formValue['imagenes'] = [{ file_name: this.photoData.fileName, base_64: this.photoData.src_img, id: idImg }];
    }

    this.divisaClass.createUpdateOne(formValue).then(res => {
      this.divisaServ.getDivisas();
      this.borrar();
    });
  }
}
