import { Component, inject, OnInit } from '@angular/core';
import { TablasService } from '@core/components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { LoaderService } from 'app/loader/loader.service';
import { CommertialApprovalC } from './aprobaciones-comerciales-recibidas.model';
@Component({
  selector: 'app-aprobaciones-comerciales-recibidas',
  imports: [],
  templateUrl: './aprobaciones-comerciales-recibidas.component.html',
  styleUrl: './aprobaciones-comerciales-recibidas.component.scss',
  standalone: true,
})
export class AprobacionesComercialesRecibidasComponent extends MixinClass implements OnInit {
  tServ = inject(TablasService);
  loadServ = inject(LoaderService);

  commertialApprovalClass = new CommertialApprovalC();

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
