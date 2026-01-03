import { HtmlElementsService } from '@core/services/html-elements.service';
import { AfterViewInit, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { IpcService } from '@core/services/ipc.service';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { RequestC } from '@core/typescript/requests';
import { MixinClass } from '@core/typescript/MixinClass';
import { MessageTask } from '@core/typescript/message-task';
import { fun } from '@core/services/functions.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { FacturaC } from '@admin/facturacion/factura';
import { Environment } from '@environments/environment';
import { Ss } from '@core/services/singleton.service';
import { compra_contado_valor_fiscal, compra_credito_valor_fiscal, conduce, nota_credito, recibo_de_ingreso, venta_contado_consumo, ventas_productos_rango, venta_credito_consumo } from '../../assets/facturas';
import { ConfigI } from '@core/interface/config-interface';
import { CopyToClipboardService } from '@core/services/copy-to-clipboard.service';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { ICallbackModal, modalCloseType, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent extends MixinClass implements OnInit, OnDestroy, AfterViewInit {
  form: UntypedFormGroup;
  errorC = '';
  errorU = '';
  versionApp = '';
  tipo_prueba = 'otro';
  imgLogo = signal<string>('');

  requestClass = new RequestC();
  configServ = Ss.configServ;
  configApp: ConfigI;

  htmlServ = inject(HtmlElementsService);
  copyToClipboardServ = inject(CopyToClipboardService);

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    public _ipc: IpcService,
    public currentUserServ: CurrentUserService,
    private sanitizer: DomSanitizer
  ) {
    super();
  }

  ngOnInit() {
    this.form = this.fb.group({ usuario: !Environment.production ? 'novac' : null, password: !Environment.production ? '1234567' : null });
  }

  ngAfterViewInit(): void {
    this.configApp = Ss.configServ.config;
    this.imgLogo.set(`data:image/png;base64,${this.configApp.logo_empresa}`);
    this.versionApp = this.configApp.app_version;

    fun.setTimeout(() => fun.enfocarInput('Iusuario'), 5);
  }

  ngOnDestroy() {}

  test() {}

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

    if (formulario.usuario == Environment.config_user && formulario.password == Environment.config_password) {
      this.openConfigsModal();
    } else {
      Ss.sharedServ.nextCanToast(true);

      this.requestClass
        .createOne(formulario, { afterPath: 'auth/sign_in' })
        .then(res => {
          fun.setTimeout(() => {
            this.currentUserServ.setUser(res.data).then(() => {
              Ss.factServ.getTiposFacturas();
              this.router.navigateByUrl('/admin/dashboard');
            });
          }, 250);
        })
        .catch(error => {
          if (error.status === 0) fun.toastError('El servidor está <strong>caido</strong>, favor llamar a soporte de<br/><strong>Novac System</strong>', 'ERROR SERVIDOR');
        });
    }
  }

  openConfigsModal() {
    if (fun.hasValue(this.form)) this.form.reset();
    fun.enfocarInput('Iusuario');

    const passwordConfirmCallback = (args: ICallbackModal) => {
      if (args.type === modalCloseType.returnData && args.data && !args.data.error) this.navigateToConfig();
    };

    if (!Environment.production) {
      passwordConfirmCallback({ data: { error: false }, type: modalCloseType.returnData });
      return;
    }

    const passwordConfigModal = new DynamicModalClass();

    passwordConfigModal.id = 'passwordConfigForm';
    passwordConfigModal.inputs = { from: 'layout' };
    passwordConfigModal.header = 'Configuraciones';
    passwordConfigModal.width = '30rem';
    passwordConfigModal.component = ModalPasswordConfigComponent;

    passwordConfigModal.botones = [
      { id: 'cerrarBtn', label: 'Cerrar', clase: 'btn-danger', action: modalActionsE.close },
      { id: 'aceptarBtn', label: 'Aceptar', clase: 'btn-success' },
    ];

    passwordConfigModal.setCallback(passwordConfirmCallback);
    passwordConfigModal.show();
  }

  navigateToConfig() {
    this.router.navigateByUrl('/auth/config');
  }

  copyMachineId() {
    this.copyToClipboardServ.copyText(this.configApp.machineId).then(() => {
      Ss.sharedServ.canToast = true;
      fun.toastInfo('ID de la máquina copiado al portapapeles', 'COPIADO');
      Ss.sharedServ.canToast = false;
    });
  }

  onHideModal(arg) {}

  async printTest() {
    // const data_ = compra_credito_valor_fiscal;
    // const data_ = compra_contado_valor_fiscal;
    const data_ = venta_credito_consumo;
    // const data_ = venta_contado_consumo;
    // const data_ = nota_credito;

    new FacturaC().parseDataToPdf(data_).then(async factura_parsed => {
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
    //   PdfService.generatePdf({ oPdf: obj, imprimir: false })
    //     .then(async res => {
    //       const objBase = { base64: res.base64, filename: res.file, type: this.tipo_prueba };
    //       const obj = { base64: res.base64, titulo: 'PRUEBA REPORTE', height: '76vh', reimprimir: res.reimprimir, fileName: res.file.split('.')[0] };
    //       console.log("obj ", obj);
    //       // this.abrirModalReporte(obj);
    //     })
    //     .catch(err => {
    //       console.error(err);
    //       fun.toastError(err.msg, 'ERROR');
    //     });
  }
}
