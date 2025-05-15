import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { serie, seriesDGII, seriesDgiiI } from '@core/typescript/constantes';
// import { CxP } from '@registros/registro-suplidores/suplidores';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { DateUtils } from '@vjose1903/dateutils';
import { ArticuloC } from '@registros/articulos/articulo';
import { ClienteC, CxC } from '@registros/registro-clientes/cliente';
import { ModalI } from '@components/modal/modal-class';
// import { TipoPagoReporte } from '../../../pagos/class/pagos/pagos';
// import { TipoReciboReporte } from '../../../pagos/class/ingresos/recibos';
import { reportField } from './form-reportes.component.model';
import { ReportDateTypeE, ReportGroupTypeE } from '@admin/reportes/reporte.utils';
import { tFacturaKey } from '@admin/facturacion/factura';

@Component({
  selector: 'app-form-reportes',
  templateUrl: './form-reportes.component.html',
  styleUrls: ['./form-reportes.component.scss'],
  standalone: false,
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
  dinamycSwitchReady: boolean = false;

  facturasSerieOptions: seriesDgiiI[] = seriesDGII({ includeAll: true });

  ReportDateTypeE = ReportDateTypeE;
  constructor(private fb: UntypedFormBuilder) {
    super();
  }

  modal: any = {};
  inputs: any;
  reportField = reportField;

  ngOnInit() {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.createForm();
    await this.checkDinamycFields();
    await this.agregateValidators();

    if (this.formarFecha.includes(this.inputs.tipo_reporte)) {
      this.Fecha = this.formarFechaFactura(new Date())['FechaFactura'];
    }
  }

  checkDinamycFields() {
    for (let index = 0; index < this.inputs?.dinamyc_selections?.length; index++) {
      const element = this.inputs.dinamyc_selections[index];
      element.id = fun.generateKey();

      this.form.addControl(element.formControl, this.fb.control(null));

      if (fun.hasValue(element?.validators)) this.form.controls[element.formControl].setValidators(element.validators);
    }
    setTimeout(() => (this.dinamycSelectionReady = true), 10);

    for (let index = 0; index < this.inputs?.dinamyc_switches?.length; index++) {
      const element = this.inputs.dinamyc_switches[index];
      element.id = fun.generateKey();
      this.form.addControl(element.formControl, this.fb.control(element.defaultValue ?? false));

      if (fun.hasValue(element?.validators)) this.form.controls[element.formControl].setValidators(element.validators);
    }
    setTimeout(() => (this.dinamycSwitchReady = true), 10);
  }

  async getArticulos(name) {
    if (fun.hasValue(name)) {
      fun.awaitTyping().then(res => {
        try {
          this.articuloClass.getArticulosFiltrado({ buscar: name, fecha: this.Fecha, paginado: false, is_compra: true }).then(res => (this.listaArticulos = res['data']));
        } catch (error) {
          console.error(error);
          fun.toastError('Error buscando articulos registrados.', 'ERROR');
        }
      });
    } else {
      this.listaArticulos = [];
    }
  }

  async getClientes(name) {
    if (fun.hasValue(name)) {
      fun.awaitTyping().then(res => {
        const extra = { afterPath: `filtro/${name}`, parameters: { paginado: false } };

        this.clienteClass.getAll(extra).then(res => {
          res['data'].map(cliente => {
            cliente.documentos_de_identidad.map(docu => {
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
    let serie_selected = null;
    let condicion_selected = null;
    const desde_hasta_includes = ['ventas_rango', 'notas', 'cuentas_con_pagos', 'ventas_cliente', 'suplidor_prod', 'recibos', 'movimientos_vehiculo', 'pago_facturas'];
    const desde_year_hasta_includes = ['cuentas_cobrar_ant_saldo', 'cuentas_pagar_ant_saldo', 'cuentas_cobrar_cliente'];
    const tipo_factura_includes = ['ventas_diarias', 'ventas_rango', 'ventas_cliente', 'movimientos_vehiculo'];

    if (this.inputs.tipo_reporte == 'cuadre') {
      this.form.controls.fecha.setValue(new Date());
      //
    } else if (this.inputs.tipo_reporte == 'ventas_diarias') {
      serie_selected = serie.all;
      tipo_selected = 'ventas_diarias';
      condicion_selected = 'todos';

      //
    } else if (this.inputs.tipo_reporte == 'recibos') {
      this.tipos = [
        { id: ReportGroupTypeE.detallado, label: 'Detallado' },
        { id: ReportGroupTypeE.agrupado, label: 'Agrupado' },
      ];

      tipo_selected = ReportGroupTypeE.detallado;
      //
    } else if (this.inputs.tipo_reporte == 'pago_facturas') {
      this.tipos = [
        // { id: TipoPagoReporte.detallado, label: 'Detallado' },
        // { id: TipoPagoReporte.agrupado, label: 'Agrupado' },
      ];

      tipo_selected = ReportGroupTypeE.detallado;
    } else if (this.inputs.tipo_reporte == 'ventas_rango') {
      this.tipos = [
        { id: ReportGroupTypeE.detallado, label: 'Detallado' },
        { id: ReportGroupTypeE.agrupado, label: 'Agrupado' },
      ];

      serie_selected = serie.all;
      tipo_selected = ReportGroupTypeE.detallado;
      condicion_selected = 'todos';

      //
    } else if (this.inputs.tipo_reporte == 'cuentas_cobrar_ant_saldo') {
      this.tipos = [
        { id: CxC.detallado, label: 'Detallado' },
        { id: CxC.agrupado, label: 'Agrupado' },
      ];
      //
    } else if (this.inputs.tipo_reporte == 'cuentas_pagar_ant_saldo') {
      this.tipos = [
        // { id: CxP.detallado, label: 'Detallado' },
        // { id: CxP.agrupado, label: 'Agrupado' },
      ];
      //
    } else if (this.inputs.tipo_reporte == 'notas') {
      this.tipos = [
        { label: 'Crédito', id: Ss.factServ.tipoFacturaId(tFacturaKey.nota_de_credito) },
        { label: 'Dédito', id: Ss.factServ.tipoFacturaId(tFacturaKey.nota_de_debito) },
        { label: 'Todas', id: 0 },
      ];
      //
    } else if (this.inputs.tipo_reporte == 'cuentas_con_pagos' || this.inputs.tipo_reporte == 'ventas_cliente') {
      this.setValidator('cliente_id');
      serie_selected = serie.all;

      if (this.inputs.tipo_reporte == 'ventas_cliente') {
        this.setValidator('tipo');
        condicion_selected = 'todos';
        this.form.controls.tipo.setValue('todos');
      }
    } else if (this.inputs.tipo_reporte == 'ventas_productos') {
      this.tipos = [
        { id: ReportDateTypeE.one_day, label: 'Dia único' },
        { id: ReportDateTypeE.range, label: 'Rango fechas' },
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

    if (fun.hasValue(serie_selected)) {
      this.form.controls.serie.setValue(serie_selected);
      this.setValidator('serie');
    }

    if (tipo_factura_includes.includes(this.inputs.tipo_reporte)) this.parseTipoFacturas();

    if (desde_hasta_includes.includes(this.inputs.tipo_reporte)) this.setDesdeHastaControls();
    if (desde_year_hasta_includes.includes(this.inputs.tipo_reporte)) this.setDesdeHastaControls({ begin_of_year: true });
  }

  setDesdeHastaControls(params?: { begin_of_year?: boolean }) {
    if (fun.isEmpty(params)) params = {};
    if (fun.isEmpty(params?.begin_of_year)) params.begin_of_year = false;

    const actual_date = new Date();
    const desde = params.begin_of_year ? DateUtils.getFirstDayOfYear({ year: actual_date.getFullYear() }) : DateUtils.getFirstDayOfMonth({ month: actual_date.getMonth() + 1, year: actual_date.getFullYear() });

    this.form.controls.desde.setValue(desde);
    this.form.controls.hasta.setValue(actual_date);

    this.setValidator('desde');
    this.setValidator('hasta');
  }

  reportTypeHasfield(reportType: string) {
    const reportTypeMap = {
      [reportField.dynamicSelection]: ['movimientos_vehiculo'],
      [reportField.customerField]: ['ventas_cliente', 'cuentas_con_pagos', 'cuentas_cobrar_cliente'],
      [reportField.serieField]: ['ventas_diarias', 'ventas_rango', 'ventas_cliente'],
      [reportField.conditionField]: ['ventas_cliente', 'ventas_rango', 'ventas_diarias'],
      [reportField.typeField]: ['ventas_rango', 'recibos', 'ventas_productos', 'cuentas_cobrar_ant_saldo', 'notas', 'pago_facturas', 'cuentas_pagar_ant_saldo'],
      [reportField.billTypeField]: ['ventas_diarias', 'ventas_rango', 'ventas_cliente'],
      [reportField.articuloField]: ['suplidor_prod'],
      [reportField.dateField]: ['cuadre'],
      [reportField.fromField]: ['notas', 'ventas_rango', 'suplidor_prod', 'recibos', 'cuentas_con_pagos', 'ventas_cliente', 'cuentas_cobrar_ant_saldo', 'movimientos_vehiculo', 'cuentas_pagar_ant_saldo', 'pago_facturas', 'cuentas_cobrar_cliente'],
      [reportField.toDateField]: ['notas', 'ventas_rango', 'suplidor_prod', 'recibos', 'cuentas_con_pagos', 'ventas_cliente', 'cuentas_cobrar_ant_saldo', 'movimientos_vehiculo', 'cuentas_pagar_ant_saldo', 'pago_facturas', 'cuentas_cobrar_cliente'],
      [reportField.simpleSwitchField]: ['cuentas_cobrar_ant_saldo', 'cuentas_pagar_ant_saldo', 'cuentas_cobrar_cliente'],
    };

    return reportTypeMap[reportType].includes(this.inputs.tipo_reporte);
  }

  parseTipoFacturas() {
    const tipos_aceptados = [
      tFacturaKey.factura_de_credito_fiscal,
      tFacturaKey.factura_de_consumo,
      tFacturaKey.comprobante_compras,
      tFacturaKey.gastos_menores,
      tFacturaKey.regimenes_especiales,
      tFacturaKey.gubernamental,
      tFacturaKey.comprobante_de_exportaciones,
      tFacturaKey.comprobante_pagos_al_exterior,
    ];

    this.tipos_facturas = [{ label: 'Todos', id: 0 }];

    fun.deepCloning(Ss.factServ.lista_tipos_facturas).forEach(tipo_factura => {
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
      ['fecha', 'desde', 'hasta'].forEach(control => this.removeValidator(control));

      if (control.tipo.value == ReportDateTypeE.one_day) {
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
    this.form = this.fb.group({
      cliente_id: [null],
      articulo_id: [null],
      tipo: [null],
      tipo_factura_id: [null],
      condicion: [null],
      fecha: [null],
      desde: [null],
      hasta: [null],
      serie: [null],
    });
  }

  btn_aceptar() {
    const modal = this.modal.instance.modalsConfig.find(config => config.id == this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    modal.returnDataFromModal({ data: { ...this.form.value, switchGroup: { ...this.inputs.switchGroup } }, modal_id: this.modal.component_id });
  }
}
