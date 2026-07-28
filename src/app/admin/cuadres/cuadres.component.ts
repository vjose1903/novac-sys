import { Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MixinClass } from '@core/typescript/MixinClass';
import { Permisos } from '@core/typescript/permisos';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { TablasService } from '@components/new_tablas/tablas.service';
import { Ss } from '@core/services/singleton.service';
import { CuadreCajaSignalC, CuadreDenominacion, CuadreListItem, CuadreMovimiento, CuadrePrepareResponse, CuadreSystemIncome } from './cuadre-caja.model';

interface CuadreListRequest {
  page: number;
  per_page: number;
  search: string;
  nonce: number;
}

interface CuadreSaveRequest {
  body: any;
  nonce: number;
}

interface CuadreActionRequest {
  id: number;
  action: string;
  nonce: number;
}

@Component({
  selector: 'app-cuadres',
  templateUrl: './cuadres.component.html',
  styleUrls: ['./cuadres.component.scss'],
  standalone: false,
})
export class CuadresComponent extends MixinClass implements OnInit, OnDestroy {
  permissions = Permisos;
  formPermissions = [Permisos.cuadre_caja.create, Permisos.cuadre_caja.update];
  private cuadreApi = new CuadreCajaSignalC();

  tablaComponent;

  listRequest = signal<CuadreListRequest>({ page: 1, per_page: 20, search: ' ', nonce: Date.now() });
  prepareClosingDate = signal<string | null>(null);
  saveRequest = signal<CuadreSaveRequest | null>(null);
  actionRequest = signal<CuadreActionRequest | null>(null);

  isCreando = signal(false);
  step = signal(1);
  selectedCuadre = signal<any | null>(null);
  closingDate = signal(this.today());
  source = signal<'stored' | 'calculated' | null>(null);
  existsCuadre = signal(false);
  notes = signal('');
  reconciliationTolerance = signal('0.00');
  systemIncome = signal<CuadreSystemIncome>(this.emptySystemIncome());
  totals = signal<Record<string, string>>({});
  bills = signal<CuadreDenominacion[]>(this.defaultBills());
  coins = signal<CuadreDenominacion[]>(this.defaultCoins());
  foreignCurrency = signal<CuadreDenominacion[]>([]);
  otherPaymentMethods = signal<CuadreMovimiento[]>([]);
  additionalTransfers = signal<CuadreMovimiento[]>([]);

  table_config: table_config = {
    info: [
      {
        titulo: '',
        titulo_sm: '',
        tipo: 'icon',
        key: 'flow_indicator',
        style: { width: '3rem' },
        iconsArray: [
          {
            key: 'legacy_flow_icon',
            rowTooltip: 'legacy_flow_tooltip',
            text_color: 'legacy_flow_color',
            showCondition: [{ kind: 'campo', target: 'is_new_flow', value: [false] }],
          },
        ],
      },
      { titulo: 'Fecha', tipo: 'text', key: 'closing_date_label' },
      { titulo: 'Estado', tipo: 'tag', key: 'status_label', tag_severity: 'status_severity' },
      { titulo: 'Total sistema', tipo: 'formatoNumero', key: 'system_income_total', textAlign: 'end' },
      { titulo: 'Total operativo', tipo: 'formatoNumero', key: 'operational_total', textAlign: 'end' },
      { titulo: 'Diferencia', tipo: 'formatoNumero', key: 'difference', textAlign: 'end' },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_cuadres',
    padre_functions: { data_request: params => this.loadCuadres(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { mostrar: { show: true, permiso: this.permissions.cuadre_caja.read_one } },
  };

  readonly selectedIsNewFlow = computed(() => this.resolveIsNewFlow(this.selectedCuadre()));
  readonly listaCuadres = computed(() => {
    const response = this.listResource.value();
    const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    return data.map(item => this.mapListItem(item));
  });
  readonly listaCuadresTotal = computed(() => {
    const response = this.listResource.value();
    const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    return response?.total_registros || data.length;
  });

  readonly physicalCashTotal = computed(() => {
    const all = [...this.bills(), ...this.coins(), ...this.foreignCurrency()];
    return all.reduce((total, item) => total + this.denominationTotal(item), 0).toFixed(2);
  });

  readonly otherPaymentMethodsTotal = computed(() => this.sumMovements(this.otherPaymentMethods()));
  readonly additionalTransfersTotal = computed(() => this.sumMovements(this.additionalTransfers()));
  readonly summaryTotals = computed(() => ({
    ...this.totals(),
    final_consumer_invoices_total: this.systemIncome().final_consumer_invoices_total,
    income_receipts_total: this.systemIncome().income_receipts_total,
  }));
  readonly closingDateValue = computed(() => this.dateFromString(this.closingDate()));

  readonly readOnly = computed(() => {
    const status = this.selectedCuadre()?.status || this.selectedCuadre()?.estado;
    const isToday = this.closingDate() === this.today();
    return !isToday || !this.selectedIsNewFlow() || (this.existsCuadre() && !['draft', 'reopened', 'rejected'].includes(status));
  });

  readonly operationalTotal = computed(() => {
    return (Number(this.physicalCashTotal()) + Number(this.otherPaymentMethodsTotal()) + Number(this.additionalTransfersTotal())).toFixed(2);
  });

  listResource = httpResource<any>(() => {
    const request = this.listRequest();
    return this.cuadreApi.getAllRequest({
      parameters: {
        page: request.page,
        per_page: request.per_page,
        paginado: true,
        search: request.search || ' ',
      },
      requestParams: [{ key: 'spinner', value: 'no_show' }],
    });
  }, { defaultValue: { data: [], total_registros: 0 } });

  prepareResource = httpResource<CuadrePrepareResponse>(() => {
    const date = this.prepareClosingDate();
    if (!date) return undefined;
    return this.cuadreApi.prepareRequest(date);
  }, { defaultValue: null });

  saveResource = httpResource<any>(() => {
    const request = this.saveRequest();
    if (!request) return undefined;
    return this.cuadreApi.customRequest(request.body);
  }, { defaultValue: null });

  stateActionResource = httpResource<any>(() => {
    const request = this.actionRequest();
    if (!request) return undefined;
    return this.cuadreApi.actionRequest(request.id, request.action, {});
  }, { defaultValue: null });

  constructor(private tServ: TablasService) {
    super();

    effect(() => {
      const total = this.listaCuadresTotal();
      queueMicrotask(() => this.tablaComponent?.changeTableConfig([{ total_count: total }]));
    });

    effect(() => {
      const status = this.prepareResource.status();
      if (status === 'resolved' && this.prepareClosingDate()) this.applyPrepareResponse(this.prepareResource.value());
    });

    effect(() => {
      const status = this.saveResource.status();
      if (status === 'resolved' && this.saveRequest()) this.afterSave(this.saveResource.value());
    });

    effect(() => {
      const status = this.stateActionResource.status();
      if (status === 'resolved' && this.actionRequest()) this.afterAction(this.stateActionResource.value());
    });
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'cuadres', is_routing: true });
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  loadCuadres(params?: { per_page?: number; page?: number; search?: string }) {
    this.listRequest.set({
      page: params?.page || 1,
      per_page: params?.per_page || 20,
      search: params?.search || ' ',
      nonce: Date.now(),
    });
  }

  nuevoRegistro() {
    this.resetForm();
    this.isCreando.set(true);
  }

  prepare() {
    if (!this.closingDate()) return;
    this.prepareClosingDate.set(this.closingDate());
    this.step.set(2);
  }

  setClosingDate(date: Date | string) {
    if (!date) return;
    this.closingDate.set(typeof date === 'string' ? date : this.dateToString(date));
  }

  saveCuadre() {
    if (this.readOnly()) return;
    this.saveRequest.set({ body: this.buildSaveBody(), nonce: Date.now() });
  }

  runStateAction(action: string) {
    if (!this.isCurrentClosingDate() || !this.selectedIsNewFlow()) return;
    const id = Number(this.selectedCuadre()?.id);
    if (!id) return;
    this.actionRequest.set({ id, action, nonce: Date.now() });
  }

  closeForm() {
    this.isCreando.set(false);
    this.selectedCuadre.set(null);
    this.prepareClosingDate.set(null);
    this.step.set(1);
  }

  tableClick_action(params) {
    if (params.action === 'mostrar' || params.action === 'editar') this.openStoredCuadre(params.data);
  }

  handle_table_events(event) {
    if (event.type === 'click_action') this.tableClick_action(event.info);
    if (event.type === 'clickRow') this.openStoredCuadre(event.info);
  }

  openStoredCuadre(data: CuadreListItem) {
    const date = data.closing_date || data.fecha;
    if (!date) return;

    this.resetForm();
    this.selectedCuadre.set(data);
    this.closingDate.set(date);
    this.isCreando.set(true);
    this.prepareClosingDate.set(date);
    this.step.set(2);
  }

  setBills(items: CuadreDenominacion[]) {
    this.bills.set(items);
  }

  setCoins(items: CuadreDenominacion[]) {
    this.coins.set(items);
  }

  setForeignCurrency(items: CuadreDenominacion[]) {
    this.foreignCurrency.set(items);
  }

  setOtherPaymentMethods(items: CuadreMovimiento[]) {
    this.otherPaymentMethods.set(items.map(item => ({ ...item, movement_group: 'other_payment_methods' })));
  }

  setAdditionalTransfers(items: CuadreMovimiento[]) {
    this.additionalTransfers.set(items.map(item => ({ ...item, movement_group: 'additional_transfers' })));
  }

  canSubmit() {
    const status = this.selectedCuadre()?.status || this.selectedCuadre()?.estado;
    return this.selectedIsNewFlow() && this.isCurrentClosingDate() && Number(this.selectedCuadre()?.id) && ['draft', 'reopened', 'rejected'].includes(status);
  }

  canReview() {
    return this.selectedIsNewFlow() && this.isCurrentClosingDate() && (this.selectedCuadre()?.status || this.selectedCuadre()?.estado) === 'submitted';
  }

  canApproveReject() {
    return this.selectedIsNewFlow() && this.isCurrentClosingDate() && (this.selectedCuadre()?.status || this.selectedCuadre()?.estado) === 'reviewed';
  }

  canReopen() {
    return this.selectedIsNewFlow() && this.isCurrentClosingDate() && ['submitted', 'reviewed', 'approved', 'rejected'].includes(this.selectedCuadre()?.status || this.selectedCuadre()?.estado);
  }

  private applyPrepareResponse(response: CuadrePrepareResponse) {
    if (!response) return;

    const stored = response.exists_cuadre ? response.cuadre : null;
    const normalized = this.normalizePreparedData(response, stored);

    this.existsCuadre.set(response.exists_cuadre);
    this.source.set(response.source);
    this.selectedCuadre.set(stored ? this.mapListItem(stored) : null);
    this.closingDate.set(response.closing_date || this.closingDate());
    this.systemIncome.set(normalized.systemIncome);
    this.totals.set(normalized.totals);
    this.notes.set(normalized.notes);
    this.reconciliationTolerance.set(normalized.reconciliationTolerance);
    this.bills.set(normalized.bills);
    this.coins.set(normalized.coins);
    this.foreignCurrency.set(normalized.foreignCurrency);
    this.otherPaymentMethods.set(normalized.otherPaymentMethods);
    this.additionalTransfers.set(normalized.additionalTransfers);
    this.step.set(3);
  }

  private afterSave(response: any) {
    const cuadre = response?.data || response?.cuadre || response;
    if (cuadre) this.selectedCuadre.set(cuadre);
    this.existsCuadre.set(true);
    this.step.set(4);
    this.loadCuadres(this.tServ.getPaginationById('lista_cuadres') || this.listRequest());
    Ss.layServ.nextCheckCuadreToday(true);
  }

  private afterAction(response: any) {
    const cuadre = response?.data || response?.cuadre || response;
    if (cuadre) this.selectedCuadre.set(cuadre);
    this.loadCuadres(this.tServ.getPaginationById('lista_cuadres') || this.listRequest());
  }

  private buildSaveBody() {
    return {
      cuadre_caja: {
        closing_date: this.closingDate(),
        notes: this.notes() || '',
        reconciliation_tolerance: this.reconciliationTolerance() || '0.00',
        denominaciones: [...this.bills(), ...this.coins(), ...this.foreignCurrency()].map(item => ({
          denomination_type: item.denomination_type,
          currency_code: item.currency_code || 'DOP',
          denomination_value: item.denomination_value || '0.00',
          quantity: item.quantity || '0',
          exchange_rate: item.exchange_rate || '1.000000',
        })),
        movimientos: [...this.otherPaymentMethods(), ...this.additionalTransfers()].map(item => ({
          movement_group: item.movement_group,
          payment_method: item.payment_method,
          description: item.description || '',
          reference: item.reference || '',
          amount: item.amount || '0.00',
        })),
      },
    };
  }

  private normalizePreparedData(response: CuadrePrepareResponse, stored: any) {
    const denominaciones = stored?.denominaciones || stored?.denominations || [];
    const movimientos = stored?.movimientos || stored?.movements || [];
    const responseMovements = response.movements || {};
    const responseDenominations = response.denominations || {};
    const systemIncome = response.system_income || stored?.system_income || this.emptySystemIncome();
    const totals = response.totals || stored?.totals || {};
    const suggested = (responseMovements.suggested_from_system || []).map(item => ({ ...item, movement_group: item.movement_group || 'other_payment_methods' }));
    const isNewFlow = stored ? this.resolveIsNewFlow(stored) : true;

    return {
      systemIncome: {
        ...this.emptySystemIncome(),
        ...systemIncome,
        final_consumer_invoices_total: systemIncome.final_consumer_invoices_total || totals.final_consumer_invoices_total || '0.00',
        income_receipts_total: systemIncome.income_receipts_total || totals.income_receipts_total || '0.00',
        system_income_total: systemIncome.system_income_total || totals.system_income_total || '0.00',
      },
      totals,
      notes: stored?.notes || '',
      reconciliationTolerance: stored?.reconciliation_tolerance || '0.00',
      bills: isNewFlow ? this.normalizeDenominations(responseDenominations.bills, denominaciones, 'bill', this.defaultBills()) : [],
      coins: isNewFlow ? this.normalizeDenominations(responseDenominations.coins, denominaciones, 'coin', this.defaultCoins()) : [],
      foreignCurrency: isNewFlow ? this.normalizeDenominations(responseDenominations.foreign_currency, denominaciones, 'foreign_currency', []) : [],
      otherPaymentMethods: isNewFlow ? this.normalizeMovements([...(responseMovements.other_payment_methods || []), ...suggested], movimientos, 'other_payment_methods') : [],
      additionalTransfers: isNewFlow ? this.normalizeMovements(responseMovements.additional_transfers, movimientos, 'additional_transfers') : [],
    };
  }

  private normalizeDenominations(responseItems: CuadreDenominacion[] = [], storedItems: CuadreDenominacion[] = [], type, fallback: CuadreDenominacion[]) {
    const source = responseItems.length ? responseItems : storedItems.filter(item => item.denomination_type === type);
    const normalized = source.map(item => ({
      denomination_type: type,
      currency_code: item.currency_code || (type === 'foreign_currency' ? 'USD' : 'DOP'),
      denomination_value: String(item.denomination_value || '0.00'),
      quantity: String(item.quantity || '0'),
      exchange_rate: String(item.exchange_rate || '1.000000'),
    }));

    return normalized.length ? normalized : fallback;
  }

  private normalizeMovements(responseItems: CuadreMovimiento[] = [], storedItems: CuadreMovimiento[] = [], group) {
    const source = responseItems.length ? responseItems : storedItems.filter(item => item.movement_group === group);
    return source.map(item => ({
      movement_group: group,
      payment_method: item.payment_method || 'other',
      description: item.description || '',
      reference: item.reference || '',
      amount: String(item.amount || '0.00'),
    }));
  }

  private mapListItem(item: any) {
    const status = item.status || item.estado || 'draft';
    const isNewFlow = this.resolveIsNewFlow(item);
    return {
      ...item,
      is_new_flow: isNewFlow,
      flow_label: isNewFlow ? 'Nuevo' : 'Antiguo',
      flow_severity: isNewFlow ? 'success' : 'warn',
      legacy_flow_icon: 'fas fa-history',
      legacy_flow_tooltip: 'Realizado con el modelo antiguo',
      legacy_flow_color: 'warning',
      closing_date_label: item.closing_date || item.fecha || '----------',
      status_label: this.statusLabel(status),
      status_severity: this.statusSeverity(status),
      system_income_total: item.system_income_total || item.totals?.system_income_total || '0.00',
      operational_total: item.operational_total || item.totals?.operational_total || item.total || '0.00',
      difference: item.difference || item.totals?.difference || '0.00',
    };
  }

  private statusLabel(status: string) {
    const labels = {
      draft: 'Borrador',
      submitted: 'Enviado',
      reviewed: 'Revisado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      reopened: 'Reabierto',
    };

    return labels[status] || status || 'Borrador';
  }

  private statusSeverity(status: string) {
    const severities = {
      draft: 'info',
      submitted: 'warn',
      reviewed: 'warn',
      approved: 'success',
      rejected: 'danger',
      reopened: 'info',
    };

    return severities[status] || 'info';
  }

  private resolveIsNewFlow(item: any) {
    if (!item) return true;
    if (typeof item.is_new_flow === 'boolean') return item.is_new_flow;
    if (item.flow_type === 'new') return true;
    if (item.flow_type === 'legacy') return false;
    if (item.closing_version === 'detailed') return true;
    if (item.closing_version === 'legacy') return false;
    return false;
  }

  private denominationTotal(item: CuadreDenominacion) {
    return Number(item.denomination_value || 0) * Number(item.quantity || 0) * Number(item.exchange_rate || 1);
  }

  private sumMovements(items: CuadreMovimiento[]) {
    return items.reduce((total, item) => total + Number(item.amount || 0), 0).toFixed(2);
  }

  private resetForm() {
    this.step.set(1);
    this.selectedCuadre.set(null);
    this.existsCuadre.set(false);
    this.source.set(null);
    this.notes.set('');
    this.reconciliationTolerance.set('0.00');
    this.systemIncome.set(this.emptySystemIncome());
    this.totals.set({});
    this.bills.set(this.defaultBills());
    this.coins.set(this.defaultCoins());
    this.foreignCurrency.set([]);
    this.otherPaymentMethods.set([]);
    this.additionalTransfers.set([]);
  }

  private defaultBills(): CuadreDenominacion[] {
    return ['50.00', '100.00', '200.00', '500.00', '1000.00', '2000.00'].map(value => ({
      denomination_type: 'bill',
      currency_code: 'DOP',
      denomination_value: value,
      quantity: '0',
      exchange_rate: '1.000000',
    }));
  }

  private defaultCoins(): CuadreDenominacion[] {
    return ['5.00', '10.00', '25.00'].map(value => ({
      denomination_type: 'coin',
      currency_code: 'DOP',
      denomination_value: value,
      quantity: '0',
      exchange_rate: '1.000000',
    }));
  }

  private emptySystemIncome(): CuadreSystemIncome {
    return {
      final_consumer_invoices_total: '0.00',
      income_receipts_total: '0.00',
      system_income_total: '0.00',
      payment_methods: {},
      invoice_payment_methods: {},
      receipt_payment_methods: {},
      invoices: [],
      receipts: [],
    };
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private isCurrentClosingDate() {
    return this.closingDate() === this.today();
  }

  private dateFromString(date: string) {
    if (!date) return null;
    const [year, month, day] = date.split('-').map(value => Number(value));
    return new Date(year, month - 1, day);
  }

  private dateToString(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
