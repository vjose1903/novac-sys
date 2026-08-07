import { Component, OnDestroy, OnInit, computed, effect, signal, untracked } from '@angular/core';
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
import { CuadreC } from './cuadres';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

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
  body?: any;
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
  savedInCurrentForm = signal(false);
  step = signal(1);
  selectedCuadre = signal<any | null>(null);
  closingDate = signal(this.today());
  source = signal<'stored' | 'calculated' | null>(null);
  existsCuadre = signal(false);
  notes = signal('');
  reconciliationTolerance = signal('0.00');
  nextDayCashFund = signal('0.00');
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
    if (this.useStoredTotals()) return this.formatAmount(this.totals()?.physical_cash_total || '0.00');
    const all = [...this.bills(), ...this.coins(), ...this.foreignCurrency()];
    return this.formatAmount(all.reduce((total, item) => total + this.denominationTotal(item), 0));
  });

  readonly otherPaymentMethodsTotal = computed(() => (this.useStoredTotals() ? this.formatAmount(this.totals()?.other_payment_methods_total || '0.00') : this.sumMovements(this.otherPaymentMethods())));
  readonly additionalTransfersTotal = computed(() => (this.useStoredTotals() ? this.formatAmount(this.totals()?.additional_transfers_total || '0.00') : this.sumMovements(this.additionalTransfers())));
  readonly summaryTotals = computed(() => ({
    ...this.totals(),
    final_consumer_invoices_total: this.systemIncome().final_consumer_invoices_total,
    income_receipts_total: this.systemIncome().income_receipts_total,
    credit_invoices_total: this.creditInvoicesTotal(),
    opening_cash_fund: this.openingCashFund(),
    expected_total: this.expectedTotal(),
    difference_amount: this.differenceAmount(),
  }));
  readonly systemPaymentMethods = computed(() => {
    return [
      { label: 'Efectivo', value: this.formatAmount(this.systemPaymentMethodTotal('cash')) },
      { label: 'Cheques', value: this.formatAmount(this.systemPaymentMethodTotal('check')) },
      { label: 'Tarjetas', value: this.formatAmount(this.systemPaymentMethodTotal('card')) },
      { label: 'Transferencias', value: this.formatAmount(this.systemPaymentMethodTotal('bank_transfer')) },
    ];
  });
  readonly legacySummaryRows = computed(() => {
    const cuadre = this.selectedCuadre() || {};
    const contenido = Array.isArray(cuadre.contenido_reporte) ? cuadre.contenido_reporte : [];
    if (contenido.length) return contenido.map(item => ({ label: item.titulo, value: item.valor }));

    return [
      { label: 'Total facturado a contado', value: cuadre.total_venta_contado || cuadre.final_consumer_invoices_total || cuadre.system_income_total || cuadre.totals?.system_income_total || '0.00' },
      { label: 'Total recibo de ingreso', value: cuadre.total_recibo_ingreso || cuadre.income_receipts_total || '0.00' },
      { label: 'Total anterior', value: cuadre.total_anterior || '0.00' },
      { label: 'Total en caja', value: cuadre.total_general || cuadre.operational_total || cuadre.totals?.operational_total || cuadre.total || '0.00' },
      { label: 'Total facturado a crédito', value: cuadre.total_venta_credito || '0.00' },
    ];
  });
  readonly closingDateValue = computed(() => this.dateFromString(this.closingDate()));

  readonly readOnly = computed(() => {
    const status = this.selectedCuadre()?.status || this.selectedCuadre()?.estado;
    const isToday = this.closingDate() === this.today();
    return !isToday || !this.selectedIsNewFlow() || (this.existsCuadre() && !['reopened', 'rejected'].includes(status));
  });
  readonly useStoredTotals = computed(() => this.existsCuadre() && this.selectedIsNewFlow() && this.readOnly());

  readonly operationalTotal = computed(() => {
    if (this.useStoredTotals()) return this.formatAmount(this.totals()?.operational_total || '0.00');
    return this.formatAmount(Number(fun.desformatearStNumber(this.physicalCashTotal())) + Number(fun.desformatearStNumber(this.otherPaymentMethodsTotal())) + Number(fun.desformatearStNumber(this.additionalTransfersTotal())));
  });
  readonly openingCashFund = computed(() => this.totals()?.opening_cash_fund || '0.00');
  readonly creditInvoicesTotal = computed(() => this.systemIncome().credit_invoices_total || this.totals()?.credit_invoices_total || '0.00');
  readonly expectedTotal = computed(() => this.totals()?.expected_total || this.formatAmount(Number(fun.desformatearStNumber(this.systemIncome().system_income_total || 0)) + Number(fun.desformatearStNumber(this.openingCashFund() || 0))));
  readonly differenceAmount = computed(() => (this.useStoredTotals() ? this.formatAmount(this.totals()?.difference_amount || '0.00') : this.formatAmount(Number(fun.desformatearStNumber(this.operationalTotal() || 0)) - Number(fun.desformatearStNumber(this.expectedTotal() || 0)))));

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
    return this.cuadreApi.actionRequest(request.id, request.action, request.body || {});
  }, { defaultValue: null });

  constructor(private tServ: TablasService, private divisaServ: DivisaService, private route: ActivatedRoute, private dynamicModalServ: DynamicModalService) {
    super();

    effect(() => {
      const total = this.listaCuadresTotal();
      queueMicrotask(() => this.tablaComponent?.changeTableConfig([{ total_count: total }]));
    });

    effect(() => {
      const status = this.prepareResource.status();
      const request = this.prepareClosingDate();
      const value = this.prepareResource.value();
      if (status === 'resolved' && request) {
        untracked(() => {
          this.prepareClosingDate.set(null);
          this.applyPrepareResponse(value);
        });
      }
    });

    effect(() => {
      const status = this.saveResource.status();
      const request = this.saveRequest();
      const value = this.saveResource.value();
      if (status === 'resolved' && request) {
        untracked(() => {
          this.saveRequest.set(null);
          this.afterSave(value);
        });
      }
    });

    effect(() => {
      const status = this.stateActionResource.status();
      const request = this.actionRequest();
      const value = this.stateActionResource.value();
      if (status === 'resolved' && request) {
        untracked(() => {
          this.actionRequest.set(null);
          this.afterAction(value);
        });
      }
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
    this.closingDate.set(this.today());
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

  clearForm() {
    this.resetForm();
    this.closingDate.set(this.today());
  }

  saveCuadre() {
    if (this.readOnly()) return;
    this.saveRequest.set({ body: this.buildSaveBody(), nonce: Date.now() });
  }

  printCuadre() {
    const fecha = this.selectedCuadre()?.closing_date || this.selectedCuadre()?.fecha || this.closingDate();
    if (!fecha) return;
    CuadreC.imprimirReportePorFecha(fecha, !this.savedInCurrentForm()).catch(error => {
      if (!error?.handled) fun.toastError(error?.msg || 'Error al imprimir el cuadre', 'ERROR');
    });
  }

  runStateAction(action: string) {
    const canProcessHistoricalReview = ['approve', 'reject'].includes(action);
    if ((!this.isCurrentClosingDate() && !canProcessHistoricalReview) || !this.selectedIsNewFlow()) return;
    const id = Number(this.selectedCuadre()?.id);
    if (!id) return;
    if (action === 'reject') {
      this.openRejectModal(id);
      return;
    }
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
    return this.selectedIsNewFlow() && this.isCurrentClosingDate() && Number(this.selectedCuadre()?.id) && ['reopened', 'rejected'].includes(status);
  }

  canApproveReject() {
    return this.selectedIsNewFlow() && Number(this.selectedCuadre()?.id) && (this.selectedCuadre()?.status || this.selectedCuadre()?.estado) === 'submitted';
  }

  canReopen() {
    return this.selectedIsNewFlow() && this.isCurrentClosingDate() && ['approved', 'rejected', 'cancelled'].includes(this.selectedCuadre()?.status || this.selectedCuadre()?.estado);
  }

  private openRejectModal(id: number) {
    this.dynamicModalServ.confirmationModal({
      id: 'rechazar_cuadre_caja',
      header: 'Rechazar cuadre',
      width: '34rem',
      texto: '<p>Indica el motivo por el que este cuadre será rechazado.</p>',
      btnKind: confirmationButtons.cancelarRechazar,
      iconName: 'fa-solid fa-triangle-exclamation',
      iconColor: '#dc3545',
      showReasonInput: true,
      onYes: reason => this.actionRequest.set({ id, action: 'reject', body: { reason: reason || '' }, nonce: Date.now() }),
    });
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
    this.selectedCuadre.set(stored ? this.mapListItem({ ...stored, is_new_flow: this.resolvePrepareIsNewFlow(prepareResponse, stored) }) : null);
    this.closingDate.set(prepareResponse.closing_date || this.closingDate());
    this.systemIncome.set(normalized.systemIncome);
    this.totals.set(normalized.totals);
    this.notes.set(normalized.notes);
    this.reconciliationTolerance.set(normalized.reconciliationTolerance);
    this.nextDayCashFund.set(normalized.nextDayCashFund);
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
    this.savedInCurrentForm.set(true);
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
        next_day_cash_fund: this.toNumber(this.nextDayCashFund()),
        notes: this.notes() || '',
        reconciliation_tolerance: this.toNumber(this.reconciliationTolerance()),
        denominaciones: [...this.bills(), ...this.coins(), ...this.foreignCurrency()].map(item => ({
          denomination_type: item.denomination_type,
          divisa_id: this.divisaIdByLine(item),
          denomination_value: this.toNumber(item.denomination_value),
          quantity: this.toNumber(item.quantity),
        })),
        movimientos: [...this.otherPaymentMethods(), ...this.additionalTransfers()].map(item => ({
          movement_group: item.movement_group,
          payment_method: item.payment_method,
          description: item.description || '',
          reference: item.reference || '',
          amount: this.toNumber(item.amount),
        })),
      },
    };
  }

  private toNumber(value: any): number {
    const cleaned = String(value ?? '').replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  private normalizePreparedData(response: CuadrePrepareResponse, stored: any) {
    const denominaciones = stored?.denominaciones || stored?.denominations || [];
    const movimientos = stored?.movimientos || stored?.movements || [];
    const responseMovements = response.movements || {};
    const isNewFlow = this.resolvePrepareIsNewFlow(response, stored);
    const storedSystemIncome = stored?.system_income || stored?.system_income_details || {};
    const systemIncome = stored && isNewFlow ? storedSystemIncome : response.system_income || this.emptySystemIncome();
    const totals = stored ? stored?.totals || {} : response.totals || {};
    const suggested = (responseMovements.suggested_from_system || []).map(item => ({ ...item, movement_group: item.movement_group || 'other_payment_methods' }));

    return {
      systemIncome: {
        ...this.emptySystemIncome(),
        ...systemIncome,
        final_consumer_invoices_total: systemIncome.final_consumer_invoices_total || totals.final_consumer_invoices_total || '0.00',
        income_receipts_total: systemIncome.income_receipts_total || totals.income_receipts_total || '0.00',
        system_income_total: systemIncome.system_income_total || totals.system_income_total || '0.00',
        credit_invoices_total: systemIncome.credit_invoices_total || totals.credit_invoices_total || '0.00',
      },
      totals,
      notes: stored?.notes || '',
      reconciliationTolerance: stored?.reconciliation_tolerance || '0.00',
      nextDayCashFund: totals.next_day_cash_fund || stored?.next_day_cash_fund || stored?.fondo_caja_siguiente || stored?.fondo_para_siguiente_dia || '0.00',
      bills: isNewFlow ? this.normalizeDenominations([], denominaciones, 'bill', this.defaultBills()) : [],
      coins: isNewFlow ? this.normalizeDenominations([], denominaciones, 'coin', this.defaultCoins()) : [],
      foreignCurrency: isNewFlow ? this.normalizeDenominations([], denominaciones, 'foreign_currency', []) : [],
      otherPaymentMethods: isNewFlow ? this.normalizeMovements(stored ? [] : suggested, movimientos, 'other_payment_methods') : [],
      additionalTransfers: isNewFlow ? this.normalizeMovements([], movimientos, 'additional_transfers') : [],
    };
  }

  private resolvePrepareIsNewFlow(response: CuadrePrepareResponse | any, stored: any) {
    if (!response?.exists_cuadre) return true;
    if (typeof response?.is_new_flow === 'boolean') return response.is_new_flow;
    return this.resolveIsNewFlow(stored);
  }

  private normalizeDenominations(responseItems: CuadreDenominacion[] = [], storedItems: CuadreDenominacion[] = [], type, fallback: CuadreDenominacion[]) {
    const storedSource = this.denominationsByType(storedItems, type);
    const source = responseItems.length ? responseItems : storedSource;
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
    const storedSource = this.movementsByGroup(storedItems, group);
    const source = responseItems.length ? responseItems : storedSource;
    return source.map(item => ({
      movement_group: group,
      payment_method: this.normalizePaymentMethod(item.payment_method || item['method'] || item['forma_pago'] || item.description),
      description: item.description || '',
      reference: item.reference || '',
      amount: String(item.amount || '0.00'),
    }));
  }

  private systemPaymentMethodTotal(method: string) {
    const paymentMethods = this.systemIncome().payment_methods || {};
    const directAmount = this.paymentMethodAmount(paymentMethods, method);
    if (directAmount) return directAmount;

    const invoiceAmount = this.paymentMethodAmount(this.systemIncome().invoice_payment_methods || {}, method);
    const receiptAmount = this.paymentMethodAmount(this.systemIncome().receipt_payment_methods || {}, method);
    const documentsAmount = invoiceAmount + receiptAmount;
    if (documentsAmount) return documentsAmount;

    return [...this.otherPaymentMethods(), ...this.additionalTransfers()]
      .filter(item => this.normalizePaymentMethod(item.payment_method || item.description) === method)
      .reduce((total, item) => total + Number(fun.desformatearStNumber(item.amount || 0)), 0);
  }

  private paymentMethodAmount(source: Record<string, string>, method: string) {
    return Object.entries(source || {}).reduce((total, [key, value]) => (this.normalizePaymentMethod(key) === method ? total + Number(fun.desformatearStNumber(value || 0)) : total), 0);
  }

  private normalizePaymentMethod(method: string) {
    const value = String(method || '').toLowerCase();
    if (value.includes('efect') || value === 'cash') return 'cash';
    if (value.includes('cheq') || value === 'check') return 'check';
    if (value.includes('tarj') || value === 'card') return 'card';
    if (value.includes('transf') || value === 'bank_transfer') return 'bank_transfer';
    if (value.includes('dep') || value === 'deposit') return 'deposit';
    return value || 'other';
  }

  private denominationsByType(items: any, type): CuadreDenominacion[] {
    if (Array.isArray(items)) return items.filter(item => item.denomination_type === type);
    const key = type === 'bill' ? 'bills' : type === 'coin' ? 'coins' : 'foreign_currency';
    return Array.isArray(items?.[key]) ? items[key] : [];
  }

  private movementsByGroup(items: any, group): CuadreMovimiento[] {
    if (Array.isArray(items)) return items.filter(item => item.movement_group === group);
    return Array.isArray(items?.[group]) ? items[group] : [];
  }

  private mapListItem(item: any) {
    const status = item.status || item.estado || 'submitted';
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
      submitted: 'Enviado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      reopened: 'Reabierto',
      cancelled: 'Cancelado',
    };

    return labels[status] || status || 'Enviado';
  }

  private formatDateLabel(date: string) {
    return date ? fun.date_formater({ date, dateFormat: 'DD/MM/YYYY' }) : '----------';
  }

  private statusSeverity(status: string) {
    const severities = {
      submitted: 'warn',
      approved: 'success',
      rejected: 'danger',
      reopened: 'info',
      cancelled: 'secondary',
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
    return Number(fun.desformatearStNumber(item.denomination_value || 0)) * Number(fun.desformatearStNumber(item.quantity || 0)) * this.exchangeRateForDenomination(item);
  }

  private sumMovements(items: CuadreMovimiento[]) {
    return this.formatAmount(items.reduce((total, item) => total + Number(fun.desformatearStNumber(item.amount || 0)), 0));
  }

  private resetForm() {
    this.step.set(1);
    this.selectedCuadre.set(null);
    this.savedInCurrentForm.set(false);
    this.prepareClosingDate.set(null);
    this.existsCuadre.set(false);
    this.source.set(null);
    this.notes.set('');
    this.reconciliationTolerance.set('0.00');
    this.nextDayCashFund.set('0.00');
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
