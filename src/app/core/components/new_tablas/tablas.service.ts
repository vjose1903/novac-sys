import { Injectable } from '@angular/core';
import { default_per_page, paginateI, table_config, table_info, transformType } from './tabla-class';
import { fun } from '@core/services/functions.service';
import { DateUtils } from '@vjose1903/dateutils';

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
    if (!this.obj_paginate[id]) this.obj_paginate[id] = fun.deepCloning(this.obj_paginate.default);

    params.forEach(param => {
      const key = Object.keys(param)[0];
      const value = param[key];

      // Validar que el valor no sea null o inválido
      if (value === null || value === undefined) {
        return; // Saltar este parámetro
      }

      this.obj_paginate[id][key] = value;

      if (key == 'page') {
        const pageFromCero = value > 0 ? value - 1 : value;
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

  disabledInput(params: { dato: any; column: table_info; config?: any; seleccionado: any; all_data: any }) {
    const { dato, column, config, seleccionado, all_data } = params;
    // Si la columna no tiene configuración de disable, retornamos false
    if (!fun.objHas(column, 'disable')) {
      return false;
    }

    // Si el config tiene read=true, retornamos true inmediatamente || Verificar si está configurado como siempre deshabilitado
    if ((fun.hasValue(config.read) && config.read) || column.disable.some(conf => conf.kind === 'always')) {
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
      const global = fun.hasValue(element?.global) ? element.global : false;
      const is_equal = element?.type == 'equal' || !('type' in element);

      const getSourceValue = item => {
        if (fun.hasValue(element.source)) {
          return fun.getProperty(item, element.source);
        } else if (fun.hasValue(column.key_value)) {
          return fun.getProperty(item, column.key_value);
        } else {
          return fun.getProperty(item, column.key);
        }
      };

      const source_value = getSourceValue(dato);
      const target_value = fun.getProperty(dato, element.target);

      let transformedSourceValue = element.transform ? transformValue(source_value, element.transform) : source_value;
      let transformedTargetValue = element.transform ? transformValue(target_value, element.transform) : target_value;

      switch (element.kind) {
        case 'has_value':
          return fun.hasValue(transformedTargetValue);
        case 'compare':
          if (global) {
            return all_data.some(item => {
              const source_value = getSourceValue(item);
              const target_value = fun.getProperty(item, element.target);
              const transformed_source_value = element.transform ? transformValue(source_value, element.transform) : source_value;
              const transformed_target_value = element.transform ? transformValue(target_value, element.transform) : target_value;

              return is_equal ? transformed_source_value == transformed_target_value : transformed_source_value != transformed_target_value;
            });
          } else {
            return is_equal ? transformedSourceValue == transformedTargetValue : transformedSourceValue != transformedTargetValue;
          }
        case 'campo':
          if (fun.isEmpty(element.value)) {
            return !transformedTargetValue;
          } else {
            if (global) {
              return all_data.some(item => {
                const target_value = fun.getProperty(item, element.target);
                const transformed_target_value = element.transform ? transformValue(target_value, element.transform) : target_value;

                if (is_equal) {
                  return element.value.some(value => value == transformed_target_value);
                } else {
                  return element.value.some(value => value != transformed_target_value);
                }
              });
            } else {
              if (is_equal) {
                return element.value.some(value => value == transformedTargetValue);
              } else {
                return element.value.some(value => value != transformedTargetValue);
              }
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
