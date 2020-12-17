import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export const DATATABLE = new BehaviorSubject<any>({});

export const  obj_paginate_default = {
  page: 1,
  per_page: 20,
  searchText: ' ',
};

@Injectable({
  providedIn: 'root',
})
export class TablasService {
  data;
  obj_paginate = {
    page: 1,
    per_page: 20,
    searchText: ' ',
  };
  private total_paginas = new BehaviorSubject<any>({
    tabla: 'tabla',
    total: 0,
  });

  TOTALPAGINAS = this.total_paginas.asObservable();
  constructor() {}

  setData(arg) {
    this.data = arg;
  }

  getDATA(): Observable<any> {
    return this.data;
  }

  Func_total_paginas(nextValue) {
    this.total_paginas.next(nextValue);
  }
}
