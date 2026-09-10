import { HttpHeaders } from '@angular/common/http';
import { getUrlInUse } from './url-server.utils';
import { fun } from '@core/services/functions.service';

export interface SignalCrudArgs {
  afterPath?: string;
  parameters?: Record<string, any>;
  requestParams?: Array<{ key: string; value: any }>;
  body?: any;
}

export class CrudGSignal<T> {
  constructor(private path: string) {}

  getAllRequest(arg?: SignalCrudArgs) {
    return this.request('GET', arg);
  }

  getOneRequest(id: number | string, arg?: SignalCrudArgs) {
    return this.request('GET', arg, id);
  }

  createRequest(data: T | any, arg?: SignalCrudArgs) {
    return this.request('POST', { ...arg, body: data });
  }

  updateRequest(id: number | string, data: T | any, arg?: SignalCrudArgs) {
    return this.request('PATCH', { ...arg, body: data }, id);
  }

  deleteRequest(id: number | string, arg?: SignalCrudArgs) {
    return this.request('DELETE', arg, id);
  }

  actionRequest(id: number | string, action: string, body: any = {}, arg?: SignalCrudArgs) {
    return this.request('POST', { ...arg, afterPath: action, body }, id);
  }

  protected request(method: string, arg?: SignalCrudArgs, id: number | string = null) {
    const request: any = {
      url: this.makeUrl(arg, id),
      method,
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'Application/json',
      }),
    };

    const params = this.formarParametros(arg?.requestParams);
    if (Object.keys(params).length) request.params = params;
    if (!['GET', 'DELETE'].includes(method) && fun.hasValue(arg?.body)) request.body = arg.body;

    return request;
  }

  protected makeUrl(args?: SignalCrudArgs, id: number | string = null) {
    let url = `${getUrlInUse()}${fun.hasValue(this.path) ? `/${this.path}` : ''}`;

    if (id) url += `/${id}`;
    if (fun.objHas(args, 'afterPath') && fun.hasValue(args.afterPath)) url += `/${args.afterPath}`;
    if (fun.objHas(args, 'parameters') && fun.hasValue(args.parameters)) url += this.parseParams(args.parameters);

    return url;
  }

  private parseParams(arg: Record<string, any>) {
    if (!arg || Object.keys(arg).length === 0) return '';

    const params = new URLSearchParams();

    for (const key in arg) {
      if (Object.prototype.hasOwnProperty.call(arg, key) && fun.hasValue(arg[key])) {
        const value = typeof arg[key] === 'object' ? JSON.stringify(arg[key]) : arg[key].toString();
        params.append(key, value);
      }
    }

    return `?${params.toString()}`;
  }

  private formarParametros(params?: Array<{ key: string; value: any }>) {
    const parametros = {};

    if (params) {
      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        parametros[param.key] = param.value;
      }
    }

    return parametros;
  }

}
