import { DivisaC, DivisaI } from './divisa.utils';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { fun } from '../../../core/services/functions.service';
import { Permisos } from '../../..//core/typescript/permisos';
import { table_config } from '../../components/new_tablas/tabla-class';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { getImgUrlServer } from '../../../core/typescript/imagen.utils';

@Component({
  selector: 'app-divisa',
  templateUrl: './divisa.component.html',
  styleUrls: ['./divisa.component.scss'],
})
export class DivisaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  botonLabel: string = 'Editar';
  isCreando: boolean = false;
  permissions = Permisos;
  formPermissions = [Permisos.configuracion_entidad_cuenta.update];

  listaDivisas: Array<DivisaI> = [];
  divisaSelected: any;

  divisaClass = new DivisaC();

  fun = fun;

  table_config: table_config = {
    info: [
      { titulo: 'Imagen', tipo: 'img', key: 'img_divisa', estilos: [{ 'padding-left': '1rem' }, { 'padding-right': '1rem' }, { width: '6rem' }] },
      { titulo: 'Simbolo', tipo: 'text', key: 'simbolo', estilos: [{ width: '7rem' }] },
      { titulo: 'Nombre', tipo: 'text', key: 'nombre', estilos: [{ 'text-align': 'left' }] },
      { titulo: '', tipo: 'tag', key: 'es_principal', tag_color: 'green', estilos: [{ width: '7rem' }] },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_config_entidad_cuenta',
    botones: { editar: { show: true, permiso: this.permissions.configuracion_entidad_cuenta.update }, borrar: { show: false }, styles: { width: '5rem' } },
  };
  tablaComponent;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'config_entidad_cuenta', is_routing: true });
    this._init_mixin({ component: 'config_entidad_cuenta', is_routing: true });

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
    await this.getConfiguraciones();
    fun.enfocarInput('cedula');
  }

  createForm(data?) {
    this.form = this.fb.group({
      id: [{ value: fun.hasValue(data) ? data.id : null, disabled: false }],
      descripcion: [{ value: fun.hasValue(data) ? data.descripcion : '', disabled: true }],
      cuenta_contable_id: [{ value: fun.hasValue(data) ? data.cuenta_contable_id : '', disabled: false }, Validators.required],
    });
  }

  async getConfiguraciones() {
    try {
      const extra = { parameters: { cuenta_contable_id: true } };

      this.listaDivisas.length = 0;

      this.divisaClass.getAll(extra).then((res) => {
        res['data'].map((divisa: DivisaI) => {
          divisa.img_divisa = getImgUrlServer(divisa.imagen.file_name);
          divisa.es_principal = divisa.is_principal ? 'Principal' : null;

          divisa.customStyles = {
            img_divisa: { 'padding-left': '1rem', 'padding-right': '1rem', width: '6rem' },
            simbolo: { width: '7rem' },
            es_principal: { width: '7rem' },
            nombre: { 'text-align': 'start' },
          };
          return divisa;
        });

        this.listaDivisas = res['data'];
        console.log('this.listaConfiguraciones ', this.listaDivisas);

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

  checkIfSomethingIsDiferrent() {
    const formValue = fun.pick(this.form.getRawValue(), ['id', 'cuenta_contable_id']);
    const originalValue = fun.pick(
      this.listaDivisas.find((cuenta) => cuenta.id == formValue.id),
      ['id', 'cuenta_contable_id'],
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

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
  }

  editarItem(divisa: DivisaI) {
    this.form.patchValue(divisa);

    this.divisaSelected = fun.duplicarJson(divisa);
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.isCreando = false;
    this.divisaSelected = undefined;
  }

  requests() {
    const formValue = this.form.value;
    console.log('formValue ', formValue);

    this.divisaClass.createUpdateOne(formValue).then((res) => {
      this.getConfiguraciones();
      this.borrar();
    });
  }
}
