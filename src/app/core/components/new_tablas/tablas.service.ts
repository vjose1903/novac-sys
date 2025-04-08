import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { fun } from '@core/services/functions.service';
import { default_per_page, paginateI, table_config } from './tabla-class';

@Injectable({
  providedIn: 'root',
})
export class TablasService {
  constructor() {}
  rowsEditing = [];

  public obj_paginate = {
    default: {
      ant_page: null,
      page: 1,
      page_front: 0,
      per_page: 20,
      per_page_options: default_per_page,
      search: ' ',
      is_local: false,
    },
  };

  blockRowMovement = false;

  parseSort(table_config: table_config) {
    const sort: { order_by?: string } = {};
    const order_by = [];

    table_config.info.forEach(info => {
      if (fun.hasValue(info.sort) && fun.hasValue(info.sort.order)) {
        order_by.push(`${info.sort.key}:${info.sort.order}`);
      }
    });

    if (order_by.length > 0) {
      sort.order_by = order_by.join(',');
    }

    return sort;
  }

  initPagination(id, params?: paginateI) {
    return new Promise<void>((resolve, reject) => {
      params ??= fun.deepCloning(this.obj_paginate);
      if (this.obj_paginate[id] == undefined) this.obj_paginate[id] = params;
      resolve();
    });
  }

  getPaginationById(id): paginateI {
    return this.obj_paginate[id];
  }

  modifyPaginationById(id, params: Array<paginateI>) {
    params.forEach(param => {
      const key = _.keys(param)[0];

      this.obj_paginate[id][key] = param[key];

      if (key == 'page') {
        const pageFromCero = param[key] > 0 ? param[key] - 1 : param[key];
        this.obj_paginate[id].page_front = pageFromCero * this.obj_paginate[id].per_page;
      }
    });
  }

  resetRowEditing() {
    this.rowsEditing = [];
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

      const is_some_editing = params.listado.some(item => item.is_editing);
      res.can_edit = !is_some_editing;
      resolve(res);
    });
  }

  disabledInput(params: { dato: any; column: any; config?: any; seleccionado: any }) {
    let res = false;

    if (fun.objHas(params.column, 'disable')) {
      let temp_res = false;

      for (let i = 0; i < params.column.disable.length; i++) {
        const element = params.column.disable[i];

        if (params.column.disable.some(conf => conf.kind === 'always')) temp_res = true;

        if (temp_res) break;

        if (params.column.disable.some(conf => conf.kind === 'selected')) temp_res = Number(params.dato.id) !== Number(params.seleccionado || 0);

        if (temp_res) break;

        if (element.kind == 'has_value') {
          temp_res = fun.hasValue(params.dato[element.target]);
        }

        if (temp_res) break;

        if (element.kind == 'campo') {
          if (element.value.length == 0) temp_res = params.dato[element.target] ? false : true;
          else temp_res = element.value.some(value => value == params.dato[element.target]);
        }
      }
      res = temp_res;
    }

    return fun.hasValue(params?.config?.read) && params?.config?.read ? true : res;
  }

  modifyRowsEditing(newData, kind: 'add' | 'remove') {
    return new Promise<any>((resolve, reject) => {
      newData = fun.deepCloning(newData);
      const row_editing = this.rowsEditing.find(item => item.id == newData.id);

      const index_editing = this.rowsEditing.findIndex(row_edit => row_edit.id == row_editing?.id);

      if (kind == 'add') {
        if (fun.hasValue(row_editing)) {
          Object.assign(row_editing, newData);
        } else {
          this.rowsEditing.push(newData);
        }
      }

      if (kind == 'remove') {
        if (fun.hasValue(row_editing) && index_editing != -1) fun.pullAt(this.rowsEditing, index_editing);
      }

      resolve(true);
    });
  }

  mouseMoveEvent(event, row, column, id) {
    if (row.iconsMoveEvents) {
      row.iconsMoveEvents.forEach(moveEvent => {
        if (column === moveEvent.key) {
          if (event === 'hover') {
            for (let i = 0; i < moveEvent.hover.length; i++) {
              const overEvent = moveEvent.hover[i];
              fun.ModificarClass(id, moveEvent.leave[i], 'remove');
              fun.ModificarClass(id, overEvent, 'add');
            }
          } else {
            for (let i = 0; i < moveEvent.leave.length; i++) {
              const overEvent = moveEvent.leave[i];
              fun.ModificarClass(id, moveEvent.hover[i], 'remove');
              fun.ModificarClass(id, overEvent, 'add');
            }
          }
        }
      });
    }
  }

  getStyle(rowData, column, index, realIdTabla) {
    let styles = {};

    if (fun.hasValue(column?.style)) {
      Object.assign(styles, column.style);
    }

    if (fun.hasValue(rowData?.customStyles)) {
      const estilos = rowData.customStyles[column.key];

      if (Array.isArray(estilos)) {
        for (const item of estilos) {
          const startId = item.isTd ? 'td-' : '';

          const elemento = document.getElementById(`${startId}${realIdTabla}-${item.key}-${index}`);

          if (elemento) elemento.setAttribute('style', item.estilos);
        }
      } else {
        if (typeof estilos == 'object') {
          Object.assign(styles, estilos);
        }
      }
    }

    return styles;
  }
}
