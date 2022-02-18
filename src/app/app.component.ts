import { Component, OnInit, ChangeDetectorRef, AfterContentChecked, NgZone, AfterViewInit } from '@angular/core';
import { LoaderService } from './loader/loader.service';
import { IpcService } from './core/services/ipc.service';
import { GLOBAL } from './core/typescript/GLOBAL';
import { FunctionService } from './core/services/functions.service';
import { SingletonService } from './core/services/singleton.service';
import { HttpClient } from '@angular/common/http';
import { ModalService } from './admin/components/modal/modal.service';
import { LayoutService } from './admin/layout/layout.service';
import { ConfigurationI, ConfigurationService } from './core/services/configuration.service';
import { ThemeService } from './core/services/theme.service';
import { MessageTask } from './core/models/message-task';
import { KEYWORD_ELECTRON_EVENT_DECRYPT, KEYWORD_ELECTRON_EVENT_ENCRYPT, KEYWORD_ELECTRON_GET_APP_CONFIG } from '../../shared-electron-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterContentChecked, AfterViewInit {
  loading = false;
  objProgress;
  visible = false;
  imgLogo;
  tiempo_restante;
  objPercent;

  counter = 0;

  constructor(
    public _ipc: IpcService,
    private loaderServ: LoaderService,
    private cdRef: ChangeDetectorRef,

    public fun: FunctionService,
    public zone: NgZone,
    public http: HttpClient,
    public mServ: ModalService,
    public layServ: LayoutService,
    public configServ: ConfigurationService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    SingletonService.fun = this.fun;
    SingletonService.zone = this.zone;
    SingletonService.http = this.http;
    SingletonService.configServ = this.configServ;

    SingletonService.mServ = this.mServ;
    SingletonService._ipc = this._ipc;
    SingletonService.layServ = this.layServ;

    this.loaderServ.isLoading.subscribe((v) => {
      this.loading = v;
    });

    this._ipc.on('checking-for-update', (event: Electron.IpcMessageEvent, res) => {});

    this._ipc.on('update-error', (event: Electron.IpcMessageEvent, res) => {
      this.zone.run(() => {
        if (res) {
          this.fun.toastError(res.msg, 'ERRROR');
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

    // this.probandoEncriptar();
    this.getAppConfig();
  }

  async getAppConfig() {
    const task = new MessageTask(KEYWORD_ELECTRON_GET_APP_CONFIG);
    this._ipc
      .sendTask(task)
      .then((config: ConfigurationI) => {
        this.themeService.setTheme(config.color_app);
        this.configServ.setConfig = config;
        this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
      })
      .catch((err) => {
        console.error(err);
      });
  }
  async probandoEncriptar() {
    console.log('----- probandoEncriptar -----');

    const task = new MessageTask(KEYWORD_ELECTRON_EVENT_ENCRYPT, { hola: 'mundo' });

    this._ipc
      .sendTask(task)
      .then((res: string) => {
        this.probandoDesEncriptar(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async probandoDesEncriptar(strEncripted: string) {
    console.log('----- probandoDesEncriptar -----');

    const task = new MessageTask(KEYWORD_ELECTRON_EVENT_DECRYPT, strEncripted);

    this._ipc
      .sendTask(task)
      .then((res) => {
        console.log('res decript:: ', res);
      })
      .catch((err) => {
        console.log('err:: ', err);
      });
  }

  ngAfterViewInit(): void {
    // this.themeService.setTheme('blue');
    // this.themeService.setTheme('red');
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
