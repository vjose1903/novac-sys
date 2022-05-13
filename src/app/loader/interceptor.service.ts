import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, map, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { SingletonService } from '../core/services/singleton.service';
import { fun } from '../core/services/functions.service';
import { SharedService } from '../core/services/shared.service';

@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(public loadServ: LoaderService, public sharedServ: SharedService) {}
  requestCount: number = 0;

  private startRequest(args?): void {
    if (this.requestCount <= 0 && args !== 'no_show') this.loadServ.isLoading.next(true);
    this.requestCount++;
  }

  private endRequest(args?): void {
    if (this.requestCount > 0 && args !== 'no_show') this.requestCount--;

    if (this.requestCount == 0 && args !== 'no_hide') this.loadServ.isLoading.next(false);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.sharedServ.nextCanToast(false);
    const token = fun.getAuthToken();

    let spinner = request.params.get('spinner');

    let sendParams;
    if (spinner) sendParams = request.params.delete('spinner', spinner); // creando la nueva instancia de HttpParams sin el parametro spinner

    if (!spinner || spinner == 'no_hide') this.startRequest(spinner); // Activa el spinner

    if (token) {
      request = request.clone({
        setHeaders: {
          'access-token': `${localStorage.getItem('access-token')}`,
          client: `${localStorage.getItem('client')}`,
          expiry: `${localStorage.getItem('expiry')}`,
          uid: `${localStorage.getItem('uid')}`,
          'token-type': `${localStorage.getItem('token-type')}`,
        },
        params: sendParams,
      });
    }

    return next.handle(request).pipe(
      map((event) => {
        if (event instanceof HttpResponse) {
          if (_.has(event, 'body.msg')) this.handler_msg(event.body.msg, 'success');

          ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach((header) => {
            const headerValue = event.headers.get(header);
            if (headerValue !== null && localStorage.getItem(header) == null) {
              localStorage.setItem(header, headerValue);
            }
          });
        }

        this.sharedServ.nextCanToast(true);
        return event;
      }),

      catchError((response: HttpErrorResponse) => {
        if (response.error === null) {
          fun.toastError('Error desconocido favor de comunicarse con Víctor José Vásquez Santos.', 'ERROR');
        } else if (response.error && _.has(response.error, 'action') && response.error.action === 'close_ssesion') {
          fun.toastError(response.error.msg, 'ERROR');
          this.sharedServ.nextCanToast(false);
          SingletonService.layServ.nextLogOut({ bool: true, quien: 'close_ssesion' });
        } else {
          if (_.has(response, 'status') && response.status == 404) this.handler_msg(response.error.msg, 'warning');

          if (_.has(response, 'error.msg')) this.handler_msg(response.error.msg, 'error');
        }

        return throwError(response);
      }),
      finalize(() => {
        this.endRequest(spinner);
      }),
    );
    // return next.handle(request).pipe(
    // );
  }

  handler_msg(menssages, tipo_) {
    // console.warn('MENSAJE DESDE EL INTERCEPTOR');
    // console.warn('menssages ', menssages);

    if (menssages && Array.isArray(menssages)) {
      for (let i = 0; i < menssages.length; i++) {
        const menssage = menssages[i];

        if (tipo_ === 'success') fun.toastSuccess(menssage, 'CORRECTO');
        if (tipo_ === 'warning') fun.toastWarning(menssage, 'AVISO');
        if (tipo_ === 'error') fun.toastError(menssage, 'ERROR');
      }
    }
  }
}
