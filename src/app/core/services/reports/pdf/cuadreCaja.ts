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

  try {
    if (isNewFlow(data)) return makeDetailedPDF(data, configApp);
    return makeLegacyPDF(data, configApp);
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
    pageMargins: [42, 82, 42, 28],
    pageOrientation: 'portrait',
    header: cabeceraCuadreCompacto(data, configApp),
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

function cabeceraCuadreCompacto(data, configApp: ConfigI) {
  const header = () => [
    {
      margin: [42, 10, 42, 0],
      columns: [
        {
          width: 70,
          stack: [{ image: 'logo', width: 58, opacity: 0.9, margin: [0, 4, 0, 0] }],
        },
        {
          width: '*',
          stack: [
            { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra10' },
            { text: configApp.direccion_empresa, alignment: 'center', style: 'letra8' },
            {
              text: [
                { text: 'Telefono: ', style: 'letra8', bold: true },
                { text: configApp.telefono_empresa, style: 'letra8' },
              ],
              alignment: 'center',
            },
            {
              text: [
                { text: 'RNC No. ', style: 'letra8', bold: true },
                { text: configApp.rnc_empresa, style: 'letra8' },
              ],
              alignment: 'center',
            },
            { text: 'CUADRE DIARIO DE CAJA', alignment: 'center', bold: true, style: 'letra10', margin: [0, 4, 0, 0] },
          ],
        },
        {
          width: 85,
          stack: [
            { text: 'FECHA:', bold: true, alignment: 'center', style: 'letra9', margin: [0, 38, 0, 2] },
            { text: formatDate(getClosingDate(data)), bold: true, alignment: 'center', style: 'letra9' },
          ],
        },
      ],
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
  const openingCashFund = getFirstValue(totals, ['opening_cash_fund'], 0);
  const expectedTotal = getFirstValue(totals, ['expected_total'], toNumber(systemIncomeTotal) + toNumber(openingCashFund));
  const differenceAmount = getFirstValue(totals, ['difference_amount', 'difference'], toNumber(operationalTotal) - toNumber(expectedTotal));

  return [
    makeCompactDenominationSection('BILLETES', bills, false),
    makeCompactDenominationSection('MONEDAS', coins, false),
    foreignCurrency.length ? makeCompactDenominationSection('DIVISAS', foreignCurrency, true) : emptyBlock(),
    makeCompactTotalLine('TOTALES', physicalCashTotal),
    makeCompactMovementSection('MAS:', 'CHEQUES;', otherPaymentMethods, otherPaymentMethodsTotal),
    makeCompactMovementSection('MAS:', 'TRANSF.', additionalTransfers, additionalTransfersTotal),
    makeCompactTotalsSection({
      finalConsumerInvoicesTotal: getFirstValue(systemIncome, ['final_consumer_invoices_total'], getFirstValue(totals, ['final_consumer_invoices_total'], 0)),
      incomeReceiptsTotal: getFirstValue(systemIncome, ['income_receipts_total'], getFirstValue(totals, ['income_receipts_total'], 0)),
      systemIncomeTotal,
      operationalTotal,
      openingCashFund,
      expectedTotal,
      differenceAmount,
    }),
    makeSignatureSection(),
    data.notes ? { text: `Observaciones: ${data.notes}`, style: 'letra8', margin: [0, 8, 0, 0] } : emptyBlock(),
  ].filter(item => !!item);
}

function makeCompactDenominationSection(title: string, rows: any[], showRate: boolean) {
  const body = [
    [
      { text: title, bold: true, style: 'letra9', margin: [0, 0, 0, 2] },
      {},
      {},
      { text: 'CANTIDAD', bold: true, style: 'letra9', alignment: 'center' },
      showRate ? { text: 'TASA', bold: true, style: 'letra9', alignment: 'right' } : {},
      { text: 'TOTAL', bold: true, style: 'letra9', alignment: 'right' },
    ],
    ...(rows.length
      ? rows.map(item => [
        { text: showRate ? getCurrencyCode(item) : '', style: 'letra8', alignment: 'right' },
        { text: formatInteger(item.denomination_value), style: 'letra9', alignment: 'right' },
        { text: 'X', style: 'letra9', alignment: 'center' },
        { text: formatAmount(item.quantity), style: 'letra9', alignment: 'right' },
        showRate ? { text: formatRate(item.exchange_rate || item.current_tasa || item.tasa || 1), style: 'letra9', alignment: 'right' } : {},
        { text: formatAmount(getDenominationTotal(item)), style: 'letra9', alignment: 'right' },
      ])
      : [[{}, { text: '-', style: 'letra9', alignment: 'right' }, {}, { text: '-', style: 'letra9', alignment: 'right' }, showRate ? {} : {}, { text: '-', style: 'letra9', alignment: 'right' }]]),
    [
      {},
      { text: 'TOTAL', bold: true, style: 'letra9', alignment: 'right' },
      {},
      {},
      {},
      { text: formatAmount(sumDenominations(rows)), bold: true, style: 'letra9', alignment: 'right' },
    ],
  ];

  return {
    margin: [0, 0, 0, 5],
    table: {
      widths: [70, 58, 18, '*', showRate ? 58 : 20, 105],
      body,
    },
    layout: compactLineLayout(),
  };
}

function makeCompactTotalLine(label: string, total) {
  return {
    margin: [0, 0, 0, 8],
    table: {
      widths: [160, '*', 105],
      body: [[{}, { text: label, bold: true, style: 'letra9', alignment: 'left' }, { text: formatAmount(total), bold: true, style: 'letra9', alignment: 'right' }]],
    },
    layout: noBorderLayout(),
  };
}

function makeCompactMovementSection(prefix: string, label: string, rows: any[], total) {
  const visibleRows = rows.length ? rows : [{ description: '', amount: 0 }];
  const body = [
    ...visibleRows.map((item, index) => [
      {
        stack: [
          index === 0 ? { text: prefix, bold: true, style: 'letra9' } : { text: '', style: 'letra9' },
          index === 0 ? { text: label, bold: true, style: 'letra9', margin: [0, 4, 0, 0] } : { text: '', style: 'letra9' },
        ],
      },
      { text: item.description || paymentMethodLabel(item.payment_method) || '', style: 'letra9', margin: [0, 2, 0, 0] },
      { text: formatAmount(item.amount), style: 'letra9', alignment: 'right', margin: [0, 2, 0, 0] },
    ]),
    [{}, {}, { text: formatAmount(total), bold: true, style: 'letra9', alignment: 'right', margin: [0, 2, 0, 0] }],
  ];

  return {
    margin: [0, 0, 0, 8],
    table: {
      widths: [92, '*', 105],
      body,
    },
    layout: compactLineLayout(),
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
      body: rows.map(row => [
        { text: row[0], style: 'letra9', bold: true, margin: [0, 2, 0, 2] },
        row[2] ? boxedNumber(row[1]) : { text: formatAmount(row[1]), style: 'letra9', alignment: 'right', margin: [0, 2, 8, 2] },
      ]),
    },
    layout: compactTotalsLayout(),
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

function compactLineLayout() {
  return {
    hLineWidth: (i, node) => (i === node.table.body.length - 1 ? 0.7 : 0),
    vLineWidth: () => 0,
    hLineColor: () => '#555555',
    paddingLeft: () => 2,
    paddingRight: () => 2,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };
}

function compactTotalsLayout() {
  return {
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
    vLineWidth: () => 0,
    hLineColor: () => '#777777',
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

function boxedNumber(value) {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: formatAmount(value), bold: true, style: 'letra9', alignment: 'right', margin: [6, 1, 6, 1] }]],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#333333',
      vLineColor: () => '#333333',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
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
