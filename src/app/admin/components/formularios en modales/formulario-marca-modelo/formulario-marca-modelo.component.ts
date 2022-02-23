import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { TablasService } from '../../../components/tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { MarcaC, ModeloC } from '../../../components/formularios en modales/formulario-marca-modelo/marca-modelo';

@Component({
  selector: 'app-formulario-marca-modelo',
  templateUrl: './formulario-marca-modelo.component.html',
  styleUrls: ['./formulario-marca-modelo.component.scss'],
})
export class FormularioMarcaModeloComponent extends MixinClass implements OnInit {
  @Input() tipo_formulario;

  componente;
  tituloTabla;
  @Output() accion_ = new EventEmitter<any>();
  form: FormGroup;
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

  ngOnInit() {
    this.createForm();

    if (this.tipo_formulario === 'marcas') {
      this.form.controls.descripcion.setValidators([Validators.required]);
      this.componente = 'reg_marcas';
      this.tituloTabla = 'Marcas';
      this.campo1 = 'Marca';
    } else if (this.tipo_formulario === 'modelos') {
      this.form.controls.descripcion.setValidators([Validators.required]);
      this.form.controls.marca_id.setValidators([Validators.required]);
      this.componente = 'reg_modelos';
      this.tituloTabla = 'Modelos';
      this.campo1 = 'Marca';
      this.getMarcas();

      this.info = [
        { titulo: 'Marca', key: 'marca_nombre', tipo: 'text' },
        { titulo: 'Modelo', key: 'descripcion', tipo: 'text' },
      ];
    }

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
      if (!paginado) this.listaMarcas = GLOBAL.duplicarJson(res);
      if (paginado) {
        this.listado = res.data;
        this.tServ.Func_total_paginas({ total: res.total_registros, tabla: 'tabla_frm_marca_modelo' });
      }
    });
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }

  createForm() {
    this.form = this.fb.group({
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
  async submit() {
    const obj = GLOBAL.duplicarJson(this.form.value);

    if (this.tipo_formulario !== 'modelos') delete obj['marca_id'];

    if (this.fun.hasValue(this.editando)) obj.id = this.editando.id;

    const clase = this.tipo_formulario === 'modelos' ? this.modeloClass : this.marcasClass;

    await clase.createUpdateOne(obj).then(() => this.onSuccess());
  }

  onSuccess() {
    this.fun.toastSuccess(`Item ${this.editando ? 'actualizado' : 'creado'} correctamente.`, 'CORRECTO');

    this.pedirNuevaData(this.obj_p);

    this.borrar();

    if (this.tipo_formulario === 'modelos') {
      this.enfocarInput('marca_modal');
    } else {
      this.enfocarInput('descripcion');
    }
  }

  borrar() {
    this.form.reset();
    this.editando = undefined;
    this.indexSelected = undefined;
    this.seleccionModal = undefined;
    this.boton = 'Guardar';
  }

  editarItem(arg) {
    this.editando = arg.ARG;

    this.indexSelected = arg.INDEX;
    if (_.has(arg.ARG, 'marca')) arg.ARG.marca_id = arg.ARG.marca.id;

    this.form.patchValue(arg.ARG);
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
