import { Component, OnInit, ViewChild, AfterViewInit, HostListener, ChangeDetectorRef, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { MdbTablePaginationComponent, MdbTableDirective } from 'angular-bootstrap-md';
import { SharedService } from '../../core/services/shared.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TablasService } from './tablas.service';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class TablasComponent implements OnInit, AfterViewInit {
  @ViewChild(MdbTablePaginationComponent, { static: true })
  mdbTablePagination: MdbTablePaginationComponent;

  @ViewChild(MdbTableDirective, { static: false }) mdbTable: MdbTableDirective;

  @HostListener('input') oninput() {
    this.searchItems();
  }

  // variables
  elements: any[] = [];
  previous: any = [];
  searchText = '';

  // inputs
  // @Input() data: Array<any>;
  @Input() paraFiltroArticulos;
  @Input() info: Array<any>;
  @Input() botones = {
    titulo: false,
    borrar: false,
    editar: false,
    mostrar: false,
  };

  @Input() seleccionado = -1;
  @Input() filtroSelect: any;
  @Input() data: any[] = [];
  @Input() scrollContainer;
  @Input() colores = false;

  // output
  @Output() panico = new EventEmitter<any>();
  @Output() clickRow = new EventEmitter<any>();
  @Output() DevolverInfo = new EventEmitter<any>();
  @Output() DELETE = new EventEmitter<any>();
  constructor(private cdRef: ChangeDetectorRef, private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit() {}

  searchItems() {
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
      }, 50);
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
    // console.log(arg);
  }

  changePanico(arg) {
    this.panico.emit(arg);
  }

  devolverInfo(arg) {
    this.DevolverInfo.emit(arg);
  }

  delete(arg) {
    this.DELETE.emit(arg);
  }
}
