import { Injectable } from '@angular/core';
import { Ss } from '@core/services/singleton.service';
import { Permisos } from '@core/typescript/permisos';

export interface FacturacionPermissionsState {
  hasPermisoPreVenta: boolean;
  hasPermisoCotizacion: boolean;
  hasPermisoCamiones: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FacturacionPermissionsService {
  async getInitialPermissions(): Promise<FacturacionPermissionsState> {
    const [hasPermisoPreVenta, hasPermisoCotizacion, hasPermisoCamiones] = await Promise.all([
      Ss.permissionsService.hasPermission(Object.values(Permisos.pre_venta)),
      Ss.permissionsService.hasPermission(Object.values(Permisos.cotizacion)),
      Ss.permissionsService.hasPermission(Permisos.factura_venta.seleccionar_camion_en_facturacion),
    ]);

    const usaModuloViajes = Ss.configServ?.config?.usa_modulo_viajes !== false;

    return {
      hasPermisoPreVenta,
      hasPermisoCotizacion,
      hasPermisoCamiones: usaModuloViajes && hasPermisoCamiones,
    };
  }
}
