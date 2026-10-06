import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, computed, effect, inject, Input, OnInit, signal } from '@angular/core';
import { serie, seriesDGII, seriesDgiiI } from '@core/typescript/constantes';
// import { CxP } from '@registros/registro-suplidores/suplidores';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { DateUtils } from '@vjose1903/dateutils';
import { ArticuloC } from '@registros/articulos/articulo';
import { ClienteC, CxC } from '@registros/registro-clientes/cliente';
// import { TipoPagoReporte } from '../../../pagos/class/pagos/pagos';
// import { TipoReciboReporte } from '../../../pagos/class/ingresos/recibos';
import { dynamicFieldConfig, formControlMap, reportField, switchGroup } from './form-reportes.component.model';
import { ReportDateTypeE, ReportGroupTypeE } from '@admin/reportes/reporte.utils';
import { tFacturaKey } from '@admin/facturacion/factura';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-form-reportes',
  templateUrl: './form-reportes.component.html',
  styleUrls: ['./form-reportes.component.scss'],
  standalone: false,
})
export class FormReportesComponent extends MixinClass implements OnInit, IDynamicModal {
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
  advancedFiltersReady: boolean = false;

  facturasSerieOptions: seriesDgiiI[] = seriesDGII({ includeAll: true });

  ReportDateTypeE = ReportDateTypeE;
  reportField = reportField;

  currentReportFields: string[] = [];
  formUpdateTrigger = signal(0);

  isSomeFieldEmpty = computed(() => {
    this.formUpdateTrigger(); // Trigger dependency
    if (!this.form) return false;
    const formValue = this.form.getRawValue();
    return this.currentReportFields.some(field => fun.isEmpty(formValue[field]));
  });

  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  @Input() tipo_reporte!: any;
  @Input() dynamic_selections!: any;
  @Input() dynamic_switches!: any;
  @Input() simpleSwitchAfterType = false;
  @Input() conditionalRender!: any;
  @Input() switchGroup!: switchGroup;
  @Input() advanced_filters!: dynamicFieldConfig[];

  advancedFiltersAccordionValue: string | number | string[] | number[] | null = null;
  previousColumnasAntiguedadSelection: string[] = [];
  is_external = false;

  private readonly externalReportTypes = ['ventas_diarias', 'ventas_rango'];
  private lastExternalReportClickAt = 0;
  private previousExternalReportFormState: { serie: any; condicion: any; tipo_factura_id: any } | null = null;

  private fb = inject(UntypedFormBuilder);

  constructor() {
    super();

    effect(() => {
      const isSomeFieldEmpty = this.isSomeFieldEmpty();
      this.changeAcceptBtnStatus();
    });
  }

  ngOnInit() {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.createForm();
    await this.checkDynamicFields();
    await this.addValidators();
    this.handleAdvancedFiltersRules();
    await this.verifyReportFields({ setValue: true });

    this.subscribeFormChanges();

    // Dispara la validación inicial
    this.formUpdateTrigger.set(1);

    if (this.formarFecha.includes(this.tipo_reporte)) {
      this.Fecha = this.formarFechaFactura(new Date())['FechaFactura'];
    }
  }

  changeAcceptBtnStatus() {
    const acceptBtn = this.modalConfig.botones.find(btn => btn.id == 'accept');
    if (fun.hasValue(acceptBtn)) {
      fun.setTimeout(() => {
        acceptBtn.disable = this.isSomeFieldEmpty();
      }, 10);
    }
  }

  subscribeFormChanges() {
    this.form.valueChanges.pipe(debounceTime(50)).subscribe(() => {
      this.handleAdvancedFiltersRules();
      this.verifyReportFields({ setValue: false });
      this.formUpdateTrigger.update(val => val + 1);
    });
  }

  checkDynamicFields() {
    return new Promise<void>((resolve, reject) => {
      if (fun.hasValue(this.dynamic_selections)) {
        for (let index = 0; index < this.dynamic_selections?.length; index++) {
          const element = this.dynamic_selections[index];
          element.id = fun.generateKey();

          this.form.addControl(element.formControl, this.fb.control(null));

          if (element.initialValue) this.form.controls[element.formControl].setValue(element.initialValue);

          if (fun.hasValue(element?.validators)) this.form.controls[element.formControl].setValidators(element.validators);
        }

        fun.setTimeout(() => {
          this.dinamycSelectionReady = true;
        }, 10);
      }

      if (fun.hasValue(this.dynamic_switches)) {
        for (let index = 0; index < this.dynamic_switches?.length; index++) {
          const element = this.dynamic_switches[index];
          element.id = fun.generateKey();
          this.form.addControl(element.formControl, this.fb.control(element.defaultValue ?? false));

          if (fun.hasValue(element?.validators)) this.form.controls[element.formControl].setValidators(element.validators);
        }

        fun.setTimeout(() => {
          this.dinamycSwitchReady = true;
        }, 10);
      }

      if (fun.hasValue(this.advanced_filters)) {
        for (let index = 0; index < this.advanced_filters?.length; index++) {
          const element = this.advanced_filters[index];

          this.form.addControl(element.formControl, this.fb.control(element.defaultValue ?? element.initialValue ?? null));

          if (fun.hasValue(element?.validators)) this.form.controls[element.formControl].setValidators(element.validators);
        }

        fun.setTimeout(() => {
          this.advancedFiltersReady = true;
        }, 10);
      }

      fun.setTimeout(() => {
        resolve();
      }, 10);
    });
  }

  async getArticulos(name) {
    if (fun.hasValue(name)) {
      fun.awaitTyping().then(res => {
        try {
          this.articuloClass.getArticulosFiltrado({ buscar: name, fecha: this.Fecha, paginado: false, is_compra: true, mode: 'select' }).then(res => (this.listaArticulos = res['data']));
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

  addValidators() {
    let tipo_selected = null;
    let serie_selected = null;
    let condicion_selected = null;
    const desde_hasta_includes = ['ventas_rango', 'notas', 'cuentas_con_pagos', 'ventas_cliente', 'suplidor_prod', 'recibos', 'movimientos_vehiculo', 'pago_facturas'];
    const desde_year_hasta_includes = ['cuentas_cobrar_ant_saldo', 'cuentas_pagar_ant_saldo', 'cuentas_cobrar_cliente'];
    const tipo_factura_includes = ['ventas_diarias', 'ventas_rango', 'ventas_cliente', 'movimientos_vehiculo'];

    if (this.tipo_reporte == 'cuadre') {
      this.form.controls.fecha.setValue(new Date());
      //
    } else if (this.tipo_reporte == 'ventas_diarias') {
      serie_selected = serie.all;
      tipo_selected = 'ventas_diarias';
      condicion_selected = 'todos';

      //
    } else if (this.tipo_reporte == 'recibos') {
      this.tipos = [
        { id: ReportGroupTypeE.detallado, label: 'Detallado' },
        { id: ReportGroupTypeE.agrupado, label: 'Agrupado' },
      ];

      tipo_selected = ReportGroupTypeE.detallado;
      //
    } else if (this.tipo_reporte == 'pago_facturas') {
      this.tipos = [
        // { id: TipoPagoReporte.detallado, label: 'Detallado' },
        // { id: TipoPagoReporte.agrupado, label: 'Agrupado' },
      ];

      tipo_selected = ReportGroupTypeE.detallado;
    } else if (this.tipo_reporte == 'ventas_rango') {
      this.tipos = [
        { id: ReportGroupTypeE.detallado, label: 'Detallado' },
        { id: ReportGroupTypeE.agrupado, label: 'Agrupado' },
      ];

      serie_selected = serie.all;
      tipo_selected = ReportGroupTypeE.detallado;
      condicion_selected = 'todos';

      //
    } else if (this.tipo_reporte == 'cuentas_cobrar_cliente') {
      tipo_selected = CxC.por_cliente;
    } else if (this.tipo_reporte == 'cuentas_cobrar_ant_saldo') {
      this.tipos = [
        { id: CxC.detallado, label: 'Detallado' },
        { id: CxC.agrupado, label: 'Agrupado' },
      ];
      //
    } else if (this.tipo_reporte == 'cuentas_pagar_ant_saldo') {
      this.tipos = [
        // { id: CxP.detallado, label: 'Detallado' },
        // { id: CxP.agrupado, label: 'Agrupado' },
      ];
      //
    } else if (this.tipo_reporte == 'notas') {
      this.tipos = [
        { label: 'Crédito', id: Ss.factServ.tipoFacturaId(tFacturaKey.nota_de_credito) },
        { label: 'Dédito', id: Ss.factServ.tipoFacturaId(tFacturaKey.nota_de_debito) },
        { label: 'Todas', id: 0 },
      ];
      //
    } else if (this.tipo_reporte == 'cuentas_con_pagos' || this.tipo_reporte == 'ventas_cliente') {
      this.setValidator('cliente_id');
      serie_selected = serie.all;

      if (this.tipo_reporte == 'ventas_cliente') {
        this.setValidator('tipo');
        condicion_selected = 'todos';
        this.form.controls.tipo.setValue('todos');
      }
    } else if (this.tipo_reporte == 'ventas_productos') {
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

    if (tipo_factura_includes.includes(this.tipo_reporte)) this.parseTipoFacturas();

    if (desde_hasta_includes.includes(this.tipo_reporte)) this.setDesdeHastaControls();
    if (desde_year_hasta_includes.includes(this.tipo_reporte)) this.setDesdeHastaControls({ begin_of_year: true });
  }

  verifyReportFields(args: { setValue?: boolean }) {
    const { setValue } = args;

    this.currentReportFields = (Object.values(reportField) as reportField[])
      .filter(field => this.reportTypeHasfield(field) && this.verifyConditionalRender(field))
      .map(field => formControlMap[field])
      .filter(field => fun.hasValue(field));

    if (this.dynamic_selections) this.dynamic_selections.forEach(selection => this.currentReportFields.push(selection.formControl));
    if (this.advanced_filters) this.advanced_filters.filter(field => field.required).forEach(field => this.currentReportFields.push(field.formControl));
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

  reportTypeHasfield(fieldReport: string) {
    const reportTypeMap = {
      [reportField.dynamicSelection]: ['movimientos_vehiculo', 'recibos', 'notas'],
      [reportField.customerField]: ['ventas_cliente', 'cuentas_con_pagos', 'cuentas_cobrar_cliente', 'cuentas_cobrar_ant_saldo', 'recibos', 'notas'],
      [reportField.serieField]: ['ventas_diarias', 'ventas_rango', 'ventas_cliente'],
      [reportField.conditionField]: ['ventas_cliente', 'ventas_rango', 'ventas_diarias'],
      [reportField.typeField]: ['ventas_rango', 'recibos', 'ventas_productos', 'cuentas_cobrar_ant_saldo', 'notas', 'pago_facturas', 'cuentas_pagar_ant_saldo'],
      [reportField.billTypeField]: ['ventas_diarias', 'ventas_rango', 'ventas_cliente'],
      [reportField.articuloField]: ['suplidor_prod'],
      [reportField.dateField]: () => {
        const baseArray = ['cuadre'];
        if (this.tipo_reporte == 'ventas_productos' && this.form.controls.tipo.value == ReportDateTypeE.one_day) {
          return [...baseArray, this.tipo_reporte];
        }
        return baseArray;
      },
      [reportField.fromField]: () => {
        const baseArray = ['notas', 'ventas_rango', 'suplidor_prod', 'recibos', 'cuentas_con_pagos', 'ventas_cliente', 'cuentas_cobrar_ant_saldo', 'movimientos_vehiculo', 'cuentas_pagar_ant_saldo', 'pago_facturas', 'cuentas_cobrar_cliente'];
        if (this.tipo_reporte == 'ventas_productos' && this.form.controls.tipo.value == ReportDateTypeE.range) {
          return [...baseArray, this.tipo_reporte];
        }
        return baseArray;
      },
      [reportField.toDateField]: () => {
        const baseArray = ['notas', 'ventas_rango', 'suplidor_prod', 'recibos', 'cuentas_con_pagos', 'ventas_cliente', 'cuentas_cobrar_ant_saldo', 'movimientos_vehiculo', 'cuentas_pagar_ant_saldo', 'pago_facturas', 'cuentas_cobrar_cliente'];
        if (this.tipo_reporte == 'ventas_productos' && this.form.controls.tipo.value == ReportDateTypeE.range) {
          return [...baseArray, this.tipo_reporte];
        }
        return baseArray;
      },
      [reportField.simpleSwitchField]: ['cuentas_cobrar_ant_saldo', 'cuentas_pagar_ant_saldo', 'cuentas_cobrar_cliente', 'ventas_diarias', 'ventas_rango', 'recibos'],
      [reportField.switchGroupField]: () => {
        const hasSwitchGroup = fun.hasValue(this.switchGroup) && Array.isArray(this.switchGroup.array) && this.switchGroup.array.length > 0;

        return hasSwitchGroup ? [this.tipo_reporte] : [];
      },
    };

    let reportArray = reportTypeMap[fieldReport];

    // Si es una función, ejecutarla para obtener el array
    if (typeof reportArray === 'function') reportArray = reportArray();

    if (!reportArray || !Array.isArray(reportArray)) return false;

    return reportArray.includes(this.tipo_reporte);
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
      if (tipos_aceptados.includes(tipo_factura.key)) {
        this.tipos_facturas.push({ label: tipo_factura.descripcion, id: Number(tipo_factura.id) });
      }
    });

    this.form.controls.tipo_factura_id.setValue(0);
    this.setValidator('tipo_factura_id');
  }

  changeTipo() {
    const control = this.form.controls;

    if (this.tipo_reporte === 'recibos' && control.tipo.value === ReportGroupTypeE.agrupado) {
      this.form.controls.mostrar_forma_pago?.setValue(false, { emitEvent: false });
    }

    if (this.tipo_reporte == 'ventas_productos') {
      ['fecha', 'desde', 'hasta'].forEach(control => this.removeValidator(control));

      if (control.tipo.value == ReportDateTypeE.one_day) {
        this.form.controls.fecha.setValue(new Date());
        this.setValidator('fecha');
      } else {
        this.setDesdeHastaControls();
      }
    }
  }

  handleAdvancedFiltersRules() {
    if (this.tipo_reporte != 'cuentas_cobrar_ant_saldo' || !this.form?.controls['filtrar_por_cliente']) return;

    const filtrarPorCliente = !!this.form.controls['filtrar_por_cliente'].value;
    const tipoControl = this.form.controls['tipo'];
    const clienteControl = this.form.controls['cliente_id'];
    const columnasAntiguedadControl = this.form.controls['columnas_antiguedad'];

    if (filtrarPorCliente) {
      tipoControl.setValue(CxC.detallado, { emitEvent: false });
      tipoControl.disable({ emitEvent: false });
      clienteControl.setValidators(Validators.required);
    } else {
      tipoControl.enable({ emitEvent: false });
      clienteControl.setValidators([]);
      clienteControl.setValue(null, { emitEvent: false });
    }

    tipoControl.updateValueAndValidity({ emitEvent: false });
    clienteControl.updateValueAndValidity({ emitEvent: false });

    if (columnasAntiguedadControl) {
      this.normalizeColumnasAntiguedadSelection(columnasAntiguedadControl);
    }
  }

  hasAdvancedFilters() {
    return Array.isArray(this.advanced_filters) && this.advanced_filters.length > 0;
  }

  getAdvancedFiltersByType(controlType: dynamicFieldConfig['controlType']) {
    if (!Array.isArray(this.advanced_filters)) return [];
    return this.advanced_filters.filter(filter => (filter.controlType ?? 'select') === controlType);
  }

  isTypeDisabled() {
    return this.tipo_reporte == 'cuentas_cobrar_ant_saldo' && !!this.form?.controls['filtrar_por_cliente']?.value;
  }

  showExternalReportButton() {
    return this.externalReportTypes.includes(this.tipo_reporte) && Ss.configServ.config?.usa_facturas_externas === true;
  }

  showPaymentMethodSwitch() {
    return ['ventas_diarias', 'ventas_rango'].includes(this.tipo_reporte);
  }

  activarReporteFacturasExternas() {
    const now = Date.now();
    const diff = now - this.lastExternalReportClickAt;
    this.lastExternalReportClickAt = now;

    if (diff >= 200) return;

    this.setExternalReportState(!this.is_external);
  }

  setExternalReportState(isExternal: boolean) {
    this.is_external = isExternal;

    if (isExternal) {
      this.previousExternalReportFormState = {
        serie: this.form.controls.serie.value,
        condicion: this.form.controls.condicion.value,
        tipo_factura_id: this.form.controls.tipo_factura_id.value,
      };
      this.form.controls.serie.setValue(serie.all, { emitEvent: false });
      this.form.controls.condicion.setValue('Contado', { emitEvent: false });
      this.form.controls.tipo_factura_id.setValue(0, { emitEvent: false });
      this.disableExternalReportControls();
    } else {
      this.enableExternalReportControls();
      if (fun.hasValue(this.previousExternalReportFormState)) {
        this.form.patchValue(this.previousExternalReportFormState, { emitEvent: false });
      }
      this.previousExternalReportFormState = null;
    }

    this.formUpdateTrigger.update(val => val + 1);
  }

  disableExternalReportControls() {
    ['serie', 'condicion', 'tipo_factura_id'].forEach(control => this.form.controls[control]?.disable({ emitEvent: false }));
  }

  enableExternalReportControls() {
    ['serie', 'condicion', 'tipo_factura_id'].forEach(control => this.form.controls[control]?.enable({ emitEvent: false }));
  }

  normalizeColumnasAntiguedadSelection(control) {
    const allValue = ClienteC.allColumnasAntiguedadValue;
    const rawSelection = Array.isArray(control.value) ? control.value.filter(item => fun.hasValue(item)) : [];
    const hasAll = rawSelection.includes(allValue);
    const previousHasAll = this.previousColumnasAntiguedadSelection.includes(allValue);
    let normalizedSelection = [...rawSelection];

    if (normalizedSelection.length === 0) {
      normalizedSelection = [allValue];
    } else if (hasAll && normalizedSelection.length > 1) {
      normalizedSelection = previousHasAll ? normalizedSelection.filter(item => item != allValue) : [allValue];
    }

    if (normalizedSelection.length === 0) {
      normalizedSelection = [allValue];
    }

    const shouldUpdate =
      normalizedSelection.length !== rawSelection.length || normalizedSelection.some((item, index) => item !== rawSelection[index]);

    if (shouldUpdate) {
      control.setValue(normalizedSelection, { emitEvent: false });
    }

    this.previousColumnasAntiguedadSelection = [...normalizedSelection];
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
    return new Promise<void>(resolve => {
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

      fun.setTimeout(() => {
        resolve();
      }, 10);
    });
  }

  verifyConditionalRender(field: reportField): boolean {
    if (fun.isEmpty(this.conditionalRender) || fun.isEmpty(this.conditionalRender[field])) return true;

    const formValue = this.form.getRawValue();

    return this.conditionalRender[field](formValue);
  }

  submit() {
    this.modalConfig.close({ data: { ...this.form.getRawValue(), is_external: this.is_external === true, switchGroup: { ...this.switchGroup } } });
  }
}
