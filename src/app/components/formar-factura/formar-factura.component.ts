import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-formar-factura',
  templateUrl: './formar-factura.component.html',
  styleUrls: ['./formar-factura.component.scss'],
})
export class FormarFacturaComponent implements OnInit {
  @Input() factura;
  constructor() {}

  ngOnInit() {}
}
