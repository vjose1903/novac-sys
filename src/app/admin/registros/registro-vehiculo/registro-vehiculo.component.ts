import { HtmlElementsService } from './../../../core/services/html-elements.service';
import { Component, OnInit, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { MarcaC, ModeloC } from '../../components/formularios en modales/formulario-marca-modelo/marca-modelo';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { EmpleadoC } from '../registro-empleados/empleado';
import { VehiculoC } from './vehiculo';
import { FormularioMarcaModeloComponent } from '../../components/formularios en modales/formulario-marca-modelo/formulario-marca-modelo.component';
import { fun } from '../../../core/services/functions.service';
import { table_config } from '../../components/new_tablas/tabla-class';
import { Permisos } from '../../../core/typescript/permisos';
import { NgxPermissionsService } from 'ngx-permissions';
import { ModalClass } from '../../components/modal/modal-class';

@Component({
  selector: 'app-registro-vehiculo',
  templateUrl: './registro-vehiculo.component.html',
  styleUrls: ['./registro-vehiculo.component.scss'],
})
export class RegistroVehiculoComponent extends MixinClass implements OnInit, OnDestroy {
  boton = '';
  form: UntypedFormGroup;
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  listaVehiculos = [];
  FORM: any;

  listaMarcas = [];
  is_editando = false;

  listaPropietarios = [];

  listaModelos: any;
  vehiculoSelected: any;

  isCreando: boolean = false;

  vehiculosClass = new VehiculoC();
  marcasClass = new MarcaC();
  empleadosClass = new EmpleadoC();
  modeloClass = new ModeloC();
  permissions = Permisos;
  table_config: table_config = {
    info: [
      { titulo: 'Propietario', key: 'nombre_completo_propietario', tipo: 'text' },
      { titulo: 'Marca', key: 'marca', tipo: 'text' },
      { titulo: 'Modelo', key: 'modelo', tipo: 'text' },
      { titulo: 'Cant. viajes', key: 'cantidad_viajes', tipo: 'text' },
    ],

    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_vehiculos',
    padre_functions: { data_request: (params) => this.getVehiculos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.vehiculo.update }, borrar: { show: true, permiso: this.permissions.vehiculo.destroy } },
  };
  tablaComponent;
  formPermissions = [Permisos.vehiculo.create, Permisos.vehiculo.update];
  hasPermissionsMarca: boolean;
  hasPermissionsModelo: boolean;

  htmlServ = inject(HtmlElementsService);
  fun = fun;
  constructor(private cdRef: ChangeDetectorRef, private fb: UntypedFormBuilder, private router: Router, private tServ: TablasService, private permissionsService: NgxPermissionsService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_vehiculos', is_routing: true });
    this.createForm();
    this.FORM = this.form.controls;

    this.boton = 'Registrar';

    fun.enfocarInput('user_id');
    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
    this.borrar();
  }

  necesarioStart() {
    this.getVehiculos(this.tServ.obj_paginate.default);
    this.getPropietarios();
    this.getMarcas();
    this.checkPermisos();
  }

  checkPermisos() {
    this.permissionsService.hasPermission(Object.values(this.permissions.marca)).then((result) => (this.hasPermissionsMarca = result));
    this.permissionsService.hasPermission(Object.values(this.permissions.modelo)).then((result) => (this.hasPermissionsModelo = result));
  }

  async getPropietarios() {
    this.empleadosClass.getAll({ parameters: { id: true } }).then(
      (res) => {
        res['data'].unshift({ id: -1, nombre_completo: 'No empleado' });
        this.listaPropietarios = res['data'];
      },
      (err: any) => {},
    );
  }

  async getVehiculos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true, nombre_completo_propietario: true } };
    this.listaVehiculos.length = 0;
    const res = await this.vehiculosClass.getAll(extra);

    res.data.map((val) => {
      // val.nombre_completo = `${val.propietario.nombre} ${val.propietario.apellido}`;
      return val;
    });

    this.listaVehiculos = _.orderBy(res.data, ['id'], ['asc']);

    this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
  }

  async getMarcas() {
    try {
      const res = await this.marcasClass.getAll();

      this.listaMarcas = res;
    } catch (error) {
      fun.toastError('Error buscando marcas', 'ERROR');
    }
  }

  ngOnChanges() {
    this.cdRef.detectChanges();
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
      user_id: [null, Validators.required],
      marca: [null, Validators.required],
      modelo: [null, Validators.required],
      anio: [null, Validators.compose([Validators.required, Validators.minLength(4)])],
      nombre_no_empleado: [{ value: null, disabled: true }, Validators.required],
      apellido_no_empleado: [{ value: null, disabled: true }, Validators.required],
      telefono_no_empleado: [{ value: null, disabled: true }, Validators.required],
      estado: [true],
    });
    this.verificateMarcaIsSelected();
  }

  saltar(campo, array?, i?) {
    if (array) {
      campo = campo + i;
    }

    if (campo !== 'send') {
      fun.enfocarInput(campo);
    } else {
      if (this.form.valid) {
        fun.enfocarInput('user_id');
        setTimeout(() => {
          this.submit(this.form);
        }, 250);
      }
    }
  }

  borrar(reset = false) {
    this.vehiculoSelected = undefined;
    if (fun.hasValue(this.form)) this.form.reset();
    this.restartCampo('nombre_no_empleado');
    this.restartCampo('apellido_no_empleado');
    this.restartCampo('telefono_no_empleado');
    fun.enfocarInput('user_id');
    if (reset) this.isCreando = true;
    this.boton = 'Registrar';
  }

  selectPropietario() {
    if (this.form.controls.user_id.value === -1) {
      this.form.controls.nombre_no_empleado.enable();
      this.form.controls.apellido_no_empleado.enable();
      this.form.controls.telefono_no_empleado.enable();
    } else {
      this.restartCampo('nombre_no_empleado');
      this.restartCampo('apellido_no_empleado');
      this.restartCampo('telefono_no_empleado');
    }
  }

  restartCampo(campo) {
    if (fun.hasValue(this.form)) this.form.controls[campo].disable();
    if (fun.hasValue(this.form)) this.form.controls[campo].reset(null);
  }

  async selectMarca() {
    return new Promise<void>(async (resolve, reject) => {
      const marca_selected_id = this.form.controls.marca.value;
      if (marca_selected_id) {
        const res = await this.modeloClass.getAll({ afterPath: `por_marca/${marca_selected_id}` });
        this.listaModelos = res;
        if (fun.hasValue(this.form)) this.form.controls.modelo.reset();
        this.verificateMarcaIsSelected();
        resolve();
      }
    });
  }

  verificateMarcaIsSelected() {
    const formulario = this.form.getRawValue();
    const func = fun.hasValue(formulario.marca) ? 'enable' : 'disable';
    this.form.controls.modelo[func]({ emitEvent: false });
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    this.router.navigateByUrl('/admin/dashboard');
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  eliminarReg(regisData) {
    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar el vehículo <b> ${regisData.marca} - ${regisData.modelo}. </b> \n Propietario: <b> ${regisData.nombre_completo} </b>?`,
      siFunction: () => {
        this.vehiculosClass.deleteOne(regisData.id).then((res) => {
          this.listaVehiculos = null;
          fun.toastSuccess(`Camion: ${regisData.marca} ${regisData.modelo}  de: ${regisData.nombre_completo}` + ' borrado.', 'CORRECTO');
          const actualPagination = this.tServ.getPaginationById('lista_vehiculos');
          this.getVehiculos(actualPagination);
          this.borrar();
        });
      },
    };

    this.eliminarRegistro(objToSend);
  }

  async editarItem(data) {
    this.borrar();
    this.is_editando = true;
    this.vehiculoSelected = data;

    this.boton = 'Editar';

    await this.form.patchValue(this.vehiculoSelected);
    this.verificateMarcaIsSelected();

    if (!this.vehiculoSelected.user_id) this.form.controls.user_id.setValue(-1);

    const marca_id = this.listaMarcas.find((marca) => marca.descripcion === this.vehiculoSelected.marca).id;

    this.form.controls.marca.setValue(marca_id);
    this.selectMarca().then(() => {
      const modelo_id = this.listaModelos.find((modelo) => modelo.descripcion == this.vehiculoSelected.modelo).id;
      this.form.controls.modelo.setValue(modelo_id);
    });

    this.selectPropietario();
  }

  nuevoRegistro() {
    this.isCreando = true;
    this.verificateMarcaIsSelected();
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.Capitalice(arg));
  }

  abrirModalMarcasYModelos(tipo) {
    this.openNewModal({
      component: FormularioMarcaModeloComponent,
      inputs: { tipo },
      id: 'crud_marca_modelo',
      header: 'Mantenimiento marca & modelo',
      width: '1000px',
      height: '650px',
      botones: fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
    });
  }

  onHideModal(arg) {
    if (arg.modal.id == 'crud_marca_modelo') this.getMarcas();
  }
  // =============================================
  //  Crear vehiculo
  // =============================================

  async submit(form) {
    const formulario = this.form.getRawValue();

    const obj = {
      user_id: formulario.user_id !== -1 ? formulario.user_id : null,

      marca: this.listaMarcas.find((marca) => marca.id === formulario.marca).descripcion,
      modelo: this.listaModelos.find((modelo) => modelo.id === formulario.modelo).descripcion,
      anio: formulario.anio,
      estado: formulario.estado,

      nombre_no_empleado: formulario.nombre_no_empleado,
      apellido_no_empleado: formulario.apellido_no_empleado,
      telefono_no_empleado: formulario.telefono_no_empleado,
    };

    let msg_error = '';
    try {
      if (formulario.id) {
        msg_error = 'Error editando vehiculo';
        obj['id'] = formulario.id;

        const res = await this.vehiculosClass.updateOne(obj);

        fun.toastSuccess('Vehiculo editando con exito.', 'Correcto');
      } else {
        msg_error = 'Error registrando vehiculo';

        const res = await this.vehiculosClass.createOne(obj);

        fun.toastSuccess('Vehiculo registrado con exito.', 'Correcto');
      }
      this.borrar();
      const actualPagination = this.tServ.getPaginationById('lista_vehiculos');
      this.getVehiculos(actualPagination);
    } catch (error) {
      fun.toastError(msg_error, 'ERROR');
    }
  }
}
