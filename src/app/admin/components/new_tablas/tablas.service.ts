import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { fun } from '../../../core/services/functions.service';

@Injectable({
  providedIn: 'root',
})
export class TablasService {
  constructor() {}

  private alto = new BehaviorSubject<any>(undefined);
  ALTO = this.alto.asObservable();

  public obj_paginate = {
    default: {
      page: 1,
      limit: 10,
      per_page_options: [10, 15, 20, 30],
      search: ' ',
      is_local: false,
    },
  };

  setAltoTabla(nextValue) {
    this.alto.next(nextValue);
  }

  initPagination(id, params) {
    this.obj_paginate[id] = params;
  }

  getPaginationById(id) {
    return this.obj_paginate[id];
  }

  modifyPaginationById(id, params) {
    params.forEach((param) => {
      const key = _.keys(param)[0];

      this.obj_paginate[id][key] = param[key];
    });
  }

  deletePaginationById(id) {
    delete this.obj_paginate[id];
  }

  getColor(myColor) {
    const color = _.replace(myColor, '#', '');
    const oscuro = fun.darken(color, 20);

    const style = { background: `linear-gradient(145deg, ${myColor}, ${oscuro})` };
    return style;
  }
}
