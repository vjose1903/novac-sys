import { Injectable, NgZone } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, map, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { Ss } from '@core/services/singleton.service';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';

@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(
    public loadServ: LoaderService,
    public sharedServ: SharedService,
    private zone: NgZone
  ) {}
  requestCount: number = 0;
  private perfRequestId = 0;

  private startRequest(args?): void {
    if (this.requestCount <= 0 && args != 'no_show') this.loadServ.isLoading.next(true);
    this.requestCount++;
  }

  private endRequest(args?): void {
    if (this.requestCount > 0 && args != 'no_show') this.requestCount--;

    if (this.requestCount == 0 && args != 'no_hide') this.loadServ.isLoading.next(false);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.zone.runOutsideAngular(() => this.sharedServ.nextCanToast(false));
    const token = fun.getAuthToken();
    const perfId = ++this.perfRequestId;
    const perfStart = performance.now();

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

    this.logHttpPerf('request', {
      id: perfId,
      route: window?.location?.pathname,
      method: request.method,
      url: request.urlWithParams,
      spinner: spinner || null,
    });

    return next.handle(request).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          this.logHttpPerf('response', {
            id: perfId,
            route: window?.location?.pathname,
            method: request.method,
            url: request.urlWithParams,
            status: event.status,
            duration_ms: Math.round(performance.now() - perfStart),
          });

          if (fun.objHas(event, 'body.msg')) this.handler_msg(event.body.msg, 'success');

          this.zone.runOutsideAngular(() => {
            ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach(header => {
              const headerValue = event.headers.get(header);
              if (fun.hasValue(headerValue) && fun.isEmpty(localStorage.getItem(header))) localStorage.setItem(header, headerValue);
            });
          });
        }

        this.zone.runOutsideAngular(() => this.sharedServ.nextCanToast(true));
        return event;
      }),

      catchError((response: HttpErrorResponse) => {
        this.logHttpPerf('error', {
          id: perfId,
          route: window?.location?.pathname,
          method: request.method,
          url: request.urlWithParams,
          status: response.status,
          duration_ms: Math.round(performance.now() - perfStart),
        });

        console.log('%c response ', 'color: orange', response);

        if (response.status == 401) {
          const token = fun.getAuthToken();
          console.log('ENREEEE 2');
          console.log('token ', token);

          fun.logout();

          if (token) {
            fun.toastError('Su sesión ha expirado, por favor inicie sesión nuevamente', 'SESIÓN EXPIRADA');
            return;
          }
        }
        // console.log('response', response);
        const errorDesconocido = () => fun.toastError('Error <strong>desconocido</strong>, favor llamar a soporte de<br/><strong>Novac System</strong>', 'ERROR');

        if (fun.isEmpty(response.error)) {
          errorDesconocido();
        } else if (response.error && fun.objHas(response.error, 'action') && response.error.action == 'close_session') {
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@");

          fun.toastError(response.error.msg, 'ERROR');
          this.zone.runOutsideAngular(() => this.sharedServ.nextCanToast(false));
          fun.logout();
        } else {
          if (fun.objHas(response, 'status') && response.status == 404 && fun.hasValue(response?.error?.msg)) {
            console.log('1');

            this.handler_msg(response.error.msg, 'warning');
          } else if (fun.objHas(response, 'error.msg')) {
            console.log('2');
            this.handler_msg(response.error.msg, 'error');
          } else {
            console.log('3');
            errorDesconocido();
          }
        }

        return throwError(response);
      }),
      finalize(() => {
        this.endRequest(spinner);
      })
    );
  }

  private logHttpPerf(type: 'request' | 'response' | 'error', payload: any) {
    console.log(
      JSON.stringify({
        tag: 'NOVAC_HTTP_PERF',
        type,
        timestamp: new Date().toISOString(),
        ...payload,
      })
    );
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
