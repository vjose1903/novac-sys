import { actionFacturacion } from './../facturacion/factura';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, inject } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';
import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event, RouterEvent } from '@angular/router';
import { MixinClass } from '@core/typescript/MixinClass';
import { CuadreCajaC } from '@core/typescript/cuadre_caja';
import { CurrentUserService } from '@core/services/current-user.service';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { SuplidorC } from '@registros/registro-suplidores/suplidores';
import { RequestC } from '@core/typescript/requests';
import { Ss } from '@core/services/singleton.service';
import { ConfigI } from '@core/interface/config-interface';
import { fun } from '@core/services/functions.service';
import { FactsLocalStorage } from '../facturacion/factsLocalStorage';
import { serie } from '@core/typescript/constantes';
import { MessageTask } from '@core/models/message-task';
import { ELECTRON_SET_APP_CONFIG, ELECTRON_EVENT_VERIFICATE_UPDATE_AVAILABLE } from '../../../../electron/shared-electron-angular';
import { IpcService } from '@core/services/ipc.service';
import { CopyToClipboardService } from '@core/services/copy-to-clipboard.service';
import { ModalPasswordConfigComponent } from '../../login/extra/modal-password-config/modal-password-config.component';
import { ConfiguracionesComponent } from '../../login/extra/configuraciones/configuraciones.component';
import { ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { Environment } from '@environments/environment';
@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: false,
})
export class LayoutComponent extends MixinClass implements OnInit, OnDestroy, AfterViewInit {
  actualPath;
  actualRuta;
  nextModule;

  showLoading;

  usuario;

  imgUser;
  configApp: ConfigI;
  noServer;

  ready;
  // facturas_localStorage: any;
  activeIndex;
  initNavigate = true;
  cuadre_hoy;
  ant_event_change_visibility;

  configServ = Ss.configServ;
  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  requestClass = new RequestC();

  chequiando_cuadre: boolean;
  hasPermisosValidated: boolean;
  actionFacturacion = actionFacturacion;
  currentYear: number;

  my_capitalize = fun.capitalice;

  copyToClipboardServ = inject(CopyToClipboardService);
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private currentUserServ: CurrentUserService,
    public _ipc: IpcService
  ) {
    super();

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((routerEvent: Event | RouterEvent) => {
      if (routerEvent instanceof NavigationStart) {
        this.showLoading = true;
        this.initNavigate = true;
      }

      if (routerEvent instanceof NavigationEnd || routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
        this.showLoading = false;

        if (this.initNavigate) {
          fun.setTimeout(() => {
            this.checkRouteActiva();
          }, 250);

          fun.setTimeout(() => {
            const token = fun.getAuthToken();
            if (token) this.checkCuadre();
          }, 500);

          this.initNavigate = false;
        }
      }
    });
  }

  ngOnInit() {
    this.initVariables();
    this._init_mixin({ component: 'layout', is_routing: false });

    this.layServ.CHECKCUADRETODAY.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) {
        this.checkCuadre();
        this.layServ.nextCheckCuadreToday(false);
      }
    });

    this.layServ.LOGOUT.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res && res.bool) this.logOut();
      else {
        if (fun.hasValue(res)) this.layServ.nextLogOut(undefined);
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

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
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
    this.cuadre_hoy = false;
    this.configApp = Ss.configServ.config;
    this.checkRouteActiva();

    this.verifyIsReady();
  }

  async verifyIsReady() {
    const validations = async () => {
      return new Promise<boolean>(resolve => {
        if (fun.isEmpty(this.configApp)) return resolve(false);
        if (fun.isEmpty(this.actualPath) || fun.isEmpty(this.actualRuta)) return resolve(false);
        if (Ss.factServ.lista_tipos_facturas?.length == 0) return resolve(false);

        resolve(true);
      });
    };

    const noSuccess = () => {
      this.ready = false;
      fun.toastError('No se pudo cargar la aplicación, por favor intente nuevamente, si el problema persiste, contacte al soporte de<br/><strong>Novac System</strong>', 'ERROR');
    };

    fun.retryUntil({
      task: () => validations(),
      retryWhen: res => !res,
      actionAfterRetry: () => (this.ready = true),
      actionIfNoSuccess: () => noSuccess(),
    });
  }

  changeSerieDefault() {
    const new_config = { ...this.configApp, serie_default: this.configApp.serie_default === serie.electronica ? serie.normal : serie.electronica };

    const task = new MessageTask(ELECTRON_SET_APP_CONFIG, new_config);

    this._ipc
      .sendTask(task)
      .then(res => this.refreshPage())
      .catch(err => {
        console.error(err);
        if (err.msg) fun.toastError(err.msg, 'ERROR');
        else fun.toastError('Error al cambiar la configuración de la aplicación', 'ERROR');
      });
  }

  verificarActualizaciones() {
    const task = new MessageTask(ELECTRON_EVENT_VERIFICATE_UPDATE_AVAILABLE);

    this._ipc.sendTask(task).then(res => {
      console.log('res ---> ', res);
    });
  }

  checkCuadre() {
    if (!this.chequiando_cuadre) {
      let extra = { afterPath: 'check_today_cuadre', parameters: {}, requestParams: [{ key: 'spinner', value: 'no_show' }] };
      this.chequiando_cuadre = true;
      new CuadreCajaC().getAll(extra).then(res => {
        this.cuadre_hoy = res['data'].existe_cuadre_hoy;
        this.chequiando_cuadre = false;
      });
    }
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
    passwordConfigModal.comfirmToClose = false;

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
    passwordConfigModal.comfirmToClose = false;

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
    fun.logout().then(() => {
      this._destroy_layout(true);
      this.noServer = false;
      this.router.navigateByUrl('/');
    });
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    this.actualPath = fun.getActualPath();

    const pathSplit = this.actualPath.split('/').filter(item => fun.hasValue(item.trim()));

    this.nextModule = undefined;
    this.actualRuta = pathSplit.join('/').replace('/admin/', '');
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

  cambiarMenu(args: { url: string; navigate: boolean; event: any }) {
    if (!args.navigate) {
      this.nextModule = args.url;

      return;
    }

    const nextCambioMenu = `/admin/${args.url}`;

    if (this.actualPath === nextCambioMenu) {
      fun.toastWarning('Ya se encuentra en este módulo.', 'AVISO');
      return;
    }

    this.runRouterNavigate({ bool: true, ruta: nextCambioMenu });
    fun.enfocarInput(null, args.event.target);
  }

  finalizarCambioMenu(arg) {
    if (arg.bool) {
      this.nextModule = undefined;
      this.router.navigateByUrl(arg.ruta);
    } else {
      this.checkRouteActiva();
    }
  }

  clickFantasma() {
    console.warn('click Fantasma');
  }
}
