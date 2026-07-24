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
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { FIRESTORE } from '@core/tokens/firebase.tokens';
import { Firestore } from 'firebase/firestore';
import { AppUpdateUiService } from '@core/services/electron/app-update-ui.service';

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
  public firestore = inject(FIRESTORE);
  public injector = inject(Injector);
  public updateUi = inject(AppUpdateUiService);

  // Subject para manejar la destrucción del componente
  private readonly destroy$ = new Subject<void>();

  // Propiedades del componente
  loading = signal<boolean>(false);
  objProgress: any;
  imgLogo = signal<string>('');
  isReady = signal<boolean>(false);

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

    this.updateUi.initialize();
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
      this.themeService.setTheme(config.color_app, config.mode_app);
      this.imgLogo.set(`data:image/png;base64,${config.logo_empresa}`);
    });

    this._ipc.closeRequested$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const token = fun.getAuthToken();

      if (fun.hasValue(token)) {
        this.cerrar_app();
      } else {
        this.sendCloseConfirmation();
      }
    });
  }

  async loadAppConfig(): Promise<void> {
    try {
      const config = (await this._ipc.getAppConfig()) as any;
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
    this._ipc.confirmClose();
  }
}
