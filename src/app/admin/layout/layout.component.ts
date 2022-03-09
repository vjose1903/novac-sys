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
  subDeciMenu: Subscription;
  subCheckCuadreToday: Subscription;
  modulo_select: any;
  ready;
  _opened;
  facturas_localStorage: any;
  factGuardada;
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

        console.log('this.initNavigate ', this.initNavigate);

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
    console.log('======== INICIO EL LAYOUT COMPONENT ======== ');
    this.initVariables();
    this._init_mixin({ component: 'layout', _lista_subs: ['decisionModal', 'refreshFacturas', 'sacarFacturas'] });

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
            this.fun.logout();
            this.router.navigateByUrl('/auth/login');
            this.noServer = false;
          }
        });
    } else {
      this.fun.logout();
    }

    this.subDeciMenu = this.layServ.DESICIONCAMBIOMENU.subscribe((res) => {
      SingletonService.fun.logBlue('DESICIONCAMBIOMENU ', res);

      if (res && (res.bool === false || res.bool === true)) {
        if (res.bool && res.verificar) {
          this.ready = false;

          setTimeout(() => this.decisionCambioMenu_(res), 10);
        } else {
          this.decisionCambioMenu_(res);
        }
      }
    });

    this.subCheckCuadreToday = this.layServ.CHECKCUADRETODAY.subscribe((res) => {
      if (res) {
        this.checkCuadre();
        this.layServ.nextCheckCuadreToday(false);
      }
    });

    this.configServ.getConfig().then((config: ConfigI) => {
      this.versionApp = config.app_version;
    });
  }

  initVariables() {
    this.showLoading = true;
    this.imgUser = 'assets/img/transparente.png';
    this.noServer = false;
    this._opened = false;
    this.factGuardada = undefined;
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
    this.activeIndex = 0;
    this.lRun = false;
    this.cuadre_hoy = false;
  }

  ngOnDestroy() {
    this._destroy_mixin();
    if (this.subDeciMenu) this.subDeciMenu.unsubscribe();
    if (this.subCheckCuadreToday) this.subCheckCuadreToday.unsubscribe();
  }

  decisionModal(arg) {
    if (this.tipoModal === 'quitar_factura' && arg) this.quitarFacturaGuardada({ body: { archivo_id: this.seleccionModal?.archivo_id } });
  }

  _toggleSidebar(where?) {
    if (where == 'visibleChange') {
      if (this.ant_event_change_visibility == 'visibleChange') {
        this._opened = false;
        this.ant_event_change_visibility = undefined;
      } else this.ant_event_change_visibility = where;
    } else {
      this.ant_event_change_visibility = where;
      this._opened = !this._opened;
    }
  }

  checkFacturaGuardada() {
    this.factGuardada = this.layServ.factura_guardada;
  }

  checkCuadre() {
    if (!this.chequiando_cuadre) {
      let extra = { afterPath: 'check_today_cuadre', parameters: {} };
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
    console.log('path:  ', document.location.pathname);

    this.ready = true;
    this.cdRef.detectChanges();
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  getNombreFacturaGuardada(fact: any) {
    let nombre = '';
    if (fact) {
      if (fact.tipo === 'venta') nombre = fact['NoCliente_nombre'] ? fact['NoCliente_nombre'] : fact['cliente'] ? fact['cliente']['nombre'] : '';
      else if (fact['suplidor']) nombre = fact['suplidor'] ? fact['suplidor']['nombre'] : '';
    }
    return nombre;
  }

  abrirModalFacturaGuardada(fact, e) {
    const obj = { texto_modal: 'Estas seguro que desea quitar esta factura de la lista.', archivo_id: fact.archivo_id };
    this.abrirModal('dinamico_texto', obj, 'quitar_factura');
    e.stopPropagation();
  }

  quitarFacturaGuardada(params?) {
    const fact = params.body;
    let index;
    const allFacturas = this.fun.getFacturasguardadas();

    if (fact) index = _.findIndex(allFacturas, (o: any) => o.archivo_id === fact?.archivo_id);

    _.pullAt(allFacturas, index);

    this.fun.setFacturasGuardadas(allFacturas);
    this.layServ.nextFacturaGuardada(undefined);

    if (params && params.quien_llamo !== 'layout') {
      modalClass.aquienResponder = 'cabeza_factura';
      this.layServ.nextSacar({ quien_llamo: 'layout', body: this.layServ.factura_guardada });
    }

    this.refreshResponse();
  }

  clickTabView(where) {
    const can = !this.countCantFactSaved(where).disable;

    if (can) {
      if (this.activeIndex === (where === 'venta' ? 0 : 1)) {
        this.checkWhereIs(where);
      }
    } else this.activeIndex = where === 'compra' ? 0 : 1;
  }

  checkWhereIs(arg?) {
    return new Promise((resolve) => {
      const pathname = document.location.pathname;
      const url = document.location.pathname.split('/')[3];

      if (this.fun.hasValue(arg) && !pathname.includes(arg)) {
        // this.layServ.nextCambioMenu({ bool: true, ruta: `/admin/factura/${arg}/new/0` });
        setTimeout(() => resolve(true), 100);
      } else setTimeout(() => resolve(true), 100);
    });
  }

  pasarFacturaAfacturacion(fact) {
    if (this.fun.isEmpty(this.factGuardada) || fact.archivo_id != this.factGuardada.archivo_id) {
      this.checkWhereIs(fact.tipo).then((res) => {
        this.fun.logGreen('pasarFacturaAfacturacion ', fact);

        setTimeout(() => {
          if (res) this.layServ.nextFacturaGuardada(fact);
        }, 150);
      });
    }
  }

  refreshResponse() {
    this.getFacturasGuardadas();
  }

  sacarResponse(res) {
    this.quitarFacturaGuardada(res);
  }

  // =================================================================================
  // CERRAR SESION
  // =================================================================================
  logOut() {
    this.fun.logout();
    this.router.navigateByUrl('/');
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

      if (url === 'factura') {
        this.activeIndex = tipo === 'venta' ? 0 : 1;
        this.getFacturasGuardadas();
      }
    }
  }

  countCantFactSaved(tipo) {
    const array_fact = _.filter(this.fun.getFacturasguardadas(), (o: any) => o.tipo === tipo);
    return { disable: array_fact.length === 0, cant: array_fact.length };
  }

  async getFacturasGuardadas() {
    this.facturas_localStorage = this.fun.getFacturasguardadas();

    this.facturas_localStorage = _.filter(this.facturas_localStorage, (o: any) => o.tipo === (this.activeIndex === 0 ? 'venta' : 'compra'));

    setTimeout(async () => {
      if (this.facturas_localStorage.length > 0) {
        document.getElementById('btn_side_facturas').setAttribute('data-cant-facturas', this.fun.getFacturasguardadas().length);

        for (let i = 0; i < this.facturas_localStorage.length; i++) {
          const fact = this.facturas_localStorage[i];
          if (fact.suplidor_id) {
            const suplidor = await this.suplidorClass.getOne(fact.suplidor_id);

            fact['suplidor'] = {
              nombre: `${suplidor.nombre} ${suplidor.apellido ? suplidor.apellido : ''}`,
              direccion: `${suplidor.direccion}`,
              telefono: `${suplidor.telefono}`,
              limite_credito: `${suplidor.limite_credito}`,
              id: suplidor.id,
            };
          }
          if (fact.cliente_id) {
            try {
              const cliente = await this.clienteClass.getOne(fact.cliente_id);

              fact['cliente'] = {
                nombre: `${cliente.nombre} ${cliente.apellido ? cliente.apellido : ''}`,
                direccion: `${cliente.direccion}`,
                telefono: `${cliente.telefono}`,
                limite_credito: `${cliente.limite_credito}`,
                vendedor_id: `${Number(cliente.vendedor_id)}`,
                id: cliente.id,
              };
            } catch (error) {}
          }
        }
        this.facturas_localStorage = _.orderBy(this.facturas_localStorage, ['archivo_id'], ['asc']);
      } else {
        document.getElementById('btn_side_facturas').removeAttribute('data-cant-facturas');
      }
    }, 20);
  }
  // =================================================================================
  // NAVEGAR
  // =================================================================================
  cambiarMenu(subMenu, url, lleva_modulo?) {
    // console.log('  ');
    // console.log('subMenu ', subMenu);
    // console.log('url ', url);
    // console.log('lleva_modulo ', lleva_modulo);

    if (!subMenu && !lleva_modulo) this.modulo_select = undefined;
    if (subMenu) this.modulo_select = url;
    let ruta_a_cambiar = '';
    if (!subMenu) ruta_a_cambiar = this.modulo_select ? `/admin/${this.modulo_select}/${url}` : `/admin/${url}`;

    // console.log('ruta_a_cambiar ', ruta_a_cambiar);
    // console.log('this.modulo_select ', this.modulo_select);

    this.actualMenuItem = subMenu ? `${this.modulo_select}_select` : `${this.modulo_select}`;
    // console.log('this.actualMenuItem ', this.actualMenuItem);

    if (!subMenu) {
      this.ready = false;
      this.fun.logRed('MANDANDO SIGUIENTE CAMBIO');
      // console.log(' ');
      this.runRouterNavigate({ bool: true, ruta: ruta_a_cambiar });
      // this.layServ.nextCambioMenu({ bool: true, ruta: ruta_a_cambiar });
    }
  }

  decisionCambioMenu_(decision) {
    // console.log("'MMG'");

    // console.log('decision ', decision);

    if (decision.bool) {
      console.log(' ');
      console.log('decision.ruta ', decision.ruta);
      console.log(' ');

      this.router.navigateByUrl(decision.ruta);
      // this.layServ.nextDecisionCambioMenu(undefined);
      // this.layServ.nextCambioMenu(undefined);
      setTimeout(() => (this.ready = true), 1);
    } else {
      this.ready = true;
    }

    this.modulo_select = undefined;
  }
}
