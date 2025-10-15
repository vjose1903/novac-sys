import { Ss } from '@core/services/singleton.service';
import { DateUtils } from '@vjose1903/dateutils';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Input, Output, EventEmitter, OnChanges, OnDestroy, NgZone, HostListener, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TablasService } from './tablas.service';
import { fun } from '@core/services/functions.service';
import { tableCellType, rowDataDividerKey, medidas, table_config, table_info, btnTableI } from './tabla-class';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { teclasCode } from '@core/typescript/constantes';
import * as _ from 'lodash';

import { ResizeEvent } from '@core/directive/element-resized.directive';

@Component({
  selector: 'dinamic-table',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
  standalone: false,
})
export class NewTablasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  ready = false;

  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    if (!this.tServ.blockRowMovement && this.config.focusRow && this.ready) {
      const key = event.keyCode;

      if (key == teclasCode._arriba) this.mover_foco('up');
      else if (key == teclasCode._abajo) this.mover_foco('down');
      else if (key == teclasCode._enter) this.ENTER(this.row_id);
    }
  }

  row_id;
  actualRowIndex = 0;
  copyData: any;
  tableCellType = tableCellType;
  seleccionado_id: any;
  altoTabla;
  altoTbody;

  @Input() TablasComponent: any = undefined;
  @Input() emptyMessage;
  @Output() TablasComponentChange = new EventEmitter<any>();

  @Input() cardTabla;

  @Input() print_log = false;
  @Input() seleccionado: any;
  @Input() data: any;
  @Input() post_id: any = '';
  @Input() config: table_config = { padre_functions: null };

  // output
  @Output() table_events = new EventEmitter<any>();
  @Output() dataChange = new EventEmitter<any>();

  cantPagesView: number = 5;
  private destroy$ = new Subject<void>();

  fun = fun;

  realIdTabla;

  dynamicTooltipEntities = {
    cantidades: { key: 'cantidades', sub_key: null, pluralize: true, order: 'cantidad-medida' },
    precio: { key: 'costos', sub_key: 'precio', pluralize: false, order: 'medida-cantidad' },
    costo: { key: 'costos', sub_key: 'costo', pluralize: false, order: 'medida-cantidad' },
  };

  htmlServ = inject(HtmlElementsService);
  tServ = inject(TablasService);
  zone = inject(NgZone);
  cdRef = inject(ChangeDetectorRef);

  constructor() {}

  formatoNumero(num) {
    let numformat = '0.00';
    if (num) numformat = fun.roundNumberToDecimal(num);
    return numformat;
  }

  ngOnInit() {
    this.realIdTabla = this.config.id_tabla + this.post_id;

    new fun().getWindowSize.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) {
        requestAnimationFrame(() => {
          this.setCantPagView(res.innerWidth, 'width_page');
        });
      }
    });

    this.updateTablasComponent();

    this.row_id = `row-${this.realIdTabla}-${this.actualRowIndex}`;

    fun.setTimeout(() => {
      this.ready = true;
    }, 250);
  }

  ngAfterViewInit() {
    this.changeStylesTitles();
    this.handleConfig();
  }

  ngOnDestroy() {
    if (this.destroy$) this.destroy$.next();
    if (this.destroy$) this.destroy$.complete();

    this.tServ.deletePaginationById(this.realIdTabla);
    this.tServ.resetRowEditing();
  }

  handleConfig() {
    fun.setTimeout(() => {
      if (!this.config.padding) this.config.padding = '0rem';
      if (!fun.objHas(this.config, 'redondo')) this.config.redondo = true;
      if (fun.objHas(this.config, 'filtrar') && !fun.objHas(this.config, 'filtrar.show')) this.config.filtrar.show = true;
      if (fun.objHas(this.config, 'obj_paginate') && !fun.objHas(this.config, 'obj_paginate.showDropDown')) this.config.obj_paginate.showDropDown = true;
      if (!fun.objHas(this.config, 'colorTitulo')) this.config.colorTitulo = true;
      if (!this.config.filterTargets) this.config.filterTargets = this.config.info.map(info => Object.values(fun.pick(info, ['key']))[0]);

      if (fun.objHas(this.config, 'obj_paginate') && fun.hasValue(this.config.obj_paginate)) {
        if (fun.objHas(this.config, 'obj_paginate') && !fun.objHas(this.config.obj_paginate, 'page')) this.config.obj_paginate.page = this.tServ.obj_paginate.default.page;
        if (fun.objHas(this.config, 'obj_paginate') && !fun.objHas(this.config.obj_paginate, 'page_front')) this.config.obj_paginate.page_front = this.tServ.obj_paginate.default.page_front;
        if (fun.objHas(this.config, 'obj_paginate') && !fun.objHas(this.config.obj_paginate, 'per_page')) this.config.obj_paginate.per_page = this.tServ.obj_paginate.default.per_page;
        if (fun.objHas(this.config, 'obj_paginate') && !fun.objHas(this.config.obj_paginate, 'search')) this.config.obj_paginate.search = this.tServ.obj_paginate.default.search;
        if (fun.objHas(this.config, 'obj_paginate') && !fun.objHas(this.config.obj_paginate, 'per_page_options')) this.config.obj_paginate.per_page_options = this.tServ.obj_paginate.default.per_page_options;
      }

      this.verifyButtons(this.config);

      this.tServ.initPagination(this.realIdTabla, this.config.obj_paginate || fun.deepCloning(this.tServ.obj_paginate.default));

      if ('focusSearchInput' in this.config && this.config.focusSearchInput) {
        fun.setTimeout(() => {
          fun.enfocarInput(`search-${this.realIdTabla}`);
        }, 100);
      }

      this.config.info.map(item => {
        if (!fun.objHas(item, 'titulo_sm')) item.titulo_sm = item.titulo;
      });
    }, 0);
  }

  verifyButtons(config: table_config) {
    const verifyId = (btn: btnTableI) => (btn.btnId ??= `${fun.generateKey()}-${btn.icon}`);

    if (config.botones) {
      for (const key in config.botones) {
        const btnObj = config.botones[key];

        if (Array.isArray(btnObj)) {
          btnObj.forEach(btn => verifyId(btn));
        } else {
          verifyId(btnObj);
        }
      }
    }

    config.info.forEach(info => {
      if (fun.hasValue(info?.iconsArray)) info.iconsArray.forEach(icon => (icon.id ??= `${fun.generateKey()}-${icon.key}`));
    });
  }

  changeTableConfig(array) {
    this.zone.run(() => {
      array.forEach(element => {
        const key = Object.keys(element)[0];
        this.config[key] = element[key];
      });
    });
  }

  getValueForm(column: table_info, data) {
    const value = fun.getProperty(data, column.key);

    const evaluar_value = item => (fun.hasValue(column.capitalice) ? fun.capitalice(item) : item);

    switch (column.tipo) {
      case 'textList':
        return value.reduce((acumulado, item) => {
          const value = fun.getProperty(item, column.key_value);

          return acumulado + `${acumulado.length ? ',' : ''}  ${evaluar_value(value)}`;
        }, '');

      case 'formatoNumero':
        if ('tachado' in column && column.tachado) {
          const can_take_negativos = column.acepta_negativos ? true : value > 0;
          return fun.hasValue(value) && can_take_negativos ? this.formatoNumero(value) : '-';
        } else {
          return this.formatoNumero(value);
        }

      case 'date':
        const fecha = DateUtils.format({ date: fun.getProperty(data, column.key), dateFormat: fun.hasValue(column.dateFormat) ? column.dateFormat : 'DD/MM/YYYY', include_hour: column.include_hour });
        return fecha;

      default:
        return evaluar_value(value);
    }
  }

  getComponent(rowData: any, column: table_info): any {
    return column.rowTransform?.component && typeof column.rowTransform?.component == 'function' ? column.rowTransform?.component(rowData) : null;
  }

  getComponentInputs(rowData: any, column: table_info): { [key: string]: any } {
    const baseInputs = { rowData, column, allData: this.data };
    return { ...baseInputs, ...(column.rowTransform?.inputs || {}) };
  }

  checkBackgroundTr(params: { tipo: string; dato: any }) {
    let res = false;
    if (fun.objHas(params.dato, params.tipo)) res = fun.getProperty(params.dato, params.tipo);

    return res;
    // dato?.danger && config?.colores;
  }

  checkHasClickFuntion(column, dato, i, e) {
    const obj = { id_tabla: this.realIdTabla, index: i, data: dato, column: column };
    if (column.click) {
      column.click(obj);
      e.stopPropagation();
    }
  }

  filter(event) {
    if ([teclasCode._abajo, teclasCode._arriba, teclasCode._izquierda, teclasCode._derecha, teclasCode._enter].includes(event.keyCode)) return;

    const search = event.target.value;

    if (fun.objHas(this.config, 'filtrar') && !this.config.filtrar.local) {
      fun.awaitTyping({ event }).then(() => {
        if (fun.objHas(this.config, 'padre_functions') && this.config.padre_functions?.data_request) {
          const actualPagination = this.tServ.getPaginationById(this.realIdTabla);

          if (fun.hasValue(search)) {
            if (fun.isEmpty(actualPagination.ant_page)) this.tServ.modifyPaginationById(this.realIdTabla, [{ ant_page: actualPagination.page }]);
            this.tServ.modifyPaginationById(this.realIdTabla, [{ page: 1 }]);
          } else if (fun.isEmpty(search) && fun.hasValue(actualPagination.ant_page)) {
            this.tServ.modifyPaginationById(this.realIdTabla, [{ page: actualPagination.ant_page }]);
            this.tServ.modifyPaginationById(this.realIdTabla, [{ ant_page: null }]);
          }

          this.config.padre_functions.data_request({ per_page: actualPagination.per_page, page: actualPagination.page, search: search });
        } else {
          fun.logRed('----- Debe de especificar en la configuracion de la tabla cual es la funcion para pedir la data ----- ');
        }
      });
    }

    this.tServ.modifyPaginationById(this.realIdTabla, [{ search: search }]);
  }

  sort(row) {
    if (fun.hasValue(row?.sort)) {
      const { key, order } = row.sort;
      let newOrder = null;
      order == null ? (newOrder = 'asc') : order == 'asc' ? (newOrder = 'desc') : (newOrder = null);
      row.sort.order = newOrder;

      const actualPagination = this.tServ.getPaginationById(this.realIdTabla);
      this.config.padre_functions.data_request({ per_page: actualPagination.per_page, page: actualPagination.page, search: actualPagination.search });
    }
  }

  getPaginatorPageByNumber(number) {
    let paginatorPage = undefined;
    const paginator = document.getElementById(`paginator-${this.realIdTabla}`);

    if (paginator) {
      const paginator_pages = document.getElementsByClassName('p-paginator-pages');
      const children = Array.from(paginator_pages[0]?.children || []);
      paginatorPage = children.find(child => (child as HTMLElement).outerText === `${number || 1}`);
    }
    return paginatorPage;
  }

  paginatorChange(event, id) {
    fun.setTimeout(() => {
      this.zone.run(() => {
        const page = event.page + 1;
        const per_page = event.rows;
        const actualPagination = this.tServ.getPaginationById(this.realIdTabla);

        const actualPage = this.tServ.getPaginatorPageByNumber(page, `paginator-${this.realIdTabla}`);

        const clickeado_por = actualPage?.getAttribute('clickeado_por');

        if (fun.hasValue(actualPagination) && (page != actualPagination.page || per_page != actualPagination.per_page) && (fun.isEmpty(clickeado_por) || clickeado_por != 'maquina')) {
          this.tServ.modifyPaginationById(id, [{ page: page }, { per_page: per_page }, { per_page_options: actualPagination.per_page_options }, { is_local: actualPagination.is_local }]);

          if (actualPagination.is_local) {
            this.localPagination(page, per_page);
          } else {
            if (fun.objHas(this.config, 'padre_functions') && this.config.padre_functions?.data_request) {
              this.config.padre_functions.data_request({ per_page: per_page, page: page, search: null });
            } else {
              fun.logRed('----- Debe de especificar en la configuracion de la tabla cual es la funcion para pedir la data ----- ');
            }
          }
        }

        Ss.cdRef.detectChanges();
        this.handle_table_events('paginatorChange', { page, per_page, data: this.data });
      });
    }, 150);
  }

  test() {
    console.log('paginator --> ', fun.deepCloning(this.tServ.getPaginationById(this.realIdTabla)));
  }

  reloadPagination() {
    this.localPagination(this.config.obj_paginate.page, this.config.obj_paginate.per_page);
  }

  localPagination(page, per_page) {
    const copyData = fun.deepCloning(this.copyData);

    // Validar que page y per_page sean válidos
    if (!page || page <= 0 || !per_page || per_page <= 0) {
      page = this.tServ.obj_paginate.default.page;
      per_page = this.tServ.obj_paginate.default.per_page;
    }

    const inicio = (page - 1) * per_page;
    const final = inicio + per_page;

    let dataParsed = copyData.slice(inicio, final);

    dataParsed = dataParsed.map(item => {
      const key = this.config.obj_paginate?.key ?? 'id';

      const previousItem = this.data.find(data => data[key] == item[key]);
      if (fun.hasValue(previousItem)) {
        item = previousItem;
      }

      return item;
    });

    this.data.length = 0;
    dataParsed.forEach(dato => this.data.push(dato));
  }

  dataLocalFilter(newData) {
    this.data.length = 0;
    newData.forEach(dato => this.data.push(dato));
    const id = this.realIdTabla;
    const actualPagination = this.tServ.getPaginationById(id);

    let new_obj_pagination = { ant_page: null, page: null };

    if (fun.hasValue(actualPagination) && actualPagination.show) {
      if (fun.isEmpty(actualPagination['ant_page'])) {
        new_obj_pagination = { ant_page: actualPagination.page, page: 1 };
      } else {
        if (fun.isEqual(this.data, this.copyData)) new_obj_pagination = { page: actualPagination.ant_page, ant_page: null };
      }

      for (const key in new_obj_pagination) {
        const element = {};
        element[key] = new_obj_pagination[key];

        this.tServ.modifyPaginationById(id, [element]);
      }
    }
  }

  divPaginatorChangeWidth(event: ResizeEvent) {
    requestAnimationFrame(() => {
      this.setCantPagView(event.width, 'width_paginator');
    });
  }

  setCantPagView(width, tipo) {
    let actual = 1;
    const actualPagination = this.tServ.getPaginationById(this.realIdTabla);

    if (tipo == 'width_page') {
      const divPaginator = document.getElementById('divPaginator');
      if (divPaginator) width = divPaginator.offsetWidth;
    }

    if (width > 600) actual = 5;
    else if (width <= 600 && width > 500) actual = 4;
    else if (width <= 500 && width > 400) actual = 3;
    else if (width <= 400 && width > 300) actual = 2;
    else if (width <= 300) actual = 1;

    const actualPage = this.tServ.getPaginatorPageByNumber(actualPagination?.page, `paginator-${this.realIdTabla}`);

    fun.setTimeout(() => {
      this.zone.run(() => {
        if (actualPage) {
          actualPage.setAttribute('clickeado_por', 'maquina');
          actualPage.click();
          fun.setTimeout(() => {
            actualPage.removeAttribute('clickeado_por');
          }, 2000);
        }

        this.cantPagesView = actual;
      });
    }, 100);
  }

  getColor(myColor) {
    return this.tServ.getColor(myColor);
  }

  changeBackGroundColor(dato) {
    const backgroundConfig = this.config.backgroundColor;
    let res = '#00000000';
    if (fun.objHas(this.config, 'backgroundColor') && fun.hasValue(this.config.backgroundColor)) {
      let temp_res = false;
      for (let i = 0; i < backgroundConfig.length; i++) {
        const backConfig = backgroundConfig[i];

        if (backConfig.some(conf => conf.kind === 'selected') && fun.hasValue(this.seleccionado)) temp_res = Number(dato.id) !== Number(this.seleccionado || 0);

        if (!temp_res && backConfig.kind === 'campo') {
          if (backConfig.value.length === 0) temp_res = dato[backConfig.target];
          else temp_res = backConfig.value.some(value => value == dato[backConfig.target]);
        }

        if (temp_res) res = backConfig.color;
      }
    }

    return res;
  }

  verificateColspan(data) {
    let colSpan = null;

    if (rowDataDividerKey in data && data[rowDataDividerKey]) {
      colSpan = this.config.info.length;
      if ('botones' in this.config && fun.hasValue(this.config.botones)) colSpan += 1;
    }

    return colSpan;
  }

  verificateIsDivider(data) {
    return rowDataDividerKey in data && data[rowDataDividerKey];
  }

  changeStylesTitles() {
    for (let i = 0; i < this.config.info.length; i++) {
      const info: table_info = this.config.info[i];

      let list_estilos_titulos = '';
      if (info.estilos && info.estilos.length > 0) {
        for (let j = 0; j < info.estilos.length; j++) {
          const estilos = info.estilos[j];
          const key = Object.keys(estilos)[0];
          const value = Object.values(estilos)[0];

          list_estilos_titulos += `${key}: ${value} !important; `;
        }
      }

      if (fun.hasValue(list_estilos_titulos)) {
        const columna = document.getElementById(`titulo_${this.realIdTabla}_${info.key}`) as any;
        if (columna) columna.setAttribute('style', list_estilos_titulos);
      }
    }
  }

  changeValorSelectAll(info) {
    // this.data.forEach((data, index) => {
    //   if ((this.select_all_value && !data.select) || (!this.select_all_value && data.select)) this.changeValorCheck('select', index);
    // });
  }

  are_all_selected(info) {
    return true;
  }

  checkNumber(input, column, index_body) {
    if (column.checkNumber) {
      const id = `input-${this.realIdTabla}-${column.key}-${this.getIndex(index_body)}`;
      fun.revisarNumber(input, id).then(res => {
        if (!res.error && column.inputEvents != 'formatoNumero') {
          input.value = fun.is_number(input.value) ? res.number : null;
        }
      });
    }
  }

  handleInputsEvents(type, input, column, index_body, data) {
    if (fun.objHas(column, 'inputEvents') && fun.hasValue(column.inputEvents)) {
      if (column.inputEvents == 'formatoNumero') {
        if (type == 'focus') {
          input.value = fun.is_number(input.value) ? fun.desformatearStNumber(input.value) : null;
          input.select();
        }
        if (type == 'blur') {
          input.value = fun.is_number(input.value) ? fun.roundNumberToDecimal(input.value) : null;
          if (fun.isEmpty(input.value)) fun.enfocarInput(input.id);
        }
      }
    }

    const obj = { column, data, index: index_body, id_tabla: this.realIdTabla };
    this.handle_table_events(type == 'blur' ? 'inputBlur' : 'inputFocus', obj);
  }

  changeValorInput(event, column, key, index, value, data) {
    fun.awaitTyping({ event, waitingTime: 250 }).then(() => {
      let newData = fun.deepCloning(this.tServ.rowsEditing.find(item => item.id == data.id));

      if (fun.isEmpty(newData) || this.tServ.rowsEditing.length == 0) newData = fun.deepCloning(data);

      fun.setProperty(newData, key, value);

      this.tServ.modifyRowsEditing(newData, 'add');

      const obj = { data, newData, index, key, value, id_tabla: this.realIdTabla };
      this.handle_table_events('inputChange', obj);
    });
  }

  updateDataCopy(data) {
    if (!data) return;

    this.copyData = fun.deepCloning(data);

    if (fun.hasValue(this.config.obj_paginate) && this.config.obj_paginate.is_local) {
      this.changeTableConfig([{ total_count: data.length }]);
      this.localPagination(this.config.obj_paginate.page, this.config.obj_paginate.per_page);
    }
  }

  ngOnChanges(change) {
    if (change.data && change.data.currentValue) {
      this.updateDataCopy(this.data);

      // ================================================
      // CUSTOM STYLES
      // ================================================
      fun.setTimeout(() => {
        this.changeStylesTitles();
      }, 0);

      // ================================================

      this.updateTablasComponent();
    }
  }

  updateTablasComponent() {
    requestAnimationFrame(() => {
      this.TablasComponent = this;
      this.TablasComponentChange.emit(this.TablasComponent);
      this.cdRef.detectChanges();
    });
  }

  formatQuantityString(valor: number, medida: string, order: string): string {
    const cantidad = fun.roundNumberToDecimal(valor);

    if (order === 'cantidad-medida') {
      return `${cantidad} ${medida}`;
    } else if (order === 'medida-cantidad') {
      return `${medida} ${cantidad}`;
    }

    // Por defecto retorna cantidad-medida
    return `${cantidad} ${medida}`;
  }

  quantityTooltip(dato, column) {
    if (dato.tipo_articulo.tipo === 'servicio') return null;

    const { key, pluralize, order, sub_key } = this.dynamicTooltipEntities[column.key];
    const objeto = dato[key];
    const keys = Object.keys(objeto);

    if (keys.length <= 1) return '';

    const processKey = (keyIndex: number) => {
      const key = keys[keyIndex];
      const valor = fun.hasValue(sub_key) ? objeto[key][sub_key] : objeto[key];
      const medida = valor > 1 && pluralize ? fun.to_plural(key) : key;
      return this.formatQuantityString(valor, medida, order);
    };

    const items = [];
    if (keys.length >= 2) items.push(processKey(1)); // padre
    if (keys.length >= 3) items.push(processKey(2)); // hijo

    return items.length > 0 ? `<ul class="m-0 ps-3">${items.map(item => `<li>${item}</li>`).join('')}</ul>` : '';
  }

  quantityLabel(dato, column) {
    if (dato.tipo_articulo.tipo === 'servicio') return 'N/A';

    const { key, pluralize, order, sub_key } = this.dynamicTooltipEntities[column.key];
    const objeto = dato[key];
    const keys = Object.keys(objeto);

    if (keys.length === 0) return 'N/A';

    const firstKey = keys[0];
    const valor = fun.hasValue(sub_key) ? objeto[firstKey][sub_key] : objeto[firstKey];
    const medida = valor > 1 && pluralize ? fun.to_plural(firstKey) : firstKey;

    return this.formatQuantityString(valor, medida, order);
  }

  disableInput(dato, column) {
    return this.tServ.disabledInput({ dato: dato, column: column, config: this.config, seleccionado: this.seleccionado, all_data: this.data });
  }

  showIcon(objIcon, data) {
    let res = false;

    if (fun.objHas(objIcon, 'showCondition')) {
      for (let i = 0; i < objIcon.showCondition.length; i++) {
        const conditionObj = objIcon.showCondition[i];

        if (objIcon.showCondition.some(conf => conf.kind === 'selected')) {
          const is_selected = data.id == (this.seleccionado || 0);
          res = conditionObj.value == is_selected;
        }

        if (res) break;

        if (conditionObj.kind === 'campo') {
          if (conditionObj.value.length == 0) res = data[conditionObj.target] ? false : true;
          else res = conditionObj.value.some(value => value == data[conditionObj.target]);
        }
      }
    } else {
      res = true;
    }
    return res;
  }

  getIndex(index) {
    const pageIndex = (this.config?.obj_paginate?.page - 1) * this.config?.obj_paginate?.per_page + index;

    const validate = fun.isEmpty(this.data[pageIndex]);

    return validate ? index : pageIndex;
  }

  resetInput(key, referencia, index, formatear, especifico?) {
    const id = `input-${this.realIdTabla}-${key}-${this.getIndex(index)}`;
    const input = document.getElementById(id);

    if (referencia === 'especificar') {
      input['value'] = especifico;
    } else {
      const copia = fun.deepCloning(this.data[index][referencia]);

      if (formatear) {
        input['value'] = fun.roundNumberToDecimal(copia);
      } else {
        input['value'] = copia;
      }
    }
  }

  changeValorCheck(dato, column, index) {
    const is_disable = this.tServ.disabledInput({ dato: dato, column: column, config: this.config, seleccionado: this.seleccionado, all_data: this.data });

    if (!is_disable) {
      const key = column.key;
      dato[key] = !dato[key];

      const obj = { data: dato, index: index, key: key, value: dato[key], id_tabla: this.realIdTabla };
      this.handle_table_events('inputChange', obj);
    }
  }

  getDropPlaceholder(placeholder) {
    return placeholder ? placeholder : 'seleccione';
  }

  functionsBtnDinamic(params) {
    if (fun.objHas(this.config, 'padre_functions') && this.config.padre_functions?.handleBtnsDinamic) {
      this.config.padre_functions.handleBtnsDinamic(params);
    } else {
      fun.logRed('----- Debe de implementar la funcion handleBtnsDinamic en el componente padre de la tabla ----');
    }
  }

  clickROW(data, index) {
    const has_inputs = this.config.info.some((info: any) => info.tipo == 'input');

    const obj = { data, index, id_tabla: this.realIdTabla };
    this.handle_table_events('clickRow', obj);
  }

  iconsClick(event) {
    const obj = event.arg;

    this.handle_table_events(event.type, obj);
  }

  handle_table_events(type, arg) {
    this.table_events.emit({ type: type, info: arg, id_tabla: this.realIdTabla });
  }

  // ========================================================================
  //  FUNCIONES DE LAS TECLAS DE LAS FECHAS
  // ========================================================================

  mover_foco(direccion: 'up' | 'down') {
    if (direccion == 'up') {
      if (this.actualRowIndex == 0) this.actualRowIndex = this.data.length - 1;
      else this.actualRowIndex = this.actualRowIndex - 1;
    }
    if (direccion == 'down') {
      if (this.actualRowIndex == this.data.length - 1) this.actualRowIndex = 0;
      else this.actualRowIndex = this.actualRowIndex + 1;
    }
    this.row_id = `row-${this.realIdTabla}-${this.actualRowIndex}`;

    fun.scrollTo({ id: this.row_id, behavior: 'smooth', block: 'center', inline: 'center' });
    fun.enfocarInput(this.row_id);
  }

  ENTER(arg) {
    const element = document.getElementById(arg) as any;
    if (element) requestAnimationFrame(() => element.click());
  }
}
