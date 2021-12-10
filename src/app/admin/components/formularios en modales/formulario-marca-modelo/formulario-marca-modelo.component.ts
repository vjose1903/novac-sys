import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DBservice } from '../../../../core/services/bdservice.service';
import { GLOBAL } from '../../../../core/services/GLOBAL';

import { ModalService } from '../../../components/modal/modal.service';
import * as _ from 'lodash';
import { TablasService } from '../../../components/tablas/tablas.service';
import { mixinClass } from '../../../mixinClass';
import { IpcService } from '../../../../core/services/ipc.service';
import { LayoutService } from '../../../layout/layout.service';

@Component({
  selector: 'app-formulario-marca-modelo',
  templateUrl: './formulario-marca-modelo.component.html',
  styleUrls: ['./formulario-marca-modelo.component.scss'],
})
export class FormularioMarcaModeloComponent extends mixinClass implements OnInit {
  @Input() tipo_formulario;

  componente;
  tituloTabla;
  @Output() accion_ = new EventEmitter<any>();
  form: FormGroup;
  info = [
    {
      titulo: 'Descripcion',
      key: 'descripcion',
    },
  ];

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
  obj_p = this.tServ.obj_paginate;
  constructor(
    private fb: FormBuilder,
    private dbServ: DBservice,
    public mServ: ModalService,
    private tServ: TablasService,
    public _ipc: IpcService,
    public layServ: LayoutService,
  ) {
    super(mServ, _ipc, layServ);
  }

  ngOnInit() {
    this.createForm();

    if (this.tipo_formulario === 'tipos_articulos') {
      this.componente = 'reg_tipo_articulos';
      this.tituloTabla = 'Tipos de articulos';
      this.campo1 = 'Tipo articulo';
    } else if (this.tipo_formulario === 'marcas') {
      this.componente = 'reg_marcas';
      this.tituloTabla = 'Marcas';
      this.campo1 = 'Marca';
    } else if (this.tipo_formulario === 'modelos') {
      this.componente = 'reg_modelos';
      this.tituloTabla = 'Modelos';
      this.campo1 = 'Marca';
      this.getMarcas();

      this.info = [
        {
          titulo: 'Marca',
          key: 'marca_nombre',
        },
        {
          titulo: 'Modelo',
          key: 'descripcion',
        },
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

  getMarcas() {
    // const page = e.page;
    // const per_page = e.per_page;
    // const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
    this.dbServ.getMarcasFiltradas(' ', 0, 0, false).subscribe((res) => {
      this.listaMarcas = GLOBAL.duplicarJson(res);
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

    if (this.componente === 'reg_modelos') {
      try {
        const res_modelos = await this.dbServ.getModelosFiltrados(palabra_a_buscar, arg.page, arg.per_page, true).toPromise();
        const res_marcas = await this.dbServ.getModelosFiltrados(palabra_a_buscar, arg.page, arg.per_page, true).toPromise();

        res_modelos.data.map((obj) => {
          obj.marca_nombre = obj.marca.descripcion;
          return obj;
        });

        this.listado = res_modelos.data;
        this.tServ.Func_total_paginas(res_modelos.total_registros);
      } catch (error) {
        console.error(error);

        this.dbServ.toastError('Error buscando modelos', 'ERROR');
      }
    } else if (this.componente === 'reg_marcas') {
      try {
        const res = await this.dbServ.getMarcasFiltradas(palabra_a_buscar, arg.page, arg.per_page, true).toPromise();

        this.listado = res.data;
        this.tServ.Func_total_paginas(res.total_registros);
      } catch (error) {
        console.error(error);

        this.dbServ.toastError('Error buscando marcas', 'ERROR');
      }
    }
  }

  accion(arg) {
    this.accion_.emit(arg);
  }
  async submit() {
    const obj = GLOBAL.duplicarJson(this.form.value);

    if (this.tipo_formulario !== 'modelos') {
      delete obj['marca_id'];
    }

    if (this.editando) {
      // ------------------------------------------- EDITANDO -------------------------------------------
      obj.id = this.editando.id;

      try {
        let res;
        if (this.tipo_formulario === 'modelos') {
          res = await this.dbServ.updateModelo(obj).toPromise();
          res.marca_nombre = res.marca.descripcion;
        } else if (this.tipo_formulario === 'marcas') {
          res = await this.dbServ.updateMarca(obj).toPromise();
        }
        this.dbServ.toastSuccess('Item editado correctamente.', 'CORRECTO');

        const temp = GLOBAL.duplicarJson(this.listado);
        const index = _.findIndex(temp, (o: any) => {
          return o.id === res.id;
        });
        temp[index] = res;
        this.listado = temp;
        this.borrar();

        if (this.tipo_formulario === 'modelos') {
          this.enfocarInput('marca_modal');
        } else {
          this.enfocarInput('descripcion');
        }
      } catch (error) {
        this.dbServ.toastError('Error editando item ', 'ERROR');
      }
    } else {
      // ------------------------------------------- CREANDO -------------------------------------------
      if (this.tipo_formulario === 'modelos') {
        this.dbServ.createModelo(obj).subscribe(
          (res) => {
            res.marca_nombre = res.marca.descripcion;
            this.listado = [...this.listado, res];
            this.enfocarInput('marca_modal');
            this.borrar();
            this.dbServ.toastSuccess('Modelo creado correctamente.', 'CORRECTO');
          },
          (err) => {},
        );
      } else if (this.tipo_formulario === 'marcas') {
        this.dbServ.createMarca(obj).subscribe(
          (res) => {
            this.listado = [...this.listado, res];
            this.enfocarInput('descripcion');
            this.borrar();
            this.dbServ.toastSuccess('Marca creada correctamente.', 'CORRECTO');
          },
          (err) => {},
        );
      }
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
    this.form.patchValue(arg.ARG);
    this.boton = 'Editar';
  }

  async decisionBorrar(arg) {
    if (arg) {
      let tipo;
      let tipo_e;
      if (this.tipo_formulario === 'marcas') {
        tipo = 'marcas';
        tipo_e = 'la marca';
      } else if (this.tipo_formulario === 'modelos') {
        tipo = 'modelos';
        tipo_e = 'el modelo';
      } else if (this.tipo_formulario === 'tipos_articulos') {
        tipo = 'tipo_articulos';
        tipo_e = 'el tipo de articulo';
      }
      try {
        const temp = GLOBAL.duplicarJson(this.listado);
        // this.listado = [];
        const res = await this.dbServ.deleteItem(this.seleccionModal.id, tipo).toPromise();
        const index = _.findIndex(temp, (o: any) => {
          return o.id === this.seleccionModal.id;
        });
        _.pullAt(temp, index);
        this.listado = temp;
        this.reinicioModal();
      } catch (error) {
        this.dbServ.toastError(`Error eliminando ${tipo_e}`, 'ERROR');
      }
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
