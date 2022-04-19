import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterContentChecked, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';
import { MixinClass } from '../../core/typescript/MixinClass';
import { CuadreCajaC } from '../../core/typescript/cuadre_caja';
import { CurrentUserService } from '../../core/services/current-user.service';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';
import { RequestC } from '../../core/typescript/requests';
import { SingletonService } from '../../core/services/singleton.service';
import { ConfigI } from '../../core/typescript/config-interface';
import { fun } from '../../core/services/functions.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent extends MixinClass implements OnInit, OnDestroy, AfterContentChecked, AfterViewInit {
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

  ready;
  // facturas_localStorage: any;
  isHandset$: Observable<boolean>;
  lRun;
  activeIndex;
  initNavigate = true;
  cuadre_hoy;
  ant_event_change_visibility;

  configServ = SingletonService.configServ;
  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  requestClass = new RequestC();
  chequiando_cuadre: boolean;

  constructor(private breakpointObserver: BreakpointObserver, private router: Router, private cdRef: ChangeDetectorRef, private currentUserServ: CurrentUserService) {
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

    const token = fun.getAuthToken();

    if (token) {
      this.requestClass
        .getAll({ afterPath: 'auth/validate_token' })
        .then((res) => {
          this.setUser(res.data);
          if (res.data.sexo === 'm') this.imgUser = 'assets/img/userH.png';
          else this.imgUser = 'assets/img/userM.png';

          this.lRun = true;
        })
        .catch((err) => {
          if (err.status === 0) this.noServer = true;
          else {
            this.logOut();
          }
        });
    } else {
      this.logOut();
    }

    this.subCheckCuadreToday = this.layServ.CHECKCUADRETODAY.subscribe((res) => {
      if (res) {
        this.checkCuadre();
        this.layServ.nextCheckCuadreToday(false);
      }
    });

    this.subLogOut = this.layServ.LOGOUT.subscribe((res) => {
      if (res) this.logOut();
    });

    this.configServ.getConfig().then((config: ConfigI) => {
      this.versionApp = config.app_version;
    });
  }

  initVariables() {
    this.showLoading = true;
    this.imgUser = 'assets/img/transparente.png';
    this.noServer = false;
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
    this.activeIndex = 0;
    this.lRun = false;
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
      new CuadreCajaC().getAll(extra).then((res) => {
        this.cuadre_hoy = res['data'].existe_cuadre_hoy;
        this.chequiando_cuadre = false;
      });
    }
  }

  setUser(user) {
    this.usuario = user;
    this.currentUserServ.setUser(user);
  }

  ngAfterViewInit() {
    this.ready = true;
    this.cdRef.detectChanges();
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  // =================================================================================
  // CERRAR SESION
  // =================================================================================
  refreshPage() {
    location.reload();
  }

  // =================================================================================
  // CERRAR SESION
  // =================================================================================
  logOut() {
    this.layServ.nextLogOut(false);
    fun.logout().then(() => {
      this.router.navigateByUrl('/');
      this._destroy_layout(true);
      this.noServer = false;
    });
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    this.actualPath = document.location.pathname;
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
  // NAVEGAR
  // =================================================================================
  isVistaActual(arg) {
    let res = false;

    if ((fun.hasValue(this.actualModule) && arg == this.actualModule) || (fun.hasValue(this.actualPath) && this.actualPath.includes(arg)) || (fun.hasValue(this.actualRuta) && this.actualRuta.includes(arg))) {
      res = true;
    }
    return res;
  }

  cambiarMenu(args: { url; navigate }) {
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
}
