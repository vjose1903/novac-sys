import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
export const DATATABLE = new BehaviorSubject<any>({});
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { SingletonService } from '../../../core/services/singleton.service';
import { fun } from '../../../core/services/functions.service';

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

  Func_total_paginas(nextValue: { total: number; tabla: string }) {
    if (this.obj_paginate[nextValue.tabla] == undefined) this.initPagination(nextValue.tabla, this.obj_paginate.default);
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

  getPaginationByModal() {
    let modalPagination = undefined;
    for (const key in this.obj_paginate) {
      const element = this.obj_paginate[key];
      if (key != 'default') modalPagination = element;
    }
    return modalPagination;
  }

  initPagination(id, params) {
    if (fun.isEmpty(this.obj_paginate[id])) this.obj_paginate[id] = fun.duplicarJson(params);
  }

  getPaginationById(id) {
    if (fun.isEmpty(this.obj_paginate[id])) this.obj_paginate[id] = fun.duplicarJson(this.obj_paginate.default);

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
