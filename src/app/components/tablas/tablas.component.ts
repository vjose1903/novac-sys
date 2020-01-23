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
import { idLocale } from 'ngx-bootstrap';
import * as _ from 'lodash';
import { DBservice } from '../../core/services/bdservice.service';
import { GLOBAL } from '../../core/services/GLOBAL';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class TablasComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild(MdbTablePaginationComponent, { static: true })
  mdbTablePagination: MdbTablePaginationComponent;

  @ViewChild(MdbTableDirective, { static: false }) mdbTable: MdbTableDirective;
  cantiTootip: string;

  @HostListener('input') oninput() {
    this.searchItems();
  }

  key;
  element: HTMLElement;
  entrar = 0;
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    // arriba 38
    // abajo 40

    setTimeout(() => {
      if (this.focusRow) {
        this.key = event.keyCode;
        if (this.key === 38) {
          event.stopPropagation();
          this.ARRIBA();
        } else if (this.key === 40) {
          this.ABAJO();
        } else if (this.key === 13) {
          this.ENTER(this.IDROW);
        }
      }
    }, 50);
  }

  // variables
  elements: any[] = [];
  previous: any = [];
  searchText = '';
  ROW = 'row-';
  NUM = 0;
  IDROW;

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
  @Input() data: any[] = [];
  @Input() scrollContainer;
  @Input() colores = false;

  // output
  @Output() clickRow = new EventEmitter<any>();
  @Output() DevolverInfo = new EventEmitter<any>();
  @Output() DELETE = new EventEmitter<any>();
  @Output() reinicioModal = new EventEmitter<any>();
  @Output() noArticulo = new EventEmitter<any>();

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice) {}

  ngOnInit() {
    // if (this.search) {
    //   setTimeout(() => {
    //     this.element = document.getElementById('search') as HTMLElement;
    //     this.element.focus();
    //   }, 5);
    // }
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(num);
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
    if (simpleChanges['data'].firstChange === false) {
      this.waitForChange();
    }
  }

  async waitForChange() {
    await this.setDATATABLE();
  }

  searchItems() {
    const prev = JSON.parse(JSON.stringify(this.previous));

    if (!this.searchText) {
      this.mdbTable.setDataSource(this.previous);
      this.data = this.mdbTable.getDataSource();
    }

    if (this.searchText) {
      this.data = this.mdbTable.searchLocalDataBy(this.searchText);
      this.mdbTable.setDataSource(prev);
    }
  }

  setDATATABLE() {
    this.elements = [];
    this.previous = [];

    this.data.forEach(element => {
      this.elements.push(element);
      this.previous.push(element);
    });

    if (this.elements !== undefined) {
      this.mdbTable.setDataSource(this.elements);
    }
    this.elements = this.mdbTable.getDataSource();
    this.previous = this.mdbTable.getDataSource();
  }

  async ngAfterViewInit() {
    await this.setDATATABLE();

    if (this.paraFiltroArticulos) {
      this.searchText = this.paraFiltroArticulos;
      setTimeout(() => {
        this.searchItems();
        if (this.data.length === 0) {
          this.noArticulo.emit();
        }
      }, 50);
    }
    if (this.paraFiltroClientes) {
      this.searchText = this.paraFiltroClientes;
      await setTimeout(() => {
        this.searchItems();
        if (this.data.length === 0) {
          this.dbServ.toastWarning('No existe cliente con el nombre introducido', 'AVISO');
        }
      }, 50);
    }
    if (this.focusRow) {
      this.IDROW = this.ROW + _.toString(this.NUM);
    }

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
      this.dbServ.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR');
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
      this.element = document.getElementById(arg) as any;
      this.element.click();
      // this.reinicioModal.emit();
    }
  }
}
