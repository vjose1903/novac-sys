import { AfterViewInit, Component, computed, effect, ElementRef, OnDestroy, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MixinClass } from '@core/typescript/MixinClass';
import { getUrlInUse } from '@core/typescript/url-server.utils';
import { DashboardChartData, DashboardChartParserService, DashboardChartType } from './dashboard-chart-parser.service';
import { Subscription } from 'rxjs';
import { Ss } from '@core/services/singleton.service';

type DashboardBlockStatus = 'loading' | 'success' | 'no-data' | 'error';
type DashboardBlockType = 'hero' | 'kpi-section' | 'chart';
type DashboardPeriodPreset = 'last_week' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_9_months' | 'last_year' | 'custom_range';

interface DashboardAppliedFilter {
  preset: DashboardPeriodPreset;
  label: string;
  startDate: string;
  endDate: string;
}

interface DashboardDraftFilter extends DashboardAppliedFilter {
  startDateValue: Date | null;
  endDateValue: Date | null;
}

interface DashboardCard {
  id: string;
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  currency?: string;
  subtitle?: string;
  description?: string;
  severity?: 'info' | 'success' | 'warning' | 'danger';
}

interface DashboardHeroBlock {
  id: string;
  title: string;
  subtitle: string;
  appliedFilter: DashboardAppliedFilter;
  primaryKpis: DashboardCard[];
  focusItems: DashboardCard[];
}

interface DashboardKpiSection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  appliedFilter: DashboardAppliedFilter;
  cards: DashboardCard[];
}

interface DashboardChartBlock {
  id: string;
  title: string;
  subtitle: string;
  type?: DashboardChartType;
  appliedFilter: DashboardAppliedFilter;
  status?: DashboardBlockStatus;
  data: DashboardChartData;
  option?: any;
  fullscreenOption?: any;
  emptyMessage?: string;
  errorMessage?: string;
}

interface DashboardResponse {
  startDate: string;
  endDate: string;
  requestedBlocks: 'all' | string[];
  hero: DashboardHeroBlock | null;
  kpiSections: DashboardKpiSection[];
  charts: DashboardChartBlock[];
}

interface DashboardBlockState<T> {
  id: string;
  status: DashboardBlockStatus;
  data: T | null;
  error?: string;
}

interface DashboardBlockConfig {
  id: string;
  type: DashboardBlockType;
  title: string;
  subtitle: string;
  chartType?: DashboardChartBlock['type'];
  chartTypes?: DashboardChartType[];
}

interface PeriodOption {
  preset: DashboardPeriodPreset;
  label: string;
}

interface DashboardRequestContext {
  blockIds?: string[];
  requestedBlocks: string[];
  filter: DashboardAppliedFilter;
  nonce: number;
}


@Component({
    selector: 'app-homeAdmin',
    templateUrl: './homeAdmin.component.html',
    styleUrls: ['./homeAdmin.component.scss'],
    standalone: false
})
export class HomeAdminComponent extends MixinClass implements OnInit, AfterViewInit, OnDestroy {
  private readonly chartStorageKey = 'novac-dashboard-chart-types';
  private chartObserver?: IntersectionObserver;
  private chartViewportChangesSub?: Subscription;
  private themeConfigSub?: Subscription;
  private travelConfigSub?: Subscription;
  private readonly prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  @ViewChildren('chartViewport') private chartViewportRefs?: QueryList<ElementRef<HTMLElement>>;

  readonly periodOptions: PeriodOption[] = [
    { preset: 'last_week', label: 'Última semana' },
    { preset: 'last_month', label: 'Último mes' },
    { preset: 'last_3_months', label: 'Últimos 3 meses' },
    { preset: 'last_6_months', label: 'Últimos 6 meses' },
    { preset: 'last_9_months', label: 'Últimos 9 meses' },
    { preset: 'last_year', label: 'Último año' },
    { preset: 'custom_range', label: 'Rango personalizado' },
  ];

  readonly chartTypeOptions: Array<{ value: DashboardChartType; label: string }> = [
    { value: 'line', label: 'Línea' },
    { value: 'area-line', label: 'Área' },
    { value: 'bar', label: 'Barras' },
    { value: 'stacked-bar', label: 'Barras apiladas' },
    { value: 'ranking-bar', label: 'Ranking' },
    { value: 'pie', label: 'Pastel' },
    { value: 'doughnut', label: 'Dona' },
    { value: 'rose-pie', label: 'Rosa' },
    { value: 'funnel', label: 'Embudo' },
    { value: 'treemap', label: 'Mapa' },
    { value: 'radar', label: 'Radar' },
  ];

  readonly chartConfigs: DashboardBlockConfig[] = [
    { id: 'sales_by_period', type: 'chart', title: 'Ventas por período', subtitle: 'Evolución de ventas en el rango seleccionado.', chartType: 'area-line', chartTypes: ['area-line', 'line', 'bar'] },
    { id: 'cash_vs_credit_sales', type: 'chart', title: 'Contado vs crédito', subtitle: 'Comparación de ventas contado y crédito.', chartType: 'doughnut', chartTypes: ['doughnut', 'pie', 'bar'] },
    { id: 'invoiced_vs_collected', type: 'chart', title: 'Facturado vs cobrado', subtitle: 'Relación entre monto facturado y pagos recibidos.', chartType: 'doughnut', chartTypes: ['doughnut', 'pie', 'bar'] },
    { id: 'ar_aging', type: 'chart', title: 'CxC por antigüedad', subtitle: 'Balance pendiente agrupado por vencimiento.', chartType: 'bar', chartTypes: ['bar', 'ranking-bar', 'doughnut'] },
    { id: 'monthly_pending_balance', type: 'chart', title: 'Balance pendiente mensual', subtitle: 'Evolución del balance pendiente.', chartType: 'line', chartTypes: ['line', 'area-line', 'bar'] },
    { id: 'top_customers', type: 'chart', title: 'Top 10 clientes', subtitle: 'Clientes con mayor volumen de ventas.', chartType: 'ranking-bar', chartTypes: ['ranking-bar', 'bar', 'treemap', 'pie', 'doughnut'] },
    { id: 'top_products', type: 'chart', title: 'Top 10 productos', subtitle: 'Productos con mayor volumen de ventas.', chartType: 'ranking-bar', chartTypes: ['ranking-bar', 'bar', 'rose-pie', 'pie', 'doughnut', 'treemap'] },
    { id: 'sales_by_category', type: 'chart', title: 'Ventas por categoría', subtitle: 'Ventas agrupadas por categoría de producto.', chartType: 'doughnut', chartTypes: ['doughnut', 'pie', 'rose-pie', 'treemap', 'bar'] },
    { id: 'returns_by_product', type: 'chart', title: 'Productos con devolución', subtitle: 'Productos con mayor monto devuelto.', chartType: 'funnel', chartTypes: ['funnel', 'ranking-bar', 'bar', 'treemap'] },
    { id: 'credit_vs_debit_notes', type: 'chart', title: 'Notas crédito vs débito', subtitle: 'Notas emitidas por período.', chartType: 'stacked-bar', chartTypes: ['stacked-bar', 'bar', 'line', 'area-line'] },
    { id: 'inventory_in_vs_out', type: 'chart', title: 'Inventario entradas vs salidas', subtitle: 'Movimientos de inventario en el tiempo.', chartType: 'area-line', chartTypes: ['area-line', 'line', 'stacked-bar', 'bar'] },
    { id: 'purchases_by_supplier', type: 'chart', title: 'Compras por suplidor', subtitle: 'Suplidores con mayor volumen de compras.', chartType: 'treemap', chartTypes: ['treemap', 'ranking-bar', 'bar', 'pie', 'doughnut'] },
    { id: 'top_vehicles_by_trips', type: 'chart', title: 'Vehículos con más viajes', subtitle: 'Vehículos ordenados por cantidad de viajes.', chartType: 'ranking-bar', chartTypes: ['ranking-bar', 'bar', 'treemap', 'pie', 'doughnut'] },
  ];

  readonly kpiConfigs: DashboardBlockConfig[] = [
    { id: 'sales_kpis', type: 'kpi-section', title: 'Indicadores rápidos de ventas', subtitle: 'Facturación, impuestos, descuentos y volumen.' },
    { id: 'receivables_kpis', type: 'kpi-section', title: 'Cuentas por cobrar', subtitle: 'Balance pendiente, vencimientos y clientes con deuda.' },
  ];

  readonly heroConfig: DashboardBlockConfig = {
    id: 'executive_summary',
    type: 'hero',
    title: 'Vista general del negocio',
    subtitle: 'Resumen de facturación, cobranza, inventario y operación.',
  };

  heroState = signal<DashboardBlockState<DashboardHeroBlock>>(this.createState(this.heroConfig.id));
  kpiSectionStates = signal<DashboardBlockState<DashboardKpiSection>[]>([]);
  chartStates = signal<DashboardBlockState<DashboardChartBlock>[]>([]);
  visibleChartIds = signal<Set<string>>(new Set());
  travelModuleEnabled = signal(true);
  expandedChart = signal<{ state: DashboardBlockState<DashboardChartBlock>; originRect: DOMRect } | null>(null);
  appliedFilters = signal<Record<string, DashboardAppliedFilter>>({});
  draftFilters = signal<Record<string, DashboardDraftFilter>>({});
  dashboardRequest = signal<DashboardRequestContext | null>(null);
  mainChartStates = computed(() => this.chartStates().filter(state => ['sales_by_period', 'invoiced_vs_collected'].includes(state.id)));
  summaryChartStates = computed(() => this.chartStates().filter(state => ['cash_vs_credit_sales', 'ar_aging', 'monthly_pending_balance'].includes(state.id)));
  rankingChartStates = computed(() => this.chartStates().filter(state => ['top_customers', 'top_products'].includes(state.id)));
  visibleKpiSectionStates = computed(() => this.kpiSectionStates().filter(state => state.id !== 'receivables_kpis'));
  secondaryChartStates = computed(() =>
    this.chartStates().filter(state => !['sales_by_period', 'cash_vs_credit_sales', 'ar_aging', 'invoiced_vs_collected', 'monthly_pending_balance', 'top_customers', 'top_products'].includes(state.id) && (state.id !== 'top_vehicles_by_trips' || this.usesTravelModule()))
  );

  dashboardResource = httpResource<DashboardResponse>(() => {
    const request = this.dashboardRequest();
    if (!request) return undefined;

    const params: Record<string, string> = {
      preset: request.filter.preset,
      startDate: request.filter.startDate,
      endDate: request.filter.endDate,
      spinner: 'no_show',
    };

    if (request.blockIds?.length) params.blocks = request.blockIds.join(',');

    return {
      url: `${getUrlInUse()}/api/dashboard`,
      params,
    };
  }, {
    defaultValue: {
      startDate: '',
      endDate: '',
      requestedBlocks: 'all',
      hero: null,
      kpiSections: [],
      charts: [],
    },
    parse: value => this.normalizeDashboardResponse(value),
  });

  constructor(private readonly chartParser: DashboardChartParserService) {
    super();

    effect(() => {
      const request = this.dashboardRequest();
      const status = this.dashboardResource.status();

      if (!request) return;

      if (status === 'resolved' || status === 'local') {
        this.applyDashboardResponse(this.dashboardResource.value(), request.requestedBlocks, request.filter);
        return;
      }

      if (status === 'error') {
        this.setBlocksStatus(request.requestedBlocks, 'error', this.getErrorMessage(this.dashboardResource.error()));
      }
    });
  }

  initCambioMenu(arg) {

  }

  ngOnInit() {
    this._init_mixin({ component: 'home', is_routing: true });
    this.travelModuleEnabled.set(Ss.configServ?.config?.usa_modulo_viajes !== false);
    this.travelConfigSub = Ss.configServ.config$.subscribe(config => {
      const enabled = config?.usa_modulo_viajes !== false;
      if (enabled === this.travelModuleEnabled()) return;
      this.travelModuleEnabled.set(enabled);
      this.loadDashboard();
    });
    this.initDashboardState();
    this.listenThemeChanges();
    this.loadDashboard();
  }

  ngAfterViewInit() {
    this.refreshChartVisibilityObserver();
    this.chartViewportChangesSub = this.chartViewportRefs?.changes.subscribe(() => this.refreshChartVisibilityObserver());
  }

  private initDashboardState() {
    const defaultFilter = this.makeFilter('last_month');

    this.heroState.set(this.createState(this.heroConfig.id));
    this.kpiSectionStates.set(this.kpiConfigs.map(config => this.createState(config.id)));
    this.chartStates.set(this.chartConfigs.map(config => this.createState(config.id)));

    const filters: Record<string, DashboardAppliedFilter> = {};
    const draftFilters: Record<string, DashboardDraftFilter> = {};
    this.allBlockIds().forEach(blockId => {
      filters[blockId] = { ...defaultFilter };
      draftFilters[blockId] = this.toDraftFilter(defaultFilter);
    });
    this.appliedFilters.set(filters);
    this.draftFilters.set(draftFilters);
  }

  private createState<T>(id: string): DashboardBlockState<T> {
    return { id, status: 'loading', data: null };
  }

  loadDashboard(blockIds?: string[], filter?: DashboardAppliedFilter) {
    const requestedBlocks = blockIds?.length ? blockIds : this.allBlockIds();
    const activeFilter = filter || this.appliedFilters()[requestedBlocks[0]] || this.makeFilter('last_month');

    this.resetChartVisibility(requestedBlocks);
    this.setBlocksStatus(requestedBlocks, 'loading');
    queueMicrotask(() => this.refreshChartVisibilityObserver());
    this.dashboardRequest.set({
      blockIds,
      requestedBlocks,
      filter: activeFilter,
      nonce: Date.now(),
    });
  }

  applyFilter(blockId: string, scope: 'block' | 'all', popover?: { hide: () => void }) {
    const filter = this.draftFilters()[blockId];
    if (!filter || !this.isValidFilter(filter)) return;
    const appliedFilter = this.toAppliedFilter(filter);

    const blockIds = scope === 'all' ? this.allBlockIds() : [blockId];
    this.appliedFilters.update(filters => {
      const next = { ...filters };
      blockIds.forEach(id => (next[id] = { ...appliedFilter }));
      return next;
    });
    this.draftFilters.update(filters => {
      const next = { ...filters };
      blockIds.forEach(id => (next[id] = this.toDraftFilter(appliedFilter)));
      return next;
    });

    popover?.hide();
    this.loadDashboard(scope === 'all' ? undefined : [blockId], appliedFilter);
  }

  changePreset(blockId: string, preset: DashboardPeriodPreset | string) {
    this.draftFilters.update(filters => ({ ...filters, [blockId]: this.toDraftFilter(this.makeFilter(preset as DashboardPeriodPreset, filters[blockId])) }));
  }

  changeCustomDate(blockId: string, dateKey: 'startDate' | 'endDate', value: Date | string | null) {
    const current = this.draftFilters()[blockId] || this.toDraftFilter(this.makeFilter('last_month'));
    const dateValue = value instanceof Date ? value : this.parseDateInputValue(value || '');
    const dateString = this.toDateInputValue(dateValue || value);
    if (current.preset === 'custom_range' && current[dateKey] === dateString) return;

    const next: DashboardDraftFilter = { ...current, preset: 'custom_range' as DashboardPeriodPreset, [dateKey]: dateString };
    if (dateKey === 'startDate') next.startDateValue = dateValue;
    else next.endDateValue = dateValue;

    next.label = this.makeCustomRangeLabel(next.startDate, next.endDate);
    this.draftFilters.update(filters => ({ ...filters, [blockId]: next }));
  }

  resetDraftFilter(blockId: string) {
    this.draftFilters.update(filters => ({ ...filters, [blockId]: this.toDraftFilter(this.appliedFilters()[blockId]) }));
  }

  getHeroKpis(): DashboardCard[] {
    return this.filterConfiguredKpis(this.heroState().data?.primaryKpis || []).filter(card => !this.isReceivableCard(card));
  }

  getKpiCards(sectionState: DashboardBlockState<DashboardKpiSection>): DashboardCard[] {
    const sectionCards = sectionState.data?.cards || [];
    if (sectionState.id !== 'sales_kpis') return this.filterConfiguredKpis(sectionCards);

    return this.orderSalesKpiCards(this.dedupeKpiCards([
      ...sectionCards,
      ...(this.heroState().data?.primaryKpis || []),
      ...this.getHeroFocusItems(),
    ]));
  }

  getSalesKpiRows(sectionState: DashboardBlockState<DashboardKpiSection>): DashboardCard[][] {
    const cards = this.getKpiCards(sectionState);
    return [cards.slice(0, 4), cards.slice(4)];
  }

  getKpiSkeletonRows(sectionId: string): number[][] {
    if (sectionId !== 'sales_kpis') return [[1, 2, 3]];
    return this.usesItbis() ? [[1, 2, 3, 4], [5, 6, 7, 8]] : [[1, 2, 3, 4], [5, 6, 7]];
  }

  getKpiSkeletonItems(sectionId: string): number[] {
    return sectionId === 'sales_kpis' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3];
  }

  getHeroFocusItems(): DashboardCard[] {
    const focusItems = this.heroState().data?.focusItems || [];
    const receivableCard = this.kpiSectionStates()
      .find(state => state.id === 'receivables_kpis')
      ?.data?.cards?.find(card => this.isReceivableCard(card));

    if (!receivableCard || focusItems.some(card => card.id === receivableCard.id)) return focusItems;
    return [...focusItems, receivableCard];
  }

  getBlockFilterLabel(blockId: string): string {
    return this.appliedFilters()[blockId]?.label || 'Último mes';
  }

  getBlockTitle(blockId: string): string {
    return this.getBlockConfig(blockId)?.title || blockId;
  }

  getBlockSubtitle(blockId: string): string {
    return this.getBlockConfig(blockId)?.subtitle || 'Datos del período seleccionado.';
  }

  getChartSkeletonType(blockId: string): DashboardChartBlock['type'] {
    return this.getSelectedChartType(blockId);
  }

  isChartReadyForRender(blockId: string): boolean {
    return this.prefersReducedMotion || this.visibleChartIds().has(blockId);
  }

  getAvailableChartTypes(blockId: string): Array<{ value: DashboardChartType; label: string }> {
    const availableTypes = this.getBlockConfig(blockId)?.chartTypes || ['bar'];
    return this.chartTypeOptions.filter(option => availableTypes.includes(option.value));
  }

  changeChartType(blockId: string, chartType: DashboardChartType | string) {
    const selectedType = chartType as DashboardChartType;
    this.saveChartType(blockId, selectedType);
    this.chartStates.update(states =>
      states.map(state => {
        if (state.id !== blockId || !state.data) return state;
        const chart = { ...state.data, type: selectedType };
        const option = this.chartParser.parse(chart, selectedType);
        return { ...state, data: { ...chart, option, fullscreenOption: this.withoutChartInitialAnimation(option) } };
      })
    );
  }

  openExpandedChart(event: Event, chartState: DashboardBlockState<DashboardChartBlock>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, p-select, p-datepicker')) return;

    if (event instanceof KeyboardEvent) event.preventDefault();
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;

    this.expandedChart.set({ state: chartState, originRect: element.getBoundingClientRect() });
    this.markChartVisible(chartState.id);
  }

  closeExpandedChart() {
    this.expandedChart.set(null);
  }

  getExpandedChartState(expanded: { state: DashboardBlockState<DashboardChartBlock>; originRect: DOMRect }): DashboardBlockState<DashboardChartBlock> {
    return this.chartStates().find(state => state.id === expanded.state.id) || expanded.state;
  }

  getKpiTone(cardId: string, title = ''): string {
    const value = this.normalizeLookupText(`${cardId} ${title}`);
    if (value.includes('receivable') || value.includes('pending') || value.includes('debt') || value.includes('cxc') || value.includes('cuentasporcobrar')) return 'tone-blue';
    if (value.includes('itbis') || value.includes('tax')) return 'tone-violet';
    if (value.includes('discount') || value.includes('descuento')) return 'tone-amber';
    if (value.includes('return') || value.includes('error') || value.includes('overdue') || value.includes('venc')) return 'tone-red';
    if (value.includes('margin') || value.includes('ticket')) return 'tone-teal';
    if (value.includes('inventory') || value.includes('stock')) return 'tone-green';
    if (value.includes('cash') || value.includes('collected')) return 'tone-cyan';
    if (value.includes('sequence') || value.includes('available')) return 'tone-indigo';
    return 'tone-primary';
  }

  getKpiIcon(cardId: string, title = ''): string {
    const value = this.normalizeLookupText(`${cardId} ${title}`);
    if (value.includes('receivable') || value.includes('pending') || value.includes('debt') || value.includes('cxc') || value.includes('cuentasporcobrar')) return 'fa-hand-holding-dollar';
    if (value.includes('overdue') || value.includes('expired') || value.includes('venc')) return 'fa-clock-rotate-left';
    if (value.includes('itbis') || value.includes('tax')) return 'fa-receipt';
    if (value.includes('discount') || value.includes('descuento')) return 'fa-percent';
    if (value.includes('return')) return 'fa-arrow-rotate-left';
    if (value.includes('inventory') || value.includes('stock')) return 'fa-boxes-stacked';
    if (value.includes('cash') || value.includes('collected')) return 'fa-sack-dollar';
    if (value.includes('invoice') || value.includes('factur')) return 'fa-file-invoice-dollar';
    return 'fa-chart-line';
  }

  private isReceivableCard(card: DashboardCard): boolean {
    const value = this.normalizeLookupText(`${card.id} ${card.title}`);
    return value.includes('receivable') || value.includes('cxc') || value.includes('cuentasporcobrar');
  }

  private filterConfiguredKpis(cards: DashboardCard[]): DashboardCard[] {
    if (this.usesItbis()) return cards;
    return cards.filter(card => !this.isItbisCard(card));
  }

  private dedupeKpiCards(cards: DashboardCard[]): DashboardCard[] {
    const seen = new Set<string>();

    return this.filterConfiguredKpis(cards).filter(card => {
      const key = this.getKpiDedupeKey(card);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private orderSalesKpiCards(cards: DashboardCard[]): DashboardCard[] {
    const cardsByKey = new Map(cards.map(card => [this.getKpiDedupeKey(card), card]));
    const orderedKeys = this.usesItbis()
      ? ['total_facturado', 'total_itbis', 'total_descuentos', 'total_bruto', 'total_devoluciones', 'cuentas_por_cobrar', 'facturas_emitidas', 'facturas_vencidas']
      : ['total_facturado', 'total_devoluciones', 'total_descuentos', 'total_bruto', 'cuentas_por_cobrar', 'facturas_emitidas', 'facturas_vencidas'];

    return orderedKeys
      .map(key => cardsByKey.get(key))
      .filter((card): card is DashboardCard => Boolean(card));
  }

  private getKpiDedupeKey(card: DashboardCard): string {
    const value = this.normalizeLookupText(`${card.id} ${card.title}`);
    if (value.includes('totalfacturado') || value.includes('invoiced') || value.includes('billingtotal')) return 'total_facturado';
    if (this.isReceivableCard(card)) return 'cuentas_por_cobrar';
    if (value.includes('overdue') || value.includes('expired') || value.includes('venc')) return 'facturas_vencidas';
    if (value.includes('bruto') || value.includes('gross')) return 'total_bruto';
    if (value.includes('itbis') || value.includes('tax')) return 'total_itbis';
    if (value.includes('discount') || value.includes('descuento')) return 'total_descuentos';
    if (value.includes('return') || value.includes('devolucion')) return 'total_devoluciones';
    if (value.includes('emitida') || value.includes('issued')) return 'facturas_emitidas';
    return value;
  }

  private isItbisCard(card: DashboardCard): boolean {
    return this.normalizeLookupText(`${card.id} ${card.title}`).includes('itbis');
  }

  usesItbis(): boolean {
    const config = Ss.configServ.config as any;
    return Boolean(config?.usa_itbis ?? config?.calcular_itbis);
  }

  usesTravelModule(): boolean {
    return this.travelModuleEnabled();
  }

  private normalizeLookupText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  formatKpiValue(card: DashboardCard): string {
    const value = Number(card.value || 0);

    if (card.format === 'currency') {
      return new Intl.NumberFormat('es-DO', { style: 'currency', currency: card.currency || 'DOP' }).format(value);
    }

    if (card.format === 'percent') {
      return `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)}%`;
    }

    return new Intl.NumberFormat('es-DO').format(value);
  }

  shouldShowKpiSubtitle(card: DashboardCard): boolean {
    return Boolean(card.subtitle && card.subtitle.trim().toLowerCase() !== 'rango seleccionado');
  }

  isTextOverflowing(element: HTMLElement | null): boolean {
    return Boolean(element && element.scrollWidth > element.clientWidth);
  }

  isCustomRange(blockId: string): boolean {
    return this.draftFilters()[blockId]?.preset === 'custom_range';
  }

  private applyDashboardResponse(response: DashboardResponse, requestedBlocks: string[], fallbackFilter: DashboardAppliedFilter) {
    response = this.normalizeDashboardResponse(response);

    if (response.hero) this.updateHero(response.hero, fallbackFilter);
    response.kpiSections?.forEach(section => this.updateKpiSection(section, fallbackFilter));
    response.charts?.forEach(chart => this.updateChart(chart, fallbackFilter));

    requestedBlocks.forEach(blockId => {
      if (!this.wasBlockReceived(blockId, response)) this.setBlockStatus(blockId, 'no-data');
    });
  }

  private updateHero(hero: DashboardHeroBlock, fallbackFilter: DashboardAppliedFilter) {
    const status = this.isHeroEmpty(hero) ? 'no-data' : 'success';
    this.heroState.set({ id: hero.id, status, data: hero });
    this.syncFilter(hero.id, fallbackFilter);
  }

  private updateKpiSection(section: DashboardKpiSection, fallbackFilter: DashboardAppliedFilter) {
    const status = this.isKpiSectionEmpty(section) ? 'no-data' : 'success';
    this.kpiSectionStates.update(states => states.map(state => (state.id === section.id ? { id: section.id, status, data: section } : state)));
    this.syncFilter(section.id, fallbackFilter);
  }

  private updateChart(chart: DashboardChartBlock, fallbackFilter: DashboardAppliedFilter) {
    const chartType = this.getSelectedChartType(chart.id);
    const parsedChart = {
      ...chart,
      type: chartType,
      data: this.normalizeChartData(chart.data),
    };
    const status = chart.status === 'error' ? 'error' : chart.status === 'no-data' || this.isChartEmpty(parsedChart) ? 'no-data' : 'success';
    const option = this.chartParser.parse(parsedChart, chartType);
    const data = { ...parsedChart, option, fullscreenOption: this.withoutChartInitialAnimation(option) };

    this.chartStates.update(states => states.map(state => (state.id === chart.id ? { id: chart.id, status, data, error: chart.errorMessage } : state)));
    this.syncFilter(chart.id, fallbackFilter);
  }

  private listenThemeChanges() {
    let lastThemeKey = `${Ss.configServ.config?.color_app || ''}:${Ss.configServ.config?.mode_app || ''}`;

    this.themeConfigSub = Ss.configServ.config$.subscribe(config => {
      const themeKey = `${config?.color_app || ''}:${config?.mode_app || ''}`;
      if (!themeKey || themeKey === lastThemeKey) return;

      lastThemeKey = themeKey;
      queueMicrotask(() => this.reparseChartOptions());
    });
  }

  private reparseChartOptions() {
    this.chartStates.update(states =>
      states.map(state => {
        if (!state.data) return state;

        const chartType = this.getSelectedChartType(state.id);
        const chart = { ...state.data, type: chartType };
        const option = this.chartParser.parse(chart, chartType);
        return { ...state, data: { ...chart, option, fullscreenOption: this.withoutChartInitialAnimation(option) } };
      })
    );
  }

  private syncFilter(blockId: string, filter: DashboardAppliedFilter) {
    this.appliedFilters.update(filters => ({ ...filters, [blockId]: { ...filter } }));
    this.draftFilters.update(filters => ({ ...filters, [blockId]: this.toDraftFilter(filter) }));
  }

  private withoutChartInitialAnimation(option: any): any {
    const fullscreenOption = this.enlargeFullscreenChartOption(option);

    return {
      ...fullscreenOption,
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      series: Array.isArray(fullscreenOption?.series)
        ? fullscreenOption.series.map(series => ({
            ...series,
            animation: false,
            animationDuration: 0,
            animationDurationUpdate: 0,
          }))
        : fullscreenOption?.series,
    };
  }

  private enlargeFullscreenChartOption(option: any): any {
    const series = Array.isArray(option?.series)
      ? option.series.map(series => this.enlargeFullscreenSeries(series))
      : option?.series;
    const hasAxis = Boolean(option?.xAxis || option?.yAxis);

    return {
      ...option,
      legend: option?.legend ? { ...option.legend, textStyle: { ...(option.legend.textStyle || {}), fontSize: 13 } } : option?.legend,
      grid: hasAxis
        ? {
            ...(option?.grid || {}),
            left: 26,
            right: 30,
            top: 52,
            bottom: 30,
            containLabel: true,
          }
        : option?.grid,
      xAxis: option?.xAxis ? this.enlargeFullscreenAxis(option.xAxis) : option?.xAxis,
      radar: option?.radar ? { ...option.radar, radius: '72%' } : option?.radar,
      series,
    };
  }

  private enlargeFullscreenAxis(axis: any): any {
    const normalizeAxis = item => ({
      ...item,
      axisLabel: item?.axisLabel?.formatter
        ? { ...item.axisLabel, formatter: value => String(value || '').slice(0, 20) }
        : item?.axisLabel,
    });

    return Array.isArray(axis) ? axis.map(normalizeAxis) : normalizeAxis(axis);
  }

  private enlargeFullscreenSeries(series: any): any {
    if (series?.type === 'pie') {
      const isDoughnut = Array.isArray(series.radius);
      return {
        ...series,
        center: ['50%', '50%'],
        radius: isDoughnut ? ['41%', '74%'] : '76%',
        label: { ...(series.label || {}), fontSize: 13 },
        labelLine: { ...(series.labelLine || {}), length: 20, length2: 16 },
      };
    }

    if (series?.type === 'gauge') {
      return {
        ...series,
        radius: '79%',
        center: ['50%', '54%'],
        axisLine: {
          ...(series.axisLine || {}),
          lineStyle: { ...(series.axisLine?.lineStyle || {}), width: 18 },
        },
        detail: { ...(series.detail || {}), fontSize: 34 },
      };
    }

    if (series?.type === 'funnel') {
      return {
        ...series,
        left: '6%',
        top: 18,
        bottom: 40,
        width: '88%',
        label: { ...(series.label || {}), fontSize: 13 },
      };
    }

    if (series?.type === 'treemap') {
      return {
        ...series,
        label: { ...(series.label || {}), fontSize: 13 },
      };
    }

    if (series?.type === 'bar') {
      return {
        ...series,
        barMaxWidth: series.barMaxWidth ? Math.max(series.barMaxWidth, 34) : 34,
      };
    }

    return series;
  }

  private wasBlockReceived(blockId: string, response: DashboardResponse): boolean {
    return response.hero?.id === blockId || response.kpiSections?.some(section => section.id === blockId) || response.charts?.some(chart => chart.id === blockId);
  }

  private setBlocksStatus(blockIds: string[], status: DashboardBlockStatus, error?: string) {
    blockIds.forEach(blockId => this.setBlockStatus(blockId, status, error));
  }

  private setBlockStatus(blockId: string, status: DashboardBlockStatus, error?: string) {
    if (blockId === this.heroState().id) {
      this.heroState.update(state => ({ ...state, status, error }));
      return;
    }

    this.kpiSectionStates.update(states => states.map(state => (state.id === blockId ? { ...state, status, error } : state)));
    this.chartStates.update(states => states.map(state => (state.id === blockId ? { ...state, status, error } : state)));
  }

  private makeFilter(preset: DashboardPeriodPreset, current?: DashboardAppliedFilter): DashboardAppliedFilter {
    const end = new Date();
    const start = new Date(end);

    if (preset === 'custom_range' && current) {
      return {
        preset,
        label: this.makeCustomRangeLabel(current.startDate, current.endDate),
        startDate: current.startDate,
        endDate: current.endDate,
      };
    }

    const monthMap: Partial<Record<DashboardPeriodPreset, number>> = {
      last_month: 1,
      last_3_months: 3,
      last_6_months: 6,
      last_9_months: 9,
      last_year: 12,
    };

    if (preset === 'last_week') start.setDate(start.getDate() - 7);
    else start.setMonth(start.getMonth() - (monthMap[preset] || 1));

    const startDate = this.formatDate(start);
    const endDate = this.formatDate(end);

    return {
      preset,
      label: this.periodOptions.find(option => option.preset === preset)?.label || 'Último mes',
      startDate,
      endDate,
    };
  }

  private makeCustomRangeLabel(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'Rango personalizado';
    return `${this.formatDateLabel(startDate)} - ${this.formatDateLabel(endDate)}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateInputValue(value?: string): Date | null {
    if (!value) return null;

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  }

  private toDateInputValue(value: Date | string | null): string {
    if (!value) return '';
    if (value instanceof Date) return this.formatDate(value);
    return value;
  }

  private toDraftFilter(filter: DashboardAppliedFilter): DashboardDraftFilter {
    filter = this.normalizeAppliedFilter(filter);

    return {
      ...filter,
      startDateValue: this.parseDateInputValue(filter?.startDate),
      endDateValue: this.parseDateInputValue(filter?.endDate),
    };
  }

  private toAppliedFilter(filter: DashboardDraftFilter): DashboardAppliedFilter {
    return {
      preset: filter.preset,
      label: filter.label,
      startDate: filter.startDate,
      endDate: filter.endDate,
    };
  }

  private normalizeAppliedFilter(filter?: DashboardAppliedFilter): DashboardAppliedFilter {
    const validPreset = this.periodOptions.some(option => option.preset === filter?.preset);
    const normalizedPreset = validPreset ? filter!.preset : 'last_month';

    if (!filter) return this.makeFilter('last_month');
    if (normalizedPreset === 'custom_range') return { ...filter, preset: normalizedPreset, label: this.makeCustomRangeLabel(filter.startDate, filter.endDate) };

    return {
      ...filter,
      preset: normalizedPreset,
      label: this.periodOptions.find(option => option.preset === normalizedPreset)?.label || 'Último mes',
    };
  }

  private formatDateLabel(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private isValidFilter(filter: DashboardAppliedFilter): boolean {
    return Boolean(filter.startDate && filter.endDate && filter.startDate <= filter.endDate);
  }

  private isChartEmpty(chart: DashboardChartBlock): boolean {
    return !chart.data?.rows?.length || !chart.data?.columns?.some(column => column.role === 'metric');
  }

  private normalizeDashboardResponse(response: any): DashboardResponse {
    const dashboard = response?.data || response || {};

    return {
      startDate: dashboard.startDate,
      endDate: dashboard.endDate,
      requestedBlocks: dashboard.requestedBlocks || 'all',
      hero: dashboard.hero || null,
      kpiSections: dashboard.kpiSections || [],
      charts: dashboard.charts || [],
    };
  }

  private normalizeChartData(data: DashboardChartData): DashboardChartData {
    return {
      columns: data?.columns || [],
      rows: data?.rows || [],
      summary: data?.summary || {},
    };
  }

  private isKpiSectionEmpty(section: DashboardKpiSection): boolean {
    return !section.cards?.length || section.cards.every(card => !Number(card.value || 0));
  }

  private isHeroEmpty(hero: DashboardHeroBlock): boolean {
    const items = [...(hero.primaryKpis || []), ...(hero.focusItems || [])];
    return items.length === 0 || items.every(item => !Number(item.value || 0));
  }

  private refreshChartVisibilityObserver() {
    if (this.prefersReducedMotion) {
      this.markAllChartsVisible();
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      this.markAllChartsVisible();
      return;
    }

    this.chartObserver?.disconnect();
    this.chartObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const blockId = (entry.target as HTMLElement).dataset['chartId'];
        if (!blockId) return;

        this.markChartVisible(blockId);
        this.chartObserver?.unobserve(entry.target);
      });
    }, { rootMargin: '80px 0px 80px 0px', threshold: 0.18 });

    this.chartViewportRefs?.forEach(ref => {
      const blockId = ref.nativeElement.dataset['chartId'];
      if (blockId && !this.visibleChartIds().has(blockId)) this.chartObserver?.observe(ref.nativeElement);
    });
  }

  private markChartVisible(blockId: string) {
    if (this.visibleChartIds().has(blockId)) return;
    this.visibleChartIds.update(ids => new Set(ids).add(blockId));
  }

  private markAllChartsVisible() {
    this.visibleChartIds.set(new Set(this.chartConfigs.map(config => config.id)));
  }

  private resetChartVisibility(blockIds: string[]) {
    const chartIds = new Set(this.chartConfigs.map(config => config.id));
    const idsToReset = blockIds.filter(blockId => chartIds.has(blockId));
    if (!idsToReset.length || this.prefersReducedMotion) return;

    this.visibleChartIds.update(currentIds => {
      const nextIds = new Set(currentIds);
      idsToReset.forEach(blockId => nextIds.delete(blockId));
      return nextIds;
    });
  }

  private allBlockIds(): string[] {
    const chartIds = this.chartConfigs.filter(config => config.id !== 'top_vehicles_by_trips' || this.usesTravelModule()).map(config => config.id);
    return [this.heroConfig.id, ...this.kpiConfigs.map(config => config.id), ...chartIds];
  }

  private getBlockConfig(blockId: string): DashboardBlockConfig | null {
    return [this.heroConfig, ...this.kpiConfigs, ...this.chartConfigs].find(config => config.id === blockId) || null;
  }

  private getSelectedChartType(blockId: string): DashboardChartType {
    const config = this.getBlockConfig(blockId);
    const savedType = this.getStoredChartTypes()[blockId];

    if (savedType && config?.chartTypes?.includes(savedType)) return savedType;
    return config?.chartType || 'bar';
  }

  private saveChartType(blockId: string, chartType: DashboardChartType) {
    const chartTypes = { ...this.getStoredChartTypes(), [blockId]: chartType };
    localStorage.setItem(this.chartStorageKey, JSON.stringify(chartTypes));
  }

  private getStoredChartTypes(): Record<string, DashboardChartType> {
    try {
      return JSON.parse(localStorage.getItem(this.chartStorageKey) || '{}') || {};
    } catch {
      return {};
    }
  }

  private getErrorMessage(error): string {
    return error?.error?.message || error?.message || 'No se pudo cargar este bloque.';
  }

  ngOnDestroy() {
    this.chartObserver?.disconnect();
    this.chartViewportChangesSub?.unsubscribe();
    this.themeConfigSub?.unsubscribe();
    this.travelConfigSub?.unsubscribe();
    this.dashboardResource.destroy();
    this._destroy_mixin();
  }
}
