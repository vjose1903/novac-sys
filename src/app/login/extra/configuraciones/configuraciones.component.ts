import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Ss } from '../../../core/services/singleton.service';
import { MODIFIED_CONFIG_FILE } from '../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { MessageTask } from '../../../core/models/message-task';
import { KEYWORD_ELECTRON_CHANGE_CONFIG_FILE } from '../../../../../electron/shared-electron-angular';
import { ConfigI } from '../../../core/typescript/config-interface';
import { fun } from '../../../core/services/functions.service';
import { SharedService } from '../../../core/services/shared.service';
import { Router } from '@angular/router';
import { IpcService } from '../../../core/services/ipc.service';
import { printTestPdf } from './info-docs-prueba/info-docs-prueba';
@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.scss'],
})
export class ConfiguracionesComponent implements OnInit {
  configServ = Ss.configServ;
  config;
  form;

  logo_empresa;
  logo_impresion;

  colores = [
    { label: 'Rojo', descripcion: 'red', color: '#bd0000' },
    { label: 'Azul', descripcion: 'blue', color: '#0042bd' },
    { label: 'Verde', descripcion: 'green', color: '#19bd00' },
  ];

  medidas_articulos = [{ value: 'Quintal' }, { value: 'Producto' }];

  plantillas_impresion = [
    { key: 'nota', value: 'Agrupada' },
    { key: 'nota', value: 'Detallada' },
  ];

  paper_sizes = [
    { label: '8.5 x 11', descripcion: '8.5x11' },
    { label: '8.5 x 5.5', descripcion: '8.5x5.5' },
    { label: 'Rollo 80mm', descripcion: '80mm_roll' },
  ];

  documentos_a_imprimir_selected = [];

  documentos_a_imprimir = [
    { name: 'Venta Contado', key: 'venta_contado' },
    { name: 'Venta Credito', key: 'venta_credito' },
    { name: 'Pre_Venta', key: 'pre_venta' },
    { name: 'Compra', key: 'compra' },
    { name: 'Recibo Ingreso', key: 'recibo_ingreso' },
    { name: 'Nota', key: 'nota' },
    { name: 'Conduce', key: 'conduce' },
  ];

  impresiones = [
    { printerFormControlName: 'printer_venta_contado', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_venta_contado', label: 'Venta Contado', key: 'venta_contado' },
    { printerFormControlName: 'printer_venta_credito', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_venta_credito', label: 'Venta Credito', key: 'venta_credito' },
    { printerFormControlName: 'printer_pre_venta', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_pre_venta', label: 'Pre venta', key: 'pre_venta' },
    { printerFormControlName: 'printer_cotizacion', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_cotizacion', label: 'Cotización', key: 'cotizacion' },
    { printerFormControlName: 'printer_compra', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_compra', label: 'Factura compras', key: 'compra' },
    { printerFormControlName: 'printer_recibo_ingreso', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_recibo_ingreso', label: 'Recibos de ingreso', key: 'ingreso' },
    { printerFormControlName: 'printer_conduce', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_conduce', label: 'Conduce', key: 'conduce' },
    { printerFormControlName: 'printer_nota', plantillaFormControlName: 'plantilla_impresion_nota', pageSizeFormControlName: 'page_size_nota', label: 'Notas', key: 'nota' },
    { printerFormControlName: 'printer_cuadre_caja', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_cuadre_caja', label: 'Cuadre de caja', key: 'cuadre' },
    { printerFormControlName: 'printer_reporte', plantillaFormControlName: null, pageSizeFormControlName: 'page_size_reporte', label: 'Reportes', key: 'reporte' },
  ];

  configCopy;

  constructor(private fb: UntypedFormBuilder, public sharedServ: SharedService, private router: Router, public _ipc: IpcService) {}

  ngOnInit(): void {
    this.configServ.getConfig().then((config: ConfigI) => {
      this.config = config;
      this.configCopy = fun.duplicarJson(config);
      this.parseDocumentosAImprimir(config).then(() => this.createForm(config));

      fun.logGreen('this.config', this.config);
    });
  }

  createForm(data) {
    const color_format = _.find(this.colores, (item) => item.descripcion == data.color_app);

    this.form = this.fb.group({
      nombre_empresa: [{ value: this.getValue(data, 'nombre_empresa'), disabled: false }, Validators.required],
      rnc_empresa: [{ value: this.getValue(data, 'rnc_empresa'), disabled: false }, Validators.required],
      direccion_empresa: [{ value: this.getValue(data, 'direccion_empresa'), disabled: false }, Validators.required],
      telefono_empresa: [{ value: this.getValue(data, 'telefono_empresa'), disabled: false }, Validators.required],
      logo_empresa: [{ value: this.getValue(data, 'logo_empresa'), disabled: false }, Validators.required],
      logo_impresion: [{ value: this.getValue(data, 'logo_impresion'), disabled: false }, Validators.required],
      color_app: [{ value: color_format, disabled: false }, Validators.required],
      url_servidor: [{ value: this.getValue(data, 'url_servidor'), disabled: false }, Validators.required],
      url_servidor_respaldo: [{ value: this.getValue(data, 'url_servidor_respaldo'), disabled: false }, Validators.required],
      url_servidor_descargas: [{ value: this.getValue(data, 'url_servidor_descargas'), disabled: false }, Validators.required],
      config_password: [{ value: this.getValue(data, 'config_password'), disabled: false }, Validators.required],
      usa_url_principal: [{ value: this.getValue(data, 'usa_url_principal'), disabled: false }, Validators.required],
      // printer_caja_selected: [{ value: this.getValue(data, 'printer_caja_selected'), disabled: false }, Validators.required],
      // printer_reportes_selected: [{ value: this.getValue(data, 'printer_reportes_selected'), disabled: false }, Validators.required],
      is_db_local: [{ value: this.getValue(data, 'is_db_local'), disabled: false }, Validators.required],
      calcular_itbis: [{ value: this.getValue(data, 'calcular_itbis'), disabled: false }, Validators.required],
      se_calcula_saco: [{ value: this.getValue(data, 'se_calcula_saco'), disabled: false }, Validators.required],
      is_produccion: [{ value: this.getValue(data, 'is_produccion'), disabled: false }, Validators.required],
      facturacion_editar_precio: [{ value: this.getValue(data, 'facturacion_editar_precio'), disabled: false }, Validators.required],
      vende_sin_inventario: [{ value: this.getValue(data, 'vende_sin_inventario'), disabled: false }, Validators.required],
      medida_producto_terminado: [{ value: this.getValue(data, 'medida_producto_terminado'), disabled: false }, Validators.required],
      documentos_a_imprimir: [{ value: this.getValue(data, 'documentos_a_imprimir'), disabled: false }],

      page_size_venta_contado: [{ value: this.getValuePageSize(data, 'pages_sizes.venta_contado'), disabled: false }, Validators.required],
      page_size_venta_credito: [{ value: this.getValuePageSize(data, 'pages_sizes.venta_credito'), disabled: false }, Validators.required],
      page_size_pre_venta: [{ value: this.getValuePageSize(data, 'pages_sizes.pre_venta'), disabled: false }, Validators.required],
      page_size_cotizacion: [{ value: this.getValuePageSize(data, 'pages_sizes.cotizacion'), disabled: false }, Validators.required],
      page_size_compra: [{ value: this.getValuePageSize(data, 'pages_sizes.compra'), disabled: false }, Validators.required],
      page_size_recibo_ingreso: [{ value: this.getValuePageSize(data, 'pages_sizes.recibo_ingreso'), disabled: false }, Validators.required],
      page_size_conduce: [{ value: this.getValuePageSize(data, 'pages_sizes.conduce'), disabled: false }, Validators.required],
      page_size_nota: [{ value: this.getValuePageSize(data, 'pages_sizes.nota'), disabled: false }, Validators.required],
      page_size_cuadre_caja: [{ value: this.getValuePageSize(data, 'pages_sizes.cuadre_caja'), disabled: false }, Validators.required],
      page_size_reporte: [{ value: this.getValuePageSize(data, 'pages_sizes.reporte'), disabled: false }, Validators.required],

      printer_venta_contado: [{ value: this.getValue(data, 'printer_selected.venta_contado'), disabled: false }, Validators.required],
      printer_venta_credito: [{ value: this.getValue(data, 'printer_selected.venta_credito'), disabled: false }, Validators.required],
      printer_pre_venta: [{ value: this.getValue(data, 'printer_selected.pre_venta'), disabled: false }, Validators.required],
      printer_cotizacion: [{ value: this.getValue(data, 'printer_selected.cotizacion'), disabled: false }, Validators.required],
      printer_compra: [{ value: this.getValue(data, 'printer_selected.compra'), disabled: false }, Validators.required],
      printer_recibo_ingreso: [{ value: this.getValue(data, 'printer_selected.recibo_ingreso'), disabled: false }, Validators.required],
      printer_conduce: [{ value: this.getValue(data, 'printer_selected.conduce'), disabled: false }, Validators.required],
      printer_nota: [{ value: this.getValue(data, 'printer_selected.nota'), disabled: false }, Validators.required],
      printer_cuadre_caja: [{ value: this.getValue(data, 'printer_selected.cuadre_caja'), disabled: false }, Validators.required],
      printer_reporte: [{ value: this.getValue(data, 'printer_selected.reporte'), disabled: false }, Validators.required],

      plantilla_impresion_nota: [{ value: this.getValue(data, 'plantillas_impresion.nota'), disabled: false }, Validators.required],
    });

    this.logo_empresa = `data:image/png;base64,${data.logo_empresa}`;
    this.logo_impresion = `data:image/png;base64,${data.logo_impresion}`;
  }

  getValuePageSize(data, key) {
    const size = _.get(data, key);
    const page_size = _.find(this.paper_sizes, (item) => item.descripcion == size);
    return page_size;
  }

  getDocumentosAImprimir(data) {
    const docs = _.filter(data.documentos_a_imprimir, { selected: true });

    return docs;
  }

  get_plantillas(key) {
    const plantillas = _.filter(this.plantillas_impresion, { key });

    return plantillas;
  }

  getValue(data, key) {
    return _.get(data, key);
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.Capitalice(arg));
  }

  saltar(input) {}

  parseDocumentosAImprimir(config) {
    return new Promise<any>((resolve) => {
      const documentos_config = config.documentos_a_imprimir.split(',');
      documentos_config.forEach((item) => this.documentos_a_imprimir_selected.push(_.find(this.documentos_a_imprimir, { key: item })));
      resolve(true);
    });
  }

  changeDocumentosAImprimir() {
    const documentos_selected = _.join(_.map(this.documentos_a_imprimir_selected, 'key'), ',');

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
    this.router.navigateByUrl('auth/login');
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

    const plantillas_impresion = {
      nota: formulario.plantilla_impresion_nota,
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

    keys_to_omit.forEach((element) => (formulario = _.omit(formulario, [element])));

    formulario['pages_sizes'] = pages_sizes;
    formulario['printer_selected'] = printer_selected;
    formulario['plantillas_impresion'] = plantillas_impresion;
    return formulario;
  }

  formIsInvalid() {
    let res = true;

    if (this.form) {
      if (this.form.valid) {
        let formulario = this.getFormularioToSend();

        let keysConfig = Object.keys(formulario);
        const cambios = [];

        keysConfig.forEach((keyC) => {
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
              // switch (key_padre) {
              //   case 'pages_sizes':
              //   case 'plantillas_impresion':
              //     fun.logOrange('ANDO AQUI 1');
              //     this.object_changed(configReplacement, key, obj, copyObjLevel);
              //     break;

              //   default:
              //     fun.logGreen('ANDO AQUI 2');
              //     const value_source = tipoDato == 'string' ? `'${copyObjLevel[key]}'` : `${copyObjLevel[key]}`;
              //     const value_target = tipoDato == 'string' ? `'${obj[key]}'` : `${obj[key]}`;

              //     configReplacement[key] = { source: value_source, target: value_target };
              //     break;
              // }
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
    fun.logGreen('this.config', this.config);
    formulario['cliente'] = this.getValue(this.config, 'cliente');

    const configReplacement = {};
    const logos_changes = {};

    this.changesParser(configReplacement, logos_changes, formulario, this.configCopy, 'obj_principal');

    const objChange = { new_config: formulario, configReplacement: configReplacement };

    if (fun.hasValue(logos_changes)) objChange['logos_changes'] = logos_changes;

    const task = new MessageTask(KEYWORD_ELECTRON_CHANGE_CONFIG_FILE, objChange);

    this._ipc
      .sendTask(task)
      .then((res: string) => {
        this.sharedServ.nextCanToast(true);
        fun.toastSuccess('Configuración de la aplicación cambiada correctamente.', 'CORRECTO');
        setTimeout(() => {
          MODIFIED_CONFIG_FILE.next(res);
          this.sharedServ.nextCanToast(false);
          this.salir();
        }, 250);
      })
      .catch((err) => console.error(err));
  }
}
