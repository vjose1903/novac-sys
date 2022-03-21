import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { MarcaC, ModeloC } from '../../components/formularios en modales/formulario-marca-modelo/marca-modelo';
import { TablasService } from '../../components/tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { EmpleadoC } from '../registro-empleados/empleado';
import { VehiculoC } from './vehiculo';
import { FormularioMarcaModeloComponent } from '../../components/formularios en modales/formulario-marca-modelo/formulario-marca-modelo.component';

@Component({
  selector: 'app-registro-vehiculo',
  templateUrl: './registro-vehiculo.component.html',
  styleUrls: ['./registro-vehiculo.component.scss'],
})
export class RegistroVehiculoComponent extends MixinClass implements OnInit, OnDestroy {
  titulo = '';
  boton = '';
  form: FormGroup;
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  listaVehiculos;
  FORM: any;

  listaMarcas = [];
  is_editando = false;

  listaPropietarios = [];

  listaModelos: any;
  vehiculoEditando: any;

  info = [
    { titulo: 'Propietario', key: 'nombreCompleto', tipo: 'text' },
    { titulo: 'Marca', key: 'marca', tipo: 'text' },
    { titulo: 'Modelo', key: 'modelo', tipo: 'text' },
    { titulo: 'Cant. viajes', key: 'cantidad_viajes', tipo: 'text' },
  ];
  botones = { titulo: true, borrar: true, editar: true };

  vehiculosClass = new VehiculoC();
  marcasClass = new MarcaC();
  empleadosClass = new EmpleadoC();
  modeloClass = new ModeloC();

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private router: Router, private tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reg_vehiculos', is_routing: true, _lista_subs: ['decisionModal'] });
    this.createForm();
    this.FORM = this.form.controls;

    this.titulo = 'Registro de camiones';
    this.boton = 'Registrar';

    this.enfocarInput('user_id');
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
  }

  async getPropietarios() {
    this.empleadosClass.getAll({ parameters: { id: true, nombreCompleto: true } }).then(
      (res) => {
        res['data'].unshift({ id: -1, nombreCompleto: 'No empleado' });
        this.listaPropietarios = res['data'];
      },
      (err: any) => {},
    );
  }
  async getVehiculos(e) {
    const page = e.page;
    const per_page = e.per_page;
    const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: page, per_page: per_page, paginado: true } };
    const res = await this.vehiculosClass.getAll(extra);

    res.data.map((val) => {
      val.nombreCompleto = `${val.propietario.nombre} ${val.propietario.apellido}`;
      return val;
    });
    this.listaVehiculos = res.data;

    this.listaVehiculos.sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    });
  }

  async getMarcas() {
    try {
      const res = await this.marcasClass.getAll();
      this.listaMarcas = res;
    } catch (error) {
      this.fun.toastError('Error buscando articulos', 'ERROR');
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
  }

  saltar(campo, array?, i?) {
    if (array) {
      campo = campo + i;
    }

    if (campo !== 'send') {
      this.enfocarInput(campo);
    } else {
      if (this.form.valid) {
        this.enfocarInput('user_id');
        setTimeout(() => {
          this.submit(this.form);
        }, 250);
      }
    }
  }

  borrar() {
    this.vehiculoEditando = null;
    this.form.reset();
    this.restartCampo('nombre_no_empleado');
    this.restartCampo('apellido_no_empleado');
    this.restartCampo('telefono_no_empleado');
    this.enfocarInput('user_id');

    this.titulo = 'Registro de camiones';
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
    this.form.controls[campo].disable();
    this.form.controls[campo].reset(null);
  }

  async selectMarca(callback = (arg) => {}) {
    const marca_selected_id = this.form.controls.marca.value;
    if (marca_selected_id) {
      const res = await this.modeloClass.getAll({ afterPath: `por_marca/${marca_selected_id}` });

      this.listaModelos = res;
      callback(true);
    }
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    this.router.navigateByUrl('/admin/dashboard');
  }

  async editarItem(item) {
    const vehiculo = item.ARG;
    this.borrar();
    this.is_editando = true;
    this.vehiculoEditando = item.ARG;

    this.titulo = `Editar Camion: ${vehiculo.marca} ${vehiculo.modelo}  de: ${vehiculo.nombreCompleto}`;
    this.boton = 'Editar';

    await this.form.patchValue(vehiculo);

    if (!vehiculo.user_id) {
      this.form.controls.user_id.setValue(-1);
    }

    const marca_id = this.listaMarcas.find((marca) => marca.descripcion === vehiculo.marca).id;

    this.form.controls.marca.setValue(marca_id);
    this.selectMarca((res) => {
      if (res) {
        const modelo_id = this.listaModelos.find((modelo) => modelo.descripcion === vehiculo.modelo).id;
        this.form.controls.modelo.setValue(modelo_id);
      }
    });

    this.selectPropietario();
  }

  decisionModal(arg) {
    if (arg) {
      const obj = this.fun.duplicarJson(this.seleccionModal);

      this.vehiculosClass.deleteOne(obj.id).then((res) => {
        this.listaVehiculos = null;
        this.fun.toastSuccess(`Camion: ${obj.marca} ${obj.modelo}  de: ${obj.nombreCompleto}` + ' borrado.', 'CORRECTO');
        const actualPagination = this.tServ.getPaginationById('lista_vehiculos');
        this.getVehiculos(actualPagination);
        this.borrar();
      });
    }
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(this.fun.Capitalice(arg));
  }

  abrirModalMarcasYModelos(tipo) {
    this.handleModalForm({
      component: FormularioMarcaModeloComponent,
      inputs: { tipo },
      id: 'crud_marca_modelo',
      header: 'Mantenimiento marca & modelo',
      width: '1000px',
      height: '650px',
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        // dinamico: [
        //   { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal('crud_marca_modelo', 'cerrar'), label: 'Cancelar', disable: false },
        //   { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
        // ],
      },
    });
  }

  eliminarReg(regisData) {
    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar el vehículo <b> ${regisData.marca} - ${regisData.modelo}. </b> \n
      Propietario: <b>
       ${regisData.nombreCompleto}
       </b>?`,
      siFunction: () => {
        this.vehiculosClass.deleteOne(regisData.id).then((res) => {
          this.listaVehiculos = null;
          this.fun.toastSuccess(`Camion: ${regisData.marca} ${regisData.modelo}  de: ${regisData.nombreCompleto}` + ' borrado.', 'CORRECTO');
          const actualPagination = this.tServ.getPaginationById('lista_vehiculos');
          this.getVehiculos(actualPagination);
          this.borrar();
        });
      },
    };

    this.eliminarRegistro(objToSend);
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

        this.fun.toastSuccess('Vehiculo editando con exito.', 'Correcto');
      } else {
        msg_error = 'Error registrando vehiculo';

        const res = await this.vehiculosClass.createOne(obj);

        this.fun.toastSuccess('Vehiculo registrado con exito.', 'Correcto');
      }
      this.borrar();
      const actualPagination = this.tServ.getPaginationById('lista_vehiculos');
      this.getVehiculos(actualPagination);
    } catch (error) {
      this.fun.toastError(msg_error, 'ERROR');
    }
  }
}
