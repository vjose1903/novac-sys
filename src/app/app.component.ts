import { Component, OnInit, ChangeDetectorRef, AfterContentChecked, NgZone, AfterViewInit } from '@angular/core';
import { LoaderService } from './loader/loader.service';
import { IpcService } from './core/services/ipc.service';
import { ELECTRON_EVENTS_OBSERVER, MODIFIED_CONFIG_FILE } from './core/typescript/GLOBAL';
import * as _ from 'lodash';
import { Ss } from './core/services/singleton.service';
import { HttpClient } from '@angular/common/http';
import { LayoutService } from './admin/layout/layout.service';
import { ConfigurationService } from './core/services/configuration.service';
import { ThemeService } from './core/services/theme.service';
import { MessageTask } from './core/models/message-task';

import {
  ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE,
  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS,
  ELECTRON_EVENT_UPDATE_ERROR,
  ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE,
  ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED,
  ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE,
  KEYWORD_ELECTRON_QUIT_APP,
  KEYWORD_ELECTRON_GET_APP_CONFIG,
} from '../../electron/shared-electron-angular';

import { Subscription } from 'rxjs';
import { ConfigI } from './core/typescript/config-interface';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from './core/services/shared.service';
import { fun } from './core/services/functions.service';
import { MixinClass } from './core/typescript/MixinClass';
import { NgxPermissionsService } from 'ngx-permissions';
import { FacturacionService } from './admin/facturacion/facturacion.service';
import { TiposFacturaC } from './admin/facturacion/factura';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends MixinClass implements OnInit, AfterContentChecked, AfterViewInit {
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
    public loaderServ: LoaderService,
    private cdRef: ChangeDetectorRef,

    public zone: NgZone,
    public http: HttpClient,

    public factServ: FacturacionService,
    public layServ: LayoutService,
    public configServ: ConfigurationService,
    public themeService: ThemeService,
    public toastr: ToastrService,
    public sharedServ: SharedService,
    public permissionsService: NgxPermissionsService,
  ) {
    super();
  }

  ngOnInit(): void {
    Ss.http = this.http;
    Ss.zone = this.zone;
    Ss.configServ = this.configServ;
    Ss._ipc = this._ipc;
    Ss.factServ = this.factServ;

    Ss.permissionsService = this.permissionsService;
    Ss.loadServ = this.loaderServ;
    Ss.layServ = this.layServ;
    Ss.toastr = this.toastr;
    Ss.sharedServ = this.sharedServ;
    Ss.cdRef = this.cdRef;



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
            fun.logOrange(`${ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE} `, info);
            break;
          //
          case ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS:
            this.visible = true;
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
          case KEYWORD_ELECTRON_QUIT_APP:
            this.cerrar_app();

            break;
          //
          case ELECTRON_EVENT_UPDATE_ERROR:
            fun.toastError(info.msg, 'ERRROR');
            this.visible = false;
            break;
          //
          case 'test':
            break;
          //
          default:
            break;
        }
      }
    });

    window.onresize = (e) => this.resize.bind(this)(e);
  }

  ngAfterViewInit(): void {
    fun.setWindowSize(window);

    this.getAppConfig().then((config) => {
      setTimeout(() => (this.configReady = true), 250);
    });
  }

  getActualPath() {
    const location = window.location.href;
    const initSlice = location.indexOf('/admin') == -1 ? location.indexOf('/auth') : location.indexOf('/admin');
    const actualPath = location.slice(initSlice, location.length);
    return actualPath;
  }

  cerrar_app() {
    this.openNewModal({
      html: `<p> ESTAS A PUNTO DE CERRAR EL PROGRAMA NOVAC, ¿Desea continuar? </p>`,
      id: 'cerrar_app',
      header: 'CONFIRMACION DE CIERRE',
      width: '56.25rem',
      height: '31.25rem',
      botones: {
        aceptar: { show: true, disable: false },
        cancelar: { show: true, disable: false },
      },
    });
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  resize() {
    fun.setWindowSize(window);
  }

  downloadProgression(object) {
    this.zone.run(() => {
      if (this.counter == 1) this.visible = true;

      this.counter++;
      this.tiempo_restante = this.timeConvert(object.total / object.bytesPerSecond);

      object.transferred = parseFloat(fun.redondearNum(object.transferred / 1000000));
      object.total = parseFloat(fun.redondearNum(object.total / 1000000));
      object.percent = parseFloat(fun.redondearNum(object.percent));

      this.objPercent = object;
      this.cdRef.detectChanges();
    });
  }

  async getAppConfig() {
    return new Promise<any>((resolve, reject) => {
      const task = new MessageTask(KEYWORD_ELECTRON_GET_APP_CONFIG);

      this._ipc
        .sendTask(task)
        .then((config: ConfigI) => {
          if (fun.objHas(config, 'err')) {
          } else {
            this.themeService.setTheme(config.color_app);
            this.configServ.setConfig = config;
            this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;

            resolve(config);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
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
}
