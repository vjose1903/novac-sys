import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { FunctionService } from '../../../../core/services/functions.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { TablasService } from '../../../components/tablas/tablas.service';
import { OtrosCostosC } from './otroCosto';

@Component({
  selector: 'app-otros-costos-form',
  templateUrl: './otros-costos-form.component.html',
  styleUrls: ['./otros-costos-form.component.scss'],
})
export class OtrosCostosFormComponent extends MixinClass implements OnInit {
  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private tServ: TablasService) {
    super();
  }

  form;
  listado = [];
  info = [
    { titulo: 'Descripcion', key: 'descripcion', tipo: 'text' },
    { titulo: 'Costo', key: 'costo', tipo: 'formatoNumero' },
  ];

  OtrosCostosClass: OtrosCostosC;
  botones = { titulo: true, borrar: true, editar: true };
  boton;
  otroCostoSelect;

  ngOnInit(): void {
    this.initVariables();
    this.getOtrosCostos(this.tServ.obj_paginate.default);
    this.createForm();
    this.enfocarInput('descripcion');
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
      descripcion: [{ value: null, disabled: false }, Validators.required],
      costo: [{ value: null, disabled: false }, Validators.required],
      estado: [true],
    });
  }

  async getOtrosCostos(e) {
    const page = e.page;
    const per_page = e.per_page;
    const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
    this.listado = [];
    const res = await this.OtrosCostosClass.getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page, per_page, paginado: true } });
    res.data.map((otroCosto) => {
      return otroCosto;
    });

    this.listado = res.data;
    const obj = { total: res.total_registros, tabla: 'otrosCostos' };

    this.tServ.Func_total_paginas(obj);
  }

  initVariables() {
    this.OtrosCostosClass = new OtrosCostosC();
    this.boton = 'Registrar';
    this.otroCostoSelect = undefined;
  }

  capitalice(control, arg, form) {
    const campo = form.get(control);
    campo.setValue(this.fun.Capitalice(arg));
  }

  editarItem(item) {
    console.log('item ', item);
    this.boton = 'Editar';
    this.otroCostoSelect = item.ARG;
    this.form.patchValue(item.ARG);
  }

  eliminarReg(regisData) {
    console.log('regisData ', regisData);

    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar el otro costo <b>${regisData.ARG.descripcion}</b>?`,
      siFunction: () => {
        const actualPagination = this.tServ.getPaginationById('otrosCostos');
        this.OtrosCostosClass.deleteOne(regisData.ARG.id).then((res) => this.getOtrosCostos(actualPagination));
      },
    };

    this.eliminarRegistro(objToSend);
  }

  borrar() {
    this.initVariables();
    this.form.reset({ estado: true });
  }

  submit() {
    const formulario = this.form.getRawValue();
    console.log('formulario ', formulario);

    this.OtrosCostosClass.createUpdateOne(formulario).then((res) => {
      const actualPagination = this.tServ.getPaginationById('otrosCostos');
      this.getOtrosCostos(actualPagination);
      this.borrar();
      this.enfocarInput('descripcion');
    });
  }
}
