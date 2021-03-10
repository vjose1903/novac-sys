import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { DBservice } from '../core/services/bdservice.service';
import { IpcService } from '../core/services/ipc.service';

import {
  compra_contado_valor_fiscal,
  compra_credito_valor_fiscal,
  conduce,
  nota_credito,
  recibo_de_ingreso,
  venta_contado_consumo,
  ventas_productos_rango,
  venta_credito_consumo,
} from '../../assets/facturas';

import { FunctionService } from '../core/services/functions.service';
import { ModalService } from '../admin/components/modal/modal.service';
import { PdfService } from '../core/services/pdf/pdf.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorC = '';
  errorU = '';
  versionApp = '';
  tipo_prueba = 'otro';

  constructor(
    private dbServ: DBservice,
    private fb: FormBuilder,
    private router: Router,
    private fun: FunctionService,
    public _ipc: IpcService,
    public mServ: ModalService,
    public pdfServ: PdfService,
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      usuario: null,
      password: null,
    });

    this._ipc.on('versionResponse', (event, arg) => {
      this.versionApp = arg;
      setTimeout(() => {
        this.quitarFocoElectron();
      }, 25);
    });

    this.searchVersion();
  }

  abrirModalReporte(obj) {
    this.mServ.modalTipo('visor_pdf');
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  ngOnDestroy() {
    this._ipc.removeListener('printRes');
  }

  async searchVersion() {
    this._ipc.send('getVersion');
  }

  quitarFocoElectron() {
    if (document.getElementById('imagenLogo')) document.getElementById('imagenLogo').click();
  }

  getVersion() {
    return this.versionApp;
  }

  // =================================================================
  // LOGIN
  // =================================================================
  login(form: any) {
    this.dbServ
      .login(form.value)
      .then((res) => {
        this.fun.setUser(res.data);
        this.router.navigateByUrl('/admin/dashboard');
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

        this.dbServ.toastError(element, 'Error', true);
      }
    }
  }

  async printTest() {
    // const data_ = compra_credito_valor_fiscal;
    // const data_ = compra_contado_valor_fiscal;
    // const data_ = venta_credito_consumo;
    const data_ = venta_contado_consumo;
    // const data_ = nota_credito;

    const obj = {
      data: data_,
      type: 'facturacion',
    };

    this.tipo_prueba = obj.type;
    this._ipc.send('print', obj);
  }

  async pruebaRecibo() {
    const data_ = recibo_de_ingreso;

    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = {
      data: data_,
      type: 'recibo_ingreso',
    };

    this.tipo_prueba = obj.type;

    this._ipc.send('print', obj);
  }

  async reporteTest() {
    const data_ = ventas_productos_rango;

    const obj = {
      data: data_,
      type: 'reporte',
    };

    this.tipo_prueba = obj.type;
    this._ipc.send('print', obj);
  }

  async pruebaConduce() {
    const data_ = conduce;

    const obj = {
      data: data_,
      type: 'conduce',
    };

    this.tipo_prueba = obj.type;

    this.generar(obj);
  }

  generar(obj) {
    this.pdfServ.generatePdf(obj, (res) => {
      if (res.status === 'si') {
        const objBase = {
          base64: res.body,
          filename: res.file,
          type: this.tipo_prueba,
        };

        const obj = {
          pdfSrc: res.body,
          titulo: 'PRUEBA REPORTE',
          height: '83vh',
          reimprimir: res.reimprimir,
          fileName: res.file.split('.')[0],
        };
        this.abrirModalReporte(obj);
      }
    });
  }
}
