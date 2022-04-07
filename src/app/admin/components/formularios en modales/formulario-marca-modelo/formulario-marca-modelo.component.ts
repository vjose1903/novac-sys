import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { TablasService } from '../../../components/tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { MarcaC, ModeloC } from '../../../components/formularios en modales/formulario-marca-modelo/marca-modelo';
import { ModalI } from '../../new_modal/modal-class';
import { fun } from '../../../../core/services/functions.service';

@Component({
  selector: 'app-formulario-marca-modelo',
  templateUrl: './formulario-marca-modelo.component.html',
  styleUrls: ['./formulario-marca-modelo.component.scss'],
})
export class FormularioMarcaModeloComponent extends MixinClass implements OnInit, ModalI {
  @Input() tipo_formulario;
  tabIndex;
  componente;
  tituloTabla;
  @Output() accion_ = new EventEmitter<any>();
  formMarca: FormGroup;
  formModelo: FormGroup;
  info = [{ titulo: 'Descripcion', key: 'descripcion', tipo: 'text' }];

  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };

  listado;
  boton = 'Guardar';
  campo1;
  campo2;
  listaMarcas: any;
  listaModelos: any;
  listaTipoArticulos: any;
  editando: any;
  seleccionModal: any;
  indexSelected: any;
  tipoModal: string;
  showModal: boolean;
  element;

  marcasClass = new MarcaC();
  modeloClass = new ModeloC();
  obj_p = this.tServ.obj_paginate.default;
  constructor(private fb: FormBuilder, private tServ: TablasService) {
    super();
  }
  modal: any = {};
  inputs: any;
  btn_aceptar() {}

  ngOnInit() {
    this.createForm();
    this.tipo_formulario = this.inputs.tipo;

    if (this.tipo_formulario === 'marcas') {
      this.tabIndex = 0;
      this.componente = 'reg_marcas';
      this.tituloTabla = 'Marcas';
      this.campo1 = 'Marca';
    } else if (this.tipo_formulario === 'modelos') {
      this.tabIndex = 1;
      this.componente = 'reg_modelos';
      this.tituloTabla = 'Modelos';
      this.campo1 = 'Marca';

      this.info = [
        { titulo: 'Marca', key: 'marca_nombre', tipo: 'text' },
        { titulo: 'Modelo', key: 'descripcion', tipo: 'text' },
      ];
    }

    this.formMarca.controls.descripcion.setValidators([Validators.required]);
    this.formModelo.controls.descripcion.setValidators([Validators.required]);
    this.formModelo.controls.marca_id.setValidators([Validators.required]);
    this.getMarcas();

    this.pedirNuevaData(this.obj_p);

    setTimeout(() => {
      if (this.tipo_formulario === 'modelos') {
        this.enfocarInput('marca_modal');
      } else {
        this.enfocarInput('descripcion');
      }
    }, 200);
  }

  getMarcas(palabra_a_buscar = ' ', paginado = false, page = 1, per_page = 1) {
    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { paginado, page, per_page } };
    this.marcasClass.getAll(extra).then((res) => {
      if (!paginado) this.listaMarcas = fun.duplicarJson(res);
      if (paginado) {
        this.listado = res.data;
        this.tServ.Func_total_paginas({ total: res.total_registros, tabla: 'tabla_frm_marca_modelo' });
      }
    });
  }

  capitalice(control, arg, form) {
    const campo = form.get(control);
    campo.setValue(fun.Capitalice(arg));
  }

  createForm() {
    this.formMarca = this.fb.group({
      descripcion: [null],
      marca_id: [null],
    });
    this.formModelo = this.fb.group({
      descripcion: [null],
      marca_id: [null],
    });
  }

  async pedirNuevaData(arg) {
    const palabra_a_buscar = arg.searchText === '' || arg.searchText === null || arg.searchText === undefined ? ' ' : arg.searchText;

    this.listado = [];
    if (this.componente === 'reg_modelos') {
      const extra = { afterPath: `filtro/${' '}`, parameters: { paginado: true, page: arg.page, per_page: arg.per_page } };

      this.modeloClass.getAll(extra).then((modeloRes) => {
        modeloRes.data.map((obj) => {
          obj.marca_nombre = obj.marca.descripcion;
          return obj;
        });

        this.listado = modeloRes.data;
        this.tServ.Func_total_paginas({ total: modeloRes.total_registros, tabla: 'tabla_frm_marca_modelo' });
      });
    } else if (this.componente === 'reg_marcas') {
      this.getMarcas(palabra_a_buscar, true, arg.page, arg.per_page);
    }
  }

  accion(arg) {
    this.accion_.emit(arg);
  }
  closeThis() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);

    return modal;
  }

  async submit(formToSubmit) {
    const obj = fun.duplicarJson(this[formToSubmit].value);

    if (this.tipo_formulario !== 'modelos') delete obj['marca_id'];

    if (fun.hasValue(this.editando)) obj.id = this.editando.id;

    const clase = this.tipo_formulario === 'modelos' ? this.modeloClass : this.marcasClass;

    await clase.createUpdateOne(obj).then(() => this.onSuccess());
  }

  onSuccess() {
    fun.toastSuccess(`Item ${this.editando ? 'actualizado' : 'creado'} correctamente.`, 'CORRECTO');

    this.pedirNuevaData(this.obj_p);

    this.borrar();

    if (this.tipo_formulario === 'modelos') {
      this.enfocarInput('marca_modal');
    } else {
      this.enfocarInput('descripcion');
    }
  }

  borrar() {
    this.formMarca.reset();
    this.formModelo.reset();
    this.editando = undefined;
    this.indexSelected = undefined;
    this.seleccionModal = undefined;
    this.boton = 'Guardar';
  }

  editarItem(arg, formName) {
    this.editando = arg.ARG;

    this.indexSelected = arg.INDEX;
    if (_.has(arg.ARG, 'marca')) arg.ARG.marca_id = arg.ARG.marca.id;

    this[formName].patchValue(arg.ARG);
    this.boton = 'Editar';
  }

  async decisionBorrar(arg) {
    if (arg) {
      const clase = this.tipo_formulario === 'modelos' ? this.modeloClass : this.marcasClass;
      await clase.deleteOne(this.seleccionModal.id);

      this.pedirNuevaData(this.obj_p);
      this.reinicioModal();
    }
  }

  abrirModal(arg) {
    this.seleccionModal = arg.ARG;
    this.indexSelected = arg.INDEX;
    this.tipoModal = 'borrar';

    this.showModal = true;
  }
  reinicioModal() {
    this.seleccionModal = undefined;
    this.indexSelected = undefined;
    this.tipoModal = undefined;
    this.editando = undefined;
    this.showModal = undefined;
  }
}
