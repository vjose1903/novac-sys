import { Injectable, NgZone } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { fun } from './functions.service';
import { SharedService } from './shared.service';

@Injectable()
export class InterceptorService implements HttpInterceptor {
  requestCount = 0;

  constructor(
    public loadServ: LoaderService,
    public sharedServ: SharedService,
    private zone: NgZone
  ) {}

  private startRequest(spinner?: string): void {
    if (this.requestCount <= 0 && spinner !== 'no_show') this.loadServ.isLoading.next(true);
    this.requestCount++;
  }

  private endRequest(spinner?: string): void {
    if (this.requestCount > 0 && spinner !== 'no_show') this.requestCount--;
    if (this.requestCount === 0 && spinner !== 'no_hide') this.loadServ.isLoading.next(false);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.zone.runOutsideAngular(() => this.sharedServ.nextCanToast(false));

    const token = fun.getAuthToken();
    const spinner = request.params.get('spinner');
    const showMsgs = request.params.get('msgs');
    const canShowMsg = showMsgs !== 'no_show';

    let sendParams = request.params;
    if (spinner) sendParams = sendParams.delete('spinner', spinner);
    if (showMsgs) sendParams = sendParams.delete('msgs', showMsgs);

    if (!spinner || spinner === 'no_hide') this.startRequest(spinner);

    if (token) {
      request = request.clone({
        setHeaders: {
          'access-token': localStorage.getItem('access-token') || '',
          client: localStorage.getItem('client') || '',
          expiry: localStorage.getItem('expiry') || '',
          uid: localStorage.getItem('uid') || '',
          'token-type': localStorage.getItem('token-type') || '',
        },
        params: sendParams,
      });
    }

    return next.handle(request).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          if (canShowMsg && fun.objHas(event, 'body.msg')) this.showMessages(event.body.msg, 'success');

          this.zone.runOutsideAngular(() => {
            ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach(header => {
              const headerValue = event.headers.get(header);
              if (fun.hasValue(headerValue) && fun.isEmpty(localStorage.getItem(header))) localStorage.setItem(header, headerValue || '');
            });
          });
        }

        this.zone.runOutsideAngular(() => this.sharedServ.nextCanToast(true));
        return event;
      }),

      catchError((response: HttpErrorResponse) => {
        console.log('%c response ', 'color: orange', response);

        if (response.status === 401) {
          const currentToken = fun.getAuthToken();
          fun.logout();

          if (currentToken && canShowMsg) {
            fun.toastError('Su sesión ha expirado, por favor inicie sesión nuevamente', 'SESIÓN EXPIRADA');
          }
          return throwError(response);
        }

        if (canShowMsg) this.handleError(response);

        return throwError(response);
      }),
      finalize(() => this.endRequest(spinner))
    );
  }

  private handleError(response: HttpErrorResponse): void {
    const errorDesconocido = () => fun.toastError('Error <strong>desconocido</strong>, favor llamar a soporte de<br/><strong>Novac System</strong>', 'ERROR');

    if (fun.isEmpty(response.error)) {
      errorDesconocido();
      return;
    }

    if (response.error?.action === 'close_session') {
      fun.toastError(response.error.msg, 'ERROR');
      this.zone.runOutsideAngular(() => this.sharedServ.nextCanToast(false));
      fun.logout();
      return;
    }

    if (response.status === 404 && fun.hasValue(response?.error?.msg)) {
      this.showMessages(response.error.msg, 'warning');
    } else if (fun.objHas(response, 'error.msg')) {
      this.showMessages(response.error.msg, 'error');
    } else {
      errorDesconocido();
    }
  }

  private showMessages(messages: string | string[], type: 'success' | 'warning' | 'error'): void {
    if (!messages) return;

    const msgArray = Array.isArray(messages) ? messages : [messages];
    const toastFn = { success: fun.toastSuccess, warning: fun.toastWarning, error: fun.toastError };
    const titles = { success: 'CORRECTO', warning: 'AVISO', error: 'ERROR' };

    msgArray.forEach(msg => toastFn[type](msg, titles[type]));
  }
}
