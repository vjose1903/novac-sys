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
    { titulo: 'Precio', key: 'precio', tipo: 'formatoNumero' },
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
      key: [{ value: null, disabled: false }, Validators.required],
      costo: [{ value: null, disabled: false }, Validators.required],
      precio: [{ value: null, disabled: false }, Validators.required],
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
      otroCosto.precio = this.fun.numFormatTwoDecimals(otroCosto.precio);
      otroCosto.costo = this.fun.numFormatTwoDecimals(otroCosto.costo);
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

  revisarPrecio(id) {
    const input = this.form.controls[id];

    this.fun.revisarPrecio(input, id).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  capitalice(control, arg, form) {
    const campo = form.get(control);
    campo.setValue(this.fun.Capitalice(arg));
  }

  editarItem(item) {
    this.boton = 'Editar';
    this.otroCostoSelect = item.ARG;
    this.form.patchValue(item.ARG);
    this.form.controls.key.disable();
  }

  eliminarReg(regisData) {
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
    this.form.controls.key.enable();
  }

  submit() {
    const formulario = this.form.getRawValue();

    formulario.precio = this.fun.desformatear(formulario.precio);
    formulario.costo = this.fun.desformatear(formulario.costo);

    this.OtrosCostosClass.createUpdateOne(formulario).then((res) => {
      const actualPagination = this.tServ.getPaginationById('otrosCostos');
      this.getOtrosCostos(actualPagination);
      this.borrar();
      this.enfocarInput('descripcion');
    });
  }
}
