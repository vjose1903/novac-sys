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
@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.scss'],
})
export class ConfiguracionesComponent implements OnInit {
  _ipc = SingletonService._ipc;
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

  paper_sizes = [
    { label: '8.5 x 11', descripcion: '8.5x11' },
    { label: '8.5 x 5.5', descripcion: '8.5x5.5' },
    { label: 'Rollo 80mm', descripcion: '80mm_roll' },
  ];

  configCopy;

  constructor(private fb: FormBuilder, public sharedServ: SharedService) {}

  ngOnInit(): void {
    this.configServ.getConfig().then((config: ConfigI) => {
      this.config = config;
      this.configCopy = fun.duplicarJson(config);
      this.createForm(config);
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

  getValue(data, key) {
    return _.get(data, key);
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(fun.Capitalice(arg));
  }

  saltar(input) {}

  getPhotoData(data_img) {
    if (data_img.src_img) {
      this[data_img.id] = data_img.src_img;
      this.form.controls[data_img.id].setValue(data_img.base_64);
    }
  }

  salir() {
    window.history.back();
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

    const array_targets = [];
    const array_replacement = [];
    const logos_changes = {};

    this.changesParser(array_targets, array_replacement, logos_changes, formulario, this.configCopy);

    const objChange = {
      new_config: formulario,
      array_targets: array_targets,
      array_replacement: array_replacement,
    };

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

  changesParser(array_targets, array_replacement, logos_changes, obj, copyObjLevel) {
    let keysConfig = Object.keys(obj);
    const logosKeys = ['logo_empresa', 'logo_impresion'];

    for (let i = 0; i < keysConfig.length; i++) {
      const key = keysConfig[i];
      if (fun.hasValue(copyObjLevel[key])) {
        if (typeof copyObjLevel[key] == 'string') {
          if (copyObjLevel[key] != obj[key]) {
            if (logosKeys.includes(key)) {
              logos_changes[key] = obj[key];
            } else {
              array_targets.push(`${key}: '${copyObjLevel[key]}'`);
              array_replacement.push(`${key}: '${obj[key]}'`);
            }
          }
        } else {
          this.changesParser(array_targets, array_replacement, logos_changes, obj[key], copyObjLevel[key]);
        }
      }
    }
  }
}
