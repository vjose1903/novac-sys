import { Injectable } from '@angular/core';
import { SharedResourceLoadOptions, SharedResourceState } from '@core/services/shared-resource-state.service';
import { CuadreCajaC } from '@core/typescript/cuadre_caja';

@Injectable({ providedIn: 'root' })
export class CuadreTodayStateService extends SharedResourceState<boolean> {
  private cuadreClass = new CuadreCajaC();

  protected async load(_options: SharedResourceLoadOptions): Promise<boolean> {
    const extra = {
      afterPath: 'check_today_cuadre',
      parameters: {},
      requestParams: [{ key: 'spinner', value: 'no_show' }],
    };
    const res = await this.cuadreClass.getAll(extra);
    const payload = res?.data?.data || res?.data || res;
    return Boolean(payload?.existe_cuadre_hoy ?? payload?.exists_cuadre_hoy);
  }
}
