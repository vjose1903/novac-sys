import { Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MixinClass } from '@core/typescript/MixinClass';
import { getUrlInUse } from '@core/typescript/url-server.utils';

type DashboardBlockStatus = 'loading' | 'success' | 'no-data' | 'error';
type DashboardBlockType = 'hero' | 'kpi-section' | 'chart';
type DashboardChartType = 'line' | 'area-line' | 'bar' | 'stacked-bar' | 'ranking-bar' | 'pie' | 'doughnut' | 'gauge' | 'funnel' | 'heatmap' | 'treemap' | 'radar';
type DashboardPeriodPreset = 'last_week' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_9_months' | 'last_year' | 'custom_range';

interface DashboardAppliedFilter {
  preset: DashboardPeriodPreset;
  label: string;
  startDate: string;
  endDate: string;
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
  type: DashboardChartType;
  appliedFilter: DashboardAppliedFilter;
  option: any & {
    xAxis?: { data?: string[] };
    yAxis?: { data?: string[] };
    series?: Array<{ name: string; type: string; data: number[] }>;
  };
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
export class HomeAdminComponent extends MixinClass implements OnInit, OnDestroy {
  readonly periodOptions: PeriodOption[] = [
    { preset: 'last_week', label: 'Última semana' },
    { preset: 'last_month', label: 'Último mes' },
    { preset: 'last_3_months', label: 'Últimos 3 meses' },
    { preset: 'last_6_months', label: 'Últimos 6 meses' },
    { preset: 'last_9_months', label: 'Últimos 9 meses' },
    { preset: 'last_year', label: 'Último año' },
    { preset: 'custom_range', label: 'Rango personalizado' },
  ];

  readonly chartConfigs: DashboardBlockConfig[] = [
    { id: 'sales_by_period', type: 'chart', title: 'Ventas por período', subtitle: 'Evolución de ventas en el rango seleccionado.', chartType: 'line' },
    { id: 'cash_vs_credit_sales', type: 'chart', title: 'Contado vs crédito', subtitle: 'Comparación de ventas contado y crédito.', chartType: 'stacked-bar' },
    { id: 'invoiced_vs_collected', type: 'chart', title: 'Facturado vs cobrado', subtitle: 'Relación entre monto facturado y pagos recibidos.', chartType: 'stacked-bar' },
    { id: 'ar_aging', type: 'chart', title: 'CxC por antigüedad', subtitle: 'Balance pendiente agrupado por vencimiento.', chartType: 'bar' },
    { id: 'monthly_pending_balance', type: 'chart', title: 'Balance pendiente mensual', subtitle: 'Evolución del balance pendiente.', chartType: 'line' },
    { id: 'top_customers', type: 'chart', title: 'Top 10 clientes', subtitle: 'Clientes con mayor volumen de ventas.', chartType: 'ranking-bar' },
    { id: 'top_products', type: 'chart', title: 'Top 10 productos', subtitle: 'Productos con mayor volumen de ventas.', chartType: 'ranking-bar' },
    { id: 'sales_by_seller', type: 'chart', title: 'Ventas por vendedor', subtitle: 'Distribución de ventas por vendedor.', chartType: 'ranking-bar' },
    { id: 'sales_by_category', type: 'chart', title: 'Ventas por categoría', subtitle: 'Ventas agrupadas por categoría de producto.', chartType: 'bar' },
    { id: 'returns_by_product', type: 'chart', title: 'Productos con devolución', subtitle: 'Productos con mayor monto devuelto.', chartType: 'ranking-bar' },
    { id: 'credit_vs_debit_notes', type: 'chart', title: 'Notas crédito vs débito', subtitle: 'Notas emitidas por período.', chartType: 'stacked-bar' },
    { id: 'inventory_in_vs_out', type: 'chart', title: 'Inventario entradas vs salidas', subtitle: 'Movimientos de inventario en el tiempo.', chartType: 'stacked-bar' },
    { id: 'ecf_status', type: 'chart', title: 'Estado e-CF', subtitle: 'Enviados, aceptados y rechazados.', chartType: 'stacked-bar' },
    { id: 'purchases_by_supplier', type: 'chart', title: 'Compras por suplidor', subtitle: 'Suplidores con mayor volumen de compras.', chartType: 'ranking-bar' },
    { id: 'product_cost_evolution', type: 'chart', title: 'Costo por producto', subtitle: 'Evolución de costos por producto.', chartType: 'line' },
    { id: 'top_vehicles_by_trips', type: 'chart', title: 'Vehículos con más viajes', subtitle: 'Vehículos ordenados por cantidad de viajes.', chartType: 'ranking-bar' },
  ];

  readonly kpiConfigs: DashboardBlockConfig[] = [
    { id: 'sales_kpis', type: 'kpi-section', title: 'Indicadores rápidos de ventas', subtitle: 'Facturación, impuestos, descuentos y volumen.' },
    { id: 'receivables_kpis', type: 'kpi-section', title: 'Cuentas por cobrar', subtitle: 'Balance pendiente, vencimientos y clientes con deuda.' },
    { id: 'cash_kpis', type: 'kpi-section', title: 'Caja y cobros', subtitle: 'Cobros, recibos y flujo del período.' },
    { id: 'inventory_kpis', type: 'kpi-section', title: 'Inventario', subtitle: 'Valor de inventario y alertas de existencia.' },
    { id: 'ecf_kpis', type: 'kpi-section', title: 'Facturación electrónica', subtitle: 'Estado operativo de e-CF y errores DGII.' },
    { id: 'sequence_kpis', type: 'kpi-section', title: 'Secuencias fiscales', subtitle: 'Comprobantes disponibles y usados.' },
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
  appliedFilters = signal<Record<string, DashboardAppliedFilter>>({});
  draftFilters = signal<Record<string, DashboardAppliedFilter>>({});
  dashboardRequest = signal<DashboardRequestContext | null>(null);

  dashboardResource = httpResource<DashboardResponse>(() => {
    const request = this.dashboardRequest();
    if (!request) return undefined;

    const params: Record<string, string> = {
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

  constructor() {
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
    this.initDashboardState();
    this.loadDashboard();
  }

  private initDashboardState() {
    const defaultFilter = this.makeFilter('last_month');

    this.heroState.set(this.createState(this.heroConfig.id));
    this.kpiSectionStates.set(this.kpiConfigs.map(config => this.createState(config.id)));
    this.chartStates.set(this.chartConfigs.map(config => this.createState(config.id)));

    const filters: Record<string, DashboardAppliedFilter> = {};
    this.allBlockIds().forEach(blockId => {
      filters[blockId] = { ...defaultFilter };
    });
    this.appliedFilters.set(filters);
    this.draftFilters.set({ ...filters });
  }

  private createState<T>(id: string): DashboardBlockState<T> {
    return { id, status: 'loading', data: null };
  }

  loadDashboard(blockIds?: string[], filter?: DashboardAppliedFilter) {
    const requestedBlocks = blockIds?.length ? blockIds : this.allBlockIds();
    const activeFilter = filter || this.appliedFilters()[requestedBlocks[0]] || this.makeFilter('last_month');

    this.setBlocksStatus(requestedBlocks, 'loading');
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

    const blockIds = scope === 'all' ? this.allBlockIds() : [blockId];
    this.appliedFilters.update(filters => {
      const next = { ...filters };
      blockIds.forEach(id => (next[id] = { ...filter }));
      return next;
    });
    this.draftFilters.update(filters => {
      const next = { ...filters };
      blockIds.forEach(id => (next[id] = { ...filter }));
      return next;
    });

    popover?.hide();
    this.loadDashboard(scope === 'all' ? undefined : [blockId], filter);
  }

  changePreset(blockId: string, preset: DashboardPeriodPreset | string) {
    this.draftFilters.update(filters => ({ ...filters, [blockId]: this.makeFilter(preset as DashboardPeriodPreset, filters[blockId]) }));
  }

  changeCustomDate(blockId: string, dateKey: 'startDate' | 'endDate', value: string) {
    const current = this.draftFilters()[blockId] || this.makeFilter('last_month');
    const next = { ...current, preset: 'custom_range' as DashboardPeriodPreset, [dateKey]: value };
    next.label = this.makeCustomRangeLabel(next.startDate, next.endDate);
    this.draftFilters.update(filters => ({ ...filters, [blockId]: next }));
  }

  resetDraftFilter(blockId: string) {
    this.draftFilters.update(filters => ({ ...filters, [blockId]: { ...this.appliedFilters()[blockId] } }));
  }

  getHeroKpis(): DashboardCard[] {
    return this.heroState().data?.primaryKpis || [];
  }

  getHeroFocusItems(): DashboardCard[] {
    return this.heroState().data?.focusItems || [];
  }

  getChartCategories(chart: DashboardChartBlock | null): string[] {
    return chart?.option?.yAxis?.data || chart?.option?.xAxis?.data || [];
  }

  getChartSeries(chart: DashboardChartBlock | null) {
    return chart?.option?.series || [];
  }

  getChartValue(chart: DashboardChartBlock | null, index: number): number {
    return this.getChartSeries(chart).reduce((total, serie) => total + Number(serie.data?.[index] || 0), 0);
  }

  getChartMax(chart: DashboardChartBlock | null): number {
    const values = this.getChartCategories(chart).map((_, index) => this.getChartValue(chart, index));
    return Math.max(...values, 1);
  }

  getLinePoints(chart: DashboardChartBlock | null, serieIndex = 0): string {
    const data = this.getChartSeries(chart)[serieIndex]?.data || [];
    const max = Math.max(...data, 1);
    const width = 300;
    const height = 120;

    return data
      .map((value, index) => {
        const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
        const y = height - (Number(value || 0) / max) * height;
        return `${x},${y}`;
      })
      .join(' ');
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
    return this.getBlockConfig(blockId)?.chartType || 'bar';
  }

  getKpiTone(cardId: string): string {
    if (cardId.includes('receivable') || cardId.includes('pending') || cardId.includes('debt')) return 'tone-blue';
    if (cardId.includes('itbis') || cardId.includes('tax')) return 'tone-violet';
    if (cardId.includes('discount')) return 'tone-amber';
    if (cardId.includes('return') || cardId.includes('error') || cardId.includes('overdue')) return 'tone-red';
    if (cardId.includes('margin') || cardId.includes('ticket')) return 'tone-teal';
    if (cardId.includes('inventory') || cardId.includes('stock')) return 'tone-green';
    if (cardId.includes('cash') || cardId.includes('collected')) return 'tone-cyan';
    if (cardId.includes('sequence') || cardId.includes('available')) return 'tone-indigo';
    return 'tone-primary';
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
    this.syncFilter(hero.id, hero.appliedFilter || fallbackFilter);
  }

  private updateKpiSection(section: DashboardKpiSection, fallbackFilter: DashboardAppliedFilter) {
    const status = this.isKpiSectionEmpty(section) ? 'no-data' : 'success';
    this.kpiSectionStates.update(states => states.map(state => (state.id === section.id ? { id: section.id, status, data: section } : state)));
    this.syncFilter(section.id, section.appliedFilter || fallbackFilter);
  }

  private updateChart(chart: DashboardChartBlock, fallbackFilter: DashboardAppliedFilter) {
    chart = { ...chart, option: this.normalizeChartOption(chart) };
    const status = this.isChartEmpty(chart) ? 'no-data' : 'success';
    this.chartStates.update(states => states.map(state => (state.id === chart.id ? { id: chart.id, status, data: chart } : state)));
    this.syncFilter(chart.id, chart.appliedFilter || fallbackFilter);
  }

  private syncFilter(blockId: string, filter: DashboardAppliedFilter) {
    this.appliedFilters.update(filters => ({ ...filters, [blockId]: { ...filter } }));
    this.draftFilters.update(filters => ({ ...filters, [blockId]: { ...filter } }));
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

  private formatDateLabel(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private isValidFilter(filter: DashboardAppliedFilter): boolean {
    return Boolean(filter.startDate && filter.endDate && filter.startDate <= filter.endDate);
  }

  private isChartEmpty(chart: DashboardChartBlock): boolean {
    const datasetSource = Array.isArray(chart.option?.dataset) ? chart.option.dataset[0]?.source : chart.option?.dataset?.source;
    if (Array.isArray(datasetSource) && datasetSource.length > 0) return false;

    const series = chart.option?.series || [];
    return series.length === 0 || series.every(serie => !Array.isArray(serie.data) || serie.data.length === 0);
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

  private normalizeChartOption(chart: DashboardChartBlock): any {
    const option = chart.option || {};
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--app-text').trim() || '#1d253b';
    const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--app-text-muted').trim() || '#657081';
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--app-border').trim() || '#ced4da';
    const isAxisChart = ['line', 'area-line', 'bar', 'stacked-bar', 'ranking-bar', 'heatmap'].includes(chart.type);
    const tooltipTrigger = ['pie', 'doughnut', 'gauge', 'funnel', 'treemap', 'radar'].includes(chart.type) ? 'item' : 'axis';

    return {
      animation: true,
      animationDuration: option.animationDuration ?? 900,
      animationEasing: option.animationEasing ?? 'cubicOut',
      tooltip: option.tooltip ?? { trigger: tooltipTrigger, axisPointer: { type: chart.type === 'line' || chart.type === 'area-line' ? 'line' : 'shadow' } },
      legend: option.legend ?? { textStyle: { color: mutedColor }, top: 0 },
      grid: isAxisChart ? option.grid ?? { left: 16, right: 16, top: 42, bottom: 12, containLabel: true } : option.grid,
      color: option.color ?? ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'],
      ...option,
      xAxis: isAxisChart ? this.normalizeAxis(option.xAxis, textColor, mutedColor, borderColor) : option.xAxis,
      yAxis: isAxisChart ? this.normalizeAxis(option.yAxis, textColor, mutedColor, borderColor) : option.yAxis,
      series: (option.series || []).map(serie => ({
        animation: true,
        emphasis: { focus: 'series', ...(serie.emphasis || {}) },
        smooth: chart.type === 'line' || chart.type === 'area-line' ? true : serie.smooth,
        areaStyle: chart.type === 'area-line' ? serie.areaStyle || {} : serie.areaStyle,
        radius: chart.type === 'doughnut' ? serie.radius || ['48%', '72%'] : serie.radius,
        ...serie,
      })),
    };
  }

  private normalizeAxis(axis: any, textColor: string, mutedColor: string, borderColor: string): any {
    if (!axis) return axis;
    const normalizeOne = item => ({
      axisLabel: { color: mutedColor, ...(item.axisLabel || {}) },
      axisLine: { lineStyle: { color: borderColor }, ...(item.axisLine || {}) },
      axisTick: { lineStyle: { color: borderColor }, ...(item.axisTick || {}) },
      splitLine: { lineStyle: { color: borderColor, opacity: 0.35 }, ...(item.splitLine || {}) },
      nameTextStyle: { color: textColor, ...(item.nameTextStyle || {}) },
      ...item,
    });

    return Array.isArray(axis) ? axis.map(normalizeOne) : normalizeOne(axis);
  }

  private isKpiSectionEmpty(section: DashboardKpiSection): boolean {
    return !section.cards?.length || section.cards.every(card => !Number(card.value || 0));
  }

  private isHeroEmpty(hero: DashboardHeroBlock): boolean {
    const items = [...(hero.primaryKpis || []), ...(hero.focusItems || [])];
    return items.length === 0 || items.every(item => !Number(item.value || 0));
  }

  private allBlockIds(): string[] {
    return [this.heroConfig.id, ...this.kpiConfigs.map(config => config.id), ...this.chartConfigs.map(config => config.id)];
  }

  private getBlockConfig(blockId: string): DashboardBlockConfig | null {
    return [this.heroConfig, ...this.kpiConfigs, ...this.chartConfigs].find(config => config.id === blockId) || null;
  }

  private getErrorMessage(error): string {
    return error?.error?.message || error?.message || 'No se pudo cargar este bloque.';
  }

  ngOnDestroy() {
    this.dashboardResource.destroy();
    this._destroy_mixin();
  }
}
