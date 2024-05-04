import { DivisaService } from './../registros/divisa/divisa.service';
import { LoaderService } from './../../core/services/loader.service';
import { ConfigService } from './../../core/services/configuration.service';
import { TiposFacturaC } from './../facturacion/factura';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';
import { MixinClass } from '../../core/typescript/MixinClass';
import { CuadreCajaC } from '../../core/typescript/cuadre_caja.utils';
import { CurrentUserService } from '../../core/services/current-user.service';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';
import { RequestC } from '../../core/typescript/requests';
import { Ss } from '../../core/services/singleton.service';
import { fun } from '../../core/services/functions.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent extends MixinClass implements OnInit, OnDestroy, AfterViewInit {
  actualPath;
  actualRuta;
  actualModule;

  showLoading;

  usuario;

  imgUser;
  versionApp: any;
  noServer;
  subCheckCuadreToday: Subscription;
  subLogOut: Subscription;
  subRouter: Subscription;
  subCurrentUser: Subscription;

  ready;
  // facturas_localStorage: any;
  isHandset$: Observable<boolean>;
  activeIndex;
  initNavigate = true;
  cuadre_hoy;
  ant_event_change_visibility;

  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  requestClass = new RequestC();
  tipoFacturaClass = new TiposFacturaC();

  chequiando_cuadre: boolean;
  hasPermisosValidated: boolean;
  currentYear: number;

  idsH5 = {
    factura: 'facturacionLabel',
    manipular: 'manipularLabel',
    pagos: 'pagosLabel',
    viajes: 'pedidosLabel',
    conduce: 'conduceLabel',
    registros: 'registroLabel',
    produccion: 'produccionLabel',
    inventario: 'inventarioLabel',
    contabilidad: 'contabilidadLabel',
    reportes: 'reporteLabel',
  };

  constructor(private breakpointObserver: BreakpointObserver, private router: Router, private cdRef: ChangeDetectorRef, private currentUserServ: CurrentUserService, public divisaServ: DivisaService) {
    super();

    this.subRouter = this.router.events.subscribe((routerEvent: Event) => {
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
            if (token) {
              this.checkCuadre();
              this.divisaServ.getDivisas();
            }
          }, 500);

          this.initNavigate = false;
        }
      }
    });
  }

  ngOnInit() {
    this.initVariables();
    this._init_mixin({ component: 'layout', is_routing: false });

    this.subCheckCuadreToday = this.layServ.CHECKCUADRETODAY.subscribe((res) => {
      if (res) {
        this.checkCuadre();
        this.layServ.nextCheckCuadreToday(false);
      }
    });

    this.subLogOut = this.layServ.LOGOUT.subscribe((res) => {
      if (res && res.bool) this.logOut();
      else {
        if (fun.hasValue(res)) this.layServ.nextLogOut(undefined);
      }
    });

    this.subCurrentUser = this.currentUserServ.CURENTUSER.subscribe((res) => {
      if (res) this.setUser(res);
    });

    fun.logYellow('config ', ConfigService.config);
    this.versionApp = ConfigService.config.app_version;
  }

  ngAfterViewInit() {
    this.parseMenu();
    this.checkRouteActiva();
    this.cdRef.detectChanges();

    this.validateUserAndLoadPermisos().then((result) => {
      this.getTiposFacturas().then(() => {
        this.divisaServ.getDivisas().then((res) => {
          this.hasPermisosValidated = result;
        });
      });
    });
  }

  getTiposFacturas() {
    return new Promise<void>(async (resolve, reject) => {
      await this.tipoFacturaClass
        .getAll()
        .then((tiposFacturas: any) => {
          tiposFacturas = _.orderBy(tiposFacturas, ['id'], ['asc']);
          Ss.factServ.lista_tipos_facturas = tiposFacturas;
          resolve();
        })
        .catch((error) => {
          fun.logBlue('error: ', error);
          if (error.razon == 'sesion_expired' || error.razon == 'no_token') this.logOut();
          reject(error);
        });
    });
  }

  validateUserAndLoadPermisos() {
    return new Promise<any>(async (resolve, reject) => {
      await this.currentUserServ
        .validateUser()
        .then((result) => resolve(true))
        .catch((error) => {
          fun.logBlue('error: ', error);
          if (error.razon == 'sesion_expired' || error.razon == 'no_token') this.logOut();
          reject(error);
        });
    });
  }

  initVariables() {
    this.showLoading = true;
    this.imgUser = 'assets/img/transparente.png';
    this.noServer = false;
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
    this.activeIndex = 0;
    this.currentYear = new Date().getFullYear();
    this.cuadre_hoy = false;
  }

  ngOnDestroy() {
    this._destroy_mixin();
    if (this.subCheckCuadreToday) this.subCheckCuadreToday.unsubscribe();
    if (this.subLogOut) this.subLogOut.unsubscribe();
    if (this.subRouter) this.subRouter.unsubscribe();
    if (this.subCurrentUser) this.subCurrentUser.unsubscribe();
  }

  checkCuadre() {
    if (!this.chequiando_cuadre) {
      let extra = { afterPath: 'check_today_cuadre', parameters: {}, requestParams: [LoaderService.noShowSppiner] };
      this.chequiando_cuadre = true;
      new CuadreCajaC().getAll(extra).then((res) => {
        this.cuadre_hoy = res['data'].existe_cuadre_hoy;
        this.chequiando_cuadre = false;
      });
    }
  }

  setUser(usuario) {
    this.usuario = usuario;

    if (this.usuario.sexo === 'm') this.imgUser = 'assets/img/userH.png';
    else this.imgUser = 'assets/img/userM.png';
  }

  parseMenu() {
    for (const keyFather in this.menuPermissionsObj) {
      for (const keyChild in this.menuPermissionsObj[keyFather]) {
        const subMenuProp = this.menuPermissionsObj[keyFather][keyChild];
        this.menuPermissionsObj[keyFather].flatt = _.union(this.menuPermissionsObj[keyFather].flatt, subMenuProp);
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
  // CHECK LAYOUT ACTIVE ROUTE
  // =================================================================================

  getLayoutActiveRoute(module, paths?) {
    if (fun.hasValue(paths) || paths?.length > 0) {
      return paths.some((path) => this.actualPath.includes(`/${module}/${path}`));
    } else {
      return this.actualPath.includes(`/${module}`);
    }
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    this.actualPath = fun.getActualPath();

    let pathSplit = this.actualPath.split('/admin/')[1].split('/');

    this.actualModule = pathSplit[0];

    this.actualRuta = _.join(pathSplit.slice(1), '/');

    const keysIdsH5 = Object.keys(this.idsH5);
    const currentRouteKey = keysIdsH5.find((key) => this.actualModule.includes(key));

    if (fun.hasValue(currentRouteKey)) {
      setTimeout(() => {
        fun.scrollTo({ id: this.idsH5[currentRouteKey], behavior: 'smooth', block: 'start', inline: 'center' });
      }, 500);
    }

    this.ready = true;
  }

  // =================================================================================
  // NAVEGAR
  // =================================================================================
  isVistaActual(arg) {
    let res = false;

    if ((fun.hasValue(this.actualModule) && arg == this.actualModule) || (fun.hasValue(this.actualPath) && this.actualPath.includes(arg)) || (fun.hasValue(this.actualRuta) && this.actualRuta.includes(arg))) {
      res = true;
    }
    return res;
  }

  cambiarMenu(args: { url: string; navigate: boolean; id_h5?: string }) {
    let next_cambio_menu = '';

    if (args.navigate) {
      next_cambio_menu = `/admin/${args.url}`;

      if (this.actualPath !== next_cambio_menu) {
        this.runRouterNavigate({ bool: true, ruta: next_cambio_menu });
      } else {
        fun.toastWarning('Ya se encuentra en esta módulo.', 'AVISO');
      }
    } else {
      this.actualModule = args.url;
    }
    setTimeout(() => {
      if (fun.hasValue(args.id_h5)) fun.scrollTo({ id: args.id_h5, behavior: 'smooth', block: 'start', inline: 'center' });
    }, 100);
  }

  finalizarCambioMenu(arg) {
    if (arg.bool && arg.verificar) this.ready = false;

    if (arg.bool) {
      this.actualModule = undefined;
      this.router.navigateByUrl(arg.ruta);
    } else {
      this.checkRouteActiva();
    }
  }

  clickFantasma() {
    console.warn('click Fantasma');
  }
}
