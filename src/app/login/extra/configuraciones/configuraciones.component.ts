import { HtmlElementsService } from '@core/services/html-elements.service';
import { AfterViewInit, Component, Input, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Ss } from '@core/services/singleton.service';
import { MODIFIED_CONFIG_FILE } from '@core/typescript/GLOBAL';
import { MessageTask } from '@core/models/message-task';
import { ELECTRON_CHANGE_CONFIG_FILE } from '@electron/shared-electron-angular';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';
import { Router } from '@angular/router';
import { IpcService } from '@core/services/ipc.service';
import { printTestPdf } from './info-docs-prueba/info-docs-prueba';
import { formFieldId, formFieldName } from './configuraciones.model';
@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.scss'],
  standalone: false,
})
export class ConfiguracionesComponent implements OnInit, AfterViewInit {
  @Input() is_on_modal: boolean = false;
  @Input() modalConfig: any;
  configServ = Ss.configServ;
  configApp;
  configCopy;
  form;

  formFieldName = formFieldName;
  formFieldId = formFieldId;
  logo_empresa;
  logo_impresion;

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
  ];

  htmlServ = inject(HtmlElementsService);

  constructor(
    private fb: UntypedFormBuilder,
    public sharedServ: SharedService,
    private router: Router,
    public _ipc: IpcService
  ) {}

  ngOnInit(): void {
    this.configApp = Ss.configServ.config;
    this.configCopy = fun.deepCloning(this.configApp);
    this.parseDocumentosAImprimir(this.configApp).then(() => {
      this.createForm(this.configApp);
      this.formIsInvalid();
    });

    fun.logGreen('this.configApp', this.configApp);
  }

  ngAfterViewInit(): void {
    fun.enfocarInput(formFieldId.nombre_empresa);
  }

  createForm(data) {
    const color_format = this.colores.find(item => item.descripcion == data.color_app);

    this.form = this.fb.group({
      [formFieldName.nombre_empresa]: [{ value: this.getValue(data, 'nombre_empresa'), disabled: false }, Validators.required],
      [formFieldName.rnc_empresa]: [{ value: this.getValue(data, 'rnc_empresa'), disabled: false }, Validators.required],
      [formFieldName.direccion_empresa]: [{ value: this.getValue(data, 'direccion_empresa'), disabled: false }, Validators.required],
      [formFieldName.telefono_empresa]: [{ value: this.getValue(data, 'telefono_empresa'), disabled: false }, Validators.required],
      [formFieldName.logo_empresa]: [{ value: this.getValue(data, 'logo_empresa'), disabled: false }, Validators.required],
      [formFieldName.logo_impresion]: [{ value: this.getValue(data, 'logo_impresion'), disabled: false }, Validators.required],
      [formFieldName.color_app]: [{ value: color_format, disabled: false }, Validators.required],
      [formFieldName.url_servidor]: [{ value: this.getValue(data, 'url_servidor'), disabled: false }, Validators.required],
      [formFieldName.url_servidor_respaldo]: [{ value: this.getValue(data, 'url_servidor_respaldo'), disabled: false }, Validators.required],
      [formFieldName.url_servidor_descargas]: [{ value: this.getValue(data, 'url_servidor_descargas'), disabled: false }, Validators.required],
      [formFieldName.config_password]: [{ value: this.getValue(data, 'config_password'), disabled: false }, Validators.required],
      [formFieldName.usa_url_principal]: [{ value: this.getValue(data, 'usa_url_principal'), disabled: false }, Validators.required],
      [formFieldName.serie_default]: [{ value: this.getValue(data, 'serie_default'), disabled: false }],

      [formFieldName.is_db_local]: [{ value: this.getValue(data, 'is_db_local'), disabled: false }, Validators.required],
      [formFieldName.calcular_itbis]: [{ value: this.getValue(data, 'calcular_itbis'), disabled: false }, Validators.required],
      [formFieldName.is_produccion]: [{ value: this.getValue(data, 'is_produccion'), disabled: false }, Validators.required],
      [formFieldName.facturacion_editar_precio]: [{ value: this.getValue(data, 'facturacion_editar_precio'), disabled: false }, Validators.required],
      [formFieldName.vende_sin_inventario]: [{ value: this.getValue(data, 'vende_sin_inventario'), disabled: false }, Validators.required],
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
    const docs = data.documentos_a_imprimir.filter(doc => doc.selected);
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
    // console.log('sali_de', sali_de);

    let next_control = null;

    const next_control_map = {
      [formFieldId.nombre_empresa]: formFieldId.rnc_empresa,
      [formFieldId.rnc_empresa]: formFieldId.telefono_empresa,
      [formFieldId.telefono_empresa]: formFieldId.direccion_empresa,
      [formFieldId.direccion_empresa]: formFieldId.color_app,
      [formFieldId.color_app]: formFieldId.url_servidor,
      [formFieldId.url_servidor]: formFieldId.url_servidor_respaldo,
      [formFieldId.url_servidor_respaldo]: formFieldId.url_servidor_descargas,
      [formFieldId.url_servidor_descargas]: formFieldId.documentos_a_imprimir,
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

      documentos_config.forEach(item => this.documentos_a_imprimir_selected.push(this.documentos_a_imprimir.find(doc => doc.key == item)));
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

  test() {
    const test = this.formIsInvalid();
  }

  salir() {
    if (this.is_on_modal) {
      this.modalConfig.close();
    } else {
      this.router.navigateByUrl('auth/login');
    }
  }

  getFormularioToSend() {
    let formulario = this.form.getRawValue();
    formulario.color_app = formulario.color_app.descripcion;

    const pages_sizes = {
      venta_contado: formulario.page_size_venta_contado.descripcion,
      venta_credito: formulario.page_size_venta_credito.descripcion,
      pre_venta: formulario.page_size_pre_venta.descripcion,
      cotizacion: formulario.page_size_cotizacion.descripcion,
      compra: formulario.page_size_compra.descripcion,
      recibo_ingreso: formulario.page_size_recibo_ingreso.descripcion,
      conduce: formulario.page_size_conduce.descripcion,
      nota: formulario.page_size_nota.descripcion,
      cuadre_caja: formulario.page_size_cuadre_caja.descripcion,
      reporte: formulario.page_size_reporte.descripcion,
    };

    const printer_selected = {
      venta_contado: formulario.printer_venta_contado,
      venta_credito: formulario.printer_venta_credito,
      pre_venta: formulario.printer_pre_venta,
      cotizacion: formulario.printer_cotizacion,
      compra: formulario.printer_compra,
      recibo_ingreso: formulario.printer_recibo_ingreso,
      conduce: formulario.printer_conduce,
      nota: formulario.printer_nota,
      cuadre_caja: formulario.printer_cuadre_caja,
      reporte: formulario.printer_reporte,
    };

    const keys_to_omit = [
      'plantilla_impresion_nota',

      'page_size_venta_contado',
      'page_size_venta_credito',
      'page_size_pre_venta',
      'page_size_compra',
      'page_size_recibo_ingreso',
      'page_size_conduce',
      'page_size_nota',
      'page_size_cuadre_caja',
      'page_size_reporte',

      'printer_venta_contado',
      'printer_venta_credito',
      'printer_pre_venta',
      'printer_compra',
      'printer_recibo_ingreso',
      'printer_conduce',
      'printer_nota',
      'printer_cuadre_caja',
      'printer_reporte',
    ];

    keys_to_omit.forEach(element => delete formulario[element]);

    formulario['pages_sizes'] = pages_sizes;
    formulario['printer_selected'] = printer_selected;
    return formulario;
  }

  formIsInvalid() {
    let res = true;

    if (this.form) {
      if (this.form.valid) {
        let formulario = this.getFormularioToSend();

        let keysConfig = Object.keys(formulario);
        const cambios = [];

        keysConfig.forEach(keyC => {
          if (typeof this.configCopy[keyC] == 'string') {
            if (this.configCopy[keyC] != formulario[keyC]) cambios.push(keyC);
          } else {
            if (!fun.isEqual(this.configCopy[keyC], formulario[keyC])) cambios.push(keyC);
          }
        });

        res = cambios.length > 0 ? false : true;
      } else res = true;
    }

    return res;
  }

  changesParser(configReplacement, logos_changes, obj, copyObjLevel, key_padre) {
    let keysConfig = Object.keys(obj);
    const logosKeys = ['logo_empresa', 'logo_impresion'];

    for (let i = 0; i < keysConfig.length; i++) {
      const key = keysConfig[i];

      if (fun.hasValue(copyObjLevel[key])) {
        const tipoDato = typeof obj[key];

        if (tipoDato == 'string' || tipoDato == 'boolean') {
          if (copyObjLevel[key] != obj[key]) {
            if (logosKeys.includes(key)) {
              logos_changes[key] = obj[key];
            } else {
              const value_source = tipoDato == 'string' ? `${key}: '${copyObjLevel[key]}'` : `${key}: ${copyObjLevel[key]}`;
              const value_target = tipoDato == 'string' ? `${key}: '${obj[key]}'` : `${key}: ${obj[key]}`;

              configReplacement[key] = { source: value_source, target: value_target };
              // TODO: poner aqui una funcion para el remplazo exclusivo de los pages_sizes con el key_padre
            }
          }
        } else {
          this.changesParser(configReplacement, logos_changes, obj[key], copyObjLevel[key], key);
        }
      }
    }
  }

  object_changed(configReplacement, key, obj, copyObjLevel) {
    const tipoDato = typeof obj[key];

    const value_source = tipoDato == 'string' ? `${key}: '${copyObjLevel[key]}'` : `${key}: ${copyObjLevel[key]}`;
    const value_target = tipoDato == 'string' ? `${key}: '${obj[key]}'` : `${key}: ${obj[key]}`;

    configReplacement[key] = { source: value_source, target: value_target };
  }

  submit() {
    const formulario = this.getFormularioToSend();
    fun.logGreen('this.config', this.configApp);
    formulario['cliente'] = this.getValue(this.configApp, 'cliente');

    const configReplacement = {};
    const logos_changes = {};

    this.changesParser(configReplacement, logos_changes, formulario, this.configCopy, 'obj_principal');

    const objChange = { new_config: formulario, configReplacement: configReplacement };

    if (fun.hasValue(logos_changes)) objChange['logos_changes'] = logos_changes;

    const task = new MessageTask(ELECTRON_CHANGE_CONFIG_FILE, objChange);

    this._ipc
      .sendTask(task)
      .then(res => {
        this.sharedServ.nextCanToast(true);
        fun.toastSuccess('Configuración de la aplicación cambiada correctamente.', 'CORRECTO');
        fun.setTimeout(() => {
          MODIFIED_CONFIG_FILE.next(res);
          this.sharedServ.nextCanToast(false);
          this.salir();
        }, 250);
      })
      .catch(err => {
        if (err.msg) fun.toastError(err.msg, 'ERROR');
        else fun.toastError('Error al cambiar la configuración de la aplicación', 'ERROR');
        console.error(err);
      });
  }
}
