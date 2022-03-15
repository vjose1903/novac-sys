import { EventEmitter } from '@angular/core';
import { Component, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import * as moment from '../../../../core/javascript/moment';

import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ArticuloC } from '../../../registros/articulos/articulo';
import { ClienteC } from '../../../registros/registro-clientes/cliente';
import { ModalI } from '../../new_modal/modal-class';
import * as _ from 'lodash';

@Component({
  selector: 'app-form-reportes',
  templateUrl: './form-reportes.component.html',
  styleUrls: ['./form-reportes.component.scss'],
})
export class FormVentasComponent extends MixinClass implements OnInit, ModalI {
  @Input() tipo_reporte;
  @Input() switches;

  @Output() seleccion = new EventEmitter<any>();
  form: FormGroup;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();

  condiciones = [
    { id: 'Crédito', label: 'Crédito' },
    { id: 'Contado', label: 'Contado' },
    { id: 'todos', label: 'Todos' },
  ];

  tipos;

  filtro_articulo;
  listaArticulos = [];
  listaClientes = [];

  formarFecha = ['suplidor_prod'];
  Fecha: string;
  articuloClass = new ArticuloC();
  clienteClass = new ClienteC();

  constructor(private fb: FormBuilder, private localeService: BsLocaleService) {
    super();
    this.dpConfig = Object.assign(
      {},
      {
        // locale:'es',
        showWeekNumbers: false,
        maxDate: new Date(),
        dateInputFormat: 'DD/MM/YYYY',
      },
    );
  }
  modal: any = {};
  inputs: any;
  btn_aceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    modal.getDataModal({ data: { ...this.form.value, switches: { ...this.switches } }, modal_id: this.modal.component_id });
    // throw new Error('Method not implemented.');
  }

  ngOnInit() {
    console.log('🚀 ~ file: form-reportes.component.ts ~ line 207 ~ FormVentasComponent ~ inputs', this.inputs);
    this.tipo_reporte = this.inputs.tipo_reporte;
    this.switches = this.inputs.switches;
    this.localeService.use('es');
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.createForm();
    await this.agregateValidators();

    if (this.formarFecha.includes(this.tipo_reporte)) {
      this.Fecha = this.formarFechaFactura(new Date())['FechaFactura'];
    }
  }

  async getArticulos(arg) {
    if (arg.term && arg.term !== '') {
      this.fun.awaitTyping().then((res) => {
        try {
          this.articuloClass.getArticulosFiltrado({ buscar: arg.term, fecha: this.Fecha, paginado: false, is_compra: true }).then((res) => (this.listaArticulos = res['data']));
        } catch (error) {
          console.error(error);
          this.fun.toastError('Error buscando articulos registrados.', 'ERROR');
        }
      });
    } else {
      this.listaArticulos = [];
    }
  }

  async getClientes(arg) {
    if (arg.term && arg.term !== '') {
      this.fun.awaitTyping().then((res) => {
        const extra = { afterPath: `filtro/${arg.term}`, parameters: { paginado: false } };

        this.clienteClass.getAll(extra).then((res) => {
          res['data'].map((cliente) => {
            cliente.documentos_de_identidad.map((docu) => {
              if (docu.principal) cliente.documento_identidad = docu.documento;
            });
            return cliente;
          });

          this.listaClientes = res['data'];

          // const obj = { total: res['total_registros'], tabla: 'lista_clientes' };
          // this.tServ.Func_total_paginas(obj);
        });
      });
    } else {
      console.log('🚀 ~ file: form-reportes.component.ts ~ line 118 ~ FormVentasComponent ~ getClientes ~ else');
      this.listaClientes = [];
    }
  }

  getFirstDayOfMoth() {
    const month = moment().month() + 1;
    const year = moment().year();
    const temp = `${year}-${month}-01`;
    return temp;
  }

  agregateValidators() {
    if (this.tipo_reporte === 'cuadre') {
      this.form.controls.fecha.setValue(new Date());
    } else if (this.tipo_reporte === 'ventas_diarias') {
      this.form.controls.tipo.setValue(1);
      this.setValidator('condicion');
    } else if (this.tipo_reporte === 'ventas_rango') {
      this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
      this.form.controls.hasta.setValue(new Date());
      this.form.controls.tipo.setValue(2);

      this.setValidator('condicion');
      this.setValidator('desde');
      this.setValidator('hasta');
    } else if (this.tipo_reporte === 'cuentas_cobrar_ant_saldo') {
      this.tipos = [
        { id: '2', label: 'Detallado' },
        { id: '3', label: 'Agrupado' },
      ];
    } else if (this.tipo_reporte === 'ventas_productos') {
      this.tipos = [
        { id: '1', label: 'Dia único' },
        { id: '2', label: 'Rango fechas' },
      ];
    } else if (this.tipo_reporte === 'cuentas_con_pagos') {
      this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
      this.form.controls.hasta.setValue(new Date());
      this.setValidator('cliente_id');
      this.setValidator('desde');
      this.setValidator('hasta');
    } else if (this.tipo_reporte === 'suplidor_prod') {
      this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
      this.form.controls.hasta.setValue(new Date());
      this.setValidator('desde');
      this.setValidator('hasta');
    } else if (this.tipo_reporte === 'recibos') {
      this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
      this.form.controls.hasta.setValue(new Date());
      this.form.controls.tipo.setValue('todos');
      this.setValidator('desde');
      this.setValidator('hasta');
      this.tipos = [
        { id: 'viajes', label: 'Viajes' },
        { id: 'normal', label: 'Normal' },
        { id: 'todos', label: 'Todos' },
      ];
    }
  }

  changeTipo() {
    const control = this.form.controls;
    if (this.tipo_reporte === 'ventas_productos') {
      if (control.tipo.value === '1') {
        this.form.controls.fecha.setValue(new Date());
      } else {
        this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
        this.form.controls.hasta.setValue(new Date());
      }
    }
  }

  setValidator(control) {
    this.form.controls[control].setValidators(Validators.required);
    this.form.controls[control].updateValueAndValidity();
  }

  createForm() {
    this.form = this.fb.group({
      cliente_id: [null],
      articulo_id: [null],
      tipo: [null],
      condicion: [null],
      fecha: [null],
      desde: [null],
      hasta: [null],
    });
  }

  accion(arg) {
    this.seleccion.emit({ bool: arg, obj: this.form.value });
  }
}
