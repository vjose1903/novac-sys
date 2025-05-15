import { Component, inject, OnInit } from '@angular/core';
import { TablasService } from '@core/components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { LoaderService } from 'app/loader/loader.service';
import { FacturasRecibidasC } from './facturas-recibidas.model';

@Component({
  selector: 'app-facturas-recibidas',
  templateUrl: './facturas-recibidas.component.html',
  styleUrl: './facturas-recibidas.component.scss',
  standalone: true,
  imports: [],
})
export class FacturasRecibidasComponent extends MixinClass implements OnInit {
  tServ = inject(TablasService);
  loadServ = inject(LoaderService);

  facturasRecibidasClass = new FacturasRecibidasC();

  constructor() {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'aprobaciones_comerciales_recibidas', is_routing: true });
    this.necesarioParaEmpezar();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  necesarioParaEmpezar() {}
}
