import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from './core/services';
import { DBservice } from './core/services/bdservice.service';
import { LoaderService } from './loader/loader.service';
import { IpcService } from './core/services/ipc.service';
import { applyMixins, GLOBAL } from './core/services/GLOBAL';
import { FunctionService } from './core/services/functions.service';
import { ProduccionComponent } from './admin/produccion/produccion.component';
import { modalClass } from './admin/components/modal/modal';
import { LayoutClass } from './admin/layout/layout';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  loading = false;

  objProgress;
  displayPercent = false;
  tiempo_restante;
  objPercent;

  constructor(
    public _ipc: IpcService,
    private dbServ: DBservice,
    private loaderServ: LoaderService,
    private fun: FunctionService,
    public electronService: ElectronService,
    private cdRef: ChangeDetectorRef,
  ) {
    this.loaderServ.isLoading.subscribe((v) => {
      setTimeout(() => {
        this.loading = v;
      }, 5);
    });
  }

  ngOnInit(): void {
    // applyMixins(ProduccionComponent, [modalClass, LayoutClass]);
    console.log('estoy en--> ', document.location.href);

    // this.dbServ.getSecuenciaFacturas().subscribe(res => {
    //   this.obsServ.next_secuencia_factura(res);
    // });

    this._ipc.on(' checking-for-update', (event: Electron.IpcMessageEvent, res) => {});
    this._ipc.on('update-error', (event: Electron.IpcMessageEvent, res) => {
      if (res) {
        this.dbServ.toastError(res.msg, 'ERRROR', true);
        this.displayPercent = false;
      }
    });

    this._ipc.on('update-available', (event: Electron.IpcMessageEvent, res) => {
      this.displayPercent = true;
    });

    this._ipc.on('download-progress', (event: Electron.IpcMessageEvent, res) => {
      if (res && res.body) {
        this.tiempo_restante = this.timeConvert(res.body.total / res.body.bytesPerSecond);

        res.body.transferred = parseFloat(GLOBAL.redondearAdos(res.body.transferred / 1000000));
        res.body.total = parseFloat(GLOBAL.redondearAdos(res.body.total / 1000000));
        res.body.percent = parseFloat(GLOBAL.redondearAdos(res.body.percent));

        this.objPercent = res.body;
        document.getElementById('imagenLogo').click();
        if (document.getElementById('foco_angular')) {
          document.getElementById('foco_angular').click();
        }
      }
    });

    this._ipc.on('update-downloaded', (event: Electron.IpcMessageEvent, res) => {
      this.displayPercent = false;
    });

    this._ipc.on('log', (event: Electron.IpcMessageEvent, res) => {});

    this.getPrintersName();
  }

  getPrintersName() {
    this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });

    this._ipc.send('printerNames');
  }

  timeConvert(d) {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? ' hora, ' : ' horas, ') : '';
    const mDisplay = m > 0 ? m + (m === 1 ? ' minuto, ' : ' minutos, ') : '';
    const sDisplay = s > 0 ? s + (s === 1 ? ' segundo' : ' segundos') : '';
    return hDisplay + mDisplay + sDisplay;
  }

  duplicarDataProgreso(json) {}

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
}
