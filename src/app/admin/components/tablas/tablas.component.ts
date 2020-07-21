import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  OnChanges,
  ElementRef,
} from '@angular/core';
import { MdbTablePaginationComponent, MdbTableDirective } from 'angular-bootstrap-md';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TablasService } from './tablas.service';
import * as _ from 'lodash';
import { DBservice } from '../../../core/services/bdservice.service';
import { GLOBAL } from '../../../core/services/GLOBAL';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class TablasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild(MdbTablePaginationComponent, { static: true })
  mdbTablePagination: MdbTablePaginationComponent;

  @ViewChild(MdbTableDirective, { static: false }) mdbTable: MdbTableDirective;
  cantiTootip: string;
  ready = false;

  @HostListener('input') oninput() {
    this.searchItems();
  }
  element: HTMLElement;
  entrar = 0;

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

  // inputs

  @Input() metodo = null;
  @Input() paraFiltroArticulos = null;
  @Input() paraFiltroClientes;
  @Input() info;
  @Input() colorHead = true;
  @Input() tablaHover = true;
  @Input() search = true;
  @Input() botones = {
    titulo: false,
    borrar: false,
    editar: false,
    mostrar: false,
  };

  @Input() seleccionado = -1;
  @Input() focusRow = false;
  @Input() filtroSelect: any;
  @Input() data;
  @Input() scrollContainer;
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

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice) {}

  ngOnInit() {
    this.necesarioStart();

    // if (this.search) {
    //   setTimeout(() => {
    //     this.element = document.getElementById('search') as HTMLElement;
    //     this.element.focus();
    //   }, 5);
    // }
  }

  async necesarioStart() {
    if (this.focusRow) {
      this.IDROW = this.ROW + _.toString(this.NUM);
    }

    await this.setDATATABLE();

    if (this.paraFiltroArticulos) {
      this.searchText = await this.paraFiltroArticulos;
      await this.searchItems();
      if (this.data.length === 0) {
        this.noArticulo.emit();
      }
    }

    if (this.paraFiltroClientes) {
      this.searchText = await this.paraFiltroClientes;
      await this.searchItems();
      if (this.data.length === 0) {
        this.dbServ.toastWarning('No existe cliente con el nombre introducido', 'AVISO');
      }
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
  mostrar = 50;
  listaMostrar = [5, 10, 20, 50];

  cambiaMostrar(num: number) {
    this.mostrar = num;
  }

  pageChange(arg) {
    this.pagActual = arg;
    const obj = {
      pagActual: arg,
      mostrar: this.mostrar,
    };
    this.pageChanges.emit(obj);
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
    }, 250);
  }

  async ngAfterViewInit() {
    // this.mdbTablePagination.setMaxVisibleItemsNumberTo(5);
    // this.mdbTablePagination.calculateFirstItemIndex();
    // this.mdbTablePagination.calculateLastItemIndex();
    this.cdRef.detectChanges();
  }

  changeVisibleItems(items) {
    this.mdbTablePagination.setMaxVisibleItemsNumberTo(items);
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
    this.entrar++;
  }
  ABAJO() {
    if (this.NUM === this.data.length - 1) {
      this.NUM = -1;
    }

    this.NUM = this.NUM + 1;
    this.IDROW = this.ROW + _.toString(this.NUM);
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
