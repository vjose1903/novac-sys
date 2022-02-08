import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { GLOBAL } from '../core/typescript/GLOBAL';
import { IpcService } from '../core/services/ipc.service';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import * as _ from 'lodash';

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
import { RequestC } from '../core/typescript/requests';
import { MixinClass } from '../core/typescript/MixinClass';
import { AppConfig } from '../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends MixinClass implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorC = '';
  errorU = '';
  versionApp = '';
  tipo_prueba = 'otro';
  imgLogo = AppConfig.imgLogo;

  requestClass = new RequestC();

  constructor(private fb: FormBuilder, private router: Router, public _ipc: IpcService, public mServ: ModalService, public pdfServ: PdfService) {
    super();
  }

  ngOnInit() {
    this.loginForm = this.fb.group({ usuario: null, password: null });

    this._ipc.on('versionResponse', (event, arg) => {
      this.versionApp = arg;
      setTimeout(() => this.quitarFocoElectron(), 25);
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

  formularioIsInvalid() {
    const formulario = this.loginForm.getRawValue();
    return this.fun.isEmpty(formulario.usuario) || this.fun.isEmpty(formulario.password);
  }

  saltar(input) {
    const formulario = this.loginForm.getRawValue();
    if (input == 'send') {
      if (this.fun.hasValue(formulario.password)) this.login();
    } else {
      if (this.fun.hasValue(formulario.usuario)) this.enfocarInput(input);
    }
  }

  // =================================================================
  // LOGIN
  // =================================================================
  login() {
    const formulario = this.loginForm.getRawValue();

    if (formulario.usuario == '1973' && formulario.password == '3791') {
      this.openConfigsModal();
    } else {
      this.requestClass
        .createOne(formulario, { afterPath: 'auth/sign_in' })
        .then((res) => {
          this.fun.setUser(res.data);
          this.router.navigateByUrl('/admin/dashboard');
        })
        .catch((error) => {
          if (error.status === 0) {
            this.fun.toastError('El servidor esta caido, favor llamar a Victor Vásquez', 'ERROR SERVIDOR');
          } else {
            this.fun.toastError('Datos de acceso proporcionados estan incorrectos', 'ERROR');
          }
        });
    }
  }

  openConfigsModal() {
    this.loginForm.reset();
    this.enfocarInput('Iusuario');

    this.handleModalForm({
      inputs: {},
      component: ModalPasswordConfigComponent,
      id: 'passwordConfigForm',
      width: '30rem',
      header: 'Configuraciones',
    });
  }

  getDataFromModal(arg, search) {
    this.router.navigateByUrl('/auth/config');
  }

  onHideModal(arg) {}

  async printTest() {
    // const data_ = compra_credito_valor_fiscal;
    // const data_ = compra_contado_valor_fiscal;
    const data_ = venta_credito_consumo;
    // const data_ = venta_contado_consumo;
    // const data_ = nota_credito;

    const obj = { data: data_, type: 'facturacion' };

    this.tipo_prueba = obj.type;
    this.pdfServ.generatePdf(obj).then((res_pdf) => {
      try {
        if (res_pdf.status === 'si') {
          const obj = { base64: res_pdf.body, filename: res_pdf.file, type: 'facturacion' };
          this._ipc.send('printBase64', obj);
        }
      } catch (error) {}
    });
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
    this.pdfServ.generatePdf(obj).then((res) => {
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
