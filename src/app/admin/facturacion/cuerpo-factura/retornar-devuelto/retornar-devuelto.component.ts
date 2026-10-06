import { HtmlElementsService } from '@core/services/html-elements.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { fun } from '@core/services/functions.service';
import { Component, DoCheck, Input, OnInit, inject } from '@angular/core';
import * as _ from 'lodash';
import { UntypedFormBuilder } from '@angular/forms';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { DetalleFactura } from '@admin/facturacion/factura';

@Component({
  selector: 'app-retornar-devuelto',
  templateUrl: './retornar-devuelto.component.html',
  styleUrls: ['./retornar-devuelto.component.scss'],
  standalone: false,
})
export class RetornarDevueltoComponent extends MixinClass implements OnInit, IDynamicModal, DoCheck {
  constructor(private fb: UntypedFormBuilder) {
    super();
  }
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  @Input() data: DetalleFactura;
  @Input() articulo_defectuoso: DetalleFactura;
  @Input() articulo_solo_devuelto: DetalleFactura;
  @Input() tipo: string;
  @Input() is_articulo_selected: boolean;
  @Input() nombre: string;
  @Input() devueltos_list: DetalleFactura[];

  form;
  fun = fun;

  table_config: table_config = {
    info: [
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion' },
      { titulo: 'Tipo', tipo: 'text', key: 'tipo' },
      { titulo: 'Cantidad', tipo: 'formatoNumero', key: 'cantidad' },
    ],
    colores: true,
    id_tabla: 'retornar_articulo',
    filtrar: { show: false, local: true },
    obj_paginate: { show: true, showTotal: false, showDropDown: false, page: 1, per_page: 9999, per_page_options: default_per_page, search: ' ', is_local: true },
  };

  articuloSelected;

  tablaComponent;

  htmlServ = inject(HtmlElementsService);

  ngOnInit() {
    this.createForm();
  }

  ngDoCheck() {
    this.btnAceptarIsDisabled();
  }

  tableClickRow(event) {
    this.form.controls['defectuoso'].disable();
    this.form.controls['solo_devuelto'].disable();

    this.articuloSelected = fun.deepCloning(event.data);

    const currentControl = this.articuloSelected.is_defectuoso ? 'defectuoso' : 'solo_devuelto';
    this.form.controls[currentControl].enable();

    const currentKey = currentControl == 'defectuoso' ? 'articulo_defectuoso' : 'articulo_solo_devuelto';
    this.articulo_solo_devuelto = null;
    this.articulo_defectuoso = null;

    if (currentKey == 'articulo_defectuoso') this.articulo_defectuoso = fun.deepCloning(event.data);
    else if (currentKey == 'articulo_solo_devuelto') this.articulo_solo_devuelto = fun.deepCloning(event.data);

    this.data = fun.deepCloning(event.data.producto_initial);

    this.enfocarInitInput();
  }

  enfocarInitInput() {
    let input_enfocar;

    if (fun.hasValue(this.data) || fun.hasValue(this.articulo_solo_devuelto) || fun.hasValue(this.articulo_defectuoso)) {
      if (this.data?.is_devuelto) {
        input_enfocar = 'devuelto';
      } else {
        if (fun.hasValue(this.articulo_solo_devuelto?.cantidad)) {
          input_enfocar = 'solo_devuelto';
        } else {
          input_enfocar = 'defectuoso';
        }
      }

      fun.enfocarAndSelectInput(input_enfocar);
    }
  }

  createForm() {
    this.form = this.fb.group({
      devuelto: [{ value: null, disabled: false }],
      solo_devuelto: [{ value: null, disabled: fun.isEmpty(this.articulo_solo_devuelto?.cantidad) }],
      defectuoso: [{ value: null, disabled: fun.isEmpty(this.articulo_defectuoso?.cantidad) }],
    });
  }

  saltar(sali_de) {
    if (this.checkCantidad(sali_de)) {
      let nextFunction = this.btn_aceptar.bind(this);

      if (sali_de == 'solo_devuelto' && fun.hasValue(this.articulo_defectuoso?.cantidad)) {
        fun.enfocarAndSelectInput('defectuoso');
        nextFunction = undefined;
      }

      if (typeof nextFunction == 'function') nextFunction();
    }
  }

  btnAceptarIsDisabled() {
    const aceptar_btn = this.modalConfig.botones.find(btn => btn.id == 'btn_aceptar');

    const formulario = this.form.getRawValue();
    const valores = [formulario.solo_devuelto, formulario.defectuoso, formulario.devuelto];

    aceptar_btn.disable = _.every(valores, valor => fun.isEmpty(valor) || valor == 0);
    return aceptar_btn.disable;
  }

  getCurrentDevuelto(cantidad) {
    if (fun.isEmpty(cantidad)) return '0.00';
    return fun.roundNumberToDecimal(cantidad);
  }

  checkCantidad(tipo) {
    const formulario = this.form.getRawValue();
    let todo_bien = true;

    if (formulario[tipo] < 0) {
      fun.toastWarning('La cantidad no puede ser menor a 0.');
      this.form.controls[tipo].setValue(0);
      fun.enfocarAndSelectInput(tipo);
      todo_bien = false;
    }

    const entidades = { solo_devuelto: this.articulo_solo_devuelto?.cantidad || 0, defectuoso: this.articulo_defectuoso?.cantidad || 0, devuelto: this.data?.cantidad || 0 };

    if (formulario[tipo] > entidades[tipo]) {
      fun.toastWarning('La cantidad no puede ser mayor a la cantidad devuelta.');
      this.form.controls[tipo].setValue(entidades[tipo]);
      fun.enfocarAndSelectInput(tipo);
      todo_bien = false;
    }
    return todo_bien;
  }

  btn_aceptar() {
    if (this.btnAceptarIsDisabled()) {
      fun.toastError('Complete los campos para retornar el articulo.', 'ERROR');
      return;
    }

    const obj = { key: this.data.key };
    const informacion_retornar = this.form.getRawValue();

    obj['retorno'] = {
      solo_devuelto: { key: this.articulo_solo_devuelto?.key, cantidad: informacion_retornar.solo_devuelto, origin: this.articulo_solo_devuelto?.producto_initial },
      defectuoso: { key: this.articulo_defectuoso?.key, cantidad: informacion_retornar.defectuoso, origin: this.articulo_defectuoso?.producto_initial },
    };

    if (this.data.is_devuelto) {
      obj['retorno'][this.tipo] = { key: this.data?.key, cantidad: informacion_retornar.devuelto, origin: this.data?.producto_initial };
    }

    this.modalConfig.close(obj);
  }
}
