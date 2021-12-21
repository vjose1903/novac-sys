import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SingletonService } from '../services/singleton.service';

import * as _ from 'lodash';
import { AppConfig } from '../../../environments/environment';

export interface extraArgs {
  afterPath: any;
  parameters: any;
}

export class CrudG<T> {
  http = SingletonService.http;

  constructor(public path: string) {}

  async getAll(arg?, tipo = 'backend') {
    let url = this.makeUrl(tipo, arg);
    return (await this.request(url, 'get', null, tipo).toPromise()) as T[];
  }

  async getOne(id: any = '', arg = null, tipo = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'get', null, tipo).toPromise()) as T;
  }

  async deleteOne(id: any = '', arg = null, tipo = 'backend') {
    let url = this.makeUrl(tipo, arg, id);
    return (await this.request(url, 'delete', null, tipo).toPromise()) as T;
  }

  createUpdateOne(data, arg = null, tipo = 'backend') {
    const promise = new Promise((resolve, reject) => {
      if (Number(data.id) === 0 || !data.id) delete data.id;

      if (_.has(data, 'id') && data.id !== 0) {
        this.updateOne(data, arg, tipo).then(
          (res) => {
            resolve(res);
          },
          (err) => {
            reject(err);
          },
        );
      } else {
        this.createOne(data, arg, tipo).then(
          (res) => {
            resolve(res);
          },
          (err) => {
            reject(err);
          },
        );
      }
    });
    return promise;
  }

  async createOne(data, arg = null, tipo = 'backend') {
    let url = this.makeUrl(tipo, arg);
    return (await this.request(url, 'post', data, tipo).toPromise()) as T;
  }

  async updateOne(data, arg = null, tipo = 'backend') {
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

  makeUrl(tipo, args?, id = null) {
    let url = `${AppConfig.url_server}/${this.path}`;

    const proxyurl = 'https://cors-anywhere.herokuapp.com/';

    if (tipo === 'externo') return `${proxyurl}${this.path}`;
    // if (tipo === 'externo') return `${this.path}`;

    if (id) url += `/${id}`;
    if (_.has(args, 'afterPath')) url += `/${args.afterPath}`;
    if (_.has(args, 'parameters')) url += this.parseParams(args.parameters);

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
