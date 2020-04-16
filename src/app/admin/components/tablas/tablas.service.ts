import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export const DATATABLE = new BehaviorSubject<any>({});
@Injectable({
  providedIn: 'root',
})
export class TablasService {
  data;
  constructor() {}

  setData(arg) {
    this.data = arg;
    // console.log('data seteada en el servicio', this.data);
  }

  getDATA(): Observable<any> {
    return this.data;
  }
}
