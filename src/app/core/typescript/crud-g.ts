import { Observable } from 'rxjs';

import { SingletonService } from '../services/singleton.service';

import * as _ from 'lodash';
import { AppConfig } from '../../../environments/environment';
import { ConfigI } from './config-interface';
import { fun } from '../services/functions.service';

export interface extraArgs {
  afterPath?: any;
  parameters?: any;
  requestParams?: Array<{ key: any; value: any }>;
}

export interface responseModel<T> {
  data: T[] | T;
  msg: any[];
  total_paginas?: number;
  total_registros?: number;
} // TODO: <================================================================ PARA DESPUES`

export class CrudG<T> {
  constructor(private path: string) {}

  async dynamic(arg?: extraArgs, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg);

    return (await this.request(url, 'get', null, tipo, arg?.requestParams).toPromise()) as T;
  }

  async getAll(arg?: extraArgs, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg);

    return (await this.request(url, 'get', null, tipo, arg?.requestParams).toPromise()) as T;
  }

  async getOne(id: number, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'get', null, tipo, arg?.requestParams).toPromise()) as T;
  }

  async deleteOne(id: number, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'delete', null, tipo, arg?.requestParams).toPromise()) as T;
  }

  createUpdateOne(data, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    const promise = new Promise((resolve, reject) => {
      if (Number(data.id) === 0 || !data.id) delete data.id;

      if (_.has(data, 'id') && data.id !== 0) {
        this.updateOne(data, arg, tipo).then(
          (res) => resolve(res),
          (err) => reject(err),
        );
      } else {
        this.createOne(data, arg, tipo).then(
          (res) => resolve(res),
          (err) => reject(err),
        );
      }
    });
    return promise;
  }

  async createOne(data, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg);

    return (await this.request(url, 'post', data, tipo, arg?.requestParams).toPromise()) as T;
  }

  async updateOne(data, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, data.id);
    return (await this.request(url, 'patch', data, tipo, arg?.requestParams).toPromise()) as T;
  }

  private parseParams(arg) {
    let params = '';

    for (const key in arg) {
      if (Object.prototype.hasOwnProperty.call(arg, key)) {
        const value = arg[key];

        if (params.length === 0) params += '?';

        if (typeof value == 'object') {
          params += `&${key}={`;
          let inner_object = '';
          for (const inner_key in value) {
            const inner_value = value[inner_key];

            if (inner_object.length > 0) inner_object += ',';
            params += `${inner_key}:${inner_value}`;
          }
          params += `}`;
        } else {
          params += `&${key}=${value}`;
        }
      }
    }
    return params;
  }

  private getUrlInUse() {
    const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });

    const url = configApp.is_development ? AppConfig[configApp.gitUser] : configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;
    return url;
  }

  private makeUrl(tipo, args?, id = null) {
    let url = `${this.getUrlInUse()}${fun.hasValue(this.path) ? `/${this.path}` : ''}`;

    const proxyurl = 'https://cors-anywhere.herokuapp.com/';

    if (tipo === 'externo') return `${proxyurl}${this.path}`;

    if (id) url += `/${id}`;
    if (_.has(args, 'afterPath') && fun.hasValue(args.afterPath)) url += `/${args.afterPath}`;
    if (_.has(args, 'parameters') && fun.hasValue(args.parameters)) url += this.parseParams(args.parameters);

    return url;
  }

  private request(url, method, data?, tipo?, arg?): Observable<any> {
    const metodo = method.toUpperCase() === 'GET' || method.toUpperCase() === 'DELETE' ? 1 : 2;

    switch (metodo) {
      case 1:
        return SingletonService.http[method](url, this.requestOptions(tipo, arg));
        break;

      case 2:
        return SingletonService.http[method](url, JSON.stringify(data), this.requestOptions(tipo, arg));
        break;
    }
  }

  private requestOptions(tipo?, arg?) {
    let options = {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'Application/json',
      },
      ...this.formarParametros(arg),
    };

    return options;
  }

  private formarParametros(params) {
    const parametros = { params: {} };

    if (params) {
      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        parametros['params'][param.key] = param.value;
      }
    }

    return parametros;
  }
}
0;
