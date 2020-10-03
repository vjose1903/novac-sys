import { Component, OnInit, ViewChild, AfterViewInit, HostListener, ChangeDetectorRef, Input, Output, EventEmitter, OnDestroy, OnChanges, ElementRef } from '@angular/core';
import { MdbTableDirective } from 'angular-bootstrap-md';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TablasService, obj_paginate } from './tablas.service';
import * as _ from 'lodash';
import { DBservice } from '../../../core/services/bdservice.service';
import { GLOBAL } from '../../../core/services/GLOBAL';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class TablasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild(MdbTableDirective, { static: false }) mdbTable: MdbTableDirective;
  cantiTootip: string;
  ready = false;

  @ViewChild('searchDiv', { static: false }) searchDiv: ElementRef;
  @ViewChild('paginationDiv', { static: false }) paginationDiv: ElementRef;

  restoAHeigthDiv: any;

  @HostListener('input') oninput() {
    this.searchItems();
  }
  element: HTMLElement;
  entrar = 1;

  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    // arriba 38
    // abajo 40

    setTimeout(() => {
      if (this.focusRow) {
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
    }, 50);
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
  };
  paginate_info = obj_paginate;

  // inputs

  @Input() metodo = null;
  @Input() paraFiltroArticulos = null;
  @Input() paraFiltroClientes;
  @Input() info;
  @Input() colorHead = true;
  @Input() tablaHover = true;
  @Input() search = true;
  @Input() paginate = true;
  @Input() quitarAScorll = 110;
  @Input() botones = {
    titulo: false,
    borrar: false,
    editar: false,
    mostrar: false,
  };
  @Input() id_tabla = 'tabla';

  @Input() seleccionado = -1;
  @Input() focusRow = false;
  @Input() filtroSelect: any;
  @Input() data;
  @Input() colores = false;

  // output
  @Output() pageChanges = new EventEmitter<any>();
  @Output() clickIcon = new EventEmitter<any>();
  @Output() clickRow = new EventEmitter<any>();
  @Output() DevolverInfo = new EventEmitter<any>();
  @Output() DELETE = new EventEmitter<any>();
  @Output() reinicioModal = new EventEmitter<any>();
  @Output() noArticulo = new EventEmitter<any>();
  @Output() getInfoChange = new EventEmitter<any>();
  @Output() paginateChange = new EventEmitter<any>();

  subTotalPag: Subscription;

  @Input() alto = 200;

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice, private tServ: TablasService) {}

  ngOnInit() {
    this.necesarioStart();

    this.subTotalPag = this.tServ.TOTALPAGINAS.subscribe((res) => {
      if (res) {
        if (this.id_tabla !== 'tabla') {
          if (res.tabla === this.id_tabla) {
            this.total_registros = res.total;
          }
        } else {
          this.total_registros = res.total;
        }
      }
    });

    // if (this.search) {
    //   setTimeout(() => {
    //     this.element = document.getElementById('search') as HTMLElement;
    //     this.element.focus();
    //   }, 5);
    // }
  }

  calcularAlto() {
    if (this.alto) {
      setTimeout(() => {
        if (this.search && this.paginate) {
          // si tiene paginacion y buscador
          this.restoAHeigthDiv = this.searchDiv.nativeElement.offsetHeight + this.paginationDiv.nativeElement.offsetHeight + this.quitarAScorll;
        } else if (this.search && !this.paginate) {
          // si solo buscador
          this.restoAHeigthDiv = this.searchDiv.nativeElement.offsetHeight + this.quitarAScorll;
        } else if (!this.search && this.paginate) {
          // si solo paginacion
          this.restoAHeigthDiv = this.paginationDiv.nativeElement.offsetHeight + this.quitarAScorll;
        } else if (!this.search && !this.paginate) {
          // si no tiene ni paginacion ni buscador
          this.restoAHeigthDiv = this.quitarAScorll;
        }

        this.alto -= this.restoAHeigthDiv;
      }, 20);
    }
  }

  async ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  async necesarioStart() {
    if (this.focusRow) {
      this.IDROW = this.ROW + _.toString(this.NUM);
    }

    await this.setDATATABLE();

    if (this.paraFiltroArticulos) {
      this.searchText = await this.paraFiltroArticulos;
    }

    if (this.paraFiltroClientes) {
      this.searchText = await this.paraFiltroClientes;
    }
    // ================================================

    for (let i = 0; i < this.info.length; i++) {
      const info = this.info[i];
      if (info.customClass) {
        for (let j = 0; j < info.estilos.length; j++) {
          const estilos = info.estilos[j];
          const key = Object.keys(estilos)[0];
          const value = Object.values(estilos)[0];
          const columna = document.getElementById(info.titulo) as any;
          columna.style[key] = value;
        }
      }
    }
    // ================================================
    this.ready = true;
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
    this.entrar = 0;
    this.ROW = 'row-';
    this.NUM = 0;

    this.alto = undefined;
    this.restoAHeigthDiv = undefined;
    this.searchText = '';
  }

  resetInput(referencia, destino, i, formatear, especifico?) {
    if (referencia === 'especificar') {
      this.data[i][destino] = especifico;
    } else {
      const copia = GLOBAL.duplicarJson(this.data[i][referencia]);

      if (formatear) {
        this.data[i][destino] = GLOBAL.formatearNumero(GLOBAL.redondearAdos(copia));
      } else {
        this.data[i][destino] = copia;
      }
    }
  }

  changeValorCheck(key, i) {
    this.data[i][key] = !this.data[i][key];
    const obj = {
      body: this.data,
      index: i,
      cambio: key,
      value: this.data[i][key],
    };
    this.getInfoChange.emit(obj);
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

  pagActual = 1;
  mostrar = this.paginate_info.per_page;
  listaMostrar = [10, 15, 20];
  total_registros;

  cambiaMostrar(num: number) {
    const temp = GLOBAL.duplicarJson(this.ROW + '0');
    this.IDROW = null;

    this.mostrar = num;

    this.paginate_info = {
      page: this.pagActual,
      per_page: this.mostrar,
      searchText: this.searchText === '' ? ' ' : this.searchText,
    };

    this.paginateChange.emit(this.paginate_info);
    setTimeout(() => {
      this.IDROW = temp;
    }, 250);
  }

  pageChange(arg) {
    const temp = GLOBAL.duplicarJson(this.ROW + '0');
    this.IDROW = null;
    this.pagActual = arg;

    this.paginate_info = {
      page: arg,
      per_page: this.mostrar,
      searchText: this.searchText === '' ? ' ' : this.searchText,
    };

    this.paginateChange.emit(this.paginate_info);
    setTimeout(() => {
      this.IDROW = temp;
    }, 250);
  }

  disabledInput(condicion, i) {
    let res = true;
    if (condicion.getDisabled) {
      res = true;
      if (condicion.campo2) {
        if (this.data[i][condicion.campo] && !this.data[i][condicion.campo2]) {
          res = false;
        } else {
          res = true;
        }
      } else {
        if (this.data[i][condicion.campo]) {
          res = false;
        } else {
          res = true;
        }
      }
    } else {
      res = false;
    }
    return res;
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
        this.dbServ.toastError('Valor introducido es invalido', 'ERROR');
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

        const numeroFormateado = GLOBAL.formatearNumero(GLOBAL.redondearAdos(precioTEMP));

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

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;

    this.element.focus();
  }

  // ===================================================================================================

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  lookOters(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? this.medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? this.medidas[keys[2]] : keys[2];

    const principal = GLOBAL.formatearNumero(GLOBAL.redondearAdos(values[0])) + '  ' + fin;

    const padre = GLOBAL.formatearNumero(GLOBAL.redondearAdos(values[1])) + '  ' + fin1;
    const hijo = GLOBAL.formatearNumero(values[2]) + '  ' + fin2;

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
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(values[0])) + '  ' + fin;
  }

  ngOnChanges(simpleChanges) {
    if (simpleChanges.alto) {
      if (simpleChanges.alto.currentValue) {
        this.calcularAlto();
      }
    }
    // if (simpleChanges['data'].firstChange === false) {
    //   this.waitForChange();
    // }
  }

  async waitForChange() {
    await this.setDATATABLE();
  }

  async searchItems() {
    const temp = GLOBAL.duplicarJson(this.ROW + '0');
    this.IDROW = null;
    // ------------------------------------------------------------------------------

    if (this.searchText === '' || this.searchText === ' ' || this.searchText) {
      this.pageChange(this.pagActual);
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
    if (this.focusRow && arg.id) {
      this.seleccionado = arg.id;
    }

    if (this.metodo === 'venta' && this.paraFiltroArticulos !== null && arg.existencia === 0) {
      if (arg.descripcion === 'Producto terminado') {
        this.dbServ.toastError('Producto agotado, debe de producir mas!!!', 'ERROR');
      } else {
        this.dbServ.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR');
      }
    } else {
      this.clickRow.emit(arg);
      this.reinicioModal.emit();
    }
  }

  iconBtn(arg) {
    this.clickIcon.emit(arg);
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
    if (this.NUM === 0) {
      this.NUM = this.data.length;
    }
    this.NUM = this.NUM - 1;
    this.IDROW = this.ROW + _.toString(this.NUM);
    this.enfocarInput(this.IDROW);
    this.entrar++;
  }
  ABAJO() {
    if (this.NUM === this.data.length - 1) {
      this.NUM = -1;
    }

    this.NUM = this.NUM + 1;
    this.IDROW = this.ROW + _.toString(this.NUM);
    this.enfocarInput(this.IDROW);
    this.entrar++;
  }

  ENTER(arg) {
    this.entrar++;
    if (this.entrar > 1) {
      const element = document.getElementById(arg) as any;
      element.click();
    }
  }
}
