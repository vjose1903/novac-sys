import { ModalClass } from './../modal/modal-class';
import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, OnDestroy, NgZone, HostListener } from '@angular/core';

import * as _ from 'lodash';
import { ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { TablasService } from './tablas.service';
import { fun } from '../../../core/services/functions.service';
import { medidas, table_config, table_info } from './tabla-class';
import { teclasCode } from '../../../core/typescript/constantes';

@Component({
  selector: 'dinamic-table',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class NewTablasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  ready = false;

  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    if (this.config.focusRow && this.ready) {
      const key = event.keyCode;

      if (key == teclasCode._arriba) this.mover_foco('up');
      else if (key == teclasCode._abajo) this.mover_foco('down');
      else if (key == teclasCode._enter) this.ENTER(this.row_id);
    }
  }

  row_id;
  actualRowIndex = 0;
  copyData: any;

  seleccionado_id: any;
  altoTabla;
  altoTbody;
  showPagination = true;

  @Input() TablasComponent;
  @Output() TablasComponentChange = new EventEmitter<any>();

  @Input() cardTabla;

  @Input() print_log = false;
  @Input() seleccionado: any;
  @Input() data = [];
  @Input() post_id: any = '';
  @Input() config: table_config = { padre_functions: null };

  // output
  @Output() table_events = new EventEmitter<any>();
  @Output() dataChange = new EventEmitter<any>();

  cantPagesView: number = 5;
  total_registros;
  subWidth: Subscription;

  fun = fun;
  rowsEditing = [];
  tablaInterval;
  realIdTabla;

  constructor(public cdRef: ChangeDetectorRef, public tServ: TablasService, private zone: NgZone) {
    cdRef.detach();
    this.tablaInterval = setInterval(() => this.cdRef.detectChanges(), 500);
  }

  formatoNumero(num) {
    let numformat = '0.00';
    if (num) numformat = fun.numFormatTwoDecimals(num);
    return numformat;
  }

  ngOnInit() {
    this.realIdTabla = this.config.id_tabla + this.post_id;

    this.subWidth = new fun().getWindowSize.subscribe((res) => {
      if (res) {
        this.setCantPagView(res.innerWidth, 'width_page');
      }
    });

    this.TablasComponent = this;
    this.TablasComponentChange.emit(this.TablasComponent);

    this.checkPagination();
    this.row_id = `row-${this.realIdTabla}-${this.actualRowIndex}`;
    setTimeout(() => (this.ready = true), 250);
  }

  checkPagination() {
    this.tServ.initPagination(this.realIdTabla, this.config.obj_paginate || this.tServ.obj_paginate.default);
  }

  ngAfterViewInit() {
    this.changeStylesTitles();
    if (this.data && this.data.length > 0) this.updateDataCopy(this.data);
    this.handleConfig();
  }

  handleConfig() {
    if (!this.config.padding) this.config.padding = '0rem';
    if (!fun.objHas(this.config, 'redondo')) this.config.redondo = true;
    if (fun.objHas(this.config, 'filtrar') && !fun.objHas(this.config, 'filtrar.show')) this.config.filtrar.show = true;
    if (fun.objHas(this.config, 'obj_paginate') && !fun.objHas(this.config, 'obj_paginate.showDropDown')) this.config.obj_paginate.showDropDown = true;
    if (!fun.objHas(this.config, 'colorTitulo')) this.config.colorTitulo = true;
    if (!this.config.filterTargets) this.config.filterTargets = _.map(this.config.info, (info) => _.values(_.pick(info, ['key']))[0]);

    this.config.info.map((item) => {
      if (!fun.objHas(item, 'titulo_sm')) item.titulo_sm = item.titulo;
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
    if (this.subWidth) this.subWidth.unsubscribe();
    this.tServ.deletePaginationById(this.realIdTabla);
    clearInterval(this.tablaInterval);
  }

  getValueForm(column: table_info, data) {
    switch (column.tipo) {
      case 'textList':
        return _.reduce(_.get(data, column.key), (acumulado, item) => acumulado + `${acumulado.length ? ',' : ''}  ${_.get(item, column.key_value)}`, '');

      case 'formatoNumero':
        return this.formatoNumero(_.get(data, column.key));

      case 'date':
        const fecha = fun.date_formater({ date: _.get(data, column.key), dateFormat: fun.hasValue(column.dateFormat) ? column.dateFormat : 'DD/MM/YYYY', con_hora: column.con_hora });
        return fecha;

      default:
        return _.get(data, column.key);
    }
  }

  checkBackgroundTr(params: { tipo: string; dato: any }) {
    let res = false;
    if (fun.objHas(params.dato, params.tipo)) res = _.get(params.dato, params.tipo);

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
    const search = event.target.value;

    if (fun.objHas(this.config, 'filtrar') && !this.config.filtrar.local) {
      fun.awaitTyping(event).then(() => {
        if (fun.objHas(this.config, 'padre_functions') && this.config.padre_functions?.data_request) {
          const actualPagination = this.tServ.getPaginationById(this.realIdTabla, 'filter');

          if (fun.hasValue(search)) {
            if (fun.isEmpty(actualPagination.ant_page)) this.tServ.modifyPaginationById(this.realIdTabla, [{ ant_page: actualPagination.page }], this);
            this.tServ.modifyPaginationById(this.realIdTabla, [{ page: 1 }], this);
          } else if (fun.isEmpty(search) && fun.hasValue(actualPagination.ant_page)) {
            this.tServ.modifyPaginationById(this.realIdTabla, [{ page: actualPagination.ant_page }], this);
            this.tServ.modifyPaginationById(this.realIdTabla, [{ ant_page: null }], this);
          }

          this.config.padre_functions.data_request({ per_page: actualPagination.per_page, page: actualPagination.page, search: search });
        } else {
          fun.logRed('----- Debe de especificar en la configuracion de la tabla cual es la funcion para pedir la data ----- ');
        }
      });
    }

    this.tServ.modifyPaginationById(this.realIdTabla, [{ search: search }], this);
  }

  getPaginatorPageByNumber(number) {
    let paginatorPage = undefined;
    const paginator = document.getElementById(`paginator-${this.realIdTabla}`);

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
      const actualPagination = this.tServ.getPaginationById(this.realIdTabla, 'paginatorChange');

      const actualPage = this.getPaginatorPageByNumber(page);
      const clickeado_por = actualPage?.getAttribute('clickeado_por');

      if (fun.hasValue(actualPagination) && (page != actualPagination.page || per_page != actualPagination.per_page) && (fun.isEmpty(clickeado_por) || clickeado_por != 'maquina')) {
        this.tServ.modifyPaginationById(id, [{ page: page }, { per_page: per_page }, { per_page_options: actualPagination.per_page_options }, { is_local: actualPagination.is_local }], this);

        if (actualPagination.is_local) {
          this.localPagination(page, per_page, 'paginatorChange');
        } else {
          if (fun.objHas(this.config, 'padre_functions') && this.config.padre_functions?.data_request) {
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
    const id = this.realIdTabla;
    const actualPagination = this.tServ.getPaginationById(id, 'dataLocalFilter');

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

        this.tServ.modifyPaginationById(id, [element], this);
      }
    }
  }

  divPaginatorChangeWidth(event) {
    this.setCantPagView(event.newRect.width, 'width_paginator');
  }

  setCantPagView(width, tipo) {
    let actual = 1;
    const actualPagination = this.tServ.getPaginationById(this.realIdTabla);

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

  changeBackGroundColor(dato) {
    const backgroundConfig = this.config.backgroundColor;
    let res = '#00000000';
    if (fun.objHas(this.config, 'backgroundColor') && fun.hasValue(this.config.backgroundColor)) {
      let temp_res = false;
      for (let i = 0; i < backgroundConfig.length; i++) {
        const backConfig = backgroundConfig[i];

        if (backConfig.some((conf) => conf.kind === 'selected') && fun.hasValue(this.seleccionado)) temp_res = Number(dato.id) !== Number(this.seleccionado || 0);

        if (!temp_res && backConfig.kind === 'campo') {
          if (backConfig.value.length === 0) temp_res = dato[backConfig.target];
          else temp_res = backConfig.value.some((value) => value == dato[backConfig.target]);
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
      fun.revisarPrecio(input, id).then((res) => {
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
          input.value = fun.is_number(input.value) ? fun.desformatear(input.value) : null;
          input.select();
        }
        if (type == 'blur') {
          input.value = fun.is_number(input.value) ? fun.numFormatTwoDecimals(input.value) : null;
          if (fun.isEmpty(input.value)) fun.enfocarInput(input.id);
        }
      }
    }

    const obj = { column, data, index: index_body, id_tabla: this.realIdTabla };
    this.handle_table_events('inputBlur', obj);
  }

  changeValorInput(column, key, index, value, data) {
    let newData = fun.duplicarJson(this.rowsEditing.find((item) => item.id == data.id));

    if (fun.isEmpty(newData) || this.rowsEditing.length == 0) newData = fun.duplicarJson(data);

    fun.setProperty(newData, key, value);

    this.tServ.modifyRowsEditing(newData, 'add', this.rowsEditing);

    const obj = { data, newData, index, key, value, id_tabla: this.realIdTabla };
    this.handle_table_events('inputChange', obj);
  }

  updateDataCopy(data) {
    this.copyData = fun.duplicarJson(data);

    if (fun.hasValue(this.config.obj_paginate) && this.config.obj_paginate.is_local) {
      this.localPagination(this.config.obj_paginate.page, this.config.obj_paginate.per_page, 'updateDataCopy');
    }
    this.cdRef.detectChanges();
  }

  ngOnChanges(change) {
    if (change.data && change.data.currentValue) {
      this.updateDataCopy(this.data);

      // ================================================
      // CUSTOM STYLES
      // ================================================
      setTimeout(() => this.changeStylesTitles(), 10);
      // ================================================

      this.TablasComponent = this;
      this.TablasComponentChange.emit(this.TablasComponent);
    }
    this.cdRef.detectChanges();
  }

  cantidadesTooltip(dato, column) {
    if (dato.tipo_articulo.tipo == 'servicio') return null;

    const objeto = dato[column.key];
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? medidas[keys[2]] : keys[2];

    const padre = fun.numFormatTwoDecimals(values[1]) + '  ' + fin1;
    const hijo = fun.formatearNumero(values[2]) + '  ' + fin2;

    let cantiTootip = '';

    cantiTootip = `${padre}`;

    if (keys.length > 1) {
      keys.length == 2 ? (cantiTootip = `${padre}`) : (cantiTootip = `${padre} - ${hijo}`);
    }

    return cantiTootip;
  }

  cantidadesLabel(dato, column) {
    if (dato.tipo_articulo.tipo == 'servicio') return 'N/A';

    const objeto = dato[column.key];
    const keys = _.keys(objeto);
    const values = _.values(objeto);
    const fin = values[0] > 1 ? medidas[keys[0]] : keys[0];

    return fun.numFormatTwoDecimals(values[0]) + '  ' + fin;
  }

  disableInput(dato, column) {
    return this.tServ.disabledInput({ dato: dato, column: column, config: this.config, seleccionado: this.seleccionado });
  }

  showIcon(objIcon, data) {
    let res = false;

    if (fun.objHas(objIcon, 'showCondition')) {
      for (let i = 0; i < objIcon.showCondition.length; i++) {
        const conditionObj = objIcon.showCondition[i];

        if (objIcon.showCondition.some((conf) => conf.kind === 'selected')) {
          const is_selected = data.id == (this.seleccionado || 0);
          res = conditionObj.value == is_selected;
        }

        if (res) break;

        if (conditionObj.kind === 'campo') {
          if (conditionObj.value.length == 0) res = data[conditionObj.target] ? false : true;
          else res = conditionObj.value.some((value) => value == data[conditionObj.target]);
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
      const copia = fun.duplicarJson(this.data[index][referencia]);

      if (formatear) {
        input['value'] = fun.numFormatTwoDecimals(copia);
      } else {
        input['value'] = copia;
      }
    }
  }

  changeValorCheck(dato, column, index) {
    const is_disable = this.tServ.disabledInput({ dato: dato, column: column, config: this.config, seleccionado: this.seleccionado });

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
    this.cdRef.detectChanges();

    fun.scrollTo({ id: this.row_id, behavior: 'smooth', block: 'center', inline: 'center' });
    fun.enfocarInput(this.row_id);
  }

  ENTER(arg) {
    const element = document.getElementById(arg) as any;
    if (element) setTimeout(() => element.click(), 10);
  }
}
