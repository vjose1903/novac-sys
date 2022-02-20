import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfigurationI } from '../../../core/services/configuration.service';
import { SingletonService } from '../../../core/services/singleton.service';
import { GLOBAL, MODIFIED_CONFIG_FILE } from '../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { FunctionService } from '../../../core/services/functions.service';
import { MessageTask } from '../../../core/models/message-task';
import { KEYWORD_ELECTRON_CHANGE_CONFIG_FILE } from '../../../../../electron/shared-electron-angular';
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
  configCopy;

  constructor(private fb: FormBuilder, private fun: FunctionService) {}

  ngOnInit(): void {
    this.configServ.getConfig().then((config: ConfigurationI) => {
      this.config = config;
      this.configCopy = this.fun.duplicarJson(config);
      this.createForm(config);
    });
  }

  createForm(data) {
    const color_format = _.find(this.colores, (item) => item.descripcion == data.color_app);
    this.form = this.fb.group({
      nombre_empresa: [{ value: data.nombre_empresa, disabled: false }, Validators.required],
      rnc_empresa: [{ value: data.rnc_empresa, disabled: false }, Validators.required],
      direccion_empresa: [{ value: data.direccion_empresa, disabled: false }, Validators.required],
      telefono_empresa: [{ value: data.telefono_empresa, disabled: false }, Validators.required],
      logo_empresa: [{ value: data.logo_empresa, disabled: false }, Validators.required],
      logo_impresion: [{ value: data.logo_impresion, disabled: false }, Validators.required],
      color_app: [{ value: color_format, disabled: false }, Validators.required],
      url_servidor: [{ value: data.url_servidor, disabled: false }, Validators.required],
      url_servidor_respaldo: [{ value: data.url_servidor_respaldo, disabled: false }, Validators.required],
      url_servidor_descargas: [{ value: data.url_servidor_descargas, disabled: false }, Validators.required],
      config_password: [{ value: data.config_password, disabled: false }, Validators.required],
      usa_url_principal: [{ value: data.usa_url_principal, disabled: false }, Validators.required],
      printer_caja_selected: [{ value: data.printer_caja_selected, disabled: false }, Validators.required],
      printer_reportes_selected: [{ value: data.printer_reportes_selected, disabled: false }, Validators.required],
    });

    this.logo_empresa = `data:image/png;base64,${data.logo_empresa}`;
    this.logo_impresion = `data:image/png;base64,${data.logo_impresion}`;
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }

  saltar(input) {}

  getPhotoData(data_img) {
    console.log('data_img ', data_img);

    if (data_img.src_img) {
      console.log('CONFIG ANTES ', this.fun.duplicarJson(this.form.getRawValue()));

      this[data_img.id] = data_img.src_img;
      this.form.controls[data_img.id].setValue(data_img.base_64);
      console.log('CONFIG DESPUES ', this.fun.duplicarJson(this.form.getRawValue()));
    }
  }

  salir() {
    window.history.back();
  }

  getFormularioToSend() {
    const formulario = this.form.getRawValue();
    formulario.color_app = formulario.color_app.descripcion;
    return formulario;
  }

  formIsInvalid() {
    let res = true;
    if (this.form) {
      if (this.form.valid) {
        const formulario = this.getFormularioToSend();
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

    const logosKeys = ['logo_empresa', 'logo_impresion'];
    const array_targets = [];
    const array_replacement = [];
    const logos_changes = {};

    let keysConfig = Object.keys(formulario);

    for (let i = 0; i < keysConfig.length; i++) {
      const keyC = keysConfig[i];

      if (this.configCopy[keyC] != formulario[keyC]) {
        if (logosKeys.includes(keyC)) {
          logos_changes[keyC] = formulario[keyC];
        } else {
          array_targets.push(`${keyC}: '${this.configCopy[keyC]}'`);
          array_replacement.push(`${keyC}: '${formulario[keyC]}'`);
        }
      }
    }

    const objChange = {
      new_config: formulario,
      array_targets: array_targets,
      array_replacement: array_replacement,
    };

    if (this.fun.hasValue(logos_changes)) objChange['logos_changes'] = logos_changes;

    console.log('objChange ', objChange);

    const task = new MessageTask(KEYWORD_ELECTRON_CHANGE_CONFIG_FILE, objChange);

    this._ipc
      .sendTask(task)
      .then((res: string) => {
        this.fun.nextCanToast(true);
        this.fun.toastSuccess('Configuración de la aplicación cambiada correctamente.', 'CORRECTO');
        setTimeout(() => {
          MODIFIED_CONFIG_FILE.next(res);
          this.fun.nextCanToast(false);
          this.salir();
        }, 250);
      })
      .catch((err) => console.error(err));
  }
}
