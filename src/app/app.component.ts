import { PrimengModule } from './modules/primeng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FormulariosEnModalesModule } from './core/components/formularios en modales/formularios-en-modales.module';
import { Component, OnInit, ChangeDetectorRef, NgZone, AfterViewInit, HostListener, inject, OnDestroy, signal, Injector } from '@angular/core';
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
import { DynamicModalService } from '@components/dynamic-modal/dynamic-modal.service';
import { DynamicModalComponent } from '@components/dynamic-modal/dynamic-modal.component';
import { Firestore } from '@angular/fire/firestore';
import { confirmationButtons, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PrimengModule, FormsModule, ReactiveFormsModule, FormulariosEnModalesModule, RouterModule, DynamicModalComponent],
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
      console.log('token', token);

      if (fun.hasValue(token)) {
        console.log('1');

        this.cerrar_app();
      } else {
        console.log('2');
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

  @HostListener('window:resize')
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

    // TODO: temporal
    // this.mostrar_modal_actualizacion({ version: '1.0.0' });
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

  async verifyIsReady() {
    const validateAppReadiness = (): boolean => {
      const isMenuParsed = Ss.layServ.menuParsed;
      const isConfigLoaded = Ss.configServ.isConfigLoaded();

      return isMenuParsed && isConfigLoaded;
    };

    const handleFailure = () => {
      this.isReady.set(false);
      fun.toastError('No se pudo cargar la aplicación, por favor intente nuevamente, si el problema persiste, contacte al soporte de<br/><strong>Novac System</strong>', 'ERROR');
    };

    fun.retryUntil({
      task: () => Promise.resolve(validateAppReadiness()),
      retryWhen: (isReady: boolean) => !isReady,
      actionAfterRetry: () => {
        const token = fun.getAuthToken();

        if (token) {
          Ss.factServ.getTiposFacturas().then(() => {
            fun.setTimeout(() => {
              this.isReady.set(true);
            }, 250);
          });
        } else {
          this.isReady.set(true);
        }
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
      this.dynamicModalService.confirmationModal({
        id: 'cerrar_app',
        header: 'CONFIRMACIÓN DE CIERRE',
        texto: `<p> ESTAS A PUNTO DE <strong>CERRAR EL PROGRAMA NOVAC SYSTEM</strong>, ¿Desea continuar? </p>`,
        btnKind: confirmationButtons.cancelarCerrar,
        onYes: this.sendCloseConfirmation.bind(this),
      });
    });
  }

  sendCloseConfirmation(): void {
    const task = new MessageTask(ELECTRON_CLOSE_CONFIRMATION);
    this._ipc.sendTask(task);
  }

  mostrar_modal_actualizacion(info: any): void {
    this.zone.run(() => {
      const updateModalConf = new DynamicModalClass();

      updateModalConf.id = 'actualizar_app';
      updateModalConf.header = 'ACTUALIZACIÓN DISPONIBLE';
      updateModalConf.width = '40rem';
      updateModalConf.html = `<p>¡NOVAC SYSTEM tiene una <strong>ACTUALIZACIÓN DISPONIBLE</strong>! ¿Desea descargar e instalar la versión ${info.version}?</p>`;
      updateModalConf.closableEsc = true;
      updateModalConf.botones = [
        { id: 'cancelUpdateBtn', clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
        { id: 'updateBtn', clase: 'btn btn-verde', label: 'Actualizar', disable: false, function: instance => this.iniciar_descarga_actualizacion(instance, updateModalConf), showProcess: true },
      ];
      updateModalConf.disableAllButtonsIfAnyProcessing = true;
      updateModalConf.show();
    });
  }

  iniciar_descarga_actualizacion(modalInstance?: DynamicModalClass, updateModalConf?: DynamicModalClass): void {
    console.log('modalInstance ', modalInstance);
    console.log('updateModalConf ', updateModalConf);
    const updateBtn = updateModalConf.botones.find(btn => btn.id === 'updateBtn');

    const task = new MessageTask(ELECTRON_EVENT_DOWNLOAD_UPDATE);
    this._ipc.sendTask(task).then((res: any) => {
      fun.setTimeout(() => {
        console.log('res ---> ', res);
        if (res.available) {
          if (res.downloadStarted) {
            // Cerrar el modal de actualización solo cuando la descarga realmente inicie
            if (modalInstance) modalInstance.close();
            this.visible.set(true);
          } else {
            fun.toastError(res.msg, 'ERROR');
          }
        } else {
          fun.toastInfo(res.msg, 'INFORMACIÓN');
        }

        try {
          if (updateBtn) updateBtn.processing = false;
        } catch (error) {
          console.error('Error al actualizar el botón de procesamiento:', error);
        }
      }, 0);
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
