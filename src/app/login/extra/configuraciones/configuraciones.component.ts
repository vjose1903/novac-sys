import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SingletonService } from '../../../core/services/singleton.service';
import { MODIFIED_CONFIG_FILE } from '../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { MessageTask } from '../../../core/models/message-task';
import { KEYWORD_ELECTRON_CHANGE_CONFIG_FILE } from '../../../../../electron/shared-electron-angular';
import { ConfigI } from '../../../core/typescript/config-interface';
import { fun } from '../../../core/services/functions.service';
import { SharedService } from '../../../core/services/shared.service';
import { Router } from '@angular/router';
import { IpcService } from '../../../core/services/ipc.service';
@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.scss'],
})
export class ConfiguracionesComponent implements OnInit {
  configServ = SingletonService.configServ;
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

  configCopy;

  constructor(private fb: FormBuilder, public sharedServ: SharedService, private router: Router, public _ipc: IpcService) {}

  ngOnInit(): void {
    this.configServ.getConfig().then((config: ConfigI) => {
      this.config = config;
      this.configCopy = fun.duplicarJson(config);
      this.parseDocumentosAImprimir(config).then(() => this.createForm(config));
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
      printer_caja_selected: [{ value: this.getValue(data, 'printer_caja_selected'), disabled: false }, Validators.required],
      printer_reportes_selected: [{ value: this.getValue(data, 'printer_reportes_selected'), disabled: false }, Validators.required],
      is_db_local: [{ value: this.getValue(data, 'is_db_local'), disabled: false }, Validators.required],
      facturacion_editar_precio: [{ value: this.getValue(data, 'facturacion_editar_precio'), disabled: false }, Validators.required],
      vende_sin_inventario: [{ value: this.getValue(data, 'vende_sin_inventario'), disabled: false }, Validators.required],
      medida_producto_terminado: [{ value: this.getValue(data, 'medida_producto_terminado'), disabled: false }, Validators.required],
      documentos_a_imprimir: [{ value: this.getValue(data, 'documentos_a_imprimir'), disabled: false }],

      page_size_recibo_ingreso: [{ value: this.getValuePageSize(data, 'pages_sizes.recibo_ingreso'), disabled: false }, Validators.required],
      page_size_conduce: [{ value: this.getValuePageSize(data, 'pages_sizes.conduce'), disabled: false }, Validators.required],
      page_size_facturacion: [{ value: this.getValuePageSize(data, 'pages_sizes.facturacion'), disabled: false }, Validators.required],
      page_size_nota: [{ value: this.getValuePageSize(data, 'pages_sizes.nota'), disabled: false }, Validators.required],
      page_size_cuadre_caja: [{ value: this.getValuePageSize(data, 'pages_sizes.cuadre_caja'), disabled: false }, Validators.required],
      page_size_reporte: [{ value: this.getValuePageSize(data, 'pages_sizes.reporte'), disabled: false }, Validators.required],
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

  salir() {
    this.router.navigateByUrl('auth/login');
  }

  getFormularioToSend() {
    let formulario = this.form.getRawValue();
    formulario.color_app = formulario.color_app.descripcion;

    const pages_sizes = {
      recibo_ingreso: formulario.page_size_recibo_ingreso.descripcion,
      conduce: formulario.page_size_conduce.descripcion,
      facturacion: formulario.page_size_facturacion.descripcion,
      nota: formulario.page_size_nota.descripcion,
      cuadre_caja: formulario.page_size_cuadre_caja.descripcion,
      reporte: formulario.page_size_reporte.descripcion,
    };

    formulario = _.omit(formulario, ['page_size_recibo_ingreso', 'page_size_conduce', 'page_size_facturacion', 'page_size_cuadre_caja', 'page_size_reporte']);
    formulario['pages_sizes'] = pages_sizes;
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
            if (!_.isEqual(this.configCopy[keyC], formulario[keyC])) cambios.push(keyC);
          }
        });

        res = cambios.length > 0 ? false : true;
      } else res = true;
    }
    return res;
  }

  submit() {
    const formulario = this.getFormularioToSend();

    const configReplacement = {};
    const logos_changes = {};

    this.changesParser(configReplacement, logos_changes, formulario, this.configCopy);

    const objChange = { new_config: formulario, configReplacement: configReplacement };

    if (fun.hasValue(logos_changes)) objChange['logos_changes'] = logos_changes;
    console.log('objChange ', objChange);

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

  changesParser(configReplacement, logos_changes, obj, copyObjLevel) {
    let keysConfig = Object.keys(obj);
    const logosKeys = ['logo_empresa', 'logo_impresion'];

    for (let i = 0; i < keysConfig.length; i++) {
      const key = keysConfig[i];

      if (fun.hasValue(copyObjLevel[key])) {
        const tipoDato = typeof copyObjLevel[key];

        if (tipoDato == 'string' || tipoDato == 'boolean') {
          if (copyObjLevel[key] != obj[key]) {
            if (logosKeys.includes(key)) {
              logos_changes[key] = obj[key];
            } else {
              const value_source = tipoDato == 'string' ? `'${copyObjLevel[key]}'` : `${copyObjLevel[key]}`;
              const value_target = tipoDato == 'string' ? `'${obj[key]}'` : `${obj[key]}`;

              configReplacement[key] = { source: value_source, target: value_target };
            }
          }
        } else {
          this.changesParser(configReplacement, logos_changes, obj[key], copyObjLevel[key]);
        }
      }
    }
  }
}
