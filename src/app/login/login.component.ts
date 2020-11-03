import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonsModule, WavesModule } from 'angular-bootstrap-md';
import { UsuariosService } from '../core/services/usuarios.service';

import { ToastrService } from 'ngx-toastr';
import { DBservice } from '../core/services/bdservice.service';
import { IpcService } from '../core/services/ipc.service';
import { PdfService } from '../core/services/pdf/pdf.service';

import { compra_contado_valor_fiscal, compra_credito_valor_fiscal, conduce, recibo_de_ingreso, venta_credito_consumo } from '../../assets/facturas';
import { FunctionService } from '../core/services/functions.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorC = '';
  errorU = '';
  versionApp: any;

  constructor(
    private dbServ: DBservice,

    private fb: FormBuilder,
    private router: Router,
    private fun: FunctionService,
    private _ipc: IpcService,
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      usuario: null,
      password: null,
    });
    this.searchVersion();
  }

  async searchVersion() {
    this._ipc.send('getVersion');
    await this._ipc.on('versionResponse', (event, arg) => {
      this.versionApp = arg;
    });
  }

  // =================================================================
  // LOGIN
  // =================================================================
  login(form: any) {
    this.dbServ
      .login(form.value)
      .then((res) => {
        this.fun.setUser(res.data);
        this.router.navigateByUrl('/admin');
      })
      .catch((err) => {
        if (err.status === 0) {
          this.dbServ.toastError('El servidor esta caido, favor llamar a Victor Vásquez', 'ERROR SERVIDOR', true);
        } else {
          this.dbServ.toastError('Datos de acceso proporcionados estan incorrectos', 'ERROR', true);
        }
      });
  }

  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];

        this.dbServ.toastError(element, 'Error');
      }
    }
  }

  getPrintersName() {
    this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });

    this._ipc.send('printerNames');
  }

  async printTest() {
    // const data_ = compra_credito_valor_fiscal;
    // const data_ = compra_contado_valor_fiscal;
    const data_ = venta_credito_consumo;

    const obj = {
      data: data_,
      type: 'facturacion',
    };

    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }

  async pruebaRecibo() {
    const data_ = recibo_de_ingreso;

    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = {
      data: data_,
      type: 'recibo_ingreso',
    };
    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }
  async pruebaConduce() {
    const data_ = conduce;

    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = {
      data: data_,
      type: 'conduce',
    };
    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }
}
