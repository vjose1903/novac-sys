import * as zlib from 'zlib';
import * as fs from 'fs';
import { pathAdd } from '../main';
import { BrowserWindow } from 'electron';

export default class Functions {
  static encriptar(arg: string): string {
    var arr = Buffer.from(arg);
    var deflated = zlib.deflateSync(arr).toString('base64');
    return deflated;
  }
  static desEncriptar(arg: string): string {
    var arr = Buffer.from(arg, 'base64');
    var deflated = zlib.inflateSync(arr).toString('utf8');
    return deflated;
  }

  static getConfigFile() {
    return new Promise(async (resolve, reject) => {
      let pathConfig = (await pathAdd(`/app_config.config`)) as string;

      if (fs.existsSync(pathConfig)) {
        var res = fs.readFileSync(pathConfig, 'utf-8');
        var decript = this.desEncriptar(res);
        resolve(decript);
      } else {
        resolve('{}');
      }
    });
  }

  static setConfigFile(data: string) {
    return new Promise(async (resolve, reject) => {
      try {
        let pathConfig = (await pathAdd(`/app_config.config`)) as string;

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
  static getDefaultPrinter(win: BrowserWindow) {
    const printers = win.webContents.getPrinters();
    const defaultPrinter = printers.find((printer) => printer.isDefault);
    return defaultPrinter;
  }
}
