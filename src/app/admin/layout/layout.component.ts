import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterContentChecked, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';
import { MixinClass } from '../../core/typescript/MixinClass';
import { GLOBAL } from '../../core/typescript/GLOBAL';
import { CuadreCajaC } from '../../core/typescript/cuadre_caja';
import { modalClass } from '../components/modal/modal';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';
import { RequestC } from '../../core/typescript/requests';
import { SingletonService } from '../../core/services/singleton.service';
import { ConfigI } from '../../core/typescript/config-interface';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent extends MixinClass implements OnInit, OnDestroy, AfterContentChecked, AfterViewInit {
  actualMenuItemBack;
  actualMenuItem;
  showLoading;

  usuario;

  imgUser;
  versionApp: any;
  noServer;
  subCheckCuadreToday: Subscription;
  subLogOut: Subscription;
  modulo_select: any;
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

  constructor(private breakpointObserver: BreakpointObserver, private router: Router, private cdRef: ChangeDetectorRef) {
    super();

    this.router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        this.showLoading = true;
        this.initNavigate = true;
      }

      if (routerEvent instanceof NavigationEnd || routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
        this.showLoading = false;

        if (this.initNavigate) {
          setTimeout(() => this.checkRouteActiva(), 250);

          setTimeout(() => {
            const token = this.fun.getAuthToken();
            if (token) this.checkCuadre();
          }, 500);

          this.initNavigate = false;
        }
      }
    });
  }

  ngOnInit() {
    this.initVariables();
    this._init_mixin({ component: 'layout', is_routing: false, _lista_subs: ['decisionModal', 'refreshFacturas', 'sacarFacturas'] });

    const token = this.fun.getAuthToken();

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
      console.log('this.subLogOut');
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
    this.fun.setUser(user);
  }

  ngAfterViewInit() {
    this.ready = true;
    this.cdRef.detectChanges();
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  // refreshResponse() {
  //   this.getFacturasGuardadas();
  // }

  // sacarResponse(res) {
  //   this.quitarFacturaGuardada(res);
  // }

  // =================================================================================
  // CERRAR SESION
  // =================================================================================
  logOut() {
    this.fun.logout().then(() => {
      this.router.navigateByUrl('/');
      this._destroy_layout(true);
      this.noServer = false;
    });
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    const temp_url = document.location.href.split('admin/');
    if (temp_url[1]) {
      const url = temp_url[1].split('/')[0];
      const tipo = temp_url[1].split('/')[1];
      this.actualMenuItem = url;

      this.actualMenuItemBack = this.fun.duplicarJson(this.actualMenuItem);
    }
  }

  // =================================================================================
  // NAVEGAR
  // =================================================================================
  cambiarMenu(subMenu, url, lleva_modulo?) {
    if (!subMenu && !lleva_modulo) this.modulo_select = undefined;
    if (subMenu) this.modulo_select = url;
    let ruta_a_cambiar = '';
    if (!subMenu) ruta_a_cambiar = this.modulo_select ? `/admin/${this.modulo_select}/${url}` : `/admin/${url}`;

    this.actualMenuItem = subMenu ? `${this.modulo_select}_select` : `${this.modulo_select}`;

    if (!subMenu) {
      this.runRouterNavigate({ bool: true, ruta: ruta_a_cambiar });
    }
  }

  finalizarCambioMenu(arg) {
    console.log('arg ', arg);

    if (arg.bool && arg.verificar) {
      this.ready = false;
      setTimeout(() => this.decisionCambioMenu(arg), 10);
    } else {
      this.decisionCambioMenu(arg);
    }
  }

  decisionCambioMenu(decision) {
    if (decision.bool) this.router.navigateByUrl(decision.ruta);
    setTimeout(() => (this.ready = true), 1);
    this.modulo_select = undefined;
  }
}
