import { Component, OnInit, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { DBservice } from '../../../core/services/bdservice.service';
import * as moment from 'moment';

import { map } from 'rxjs/operators';
import { ModalService } from '../../components/modal/modal.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { obj_paginate } from '../../components/tablas/tablas.service';

@Component({
  selector: 'app-registro-vehiculo',
  templateUrl: './registro-vehiculo.component.html',
  styleUrls: ['./registro-vehiculo.component.scss'],
})
export class RegistroVehiculoComponent implements OnInit {
  titulo = '';
  boton = '';
  form: FormGroup;
  phoneMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  listaVehiculos;
  FORM: any;

  tipoModal: string;
  indexEditar: any;

  seleccionModal: any;
  indexBorrar: any;

  subDeci: Subscription;
  listaMarcas = [];
  is_editando = false;

  listaPropietarios = [];

  listaModelos: any;
  vehiculoEditando: any;

  constructor(private dbServ: DBservice, private cdRef: ChangeDetectorRef, private fb: FormBuilder, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.createForm();
    this.FORM = this.form.controls;

    this.titulo = 'Registro de camiones';
    this.boton = 'Registrar';

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
    GLOBAL.enfocarInput('user_id');
    this.necesarioStart();
  }

  ngOnDestroy() {
    this.borrar();
    this.subDeci.unsubscribe();
  }

  async necesarioStart() {
    await this.getVehiculos(obj_paginate);
    await this.getPropietarios();
    await this.getMarcas();
  }

  async getPropietarios() {
    const res = await this.dbServ.getEmpleadosNames().toPromise();
    res.map((val) => {
      val.nombreCompleto = val.nombre + ' ' + val.apellido;
      return val;
    });

    res.push({ id: -1, nombreCompleto: 'No empleado' });

    this.listaPropietarios = res;
  }
  async getVehiculos(e) {
    const page = e.page;
    const per_page = e.per_page;
    const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
    console.log(`(${palabra_a_buscar})`);

    try {
      const res = await this.dbServ.getVehiculosFiltrados(palabra_a_buscar, page, per_page, true).toPromise();
      res.data.map((val) => {
        val.nombreCompleto = `${val.propietario.nombre} ${val.propietario.apellido}`;
        return val;
      });
      this.listaVehiculos = res.data;

      this.listaVehiculos.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
    } catch (error) {
      this.dbServ.toastError('Error buscando camiones', 'ERROR', true);
    }
  }

  async getMarcas() {
    try {
      const res = await this.dbServ.getMarcas().toPromise();
      this.listaMarcas = res;
    } catch (error) {
      this.dbServ.toastError('Error buscando articulos', 'ERROR', true);
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
    });
  }

  saltar(campo, array?, i?) {
    if (array) {
      campo = campo + i;
    }

    if (campo !== 'send') {
      GLOBAL.enfocarInput(campo);
    } else {
      if (this.form.valid) {
        GLOBAL.enfocarInput('user_id');
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
    GLOBAL.enfocarInput('user_id');

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
    try {
      const marca_selected_id = this.form.controls.marca.value;
      if (marca_selected_id) {
        const res = await this.dbServ.getModelosByMarca(marca_selected_id).toPromise();
        this.listaModelos = res;
        callback(true);
      }
    } catch (error) {
      callback(false);
      this.dbServ.toastError('Error seleccionando marca.', 'ERROR', true);
    }
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    this.router.navigateByUrl('/admin');
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

  abrirModal(arg?) {
    this.seleccionModal = arg.ARG;
    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }

  abrirModalFormulario(arg?) {
    this.seleccionModal = arg;

    this.mServ.modalTipo('crud_marca_modelo');
    this.tipoModal = 'crud_marca_modelo';
    this.mServ.ModalSeleccion(arg);
    this.mServ.mostrarModal(true);
  }

  decisionModal(arg) {
    if (arg) {
      const obj = GLOBAL.duplicarJson(this.seleccionModal);
      this.dbServ.eliminarArticulo(obj).subscribe(
        (res) => {
          this.dbServ.toastSuccess('Articulo ' + obj.nombre + ' borrado.', 'CORRECTO');
          _.pullAt(this.listaVehiculos, this.indexBorrar);
          this.tipoModal = '';
          this.decisionModal = null;
          this.borrar();
        },
        (err) => {
          this.mostrarErrores(err.error);
        },
      );
    }
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }

  // =============================================
  //  Crear articulo
  // =============================================

  async submit(form) {
    const x = GLOBAL.duplicarJson(form.value);
    const obj = {
      user_id: x.user_id !== -1 ? x.user_id : null,

      marca: this.listaMarcas.find((marca) => marca.id === x.marca).descripcion,
      modelo: this.listaModelos.find((modelo) => modelo.id === x.modelo).descripcion,
      anio: x.anio,

      nombre_no_empleado: x.nombre_no_empleado,
      apellido_no_empleado: x.apellido_no_empleado,
      telefono_no_empleado: x.telefono_no_empleado,
    };
    let msg_error = '';
    try {
      if (x.id) {
        msg_error = 'Error editando vehiculo';
        obj['id'] = x.id;
        const res = await this.dbServ.updateVehiculos(obj).toPromise();

        this.dbServ.toastSuccess('Vehiculo editando con exito.', 'Correcto');
      } else {
        msg_error = 'Error registrando vehiculo';

        const res = await this.dbServ.createVehiculos(obj).toPromise();

        this.dbServ.toastSuccess('Vehiculo registrado con exito.', 'Correcto');
      }
      this.borrar();
      this.getVehiculos(obj_paginate);
    } catch (error) {
      this.dbServ.toastError(msg_error, 'ERROR', true);
    }
  }

  mostrarErrores(arg) {
    if (Array.isArray(arg)) {
      arg.forEach((error) => {
        this.dbServ.toastError(error, 'ERROR'), true;
      });
    } else {
      for (const key in arg) {
        if (arg.hasOwnProperty(key)) {
          const element = arg[key];

          if (key !== 'status') {
            this.dbServ.toastError(element, 'ERROR', true);
          }
        }
      }
    }
  }

  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Propietario',
      key: 'nombreCompleto',
    },
    {
      titulo: 'Marca',
      key: 'marca',
    },
    {
      titulo: 'Modelo',
      key: 'modelo',
    },
    {
      titulo: 'Cant. viajes',
      key: 'cantidad_viajes',
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
}
