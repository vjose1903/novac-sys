import { Component, OnInit, ViewChild, AfterViewInit, HostListener, ChangeDetectorRef, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { MdbTablePaginationComponent, MdbTableDirective, MdbTableService } from 'angular-bootstrap-md';
import { SharedService } from '../../core/services/shared.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TablasService } from './tablas.service';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private route: ActivatedRoute,
    private tableService: MdbTableService,
  ) {}
  // variables
  elements: any[] = [];
  previous: any[] = [];
  searchText: string = '';

  ngOnInit() {
    // this.mdbTable.setDataSource(this.elements);
    // this.elements = this.mdbTable.getDataSource();
    // this.previous = this.mdbTable.getDataSource();
  }
  ngOnDestroy() {}

  searchItems() {
    const prev = this.tableService.getDataSource();

    if (!this.searchText) {
      this.tableService.setDataSource(this.previous);
      this.elements = this.tableService.getDataSource();
      // this.previous = this.tableService.getDataSource();
    }

    if (this.searchText) {
      this.elements = this.tableService.searchLocalDataBy(this.searchText);
      this.tableService.setDataSource(prev);
    }
  }

  setDATATABLE() {
    this.data.forEach(element => {
      this.elements.push(element);
    });

    // this.tableService.setDataSource(this.elements);
    // this.elements = this.tableService.getDataSource();
    // this.previous = this.tableService.getDataSource();
  }

  ngAfterViewInit() {
    this.setDATATABLE();
    // this.mdbTablePagination.setMaxVisibleItemsNumberTo(5);
    // this.mdbTablePagination.calculateFirstItemIndex();
    // this.mdbTablePagination.calculateLastItemIndex();

    this.cdRef.detectChanges();
  }

  changeVisibleItems(items) {
    this.mdbTablePagination.setMaxVisibleItemsNumberTo(items);
  }
}
