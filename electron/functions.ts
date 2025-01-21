import * as fs from 'fs';
import { pathAdd, writeLogs } from '../main';
import { BrowserWindow } from 'electron';
import { ConfigI } from '../src/app/core/interface/config-interface';

export default class Functions {
  static encriptar(arg: string): string {
    const base64String = btoa(unescape(encodeURIComponent(arg)));
    return base64String;
  }
  static desEncriptar(arg: string): { object: string; error?: boolean } {
    try {
      const decodedString = decodeURIComponent(escape(atob(arg)));
      return { object: decodedString, error: false };
    } catch (error) {
      console.error('Error al desencriptar:', error);
      return { object: '', error: true };
    }
  }

  static getConfigFile(): Promise<ConfigI> {
    return new Promise(async (resolve, reject) => {
      let pathConfig = (await pathAdd(`/app_config.config`)) as string;

      if (fs.existsSync(pathConfig)) {
        var res = fs.readFileSync(pathConfig, 'utf-8');
        var decript = this.desEncriptar(res);

        if (decript.error) {
          reject();
        } else {
          resolve(JSON.parse(decript.object));
        }
      } else {
        reject();
      }
    });
  }

  static setConfigFile(data: string) {
    return new Promise(async (resolve, reject) => {
      try {
        writeLogs('INICIANDO PROCESO DE SETEO DE CONFIGURACION');
        
        let pathConfig = (await pathAdd(`/app_config.config`)) as string;

        writeLogs(pathConfig, 'pathConfig');

        var encripted = this.encriptar(data);
        fs.writeFileSync(pathConfig, encripted, { encoding: 'utf-8' });
        resolve(true);
      } catch (error) {
        console.error(error);
        reject(false);
      }
    });
  }

  // __________________________________________________________________________________________________
  // Nombre: isEmpty
  // Descripcion : Esta funcion valida que si una variable esta vacia
  // __________________________________________________________________________________________________

  static isEmpty(value) {
    return (
      // es null o indefinido
      value == null ||
      // si tiene longitud 0
      (value.hasOwnProperty('length') && value.length === 0) ||
      // si es un string vacio o con lleno de espacios
      (typeof value === 'string' && value.trim().length === 0) ||
      // si es un objeto y no tiene propiedades
      (value.constructor === Object && Object.keys(value).length === 0)
    );
  }

  // __________________________________________________________________________________________________
  // Nombre: hasValue
  // Descripcion : Esta funcion valida que si una variable tiene valor
  // __________________________________________________________________________________________________

  static hasValue(value) {
    return !this.isEmpty(value);
  }

  // __________________________________________________________________________________________________
  // Nombre: multiAssing
  // Descripcion : Esta funcion hace un multiAsignamiento en onjetos a partir de otro objeto
  // __________________________________________________________________________________________________
  static multiAssing(obj: Object, sources: Array<{ key: string; value: any }>) {
    for (let index = 0; index < sources.length; index++) {
      const element = sources[index];
      obj[element.key] = element.value;
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: getDefaultPrinter
  // Descripcion : Esta funcion hace un multiAsignamiento en onjetos a partir de otro objeto
  // __________________________________________________________________________________________________
  static async getDefaultPrinter(win: BrowserWindow) {
    const printers = await win.webContents.getPrintersAsync();
    const defaultPrinter = printers.find((printer) => printer.isDefault);
    return defaultPrinter;
  }
}
