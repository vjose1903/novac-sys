import * as zlib from 'zlib';
import * as fs from 'fs';
import { pathAdd } from './main';

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
    return new Promise((resolve, reject) => {
      let pathConfig = pathAdd(`/app_config.config`);

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
    return new Promise((resolve, reject) => {
      try {
        let pathConfig = pathAdd(`/app_config.config`);

        var encripted = this.encriptar(data);
        fs.writeFileSync(pathConfig, encripted, { encoding: 'utf-8' });
        resolve(true);
      } catch (error) {
        console.error(error);
        reject(false);
      }
    });
  }
}
