import { PrimengModule } from './modules/primeng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NewModalModule } from './core/components/modal/modal.module';
import { FormulariosEnModalesModule } from './core/components/formularios en modales/formularios-en-modales.module';
import { Component, OnInit, ChangeDetectorRef, AfterContentChecked, NgZone, AfterViewInit, HostListener, inject, OnDestroy } from '@angular/core';
import { LoaderService } from './loader/loader.service';
import { IpcService } from '@core/services/ipc.service';
import { MODIFIED_CONFIG_FILE } from '@core/typescript/GLOBAL';
import * as _ from 'lodash';
import { Ss } from '@core/services/singleton.service';
import { HttpClient } from '@angular/common/http';
import { LayoutService } from '@admin/layout/layout.service';
import { ConfigurationService } from '@core/services/configuration.service';
import { ThemeService } from '@core/services/theme.service';
import { MessageTask } from '@core/models/message-task';

import {
  ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE,
  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS,
  ELECTRON_EVENT_UPDATE_ERROR,
  ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE,
  ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED,
  ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE,
  ELECTRON_CLOSE_CONFIRMATION,
  ELECTRON_SHOW_CLOSE_CONFIRMATION,
  ELECTRON_GET_APP_CONFIG,
  ELECTRON_EVENT_DOWNLOAD_UPDATE,
} from '../../electron/shared-electron-angular';

import { Subscription, takeUntil, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '@core/services/shared.service';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { NgxPermissionsService } from 'ngx-permissions';
import { FacturacionService } from '@admin/facturacion/facturacion.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { log } from 'console';
import { ModalClass } from './core/components/modal/modal-class';
import { TipoFacturaI, TiposFacturaC } from '@admin/facturacion/factura';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PrimengModule, FormsModule, ReactiveFormsModule, NewModalModule, FormulariosEnModalesModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends MixinClass implements OnInit, AfterContentChecked, AfterViewInit, OnDestroy {
  // Servicios inyectados usando inject()
  public _ipc = inject(IpcService);
  public loaderServ = inject(LoaderService);
  public cdRef = inject(ChangeDetectorRef);
  public zone = inject(NgZone);
  public http = inject(HttpClient);
  public factServ = inject(FacturacionService);
  public layServ = inject(LayoutService);
  public configServ = inject(ConfigurationService);
  public themeService = inject(ThemeService);
  public toastr = inject(ToastrService);
  public sharedServ = inject(SharedService);
  public permissionsService = inject(NgxPermissionsService);

  // Subject para manejar la destrucción del componente
  private readonly destroy$ = new Subject<void>();

  // Propiedades del componente
  loading = false;
  objProgress: any;
  visible = false;
  imgLogo: string;
  tiempo_restante: string;
  objPercent: any;
  counter = 0;
  isReady = false;

  tipoFacturaClass = new TiposFacturaC();

  // Mapa de eventos de Electron para mejor organización
  private readonly electronEventHandlers = {
    [ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE]: (data: any) => {
      fun.logYellow(`${ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE} `, data);
    },
    [ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE]: (data: any) => {
      fun.logOrange(`${ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE} `, data);
      this.mostrar_modal_actualizacion(data);
    },
    [ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS]: (data: any) => {
      this.visible = true;
      fun.logGreen(`${ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS} `, data);
      this.downloadProgression(data.body);
    },
    [ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED]: () => {
      this.visible = false;
    },
    [ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE]: (data: any) => {
      fun.logBlue(`${ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE} `, data);
    },
    [ELECTRON_EVENT_UPDATE_ERROR]: (data: any) => {
      fun.logRed(`${ELECTRON_EVENT_UPDATE_ERROR} `, data);
      fun.toastError(data.msg, 'ERRROR');
      this.visible = false;
    },
    [ELECTRON_SHOW_CLOSE_CONFIRMATION]: () => {
      const token = fun.getAuthToken();
      if (fun.hasValue(token)) {
        this.cerrar_app();
      } else {
        this.sendCloseConfirmation();
      }
    },
    test: () => {
      // Evento de prueba
    },
  };

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
      event.preventDefault();
      fun.reloadElectron();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    fun.setWindowSize(window);
  }

  constructor() {
    super();
    this.initializeSingletonServices();
  }

  async ngOnInit(): Promise<void> {
    // Cargar configuración al inicio
    await this.loadAppConfig();

    this.setupSubscriptions();
    this.getTiposFacturas();
    Ss.layServ.parseMenu();
    this.verifyIsReady();
  }

  ngAfterViewInit(): void {
    fun.setWindowSize(window);
  }

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializar servicios singleton
   */
  private initializeSingletonServices(): void {
    Object.assign(Ss, {
      http: this.http,
      zone: this.zone,
      configServ: this.configServ,
      _ipc: this._ipc,
      factServ: this.factServ,
      permissionsService: this.permissionsService,
      loadServ: this.loaderServ,
      layServ: this.layServ,
      toastr: this.toastr,
      sharedServ: this.sharedServ,
      cdRef: this.cdRef,
    });
  }

  /**
   * Configurar todas las suscripciones del componente
   */
  private setupSubscriptions(): void {
    // Suscripción al loader
    this.loaderServ.isLoading.pipe(takeUntil(this.destroy$)).subscribe(loading => (this.loading = loading));

    // Solo escuchar cambios en la configuración para recargarla
    MODIFIED_CONFIG_FILE.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (fun.hasValue(res)) this.loadAppConfig();
    });

    // Eventos de Electron
    this._ipc.electronEvents$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (fun.hasValue(res)) {
        this.handleElectronEvent(res);
      }
    });
  }

  /**
   * Maneja los eventos de Electron de forma organizada
   */
  private handleElectronEvent(event: any): void {
    this.zone.run(() => {
      const handler = this.electronEventHandlers[event.eventName];
      if (handler) {
        handler(event.data);
      }
    });
  }

  /**
   * Cargar configuración de la aplicación
   */
  async loadAppConfig(): Promise<void> {
    try {
      const task = new MessageTask(ELECTRON_GET_APP_CONFIG);
      const config = (await this._ipc.sendTask(task)) as any;

      this.configServ.setConfig = config;
      this.themeService.setTheme(config.color_app);
      this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
    } catch (error) {
      console.error('Error cargando configuración:', error);
      // Manejar error de configuración
    }
  }

  getTiposFacturas() {
    return new Promise(async (resolve, reject) => {
      await this.tipoFacturaClass
        .getAll()
        .then((tiposFacturas: any) => {
          tiposFacturas = tiposFacturas.sort((a, b) => fun.compare(a, b, ['id'], 'asc')) as TipoFacturaI[];
          Ss.factServ.lista_tipos_facturas = tiposFacturas;

          resolve(Ss.factServ.lista_tipos_facturas);
        })
        .catch(error => {
          fun.logRed('error: ', error);
          reject(error);
        });
    });
  }

  async verifyIsReady() {
    const validateAppReadiness = (): boolean => {
      const hasTiposFacturas = Ss.factServ.lista_tipos_facturas?.length > 0;
      const isMenuParsed = Ss.layServ.menuParsed;

      return hasTiposFacturas && isMenuParsed;
    };

    const handleFailure = () => {
      this.isReady = false;
      fun.toastError('No se pudo cargar la aplicación, por favor intente nuevamente, si el problema persiste, contacte al soporte de<br/><strong>Novac System</strong>', 'ERROR');
    };

    fun.retryUntil({
      task: () => Promise.resolve(validateAppReadiness()),
      retryWhen: (isReady: boolean) => !isReady,
      actionAfterRetry: () => {
        setTimeout(() => (this.isReady = true), 250);
      },
      actionIfNoSuccess: handleFailure,
    });
  }

  async test(): Promise<void> {
    // const obj = { nombre: 'victor', edad: 35, direccion: { calle: 'las maras-higuero', apto: 'amarillo' }, estudios: ['colegio inmaculada', 'ucateci'] };
    // console.log(`obj ANTES => `, obj);
    // const obj2 = fun.deepCloning(obj);
    // obj2.nombre = 'otro';
    // obj2.direccion.calle = 'el higuero-maras';
    // new ConfigArticuloC()
    //   .updateOne({ id: 1, porciento_ganancia: 15 }, { parameters: { update_articulos: true } })
    //   .then((res) => {
    //     console.log('res ---> ', res);
    //   })
    //   .catch((err) => console.error(err));
  }

  enfocarApp(): void {
    this.zone.run(() => {
      this._ipc.focusWindow();
    });
  }

  cerrar_app(): void {
    this.zone.run(() => {
      this.openNewModal({
        html: `<p> ESTAS A PUNTO DE <strong>CERRAR EL PROGRAMA NOVAC SYSTEM</strong>, ¿Desea continuar? </p>`,
        id: 'cerrar_app',
        header: 'CONFIRMACION DE CIERRE',
        width: '40rem',
        botones: {
          ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
          dinamico: [
            {
              clase: 'btn btn-blanco',
              function: instance => instance.closeModal(instance.id),
              label: 'Cancelar',
              disable: false,
            },
            {
              clase: 'btn btn-danger',
              function: instance => {
                this.sendCloseConfirmation();
                instance.closeModal(instance.id);
              },
              label: 'Cerrar',
              disable: false,
            },
          ],
        },
      });
    });
  }

  sendCloseConfirmation(): void {
    const task = new MessageTask(ELECTRON_CLOSE_CONFIRMATION);
    this._ipc.sendTask(task);
  }

  mostrar_modal_actualizacion(info: any): void {
    this.zone.run(() => {
      this.openNewModal({
        html: `<p>¡NOVAC SYSTEM tiene una <strong>ACTUALIZACIÓN DISPONIBLE</strong>! ¿Desea descargar e instalar la versión ${info.version}?</p>`,
        id: 'actualizar_app',
        header: 'ACTUALIZACIÓN DISPONIBLE',
        width: '40rem',
        botones: {
          ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
          dinamico: [
            {
              clase: 'btn btn-blanco',
              function: instance => instance.closeModal(instance.id),
              label: 'Cancelar',
              disable: false,
            },
            {
              clase: 'btn btn-verde',
              function: instance => {
                this.iniciar_descarga_actualizacion();
                instance.closeModal(instance.id);
              },
              label: 'Actualizar',
              disable: false,
            },
          ],
        },
      });
    });
  }

  iniciar_descarga_actualizacion(): void {
    const task = new MessageTask(ELECTRON_EVENT_DOWNLOAD_UPDATE);
    this._ipc.sendTask(task).then(res => {
      console.log('res ---> ', res);
      this.visible = true;
    });
  }

  downloadProgression(object: any): void {
    this.zone.run(() => {
      if (this.counter === 1) this.visible = true;

      this.counter++;
      this.tiempo_restante = this.timeConvert(object.total / object.bytesPerSecond);

      object.transferred = parseFloat(fun.roundNumberToDecimal(object.transferred / 1000000));
      object.total = parseFloat(fun.roundNumberToDecimal(object.total / 1000000));
      object.percent = parseFloat(fun.roundNumberToDecimal(object.percent));

      this.objPercent = object;
      this.cdRef.detectChanges();
    });
  }

  async getAppConfig(): Promise<any> {
    try {
      const task = new MessageTask(ELECTRON_GET_APP_CONFIG);
      const config = (await this._ipc.sendTask(task)) as any;

      this.themeService.setTheme(config.color_app);
      this.configServ.setConfig = config;
      this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;

      return config;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  timeConvert(d: number): string {
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
