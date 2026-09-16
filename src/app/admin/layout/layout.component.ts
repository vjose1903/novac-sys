import { actionFacturacion } from './../facturacion/factura';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, computed, inject, signal } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';
import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event, RouterEvent } from '@angular/router';
import { MixinClass } from '@core/typescript/MixinClass';
import { CurrentUserService } from '@core/services/current-user.service';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { SuplidorC } from '@registros/registro-suplidores/suplidores';
import { RequestC } from '@core/typescript/requests';
import { Ss } from '@core/services/singleton.service';
import { ConfigI } from '@core/interface/config-interface';
import type { ThemeMode } from '@core/typescript/theme.types';
import { fun } from '@core/services/functions.service';
import { FactsLocalStorage } from '../facturacion/factsLocalStorage';
import { serie } from '@core/typescript/constantes';
import { IpcService } from '@core/services/ipc.service';
import { ThemeService } from '@core/services/theme.service';
import { CopyToClipboardService } from '@core/services/copy-to-clipboard.service';
import { NavigationService } from '@core/services/navigation.service';
import { ModalPasswordConfigComponent } from '../../login/extra/modal-password-config/modal-password-config.component';
import { ConfiguracionesComponent } from '../../login/extra/configuraciones/configuraciones.component';
import { ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { Environment } from '@environments/environment';
import { getDevelopmentServerMode } from '@core/typescript/url-server.utils';
import { DesktopUpdateState } from '@electron/shared-electron-angular';
import { DivisaService } from '@registros/divisa/divisa.service';
import { CuadreTodayStateService } from '@admin/cuadres/services/cuadre-today-state.service';
@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: false,
})
export class LayoutComponent extends MixinClass implements OnInit, OnDestroy, AfterViewInit {
  actualPath = signal<string>('');
  actualRuta = signal<string>('');
  nextModule = signal<string>('');

  showLoading;

  usuario;

  imgUser;
  configApp: ConfigI;
  noServer;

  ready = signal<boolean>(false);
  // facturas_localStorage: any;
  activeIndex;
  initNavigate = true;
  ant_event_change_visibility;

  configServ = Ss.configServ;
  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  requestClass = new RequestC();
  cuadreTodayServ = inject(CuadreTodayStateService);

  chequiando_cuadre = this.cuadreTodayServ.loading;
  cuadre_hoy = computed(() => this.cuadreTodayServ.data() ?? false);
  hasPermisosValidated: boolean;
  actionFacturacion = actionFacturacion;
  currentYear: number;
  fun = fun;

  my_capitalize = fun.capitalice;

  isUsingRemoteDevelopmentServer(): boolean {
    return !Environment.production && getDevelopmentServerMode() === 'remote';
  }

  copyToClipboardServ = inject(CopyToClipboardService);
  themeServ = inject(ThemeService);
  divisaServ = inject(DivisaService);
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private currentUserServ: CurrentUserService,
    private navigationService: NavigationService,
    public _ipc: IpcService
  ) {
    super();

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((routerEvent: Event | RouterEvent) => {
      if (routerEvent instanceof NavigationStart) {
        document.body.classList.add('crud-route-navigating');
        this.showLoading = true;
        this.initNavigate = true;
      }

      if (routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
        document.body.classList.remove('crud-route-navigating');
        this.showLoading = false;
        this.initNavigate = false;
        return;
      }

      if (routerEvent instanceof NavigationEnd) {
        document.body.classList.remove('crud-route-navigating');
        this.showLoading = false;

        if (this.initNavigate) {
          this.checkRouteActiva();
          this.refreshNavigationContext();
          this.initNavigate = false;
        }
      }
    });
  }

  ngOnInit() {
    this.initVariables();
    this._init_mixin({ component: 'layout', is_routing: false });
    this.checkCuadre();

    this.layServ.CHECKCUADRETODAY.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) {
        this.checkCuadre();
        this.layServ.nextCheckCuadreToday(false);
      }
    });

    this.layServ.LOGOUT.pipe(takeUntil(this.destroy$)).subscribe(res => {
      console.log('%c ANDO POR AQUIII', 'color: yellow', res);

      if (res && res.bool) {
        this.logOut();
        this.layServ.nextLogOut(undefined);
      }
    });

    this.currentUserServ.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(usuario => {
      if (usuario) {
        this.usuario = usuario;

        if (this.usuario.sexo === 'm') this.imgUser = 'assets/img/userH.png';
        else this.imgUser = 'assets/img/userM.png';
      }
    });
  }

  ngAfterViewInit() {
    this.checkFacturasArchivadas();
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    document.body.classList.remove('crud-route-navigating');
    this._destroy_mixin();
    this.destroy$.next();
    this.destroy$.complete();
  }

  initVariables() {
    this.showLoading = true;
    this.imgUser = 'assets/img/transparente.png';
    this.noServer = false;
    this.activeIndex = 0;
    this.currentYear = new Date().getFullYear();
    this.configApp = Ss.configServ.config;
    this.checkRouteActiva();

    this.verifyIsReady();
  }

  async verifyIsReady() {
    const validateAppReady = (): boolean => {
      return fun.hasValue(this.configApp) && fun.hasValue(this.actualPath()) && fun.hasValue(this.actualRuta()) && Ss.factServ.lista_tipos_facturas?.length > 0;
    };

    const setReadyState = (isReady: boolean) => {
      fun.setTimeout(() => {
        this.ready.set(isReady);
        if (!isReady) {
          fun.toastError('No se pudo cargar la aplicación, por favor intente nuevamente, si el problema persiste, contacte al soporte de<br/><strong>Novac System</strong>', 'ERROR');
        }
      }, 0);
    };

    fun.retryUntil({
      task: () => Promise.resolve(validateAppReady()),
      retryWhen: isReady => !isReady,
      actionAfterRetry: () => setReadyState(true),
      actionIfNoSuccess: () => setReadyState(false),
    });
  }

  changeSerieDefault() {
    const new_config = { ...this.configApp, serie_default: this.configApp.serie_default === serie.electronica ? serie.normal : serie.electronica };

    this._ipc
      .setAppConfig(new_config)
      .then(res => this.refreshPage())
      .catch(err => {
        console.error(err);
        if (err.msg) fun.toastError(err.msg, 'ERROR');
        else fun.toastError('Error al cambiar la configuración de la aplicación', 'ERROR');
      });
  }

  async changeThemeMode() {
    const mode_app: ThemeMode = this.configApp.mode_app === 'dark' ? 'light' : 'dark';
    const empresaId = this.configApp.firebase_empresa_id;
    const machineId = this.configApp.machineId;

    if (!empresaId || !machineId) {
      fun.toastError('No se encontró la empresa o máquina para guardar el tema.', 'ERROR');
      return;
    }

    try {
      const response = await this.requestClass.createOne(
        { empresa_id: empresaId, machine_id: machineId, config: { mode_app } },
        { afterPath: 'firebase/configuration' }
      );
      const configParaGuardar = { ...this.configApp, ...(response?.data || {}), mode_app, firebase_sync_done: true };
      const configGuardada = await this._ipc.setAppConfig(configParaGuardar);

      this.themeServ.applyTheme(configGuardada.color_app || this.configApp.color_app, configGuardada.mode_app || mode_app);
      this.configServ.config = configGuardada;
      this.configApp = configGuardada;
    } catch (error) {
      console.error(error);
      fun.toastError(error?.msg || error?.message || 'Error al cambiar el tema de la aplicación', 'ERROR');
    }
  }

  verificarActualizaciones() {
    const updateModalConf = this.crear_modal_verificando_actualizacion();
    updateModalConf.show();

    this._ipc
      .checkForUpdates()
      .then(state => {
        Ss.zone.run(() => this.actualizar_modal_verificacion(updateModalConf, state));
      })
      .catch(() => {
        Ss.zone.run(() => this.mostrar_error_verificacion(updateModalConf));
      });
  }

  private crear_modal_verificando_actualizacion(): DynamicModalClass {
    const updateModalConf = new DynamicModalClass();
    updateModalConf.id = 'actualizar_app';
    updateModalConf.header = 'VERIFICANDO ACTUALIZACIÓN';
    updateModalConf.width = '40rem';
    updateModalConf.html = `
      <div class="d-flex align-items-center justify-content-center gap-2 px-3 py-4 bg-body-tertiary text-secondary rounded-3">
        <i class="pi pi-spinner pi-spin" aria-hidden="true"></i>
        <span>Verificando actualizaciones...</span>
      </div>
    `;
    updateModalConf.closable = false;
    updateModalConf.closableEsc = false;
    updateModalConf.botones = [{ id: 'hiddenUpdateFooterBtn', clase: 'd-none', label: '', disable: true }];
    return updateModalConf;
  }

  private actualizar_modal_verificacion(updateModalConf: DynamicModalClass, state: DesktopUpdateState): void {
    if (state.status === 'available' && state.updateInfo) {
      this.mostrar_actualizacion_disponible(updateModalConf, state.updateInfo);
      return;
    }

    if (state.status === 'not-available') {
      updateModalConf.header = 'NOVAC SYSTEM ESTÁ ACTUALIZADO';
      updateModalConf.html = `
        <div class="d-flex align-items-center gap-3 p-3 bg-body-tertiary rounded-3">
          <div class="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-success-subtle text-success" style="width: 3rem; height: 3rem">
            <i class="pi pi-check" aria-hidden="true"></i>
          </div>
          <div>
            <h5 class="mb-1 text-secondary">Ya estás en la última versión disponible</h5>
            <p class="mb-2 text-body-secondary">No hay nuevas actualizaciones para instalar.</p>
            <span class="d-inline-flex align-items-center px-3 py-1 rounded-pill bg-success-subtle text-success border border-success-subtle" style="font-size: 0.8rem; font-weight: 500">
              <span>Versión actual: <strong>${this.configApp.app_version}</strong></span>
            </span>
          </div>
        </div>
      `;
      updateModalConf.closable = true;
      updateModalConf.closableEsc = true;
      updateModalConf.botones = [
        ...(!Environment.production
          ? [
              {
                id: 'simulateUpdateBtn',
                clase: 'btn btn-blanco',
                label: 'Simular actualización',
                disable: false,
                function: () => this.mostrar_actualizacion_disponible(updateModalConf, { version: this.obtener_version_simulada() }),
              },
            ]
          : []),
        { id: 'closeUpdateBtn', clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false },
      ];
      this.refrescar_modal_actualizacion(updateModalConf);
    }
  }

  private obtener_version_simulada(): string {
    const currentVersion = String(this.configApp.app_version);
    const versionSegments = currentVersion.split('.');
    const lastSegment = Number(versionSegments.at(-1));

    if (!Number.isInteger(lastSegment)) return `${currentVersion}.1`;

    versionSegments[versionSegments.length - 1] = String(lastSegment + 1);
    return versionSegments.join('.');
  }

  private mostrar_actualizacion_disponible(updateModalConf: DynamicModalClass, info: any): void {
    updateModalConf.header = 'ACTUALIZACIÓN DISPONIBLE';
    updateModalConf.html = `
      <div class="d-flex align-items-center gap-3 p-3 bg-body-tertiary rounded-3">
        <div class="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-primary-subtle text-primary" style="width: 3rem; height: 3rem">
          <i class="pi pi-download" aria-hidden="true"></i>
        </div>
        <div>
          <h5 class="mb-1 text-secondary">Nueva versión disponible</h5>
          <p class="mb-2 text-body-secondary">Hay una actualización de Novac System lista para descargar e instalar.</p>
          <span class="d-inline-flex align-items-center px-3 py-1 rounded-pill bg-primary-subtle text-primary border border-primary-subtle" style="font-size: 0.8rem; font-weight: 500">
            <span>Versión disponible: <strong>${info.version}</strong></span>
          </span>
        </div>
      </div>
    `;
    updateModalConf.closable = true;
    updateModalConf.closableEsc = true;
    updateModalConf.botones = [
      ...(!Environment.production
        ? [
            {
              id: 'simulateDownloadBtn',
              clase: 'btn btn-primary',
              label: 'Simular descarga',
              disable: false,
              function: instance => {
                instance.close();
                this._ipc.simulateUpdateDownload();
              },
            },
          ]
        : []),
      { id: 'cancelUpdateBtn', clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
      { id: 'updateBtn', clase: 'btn btn-verde', label: 'Actualizar', disable: false, function: instance => this.iniciar_descarga_actualizacion(instance, updateModalConf), showProcess: true },
    ];
    updateModalConf.disableAllButtonsIfAnyProcessing = true;
    this.refrescar_modal_actualizacion(updateModalConf);
  }

  private mostrar_error_verificacion(updateModalConf: DynamicModalClass): void {
    updateModalConf.header = 'ERROR DE ACTUALIZACIÓN';
    updateModalConf.html = '<p class="mb-0">No se pudo verificar si existen actualizaciones.</p>';
    updateModalConf.closable = true;
    updateModalConf.closableEsc = true;
    updateModalConf.botones = [{ id: 'closeUpdateBtn', clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false }];
    this.refrescar_modal_actualizacion(updateModalConf);
  }

  private refrescar_modal_actualizacion(updateModalConf: DynamicModalClass): void {
    if (!updateModalConf.id || !updateModalConf.modalWrapper) return;

    updateModalConf.modalWrapper.changeModalConfig(
      {
        header: updateModalConf.header,
        html: updateModalConf.html,
        closable: updateModalConf.closable,
        closableEsc: updateModalConf.closableEsc,
        botones: updateModalConf.botones,
        disableAllButtonsIfAnyProcessing: updateModalConf.disableAllButtonsIfAnyProcessing,
      },
      updateModalConf.id
    );
  }

  private iniciar_descarga_actualizacion(modalInstance: DynamicModalClass, updateModalConf: DynamicModalClass): void {
    const updateBtn = updateModalConf.botones.find(btn => btn.id === 'updateBtn');

    this._ipc
      .downloadUpdate()
      .then(res => {
        if (res.started) {
          modalInstance.close();
        } else {
          fun.toastInfo(res.message, 'INFORMACIÓN');
        }

        if (updateBtn) updateBtn.processing = false;
      })
      .catch(error => {
        if (updateBtn) updateBtn.processing = false;
        fun.toastError(error?.message || 'No se pudo iniciar la descarga de la actualización', 'ERROR');
      });
  }

  checkCuadre() {
    return this.cuadreTodayServ.refresh({ force: true, skipLoader: true }).catch(() => false);
  }

  private refreshNavigationContext() {
    const token = fun.getAuthToken();
    if (!token) return;

    this.checkCuadre();
    this.divisaServ.getDivisas({ force: true, skipLoader: true }).catch(() => []);
  }

  copyMachineId() {
    this.copyToClipboardServ.copyText(this.configApp.machineId).then(() => {
      fun.toastInfo('ID de la máquina copiado al portapapeles', 'COPIADO');
    });
  }

  openConfigurationModal() {
    const passwordConfirmCallback = (args: ICallbackModal) => {
      if (args.type === modalCloseType.returnData && args.data && !args.data.error) this.openConfiguracionesModal();
    };

    if (!Environment.production) {
      passwordConfirmCallback({ data: { error: false }, type: modalCloseType.returnData });
      return;
    }

    const passwordConfigModal = new DynamicModalClass();

    passwordConfigModal.id = 'passwordConfigForm';
    passwordConfigModal.inputs = { from: 'layout' };
    passwordConfigModal.header = 'Configuraciones';
    passwordConfigModal.width = '30rem';
    passwordConfigModal.component = ModalPasswordConfigComponent;

    passwordConfigModal.botones = [
      { id: 'cerrarBtn', label: 'Cerrar', clase: 'btn-danger', action: modalActionsE.close },
      { id: 'aceptarBtn', label: 'Aceptar', clase: 'btn-success' },
    ];

    passwordConfigModal.setCallback(passwordConfirmCallback);
    passwordConfigModal.show();
  }

  openConfiguracionesModal() {
    const passwordConfigModal = new DynamicModalClass();
    passwordConfigModal.id = 'configuracionesForm';
    passwordConfigModal.width = '90vw';
    passwordConfigModal.header = 'Configuraciones del sistema';
    passwordConfigModal.height = 'calc(100vh - 10rem)';
    passwordConfigModal.padding = '0rem';
    passwordConfigModal.component = ConfiguracionesComponent;
    passwordConfigModal.inputs = { is_on_modal: true };

    passwordConfigModal.show();
  }

  // =================================================================================
  // Refrescar el programa
  // =================================================================================
  refreshPage() {
    fun.reloadElectron();
  }

  // =================================================================================
  // CERRAR SESION
  // =================================================================================
  logOut() {
    this.noServer = false;
    this.router.navigateByUrl('/');
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    this.actualPath.set(fun.getActualPath());

    const pathSplit = this.actualPath()
      .split('/')
      .filter(item => fun.hasValue(item.trim()));

    this.nextModule.set(undefined);
    this.actualRuta.set(pathSplit.join('/').replace('/admin/', ''));
  }

  // =================================================================================
  // CHECK FACTURAS ARCHIVADAS
  // =================================================================================

  checkFacturasArchivadas() {
    FactsLocalStorage.verificateFacturasGuardadas();
  }

  // =================================================================================
  // NAVEGAR
  // =================================================================================

  async cambiarMenu(args: { url: string; navigate: boolean; event: any }) {
    if (!args.navigate) {
      this.nextModule.set(args.url);
      return;
    }

    const nextCambioMenu = `/admin/${args.url}`;

    // Usar el nuevo servicio de navegación
    const success = await this.navigationService.navigateTo(nextCambioMenu);

    if (success) {
      this.nextModule.set(undefined);
      fun.enfocarInput(null, args.event.target);
    }
  }

  clickFantasma() {
    console.warn('click Fantasma');
  }
}
