import { Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MixinClass } from '@core/typescript/MixinClass';
import { Permisos } from '@core/typescript/permisos';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { TablasService } from '@components/new_tablas/tablas.service';
import { Ss } from '@core/services/singleton.service';
import { fun } from '@core/services/functions.service';
import { DivisaService } from '@admin/registros/divisa/divisa.service';
import { CuadreCajaSignalC, CuadreDenominacion, CuadreDivisa, CuadreListItem, CuadreMovimiento, CuadrePrepareResponse, CuadreSystemIncome } from './cuadre-caja.model';

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
  divisaPrincipal = signal<CuadreDivisa | null>(null);
  divisas = signal<CuadreDivisa[]>([]);
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
  readonly principalDivisaOptions = computed(() => {
    const divisa = this.divisaPrincipal();
    return divisa ? [divisa] : [];
  });
  readonly foreignDivisaOptions = computed(() => {
    const principalId = this.divisaPrincipal()?.id || this.divisaServ.getDivisaPrincipalInfo()?.id;
    return this.divisas().filter(divisa => divisa.id !== principalId && !divisa.is_principal);
  });
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
    return this.formatAmount(all.reduce((total, item) => total + this.denominationTotal(item), 0));
  });

  readonly otherPaymentMethodsTotal = computed(() => this.sumMovements(this.otherPaymentMethods()));
  readonly additionalTransfersTotal = computed(() => this.sumMovements(this.additionalTransfers()));
  readonly summaryTotals = computed(() => ({
    ...this.totals(),
    final_consumer_invoices_total: this.systemIncome().final_consumer_invoices_total,
    income_receipts_total: this.systemIncome().income_receipts_total,
  }));
  readonly systemPaymentMethods = computed(() => {
    const methods = this.systemIncome().payment_methods || {};
    return [
      { label: 'Efectivo', value: this.formatAmount(methods.cash || '0.00') },
      { label: 'Cheques', value: this.formatAmount(methods.check || '0.00') },
      { label: 'Tarjetas', value: this.formatAmount(methods.card || '0.00') },
      { label: 'Transferencias', value: this.formatAmount(methods.bank_transfer || '0.00') },
    ];
  });
  readonly closingDateValue = computed(() => this.dateFromString(this.closingDate()));

  readonly readOnly = computed(() => {
    const status = this.selectedCuadre()?.status || this.selectedCuadre()?.estado;
    const isToday = this.closingDate() === this.today();
    return !isToday || !this.selectedIsNewFlow() || (this.existsCuadre() && !['draft', 'reopened', 'rejected'].includes(status));
  });

  readonly operationalTotal = computed(() => {
    return this.formatAmount(Number(fun.desformatearStNumber(this.physicalCashTotal())) + Number(fun.desformatearStNumber(this.otherPaymentMethodsTotal())) + Number(fun.desformatearStNumber(this.additionalTransfersTotal())));
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

  constructor(private tServ: TablasService, private divisaServ: DivisaService, private route: ActivatedRoute) {
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
    this.ensureDivisasLoaded();
    if (this.route.snapshot.queryParamMap.get('nuevo') === 'true') this.nuevoRegistro();
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

  formatAmount(value: string | number) {
    return fun.roundNumberToDecimal(value || '0.00');
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

  private applyPrepareResponse(response: CuadrePrepareResponse | any) {
    const prepareResponse = this.unwrapPrepareResponse(response);
    if (!prepareResponse) return;

    const stored = prepareResponse.exists_cuadre ? prepareResponse.cuadre : null;
    this.divisaPrincipal.set(prepareResponse.divisa_principal || stored?.divisa_principal || null);
    this.divisas.set(prepareResponse.divisas || stored?.divisas || []);
    const normalized = this.normalizePreparedData(prepareResponse, stored);

    this.existsCuadre.set(prepareResponse.exists_cuadre);
    this.source.set(prepareResponse.source);
    this.selectedCuadre.set(stored ? this.mapListItem(stored) : null);
    this.closingDate.set(prepareResponse.closing_date || this.closingDate());
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

  private unwrapPrepareResponse(response: CuadrePrepareResponse | any): CuadrePrepareResponse | null {
    return response?.data?.exists_cuadre !== undefined ? response.data : response;
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
          divisa_id: this.divisaIdByLine(item),
          denomination_value: item.denomination_value || '0.00',
          quantity: item.quantity || '0',
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
    const systemIncome = stored ? stored?.system_income || this.emptySystemIncome() : response.system_income || this.emptySystemIncome();
    const totals = stored ? stored?.totals || {} : response.totals || {};
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
      bills: isNewFlow ? this.normalizeDenominations([], denominaciones, 'bill', this.defaultBills()) : [],
      coins: isNewFlow ? this.normalizeDenominations([], denominaciones, 'coin', this.defaultCoins()) : [],
      foreignCurrency: isNewFlow ? this.normalizeDenominations([], denominaciones, 'foreign_currency', []) : [],
      otherPaymentMethods: isNewFlow ? this.normalizeMovements(stored ? [] : suggested, movimientos, 'other_payment_methods') : [],
      additionalTransfers: isNewFlow ? this.normalizeMovements([], movimientos, 'additional_transfers') : [],
    };
  }

  private normalizeDenominations(responseItems: CuadreDenominacion[] = [], storedItems: CuadreDenominacion[] = [], type, fallback: CuadreDenominacion[]) {
    const source = responseItems.length ? responseItems : storedItems.filter(item => item.denomination_type === type);
    const defaultCurrency = this.defaultCurrencyForType(type);
    const normalized = source.map(item => ({
      denomination_type: type,
      divisa_id: item.divisa_id || this.findDivisaByCurrencyCode(item.currency_code)?.id || defaultCurrency.divisa_id,
      currency_code: item.currency_code || defaultCurrency.currency_code,
      denomination_value: String(item.denomination_value || '0.00'),
      quantity: String(item.quantity || '0'),
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
      closing_date_label: this.formatDateLabel(item.closing_date || item.fecha),
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

  private formatDateLabel(date: string) {
    return date ? fun.date_formater({ date, dateFormat: 'DD/MM/YYYY' }) : '----------';
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
    return Number(item.denomination_value || 0) * Number(item.quantity || 0) * this.exchangeRateForDenomination(item);
  }

  private sumMovements(items: CuadreMovimiento[]) {
    return this.formatAmount(items.reduce((total, item) => total + Number(item.amount || 0), 0));
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
    this.divisaPrincipal.set(null);
    this.divisas.set([]);
    this.bills.set(this.defaultBills());
    this.coins.set(this.defaultCoins());
    this.foreignCurrency.set([]);
    this.otherPaymentMethods.set([]);
    this.additionalTransfers.set([]);
  }

  private defaultBills(): CuadreDenominacion[] {
    const currency = this.defaultCurrencyForType('bill');
    return ['50.00', '100.00', '200.00', '500.00', '1000.00', '2000.00'].map(value => ({
      denomination_type: 'bill',
      ...currency,
      denomination_value: value,
      quantity: '0',
    }));
  }

  private defaultCoins(): CuadreDenominacion[] {
    const currency = this.defaultCurrencyForType('coin');
    return ['5.00', '10.00', '25.00'].map(value => ({
      denomination_type: 'coin',
      ...currency,
      denomination_value: value,
      quantity: '0',
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

  private ensureDivisasLoaded() {
    if (this.divisaServ.listaDivisas.length) {
      this.applyDefaultDivisas();
      return;
    }

    this.divisaServ.getDivisas().then(() => this.applyDefaultDivisas());
  }

  private applyDefaultDivisas() {
    this.bills.set(this.applyDefaultCurrencyToItems(this.bills(), 'bill'));
    this.coins.set(this.applyDefaultCurrencyToItems(this.coins(), 'coin'));
    this.foreignCurrency.set(this.applyDefaultCurrencyToItems(this.foreignCurrency(), 'foreign_currency'));
  }

  private applyDefaultCurrencyToItems(items: CuadreDenominacion[], type) {
    const defaultCurrency = this.defaultCurrencyForType(type);
    return items.map(item => {
      if (item.divisa_id) return item;
      const divisa = this.findDivisaByCurrencyCode(item.currency_code);
      return {
        ...item,
        divisa_id: divisa?.id || defaultCurrency.divisa_id,
        currency_code: item.currency_code || defaultCurrency.currency_code,
      };
    });
  }

  private defaultCurrencyForType(type) {
    const divisa = type === 'foreign_currency' ? this.getDefaultForeignDivisa() : this.divisaPrincipal() || this.divisaServ.getDivisaPrincipalInfo();
    return {
      divisa_id: divisa?.id,
      currency_code: this.currencyCode(divisa) || (type === 'foreign_currency' ? 'USD' : 'DOP'),
    };
  }

  private getDefaultForeignDivisa() {
    const principalId = this.divisaPrincipal()?.id || this.divisaServ.getDivisaPrincipalInfo()?.id;
    return (
      this.divisas().find(item => item.id !== principalId && !item.is_principal) ||
      this.divisaServ.listaDivisas.find(item => item.estado && item.id !== principalId && !item.is_principal) ||
      this.divisaServ.listaDivisas.find(item => item.id !== principalId && !item.is_principal)
    );
  }

  private findDivisaByCurrencyCode(currencyCode: string) {
    if (!currencyCode) return undefined;
    return [this.divisaPrincipal(), ...this.divisas(), ...this.divisaServ.listaDivisas]
      .filter(item => !!item)
      .find(divisa => [this.currencyCode(divisa), divisa?.code, divisa?.simbolo].includes(currencyCode));
  }

  private exchangeRateForDenomination(item: CuadreDenominacion) {
    if (item.denomination_type !== 'foreign_currency') return 1;
    const divisa = [this.divisaPrincipal(), ...this.divisas(), ...this.divisaServ.listaDivisas]
      .filter(value => !!value)
      .find(divisa => divisa.id == item.divisa_id);
    return Number(divisa?.current_tasa || 1);
  }

  private divisaIdByLine(item: CuadreDenominacion) {
    return item.divisa_id || this.defaultCurrencyForType(item.denomination_type).divisa_id;
  }

  private currencyCode(divisa: any) {
    return divisa?.code || divisa?.codigo || divisa?.simbolo || divisa?.nombre || '';
  }
}
