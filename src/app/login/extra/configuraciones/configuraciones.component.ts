import { HtmlElementsService } from '@core/services/html-elements.service';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MessageTask } from '@core/typescript/message-task';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';
import { Ss } from '@core/services/singleton.service';
import { ELECTRON_SET_APP_CONFIG } from '@electron/shared-electron-angular';
import { Router } from '@angular/router';
import { IpcService } from '@core/services/ipc.service';
import { printTestPdf } from './info-docs-prueba/info-docs-prueba';
import { formFieldId, formFieldName } from './configuraciones.model';
import { EmpresaService } from '@core/services/empresa.service';
@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.scss'],
  standalone: false,
})
export class ConfiguracionesComponent implements OnInit, AfterViewInit {
  @Input() is_on_modal: boolean = false;
  @Input() modalConfig!: any;
  configServ = Ss.configServ;
  configApp;
  configCopy;
  form;

  formFieldName = formFieldName;
  formFieldId = formFieldId;
  logo_empresa;
  logo_impresion;
  activeTabIndex = 0;

  colores = [
    { label: 'Rojo', descripcion: 'red', color: '#bd0000' },
    { label: 'Azul', descripcion: 'blue', color: '#0042bd' },
    { label: 'Verde', descripcion: 'green', color: '#19bd00' },
  ];

  medidas_articulos = [{ value: 'Quintal' }, { value: 'Producto' }];

  paper_sizes = [
    { label: '8.5 x 11', descripcion: '8.5x11' },
    { label: '8.5 x 5.5', descripcion: '8.5x5.5' },
    { label: 'Rollo 80mm', descripcion: '80mm_roll' },
  ];

  documentos_a_imprimir_selected = [];

  documentos_a_imprimir = [
    { name: 'Venta Contado', key: 'venta_contado' },
    { name: 'Venta Crédito', key: 'venta_credito' },
    { name: 'Pre_Venta', key: 'pre_venta' },
    { name: 'Compra', key: 'compra' },
    { name: 'Recibo Ingreso', key: 'recibo_ingreso' },
    { name: 'Nota', key: 'nota' },
    { name: 'Conduce', key: 'conduce' },
    { name: 'Cotización', key: 'cotizacion' },
    { name: 'Pago Factura', key: 'pago_factura' },
  ];

  impresiones = [
    { printerFormControlName: formFieldName.printer_venta_contado, pageSizeFormControlName: formFieldName.page_size_venta_contado, label: 'Venta Contado', key: 'venta_contado' },
    { printerFormControlName: formFieldName.printer_venta_credito, pageSizeFormControlName: formFieldName.page_size_venta_credito, label: 'Venta Credito', key: 'venta_credito' },
    { printerFormControlName: formFieldName.printer_pre_venta, pageSizeFormControlName: formFieldName.page_size_pre_venta, label: 'Pre venta', key: 'pre_venta' },
    { printerFormControlName: formFieldName.printer_cotizacion, pageSizeFormControlName: formFieldName.page_size_cotizacion, label: 'Cotización', key: 'cotizacion' },
    { printerFormControlName: formFieldName.printer_compra, pageSizeFormControlName: formFieldName.page_size_compra, label: 'Factura compras', key: 'compra' },
    { printerFormControlName: formFieldName.printer_recibo_ingreso, pageSizeFormControlName: formFieldName.page_size_recibo_ingreso, label: 'Recibos de ingreso', key: 'ingreso' },
    { printerFormControlName: formFieldName.printer_conduce, pageSizeFormControlName: formFieldName.page_size_conduce, label: 'Conduce', key: 'conduce' },
    { printerFormControlName: formFieldName.printer_nota, pageSizeFormControlName: formFieldName.page_size_nota, label: 'Notas', key: 'nota' },
    { printerFormControlName: formFieldName.printer_cuadre_caja, pageSizeFormControlName: formFieldName.page_size_cuadre_caja, label: 'Cuadre de caja', key: 'cuadre' },
    { printerFormControlName: formFieldName.printer_reporte, pageSizeFormControlName: formFieldName.page_size_reporte, label: 'Reportes', key: 'reporte' },
    { printerFormControlName: formFieldName.printer_pago_factura, pageSizeFormControlName: formFieldName.page_size_pago_factura, label: 'Pago Facturas', key: 'pago_factura' },
  ];

  htmlServ = inject(HtmlElementsService);
  empresaServ = inject(EmpresaService);

  constructor(
    private fb: UntypedFormBuilder,
    public sharedServ: SharedService,
    private router: Router,
    public _ipc: IpcService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.configApp = Ss.configServ.config;

    this.configCopy = fun.deepCloning(this.configApp);
    this.parseDocumentosAImprimir(this.configApp).then(() => {
      this.createForm(this.configApp);
      this.formIsInvalid();
      fun.setTimeout(() => {
        this.activeTabIndex = 0;
        this.cdr.detectChanges();
      }, 0);
    });

    this.empresaServ.setEmpresa();
  }

  ngAfterViewInit(): void {
    fun.enfocarInput(formFieldId.nombre_empresa);
  }

  createForm(data) {
    const color_format = this.colores.find(item => item.descripcion == data.color_app);

    this.form = this.fb.group({
      [formFieldName.id]: [{ value: this.getValue(data, 'id'), disabled: false }],
      [formFieldName.machineId]: [{ value: this.getValue(data, 'machineId'), disabled: false }],
      [formFieldName.nombre_empresa]: [{ value: this.getValue(data, 'nombre_empresa'), disabled: false }, Validators.required],
      [formFieldName.rnc_empresa]: [{ value: this.getValue(data, 'rnc_empresa'), disabled: false }, Validators.required],
      [formFieldName.direccion_empresa]: [{ value: this.getValue(data, 'direccion_empresa'), disabled: false }, Validators.required],
      [formFieldName.telefono_empresa]: [{ value: this.getValue(data, 'telefono_empresa'), disabled: false }, Validators.required],
      [formFieldName.logo_empresa]: [{ value: this.getValue(data, 'logo_empresa'), disabled: false }, Validators.required],
      [formFieldName.logo_impresion]: [{ value: this.getValue(data, 'logo_impresion'), disabled: false }, Validators.required],
      [formFieldName.color_app]: [{ value: color_format, disabled: false }, Validators.required],
      [formFieldName.url_servidor]: [{ value: this.getValue(data, 'url_servidor'), disabled: false }, Validators.required],
      [formFieldName.url_servidor_respaldo]: [{ value: this.getValue(data, 'url_servidor_respaldo'), disabled: false }, Validators.required],
      [formFieldName.config_password]: [{ value: this.getValue(data, 'config_password'), disabled: false }, Validators.required],
      [formFieldName.usa_url_principal]: [{ value: this.getValue(data, 'usa_url_principal'), disabled: false }, Validators.required],
      [formFieldName.serie_default]: [{ value: this.getValue(data, 'serie_default'), disabled: false }],

      [formFieldName.is_db_local]: [{ value: this.getValue(data, 'is_db_local'), disabled: false }, Validators.required],
      [formFieldName.calcular_itbis]: [{ value: this.getValue(data, 'calcular_itbis'), disabled: false }, Validators.required],
      [formFieldName.is_produccion]: [{ value: this.getValue(data, 'is_produccion'), disabled: false }, Validators.required],
      [formFieldName.has_contabilidad]: [{ value: this.getValue(data, 'has_contabilidad'), disabled: false }, Validators.required],
      [formFieldName.facturacion_editar_precio]: [{ value: this.getValue(data, 'facturacion_editar_precio'), disabled: false }, Validators.required],
      [formFieldName.vende_sin_inventario]: [{ value: this.getValue(data, 'vende_sin_inventario'), disabled: false }, Validators.required],
      [formFieldName.can_pagar]: [{ value: this.getValue(data, 'can_pagar'), disabled: false }, Validators.required],
      [formFieldName.medida_producto_terminado]: [{ value: this.getValue(data, 'medida_producto_terminado'), disabled: false }, Validators.required],
      [formFieldName.documentos_a_imprimir]: [{ value: this.getValue(data, 'documentos_a_imprimir'), disabled: false }],

      [formFieldName.page_size_venta_contado]: [{ value: this.getValuePageSize(data, 'pages_sizes.venta_contado'), disabled: false }, Validators.required],
      [formFieldName.page_size_venta_credito]: [{ value: this.getValuePageSize(data, 'pages_sizes.venta_credito'), disabled: false }, Validators.required],
      [formFieldName.page_size_pre_venta]: [{ value: this.getValuePageSize(data, 'pages_sizes.pre_venta'), disabled: false }, Validators.required],
      [formFieldName.page_size_cotizacion]: [{ value: this.getValuePageSize(data, 'pages_sizes.cotizacion'), disabled: false }, Validators.required],
      [formFieldName.page_size_compra]: [{ value: this.getValuePageSize(data, 'pages_sizes.compra'), disabled: false }, Validators.required],
      [formFieldName.page_size_recibo_ingreso]: [{ value: this.getValuePageSize(data, 'pages_sizes.recibo_ingreso'), disabled: false }, Validators.required],
      [formFieldName.page_size_conduce]: [{ value: this.getValuePageSize(data, 'pages_sizes.conduce'), disabled: false }, Validators.required],
      [formFieldName.page_size_nota]: [{ value: this.getValuePageSize(data, 'pages_sizes.nota'), disabled: false }, Validators.required],
      [formFieldName.page_size_cuadre_caja]: [{ value: this.getValuePageSize(data, 'pages_sizes.cuadre_caja'), disabled: false }, Validators.required],
      [formFieldName.page_size_reporte]: [{ value: this.getValuePageSize(data, 'pages_sizes.reporte'), disabled: false }, Validators.required],
      [formFieldName.page_size_pago_factura]: [{ value: this.getValuePageSize(data, 'pages_sizes.pago_factura'), disabled: false }, Validators.required],

      [formFieldName.printer_venta_contado]: [{ value: this.getValue(data, 'printer_selected.venta_contado'), disabled: false }, Validators.required],
      [formFieldName.printer_venta_credito]: [{ value: this.getValue(data, 'printer_selected.venta_credito'), disabled: false }, Validators.required],
      [formFieldName.printer_pre_venta]: [{ value: this.getValue(data, 'printer_selected.pre_venta'), disabled: false }, Validators.required],
      [formFieldName.printer_cotizacion]: [{ value: this.getValue(data, 'printer_selected.cotizacion'), disabled: false }, Validators.required],
      [formFieldName.printer_compra]: [{ value: this.getValue(data, 'printer_selected.compra'), disabled: false }, Validators.required],
      [formFieldName.printer_recibo_ingreso]: [{ value: this.getValue(data, 'printer_selected.recibo_ingreso'), disabled: false }, Validators.required],
      [formFieldName.printer_conduce]: [{ value: this.getValue(data, 'printer_selected.conduce'), disabled: false }, Validators.required],
      [formFieldName.printer_nota]: [{ value: this.getValue(data, 'printer_selected.nota'), disabled: false }, Validators.required],
      [formFieldName.printer_cuadre_caja]: [{ value: this.getValue(data, 'printer_selected.cuadre_caja'), disabled: false }, Validators.required],
      [formFieldName.printer_reporte]: [{ value: this.getValue(data, 'printer_selected.reporte'), disabled: false }, Validators.required],
      [formFieldName.printer_pago_factura]: [{ value: this.getValue(data, 'printer_selected.pago_factura'), disabled: false }, Validators.required],
    });

    this.logo_empresa = `data:image/png;base64,${data.logo_empresa}`;
    this.logo_impresion = `data:image/png;base64,${data.logo_impresion}`;
  }

  getValuePageSize(data, key) {
    const size = fun.getProperty(data, key);
    const page_size = this.paper_sizes.find(item => item.descripcion == size);
    return page_size;
  }

  getDocumentosAImprimir(data) {
    const docs = data.documentos_a_imprimir.filter(doc => doc?.selected === true);
    return docs;
  }

  getValue(data, key) {
    return fun.getProperty(data, key);
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.capitalice(arg));
  }

  saltar(sali_de) {
    let next_control = null;

    const next_control_map = {
      [formFieldId.nombre_empresa]: formFieldId.rnc_empresa,
      [formFieldId.rnc_empresa]: formFieldId.telefono_empresa,
      [formFieldId.telefono_empresa]: formFieldId.direccion_empresa,
      [formFieldId.direccion_empresa]: formFieldId.color_app,
      [formFieldId.color_app]: formFieldId.url_servidor,
      [formFieldId.url_servidor]: formFieldId.url_servidor_respaldo,
      [formFieldId.url_servidor_respaldo]: formFieldId.documentos_a_imprimir,
      [formFieldId.documentos_a_imprimir]: formFieldId.medida_producto_terminado,
      [formFieldId.medida_producto_terminado]: formFieldId.telefono_empresa,
    };

    if (fun.hasValue(next_control_map[sali_de])) next_control = next_control_map[sali_de];

    fun.setTimeout(() => {
      if (next_control) fun.enfocarInput(next_control);
    }, 0);
  }

  parseDocumentosAImprimir(config) {
    return new Promise<any>(resolve => {
      const documentos_config = config.documentos_a_imprimir.split(',');

      documentos_config.forEach(item => {
        const doc = this.documentos_a_imprimir.find(documento => documento.key == item);
        if (fun.hasValue(doc)) this.documentos_a_imprimir_selected.push(doc);
      });
      resolve(true);
    });
  }

  changeDocumentosAImprimir() {
    const documentos_selected = this.documentos_a_imprimir_selected.map(doc => doc.key).join(',');

    this.form.controls.documentos_a_imprimir.setValue(fun.hasValue(documentos_selected) ? documentos_selected : null);
  }

  getPhotoData(data_img) {
    if (data_img.src_img) {
      this[data_img.id] = data_img.src_img;
      this.form.controls[data_img.id].setValue(data_img.base_64);
    }
  }

  printTest(documento, paperSize) {
    printTestPdf({ paper_size: paperSize, documento: documento });
  }

  salir() {
    if (this.is_on_modal) {
      this.modalConfig.close();
    } else {
      this.router.navigateByUrl('auth/login');
    }
  }

  getFormularioToSend() {
    const formulario = this.form.getRawValue();

    // Extraer descripción del color
    formulario.color_app = formulario.color_app.descripcion;

    // Mapear tamaños de página
    const pageSizeKeys = ['venta_contado', 'venta_credito', 'pre_venta', 'cotizacion', 'compra', 'recibo_ingreso', 'conduce', 'nota', 'cuadre_caja', 'reporte', 'pago_factura'];

    const pages_sizes = pageSizeKeys.reduce((acc, key) => {
      acc[key] = formulario[`page_size_${key}`]?.descripcion || null;
      return acc;
    }, {});

    // Mapear impresoras seleccionadas
    const printer_selected = pageSizeKeys.reduce((acc, key) => {
      acc[key] = formulario[`printer_${key}`] || null;
      return acc;
    }, {});

    // Eliminar campos individuales del formulario
    const keysToOmit = [...pageSizeKeys.map(key => `page_size_${key}`), ...pageSizeKeys.map(key => `printer_${key}`)];

    keysToOmit.forEach(key => delete formulario[key]);

    // Agregar objetos estructurados
    formulario.pages_sizes = pages_sizes;
    formulario.printer_selected = printer_selected;

    return formulario;
  }

  formIsInvalid(): boolean {
    if (!this.form) return true;
    if (!this.form.valid) return true;

    const formulario = this.getFormularioToSend();
    const keysConfig = Object.keys(formulario);

    const hasChanges = keysConfig.some(key => {
      const originalValue = this.configCopy[key];
      const newValue = formulario[key];

      // Comparar según el tipo de dato
      if (typeof originalValue === 'string') {
        return originalValue !== newValue;
      } else {
        return !fun.isEqual(originalValue, newValue);
      }
    });

    return !hasChanges;
  }

  async submit(): Promise<void> {
    try {
      // Preparar formulario con cliente
      const formulario = {
        ...this.getFormularioToSend(),
        cliente: this.getValue(this.configApp, 'cliente'),
      };

      const config_id = formulario[formFieldName.id];
      const isNewConfig = fun.isEmpty(config_id) || config_id === 'default';

      // Crear o actualizar configuración
      const config_response = isNewConfig ? await this.configServ.createConfig(formulario) : await this.configServ.updateConfig(formulario);

      // Enviar tarea a Electron
      const task = new MessageTask(ELECTRON_SET_APP_CONFIG, config_response);

      await this._ipc.sendTask(task);

      // Manejar éxito
      this.handleSubmitSuccess(config_response);
    } catch (error) {
      this.handleSubmitError(error);
    }
  }

  private handleSubmitSuccess(config_response: any): void {
    // Mostrar toast solo si no está en modal
    if (!this.is_on_modal) {
      this.sharedServ.nextCanToast(true);
    }

    fun.toastSuccess('Configuración de la aplicación cambiada correctamente.', 'CORRECTO');

    // Actualizar configuración y salir después de un delay
    fun.setTimeout(() => {
      // Preservar propiedades que no son manejadas por el formulario
      const propiedadesFormulario = Object.keys(config_response);
      const configCompleta = { ...config_response };

      // Agregar propiedades faltantes desde configCopy
      Object.keys(this.configCopy).forEach(key => {
        if (!propiedadesFormulario.includes(key)) {
          configCompleta[key] = this.configCopy[key];
        }
      });

      this.configServ.config = configCompleta;

      if (!this.is_on_modal) {
        this.sharedServ.nextCanToast(false);
      }

      this.salir();
    }, 250);
  }

  private handleSubmitError(error: any): void {
    const errorMessage = error?.msg || 'Error al cambiar la configuración de la aplicación';
    fun.toastError(errorMessage, 'ERROR');
    console.error('Error en submit:', error);
  }
}
