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
import { ImagenService } from '@core/services/imagen.service';
import { DivisaService } from '@admin/registros/divisa/divisa.service';

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
  public imgServ = inject(ImagenService);
  public divisaServ = inject(DivisaService);

  // Subject para manejar la destrucción del componente
  private readonly destroy$ = new Subject<void>();
  private lastPointerDownAt = 0;

  // Propiedades del componente
  loading = signal<boolean>(false);
  objProgress: any;
  imgLogo = signal<string>('');
  isReady = signal<boolean>(false);

  @HostListener('document:pointerdown')
  onDocumentPointerDown(): void {
    this.lastPointerDownAt = Date.now();
  }

  @HostListener('document:focusin', ['$event'])
  onDocumentFocusIn(event: FocusEvent): void {
    this.openPrimeSelectPanelOnFocus(event);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    this.redirectPrimeSelectRootKeyboardEvent(event);
    this.closePrimeSelectPanelOnEnter(event);
    this.closePrimeMultiSelectPanelOnEnter(event);
  }

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
      imgServ: this.imgServ,
      divisaServ: this.divisaServ,
    });

    this.updateUi.initialize();
  }

  /**
   * Configurar todas las suscripciones del componente
   */
  private setupSubscriptions(): void {
    // Suscripción al loader
    this.loaderServ.isLoading.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading.set(loading);
    });

    // Solo escuchar cambios en la configuración para recargarla
    this.configServ.config$.pipe(takeUntil(this.destroy$)).subscribe(config => {
      this.themeService.applyTheme(config.color_app, config.mode_app);
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
      this.themeService.applyTheme(config.color_app, config.mode_app);
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

  private openPrimeSelectPanelOnFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    const root = target?.closest('.p-select, .p-multiselect') as HTMLElement | null;

    if (!target || !root) {
      return;
    }

    if (root.classList.contains('p-disabled') || root.classList.contains('p-select-open') || root.classList.contains('p-multiselect-open')) {
      return;
    }

    if (Date.now() - this.lastPointerDownAt < 250) {
      return;
    }

    const combobox = root.querySelector<HTMLElement>('[role="combobox"]');

    if (!combobox || target !== combobox) {
      return;
    }

    requestAnimationFrame(() => {
      if (document.activeElement !== combobox || root.classList.contains('p-select-open') || root.classList.contains('p-multiselect-open')) {
        return;
      }

      combobox.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          code: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  }

  private closePrimeSelectPanelOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.code !== 'NumpadEnter') {
      return;
    }

    const target = event.target as HTMLElement | null;
    const isSelectInteraction = Boolean(target?.closest('.p-select, .p-select-overlay'));

    if (!isSelectInteraction) {
      return;
    }

    const roots = new Set<HTMLElement>();
    const targetRoot = target?.closest('.p-select') as HTMLElement | null;

    if (targetRoot) roots.add(targetRoot);
    document.querySelectorAll<HTMLElement>('.p-select.p-select-open').forEach(root => roots.add(root));

    if (!roots.size) {
      return;
    }

    requestAnimationFrame(() => {
      roots.forEach(root => {
        if (!root.classList.contains('p-select-open')) {
          return;
        }

        const combobox = root.querySelector<HTMLElement>('[role="combobox"]');

        combobox?.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            bubbles: true,
            cancelable: true,
          }),
        );
      });
    });
  }

  private closePrimeMultiSelectPanelOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.code !== 'NumpadEnter') {
      return;
    }

    const target = event.target as HTMLElement | null;
    const isMultiSelectInteraction = Boolean(target?.closest('.p-multiselect, .p-multiselect-overlay'));

    if (!isMultiSelectInteraction) {
      return;
    }

    const root = (target?.closest('.p-multiselect') || document.querySelector('.p-multiselect.p-multiselect-open')) as HTMLElement | null;
    const combobox = root?.querySelector<HTMLElement>('[role="combobox"]');

    if (!root || !combobox) {
      return;
    }

    requestAnimationFrame(() => {
      if (!root.classList.contains('p-multiselect-open')) {
        return;
      }

      combobox.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  }

  private redirectPrimeSelectRootKeyboardEvent(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const navigationKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];

    if (!target || target.tagName !== 'P-SELECT' || !navigationKeys.includes(event.code)) {
      return;
    }

    const root = target.closest('.p-select') as HTMLElement | null;
    const combobox = root?.querySelector<HTMLElement>('[role="combobox"]');

    if (!root || !combobox || !root.classList.contains('p-select-open')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    combobox.focus({ preventScroll: true });
    combobox.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: event.key,
        code: event.code,
        bubbles: true,
        cancelable: true,
      }),
    );
  }
}
