import { PrimengModule } from './modules/primeng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NewModalModule } from './core/components/modal/modal.module';
import { FormulariosEnModalesModule } from './core/components/formularios en modales/formularios-en-modales.module';
import { Component, OnInit, ChangeDetectorRef, NgZone, AfterViewInit, HostListener, inject, OnDestroy, signal, Injector, effect } from '@angular/core';
import { LoaderService } from './loader/loader.service';
import { IpcService } from '@services/ipc.service';

import { Ss } from '@services/singleton.service';
import { HttpClient } from '@angular/common/http';
import { LayoutService } from '@admin/layout/layout.service';
import { ConfigurationService } from '@services/configuration.service';
import { EmpresaService } from '@core/services/empresa.service';
import { ThemeService } from '@services/theme.service';
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

import { takeUntil, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '@services/shared.service';
import { fun } from '@services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { NgxPermissionsService } from 'ngx-permissions';
import { FacturacionService } from '@admin/facturacion/facturacion.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModalClass } from './core/components/modal/modal-class';
import { TipoFacturaI, TiposFacturaC } from '@admin/facturacion/factura';
import { DynamicModalService } from '@components/dynamic-modal/dynamic-modal.service';
import { DynamicModalComponent } from '@components/dynamic-modal/dynamic-modal.component';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PrimengModule, FormsModule, ReactiveFormsModule, NewModalModule, FormulariosEnModalesModule, RouterModule, DynamicModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends MixinClass implements OnInit, AfterViewInit, OnDestroy {
  // Servicios inyectados usando inject()
  public _ipc = inject(IpcService);
  public loaderServ = inject(LoaderService);
  public cdRef = inject(ChangeDetectorRef);
  public zone = inject(NgZone);
  public http = inject(HttpClient);
  public factServ = inject(FacturacionService);
  public layServ = inject(LayoutService);
  public configServ = inject(ConfigurationService);
  public empresaServ = inject(EmpresaService);
  public themeService = inject(ThemeService);
  public toastr = inject(ToastrService);
  public sharedServ = inject(SharedService);
  public permissionsService = inject(NgxPermissionsService);
  public dynamicModalService = inject(DynamicModalService);
  public firestore = inject(Firestore);
  public injector = inject(Injector);

  // Subject para manejar la destrucción del componente
  private readonly destroy$ = new Subject<void>();

  // Propiedades del componente
  loading = signal<boolean>(false);
  objProgress: any;
  visible = signal<boolean>(false);
  imgLogo = signal<string>('');
  objPercent = signal<any>(null);
  counter = signal<number>(0);
  isReady = signal<boolean>(false);

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
      this.visible.set(true);
      fun.logGreen(`${ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS} `, data);
      this.downloadProgression(data.body);
    },
    [ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED]: () => {
      this.visible.set(false);
    },
    [ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE]: (data: any) => {
      fun.logBlue(`${ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE} `, data);
    },
    [ELECTRON_EVENT_UPDATE_ERROR]: (data: any) => {
      fun.logRed(`${ELECTRON_EVENT_UPDATE_ERROR} `, data);
      fun.toastError(data.msg, 'ERRROR');
      this.visible.set(false);
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
    Ss.layServ.parseMenu();
    this.verifyIsReady();
  }

  ngAfterViewInit(): void {
    fun.setTimeout(() => {
      fun.setWindowSize(window);
    }, 0);
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
      dynamicModalService: this.dynamicModalService,
      firestore: this.firestore,
      injector: this.injector,
    });
  }

  /**
   * Configurar todas las suscripciones del componente
   */
  private setupSubscriptions(): void {
    // Suscripción al loader
    this.loaderServ.isLoading.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.zone.runOutsideAngular(() => {
        this.loading.set(loading);
      });
    });

    // Solo escuchar cambios en la configuración para recargarla
    this.configServ.config$.pipe(takeUntil(this.destroy$)).subscribe(config => {
      this.themeService.setTheme(config.color_app);
      this.imgLogo.set(`data:image/png;base64,${config.logo_empresa}`);
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

  async loadAppConfig(): Promise<void> {
    try {
      const task = new MessageTask(ELECTRON_GET_APP_CONFIG);
      const config = (await this._ipc.sendTask(task)) as any;

      this.configServ.config = config;
    } catch (error) {
      console.error('Error cargando configuración:', error);
      // Manejar error de configuración
    }
  }

  async getTiposFacturas(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const tiposFacturas = (await this.tipoFacturaClass.getAll()) as unknown as TipoFacturaI[];

        const tiposFacturasOrdenados = tiposFacturas.sort((a, b) => fun.compare(a, b, ['id'], 'asc')) as TipoFacturaI[];

        Ss.factServ.lista_tipos_facturas = tiposFacturasOrdenados;
        resolve();
      } catch (error) {
        fun.logRed('error: ', error);
        reject(error);
      }
    });
  }

  async verifyIsReady() {
    const validations = async () => {
      return new Promise<boolean>(resolve => {
        // if (Ss.factServ.lista_tipos_facturas?.length == 0) return resolve(false);
        if (!Ss.layServ.menuParsed) return resolve(false);
        if (!Ss.configServ.isConfigLoaded()) return resolve(false);

        resolve(true);
      });
    };

    const noSuccess = () => {
      this.zone.run(() => {
        this.isReady.set(false);
        fun.toastError('No se pudo cargar la aplicación, por favor intente nuevamente, si el problema persiste, contacte al soporte de<br/><strong>Novac System</strong>', 'ERROR');
      });
    };

    const actionAfterRetry = () => {
      // this.zone.run(() => {
      this.getTiposFacturas().finally(() => {
        this.isReady.set(true);
      });
      // });
    };

    fun.retryUntil({
      task: () => validations(),
      retryWhen: res => !res,
      actionAfterRetry: actionAfterRetry,
      actionIfNoSuccess: () => noSuccess(),
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
        header: 'CONFIRMACIÓN DE CIERRE',
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
      this.visible.set(true);
    });
  }

  downloadProgression(object: any): void {
    this.zone.run(() => {
      if (this.counter() === 1) this.visible.set(true);

      this.counter.update(prev => prev + 1);

      object.transferred = parseFloat(fun.roundNumberToDecimal(object.transferred / 1000000));
      object.total = parseFloat(fun.roundNumberToDecimal(object.total / 1000000));
      object.percent = parseFloat(fun.roundNumberToDecimal(object.percent));

      this.objPercent.set(object);
      this.cdRef.detectChanges();
    });
  }
}
