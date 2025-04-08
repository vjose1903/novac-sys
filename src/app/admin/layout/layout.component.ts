import { TiposFacturaC, actionFacturacion } from './../facturacion/factura';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';

import { Subscription } from 'rxjs';
import * as _ from 'lodash';
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

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: false,
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

  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private currentUserServ: CurrentUserService
  ) {
    super();

    this.subRouter = this.router.events.subscribe((routerEvent: Event | RouterEvent) => {
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

    this.subCheckCuadreToday = this.layServ.CHECKCUADRETODAY.subscribe(res => {
      if (res) {
        this.checkCuadre();
        this.layServ.nextCheckCuadreToday(false);
      }
    });

    this.subLogOut = this.layServ.LOGOUT.subscribe(res => {
      if (res && res.bool) this.logOut();
      else {
        if (fun.hasValue(res)) this.layServ.nextLogOut(undefined);
      }
    });

    this.subCurrentUser = this.currentUserServ.CURENTUSER.subscribe(res => {
      if (res) this.setUser(res);
    });

    this.configServ.getConfig().then((config: ConfigI) => {
      fun.logYellow('config ', config);
      this.versionApp = config.app_version;
    });
  }

  ngAfterViewInit() {
    this.ready = true;
    this.parseMenu();
    this.checkRouteActiva();
    this.checkFacturasArchivadas();
    this.cdRef.detectChanges();

    this.validateUserAndLoadPermisos().then(result => {
      this.getTiposFacturas().then(res => {
        this.hasPermisosValidated = result;
      });
    });
  }

  getTiposFacturas() {
    return new Promise(async (resolve, reject) => {
      await this.tipoFacturaClass
        .getAll()
        .then(tiposFacturas => {
          tiposFacturas = _.orderBy(tiposFacturas, ['id'], ['asc']);
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

  validateUserAndLoadPermisos() {
    return new Promise<any>(async (resolve, reject) => {
      await this.currentUserServ
        .validateUser()
        .then(result => resolve(true))
        .catch(error => {
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
    this.activeIndex = 0;
    this.currentYear = new Date().getFullYear();
    this.cuadre_hoy = false;
  }

  ngOnDestroy() {
    this._destroy_mixin();
    if (this.subCheckCuadreToday) this.subCheckCuadreToday.unsubscribe();
    if (this.subLogOut) this.subLogOut.unsubscribe();
    if (this.subRouter) this.subRouter.unsubscribe();
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

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
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
      return paths.some(path => this.actualPath.includes(`/${module}/${path}`));
    } else {
      return this.actualPath.includes(`/${module}`);
    }
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    this.actualPath = fun.getActualPath();

    const pathSplit = _.pullAll(this.actualPath.split('/'), ['']);

    if (pathSplit.length >= 3) {
      this.actualModule = pathSplit[1];
      this.actualRuta = _.join(pathSplit.slice(2, pathSplit.length), '/');
    } else {
      this.actualModule = undefined;
      this.actualRuta = _.join(pathSplit.slice(1, pathSplit.length), '/');
    }

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
  isVistaActual(arg) {
    let res = false;

    if ((fun.hasValue(this.actualModule) && arg == this.actualModule) || (fun.hasValue(this.actualPath) && this.actualPath.includes(arg)) || (fun.hasValue(this.actualRuta) && this.actualRuta.includes(arg))) {
      res = true;
    }
    return res;
  }

  cambiarMenu(args: { url; navigate; event }) {
    let next_cambio_menu = '';

    if (args.navigate) {
      next_cambio_menu = `/admin/${args.url}`;

      if (this.actualPath !== next_cambio_menu) {
        this.runRouterNavigate({ bool: true, ruta: next_cambio_menu });
        fun.enfocarInput(null, args.event.target);
      } else {
        fun.toastWarning('Ya se encuentra en esta módulo.', 'AVISO');
      }
    } else {
      this.actualModule = args.url;
    }
  }

  finalizarCambioMenu(arg) {
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
