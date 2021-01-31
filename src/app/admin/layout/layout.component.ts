import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';

import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';

import { FunctionService } from '../../core/services/functions.service';
import { LayoutService } from './layout.service';
import { mixinClass } from '../mixinClass';
import { ModalService } from '../components/modal/modal.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent extends mixinClass implements OnInit, OnDestroy, AfterViewInit {
  mantenimiento: boolean;

  sub = new Subscription();
  actualMenyItem;
  showLoading = true;

  showModal;
  tipoModal: any;
  seleccionModal: any;
  usuario;
  PrintersInstall: any;
  OpenPrinterMenu = false;
  // imgUser: string;
  imgUser = 'assets/img/transparente.png';
  versionApp: any;
  noServer = false;
  subDeciMenu: Subscription;
  modulo_select: any;
  ready = false;
  _opened = false;
  // _opened = true;
  facturas_localStorage: any;
  // @ViewChild('dropCuenta', { static: true }) dropCuentaa;
  constructor(
    private fun: FunctionService,
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
      }
      if (routerEvent instanceof NavigationEnd || routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
        this.showLoading = false;
        this.checkRouteActiva();
      }
    });
  }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
  lRun = false;

  ngOnInit() {
    // this._init_layout();

    this.mantenimiento = true;
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
      if (res && (res.bool === false || res.bool === true)) {
        console.log('llego a modal esto:  ', res);

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

  _toggleSidebar() {
    console.log('cambiando estado del side bar');
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

  getVersion() {
    return this.versionApp;
  }

  ngOnDestroy() {
    this.subDeciMenu.unsubscribe();
  }

  setUser(user) {
    this.usuario = user;
    this.fun.setUser(user);
  }

  element: HTMLElement;

  ngAfterViewInit() {
    this.ready = true;
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

  prueba1(hi: any) {}

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
      this.actualMenyItem = url;

      if (url === 'factura') {
        this.getFacturasGuardadas();
      }
    }
  }

  async getFacturasGuardadas() {
    this.facturas_localStorage = this.fun.getFacturasguardadas();
    setTimeout(async () => {
      if (this.facturas_localStorage.length > 0) {
        document.getElementById('btn_side_facturas').setAttribute('data-cant-facturas', this.facturas_localStorage.length);
        for (let i = 0; i < this.facturas_localStorage.length; i++) {
          const fact = this.facturas_localStorage[i];
          if (fact.cliente_id) {
            try {
              const cliente = await this.dbServ.getClienteById(fact.cliente_id).toPromise();
              fact['cliente'] = {
                nombre: `${cliente.nombre} ${cliente.apellido}`,
                direccion: `${cliente.direccion}`,
              };
            } catch (error) {}
          }
        }
      }
    }, 20);

    console.log('this.facturas_localStorage --> ', this.facturas_localStorage);
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
