import { Component, OnInit, ViewChild, AfterViewInit, HostListener, ChangeDetectorRef, Input } from '@angular/core';
import { MdbTablePaginationComponent, MdbTableDirective } from 'angular-bootstrap-md';
import { SharedService } from '../../core/services/shared.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tablas',
  templateUrl: './tablas.component.html',
  styleUrls: ['./tablas.component.scss'],
})
export class TablasComponent implements OnInit, AfterViewInit {
  @ViewChild(MdbTablePaginationComponent, { static: true })
  mdbTablePagination: MdbTablePaginationComponent;

  @ViewChild(MdbTableDirective, { static: true }) mdbTable: MdbTableDirective;
  previous: any = [];
  searchText = '';
  @Input() data = [];
  @Input() tituloList = [];
  constructor(private cdRef: ChangeDetectorRef, private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit() {}

  searchItems() {
    const prev = this.mdbTable.getDataSource();

    if (!this.searchText) {
      this.mdbTable.setDataSource(this.previous);
      this.data = this.mdbTable.getDataSource();
    }

    if (this.searchText) {
      this.data = this.mdbTable.searchLocalDataBy(this.searchText);
      this.mdbTable.setDataSource(prev);
    }
  }

  ngAfterViewInit() {
    // this.mdbTablePagination.setMaxVisibleItemsNumberTo(5);
    // this.mdbTablePagination.calculateFirstItemIndex();
    // this.mdbTablePagination.calculateLastItemIndex();
    this.cdRef.detectChanges();
  }

  @HostListener('input') oninput() {
    this.searchItems();
  }

  changeVisibleItems(items) {
    this.mdbTablePagination.setMaxVisibleItemsNumberTo(items);
  }
}
