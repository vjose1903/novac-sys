import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-facturas-adelantadas',
  templateUrl: './facturas-adelantadas.component.html',
  styleUrls: ['./facturas-adelantadas.component.scss'],
})
export class FacturasAdelantadasComponent implements OnInit {
  @Input() facturas_adelantadas;
  @Output() seleccionFactura = new EventEmitter<any>();
  info = [
    {
      titulo: 'Numero Fact',
      key: 'secuencia',
    },
    {
      titulo: 'NCF',
      key: 'numero_comprobante',
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Total Facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
  ];
  constructor() {}
  ngOnInit() {}
  SeleccionarFactruaAdelantada(arg) {
    this.seleccionFactura.emit(arg);
  }
}
