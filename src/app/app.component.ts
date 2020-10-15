import { Component, OnInit, AfterViewInit, AfterContentInit, ChangeDetectorRef, OnChanges } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { ObservableServcie } from './core/services/observables.service';
import { DBservice } from './core/services/bdservice.service';
import { LoaderService } from './loader/loader.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { IpcService } from './core/services/ipc.service';
import { GLOBAL } from './core/services/GLOBAL';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  loading = false;
  noServer = false;
  objProgress;
  displayPercent = false;
  constructor(
    private _ipc: IpcService,
    private dbServ: DBservice,
    private loaderServ: LoaderService,
    private spinner: NgxSpinnerService,
    private cdRef: ChangeDetectorRef,
    public electronService: ElectronService,
  ) {
    // setInterval(() => {
    //   this.buscarNoServer();
    // }, 20000);

    this.loaderServ.isLoading.subscribe((v) => {
      setTimeout(() => {
        // this.loading = true;
        this.loading = v;
      }, 5);

      // if (this.loading) {
      //   document.getElementById('fondoC').classList.add('fadeIn');
      // } else {
      //   document.getElementById('fondoC').classList.add('fadeOut');
      // }
    });
  }

  buscarNoServer() {
    this.dbServ.getTipoArticuloById(1).subscribe(
      (res) => {
        if (this.noServer) {
          window.location.reload();
        }
        this.noServer = false;
      },
      (err) => {
        if (err.status === 0) {
          this.noServer = true;
        } else {
          this.noServer = false;
        }
      },
    );
  }

  ngOnInit(): void {
    this.buscarNoServer();
    // this.dbServ.getSecuenciaFacturas().subscribe(res => {
    //   this.obsServ.next_secuencia_factura(res);
    // });

    this._ipc.on(' checking-for-update', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);
    });
    this._ipc.on('update-error', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);
    });
    this._ipc.on('update-available', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);
    });

    this._ipc.on('download-progress', (event: Electron.IpcMessageEvent, res) => {
      if (res && res.body) {
        this.displayPercent = true;

        res.body.transferred = GLOBAL.redondearAdos(res.body.transferred);
        res.body.total = GLOBAL.redondearAdos(res.body.total);
        res.body.percent = GLOBAL.redondearAdos(res.body.percent);

        this.objProgress = res.body;
      }
      console.log(res);
    });

    this._ipc.on('update-downloaded', (event: Electron.IpcMessageEvent, res) => {
      this.displayPercent = false;
      console.log(res);
    });

    this._ipc.on('log', (event: Electron.IpcMessageEvent, res) => {
      console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-');
      console.log('MAIN LOG');
      console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-');
      console.log(res);
      console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-');
    });
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
}
