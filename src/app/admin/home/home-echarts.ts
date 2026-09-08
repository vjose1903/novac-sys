import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, GaugeChart, LineChart, PieChart, RadarChart, TreemapChart } from 'echarts/charts';
import { GridComponent, LegendComponent, RadarComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, FunnelChart, GaugeChart, LineChart, PieChart, RadarChart, TreemapChart, GridComponent, LegendComponent, RadarComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

export const dashboardEcharts = echarts;
