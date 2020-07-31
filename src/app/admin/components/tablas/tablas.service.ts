import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export const DATATABLE = new BehaviorSubject<any>({});

export const obj_paginate = {
  page: 1,
  per_page: 10,
  searchText: '',
};
@Injectable({
  providedIn: 'root',
})
export class TablasService {
  data;
  private total_paginas = new BehaviorSubject<any>(0);

  TOTALPAGINAS = this.total_paginas.asObservable();
  constructor() {}

  setData(arg) {
    this.data = arg;
    // console.log('data seteada en el servicio', this.data);
  }

  getDATA(): Observable<any> {
    return this.data;
  }

  Func_total_paginas(nextValue) {
    this.total_paginas.next(nextValue);
  }
}
