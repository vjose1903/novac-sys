import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SingletonService } from '../services/singleton.service';

import * as _ from 'lodash';
import { AppConfig } from '../../../environments/environment';
import { ConfigI } from './config-interface';

export interface extraArgs {
  afterPath?: any;
  parameters?: any;
}

export interface responseModel<T> {
  data: T[] | T;
  msg: any[];
  total_paginas?: number;
  total_registros?: number;
} // TODO: <================================================================ PARA DESPUES`

export class CrudG<T> {
  http = SingletonService.http;
  fun = SingletonService.fun;

  constructor(public path: string) {}

  async getAll(arg?: extraArgs, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg);
    return (await this.request(url, 'get', null, tipo).toPromise()) as T;
  }

  async getOne(id: number, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'get', null, tipo).toPromise()) as T;
  }

  async deleteOne(id: number, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'delete', null, tipo).toPromise()) as T;
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
    return (await this.request(url, 'post', data, tipo).toPromise()) as T;
  }

  async updateOne(data, arg = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, data.id);
    return (await this.request(url, 'patch', data, tipo).toPromise()) as T;
  }

  parseParams(arg) {
    let params = '';

    for (const key in arg) {
      if (Object.prototype.hasOwnProperty.call(arg, key)) {
        const value = arg[key];

        if (params.length === 0) params += `?${key}=${value}`;
        else params += `&${key}=${value}`;
      }
    }
    return params;
  }

  getUrlInUse() {
    const configApp:ConfigI = SingletonService.configServ.getConfig({ isPromise: false });
    if (!configApp.usa_url_principal) this.fun.logYellow('::::: USANDO LA URL DE RESPALDO :::::');

    const url = configApp.is_development ? AppConfig.url_server : configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;
    return url;
  }

  makeUrl(tipo, args?, id = null) {
    let url = `${this.getUrlInUse()}${this.fun.hasValue(this.path) ? `/${this.path}` : ''}`;

    const proxyurl = 'https://cors-anywhere.herokuapp.com/';

    if (tipo === 'externo') return `${proxyurl}${this.path}`;
    // if (tipo === 'externo') return `${this.path}`;

    if (id) url += `/${id}`;
    if (_.has(args, 'afterPath') && this.fun.hasValue(args.afterPath)) url += `/${args.afterPath}`;
    if (_.has(args, 'parameters') && this.fun.hasValue(args.parameters)) url += this.parseParams(args.parameters);

    return url;
  }

  request(url, method, data?, tipo?): Observable<any> {
    const metodo = method.toUpperCase() === 'GET' || method.toUpperCase() === 'DELETE' ? 1 : 2;

    switch (metodo) {
      case 1:
        return this.http[method](url, this.defaultHeaders(tipo));
        break;

      case 2:
        return this.http[method](url, JSON.stringify(data), this.defaultHeaders(tipo));
        break;
    }
  }

  defaultHeaders(tipo?) {
    let headers = {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'Application/json',
      },
    };

    return headers;
  }
}
0;
