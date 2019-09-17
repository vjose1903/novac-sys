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
export class TablasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MdbTablePaginationComponent, { static: true }) mdbTablePagination: MdbTablePaginationComponent;

  @ViewChild(MdbTableDirective, { static: true }) mdbTable: MdbTableDirective;

  @HostListener('input') oninput() {
    this.searchItems();
  }

  // inputs
  @Input() data: any[] = [];
  @Input() info: Array<any>;

  // output
  @Output() actualizarData = new EventEmitter<boolean>();

  constructor(
    private cdRef: ChangeDetectorRef,
    private taServ: TablasService,
    private shServ: SharedService,
    private fb: FormBuilder,
    private route: ActivatedRoute, // private tableService: MdbTableService,
  ) {}
  // variables
  elements: any[] = [];
  previous: any[] = [];
  searchText = '';

  ngOnInit() {}
  ngOnDestroy() {}

  searchItems() {
    if (!this.searchText) {
      this.mdbTable.setDataSource(this.previous);
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
    // this.mdbTablePagination.setMaxVisibleItemsNumberTo(5);
    // this.mdbTablePagination.calculateFirstItemIndex();
    // this.mdbTablePagination.calculateLastItemIndex();

    this.cdRef.detectChanges();
  }

  changeVisibleItems(items) {
    // this.mdbTablePagination.setMaxVisibleItemsNumberTo(items);
  }
}
