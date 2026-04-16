/**
 * careReportUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared utilities for care chart report generation.
 *
 * Dependencies (install once):
 *   npm install pdfmake
 */

// ─── Group chart items by category ───────────────────────────────────────────
export const groupChartItemsByCategory = (chartItems, allCareItems = [], categories = []) => {
  if (!chartItems?.length) return [];

  const itemMeta = {};
  allCareItems.forEach(ci => {
    const catObj = categories.find(c => String(c.id) === String(ci.category));
    itemMeta[String(ci.id)] = {
      categoryId:   String(ci.category),
      categoryName: catObj?.name ?? ci.category_name ?? 'Uncategorised',
    };
  });

  const map = {};
  chartItems.forEach(entry => {
    const meta    = itemMeta[String(entry.care_item)];
    const catId   = meta?.categoryId   ?? '__ungrouped__';
    const catName = meta?.categoryName ?? 'Care Items';
    if (!map[catId]) map[catId] = { categoryName: catName, items: [] };
    map[catId].items.push(entry);
  });

  const catOrder = categories.map(c => String(c.id));
  return Object.entries(map)
    .sort(([a], [b]) => {
      if (a === '__ungrouped__') return 1;
      if (b === '__ungrouped__') return -1;
      const ia = catOrder.indexOf(a);
      const ib = catOrder.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map(([, group]) => group);
};

// ─── Build monthly report data structure ─────────────────────────────────────
export const buildMonthlyReportData = ({ charts, allCareItems, categories, year, month }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days        = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const chartByDay = {};
  charts.forEach(c => {
    if (!c.items) return;
    const day = parseInt(c.date.split('-')[2], 10);
    chartByDay[day] = c.items;
  });

  const catOrder = categories.map(c => String(c.id));
  const catMap   = {};

  allCareItems.forEach(item => {
    const catId   = String(item.category);
    const catObj  = categories.find(c => String(c.id) === catId);
    const catName = catObj?.name ?? item.category_name ?? 'Uncategorised';
    if (!catMap[catId]) catMap[catId] = { categoryName: catName, items: [] };
    catMap[catId].items.push(item);
  });

  const grouped = Object.entries(catMap)
    .sort(([a], [b]) => {
      const ia = catOrder.indexOf(a);
      const ib = catOrder.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map(([, { categoryName, items }]) => ({
      categoryName,
      rows: items.map(item => ({
        itemName: item.name,
        days: days.map(d => {
          const dayItems = chartByDay[d];
          if (!dayItems) return '';
          const entry = dayItems.find(ci => String(ci.care_item) === String(item.id));
          if (!entry) return '';
          return entry.value ? 'X' : '';
        }),
      })),
    }))
    .filter(g => g.rows.length > 0);

  return { grouped, days, daysInMonth };
};

// ─── PDF GENERATION via pdfmake ───────────────────────────────────────────────
/**
 * Landscape A4, single table covering all days 1–28/29/30/31.
 *
 * Layout maths (landscape A4):
 *   Page width  = 841.89pt  →  usable = 841 − 20×2 margins = 801pt
 *   Category col = 42pt
 *   Item col     = 78pt
 *   Remaining    = 801 − 120 = 681pt ÷ 31 cols = ~22pt each  ✓
 *
 * All item names are truncated to 18 chars max and set noWrap so rows
 * stay exactly one line tall — nothing overflows or wraps.
 */
export const generateBehaviorReportPDF = async ({
  resident,
  grouped,
  days,
  month,
  year,
  facilityName = '',
  orgName = 'Amazing Brothers Adult Family Home',
}) => {
  const pdfMakeModule  = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  const pdfMake        = pdfMakeModule.default;
  pdfMake.vfs          = pdfFontsModule.default.vfs;

  const monthName    = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
  const residentName = `${resident.first_name} ${resident.last_name}`;
  const branchName   = resident.branch_name ?? resident.branch ?? '';
  const generatedOn  = new Date().toLocaleDateString('en-US');
  const totalRecords = grouped.reduce((s, g) => s + g.rows.length, 0);
  const orgLine      = [orgName, facilityName].filter(Boolean).join(' - ');

  // ── Palette ────────────────────────────────────────────────────────────────
  const COL_HEADER_BG = '#371e6e';
  const CAT_BG        = '#ede8fa';
  const ROW_ODD       = '#f8f7ff';
  const ROW_EVEN      = '#ffffff';
  const X_COLOR       = '#b42828';

  // ── Column widths ─────────────────────────────────────────────────────────
  // Landscape A4 with 15pt margins → usable ≈ 812pt.
  // Category and item cols are fixed; day cols use '*' so pdfmake distributes
  // every remaining point equally — no manual rounding, nothing gets cut off.
  const CAT_W  = 40;   // category name col (fixed)
  const ITEM_W = 75;   // item/log name col (fixed)

  // Truncate long item names so they never wrap — keeps every row 1 line tall
  const trunc = (str, max = 20) =>
    str && str.length > max ? str.slice(0, max - 1) + '…' : (str ?? '');

  // ── Build behavior log table ───────────────────────────────────────────────
  const headerRow = [
    { text: 'Category', style: 'colHeader' },
    { text: 'Log',      style: 'colHeader' },
    ...days.map(d => ({ text: String(d), style: 'colHeaderDay' })),
  ];

  const tableBody = [headerRow];

  grouped.forEach(({ categoryName, rows: itemRows }) => {
    itemRows.forEach((row, rowIdx) => {
      const rowBg = rowIdx % 2 !== 0 ? ROW_ODD : ROW_EVEN;
      const cells = [];

      if (rowIdx === 0) {
        cells.push({
          text:    trunc(categoryName, 16),
          rowSpan: itemRows.length,
          style:   'catCell',
        });
      } else {
        cells.push({});
      }

      cells.push({
        text:      trunc(row.itemName, 22),
        style:     'itemCell',
        fillColor: rowBg,
        noWrap:    false,   // allow wrap only inside fixed-width item col
      });

      row.days.forEach(cell => {
        cells.push(
          cell === 'X'
            ? { text: 'X', style: 'xCell',    fillColor: rowBg }
            : { text: '',  style: 'emptyCell', fillColor: rowBg }
        );
      });

      tableBody.push(cells);
    });
  });

  // ── Page header helper ─────────────────────────────────────────────────────
  const pageHeader = (title) => [
    { text: title,                       style: 'reportTitle'    },
    { text: orgLine,                     style: 'reportSubtitle' },
    { text: `Resident: ${residentName}`, style: 'reportSubtitle' },
    {
      columns: [
        { text: `${monthName} ${year}`, style: 'reportMeta' },
        branchName
          ? { text: `Branch: ${branchName}`, style: 'reportMeta', alignment: 'right' }
          : { text: '' },
      ],
    },
    { text: '', margin: [0, 0, 0, 4] },
  ];

  // ── Description table ──────────────────────────────────────────────────────
  const descHeader = [
    { text: 'Date',                           style: 'colHeader' },
    { text: 'Behavior Description',           style: 'colHeader' },
    { text: 'Trigger',                        style: 'colHeader' },
    { text: 'Care Giver Intervention',        style: 'colHeader' },
    { text: 'Reported Provider And Careteam', style: 'colHeader' },
    { text: 'Outcome',                        style: 'colHeader' },
  ];
  const descRows = Array.from({ length: 14 }, (_, i) => (
    Array(6).fill(null).map(() => ({
      text:      '',
      style:     'descCell',
      fillColor: i % 2 === 0 ? ROW_EVEN : ROW_ODD,
    }))
  ));

  // ── Signature block helper ─────────────────────────────────────────────────
  // Line width in landscape ≈ (801 - 4% gap) / 2 ≈ 390pt
  const sigBlock = (label) => ({
    width: '48%',
    stack: [
      { text: label, style: 'sigLabel' },
      { text: 'Name:',      style: 'sigField' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 370, y2: 0, lineWidth: 0.8, lineColor: '#371e6e' }] },
      { text: ' ', margin: [0, 8, 0, 0] },
      { text: 'Signature:', style: 'sigField' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 370, y2: 0, lineWidth: 0.8, lineColor: '#371e6e' }] },
      { text: ' ', margin: [0, 8, 0, 0] },
      { text: 'Date:',      style: 'sigField' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 370, y2: 0, lineWidth: 0.8, lineColor: '#371e6e' }] },
    ],
  });

  // ── Document definition ────────────────────────────────────────────────────
  const docDefinition = {
    pageSize:        'A4',
    pageOrientation: 'landscape',
    pageMargins:     [15, 30, 15, 30],

    content: [
      // ── Behavior Log page(s) ─────────────────────────────────────────────
      ...pageHeader('BEHAVIOR REPORT'),
      { text: 'Behavior Log', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          dontBreakRows: false,       // allow rows to split across pages if needed
          widths: [CAT_W, ITEM_W, ...Array(days.length).fill('*')],
          body:   tableBody,
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0.8 : 0.4,
          vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 0.8 : 0.4,
          hLineColor: () => '#aaaaaa',
          vLineColor: () => '#aaaaaa',
          fillColor:  (ri) => (ri === 0 ? COL_HEADER_BG : null),
          paddingTop:    () => 2,
          paddingBottom: () => 2,
          paddingLeft:   () => 2,
          paddingRight:  () => 2,
        },
      },

      // ── Behavior Description page ────────────────────────────────────────
      { text: '', pageBreak: 'after' },
      ...pageHeader('BEHAVIOR DESCRIPTION'),
      {
        table: {
          headerRows: 1,
          widths: [40, '*', '*', '*', '*', '*'],
          body:   [descHeader, ...descRows],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0.8 : 0.4,
          vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 0.8 : 0.4,
          hLineColor: () => '#aaaaaa',
          vLineColor: () => '#aaaaaa',
          fillColor:  (ri) => (ri === 0 ? COL_HEADER_BG : null),
          paddingTop:    () => 10,
          paddingBottom: () => 10,
          paddingLeft:   () => 4,
          paddingRight:  () => 4,
        },
      },

      // ── Signatures ────────────────────────────────────────────────────────
      {
        margin: [0, 30, 0, 0],
        columns: [
          sigBlock('Caregiver 1'),
          { width: '4%', text: '' },
          sigBlock('Caregiver 2'),
        ],
      },

      // ── Footer ────────────────────────────────────────────────────────────
      {
        text: `\nGenerated: ${generatedOn} | Records: ${totalRecords}`,
        style: 'footer',
      },
    ],

    styles: {
      reportTitle: {
        fontSize:  16,
        bold:      true,
        alignment: 'center',
        margin:    [0, 0, 0, 3],
        color:     '#1e0e3c',
      },
      reportSubtitle: {
        fontSize:  10,
        bold:      true,
        alignment: 'center',
        margin:    [0, 0, 0, 2],
        color:     '#371e6e',
      },
      reportMeta: {
        fontSize:  9,
        alignment: 'center',
        margin:    [0, 0, 0, 4],
        color:     '#555555',
      },
      sectionHeader: {
        fontSize: 10,
        bold:     true,
        margin:   [0, 0, 0, 3],
        color:    '#1e0e3c',
      },
      // Table header cells
      colHeader: {
        fontSize:  7,
        bold:      true,
        color:     '#ffffff',
        alignment: 'center',
        margin:    [1, 2, 1, 2],
      },
      colHeaderDay: {
        fontSize:  6.5,
        bold:      true,
        color:     '#ffffff',
        alignment: 'center',
        margin:    [0, 2, 0, 2],
      },
      // Category rowspan cell
      catCell: {
        fontSize:  6.5,
        bold:      true,
        alignment: 'center',
        color:     '#371e6e',
        margin:    [1, 2, 1, 2],
      },
      // Item name cell
      itemCell: {
        fontSize:  6.5,
        alignment: 'left',
        color:     '#1e143c',
        margin:    [2, 2, 1, 2],
      },
      // Observed mark
      xCell: {
        fontSize:  7,
        bold:      true,
        alignment: 'center',
        color:     X_COLOR,
        margin:    [0, 2, 0, 2],
      },
      emptyCell: {
        fontSize:  6.5,
        alignment: 'center',
        margin:    [0, 2, 0, 2],
      },
      // Description table
      descCell: {
        fontSize:  8,
        alignment: 'left',
        margin:    [3, 6, 3, 6],
      },
      // Signatures
      sigLabel: {
        fontSize:   9,
        bold:       true,
        color:      '#1e0e3c',
        decoration: 'underline',
        margin:     [0, 0, 0, 10],
      },
      sigField: {
        fontSize: 8,
        color:    '#555555',
        margin:   [0, 0, 0, 3],
      },
      footer: {
        fontSize:  8,
        alignment: 'center',
        color:     '#888888',
        margin:    [0, 6, 0, 0],
      },
    },

    defaultStyle: {
    //   font: 'Helvetica',
    },

    info: {
      title:   `Behavior Report - ${residentName}`,
      subject: `${monthName} ${year} Behavior Report`,
      author:  orgName,
    },
  };

  pdfMake
    .createPdf(docDefinition)
    .download(`BehaviorReport_${resident.last_name}_${monthName}${year}.pdf`);
};

// ─── Analytics helpers ────────────────────────────────────────────────────────

export const computeItemFrequency = (charts, allCareItems) => {
  const counts = {};
  charts.forEach(c => {
    if (!c.items) return;
    c.items.forEach(entry => {
      const id = String(entry.care_item);
      if (!counts[id]) {
        const meta = allCareItems?.find(ci => String(ci.id) === id);
        counts[id] = { id, name: entry.item_name ?? meta?.name ?? id, observed: 0, total: 0 };
      }
      counts[id].total++;
      if (entry.value) counts[id].observed++;
    });
  });
  return Object.values(counts)
    .map(c => ({ ...c, rate: c.total > 0 ? c.observed / c.total : 0 }))
    .sort((a, b) => b.rate - a.rate);
};

export const detectPatterns = (charts, allCareItems) => {
  if (!charts.length) return { high: [], emerging: [], improving: [], notes: [] };
  const frequency    = computeItemFrequency(charts, allCareItems);
  const sorted       = [...charts].sort((a, b) => a.date?.localeCompare(b.date));
  const recentCharts = sorted.slice(-7);
  const recentFreq   = computeItemFrequency(recentCharts, allCareItems);
  const recentMap    = Object.fromEntries(recentFreq.map(f => [f.id, f.rate]));
  const high      = frequency.filter(f => f.rate >= 0.7);
  const emerging  = frequency.filter(f => f.rate >= 0.3 && f.rate < 0.7 && (recentMap[f.id] ?? 0) > f.rate + 0.1);
  const improving = frequency.filter(f => f.rate >= 0.5 && (recentMap[f.id] ?? f.rate) < f.rate - 0.1);
  const notes = [];
  if (high.length)      notes.push(`${high.length} behaviour(s) observed on ≥70% of charted days.`);
  if (emerging.length)  notes.push(`${emerging.length} behaviour(s) increasing in recent entries.`);
  if (improving.length) notes.push(`${improving.length} behaviour(s) showing improvement recently.`);
  return { high, emerging, improving, notes };
};