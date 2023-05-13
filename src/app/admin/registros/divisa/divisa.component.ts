import { DivisaC, DivisaI } from './divisa.utils';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { fun } from '../../../core/services/functions.service';
import { Permisos } from '../../..//core/typescript/permisos';
import { table_config } from '../../components/new_tablas/tabla-class';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { getImgUrlServer } from '../../../core/typescript/imagen.utils';
import { PhotoDataI } from '../../components/img-viewer-edit/img-viewer-edit.utils';

@Component({
  selector: 'app-divisa',
  templateUrl: './divisa.component.html',
  styleUrls: ['./divisa.component.scss'],
})
export class DivisaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  botonLabel: string = 'Guardar';
  isCreando: boolean = false;
  permissions = Permisos;
  formPermissions = [Permisos.configuracion_entidad_cuenta.update];

  listaDivisas: Array<DivisaI> = [];
  divisaSelected: any;

  divisaClass = new DivisaC();

  fun = fun;

  table_config: table_config = {
    info: [
      { titulo: '', tipo: 'tag', key: 'es_principal', tag_color: 'green', estilos: [{ width: '5rem' }] },
      { titulo: 'Imagen', tipo: 'img', key: 'img_divisa', estilos: [{ 'padding-left': '0.5rem' }, { 'padding-right': '0.5rem' }, { width: '5rem' }] },
      { titulo: 'Simbolo', tipo: 'text', key: 'simbolo', estilos: [{ width: '12%' }] },
      { titulo: 'Nombre', tipo: 'text', key: 'nombre', estilos: [{ 'text-align': 'left' }] },
      { titulo: 'Tasa actual', tipo: 'text', key: 'tasa_actual', estilos: [{ 'text-align': 'center' }, { width: '8%' }] },
      { titulo: 'Estado', tipo: 'tag', key: 'status', row_tag_color: 'status_tag_color', estilos: [{ 'text-align': 'center' }, { width: '10%' }] },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '0.8rem',
        tipo: 'icon',
        estilos: [{ 'text-align': 'center' }, { width: '13%' }],
        iconsArray: [
          { key: 'edit_divisa', tooltip: 'Editar Divisa', text_color: 'colorNegro' },
          { key: 'deactivate_reactivate_divisa', rowTooltip: 'deactivate_reactivate_divisa_tooltip', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_divisa',
  };
  tablaComponent;
  photoData: PhotoDataI;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'divisa', is_routing: true });

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
    await this.getDivisas();
    fun.enfocarInput('cedula');
  }

  createForm(data?) {
    this.form = this.fb.group({
      id: [{ value: fun.hasValue(data) ? data.id : null, disabled: false }],
      simbolo: [{ value: fun.hasValue(data) ? data.simbolo : '', disabled: false }, Validators.required],
      nombre: [{ value: fun.hasValue(data) ? data.nombre : '', disabled: false }, Validators.required],
      is_principal: [{ value: fun.hasValue(data) ? data.is_principal : false, disabled: false }, Validators.required],
      current_tasa: [{ value: fun.hasValue(data) ? data.current_tasa : '', disabled: false }],
    });
    this.checkFormValidator();
  }

  checkFormValidator() {
    const validators = this.botonLabel == 'Guardar' ? Validators.required : null;
    this.form.controls.current_tasa.setValidators(validators);
    console.log('this.form.controls ', this.form.controls);
  }

  async getDivisas() {
    try {
      const extra = { parameters: { cuenta_contable_id: true } };

      this.listaDivisas.length = 0;

      this.divisaClass.getAll(extra).then((res) => {
        res['data'].map((divisa: DivisaI) => {
          divisa.img_divisa = getImgUrlServer(divisa.imagen.file_name);
          divisa.es_principal = divisa.is_principal ? 'Principal' : null;
          divisa.tasa_actual = `$ ${divisa.current_tasa}`;

          divisa.edit_divisa = 'fas fa-pencil-alt';
          divisa.deactivate_reactivate_divisa = divisa.estado ? 'fa-solid fa-ban' : 'fa-regular fa-circle-check';
          divisa.deactivate_reactivate_divisa_tooltip = divisa.estado ? 'Desactivar Divisa' : 'Reactivar Divisa';

          divisa.status = divisa.estado ? 'ACTIVA' : 'DESACTIVA';
          divisa.status_tag_color = divisa.estado ? 'green' : 'red';

          divisa.customStyles = {
            es_principal: { padding: 0, width: '5rem' },
            img_divisa: { 'padding-left': '0.5rem', 'padding-right': '0.5rem', width: '5rem' },
            simbolo: { width: '12%' },
            nombre: { 'text-align': 'start' },
            tasa_actual: { width: '8%' },
            status: [
              { key: 'status', isTd: true, estilos: 'width: 10% !important;' },
              { key: 'status_cuenta', estilos: 'font-size: 1.2rem !important;' },
            ],
            actions: [
              { key: 'actions', isTd: true, estilos: 'width: 13% !important;' },
              { key: 'edit_divisa', estilos: 'font-size: 1.2rem !important' },
              { key: 'deactivate_reactivate_divisa', estilos: 'font-size: 1.2rem !important' },
            ],
          };
          return divisa;
        });

        this.listaDivisas = res['data'];
        console.log('this.listaDivisas ', this.listaDivisas);

        this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {
      fun.toastError('Error buscando empleados registrados.', 'ERROR');
    }
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
    console.log('this.photoData ', this.photoData);
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['simbolo', 'nombre', 'current_tasa'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);
    const originalValue = fun.pick(
      this.listaDivisas.find((cuenta) => cuenta.id == formValue.id),
      pick_values,
    );

    return !fun.isEqual(formValue, originalValue);
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  saltar(sali_de) {
    if (sali_de != 'send') {
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.requests(), 250);
    }
  }

  tableClickIcon(params) {
    console.log('params ', params);

    if (params.columnKey == 'actions') {
      if (params.iconKey == 'edit_divisa') this.editarItem(params.data);
    }
  }

  editarItem(divisa: DivisaI) {
    this.form.reset();
    this.botonLabel = 'Editar';
    this.divisaSelected = fun.duplicarJson(divisa);
    this.createForm(divisa);
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.isCreando = false;
    this.divisaSelected = undefined;
    this.botonLabel = 'Guardar';
  }

  requests() {
    const formValue = this.form.value;
    console.log('formValue ', formValue);

    this.divisaClass.createUpdateOne(formValue).then((res) => {
      this.getDivisas();
      this.borrar();
    });
  }
}
