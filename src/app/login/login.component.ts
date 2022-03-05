import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { GLOBAL, MODIFIED_CONFIG_FILE } from '../core/typescript/GLOBAL';
import { IpcService } from '../core/services/ipc.service';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import * as _ from 'lodash';
var JsBarcode = require('jsbarcode');

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

import { ModalService } from '../admin/components/modal/modal.service';
import { PdfService } from '../core/services/pdf/pdf.service';
import { RequestC } from '../core/typescript/requests';
import { MixinClass } from '../core/typescript/MixinClass';
import { SingletonService } from '../core/services/singleton.service';
import { KEYWORD_ELECTRON_CHANGE_CONFIG_FILE, KEYWORD_ELECTRON_PRINT_BASE64, KEYWORD_ELECTRON_TEST } from '../../../electron/shared-electron-angular';
import { MessageTask } from '../core/models/message-task';
import { ConfigI } from '../core/typescript/config-interface';

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
  imgLogo;

  requestClass = new RequestC();
  configServ = SingletonService.configServ;

  constructor(private fb: FormBuilder, private router: Router, public _ipc: IpcService, public mServ: ModalService, public pdfServ: PdfService) {
    super();
  }

  ngOnInit() {
    this.loginForm = this.fb.group({ usuario: null, password: null });

    this.configServ.getConfig().then((config: ConfigI) => {
      this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
      this.versionApp = config.app_version;
    });

    // TESTEANDO EL CODIGO DE BARRAS
    // const prueba = this.textToBase64Barcode('eJwdy00KwyAQQOGrhFmborbB1G2v0Kxl0AkdGAw1Yzcld+/P8n3w3pCFqSol\nLhBrFzHQd2r/nA3opihpxay94Veu4eQnAyvlByZ6dn6h/HaI4K13ow2jt4Ob\n4znEyzQs9xsYyFiVC5aETTl32XaI7vgAzSYnUg==\n');
  }

  textToBase64Barcode(text) {
    var canvas = document.createElement('canvas');
    JsBarcode(canvas, text, { format: 'CODE128' });

    return canvas.toDataURL('image/png');
  }

  abrirModalReporte(obj) {
    this.mServ.modalTipo('visor_pdf');
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  ngOnDestroy() {}

  test() {
    const task = new MessageTask(KEYWORD_ELECTRON_CHANGE_CONFIG_FILE);

    this._ipc
      .sendTask(task)
      .then((res: string) => MODIFIED_CONFIG_FILE.next(res))
      .catch((err) => console.error(err));
  }

  quitarFocoElectron() {
    if (document.getElementById('imagenLogo')) document.getElementById('imagenLogo').click();
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

    this.generar(obj);
  }

  async pruebaRecibo() {
    const data_ = recibo_de_ingreso;

    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = { data: data_, type: 'recibo_ingreso' };

    this.tipo_prueba = obj.type;

    this.generar(obj);
  }

  async reporteTest() {
    const data_ = ventas_productos_rango;

    const obj = { data: data_, type: 'reporte' };

    this.tipo_prueba = obj.type;
    this.generar(obj);
  }

  async pruebaConduce() {
    const data_ = conduce;

    const obj = { data: data_, type: 'conduce' };

    this.tipo_prueba = obj.type;

    this.generar(obj);
  }

  generar(obj) {
    this.pdfServ.generatePdf({ oPdf: obj, imprimir: false }).then(async (res) => {
      if (res.status === 'si') {
        const objBase = { base64: res.body, filename: res.file, type: this.tipo_prueba };

        const obj = { pdfSrc: res.body, titulo: 'PRUEBA REPORTE', height: '76vh', reimprimir: res.reimprimir, fileName: res.file.split('.')[0] };
        this.abrirModalReporte(obj);
      }
    });
  }
}
