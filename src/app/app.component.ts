import { Component, OnInit, ChangeDetectorRef, AfterContentChecked, NgZone, AfterViewInit } from '@angular/core';
import { LoaderService } from './loader/loader.service';
import { IpcService } from './core/services/ipc.service';
import { ELECTRON_EVENTS_OBSERVER, GLOBAL, MODIFIED_CONFIG_FILE } from './core/typescript/GLOBAL';

import { SingletonService } from './core/services/singleton.service';
import { HttpClient } from '@angular/common/http';
import { ModalService } from './admin/components/modal/modal.service';
import { LayoutService } from './admin/layout/layout.service';
import { ConfigurationService } from './core/services/configuration.service';
import { ThemeService } from './core/services/theme.service';
import { MessageTask } from './core/models/message-task';

import * as _ from 'lodash';
import {
  ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE,
  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS,
  ELECTRON_EVENT_UPDATE_ERROR,
  ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE,
  ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED,
  ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE,
  KEYWORD_ELECTRON_EVENT_DECRYPT,
  KEYWORD_ELECTRON_EVENT_ENCRYPT,
  KEYWORD_ELECTRON_GET_APP_CONFIG,
} from '../../electron/shared-electron-angular';
import { Subscription } from 'rxjs';
import { ConfigI } from './core/typescript/config-interface';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from './core/services/shared.service';
import { fun } from './core/services/functions.service';

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
  configReady = false;
  counter = 0;
  sub: Subscription;
  subModified: Subscription;

  constructor(
    public _ipc: IpcService,
    private loaderServ: LoaderService,
    private cdRef: ChangeDetectorRef,

    public zone: NgZone,
    public http: HttpClient,
    public mServ: ModalService,
    public layServ: LayoutService,
    public configServ: ConfigurationService,
    public themeService: ThemeService,
    public toastr: ToastrService,
    public sharedServ: SharedService,
  ) {}

  ngOnInit(): void {
    SingletonService.zone = this.zone;
    SingletonService.http = this.http;
    SingletonService.configServ = this.configServ;

    SingletonService.mServ = this.mServ;
    SingletonService._ipc = this._ipc;
    SingletonService.layServ = this.layServ;
    SingletonService.toastr = this.toastr;
    SingletonService.sharedServ = this.sharedServ;

    this.loaderServ.isLoading.subscribe((v) => (this.loading = v));

    this.subModified = MODIFIED_CONFIG_FILE.subscribe((res) => {
      if (fun.hasValue(res)) this.getAppConfig();
    });

    this.sub = ELECTRON_EVENTS_OBSERVER.subscribe((res) => {
      if (fun.hasValue(res)) {
        const info = res.info;
        switch (res.event_name) {
          case ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE:
            fun.logYellow(`${ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE} `, info);

            break;
          //
          case ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE:
            this.visible = true;
            break;
          //
          case ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS:
            this.downloadProgression(info.body);
            break;
          //
          case ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED:
            this.visible = false;
            break;
          //
          case ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE:
            fun.logBlue(`${ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE} `, info);

            break;
          //
          case ELECTRON_EVENT_UPDATE_ERROR:
            fun.toastError(info.msg, 'ERRROR');
            this.visible = false;
            break;
          //
          default:
            break;
        }
      }
    });

    // this.probandoEncriptar();
    this.getAppConfig();
  }

  downloadProgression(object) {
    this.zone.run(() => {
      if (this.counter == 1) this.visible = true;

      this.counter++;
      this.tiempo_restante = this.timeConvert(object.total / object.bytesPerSecond);

      object.transferred = parseFloat(fun.redondearAdos(object.transferred / 1000000));
      object.total = parseFloat(fun.redondearAdos(object.total / 1000000));
      object.percent = parseFloat(fun.redondearAdos(object.percent));

      this.objPercent = object;
      this.cdRef.detectChanges();
    });
  }

  async getAppConfig() {
    const task = new MessageTask(KEYWORD_ELECTRON_GET_APP_CONFIG);
    this._ipc
      .sendTask(task)
      .then((config: ConfigI) => {
        console.log('config ', config);
        if (_.has(config, 'err')) {
        } else {
          this.themeService.setTheme(config.color_app);
          this.configServ.setConfig = config;
          this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
          this.configReady = true;
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
  async probandoEncriptar() {
    const task = new MessageTask(KEYWORD_ELECTRON_EVENT_ENCRYPT, { hola: 'mundo' });

    this._ipc
      .sendTask(task)
      .then((res: string) => {
        this.probandoDesEncriptar(res);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  async probandoDesEncriptar(strEncripted: string) {
    const task = new MessageTask(KEYWORD_ELECTRON_EVENT_DECRYPT, strEncripted);

    this._ipc
      .sendTask(task)
      .then((res) => {})
      .catch((err) => {});
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
