import { Component, OnInit, ViewChild, AfterViewInit, HostListener, ChangeDetectorRef, Input, Output, EventEmitter, OnDestroy, OnChanges, ElementRef } from '@angular/core';
import { MdbTableDirective } from 'angular-bootstrap-md';

import { Subscription } from 'rxjs';
import { TablasService } from './tablas.service';
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { FunctionService } from '../../../core/services/functions.service';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class TablasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild(MdbTableDirective) mdbTable: MdbTableDirective;
  @ViewChild('dinamicTable') dinamicTable: ElementRef;
  cantiTootip: string;
  ready = false;

  // @ViewChild('searchDiv') searchDiv: ElementRef;
  // @ViewChild('paginationDiv') paginationDiv: ElementRef;
  // @ViewChild('titulosHeader') titulosHeader: ElementRef;
  // @ViewChild('searchInput') searchInput: ElementRef;
  seleccionado_id: any;

  // @HostListener('input') oninput() {
  //   this.searchItems();
  // }

  element: HTMLElement;
  tabla_content: HTMLElement;
  obj_alto: { altoTabla: number; altoTbody: number; id: any } = { altoTabla: 10, altoTbody: 10, id: 0 };

  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    // arriba 38
    // abajo 40
    // enter 13

    if (this.focusRow && this.ready) {
      const key = event.keyCode;
      if (key === 38) {
        event.stopPropagation();
        this.ARRIBA();
      } else if (key === 40) {
        this.ABAJO();
      } else if (key === 13) {
        this.ENTER(this.IDROW);
      }
    }
  }

  // variables

  elements: any[] = [];
  previous: any = [];
  searchText = '';
  @Input() ROW = 'row-';
  NUM = 0;
  IDROW = 'row-0';

  medidas = {
    Libra: 'Libras',
    Quintal: 'Quintales',
    Caja: 'Cajas',
    Paquete: 'Paquetes',
    Unidad: 'Unidades',
    Saco: 'Sacos',
  };

  // inputs

  @Input() padre;
  @Input() read = false;
  @Input() is_modal = false;
  @Input() metodo = null;
  @Input() paraFiltroArticulos = null;
  @Input() paraFiltroClientes = null;
  @Input() info;
  @Input() colorHead = true;
  @Input() tablaHover = true;
  @Input() search = true;
  @Input() paginate = true;
  // @Input() botones = {
  //   titulo: false,
  //   borrar: false,
  //   editar: false,
  //   mostrar: false,
  // };
  @Input() botones;

  @Input() id_tabla = 'tabla';

  @Input() seleccionado = -1;
  @Input() focusRow = false;
  @Input() filtroSelect: any;
  @Input() data;
  @Input() colores = false;
  @Input() TablasComponent;
  @Output() TablasComponentChange = new EventEmitter<any>();
  // output
  @Output() pageChanges = new EventEmitter<any>();
  @Output() clickIcon = new EventEmitter<any>();
  @Output() clickRow = new EventEmitter<any>();
  @Output() DevolverInfo = new EventEmitter<any>();
  @Output() DELETE = new EventEmitter<any>();
  @Output() reinicioModal = new EventEmitter<any>();
  @Output() getInfoChange = new EventEmitter<any>();
  @Output() paginateChange = new EventEmitter<any>();

  subTotalPag: Subscription;

  // @Input() alto = 200;
  @Input() pad = true;
  select_all_value = false;

  pagActual = 1;
  mostrar;
  listaMostrar = [5, 20, 40, 60];
  total_registros;

  constructor(private cdRef: ChangeDetectorRef, private tServ: TablasService, private fun: FunctionService) {}

  ngOnInit() {
    this.subTotalPag = this.tServ.TOTALPAGINAS.subscribe((res) => {
      if (res) {
        if (this.id_tabla !== 'tabla') {
          if (res.tabla === this.id_tabla) this.total_registros = res.total;
        } else {
          this.total_registros = res.total;
        }
      }
    });

    this.TablasComponent = this;
    this.TablasComponentChange.emit(this.TablasComponent);

    this.checkPagination();
  }

  checkPagination() {
    // this.tServ.initPagination(this.id_tabla, this.config.obj_paginate || this.tServ.obj_paginate.default);
    this.tServ.initPagination(this.id_tabla, this.tServ.obj_paginate.default);
    const actualPagination = this.tServ.getPaginationById(this.id_tabla);
    this.mostrar = actualPagination['per_page'];
  }

  calcularAlto() {
    const filterDiv = document.getElementById('searchDiv-' + this.id_tabla);
    const paginationDiv = document.getElementById('paginationDiv-' + this.id_tabla);
    const titulosDiv = document.getElementById('titulosHeader-' + this.id_tabla);

    const array = [filterDiv?.offsetHeight, paginationDiv?.offsetHeight];
    // console.log('array ', array);

    setTimeout(() => {
      let restar = 0;
      for (let i = 0; i < array.length; i++) {
        const element: any = array[i];
        if (element) restar += element;
      }

      this.tabla_content = this.padre.firstChild;
      // console.log('this.id_tabla ', this.id_tabla);
      // console.log('restar ', restar);
      // console.log('this.tabla_content ', this.tabla_content);
      // console.log('this.tabla_content.offsetHeight ', this.tabla_content.offsetHeight);

      this.obj_alto = {
        altoTabla: this.tabla_content.offsetHeight - restar,
        altoTbody: this.tabla_content.offsetHeight - restar - (titulosDiv.offsetHeight || 0) - (this.fun.hasValue(paginationDiv) ? 15 : 0), // el -15 es para separar un poco el scroll del paginador
        id: this.id_tabla,
      };
      // console.log('this.obj_alto ', this.obj_alto);
    }, 100);
  }

  async ngAfterViewInit() {
    if (this.data && this.mdbTable && this.info) {
      this.necesarioStart();
    } else {
      const necesarios = [
        { title: 'DATA', body: this.data },
        { title: 'MDBTABLE', body: this.mdbTable },
        { title: 'INFO', body: this.info },
      ];

      necesarios.forEach((element) => {
        if (!element.body) console.error(`LA TABLA NO FUNCIONA SI NO TIENE: ${element.title}`);
      });
    }

    this.cdRef.detectChanges();
  }

  mouseMoveEvent(event, row, column, id) {
    if (row.iconsMoveEvents) {
      row.iconsMoveEvents.forEach((moveEvent) => {
        if (column === moveEvent.key) {
          if (event === 'hover') {
            for (let i = 0; i < moveEvent.hover.length; i++) {
              const overEvent = moveEvent.hover[i];
              this.fun.ModificarClass(id, moveEvent.leave[i], 'remove');
              this.fun.ModificarClass(id, overEvent, 'add');
            }
          } else {
            for (let i = 0; i < moveEvent.leave.length; i++) {
              const overEvent = moveEvent.leave[i];
              this.fun.ModificarClass(id, moveEvent.hover[i], 'remove');
              this.fun.ModificarClass(id, overEvent, 'add');
            }
          }
        }
      });
    }
  }

  async necesarioStart() {
    if (this.focusRow) this.IDROW = this.ROW + _.toString(this.NUM);

    await this.setDATATABLE();

    if (this.paraFiltroArticulos) this.searchText = await this.paraFiltroArticulos;

    if (this.paraFiltroClientes) this.searchText = await this.paraFiltroClientes;

    // this.changeStylesTitles();

    setTimeout(() => (this.ready = true), 250);
  }

  // ===================================================
  //  Setear data en las tablas para busqueda
  // ===================================================
  llenarArreglos() {
    for (let i = 0; i < this.data.length; i++) {
      const element = this.data[i];
      this.elements.push(element);
      this.previous.push(element);
    }
  }

  setearDataEnLaTabla() {
    if (this.elements) {
      this.mdbTable.setDataSource(this.elements);
    }
  }

  actualizarArreglos() {
    this.elements = this.mdbTable.getDataSource();
    this.previous = this.mdbTable.getDataSource();
  }

  async setDATATABLE() {
    this.elements = [];
    this.previous = [];

    await this.llenarArreglos();
    await this.setearDataEnLaTabla();
    await this.actualizarArreglos();
  }

  ngOnDestroy() {
    this.ROW = 'row-';
    this.NUM = 0;

    this.searchText = '';
    this.reinicioModal.emit();
    this.tServ.deletePaginationById(this.id_tabla);
  }

  resetInput(referencia, destino, i, formatear, especifico?) {
    if (referencia === 'especificar') {
      this.data[i][destino] = especifico;
    } else {
      const copia = this.fun.duplicarJson(this.data[i][referencia]);

      if (formatear) {
        this.data[i][destino] = this.fun.formatearNumero(this.fun.redondearAdos(copia));
      } else {
        this.data[i][destino] = copia;
      }
    }
  }

  changeValorSelectAll() {
    this.select_all_value = !this.select_all_value;

    this.data.forEach((data, index) => {
      if ((this.select_all_value && !data.select) || (!this.select_all_value && data.select)) this.changeValorCheck('select', index);
    });
  }

  changeValorCheck(key, i, auto = false) {
    const info_colum = _.find(this.info, (item) => item.key == key);
    if (!this.disabledInput(this.data[i], info_colum)) {
      this.data[i][key] = !this.data[i][key];
      const obj = { body: this.data, index: i, cambio: key, value: this.data[i][key] };

      if (!auto && _.every(this.data, { select: this.data[i][key] })) this.select_all_value = this.data[i][key];

      this.getInfoChange.emit(obj);
    }
  }

  changeValorInput(key, i, valor) {
    this.data[i][key] = valor;
    const obj = {
      body: this.data,
      index: i,
      cambio: key,
      value: valor,
    };
    this.getInfoChange.emit(obj);
  }

  iconBtn(key, i, row_) {
    const obj = {
      index: i,
      column: key,
      row: row_,
    };
    this.clickIcon.emit(obj);
  }

  cambiaMostrar(num: number) {
    const temp = this.fun.duplicarJson(this.ROW + '0');
    this.IDROW = null;
    this.mostrar = num;

    this.tServ.modifyPaginationById(this.id_tabla, [{ per_page: this.mostrar }, { searchText: this.searchText === '' ? ' ' : this.searchText }]).then(() => {
      const paginationChanged = this.tServ.getPaginationById(this.id_tabla);
      this.paginateChange.emit(paginationChanged);
    });

    setTimeout(() => (this.IDROW = temp), 150);
  }

  pageChange(arg, tipo = '') {
    const temp = this.fun.duplicarJson(this.ROW + '0');
    this.IDROW = null;
    this.pagActual = tipo === 'filtro' ? 1 : arg;

    this.tServ.modifyPaginationById(this.id_tabla, [{ page: tipo === 'filtro' ? 1 : arg }, { searchText: this.searchText === '' ? ' ' : this.searchText }]).then(() => {
      const paginationChanged = this.tServ.getPaginationById(this.id_tabla);
      this.paginateChange.emit(paginationChanged);
    });

    setTimeout(() => (this.IDROW = temp), 150);
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

    return this.read ? true : res;
  }

  checkNumbers(arg) {
    let res = false;
    for (let i = 0; i < arg.length; i++) {
      const tempCaracter = arg.charAt(i);
      if (tempCaracter !== ',') {
        const caracter = _.parseInt(tempCaracter);
        if (_.isNaN(caracter)) {
          res = true;
        }
      }
    }
    return res;
  }

  checkLongMillares(num) {
    let res = false;
    const splitNum = _.split(num, ',');
    splitNum.forEach((element, i) => {
      if (i !== 0) {
        if (element.length !== 3) {
          res = true;
        }
      }
    });
    return res;
  }

  revisarPrecio(i, valor, key, input) {
    const precioTEMPO = valor;

    if (precioTEMPO !== null && precioTEMPO !== undefined && precioTEMPO !== '' && precioTEMPO !== ' ') {
      const splitPrecio = _.split(precioTEMPO, '.');

      let precioTEMP;

      let enteros = splitPrecio[0];
      let tempdecimales = splitPrecio[1];
      if (tempdecimales === undefined) {
        tempdecimales = '00';
      }
      //
      if (splitPrecio.length > 2 || this.checkNumbers(enteros) || this.checkLongMillares(enteros) || this.checkNumbers(tempdecimales) || this.checkLongMillares(tempdecimales)) {
        this.fun.toastError('Valor introducido es invalido', 'ERROR');
        this.enfocarInput(input);
      } else {
        //
        if (splitPrecio.length === 2) {
          if (enteros === '' || enteros === ' ') {
            enteros = '0';
          }
          let decimales;
          if (tempdecimales.length > 2) {
            decimales = tempdecimales.substring(0, 2);
          } else {
            decimales = _.padEnd(tempdecimales, 2, '0');
          }
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        } else if (splitPrecio.length === 1) {
          const decimales = '00';
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        }

        const numeroFormateado = this.fun.formatearNumero(this.fun.redondearAdos(precioTEMP));

        this.data[i][key] = numeroFormateado;
        const obj = {
          body: this.data,
          index: i,
          cambio: key,
          value: numeroFormateado,
        };
        this.getInfoChange.emit(obj);
      }
    }
  }

  // ===================================================================================================

  formatoNumero(num) {
    return this.fun.formatearNumero(this.fun.redondearAdos(num));
  }

  lookOters(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? this.medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? this.medidas[keys[2]] : keys[2];

    const principal = this.fun.formatearNumero(this.fun.redondearAdos(values[0])) + '  ' + fin;

    const padre = this.fun.formatearNumero(this.fun.redondearAdos(values[1])) + '  ' + fin1;
    const hijo = this.fun.formatearNumero(values[2]) + '  ' + fin2;

    let cantiTootip = { Padre: undefined, Hijo: undefined };
    if (keys.length > 1) {
      if (keys.length === 2) {
        cantiTootip = { Padre: padre, Hijo: undefined };
      } else {
        cantiTootip = { Padre: padre, Hijo: hijo };
      }
    } else {
      cantiTootip = { Padre: principal, Hijo: undefined };
    }

    return cantiTootip;
  }

  lookprincipal(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);
    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];

    return this.fun.formatearNumero(this.fun.redondearAdos(values[0])) + '  ' + fin;
  }

  getStyle(column, i) {
    if (this.data) {
      const styles = this.data[i] ? (this.data[i].customStyles ? this.data[i].customStyles[`td-${column}`] : {}) : {};
      return styles;
    } else {
      return {};
    }
  }

  changeStylesRows() {
    // recorrer la data
    for (let i = 0; i < this.data.length; i++) {
      const data = this.data[i];

      if (data.customStyles) {
        // recorrer el arreglo de estilos para ese row

        for (let k = 0; k < data.customStyles.length; k++) {
          const cStyle = data.customStyles[k];
          const span_titulo = Object.keys(cStyle)[0];
          const value_span = Object.values(cStyle)[0];
          const estilos = (value_span as any).estilos;
          let list_estilos = '';

          // recorrer el arreglo de estilos para cada columna
          for (let j = 0; j < estilos.length; j++) {
            const style = estilos[j];
            const key = Object.keys(style)[0];
            const value = Object.values(style)[0];
            list_estilos += `${key}: ${value} !important; `;
          }
          const span = span_titulo + '-' + i;
          const span_ = document.getElementById(span) as any;

          if (span_) {
            span_.setAttribute('style', list_estilos);
          }
        }
      }
    }
  }

  changeStylesTitles() {
    for (let i = 0; i < this.info.length; i++) {
      const info = this.info[i];

      if (info.tipo === 'check') {
        if (!_.has(info, 'select_all')) info.select_all = true;
        if (!_.has(info, 'estilos')) info.estilos = [];
        if (info.select_all) info.estilos.push({ padding: 0 });
      }

      if (info.estilos && info.estilos.length > 0) {
        let list_estilos_titulos = '';
        for (let j = 0; j < info.estilos.length; j++) {
          const estilos = info.estilos[j];
          const key = Object.keys(estilos)[0];
          const value = Object.values(estilos)[0];

          // columna.style[key] = value;
          list_estilos_titulos += `${key}: ${value} !important; `;
        }

        const columna = document.getElementById(info.titulo) as any;

        if (columna) {
          columna.setAttribute('style', list_estilos_titulos);
        }
      }
    }
  }

  ngOnChanges(simpleChanges) {
    if (simpleChanges.data && simpleChanges.data.currentValue) {
      // ================================================
      // CUSTOM STYLES
      // ================================================
      setTimeout(() => this.changeStylesTitles(), 1);
      // ================================================
    }

    if (simpleChanges.data && simpleChanges.info) {
      if (simpleChanges.data.currentValue && simpleChanges.info.currentValue) {
        setTimeout(() => this.calcularAlto(), 250);
      }
    }
    if (simpleChanges.seleccionado) {
      if (simpleChanges.seleccionado.currentValue) {
        this.seleccionado_id = simpleChanges.seleccionado.currentValue.id;
      }
    }
  }

  timeout: any = null;

  awaitTyping(event) {
    clearTimeout(this.timeout);
    var $this = this;
    this.timeout = setTimeout(function () {
      if (event.keyCode != 13) {
        $this.searchItems();
      }
    }, 500);
  }

  async searchItems() {
    const temp = this.fun.duplicarJson(this.ROW + '0');
    this.IDROW = null;
    // ------------------------------------------------------------------------------

    if (this.searchText === '' || this.searchText === ' ' || this.searchText) {
      this.pageChange(this.pagActual, 'filtro');
    }

    // ------------------------------------------------------------------------------
    const prev = await this.mdbTable.getDataSource();

    if (!this.searchText) {
      this.mdbTable.setDataSource(this.previous);
      this.data = this.mdbTable.getDataSource();
    }

    if (this.searchText) {
      this.data = this.mdbTable.searchLocalDataBy(this.searchText);
      this.mdbTable.setDataSource(prev);
    }
    setTimeout(() => {
      this.IDROW = temp;
    }, 300);
  }

  clickROW(arg) {
    if (this.focusRow && arg.id) this.seleccionado = arg.id;

    if (this.metodo === 'venta' && this.paraFiltroArticulos !== null && arg.existencia === 0) {
      if (arg.descripcion === 'Producto terminado') {
        this.fun.toastError('Producto agotado, debe de producir mas!!!', 'ERROR');
      } else {
        this.fun.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR');
      }
    } else {
      this.clickRow.emit(arg);
      this.reinicioModal.emit();
    }
  }

  devolverInfo(arg) {
    this.DevolverInfo.emit(arg);
  }

  delete(arg) {
    this.DELETE.emit(arg);
  }

  // ========================================================================
  //  FUNCIONES DE LAS TECLAS DE LAS FECHAS
  // ========================================================================

  ARRIBA() {
    if (this.NUM === 0) this.NUM = this.data.length;

    this.NUM = this.NUM - 1;
    this.IDROW = this.ROW + _.toString(this.NUM);

    this.fun.scrollTo(this.IDROW, 'center');
    this.enfocarInput(this.IDROW);
  }

  ABAJO() {
    if (this.NUM === this.data.length - 1) this.NUM = -1;

    this.NUM = this.NUM + 1;
    this.IDROW = this.ROW + _.toString(this.NUM);

    this.fun.scrollTo(this.IDROW, 'center');
    this.enfocarInput(this.IDROW);
  }

  ENTER(arg) {
    const element = document.getElementById(arg) as any;
    element.click();
  }

  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.focus();
  }
}
