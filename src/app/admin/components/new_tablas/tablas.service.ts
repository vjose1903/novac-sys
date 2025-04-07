import { Injectable } from '@angular/core';
import { fun } from '../../../core/services/functions.service';
import { default_per_page, paginateI, table_config, table_info, transformType } from './tabla-class';
import { DateUtils } from '../../../core/typescript/date.utils';

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
      const key = Object.keys(param)[0];

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
    const color = myColor.replace('#', '');
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

  disabledInput(params: { dato: any; column: table_info; config?: any; seleccionado: any }) {
    const { dato, column, config, seleccionado } = params;

    // Si la columna no tiene configuración de disable, retornamos false
    if (!fun.objHas(column, 'disable')) {
      return false;
    }

    // Si el config tiene read=true, retornamos true inmediatamente || Verificar si está configurado como siempre deshabilitado
    if ((fun.hasValue(params?.config?.read) && params?.config?.read) || column.disable.some(conf => conf.kind === 'always')) {
      return true;
    }

    // Verificar si está seleccionado
    if (column.disable.some(conf => conf.kind === 'selected')) {
      return Number(dato.id) !== Number(seleccionado || 0);
    }

    // Función auxiliar para transformar valores
    const transformValue = (value: any, type: transformType): any => {
      switch (type) {
        case transformType.number:
          return fun.desformatearStNumber(value);
        case transformType.date:
          return DateUtils.format({ date: value, dateFormat: 'YYYY-MM-DD' });
        case transformType.boolean:
          return value == 'true';
        case transformType.text:
          return value.toString();
        default:
          return value;
      }
    };

    // Evaluar cada regla de deshabilitación
    return column.disable.some(element => {
      const source_value = fun.hasValue(element.source) ? dato[element.source] : fun.hasValue(column.key_value) ? dato[column.key_value] : dato[column.key];
      const target_value = dato[element.target];

      let transformedSourceValue = element.transform ? transformValue(source_value, element.transform) : source_value;
      let transformedTargetValue = element.transform ? transformValue(target_value, element.transform) : target_value;

      switch (element.kind) {
        case 'has_value':
          return fun.hasValue(transformedTargetValue);
        case 'compare':
          return element.type == 'equal' ? transformedSourceValue == transformedTargetValue : transformedSourceValue != transformedTargetValue;
        case 'campo':
          if (element.value.length == 0) {
            return !transformedTargetValue;
          } else {
            if (element.type == 'equal' || !('type' in element)) {
              return element.value.some(value => value == transformedTargetValue);
            } else {
              return element.value.some(value => value != transformedTargetValue);
            }
          }
        default:
          return false;
      }
    });
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
