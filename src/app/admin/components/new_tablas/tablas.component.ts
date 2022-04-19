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
}
export interface table_config {
  padding?: string;
  padre_component?: any;
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
  peticion_data?: any;
  table_size?: 'sm';
  backgroundColor?: any;
  total_count?: any;
  obj_paginate?: any;
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
  @Input() botones;

  @Input() print_log = false;
  @Input() seleccionado: any;
  @Input() data = [];
  @Input() config: table_config = { padre_component: null };

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
        this.setCantPagView(res.innerWidth);
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

  filter(event) {
    const search = event.target.value;

    if (_.has(this.config, 'filtrar') && !this.config.filtrar.local) {
      fun.awaitTyping(event).then(() => {
        if (typeof this.config.padre_component?.['tableFilter'] == 'function') this.config.padre_component['tableFilter'](search, this.config.id_tabla);
      });
    }
    this.tServ.modifyPaginationById(this.config.id_tabla, [{ search: search }]);
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

  getValueForm(col, rowData, ri?) {
    switch (col.tipo) {
      case 'formatoNumero':
        return this.formatoNumero(_.get(rowData, col.key));
      case 'date':
        const fecha = fun.date_formater({ date: _.get(rowData, col.key), dateFormat: 'DD/MM/YYYY', con_hora: true });
        return fecha;
      default:
        return _.get(rowData, col.key);
    }
  }

  checkHasClickFuntion(column, dato, i, e) {
    const obj = { id_tabla: this.config.id_tabla, index: i, data: dato, column: column };
    if (column.click) {
      column.click(obj);
      e.stopPropagation();
    }
  }

  getActualPageElement() {
    const paginator = document.getElementById(`paginator-${this.config.id_tabla}`);

    let actualPage;
    if (paginator) actualPage = paginator.getElementsByClassName('p-highlight')[0];

    return actualPage;
  }

  paginatorChange(e, id) {
    const page = e.page + 1;
    const limit = e.rows;
    const actualPagination = this.tServ.getPaginationById(this.config.id_tabla);

    this.tServ.modifyPaginationById(id, [{ page: page }, { limit: limit }, { per_page_options: actualPagination.per_page_options }, { is_local: actualPagination.is_local }]);

    const actualPage = this.getActualPageElement();
    const clikeado_por = actualPage.getAttribute('clikeado_por');

    if (fun.isEmpty(clikeado_por) || clikeado_por !== 'maquina') {
      if (actualPagination.is_local) {
        this.localPagination(page, limit, 'paginatorChange');
      } else {
        this.config.padre_component[this.config.peticion_data]({ limit: limit, page: page, search: null });
      }
    }
  }

  localPagination(page, limit, desde = '') {
    const copyData = fun.duplicarJson(this.copyData);

    const inicio = (page - 1) * limit;
    const final = inicio + limit;

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

  setCantPagView(width) {
    let actual = 0;

    if (width >= 528) actual = 5;
    else if (width <= 527 && width > 486) actual = 4;
    else if (width <= 486 && width > 442) actual = 3;
    else if (width <= 442) actual = 2;

    const actualPage = this.getActualPageElement();

    if (actualPage) {
      actualPage.setAttribute('clikeado_por', 'maquina');
      actualPage.click();
      setTimeout(() => actualPage.removeAttribute('clikeado_por'), 2000);
    }

    this.zone.run(() => (this.cantPagesView = actual));
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
      this.localPagination(this.config.obj_paginate.page, this.config.obj_paginate.limit, 'updateDataCopy');
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

  // isDisable(dato, column) {
  //   let res = false;

  //   if (_.has(column, 'disable')) {
  //     let temp_res = false;

  //     for (let i = 0; i < column.disable.length; i++) {
  //       const element = column.disable[i];

  //       if (_.some(column.disable, (conf) => conf.kind === 'selected')) temp_res = Number(dato.id) !== Number(this.seleccionado || 0);

  //       if (temp_res) break;

  //       if (element.kind === 'campo') {
  //         if (element.value.length === 0) temp_res = dato[element.target] ? false : true;
  //         else temp_res = _.some(element.value, (value) => value == dato[element.target]);
  //         // if (element.value.length === 0) temp_res = !!dato[element.target];
  //       }
  //     }
  //     res = temp_res;
  //   }

  //   return this.config.read ? true : res;
  // }

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
    this.config.padre_component.handleBtnsDinamic(params);
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
