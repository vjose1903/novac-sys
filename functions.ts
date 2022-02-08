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

  static getConfigFile(): string {
    let pathConfig = pathAdd(`/app_config.config`);
    console.log(' dirconfig ::::: ', pathConfig);

    if (fs.existsSync(pathConfig)) {
      var res = fs.readFileSync(pathConfig, 'utf-8');
      var decript = this.desEncriptar(res);
      return decript;
    } else {
      return '{}';
    }
  }

  static setConfigFile(data: string): boolean {
    try {
      let pathConfig = pathAdd(`/app_config.config`);
      console.log(' dirconfig ::::: ', pathConfig);

      var encripted = this.encriptar(data);
      fs.writeFileSync(pathConfig, encripted, { encoding: 'utf-8' });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
