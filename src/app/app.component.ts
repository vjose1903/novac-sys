import { Component, OnInit } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { ObservableServcie } from './core/services/observables.service';
import { DBservice } from './core/services/bdservice.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private dbServ: DBservice, public electronService: ElectronService, private translate: TranslateService, private obsServ: ObservableServcie) {}

  ngOnInit(): void {
    this.dbServ.getArticulos().subscribe(res => {
      this.obsServ.next_articulo(res);
    });

    this.dbServ.getTiposFacturas().subscribe(res => {
      this.obsServ.next_tipo_factura(res);
    });

    this.dbServ.getSecuenciaFacturas().subscribe(res => {
      this.obsServ.next_secuencia_factura(res);
    });
  }
}
