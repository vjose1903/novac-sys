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
import { SharedService } from '../../core/services/shared.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TablasService } from './tablas.service';
import { idLocale } from 'ngx-bootstrap';
import * as _ from 'lodash';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class TablasComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild(MdbTablePaginationComponent, { static: true })
  mdbTablePagination: MdbTablePaginationComponent;

  @ViewChild(MdbTableDirective, { static: false }) mdbTable: MdbTableDirective;

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
  IDROW = this.ROW + _.toString(this.NUM);

  // inputs
  @Input() paraFiltroArticulos;
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
  @Output() moverFoco = new EventEmitter<any>();
  @Output() noArticulo = new EventEmitter<any>();
  constructor(private cdRef: ChangeDetectorRef, private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit() {}

  ngOnChanges() {}
  searchItems() {
    this.NUM = 0;
    if (!this.searchText) {
      this.mdbTable.setDataSource(this.data);
      this.elements = this.mdbTable.getDataSource();
    }

    if (this.searchText) {
      this.data = this.mdbTable.searchLocalDataBy(this.searchText);
      this.mdbTable.setDataSource(this.elements);
    }
  }

  setDATATABLE() {
    this.data.forEach(element => {
      this.elements.push(element);
      this.previous.push(element);
    });

    this.mdbTable.setDataSource(this.elements);
    this.elements = this.mdbTable.getDataSource();
    this.previous = this.mdbTable.getDataSource();
  }

  ngAfterViewInit() {
    this.setDATATABLE();

    if (this.paraFiltroArticulos) {
      this.searchText = this.paraFiltroArticulos;
      setTimeout(() => {
        this.searchItems();
        if (this.data.length === 0) {
          this.noArticulo.emit();
        }
      }, 50);
    }
    if (this.focusRow) {
      this.IDROW = 'row-0';
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
    if (arg.id) {
      this.seleccionado = arg.id;
    }
    this.clickRow.emit(arg);
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
      this.element = document.getElementById(arg) as HTMLElement;
      this.element.click();
      this.moverFoco.emit();
    }
  }
}
