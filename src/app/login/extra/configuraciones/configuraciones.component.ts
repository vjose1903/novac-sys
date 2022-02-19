import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfigurationI } from '../../../core/services/configuration.service';
import { SingletonService } from '../../../core/services/singleton.service';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { FunctionService } from '../../../core/services/functions.service';
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
      config_password: [{ value: data.config_password, disabled: false }],
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

    this[data_img.id] = data_img.src_img;
    this.form.controls[data_img.id].setValue(data_img.base_64);
  }

  salir() {
    window.history.back();
  }

  formIsInvalid() {
    let res = true;
    if (this.form) {
      if (this.form.valid) res = false;
      else res = true;
    }
    return res;
  }

  submit() {
    const formulario = this.form.getRawValue();
    formulario.color_app = formulario.color_app.descripcion;

    console.log(formulario);
  }
}
