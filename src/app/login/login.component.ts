import { HtmlElementsService } from './../core/services/html-elements.service';
import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MODIFIED_CONFIG_FILE } from '../core/typescript/GLOBAL';
import { IpcService } from '../core/services/ipc.service';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import * as _ from 'lodash';

import { compra_contado_valor_fiscal, compra_credito_valor_fiscal, conduce, nota_credito, recibo_de_ingreso, venta_contado_consumo, ventas_productos_rango, venta_credito_consumo } from '../../assets/facturas';

import { PdfService } from '../core/services/pdf/pdf.service';
import { RequestC } from '../core/typescript/requests';
import { MixinClass } from '../core/typescript/MixinClass';
import { Ss } from '../core/services/singleton.service';
import { ELECTRON_CHANGE_CONFIG_FILE } from '../../../electron/shared-electron-angular';
import { MessageTask } from '../core/models/message-task';
import { ConfigI } from '../core/interface/config-interface';
import { fun } from '../core/services/functions.service';
import { CurrentUserService } from '../core/services/current-user.service';
import { FacturaC } from '../admin/facturacion/factura';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent extends MixinClass implements OnInit, OnDestroy, AfterViewInit {
  form: UntypedFormGroup;
  errorC = '';
  errorU = '';
  versionApp = '';
  tipo_prueba = 'otro';
  imgLogo;

  requestClass = new RequestC();
  configServ = Ss.configServ;
  configApp: ConfigI;

  htmlServ = inject(HtmlElementsService)

  constructor(private fb: UntypedFormBuilder, private router: Router, public _ipc: IpcService, public currentUserServ: CurrentUserService) {
    super();
  }

  ngOnInit() {
    fun.logout();
  }

  ngAfterViewInit(): void {
    this.configServ.getConfig().then((config: ConfigI) => {
      this.configApp = config;
      this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
      this.versionApp = config.app_version;

      this.form = this.fb.group({ usuario: config.is_development ? 'novac' : null, password: config.is_development ? '1234567' : null });
    });
    setTimeout(() => fun.enfocarInput('Iusuario'), 5);
    // setTimeout(() => this.router.navigateByUrl('/auth/config'), 100);
  }

  ngOnDestroy() {}

  test() {
    // const task = new MessageTask(ELECTRON_CHANGE_CONFIG_FILE);

    // this._ipc
    //   .sendTask(task)
    //   .then((res: string) => MODIFIED_CONFIG_FILE.next(res))
    //   .catch((err) => console.error(err));
  }

  quitarFocoElectron() {
    if (document.getElementById('imagenLogo')) document.getElementById('imagenLogo').click();
  }

  formularioIsInvalid() {
    if (this.form) {
      const formulario = this.form.getRawValue();
      return fun.isEmpty(formulario.usuario) || fun.isEmpty(formulario.password);
    }
  }

  saltar(input) {
    const formulario = this.form.getRawValue();
    if (input == 'send') {
      if (fun.hasValue(formulario.password)) this.login();
    } else {
      if (fun.hasValue(formulario.usuario)) fun.enfocarInput(input);
    }
  }

  // =================================================================
  // LOGIN
  // =================================================================
  login() {
    const formulario = this.form.getRawValue();

    if (formulario.usuario == '1973' && formulario.password == '3791') {
      if (this.configApp.is_development) this.router.navigateByUrl('/auth/config');
      else this.openConfigsModal();
    } else {
      this.requestClass
        .createOne(formulario, { afterPath: 'auth/sign_in' })
        .then((res) => {
          setTimeout(
            () =>
              this.currentUserServ.setUser(res.data).then(() => {
                this.router.navigateByUrl('/admin/dashboard');
              }),
            250,
          );
        })
        .catch((error) => {
          if (error.status === 0) fun.toastError('El servidor está <strong>caido</strong>, favor llamar a soporte de<br/><strong>Novac System</strong>', 'ERROR SERVIDOR');
        });
    }
  }

  openConfigsModal() {
    if (fun.hasValue(this.form)) this.form.reset();
    fun.enfocarInput('Iusuario');

    this.openNewModal({
      inputs: {},
      component: ModalPasswordConfigComponent,
      id: 'passwordConfigForm',
      width: '30rem',
      header: 'Configuraciones',
    });
  }

  getDataFromModal(arg, search?) {
    this.router.navigateByUrl('/auth/config');
  }

  onHideModal(arg) {}

  async printTest() {
    // const data_ = compra_credito_valor_fiscal;
    // const data_ = compra_contado_valor_fiscal;
    const data_ = venta_credito_consumo;
    // const data_ = venta_contado_consumo;
    // const data_ = nota_credito;

    new FacturaC().parseDataToPdf(data_).then(async (factura_parsed) => {
      const obj = { data: factura_parsed, type: 'facturacion' };
      this.tipo_prueba = obj.type;
      this.generar(obj);
    });
  }

  async pruebaRecibo() {
    const data_ = recibo_de_ingreso;

    const obj = { data: data_, type: 'recibo_ingreso' };
    // ["type"] =
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
    PdfService.generatePdf({ oPdf: obj, imprimir: false }).then(async (res) => {
      if (res.status === 'si') {
        const objBase = { base64: res.base64, filename: res.file, type: this.tipo_prueba };

        const obj = { base64: res.base64, titulo: 'PRUEBA REPORTE', height: '76vh', reimprimir: res.reimprimir, fileName: _.first(res.file.split('.')) };
        // this.abrirModalReporte(obj);
      }
    });
  }
}
