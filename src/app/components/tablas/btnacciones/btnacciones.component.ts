import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-btnacciones',
  templateUrl: './btnacciones.component.html',
  styleUrls: ['./btnacciones.component.scss'],
})
export class BTNACCIONESComponent implements OnInit {
  @Input() botones = {
    titulo: false,
    borrar: false,
    editar: false,
    panico: false,
    mostrar: false,
  };
  @Input() row: any;

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
    const obj = {
      ARG: arg,
      METODO: metodo,
    };
    this.DevolverInfoBTN.emit(obj);
  }

  delete(arg) {
    this.deleteBTN.emit(arg);
  }
}
