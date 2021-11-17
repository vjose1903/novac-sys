import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
@Component({
  selector: 'app-btnacciones',
  templateUrl: './btnacciones.component.html',
  styleUrls: ['./btnacciones.component.scss'],
})
export class BTNACCIONESComponent implements OnInit {
  // @Input() botones = {
  //   titulo: false,
  //   borrar: false,
  //   editar: false,
  //   panico: false,
  //   mostrar: false,
  //   inventario: false,
  // };

  @Input() botones;

  @Input() row: any;
  @Input() i: any;
  @Input() data: any;

  @Output() panicoBTN = new EventEmitter<any>();
  @Output() DevolverInfoBTN = new EventEmitter<any>();
  @Output() deleteBTN = new EventEmitter<any>();
  constructor() {}

  ngOnInit() {}
  changePanico(nivel, item) {
    const obj = {
      NIVEL: nivel,
      ITEM: item,
    };
    this.panicoBTN.emit({ res: obj });
  }

  devolverInfo(arg, metodo) {
    const i = _.findIndex(this.data, (o: any) => {
      return o.id === arg.id;
    });
    const obj = {
      ARG: arg,
      METODO: metodo,
      INDEX: i,
    };
    this.DevolverInfoBTN.emit(obj);
  }

  delete(arg) {
    const i = _.findIndex(this.data, (o: any) => {
      return o.id === arg.id;
    });
    const obj = { ARG: arg, INDEX: i };
    this.deleteBTN.emit(obj);
  }
}
