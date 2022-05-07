import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { fun } from '../../../core/services/functions.service';
import { paginateI } from './tabla-class';

@Injectable({
  providedIn: 'root',
})
export class TablasService {
  constructor() {}

  public obj_paginate = {
    default: {
      ant_page: null,
      page: 1,
      per_page: 20,
      per_page_options: [10, 15, 20, 30],
      search: ' ',
      is_local: false,
    },
  };

  initPagination(id, params: paginateI) {
    if (this.obj_paginate[id] == undefined) this.obj_paginate[id] = params;
  }

  getPaginationById(id, quien?) {
    return this.obj_paginate[id];
  }

  modifyPaginationById(id, params: Array<paginateI>) {
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
