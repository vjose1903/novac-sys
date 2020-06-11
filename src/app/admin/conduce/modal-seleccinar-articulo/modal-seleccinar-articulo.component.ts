import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-modal-seleccinar-articulo',
  templateUrl: './modal-seleccinar-articulo.component.html',
  styleUrls: ['./modal-seleccinar-articulo.component.scss'],
})
export class ModalSeleccinarArticuloComponent implements OnInit {
  @Input() articulos;
  constructor() {}

  ngOnInit() {
    console.log(this.articulos);

    this.parsearInfo();
  }
  parsearInfo() {
    for (let i = 0; i < this.articulos.length; i++) {
      const element = this.articulos[i];
      console.log(element);
    }
  }
}
