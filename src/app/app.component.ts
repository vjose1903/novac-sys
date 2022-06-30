import { Component, OnInit, ChangeDetectorRef, AfterContentChecked, NgZone, AfterViewInit } from '@angular/core';
import { LoaderService } from './loader/loader.service';
import { IpcService } from './core/services/ipc.service';
import { ELECTRON_EVENTS_OBSERVER, GLOBAL, MODIFIED_CONFIG_FILE } from './core/typescript/GLOBAL';

import { SingletonService } from './core/services/singleton.service';
import { HttpClient } from '@angular/common/http';
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
  KEYWORD_ELECTRON_QUIT_APP,
  KEYWORD_ELECTRON_GET_APP_CONFIG,
} from '../../electron/shared-electron-angular';

import { Subscription } from 'rxjs';
import { ConfigI } from './core/typescript/config-interface';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from './core/services/shared.service';
import { fun } from './core/services/functions.service';
import { CurrentUserService } from './core/services/current-user.service';
import { MixinClass } from './core/typescript/MixinClass';
import { PdfService } from './core/services/pdf/pdf.service';

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
    private loaderServ: LoaderService,
    private cdRef: ChangeDetectorRef,

    public zone: NgZone,
    public http: HttpClient,

    public layServ: LayoutService,
    public configServ: ConfigurationService,
    public themeService: ThemeService,
    public toastr: ToastrService,
    public sharedServ: SharedService,
    public pdfServ: PdfService,

    private currentUserServ: CurrentUserService,
  ) {
    super();
  }

  ngOnInit(): void {
    const location = window.location.href;

    SingletonService.http = this.http;
    SingletonService.zone = this.zone;
    SingletonService.configServ = this.configServ;

    SingletonService.layServ = this.layServ;
    SingletonService.toastr = this.toastr;
    SingletonService.sharedServ = this.sharedServ;
    SingletonService.pdfServ = this.pdfServ;
    SingletonService.cdRef = this.cdRef;

    this.loaderServ.isLoading.subscribe((v) => (this.loading = v));

    this.subModified = MODIFIED_CONFIG_FILE.subscribe((res) => {
      if (fun.hasValue(res)) this.getAppConfig();
    });

    this.sub = ELECTRON_EVENTS_OBSERVER.subscribe((res) => {
      console.log(' ');
      console.log('res ', res);
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
            console.log('res ', res);
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
    this.getAppConfig();
  }

  getActualPath() {
    const location = window.location.href;
    const initSlice = location.indexOf('/admin') == -1 ? location.indexOf('/auth') : location.indexOf('/admin');
    const actualPath = location.slice(initSlice, location.length);
    return actualPath;
  }

  cerrar_app() {
    this.handleModalForm({
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

      object.transferred = parseFloat(fun.redondearAdos(object.transferred / 1000000));
      object.total = parseFloat(fun.redondearAdos(object.total / 1000000));
      object.percent = parseFloat(fun.redondearAdos(object.percent));

      this.objPercent = object;
      this.cdRef.detectChanges();
    });
  }

  async getAppConfig() {
    const task = new MessageTask(KEYWORD_ELECTRON_GET_APP_CONFIG);
    const actualPath = this.getActualPath();

    this._ipc
      .sendTask(task)
      .then((config: ConfigI) => {
        if (_.has(config, 'err')) {
        } else {
          this.themeService.setTheme(config.color_app);
          this.configServ.setConfig = config;
          this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;

          if (!actualPath.includes('login') && !actualPath.includes('config')) this.validateUserAndLoadPermisos(actualPath);
          else this.configReady = true;
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  validateUserAndLoadPermisos(actualPath) {
    this.currentUserServ
      .validateUser()
      .then((res) => setTimeout(() => (this.configReady = true), 500))
      .catch((error) => {
        this.configReady = true;
        fun.logRed('actualPath: ', actualPath);
        fun.logBlue('error: ', error);

        if (actualPath != '/' && !actualPath.includes('login') && !actualPath.includes('config') && (error.razon == 'sesion_expired' || error.razon == 'no_token')) this.logOut();
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

  logOut() {
    this.layServ.nextLogOut({ bool: true, quien: 'appComponent' });
  }
}
