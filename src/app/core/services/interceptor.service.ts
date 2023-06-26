import { ConfigService } from './configuration.service';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, map, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import * as _ from 'lodash';
import { Ss } from './singleton.service';
import { fun } from './functions.service';
import { SharedService } from './shared.service';

@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(public sharedServ: SharedService) {}
  requestCount: number = 0;

  private startRequest(args?): void {
    if (this.requestCount <= 0 && args != 'no_show') Ss.loadServ.isLoading.next(true);
    this.requestCount++;
  }

  private endRequest(args?): void {
    if (this.requestCount > 0 && args != 'no_show') this.requestCount--;

    if (this.requestCount == 0 && args != 'no_hide') Ss.loadServ.isLoading.next(false);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.sharedServ.nextCanToast(false);
    const token = fun.getAuthToken();

    let spinner = request.params.get('spinner');
    let msgs = request.params.get('msgs');
    let show_msgs = fun.hasValue(msgs) ? (msgs == 'no_show' ? false : true) : true;

    let sendParams = request.params.delete('msgs', msgs);
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
          'has-contabilidad': `${ConfigService.config.has_contabilidad}`,
        },
        params: sendParams,
      });
    }

    return next.handle(request).pipe(
      map((event) => {
        if (event instanceof HttpResponse) {
          if (fun.objHas(event, 'body.msg')) this.handler_msg(event.body.msg, show_msgs, 'success');

          ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach((header) => {
            const headerValue = event.headers.get(header);
            if (fun.hasValue(headerValue) && fun.isEmpty(localStorage.getItem(header))) localStorage.setItem(header, headerValue);
          });
        }

        this.sharedServ.nextCanToast(true);
        return event;
      }),

      catchError((response: HttpErrorResponse) => {
        console.log(' ');
        console.log('response ', response);
        console.log(' ');
        if (fun.isEmpty(response.error)) {
          fun.toastError('Error desconocido favor de comunicarse con Víctor José Vásquez Santos.', 'ERROR');
        } else if (response.error && fun.objHas(response.error, 'action') && response.error.action == 'close_session') {
          fun.toastError(response.error.msg, 'ERROR');
          this.sharedServ.nextCanToast(false);
          Ss.layServ.nextLogOut({ bool: true, quien: 'close_session' });
        } else {
          if (fun.objHas(response, 'status') && response.status == 404) this.handler_msg(response.error.msg, show_msgs, 'warning');

          if (fun.objHas(response, 'error.msg')) this.handler_msg(response.error.msg, show_msgs, 'error');
        }

        return throwError(response);
      }),
      finalize(() => {
        this.endRequest(spinner);
      }),
    );
  }

  handler_msg(menssages, show_msgs, tipo) {
    // console.warn('MENSAJE DESDE EL INTERCEPTOR');
    // console.warn('menssages ', menssages);

    if (show_msgs && menssages && Array.isArray(menssages)) {
      for (let i = 0; i < menssages.length; i++) {
        const menssage = menssages[i];

        if (tipo === 'success') fun.toastSuccess(menssage, 'CORRECTO');
        if (tipo === 'warning') fun.toastWarning(menssage, 'AVISO');
        if (tipo === 'error') fun.toastError(menssage, 'ERROR');
      }
    }
  }
}
