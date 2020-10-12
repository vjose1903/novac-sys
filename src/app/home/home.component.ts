import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonsModule, WavesModule } from 'angular-bootstrap-md';
import { UsuariosService } from '../core/services/usuarios.service';

import { ToastrService } from 'ngx-toastr';
import { DBservice } from '../core/services/bdservice.service';
import { IpcService } from '../core/services/ipc.service';
import { PdfService } from '../core/services/pdf/pdf.service';

import { compra_contado_valor_fiscal, compra_credito_valor_fiscal, conduce, recibo_de_ingreso, venta_credito_valor_fiscal, venta_credito_consumo } from '../../assets/facturas';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  loginForm: FormGroup;
  errorC = '';
  errorU = '';
  versionApp: any;

  constructor(
    private dbServ: DBservice,
    private pdfServ: PdfService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router,
    private usuariosServices: UsuariosService,
    private _ipc: IpcService,
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      usuario: null,
      password: null,
    });
    this.searchVersion()
  }

  async searchVersion() {
    this._ipc.send('getVersion')
    await this._ipc.on('versionResponse', (event, arg) => {
      this.versionApp = arg
    })
  }

  // =================================================================
  // LOGIN
  // =================================================================
  login(form: any) {
    this.dbServ.login(form.value).subscribe(
      (res) => {
        this.errorC = '';
        this.errorU = '';
        this.dbServ.toastSuccess('', 'Correcto');
        this.getPrintersName();
      },
      (err) => {
        if (err.error.errors[0] === 'Usuario ingresado no existe') {
          this.errorU = 'usuario no existe.';
        } else if (err.error.errors[0] === 'Contraseña incorrecta') {
          this.errorC = 'contraseña invalida';
          this.errorU = '';
        } else {
          this.mostrarErrores(err.error.errors);
        }
      },
    );
  }

  mostrarErrores(arg) {
    console.log('---------------');

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
    const data_ = compra_credito_valor_fiscal;
    // const data_ = compra_contado_valor_fiscal;
    // const data_ = venta_credito_valor_fiscal;
    // const data_ = venta_credito_consumo;

    console.log('data_ ', data_);

    const obj = {
      data: data_,
      type: 'facturacion',
    };
    console.log(obj);

    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);

      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }

  async pruebaRecibo() {
    const data_ = recibo_de_ingreso;

    console.log('data_ ', data_);
    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = {
      data: data_,
      type: 'recibo_ingreso',
    };
    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);

      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }
  async pruebaConduce() {
    const data_ = conduce;

    console.log('data_ ', data_);
    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = {
      data: data_,
      type: 'conduce',
    };
    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);

      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }
}
