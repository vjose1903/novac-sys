import { Component, OnInit } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { ObservableServcie } from './core/services/observables.service';
import { DBservice } from './core/services/bdservice.service';
import { LoaderService } from './loader/loader.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  loading: boolean;
  constructor(
    private loaderServ: LoaderService,
    private spinner: NgxSpinnerService,
    private dbServ: DBservice,
    public electronService: ElectronService,
    private translate: TranslateService,
    private obsServ: ObservableServcie,
  ) {
    this.loaderServ.isLoading.subscribe(v => {
      this.loading = v;

      if (this.loading) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    });
  }

  ngOnInit(): void {
    // this.dbServ.getSecuenciaFacturas().subscribe(res => {
    //   this.obsServ.next_secuencia_factura(res);
    // });
  }
}
