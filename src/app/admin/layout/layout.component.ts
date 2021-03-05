import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterContentChecked, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';

import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';

import { FunctionService } from '../../core/services/functions.service';
import { LayoutService } from './layout.service';
import { mixinClass } from '../mixinClass';
import { ModalService } from '../components/modal/modal.service';
import { GLOBAL } from '../../core/services/GLOBAL';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent extends mixinClass implements OnInit, OnDestroy, AfterContentChecked, AfterViewInit {
  actualMenyItemBack;
  actualMenyItem;
  showLoading;

  usuario;
  PrintersInstall: any;
  OpenPrinterMenu;
  imgUser;
  versionApp: any;
  noServer;
  subDeciMenu: Subscription;
  modulo_select: any;
  ready;
  _opened;
  facturas_localStorage: any;
  factGuardada;
  isHandset$: Observable<boolean>;
  lRun;
  activeIndex;
  initNavigate;

  constructor(
    public fun: FunctionService,
    private dbServ: DBservice,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    public _ipc: IpcService,
    public layServ: LayoutService,
    private cdRef: ChangeDetectorRef,
    public mServ: ModalService,
  ) {
    super(mServ, _ipc, layServ);

    this.router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        this.showLoading = true;
        this.initNavigate = true;
      }
      if (routerEvent instanceof NavigationEnd || routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
        this.showLoading = false;
        if (this.initNavigate) {
          this.checkRouteActiva();
          console.log('TERMINO NAVEGACION');

          this.initNavigate = false;
        }
      }
    });
  }

  ngOnInit() {
    this.initVariables();
    this._init_mixin({ _lista_subs: ['decisionModal', 'refreshFacturas', 'sacarFacturas'] });

    this._ipc.PRINTERS.subscribe((res) => {
      if (res !== undefined) {
        this.PrintersInstall = res;
      }
    });

    const token = this.fun.getAuthToken();

    if (token) {
      this.dbServ
        .validateToken()
        .then((res) => {
          this.setUser(res.data);
          if (res.data.sexo === 'm') {
            this.imgUser = 'assets/img/userH.png';
          } else {
            this.imgUser = 'assets/img/userM.png';
          }
          this.lRun = true;
        })
        .catch((err) => {
          if (err.status === 0) {
            this.noServer = true;
          } else {
            this.fun.logout();

            this.router.navigateByUrl('/auth/login');

            this.noServer = false;
          }
        });
    } else {
      this.fun.logout();
    }

    this.subDeciMenu = this.layServ.DESICIONCAMBIOMENU.subscribe((res) => {
      console.log('DESICIONCAMBIOMENU --> ', res);

      if (res && (res.bool === false || res.bool === true)) {
        if (res.bool && res.verificar) {
          this.ready = false;
          setTimeout(() => this.decisionCambioMenu_(res), 20);
        } else {
          this.decisionCambioMenu_(res);
        }
      }
    });

    this.searchVersion();
    this.getPrintersName();
  }

  initVariables() {
    this.showLoading = true;
    this.OpenPrinterMenu = false;
    this.imgUser = 'assets/img/transparente.png';
    this.noServer = false;
    this._opened = false;
    this.factGuardada = undefined;
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
    this.activeIndex = 0;
    this.lRun = false;
  }

  ngOnDestroy() {
    this._destroy_mixin();
    if (this.subDeciMenu) this.subDeciMenu.unsubscribe();
  }

  decisionModal(arg) {
    if (this.tipoModal === 'quitar_factura' && arg) {
      this.quitarFacturaGuardada();
    }
  }

  _toggleSidebar() {
    this._opened = !this._opened;
  }

  async getPrintersName() {
    this._ipc.send('printerNames');

    await this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });
  }

  async searchVersion() {
    this._ipc.send('getVersion');
    await this._ipc.on('versionResponse', (event, arg) => {
      this.versionApp = arg;
    });
  }

  checkFacturaGuardada() {
    this.factGuardada = this.layServ.factura_guardada;
  }

  getVersion() {
    return this.versionApp;
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

  stop(e) {
    this.OpenPrinterMenu = true;
    e.stopPropagation();
  }

  selectPrinter(name) {
    this.OpenPrinterMenu = false;
  }
  closePrinterMenu() {
    this.OpenPrinterMenu = false;
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
    const obj = { texto_modal: 'Estas seguro que desea quitar esta factura de la lista.' };
    this.seleccionModal = fact;
    this.abrirModal('quitar_factura', 'dinamico_texto', obj);
    e.stopPropagation();
  }

  quitarFacturaGuardada(fact?) {
    let index;

    if (!fact) index = _.findIndex(this.facturas_localStorage, (o: any) => o.factura_id === this.seleccionModal.factura_id);
    if (fact) index = _.findIndex(this.facturas_localStorage, (o: any) => o.factura_id === fact.factura_id);

    _.pullAt(this.facturas_localStorage, index);

    this.fun.setFacturasGuardadas(this.facturas_localStorage);
  }

  checkWhereIs(arg?, callback = (arg) => {}) {
    const temp_url = document.location.href.split('admin/');
    const url = temp_url[1].split('/')[1];

    if (url !== arg) {
      this.layServ.nextCambioMenu({ bool: true, verificar: true, ruta: `/admin/factura/${arg}/new/0` });
      callback(true);
    } else {
      callback(true);
    }
  }

  pasarFacturaAfacturacion(fact) {
    this.checkWhereIs(fact.tipo, (res) => {
      if (res) {
        // setTimeout(() => {
        this.layServ.nextFacturaGuardada(fact);
        //     }, 250);
      }
    });
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

  mantenimientoCuenta(reg: String) {
    if (reg === 'usuario') {
      this.router.navigate(['/admin/mantCuenta', 'INS']);
    } else if (reg === 'centro') {
      this.router.navigate(['/admin/mantCentro', 'INS']);
    }
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    const temp_url = document.location.href.split('admin/');
    if (temp_url[1]) {
      const url = temp_url[1].split('/')[0];
      const tipo = temp_url[1].split('/')[1];
      this.actualMenyItem = url;
      this.actualMenyItemBack = GLOBAL.duplicarJson(this.actualMenyItem);

      if (url === 'factura') {
        this.getFacturasGuardadas();
        this.activeIndex = tipo === 'venta' ? 0 : 1;
      }
    }
  }

  async getFacturasGuardadas() {
    console.log('this.activeIndex --> ', this.activeIndex);

    this.facturas_localStorage = this.fun.getFacturasguardadas();
    this.facturas_localStorage = _.filter(this.facturas_localStorage, (o: any) => o.tipo === (this.activeIndex === 0 ? 'venta' : 'compra'));

    setTimeout(async () => {
      if (this.facturas_localStorage.length > 0) {
        document.getElementById('btn_side_facturas').setAttribute('data-cant-facturas', this.facturas_localStorage.length);

        for (let i = 0; i < this.facturas_localStorage.length; i++) {
          const fact = this.facturas_localStorage[i];
          if (fact.suplidor_id) {
            const suplidor = await this.dbServ.getSuplidorById(fact.suplidor_id).toPromise();
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
              const cliente = await this.dbServ.getClienteById(fact.cliente_id).toPromise();
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
        this.facturas_localStorage.sort((a, b) => {
          return a.factura_id > b.factura_id ? 1 : -1;
        });
      }
    }, 20);
  }
  // =================================================================================
  // NAVEGAR
  // =================================================================================
  nextCambioMenu(subMenu, url, lleva_modulo?) {
    if (!subMenu && !lleva_modulo) this.modulo_select = undefined;
    if (subMenu) this.modulo_select = url;
    let ruta_a_cambiar = '';
    if (!subMenu) ruta_a_cambiar = this.modulo_select ? `/admin/${this.modulo_select}/${url}` : `/admin/${url}`;

    this.actualMenyItem = subMenu ? `${this.modulo_select}_select` : `${this.modulo_select}`;

    if (!subMenu) {
      this.ready = false;
      this.layServ.nextCambioMenu({ bool: true, ruta: ruta_a_cambiar });
    }
  }

  decisionCambioMenu_(decision) {
    if (decision.bool) {
      this.router.navigateByUrl(decision.ruta);

      setTimeout(() => {
        this.ready = true;
      }, 20);

      this.layServ.nextDecisionCambioMenu(undefined);
      this.layServ.nextCambioMenu(undefined);
    } else {
      this.ready = true;
    }

    this.modulo_select = undefined;
  }

  modalConfig() {}
  // ===========================================================================
  // MODAL
  // ===========================================================================

  // reiniciarVarModal() {
  //   TIPOMODAL.next('');
  //   SHOWMODAL.next(false);
  //   SELECCIONMODAL.next({});
  // }

  // BtnModal(arg) {
  //   DECISIONMODAL.next(arg);
  //   this.reiniciarVarModal();
  // }

  // clickRowModal(arg) {
  //   OBJDEVUELTO.next(arg);
  // }

  // noArticuloEncontrado(arg) {
  //   INDEXTOFOCUS.next(arg);
  // }
}
