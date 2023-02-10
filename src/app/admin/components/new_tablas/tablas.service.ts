import { Injectable, ViewChild, ViewChildren } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { fun } from '../../../core/services/functions.service';
import { paginateI } from './tabla-class';
import { Paginator } from 'primeng/paginator';

@Injectable({
  providedIn: 'root',
})
export class TablasService {
  // @ViewChild('paginator', { static: true }) paginator: Paginator;

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

  modifyPaginationById(id, params: Array<paginateI>, tablaComponent) {
    params.forEach((param) => {
      const key = _.keys(param)[0];
      this.obj_paginate[id][key] = param[key];
      if (key == 'page') {
        const id_paginador = `paginator-${id + tablaComponent.post_id}`;
        // console.log('id_paginador ', id_paginador);
        tablaComponent.showPagination = false;

        setTimeout(() => (tablaComponent.showPagination = true), 100);

        // const paginator = document.getElementById(id_paginador) as unknown as Paginator;

        // paginator.changePage(Number(params[key]));

        // console.dir(paginator);
        // console.log('>>>>>>>>>>>>>>>> ', paginator);
      }
    });

    // console.log('this.obj_paginate ', this.obj_paginate);
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

  checkEditingRow(params: { listado: Array<any>; data: any }) {
    return new Promise<any>((resolve, reject) => {
      let res = { can_edit: false };

      const is_some_editing = params.listado.some((item) => item.is_editing);
      res.can_edit = !is_some_editing;
      resolve(res);
    });
  }
}
