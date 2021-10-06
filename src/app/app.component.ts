import { Component, OnInit, ChangeDetectorRef, AfterContentChecked, NgZone } from '@angular/core';
import { DBservice } from './core/services/bdservice.service';
import { LoaderService } from './loader/loader.service';
import { IpcService } from './core/services/ipc.service';
import { GLOBAL } from './core/services/GLOBAL';
import { AppConfig } from '../environments/environment';
import { FunctionService } from './core/services/functions.service';
import { SingletonService } from './core/services/singleton.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterContentChecked {
  loading = false;
  objProgress;
  visible = false;
  imgLogo = AppConfig.imgLogo;
  tiempo_restante;
  objPercent;

  counter = 0;

  constructor(
    public _ipc: IpcService,
    private dbServ: DBservice,
    private loaderServ: LoaderService,
    private cdRef: ChangeDetectorRef,
    public fun: FunctionService,
    private router: Router,
    public zone: NgZone,
    public http: HttpClient,
  ) {}

  ngOnInit(): void {
    SingletonService.fun = this.fun;
    SingletonService.zone = this.zone;
    SingletonService.http = this.http;

    this.loaderServ.isLoading.subscribe((v) => {
      this.loading = v;
    });

    this._ipc.on('checking-for-update', (event: Electron.IpcMessageEvent, res) => {});

    this._ipc.on('update-error', (event: Electron.IpcMessageEvent, res) => {
      this.zone.run(() => {
        if (res) {
          this.dbServ.toastError(res.msg, 'ERRROR', true);
          this.visible = false;
        }
      });
    });

    this._ipc.on('update-available', (event: Electron.IpcMessageEvent, res) => {
      this.zone.run(() => (this.visible = true));
    });

    this._ipc.on('download-progress', (event: Electron.IpcMessageEvent, res) => {
      this.zone.run(() => {
        if (res && res.body) {
          if (this.counter == 1) this.visible = true;

          this.counter++;
          this.tiempo_restante = this.timeConvert(res.body.total / res.body.bytesPerSecond);

          res.body.transferred = parseFloat(GLOBAL.redondearAdos(res.body.transferred / 1000000));
          res.body.total = parseFloat(GLOBAL.redondearAdos(res.body.total / 1000000));
          res.body.percent = parseFloat(GLOBAL.redondearAdos(res.body.percent));

          this.objPercent = res.body;

          // try {
          //   if (document.getElementById('imagenLogo')) document.getElementById('imagenLogo').click();
          // } catch (error) {
          //   console.error(error);
          // }
        }
      });
    });

    this._ipc.on('update-downloaded', (event: Electron.IpcMessageEvent, res) => {
      this.zone.run(() => (this.visible = false));
    });

    this.getPrintersName();
  }

  getPrintersName() {
    this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });

    this._ipc.send('printerNames');
  }

  timeConvert(d) {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? ' hora, ' : ' horas, ') : '';
    const mDisplay = m > 0 ? m + (m === 1 ? ' minuto, ' : ' minutos, ') : '';
    const sDisplay = s > 0 ? s + (s === 1 ? ' segundo' : ' segundos') : '';
    return hDisplay + mDisplay + sDisplay;
  }

  duplicarDataProgreso(json) {}

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }
}
