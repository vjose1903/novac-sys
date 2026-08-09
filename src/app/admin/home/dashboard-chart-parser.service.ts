import { Injectable } from '@angular/core';

export type DashboardChartType =
  | 'line'
  | 'area-line'
  | 'bar'
  | 'stacked-bar'
  | 'ranking-bar'
  | 'pie'
  | 'doughnut'
  | 'rose-pie'
  | 'gauge'
  | 'radial-progress'
  | 'funnel'
  | 'heatmap'
  | 'treemap'
  | 'radar';

export interface DashboardChartColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format: 'currency' | 'number' | 'percent' | 'date' | 'text';
  currency?: string;
  role: 'dimension' | 'metric' | 'series' | 'category' | 'status';
}

export interface DashboardChartData {
  columns: DashboardChartColumn[];
  rows: Array<Record<string, any>>;
  summary?: Record<string, any>;
}

export interface DashboardGenericChartBlock {
  id: string;
  title: string;
  subtitle: string;
  data: DashboardChartData;
}

interface ChartParseContext {
  block: DashboardGenericChartBlock;
  chartType: DashboardChartType;
  dimensionColumn?: DashboardChartColumn;
  categoryColumn?: DashboardChartColumn;
  seriesColumn?: DashboardChartColumn;
  metricColumns: DashboardChartColumn[];
  rows: Array<Record<string, any>>;
}

@Injectable({ providedIn: 'root' })
export class DashboardChartParserService {
  private readonly colors = ['#16a34a', '#2563eb', '#0891b2', '#d97706', '#dc2626', '#7c3aed', '#4f46e5', '#0d9488', '#e11d48', '#65a30d'];

  parse(block: DashboardGenericChartBlock, chartType: DashboardChartType): any {
    const context = this.makeContext(block, chartType);

    if (!context.rows.length || !context.metricColumns.length) return this.emptyOption(block);

    if (chartType === 'ranking-bar') return this.rankingBar(context);
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'rose-pie') return this.pie(context);
    if (chartType === 'gauge' || chartType === 'radial-progress') return this.gauge(context);
    if (chartType === 'funnel') return this.funnel(context);
    if (chartType === 'treemap') return this.treemap(context);
    if (chartType === 'radar') return this.radar(context);

    return this.axisChart(context);
  }

  private makeContext(block: DashboardGenericChartBlock, chartType: DashboardChartType): ChartParseContext {
    const columns = block.data?.columns || [];
    const metricColumns = columns.filter(column => column.role === 'metric' && column.type === 'number');
    const dimensionColumn = columns.find(column => column.role === 'dimension' || column.type === 'date') || columns.find(column => column.role === 'category');
    const categoryColumn = columns.find(column => column.role === 'category' || column.role === 'status') || dimensionColumn;
    const seriesColumn = columns.find(column => column.role === 'series');
    const rows = this.normalizeRows(block, block.data?.rows || [], categoryColumn || dimensionColumn, metricColumns);

    return {
      block,
      chartType,
      dimensionColumn,
      categoryColumn,
      seriesColumn,
      metricColumns,
      rows,
    };
  }

  private normalizeRows(
    block: DashboardGenericChartBlock,
    rows: Array<Record<string, any>>,
    categoryColumn: DashboardChartColumn | undefined,
    metricColumns: DashboardChartColumn[]
  ): Array<Record<string, any>> {
    if (block.id !== 'ar_aging' || !categoryColumn || !metricColumns.length) return rows;

    return this.completeAgingRows(rows, categoryColumn, metricColumns);
  }

  private completeAgingRows(
    rows: Array<Record<string, any>>,
    categoryColumn: DashboardChartColumn,
    metricColumns: DashboardChartColumn[]
  ): Array<Record<string, any>> {
    const buckets = [
      { key: '0-30', label: '0-30' },
      { key: '31-60', label: '31-60' },
      { key: '61-90', label: '61-90' },
      { key: '90+', label: '90+' },
    ];
    const rowsByBucket = new Map(rows.map(row => [this.normalizeAgingBucket(this.label(row, categoryColumn)), row]));

    return buckets.map(bucket => {
      const existingRow = rowsByBucket.get(bucket.key);
      if (existingRow) return { ...existingRow, [categoryColumn.key]: bucket.key, [`${categoryColumn.key}Label`]: bucket.label };

      return metricColumns.reduce(
        (row, metric) => ({ ...row, [metric.key]: 0 }),
        { [categoryColumn.key]: bucket.key, [`${categoryColumn.key}Label`]: bucket.label }
      );
    });
  }

  private normalizeAgingBucket(label: string): string {
    const value = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '');

    if (value.includes('0-30') || value.includes('0a30')) return '0-30';
    if (value.includes('31-60') || value.includes('31a60')) return '31-60';
    if (value.includes('61-90') || value.includes('61a90')) return '61-90';
    if (value.includes('90+') || value.includes('+90') || value.includes('masde90') || value.includes('mayor90')) return '90+';

    return value;
  }

  private axisChart(context: ChartParseContext): any {
    const xColumn = context.dimensionColumn || context.categoryColumn;
    const metricColumns = context.chartType === 'stacked-bar' ? context.metricColumns : [this.primaryMetric(context)].filter(Boolean);
    const categories = this.unique(context.rows.map(row => this.label(row, xColumn)));
    const isLineChart = context.chartType === 'line' || context.chartType === 'area-line';
    const groupedSeries = this.hasSeriesGrouping(context)
      ? this.makeGroupedSeries(context, categories)
      : metricColumns.map(metric => ({
          name: metric.label,
          type: isLineChart ? 'line' : 'bar',
          stack: context.chartType === 'stacked-bar' ? 'total' : undefined,
          smooth: isLineChart,
          areaStyle: context.chartType === 'area-line' ? { opacity: 0.2 } : undefined,
          symbol: 'circle',
          symbolSize: 6,
          emphasis: { focus: 'series' },
          lineStyle: isLineChart ? { width: 3, cap: 'round', join: 'round' } : undefined,
          itemStyle: context.chartType.includes('bar') || context.chartType === 'bar' ? { borderRadius: [8, 8, 3, 3] } : undefined,
          barMaxWidth: context.chartType.includes('bar') || context.chartType === 'bar' ? 28 : undefined,
          data: categories.map((category, index) => {
            const row = context.rows.find(item => this.label(item, xColumn) === category);
            return this.chartDataItem(Number(row?.[metric.key] || 0), index, context.chartType);
          }),
        }));

    return this.baseOption({
      tooltip: { trigger: 'axis', axisPointer: { type: context.chartType === 'line' || context.chartType === 'area-line' ? 'line' : 'shadow' } },
      legend: { top: 0, type: 'scroll' },
      grid: { left: 14, right: 16, top: 34, bottom: 10, containLabel: true },
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value' },
      series: groupedSeries,
    });
  }

  private rankingBar(context: ChartParseContext): any {
    const categoryColumn = context.categoryColumn || context.dimensionColumn;
    const metric = this.primaryMetric(context);
    const rows = [...context.rows].sort((a, b) => Number(a[metric.key] || 0) - Number(b[metric.key] || 0));

    return this.baseOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 14, right: 20, top: 16, bottom: 10, containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: rows.map(row => this.label(row, categoryColumn)) },
      series: [
        {
          name: metric.label,
          type: 'bar',
          data: rows.map((row, index) => ({
            value: Number(row[metric.key] || 0),
            itemStyle: {
              color: this.colorAt(index),
              borderRadius: [0, 8, 8, 0],
            },
          })),
          barMaxWidth: 24,
          itemStyle: { borderRadius: [0, 8, 8, 0] },
        },
      ],
    });
  }

  private pie(context: ChartParseContext): any {
    const categoryColumn = context.categoryColumn || context.dimensionColumn;
    const metric = this.primaryMetric(context);
    const isDoughnut = context.chartType === 'doughnut';
    const surfaceColor = this.cssVar('--app-surface', '#ffffff');

    return this.baseOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          name: metric.label,
          type: 'pie',
          radius: isDoughnut ? ['52%', '72%'] : '68%',
          center: ['50%', '43%'],
          roseType: context.chartType === 'rose-pie' ? 'radius' : undefined,
          avoidLabelOverlap: true,
          itemStyle: { borderColor: surfaceColor, borderRadius: 4, borderWidth: 2 },
          label: { color: this.cssVar('--app-text-muted', '#657081'), fontSize: 11 },
          labelLine: { length: 10, length2: 8, lineStyle: { color: this.cssVar('--app-border', '#ced4da') } },
          emphasis: { scale: true, scaleSize: 8 },
          data: context.rows.map((row, index) => ({
            name: this.label(row, categoryColumn),
            value: Number(row[metric.key] || 0),
            itemStyle: { color: this.colorAt(index) },
          })),
        },
      ],
    });
  }

  private gauge(context: ChartParseContext): any {
    const metric = this.metricByFormat(context, 'percent') || this.primaryMetric(context);
    const value = this.getProgressValue(context, metric);

    return this.baseOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          name: metric.label,
          type: 'gauge',
          progress: { show: true, roundCap: true },
          axisLine: { roundCap: true, lineStyle: { width: 12 } },
          pointer: { show: context.chartType === 'gauge' },
          detail: { formatter: '{value}%', fontSize: 22, fontWeight: 700, color: this.cssVar('--app-text', '#1d253b') },
          data: [{ value, name: metric.label }],
        },
      ],
    });
  }

  private funnel(context: ChartParseContext): any {
    const categoryColumn = context.categoryColumn || context.dimensionColumn;
    const metric = this.primaryMetric(context);
    const rows = [...context.rows].sort((a, b) => Number(b[metric.key] || 0) - Number(a[metric.key] || 0));

    return this.baseOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          name: metric.label,
          type: 'funnel',
          left: '8%',
          top: 10,
          bottom: 34,
          width: '84%',
          sort: 'descending',
          label: { color: this.cssVar('--app-text', '#1d253b'), fontWeight: 600 },
          labelLine: { lineStyle: { color: this.cssVar('--app-border', '#ced4da') } },
          emphasis: { label: { fontWeight: 700 } },
          data: rows.map((row, index) => ({ name: this.label(row, categoryColumn), value: Number(row[metric.key] || 0), itemStyle: { color: this.colorAt(index) } })),
        },
      ],
    });
  }

  private treemap(context: ChartParseContext): any {
    const categoryColumn = context.categoryColumn || context.dimensionColumn;
    const metric = this.primaryMetric(context);
    const surfaceColor = this.cssVar('--app-surface', '#ffffff');
    const textColor = this.cssVar('--app-text', '#1d253b');
    const borderColor = this.cssVar('--app-card-border', this.cssVar('--app-border', '#ced4da'));

    return this.baseOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          name: metric.label,
          type: 'treemap',
          roam: false,
          breadcrumb: { show: false },
          label: { show: true, formatter: '{b}', color: '#ffffff', fontSize: 11, fontWeight: 700 },
          upperLabel: { show: false },
          itemStyle: { borderWidth: 2, borderColor, gapWidth: 3 },
          nodeClick: false,
          levels: [
            {
              itemStyle: {
                borderColor: surfaceColor,
                borderWidth: 0,
                gapWidth: 0,
              },
            },
            {
              label: { color: '#ffffff' },
              itemStyle: {
                borderColor,
                borderWidth: 2,
                gapWidth: 3,
              },
              emphasis: {
                label: { color: '#ffffff' },
                itemStyle: {
                  borderColor: textColor,
                },
              },
            },
          ],
          data: context.rows.map((row, index) => ({ name: this.label(row, categoryColumn), value: Number(row[metric.key] || 0), itemStyle: { color: this.colorAt(index) } })),
        },
      ],
    });
  }

  private radar(context: ChartParseContext): any {
    const categoryColumn = context.categoryColumn || context.dimensionColumn;
    const metrics = context.metricColumns.slice(0, 6);
    const rows = context.rows.slice(0, 5);

    return this.baseOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      radar: {
        radius: '60%',
        axisName: { color: this.cssVar('--app-text-muted', '#657081'), fontSize: 11 },
        splitLine: { lineStyle: { color: this.cssVar('--app-border', '#ced4da'), opacity: 0.7 } },
        splitArea: { areaStyle: { color: ['rgba(22, 163, 74, 0.035)', 'rgba(37, 99, 235, 0.025)'] } },
        axisLine: { lineStyle: { color: this.cssVar('--app-border', '#ced4da'), opacity: 0.75 } },
        indicator: metrics.map(metric => ({
          name: metric.label,
          max: this.metricMax(context, metric),
        })),
      },
      series: [
        {
          name: context.block.title,
          type: 'radar',
          data: rows.map((row, index) => ({
            name: this.label(row, categoryColumn),
            value: metrics.map(metric => Number(row[metric.key] || 0)),
            areaStyle: { color: this.colorWithAlpha(this.colorAt(index), 0.12) },
            itemStyle: { color: this.colorAt(index) },
            lineStyle: { color: this.colorAt(index), width: 2 },
          })),
        },
      ],
    });
  }

  private makeGroupedSeries(context: ChartParseContext, categories: string[]) {
    const xColumn = context.dimensionColumn || context.categoryColumn;
    const seriesColumn = context.seriesColumn || context.categoryColumn;
    const metric = this.primaryMetric(context);
    const seriesNames = this.unique(context.rows.map(row => this.label(row, seriesColumn)));
    const isLineChart = context.chartType === 'line' || context.chartType === 'area-line';

    return seriesNames.map(name => ({
      name,
      type: isLineChart ? 'line' : 'bar',
      stack: context.chartType === 'stacked-bar' ? 'total' : undefined,
      smooth: isLineChart,
      areaStyle: context.chartType === 'area-line' ? { opacity: 0.18 } : undefined,
      symbol: 'circle',
      symbolSize: 6,
      emphasis: { focus: 'series' },
      lineStyle: isLineChart ? { width: 3, cap: 'round', join: 'round' } : undefined,
      barMaxWidth: context.chartType.includes('bar') || context.chartType === 'bar' ? 28 : undefined,
      itemStyle: context.chartType.includes('bar') || context.chartType === 'bar' ? { borderRadius: [8, 8, 3, 3] } : undefined,
      data: categories.map((category, index) => {
        const row = context.rows.find(item => this.label(item, xColumn) === category && this.label(item, seriesColumn) === name);
        return this.chartDataItem(Number(row?.[metric.key] || 0), index, context.chartType);
      }),
    }));
  }

  private hasSeriesGrouping(context: ChartParseContext): boolean {
    return Boolean(
      context.metricColumns.length === 1 &&
        context.dimensionColumn &&
        context.categoryColumn &&
        context.categoryColumn.key !== context.dimensionColumn.key &&
        (context.seriesColumn || context.dimensionColumn.type === 'date')
    );
  }

  private primaryMetric(context: ChartParseContext): DashboardChartColumn {
    return context.metricColumns[0];
  }

  private metricByFormat(context: ChartParseContext, format: DashboardChartColumn['format']): DashboardChartColumn | null {
    return context.metricColumns.find(metric => metric.format === format) || null;
  }

  private getProgressValue(context: ChartParseContext, metric: DashboardChartColumn): number {
    const summary = context.block.data?.summary || {};
    const summaryValue = summary[metric.key]?.percentage ?? summary.collection_ratio?.percentage ?? summary[metric.key]?.ratio;
    const rowValue = context.rows.find(row => row[metric.key] !== undefined)?.[metric.key];
    return Math.max(0, Math.min(100, Number(summaryValue ?? rowValue ?? 0)));
  }

  private metricMax(context: ChartParseContext, metric: DashboardChartColumn): number {
    const summaryMax = Number(context.block.data?.summary?.[metric.key]?.max || 0);
    const rowMax = Math.max(...context.rows.map(row => Number(row[metric.key] || 0)), 1);
    return Math.max(summaryMax, rowMax, 1);
  }

  private label(row: Record<string, any>, column?: DashboardChartColumn): string {
    if (!column) return '';
    return String(row[`${column.key}Label`] ?? row[column.key] ?? '');
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values.filter(value => value !== '')));
  }

  private colorAt(index: number): string {
    return this.colors[index % this.colors.length];
  }

  private chartDataItem(value: number, index: number, chartType: DashboardChartType): number | { value: number; itemStyle: any } {
    const color = this.colorAt(index);

    if (chartType === 'line' || chartType === 'area-line') {
      return value;
    }

    if (chartType === 'bar' || chartType === 'stacked-bar') {
      return { value, itemStyle: { color, borderRadius: [8, 8, 3, 3] } };
    }

    return value;
  }

  private colorWithAlpha(hex: string, alpha: number): string {
    const normalized = hex.replace('#', '');
    const value = parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private baseOption(option: any): any {
    const textColor = this.cssVar('--app-text', '#1d253b');
    const mutedColor = this.cssVar('--app-text-muted', '#657081');
    const borderColor = this.cssVar('--app-border', '#ced4da');

    return {
      animation: true,
      animationDuration: 900,
      animationEasing: 'cubicOut',
      color: this.colors,
      textStyle: { color: textColor },
      ...option,
      backgroundColor: 'transparent',
      tooltip: this.normalizeTooltip(option.tooltip),
      legend: option.legend ? { itemWidth: 9, itemHeight: 9, icon: 'circle', textStyle: { color: mutedColor, fontSize: 11 }, ...option.legend } : option.legend,
      xAxis: option.xAxis ? this.normalizeAxis(option.xAxis, textColor, mutedColor, borderColor) : option.xAxis,
      yAxis: option.yAxis ? this.normalizeAxis(option.yAxis, textColor, mutedColor, borderColor) : option.yAxis,
    };
  }

  private normalizeTooltip(tooltip: any): any {
    if (!tooltip) return tooltip;

    const extraCssText = [
      tooltip.extraCssText,
      'box-shadow: 0 18px 40px -26px rgba(0,0,0,.55); border-radius: 12px; z-index: 99999960 !important; pointer-events: none;',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      backgroundColor: this.cssVar('--app-surface', '#ffffff'),
      borderColor: this.cssVar('--app-border', '#ced4da'),
      borderWidth: 1,
      appendToBody: true,
      padding: [10, 12],
      textStyle: {
        color: this.cssVar('--app-text', '#1d253b'),
        fontSize: 12,
        fontWeight: 500,
      },
      ...tooltip,
      extraCssText,
    };
  }

  private normalizeAxis(axis: any, textColor: string, mutedColor: string, borderColor: string): any {
    const normalizeOne = item => ({
      axisLabel: { color: mutedColor, ...(item.axisLabel || {}) },
      axisLine: { show: false, lineStyle: { color: borderColor }, ...(item.axisLine || {}) },
      axisTick: { show: false, lineStyle: { color: borderColor }, ...(item.axisTick || {}) },
      splitLine: { lineStyle: { color: borderColor, opacity: 0.22 }, ...(item.splitLine || {}) },
      nameTextStyle: { color: textColor, ...(item.nameTextStyle || {}) },
      ...item,
    });

    return Array.isArray(axis) ? axis.map(normalizeOne) : normalizeOne(axis);
  }

  private emptyOption(block: DashboardGenericChartBlock): any {
    return {
      title: {
        text: block.title,
        subtext: 'No hay datos disponibles',
        left: 'center',
        top: 'center',
        textStyle: { color: this.cssVar('--app-text', '#1d253b'), fontSize: 13 },
        subtextStyle: { color: this.cssVar('--app-text-muted', '#657081'), fontSize: 11 },
      },
      backgroundColor: 'transparent',
      series: [],
    };
  }

  private cssVar(name: string, fallback: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }
}
