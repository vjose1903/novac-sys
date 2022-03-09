import { Injectable } from '@angular/core';

export interface ConfigurationI {
  nombre_empresa: string;
  rnc_empresa: string;
  direccion_empresa: string;
  telefono_empresa: string;
  logo_empresa: string;
  logo_empresa_impresion: string;
  color_app: string;
  url_servidor: string;
  url_servidor_respaldo: string;
  url_servidor_descargas: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {

  constructor() {}

  private config: ConfigurationI;

  set setConfig(configuration) {
    this.config = configuration;
  }

  getConfig(params: { isPromise: boolean } = { isPromise: true }): any {
    if (params.isPromise) {
      return new Promise((resolve) => {
        resolve(this.config);
      });
    } else {
      return this.config as ConfigurationI;
    }
  }
}
