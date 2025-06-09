import { TiposFacturaC, actionFacturacion, TipoFacturaI } from './../facturacion/factura';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, inject } from '@angular/core';

import { Subject, Subscription, takeUntil } from 'rxjs';
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
import { ELECTRON_CHANGE_CONFIG_FILE, ELECTRON_EVENT_VERIFICATE_UPDATE_AVAILABLE } from '../../../../electron/shared-electron-angular';
import { IpcService } from '@core/services/ipc.service';
import { CopyToClipboardService } from '@core/services/copy-to-clipboard.service';
import { MENU_CONFIG } from './utils/menu-items';
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

  menuItems = MENU_CONFIG;

  showLoading;

  usuario;

  imgUser;
  versionApp: any;
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
  tipoFacturaClass = new TiposFacturaC();

  chequiando_cuadre: boolean;
  hasPermisosValidated: boolean;
  actionFacturacion = actionFacturacion;
  currentYear: number;

  my_capitalize = fun.Capitalice;

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
          setTimeout(() => this.checkRouteActiva(), 250);

          setTimeout(() => {
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

    // Inicializar actualPath inmediatamente
    this.checkRouteActiva();

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

    this.configApp = Ss.configServ.getConfig({ isPromise: false }) as ConfigI;
    this.versionApp = this.configApp.app_version;

    fun.logYellow('config ', this.configApp);
  }

  ngAfterViewInit() {
    this.parseMenu();
    this.checkFacturasArchivadas();
    this.ready = true;
    this.cdRef.detectChanges();

    this.getTiposFacturas();
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
          fun.logBlue('error: ', error);
          if (error.razon == 'sesion_expired' || error.razon == 'no_token') this.logOut();
          reject(error);
        });
    });
  }

  changeSerieDefault() {
    fun.logYellow('changeSerieDefault');

    const logos_changes = {};
    const prev_serie_default = this.configApp.serie_default;
    const new_config = { ...this.configApp, serie_default: this.configApp.serie_default === serie.electronica ? serie.normal : serie.electronica };

    const replacement = {
      serie_default: { source: prev_serie_default, target: new_config.serie_default },
    };

    const objChange = { new_config, configReplacement: replacement };

    if (fun.hasValue(logos_changes)) objChange['logos_changes'] = logos_changes;

    const task = new MessageTask(ELECTRON_CHANGE_CONFIG_FILE, objChange);

    this._ipc
      .sendTask(task)
      .then(res => {
        this.refreshPage();
      })
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

  parseMenu() {
    for (const keyFather in this.menuPermissionsObj) {
      // Buscar el menuItem que tenga el id igual al keyFather
      const fatherMenuItem = this.menuItems.find(item => item.id === keyFather);

      if (fatherMenuItem) {
        for (const keyChild in this.menuPermissionsObj[keyFather]) {
          const subMenuProp = this.menuPermissionsObj[keyFather][keyChild];

          if (keyChild === 'flatt') {
            // Asignar el flatt al father
            fatherMenuItem.permission = [...(fatherMenuItem.permission || []), ...(subMenuProp || [])];
          } else {
            // Buscar el subItem que tenga el id igual al keyChild
            const childMenuItem = fatherMenuItem.subItems?.find(subItem => subItem.id === keyChild);

            if (childMenuItem) {
              // Asignar los permisos al child
              childMenuItem.permission = subMenuProp;
            }

            // Agregar al flatt del father
            this.menuPermissionsObj[keyFather].flatt = [...new Set([...(this.menuPermissionsObj[keyFather].flatt || []), ...(subMenuProp || [])])];
          }
        }
      }
    }
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
    this.ready = true;
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
