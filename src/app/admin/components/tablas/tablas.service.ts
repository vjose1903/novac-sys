import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
export const DATATABLE = new BehaviorSubject<any>({});
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/services/GLOBAL';

@Injectable({
  providedIn: 'root',
})
export class TablasService {
  data;

  private total_paginas = new BehaviorSubject<any>({ tabla: 'tabla', total: 0 });

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

  public obj_paginate = {
    default: {
      page: 1,
      per_page: 20,
      per_page_options: [10, 15, 20, 30],
      searchText: ' ',
      is_local: false,
    },
  };

  initPagination(id, params) {
    this.obj_paginate[id] = GLOBAL.duplicarJson(params);
  }

  getPaginationById(id) {
    return this.obj_paginate[id];
  }

  modifyPaginationById(id, params) {
    return new Promise<any>((resolve) => {
      params.forEach((param) => {
        const key = _.keys(param)[0];

        this.obj_paginate[id][key] = param[key];
      });
      resolve(true);
    });
  }

  deletePaginationById(id) {
    delete this.obj_paginate[id];
  }
}
