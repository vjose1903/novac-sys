import { tFacturaD } from './../../../facturacion/factura';
import { Permisos } from './../../../../core/typescript/permisos';
import { Ss } from './../../../../core/services/singleton.service';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import * as moment from '../../../../core/javascript/moment';

import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ArticuloC } from '../../../registros/articulos/articulo';
import { ClienteC } from '../../../registros/registro-clientes/cliente';
import { ModalI } from '../../modal/modal-class';
import { fun } from '../../../../core/services/functions.service';

@Component({
  selector: 'app-form-reportes',
  templateUrl: './form-reportes.component.html',
  styleUrls: ['./form-reportes.component.scss'],
})
export class FormReportesComponent extends MixinClass implements OnInit, ModalI {
  fun = fun;

  form: UntypedFormGroup;

  condiciones = [
    { id: 'Crédito', label: 'Crédito' },
    { id: 'Contado', label: 'Contado' },
    { id: 'todos', label: 'Todos' },
  ];

  tipos;
  tipos_facturas;

  filtro_articulo;
  listaArticulos = [];
  listaClientes = [];
  permissions = Permisos;
  formarFecha = ['suplidor_prod'];
  Fecha: string;
  articuloClass = new ArticuloC();
  clienteClass = new ClienteC();
  dinamycSelectionReady: boolean = false;

  constructor(private fb: UntypedFormBuilder) {
    super();
  }

  modal: any = {};
  inputs: any;

  ngOnInit() {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.createForm();
    await this.checkDinamycSelections();
    await this.agregateValidators();

    if (this.formarFecha.includes(this.inputs.tipo_reporte)) {
      this.Fecha = this.formarFechaFactura(new Date())['FechaFactura'];
    }
  }

  checkDinamycSelections() {
    for (let index = 0; index < this.inputs?.dinamyc_selections?.length; index++) {
      const element = this.inputs.dinamyc_selections[index];

      this.form.addControl(element.formControl, this.fb.control(null));

      if (fun.hasValue(element?.validators)) this.form.controls[element.formControl].setValidators(element.validators);
    }
    setTimeout(() => (this.dinamycSelectionReady = true), 10);
  }

  async getArticulos(arg) {
    if (arg.term && arg.term !== '') {
      fun.awaitTyping().then((res) => {
        try {
          this.articuloClass.getArticulosFiltrado({ buscar: arg.term, fecha: this.Fecha, paginado: false, is_compra: true }).then((res) => (this.listaArticulos = res['data']));
        } catch (error) {
          console.error(error);
          fun.toastError('Error buscando articulos registrados.', 'ERROR');
        }
      });
    } else {
      this.listaArticulos = [];
    }
  }

  async getClientes(arg) {
    if (arg.term && arg.term !== '') {
      fun.awaitTyping().then((res) => {
        const extra = { afterPath: `filtro/${arg.term}`, parameters: { paginado: false } };

        this.clienteClass.getAll(extra).then((res) => {
          res['data'].map((cliente) => {
            cliente.documentos_de_identidad.map((docu) => {
              if (docu.principal) cliente.documento_identidad = docu.documento;
            });
            return cliente;
          });

          this.listaClientes = res['data'];
        });
      });
    } else {
      this.listaClientes = [];
    }
  }

  agregateValidators() {
    let tipo_selected = null;
    let condicion_selected = null;
    const desde_hasta_includes = ['ventas_rango', 'notas', 'cuentas_con_pagos', 'ventas_cliente', 'suplidor_prod', 'recibos', 'movimientos_vehiculo'];
    const tipo_factura_includes = ['ventas_diarias', 'ventas_rango', 'ventas_cliente', 'movimientos_vehiculo'];

    if (this.inputs.tipo_reporte == 'cuadre') {
      this.form.controls.fecha.setValue(new Date());
      //
    } else if (this.inputs.tipo_reporte == 'ventas_diarias') {
      tipo_selected = 'ventas_diarias';
      condicion_selected = 'todos';

      //
    } else if (this.inputs.tipo_reporte == 'recibos') {
      this.tipos = [
        { id: 'detallado', label: 'Detallado' },
        { id: 'agrupado', label: 'Agrupado' },
      ];

      tipo_selected = 'detallado';
    } else if (this.inputs.tipo_reporte == 'ventas_rango') {
      this.tipos = [
        { id: 'detallado', label: 'Detallado' },
        { id: 'agrupado', label: 'Agrupado' },
      ];

      tipo_selected = 'detallado';
      condicion_selected = 'todos';

      //
    } else if (this.inputs.tipo_reporte == 'cuentas_cobrar_ant_saldo') {
      this.tipos = [
        { id: '2', label: 'Detallado' },
        { id: '3', label: 'Agrupado' },
      ];
      //
    } else if (this.inputs.tipo_reporte == 'notas') {
      this.tipos = [
        { label: 'Crédito', id: Ss.factServ.tipoFacturaId(tFacturaD.nota_de_credito) },
        { label: 'Dédito', id: Ss.factServ.tipoFacturaId(tFacturaD.nota_de_debito) },
        { label: 'Todas', id: 0 },
      ];
      //
    } else if (this.inputs.tipo_reporte == 'cuentas_con_pagos' || this.inputs.tipo_reporte == 'ventas_cliente') {
      this.setValidator('cliente_id');

      if (this.inputs.tipo_reporte == 'ventas_cliente') {
        this.setValidator('tipo');
        condicion_selected = 'todos';
        this.form.controls.tipo.setValue('todos');
      }
    } else if (this.inputs.tipo_reporte == 'ventas_productos') {
      this.tipos = [
        { id: '1', label: 'Dia único' },
        { id: '2', label: 'Rango fechas' },
      ];
      //
    }

    if (fun.hasValue(condicion_selected)) {
      this.form.controls.condicion.setValue(condicion_selected);
      this.setValidator('condicion');
    }

    if (fun.hasValue(tipo_selected)) {
      this.form.controls.tipo.setValue(tipo_selected);
      this.setValidator('tipo');
    }

    if (tipo_factura_includes.includes(this.inputs.tipo_reporte)) this.parseTipoFacturas();

    if (desde_hasta_includes.includes(this.inputs.tipo_reporte)) this.setDesdeHastaControls();
  }

  setDesdeHastaControls() {
    let desde_temp = new Date();
    desde_temp.setDate(desde_temp.getDate() - 1);

    const desde = new Date(fun.getFirstDayOfMoth(desde_temp));

    this.form.controls.desde.setValue(desde);
    this.form.controls.hasta.setValue(new Date());

    this.setValidator('desde');
    this.setValidator('hasta');
  }

  parseTipoFacturas() {
    const tipos_aceptados = [
      'Factura con valor fiscal',
      'Factura de consumo',
      'Comprobante de compras',
      'Registro de unico ingreso',
      'Comprobante para gastos menores',
      'Comprobante de regimen especiales',
      'Comprobante gubernamental',
      'Comprobante para exportaciones',
      'Comprobantes para pago al exterior',
    ];

    this.tipos_facturas = [{ label: 'Todos', id: 0 }];

    fun.duplicarJson(Ss.factServ.lista_tipos_facturas).forEach((tipo_factura) => {
      if (tipos_aceptados.includes(tipo_factura.descripcion)) {
        this.tipos_facturas.push({ label: tipo_factura.descripcion, id: Number(tipo_factura.id) });
      }
    });

    this.form.controls.tipo_factura_id.setValue(0);
    this.setValidator('tipo_factura_id');
  }

  changeTipo() {
    const control = this.form.controls;

    if (this.inputs.tipo_reporte == 'ventas_productos') {
      ['fecha', 'desde', 'hasta'].forEach((control) => this.removeValidator(control));

      if (control.tipo.value == '1') {
        this.form.controls.fecha.setValue(new Date());
        this.setValidator('fecha');
      } else {
        this.setDesdeHastaControls();
      }
    }
  }

  setValidator(control) {
    this.form.controls[control].setValidators(Validators.required);
    this.form.controls[control].updateValueAndValidity();
  }

  removeValidator(control) {
    this.form.controls[control].setValidators([]);
    this.form.controls[control].updateValueAndValidity();
  }

  createForm() {
    this.form = this.fb.group({ cliente_id: [null], articulo_id: [null], tipo: [null], tipo_factura_id: [null], condicion: [null], fecha: [null], desde: [null], hasta: [null] });
  }

  btn_aceptar() {
    const modal = this.modal.instance.modalsConfig.find((config) => config.id == this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    modal.returnDataFromModal({ data: { ...this.form.value, switches: { ...this.inputs.switches } }, modal_id: this.modal.component_id });
  }
}
