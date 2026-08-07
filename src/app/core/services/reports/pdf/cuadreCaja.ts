/* eslint-disable @typescript-eslint/indent */
import * as fun_ from '../utils/funciones';
import { defaultStyle, styles_ } from '../utils/files';
import { Ss } from '../../singleton.service';
import { ConfigI } from '../../../interface/config-interface';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

export function makePDF(data) {
  const configApp: ConfigI = Ss.configServ.config;
  const reportData = normalizeReportData(data);

  try {
    if (isNewFlow(reportData)) return makeDetailedPDF(reportData, configApp);
    return makeLegacyPDF(reportData, configApp);
  } catch (error) {
    return error;
  }
}

function makeLegacyPDF(data, configApp: ConfigI) {
  try {
    const dd = {
      pageSize: { width: 600, height: 398 },
      pageMargins: [15, 159.5, 15, 15],
      header: (currentPage, pageCount, pageSize) => cabeceraReporte(data, configApp, currentPage, pageCount),
      content: contenidoReporte(data),
      images: {
        logo: `data:image/png;base64,${configApp.logo_impresion}`,
      },
      styles: styles_,
      defaultStyle,
    };

    const obj = { doc: dd, file: 'cuadre.pdf', type: 'base64', pageOrientation: 'portrait' };
    return obj;
  } catch (error) {
    return error;
  }
}

function makeDetailedPDF(data, configApp: ConfigI) {
  const dd = {
    pageSize: 'LETTER',
    pageMargins: [34, 98, 34, 28],
    pageOrientation: 'portrait',
    header: cabeceraCuadreModerno(data, configApp),
    content: contenidoReporteDetallado(data),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
    defaultStyle,
  };

  return { doc: dd, file: 'cuadre.pdf', type: 'base64', pageOrientation: 'portrait' };
}

// ====================================================================================================================================================
// CABECERA
// ====================================================================================================================================================
function cabeceraReporte(data, configApp: ConfigI, currentPage, pageCount) {
  try {
    const fecha = data.fecha_equivalente || data.fecha || data.closing_date || new Date();
    const numeroDocumento = data.numero_documento || data.numero_reporte || data.id || '';
    const header = [
      {
        margin: [15, 15, 15, 0],
        columns: [
          [
            { text: 'pag: ' + currentPage.toString() + ' de ' + pageCount, alignment: 'left', style: 'letra9' },
            { image: 'logo', width: 50, height: 45, margin: [60, -15, 0, 0] },
          ],
          [
            {
              stack: [
                {
                  alignment: 'right',
                  text: [
                    { text: fun_.my_dateFormater(fecha), style: 'letra10', bold: true },
                    { text: ' - ' + fun_.my_houreFormater(fecha), style: 'letra10', bold: true },
                  ],
                },

                {
                  alignment: 'right',
                  text: [
                    {
                      text: [{ text: 'no: ', style: 'letra10', bold: false }],
                      alignment: 'right',
                    },
                    { text: numeroDocumento ? fun_.my_padStart(numeroDocumento, 8, '0') : '', style: 'letra10', alignment: 'right' },
                  ],
                },
                {
                  alignment: 'right',
                  text: [
                    {
                      text: [{ text: 'Realizado por: ', style: 'letra10', bold: false }],
                      alignment: 'right',
                    },
                    { text: data.usuario || '', style: 'letra10', alignment: 'right' },
                  ],
                },
              ],
            },
          ],
        ],
      },
      {
        margin: [0, -45, 0, 0],
        stack: [
          { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra11' },
          { text: configApp.direccion_empresa, alignment: 'center', style: 'letra10' },
          {
            text: [
              { text: 'Telefono: ', style: 'letra10', bold: true },
              { text: configApp.telefono_empresa + ' ', style: 'letra10' },
              { text: ' RNC: ', style: 'letra10', bold: true },
              { text: configApp.rnc_empresa, style: 'letra10' },
            ],
            alignment: 'center',
          },
        ],
      },
      { text: [{ text: 'Cuadre de caja', style: 'letra12', bold: true }], margin: [0, 30, 0, 0], alignment: 'center' },
      // =============================================================
      {
        canvas: [{ type: 'rect', x: 200, y: 5, w: 200, h: 1, color: '#000000' }],
      },

      // =============================================================
    ];

    return header;
  } catch (error) {
    throw error;
  }
}

function cabeceraCuadreModerno(data, configApp: ConfigI) {
  const header = (currentPage, pageCount) => [
    {
      margin: [34, 12, 34, 0],
      columns: [
        {
          width: 76,
          stack: [{ image: 'logo', width: 58, opacity: 0.92, margin: [0, 2, 0, 0] }],
        },
        {
          width: '*',
          stack: [
            { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra11' },
            { text: configApp.direccion_empresa, alignment: 'center', style: 'letra8' },
            {
              text: [
                { text: 'Telefono: ', style: 'letra8', bold: true },
                { text: configApp.telefono_empresa, style: 'letra8' },
                { text: '  RNC: ', style: 'letra8', bold: true },
                { text: configApp.rnc_empresa, style: 'letra8' },
              ],
              alignment: 'center',
            },
            { text: 'CUADRE DIARIO DE CAJA', alignment: 'center', bold: true, style: 'letra12', margin: [0, 7, 0, 0] },
          ],
        },
        {
          width: 142,
          stack: [
            metadataText('Pag... :  ', `${currentPage} de ${pageCount}`),
            metadataText('Fecha : ', `${formatDate(new Date())} - ${fun_.my_houreFormater(new Date())}`),
            metadataText('Realizado por: ', userName(data.prepared_by) || data.realizado_por || data.usuario || ''),
            metadataText('Aprobado por: ', userName(data.approved_by)),
            metadataText('No... :  ', data.numero_documento || data.numero_reporte || data.id || ''),
          ],
        },
      ],
    },
    {
      canvas: [{ type: 'line', x1: 34, y1: 5, x2: 578, y2: 5, lineWidth: 0.8, lineColor: '#222222' }],
    },
  ];

  return header;
}

// ================================================================================================================================================
// CONTENIDO
// =========================================================~======================================================================================

function contenidoReporte(data) {
  const body = [];
  const contenidoReporte = Array.isArray(data.contenido_reporte) ? data.contenido_reporte : legacyContenidoReporte(data);

  contenidoReporte.forEach((detalle, i) => {
    const row = [];
    row.push({ text: detalle.titulo, alignment: 'left', bold: true, style: 'letra11' }, { text: fun_.roundNumberToDecimal(detalle.valor), alignment: 'right', margin: [0, 0, 15, 0] });
    body.push(row);
  });

  const content = [
    {
      margin: [10, 0, 10, 0],
      columns: [
        [
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*'],
              body: [
                [
                  { text: 'Descripción', alignment: 'left', bold: true, style: 'letra11' },
                  { text: 'Monto', alignment: 'right', bold: true, style: 'letra11', margin: [0, 0, 15, 0] },
                ],
                ...body,
              ],
            },

            layout: {
              fillColor: (rowIndex, node, columnIndex) => {
                return rowIndex === 4 ? '#dcdcdc' : null;
              },
              hLineWidth: (i, node) => (i === 0 || i === 1 || i === 4 || i === 5 || i === 6 ? 2 : 1),
              vLineWidth: (i, node) => 0,
              hLineColor: (i, node) => (i === 0 || i === 1 || i === 4 || i === 5 || i === 6 ? 'black' : 'gray'),
              vLineColor: (i, node) => 'black',
            },
          },
        ],
      ],
    },
  ];
  return content;
}

function legacyContenidoReporte(data) {
  return [
    { descripcion: 'facturas_contado', titulo: 'Total facturado a contado', valor: data.total_venta_contado || data.final_consumer_invoices_total || data.system_income_total || data.totals?.system_income_total || 0 },
    { descripcion: 'recibos_ingresos', titulo: 'Total recibo de ingreso', valor: data.total_recibo_ingreso || data.income_receipts_total || 0 },
    { descripcion: 'total_anterior', titulo: 'Total anterior', valor: data.total_anterior || 0 },
    { descripcion: 'total_general', titulo: 'Total en caja', valor: data.total_general || data.operational_total || data.totals?.operational_total || data.total || 0 },
    { descripcion: 'facturas_credito', titulo: 'Total facturado a crédito', valor: data.total_venta_credito || 0 },
  ];
}

function contenidoReporteDetallado(data) {
  const systemIncome = getSystemIncome(data);
  const totals = getTotals(data);
  const bills = getDenominations(data, 'bill');
  const coins = getDenominations(data, 'coin');
  const foreignCurrency = getDenominations(data, 'foreign_currency');
  const otherPaymentMethods = getMovements(data, 'other_payment_methods');
  const additionalTransfers = getMovements(data, 'additional_transfers');
  const physicalCashTotal = getFirstValue(totals, ['physical_cash_total', 'cash_total'], sumDenominations([...bills, ...coins, ...foreignCurrency]));
  const otherPaymentMethodsTotal = getFirstValue(totals, ['other_payment_methods_total'], sumMovements(otherPaymentMethods));
  const additionalTransfersTotal = getFirstValue(totals, ['additional_transfers_total'], sumMovements(additionalTransfers));
  const operationalTotal = getFirstValue(totals, ['operational_total', 'total'], toNumber(physicalCashTotal) + toNumber(otherPaymentMethodsTotal) + toNumber(additionalTransfersTotal));
  const systemIncomeTotal = getFirstValue(systemIncome, ['system_income_total'], getFirstValue(totals, ['system_income_total'], 0));
  const creditInvoicesTotal = getFirstValue(systemIncome, ['credit_invoices_total'], getFirstValue(totals, ['credit_invoices_total'], 0));
  const openingCashFund = getFirstValue(totals, ['opening_cash_fund'], 0);
  const expectedTotal = getFirstValue(totals, ['expected_total'], toNumber(systemIncomeTotal) + toNumber(openingCashFund));
  const differenceAmount = getFirstValue(totals, ['difference_amount', 'difference'], toNumber(operationalTotal) - toNumber(expectedTotal));

  return [
    makeCompactDenominationSection('BILLETES', bills, false),
    makeCompactDenominationSection('MONEDAS', coins, false),
    foreignCurrency.length ? makeCompactDenominationSection('DIVISAS', foreignCurrency, true) : emptyBlock(),
    makeCompactTotalLine('TOTALES', physicalCashTotal),
    makeCompactMovementSection('TARJETAS, CHEQUES, DEPOSITOS Y TRANSFERENCIAS', otherPaymentMethods, otherPaymentMethodsTotal),
    makeCompactMovementSection('TRANSFERENCIAS ADICIONALES', additionalTransfers, additionalTransfersTotal),
    makeCompactTotalsSection({
      finalConsumerInvoicesTotal: getFirstValue(systemIncome, ['final_consumer_invoices_total'], getFirstValue(totals, ['final_consumer_invoices_total'], 0)),
      incomeReceiptsTotal: getFirstValue(systemIncome, ['income_receipts_total'], getFirstValue(totals, ['income_receipts_total'], 0)),
      systemIncomeTotal,
      operationalTotal,
      openingCashFund,
      expectedTotal,
      differenceAmount,
    }),
    makeInformativeCreditInvoicesSection(creditInvoicesTotal),
    makeSignatureSection(),
    data.notes ? { text: `Observaciones: ${data.notes}`, style: 'letra8', margin: [0, 8, 0, 0] } : emptyBlock(),
  ].filter(item => !!item);
}

function makeCompactDenominationSection(title: string, rows: any[], showRate: boolean) {
  const body = [
    [
      tableHeaderCell('MONEDA'),
      tableHeaderCell('DENOM.'),
      tableHeaderCell('CANTIDAD'),
      showRate ? tableHeaderCell('TASA') : tableHeaderCell(''),
      tableHeaderCell('TOTAL'),
    ],
    ...(rows.length
      ? rows.map(item => [
        { text: getCurrencyCode(item), style: 'letra8', alignment: 'center' },
        { text: formatInteger(item.denomination_value), style: 'letra9', alignment: 'right' },
        { text: formatQuantity(item.quantity), style: 'letra9', alignment: 'right' },
        showRate ? { text: formatRate(item.exchange_rate || item.current_tasa || item.tasa || 1), style: 'letra9', alignment: 'right' } : {},
        { text: formatAmount(getDenominationTotal(item)), style: 'letra9', alignment: 'right' },
      ])
      : [[{}, { text: '-', style: 'letra9', alignment: 'right' }, { text: '-', style: 'letra9', alignment: 'right' }, showRate ? {} : {}, { text: '-', style: 'letra9', alignment: 'right' }]]),
    [
      { text: 'TOTAL', bold: true, style: 'letra9', alignment: 'left', margin: [7, 2, 0, 2] },
      {},
      {},
      {},
      { text: formatAmount(sumDenominations(rows)), bold: true, style: 'letra9', alignment: 'right' },
    ],
  ];

  return {
    margin: [0, 0, 0, 5],
    stack: [
      sectionTitle(title),
      {
        table: {
          widths: [62, 72, '*', showRate ? 58 : 20, 105],
          body,
        },
        layout: sectionTableLayout(),
      },
    ],
  };
}

function makeCompactTotalLine(label: string, total) {
  return {
    margin: [0, -5, 0, 8],
    table: {
      widths: [160, '*', 105],
      body: [[{ text: label, bold: true, style: 'letra9', alignment: 'left', margin: [7, 3, 0, 3] }, {}, { text: formatAmount(total), bold: true, style: 'letra9', alignment: 'right', margin: [0, 3, 8, 3] }]],
    },
    layout: totalBandLayout('#dcdcdc', false),
  };
}

function makeCompactMovementSection(title: string, rows: any[], total) {
  const visibleRows = rows.length ? rows : [{ payment_method: '', description: '', reference: '', amount: 0 }];
  const body = [
    [
      tableHeaderCell('METODO', 'left'),
      tableHeaderCell('DESCRIPCION', 'left'),
      tableHeaderCell('REFERENCIA', 'left'),
      tableHeaderCell('MONTO'),
    ],
    ...visibleRows.map(item => [
      { text: paymentMethodLabel(item.payment_method) || '', style: 'letra9', margin: [7, 1, 0, 1] },
      { text: item.description || '', style: 'letra9', margin: [0, 1, 0, 1] },
      { text: item.reference || '', style: 'letra9', margin: [0, 1, 0, 1] },
      { text: formatAmount(item.amount), style: 'letra9', alignment: 'right', margin: [0, 1, 0, 1] },
    ]),
    [
      { text: 'TOTAL', bold: true, style: 'letra9', alignment: 'left', margin: [7, 2, 0, 2] },
      {},
      {},
      { text: formatAmount(total), bold: true, style: 'letra9', alignment: 'right' },
    ],
  ];

  return {
    margin: [0, 0, 0, 8],
    stack: [
      sectionTitle(title),
      {
        table: {
          widths: [92, '*', 120, 105],
          body,
        },
        layout: sectionTableLayout(),
      },
    ],
  };
}

function makeCompactTotalsSection(values) {
  const rows = [
    ['TOTAL EFECTIVO DEL DIA', values.operationalTotal, true],
    ['FACTURAS CONSUMIDOR FINAL:', values.finalConsumerInvoicesTotal, false],
    ['RECIBO DE INGRESOS', values.incomeReceiptsTotal, false],
    ['TOTAL SISTEMA', values.systemIncomeTotal, false],
    ['FONDO INICIAL', values.openingCashFund, false],
    ['TOTAL ESPERADO', values.expectedTotal, false],
    ['DIFERENCIA', values.differenceAmount, true],
  ];

  return {
    margin: [0, 0, 0, 0],
    table: {
      widths: ['*', 125],
      body: rows.map(row => totalRow(row[0], row[1], row[2])),
    },
    layout: modernTotalsLayout(),
  };
}

function totalRow(label, value, highlighted = false) {
  return [
    { text: label, style: 'letra9', bold: true, margin: [7, 3, 0, 3] },
    { text: formatAmount(value), style: 'letra9', bold: highlighted, alignment: 'right', margin: [0, 3, 8, 3] },
  ];
}

function makeInformativeCreditInvoicesSection(total) {
  return {
    margin: [0, 7, 0, 0],
    table: {
      widths: ['*', 125],
      body: [[
        { text: 'FACTURAS A CREDITO', style: 'letra9', bold: true, margin: [7, 3, 0, 3] },
        { text: formatAmount(total), style: 'letra9', bold: true, alignment: 'right', margin: [0, 3, 8, 3] },
      ]],
    },
    layout: totalBandLayout('#eeeeee', true),
  };
}

function makeSignatureSection() {
  return {
    margin: [0, 16, 0, 0],
    columns: [
      {
        width: '*',
        text: [
          { text: 'ELABORADO POR: ', bold: true, style: 'letra9' },
          { text: '____________________________', style: 'letra9' },
        ],
      },
      {
        width: '*',
        text: [
          { text: 'REVISADO POR: ', bold: true, style: 'letra9' },
          { text: '____________________________', style: 'letra9' },
        ],
      },
    ],
  };
}

function metadataText(label, value) {
  return {
    text: [
      { text: label, style: 'letra8', bold: true },
      { text: value ? String(value) : '', style: 'letra8' },
    ],
    alignment: 'left',
    margin: [0, 1, 0, 0],
  };
}

function sectionTitle(title: string) {
  return { text: title, bold: true, style: 'letra10', margin: [0, 4, 0, 2] };
}

function tableHeaderCell(text, alignment?) {
  return { text, style: 'letra8', bold: true, alignment: alignment || (text === 'MONEDA' ? 'center' : 'right'), margin: [0, 2, 0, 2] };
}

function modernTableLayout() {
  return {
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.45),
    vLineWidth: () => 0,
    hLineColor: () => '#d9e0e6',
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };
}

function sectionTableLayout() {
  return {
    fillColor: (rowIndex, node) => (rowIndex === node.table.body.length - 1 ? '#eeeeee' : null),
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.45),
    vLineWidth: () => 0,
    hLineColor: () => '#d9e0e6',
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };
}

function totalBandLayout(color = '#eeeeee', showTopLine = true) {
  return {
    fillColor: () => color,
    hLineWidth: (i, node) => (i === 0 ? (showTopLine ? 0.7 : 0) : i === node.table.body.length ? 0.7 : 0),
    vLineWidth: () => 0,
    hLineColor: () => '#222222',
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  };
}

function modernTotalsLayout() {
  return {
    fillColor: rowIndex => (rowIndex === 0 || rowIndex === 6 ? '#dcdcdc' : null),
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0.7 : 0.35),
    vLineWidth: () => 0,
    hLineColor: (i, node) => (i === 0 || i === node.table.body.length ? '#222222' : '#c9c9c9'),
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };
}

function noBorderLayout() {
  return {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 2,
    paddingRight: () => 2,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };
}

function emptyBlock() {
  return { text: '', margin: [0, 0, 0, 0] };
}

function isNewFlow(data) {
  if (typeof data?.is_new_flow === 'boolean') return data.is_new_flow;
  if (data?.flow_type === 'new') return true;
  if (data?.flow_type === 'legacy') return false;
  if (data?.closing_version === 'detailed') return true;
  if (data?.closing_version === 'legacy') return false;
  return false;
}

function normalizeReportData(data) {
  return data?.data?.cuadre || data?.cuadre || data?.data || data || {};
}

function getClosingDate(data) {
  return data?.closing_date || data?.fecha || data?.fecha_equivalente || data?.fecha;
}

function formatDate(date) {
  return date ? fun_.my_dateFormater(date) : '';
}

function formatAmount(value) {
  return fun_.roundNumberToDecimal(toNumber(value || 0));
}

function formatInteger(value) {
  return Math.round(toNumber(value || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatQuantity(value) {
  return formatInteger(value);
}

function formatRate(value) {
  return fun_.roundNumberToDecimal(toNumber(value || 0));
}

function getSystemIncome(data) {
  return data?.system_income || data?.systemIncome || data?.system_income_details || {};
}

function getTotals(data) {
  return data?.totals || {};
}

function getDenominations(data, type) {
  const denominations = data?.denominaciones || data?.denominations || {};
  if (Array.isArray(denominations)) return denominations.filter(item => item.denomination_type === type);
  const key = type === 'bill' ? 'bills' : type === 'coin' ? 'coins' : 'foreign_currency';
  return denominations[key] || [];
}

function getMovements(data, group) {
  const movements = data?.movimientos || data?.movements || {};
  if (Array.isArray(movements)) return movements.filter(item => item.movement_group === group);
  return movements[group] || [];
}

function getFirstValue(source, keys: string[], fallback) {
  const key = keys.find(item => source?.[item] !== undefined && source?.[item] !== null);
  return key ? source[key] : fallback;
}

function getCurrencyCode(item) {
  return item.currency_code || item.code || item.divisa?.code || item.divisa?.simbolo || '';
}

function getDenominationTotal(item) {
  if (item.total !== undefined) return item.total;
  if (item.total_amount !== undefined) return item.total_amount;
  if (item.amount !== undefined) return item.amount;
  if (item.local_currency_total !== undefined) return item.local_currency_total;
  return toNumber(item.denomination_value || 0) * toNumber(item.quantity || 0) * toNumber(item.exchange_rate || 1);
}

function sumDenominations(rows) {
  return rows.reduce((total, item) => total + toNumber(getDenominationTotal(item) || 0), 0);
}

function sumMovements(rows) {
  return rows.reduce((total, item) => total + toNumber(item.amount || 0), 0);
}

function toNumber(value) {
  return Number(fun_.desformatearStNumber(value || 0)) || 0;
}

function paymentMethodLabel(method) {
  const labels = {
    cash: 'Efectivo',
    check: 'Cheque',
    card: 'Tarjeta',
    deposit: 'Deposito',
    bank_transfer: 'Transferencia',
    other: 'Otro',
  };
  return labels[method] || method || '';
}

function userName(user) {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return user.nombre_completo || [user.nombre, user.apellido].filter(item => !!item).join(' ') || user.name || '';
}
