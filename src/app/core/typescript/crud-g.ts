import { MetodoHttp } from './../../../../electron/shared-electron-angular';
import { Observable, lastValueFrom } from 'rxjs';
import { Ss } from '../services/singleton.service';
import * as _ from 'lodash';
import { Environment } from '@environments/environment';
import { ConfigI } from '../interface/config-interface';
import { fun } from '../services/functions.service';
import { getUrlInUse } from './url-server.utils';

export interface requestParameters {
  afterPath?: any;
  parameters?: any;
  requestParams?: Array<{ key: any; value: any }>;
}

export interface responseModel<T> {
  data: T[] | T;
  msg: any[];
  total_paginas?: number;
  total_registros?: number;
}

export class CrudG<T> {
  constructor(private path: string) {}

  async dynamic(arg?: requestParameters, data: any = null, httpMethod: MetodoHttp = 'get', tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg);

    return (await this.request(url, httpMethod, data, tipo, arg?.requestParams).toPromise()) as responseModel<T>;
  }

  async getAll(arg?: requestParameters, tipo: 'backend' | 'externo' = 'backend'): Promise<responseModel<T>> {
    return new Promise<responseModel<T>>(async (resolve, reject) => {
      try {
        let url = this.makeUrl(tipo, arg);

        const response = await lastValueFrom(this.request(url, 'get', null, tipo, arg?.requestParams));

        resolve(response as responseModel<T>);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getOne(id: number, arg: requestParameters = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'get', null, tipo, arg?.requestParams).toPromise()) as responseModel<T>;
  }

  async deleteOne(id: number, arg: requestParameters = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'delete', null, tipo, arg?.requestParams).toPromise()) as responseModel<T>;
  }

  createUpdateOne(data, arg: requestParameters = null, tipo: 'backend' | 'externo' = 'backend') {
    const promise = new Promise<responseModel<T>>((resolve, reject) => {
      if (Number(data.id) === 0 || !data.id) delete data.id;

      if (fun.objHas(data, 'id') && data.id !== 0) {
        this.updateOne(data, arg, tipo).then(
          res => resolve(res),
          err => reject(err)
        );
      } else {
        this.createOne(data, arg, tipo).then(
          res => resolve(res),
          err => reject(err)
        );
      }
    });
    return promise;
  }

  async createOne(data, arg: requestParameters = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg);
    return (await this.request(url, 'post', data, tipo, arg?.requestParams).toPromise()) as responseModel<T>;
  }

  async updateOne(data, arg: requestParameters = null, tipo: 'backend' | 'externo' = 'backend') {
    let url = this.makeUrl(tipo, arg, data.id);
    return (await this.request(url, 'patch', data, tipo, arg?.requestParams).toPromise()) as responseModel<T>;
  }

  private parseParams(arg) {
    if (!arg || Object.keys(arg).length === 0) return '';

    const params = new URLSearchParams();

    for (const key in arg) {
      if (Object.prototype.hasOwnProperty.call(arg, key)) {
        const value = arg[key];

        if (fun.hasValue(value)) {
          if (typeof value === 'object') {
            // Para objetos, los convertimos a JSON string
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      }
    }

    return `?${params.toString()}`;
  }

  private makeUrl(tipo, args?, id = null) {
    let url = `${getUrlInUse()}${fun.hasValue(this.path) ? `/${this.path}` : ''}`;

    const proxyurl = 'https://cors-anywhere.herokuapp.com/';

    if (tipo === 'externo') return `${proxyurl}${this.path}`;

    if (id) url += `/${id}`;
    if (fun.objHas(args, 'afterPath') && fun.hasValue(args.afterPath)) url += `/${args.afterPath}`;
    if (fun.objHas(args, 'parameters') && fun.hasValue(args.parameters)) url += this.parseParams(args.parameters);

    return url;
  }

  private request(url, method, data?, tipo?, arg?): Observable<any> {
    const metodo = method.toUpperCase() === 'GET' || method.toUpperCase() === 'DELETE' ? 1 : 2;

    switch (metodo) {
      case 1:
        return Ss.http[method](url, this.requestOptions(tipo, arg));
        break;

      case 2:
        return Ss.http[method](url, JSON.stringify(data), this.requestOptions(tipo, arg));
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
