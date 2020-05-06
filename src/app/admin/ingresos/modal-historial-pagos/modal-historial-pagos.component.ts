import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-modal-historial-pagos',
  templateUrl: './modal-historial-pagos.component.html',
  styleUrls: ['./modal-historial-pagos.component.scss'],
})
export class ModalHistorialPagosComponent implements OnInit {
  @Input() pagos;
  info = [
    {
      titulo: 'NO. recibo',
      key: 'numero_recibo',
    },
    {
      titulo: 'Abonado',
      key: 'deposito',
      formatoNumero: true,
    },
    {
      titulo: 'Fecha abono',
      key: 'recibo_created_at',
    },
  ];

  constructor() {}

  ngOnInit() {}
}
