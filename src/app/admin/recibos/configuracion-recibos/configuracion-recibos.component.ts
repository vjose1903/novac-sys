import { Component, inject } from '@angular/core';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { modalActionsE, modalCloseType, ICallbackModal } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { NgxPermissionsService } from 'ngx-permissions';
import { ConfigRecibosModalComponent } from './config-recibos-modal.component';
import { ReciboConfiguracionC, ReciboConfiguracionI } from './recibo-configuracion';
import { Permisos } from '@core/typescript/permisos';

@Component({
  selector: 'app-configuracion-recibos',
  templateUrl: './configuracion-recibos.component.html',
  styleUrls: ['./configuracion-recibos.component.scss'],
  standalone: false,
})
export class ConfiguracionRecibosComponent {
  config_recibos: ReciboConfiguracionI | null = null;
  reciboConfiguracionClass = new ReciboConfiguracionC();
  permissions = Permisos;
  private permissionsService = inject(NgxPermissionsService);

  async cargarConfiguracionRecibos() {
    try {
      const config = await this.reciboConfiguracionClass.getCurrent();
      this.config_recibos = config.data;
    } catch (error) {
      this.config_recibos = { id: 1, card_percentage: 0 };
      console.error('Error al obtener la configuracion de recibos:', error);
    }
  }

  async openModalConfig() {
    const [canReadAll, canReadOne, canUpdate] = await Promise.all([
      this.permissionsService.hasPermission(this.permissions.recibo_configuration.read_all),
      this.permissionsService.hasPermission(this.permissions.recibo_configuration.read_one),
      this.permissionsService.hasPermission(this.permissions.recibo_configuration.update),
    ]);

    if (!canReadAll && !canReadOne) return;
    if (!this.config_recibos) await this.cargarConfiguracionRecibos();

    const modalConfig = new DynamicModalClass();
    modalConfig.id = 'config_recibos';
    modalConfig.width = '35rem';
    modalConfig.component = ConfigRecibosModalComponent;
    modalConfig.inputs = { config_recibos: this.config_recibos, canEdit: canUpdate };
    modalConfig.header = 'Configuraciones de recibos';

    modalConfig.botones = canUpdate
      ? [
          { clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false },
          { id: 'btnConfirmar', clase: 'btn btn-green', label: 'Aceptar', disable: false },
        ]
      : [{ clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false }];

    modalConfig.setCallback((arg: ICallbackModal) => this.processConfigRecibos(arg));
    modalConfig.show();
  }

  processConfigRecibos(arg: ICallbackModal) {
    if (arg.type == modalCloseType.onHide) return;

    this.config_recibos = arg.data;
  }
}
