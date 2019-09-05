import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class SharedService {
  url = 'http://localhost:3000/api/usuarios';
  constructor(private http: HttpClient, private toastr: ToastrService, private router: Router) {}
  peticion(ruta: string, metodo: string, json?: string): Observable<any> {
    if (metodo === 'get' || metodo === 'delete') {
      return this.http[metodo](`${this.url}/${ruta}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.getAuthToken(),
          Accept: 'Application/json',
        },
      });
    } else {
      return this.http[metodo](`${this.url}/${ruta}`, json || '', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.getAuthToken(),
          Accept: 'Application/json',
        },
      });
    }
  }
  getAuthToken() {
    return localStorage.getItem('token') || '';
  }
  saveAuthUser(userInfo, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }

  login(arg): Observable<any> {
    return this.peticion('authenticate', 'post', arg).pipe(
      map(val => {
        if (val.resource && val.token) {
          this.saveAuthUser(val.resource, val.token);
          this.router.navigate(['/admin']);
        }
        return val;
      }),
    );
  }
}
