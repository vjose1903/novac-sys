import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, OnDestroy, NgZone } from '@angular/core';

import * as _ from 'lodash';
import { ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { TablasService } from './tablas.service';
import { fun } from '../../../core/services/functions.service';

export interface table_info {
  titulo?: string;
  titulo_sm?: string;
  tooltip?: string;
  key?: string;
  tipo?: string;
  tag_severity?: string;
  remplace?: any;
  data?: any;
  placeholder?: string;
  optionLabel?: any;
  optionValue?: any;
  estilos?: Array<any>;
  inputType?: string;
  rowTooltip?: string;
  alerta?: boolean;
  tag_color?: string;
  tag_apretada?: boolean;
  disable?: any;
  color?: string;
  text_color?: string;
  dateFormat?: any;
  hours?: any;
  src?: any;
  alt?: any;
  click?: Function;
  iconsArray?: Array<any>;
  key_value?: string;
}

interface obj_paginate {
  show: boolean;
  page?: number;
  per_page?: number;
  per_page_options?: Array<number>;
  search?: string;
  is_local?: boolean;
}

interface inner_btn {
  show: boolean;
  name?: string;
  tooltip?: string;
  tooltipKey?: string;
  permiso?: string;
  icon?: string;
}

export interface botonesTableI {
  dinamico?: Array<inner_btn>;
  borrar?: inner_btn;
  editar?: inner_btn;
  mostrar?: inner_btn;
}

interface padreFunctionsI {
  handleBtnsDinamic?: Function;
  data_request?: Function;
}

export interface table_config {
  padding?: string;
  padre_functions?: padreFunctionsI;
  colores?: Boolean;
  read?: Boolean;
  focusRow?: Boolean;
  extraCalculo?: Number;
  filtrar?: any;
  localFilter?: Boolean;
  filterTargets?: any;
  id?: String;
  id_tabla?: String;
  info?: Array<table_info>;
  data_request?: any;
  table_size?: 'sm';
  backgroundColor?: any;
  total_count?: any;
  obj_paginate?: obj_paginate;
  botones?: botonesTableI;
}

@Component({
  selector: 'dinamic-table',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class NewTablasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('dinamicTable', { static: false }) dinamicTable: ElementRef;

  IDROW = 'row-0';
  copyData: any;

  seleccionado_id: any;
  altoTabla;
  altoTbody;

  // @Input()  = 'tabla';

  @Input() TablasComponent;
  @Output() TablasComponentChange = new EventEmitter<any>();

  @Input() cardTabla;

  @Input() print_log = false;
  @Input() seleccionado: any;
  @Input() data = [];
  @Input() config: table_config = { padre_functions: null };

  // output
  @Output() table_events = new EventEmitter<any>();

  @Output() dataChange = new EventEmitter<any>();

  cantPagesView: number = 5;

  pagActual = 1;

  total_registros;
  tabla_content: HTMLElement;
  pageAfterFilter: any;

  sub: Subscription;
  subWidth: Subscription;

  fun = fun;
  rowEditing;

  constructor(public cdRef: ChangeDetectorRef, public tServ: TablasService, private zone: NgZone) {
    cdRef.detach();
    setInterval(() => this.cdRef.detectChanges(), 500);
  }

  formatoNumero(num) {
    let numformat = '0';
    if (num) numformat = fun.numFormatTwoDecimals(num);
    return numformat;
  }

  ngOnInit() {
    this.sub = this.tServ.ALTO.subscribe((res) => {
      // if (res) this.setHeight(res);
    });

    this.subWidth = new fun().getWindowSize.subscribe((res) => {
      if (res) {
        this.setCantPagView(res.innerWidth, 'width_page');
      }
    });

    this.TablasComponent = this;
    this.TablasComponentChange.emit(this.TablasComponent);

    this.checkPagination();
  }

  checkPagination() {
    this.tServ.initPagination(this.config.id_tabla, this.config.obj_paginate || this.tServ.obj_paginate.default);
  }

  ngAfterViewInit() {
    if (this.data && this.data.length > 0) this.updateDataCopy(this.data, 'ngAfterViewInit');

    this.handleConfig();
  }

  handleConfig() {
    if (!this.config.padding) this.config.padding = '0rem';
    if (!this.config.filterTargets) this.config.filterTargets = _.map(this.config.info, (info) => _.values(_.pick(info, ['key']))[0]);
    this.config.info.map((item) => {
      if (!_.has(item, 'titulo_sm')) item.titulo_sm = item.titulo;
    });
  }

  changeConfig(array) {
    this.zone.run(() => {
      array.forEach((element) => {
        const key = _.keys(element)[0];
        this.config[key] = element[key];
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.subWidth.unsubscribe();
    this.tServ.deletePaginationById(this.config.id_tabla);
  }

  getValueForm(column, data) {
    switch (column.tipo) {
      case 'textList':
        return _.reduce(_.get(data, column.key), (acumulado, item) => acumulado + `${acumulado.length ? ',' : ''}  ${_.get(item, column.key_value)}`, '');

      case 'formatoNumero':
        return this.formatoNumero(_.get(data, column.key));

      case 'date':
        const fecha = fun.date_formater({ date: _.get(data, column.key), dateFormat: 'DD/MM/YYYY', con_hora: true });
        return fecha;

      default:
        return _.get(data, column.key);
    }
  }

  checkHasClickFuntion(column, dato, i, e) {
    const obj = { id_tabla: this.config.id_tabla, index: i, data: dato, column: column };
    if (column.click) {
      column.click(obj);
      e.stopPropagation();
    }
  }

  filter(event) {
    const search = event.target.value;

    if (_.has(this.config, 'filtrar') && !this.config.filtrar.local) {
      fun.awaitTyping(event).then(() => {
        if (_.has(this.config, 'padre_functions') && this.config.padre_functions?.data_request) {
          const actualPagination = this.tServ.getPaginationById(this.config.id_tabla);

          if (fun.hasValue(search)) {
            if (fun.isEmpty(actualPagination.ant_page)) this.tServ.modifyPaginationById(this.config.id_tabla, [{ ant_page: actualPagination.page }]);
            this.tServ.modifyPaginationById(this.config.id_tabla, [{ page: 1 }]);
          } else if (fun.isEmpty(search) && fun.hasValue(actualPagination.ant_page)) {
            this.tServ.modifyPaginationById(this.config.id_tabla, [{ page: actualPagination.ant_page }]);
            this.tServ.modifyPaginationById(this.config.id_tabla, [{ ant_page: null }]);
          }

          this.config.padre_functions.data_request({ per_page: actualPagination.per_page, page: actualPagination.page, search: search });
        } else {
          fun.logRed('----- Debe de especificar en la configuracion de la tabla cual es la funcion para pedir la data ----- ');
        }
      });
    }

    this.tServ.modifyPaginationById(this.config.id_tabla, [{ search: search }]);
  }

  getPaginatorPageByNumber(number) {
    let paginatorPage = undefined;
    const paginator = document.getElementById(`paginator-${this.config.id_tabla}`);

    if (paginator) {
      const paginator_pages = document.getElementsByClassName('p-paginator-pages');
      paginatorPage = _.find(_.head(paginator_pages).children, { outerText: `${number || 1}` });
    }
    return paginatorPage;
  }

  paginatorChange(event, id) {
    setTimeout(() => {
      const page = event.page + 1;
      const per_page = event.rows;
      const actualPagination = this.tServ.getPaginationById(this.config.id_tabla);

      const actualPage = this.getPaginatorPageByNumber(page);
      const clickeado_por = actualPage.getAttribute('clickeado_por');

      if (page != actualPagination.page && (fun.isEmpty(clickeado_por) || clickeado_por != 'maquina')) {
        this.tServ.modifyPaginationById(id, [{ page: page }, { per_page: per_page }, { per_page_options: actualPagination.per_page_options }, { is_local: actualPagination.is_local }]);

        if (actualPagination.is_local) {
          this.localPagination(page, per_page, 'paginatorChange');
        } else {
          if (_.has(this.config, 'padre_functions') && this.config.padre_functions?.data_request) {
            this.config.padre_functions.data_request({ per_page: per_page, page: page, search: null });
          } else {
            fun.logRed('----- Debe de especificar en la configuracion de la tabla cual es la funcion para pedir la data ----- ');
          }
        }
      }

      this.cdRef.detectChanges();
    }, 150);
  }

  localPagination(page, per_page, desde = '') {
    const copyData = fun.duplicarJson(this.copyData);

    const inicio = (page - 1) * per_page;
    const final = inicio + per_page;

    const dataParsed = _.slice(copyData, inicio, final);

    this.data.length = 0;
    dataParsed.forEach((dato) => this.data.push(dato));
  }

  dataLocalFilter(newData) {
    this.data.length = 0;
    newData.forEach((dato) => this.data.push(dato));
    const id = this.config.id_tabla;

    let pageMostar = 1;
    this.pageAfterFilter ||= this.tServ.getPaginationById(id)['page'];

    if (_.isEqual(this.data, this.copyData)) {
      pageMostar = this.pageAfterFilter;

      this.pageAfterFilter = undefined;
    }

    this.tServ.modifyPaginationById(id, [{ page: pageMostar }]);
  }

  divPaginatorChangeWidth(event) {
    this.setCantPagView(event.newWidth, 'width_paginator');
  }

  setCantPagView(width, tipo) {
    let actual = 1;
    const actualPagination = this.tServ.getPaginationById(this.config.id_tabla);

    if (tipo == 'width_page') {
      const divPaginator = document.getElementById('divPaginator');
      if (divPaginator) width = divPaginator.offsetWidth;
    }

    if (width > 385) actual = 5;
    else if (width <= 385 && width > 350) actual = 4;
    else if (width <= 350 && width > 320) actual = 3;
    else if (width <= 320 && width > 285) actual = 2;
    else if (width <= 285) actual = 1;

    const actualPage = this.getPaginatorPageByNumber(actualPagination?.page);

    setTimeout(() => {
      this.zone.run(() => {
        if (actualPage) {
          actualPage.setAttribute('clickeado_por', 'maquina');
          actualPage.click();
          setTimeout(() => actualPage.removeAttribute('clickeado_por'), 2000);
        }

        this.cantPagesView = actual;
        this.cdRef.detectChanges();
      });
    }, 100);
  }

  getColor(myColor) {
    return this.tServ.getColor(myColor);
  }

  getStyle(column, i) {
    let styles = {};

    if (this.data.length && this.data[i] && this.data[i].customStyles) {
      const estilos = this.data[i].customStyles[`td-${column}`];

      if (Array.isArray(estilos)) {
        for (const item of estilos) {
          const startId = item.isTd ? 'td-' : '';
          const elemento = document.getElementById(`${startId}${this.config.id_tabla}-${item.key}-${i}`);

          if (elemento) elemento.setAttribute('style', item.estilos);
        }
      } else {
        if (typeof estilos == 'object') styles = estilos;
      }
    }

    return styles;
  }

  changeBackGroundColor(dato) {
    const backgroundConfig = this.config.backgroundColor;
    let res = '#00000000';
    if (_.has(this.config, 'backgroundColor') && fun.hasValue(this.config.backgroundColor)) {
      let temp_res = false;
      for (let i = 0; i < backgroundConfig.length; i++) {
        const backConfig = backgroundConfig[i];

        if (_.some(backConfig, (conf) => conf.kind === 'selected') && fun.hasValue(this.seleccionado)) temp_res = Number(dato.id) !== Number(this.seleccionado || 0);

        if (!temp_res && backConfig.kind === 'campo') {
          if (backConfig.value.length === 0) temp_res = dato[backConfig.target];
          else temp_res = _.some(backConfig.value, (value) => value == dato[backConfig.target]);
        }

        if (temp_res) res = backConfig.color;
      }
    }

    return res;
  }
  changeStylesTitles() {
    for (let i = 0; i < this.config.info.length; i++) {
      const info: any = this.config.info[i];

      if (info.estilos && info.estilos.length > 0) {
        let list_estilos_titulos = '';
        for (let j = 0; j < info.estilos.length; j++) {
          const estilos = info.estilos[j];
          const key = Object.keys(estilos)[0];
          const value = Object.values(estilos)[0];

          list_estilos_titulos += `${key}: ${value} !important; `;
        }

        const columna = document.getElementById(`titulo_${this.config.id_tabla}_${info.key}`) as any;

        if (columna) columna.setAttribute('style', list_estilos_titulos);
      }
    }
  }

  mouseMoveEvent(event, row, column, id) {
    if (row.iconsMoveEvents) {
      row.iconsMoveEvents.forEach((moveEvent) => {
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

  changeValorInput(key, index, value, data) {
    const newData = fun.duplicarJson(data);
    newData[key] = value;

    this.rowEditing = newData;

    const obj = { data, newData, index, key, value, id_tabla: this.config.id_tabla };

    this.handle_table_events('inputChange', obj);
  }

  updateDataCopy(data, desde = '') {
    this.copyData = fun.duplicarJson(data);

    if (fun.hasValue(this.config.obj_paginate) && this.config.obj_paginate.is_local) {
      this.localPagination(this.config.obj_paginate.page, this.config.obj_paginate.per_page, 'updateDataCopy');
    }
  }

  ngOnChanges(change) {
    if (change.data && change.data.currentValue) {
      this.updateDataCopy(this.data, 'ngOnChanges');

      // ================================================
      // CUSTOM STYLES
      // ================================================
      setTimeout(() => {
        this.changeStylesTitles();
      }, 10);
      // ================================================
    }
    this.cdRef.detectChanges();
  }

  iconBtn(key, i, data, e, objIcon) {
    const obj = { id_tabla: this.config.id_tabla, index: i, columnKey: key, iconKey: objIcon.key, data: data, rowEditing: this.rowEditing };

    const is_disable = this.disabledInput(data, objIcon);

    if (!is_disable) this.handle_table_events('clickIcon', obj);

    e.stopPropagation();
  }

  showIcon(objIcon, data) {
    let res = false;

    if (_.has(objIcon, 'showCondition')) {
      for (let i = 0; i < objIcon.showCondition.length; i++) {
        const element = objIcon.showCondition[i];

        if (_.some(objIcon.showCondition, (conf) => conf.kind === 'selected')) {
          const is_selected = data.id == (this.seleccionado || 0);
          res = element.value == is_selected;
        }

        if (res) break;

        if (element.kind === 'campo') {
          if (element.value.length == 0) res = data[element.target] ? false : true;
          else res = _.some(element.value, (value) => value == data[element.target]);
        }
      }
    } else {
      res = true;
    }
    return res;
  }

  cambiaMostrar(num: number) {
    // this.IDROW = null;
    // this.mostrar = num;
    // this.paginate_info = {
    //   page: this.pagActual,
    //   per_page: this.mostrar,
    //   search: this.search === '' ? ' ' : this.search,
    // };
    // this.paginateChange.emit(this.paginate_info);
    // setTimeout(() => {
    //   this.IDROW = temp;
    // }, 250);
  }

  getIndex(index) {
    const pageIndex = (this.pagActual - 1) * this.config.obj_paginate.per_page + index;

    const validate = fun.isEmpty(this.data[pageIndex]);
    if (validate) {
      return index;
    } else {
      return pageIndex;
    }
  }

  disabledInput(dato, column) {
    let res = false;

    if (_.has(column, 'disable')) {
      let temp_res = false;

      for (let i = 0; i < column.disable.length; i++) {
        const element = column.disable[i];

        if (_.some(column.disable, (conf) => conf.kind === 'always')) temp_res = true;

        if (temp_res) break;

        if (_.some(column.disable, (conf) => conf.kind === 'selected')) temp_res = Number(dato.id) !== Number(this.seleccionado || 0);

        if (temp_res) break;

        if (element.kind === 'campo') {
          if (element.value.length === 0) temp_res = dato[element.target] ? false : true;
          else temp_res = _.some(element.value, (value) => value == dato[element.target]);
        }
      }
      res = temp_res;
    }

    return this.config.read ? true : res;
  }

  resetInput(referencia, destino, i, formatear, especifico?) {
    if (referencia === 'especificar') {
      this.data[i][destino] = especifico;
    } else {
      const copia = fun.duplicarJson(this.data[i][referencia]);

      if (formatear) {
        this.data[i][destino] = fun.numFormatTwoDecimals(copia);
      } else {
        this.data[i][destino] = copia;
      }
    }
  }

  changeValorCheck(data, key, i) {
    data[key] = !data[key];

    const obj = { data: this.data, index: i, cambio: key, value: data, id_tabla: this.config.id_tabla };

    this.handle_table_events('inputChange', obj);
  }

  getDropPlaceholder(placeholder) {
    return placeholder ? placeholder : 'seleccione';
  }

  // changeVisibleItems(items) {
  //   this.mdbTablePagination.setMaxVisibleItemsNumberTo(items);
  // }
  functionsBtnDinamic(params) {
    if (_.has(this.config, 'padre_functions') && this.config.padre_functions?.handleBtnsDinamic) {
      this.config.padre_functions.handleBtnsDinamic(params);
    } else {
      fun.logRed('----- Debe de implementar la funcion handleBtnsDinamic en el componente padre de la tabla ----');
    }
  }

  clickROW(arg, quien = '') {
    const has_inputs = _.some(this.config.info, (info: any) => info.tipo == 'input');

    this.handle_table_events('clickRow', arg);
  }

  handle_table_events(type, arg) {
    this.table_events.emit({ type: type, info: arg, id_tabla: this.config.id_tabla });
  }

  delete(arg) {
    this.handle_table_events('delete', arg);
  }

  pararProgagacion(e) {
    e.stopPropagation();
  }
}
