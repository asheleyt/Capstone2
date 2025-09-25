// Simple client for the local printer-service
// Default URL points to localhost:3001; override with VITE_PRINT_SERVICE_URL
const BASE_URL = import.meta.env.VITE_PRINT_SERVICE_URL || 'http://127.0.0.1:3001';

const THERMAL_RECEIPT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { background: #fff; }
  body {
    margin: 0;
    padding: 3mm 3mm 6mm;
    width: 58mm;
    font-family: "Courier New", ui-monospace, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.25;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  img { max-width: 100%; height: auto; }
  .receipt { width: 100%; }
  .center { text-align: center; }
  .title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .subtitle { font-size: 11px; margin-bottom: 6px; }
  .meta { margin: 6px 0; }
  .meta-row { display: grid; grid-template-columns: 1fr auto; gap: 4px; }
  .divider { border-top: 1px dashed #111; margin: 6px 0; }
  .items { margin: 6px 0; }
  .item-row { display: grid; grid-template-columns: 1fr auto auto; gap: 4px; align-items: baseline; }
  .item-name { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
  .item-qty, .item-total { text-align: right; white-space: nowrap; }
  .totals { margin-top: 6px; }
  .totals .meta-row { font-weight: 600; }
  .totals .total { font-size: 12px; }
  .notes { margin-top: 6px; white-space: pre-wrap; overflow-wrap: anywhere; }
  .footer { margin-top: 10px; text-align: center; }
  .footer-line { margin-top: 2px; }
  @media print {
    @page { size: 58mm auto; /* fixed width, auto height */ margin: 0; }
    /* Hide everything except the receipt during print */
    body { visibility: hidden; margin: 0; padding: 0; }
    .receipt, .receipt * { visibility: visible; }
    .receipt {
      position: absolute;
      left: 0;
      top: 0;
      width: 58mm;
      padding: 4px;
      margin: 0;
      background: #fff;
    }
    /* Avoid unwanted page breaks within logical blocks */
    .item-row, .meta-row, .totals, .notes, .footer { 
      break-inside: avoid; 
      page-break-inside: avoid; 
      -webkit-column-break-inside: avoid; 
    }
    table, tr, td, th { page-break-inside: avoid; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
`;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return 'PHP 0.00';
  return `PHP ${amount.toFixed(2)}`;
}

function buildPrintDocument({ title, styles, content }) {
  return `<!doctype html>` +
    `<html><head><meta charset="utf-8" />` +
    `<title>${escapeHtml(title || 'Receipt')}</title>` +
    `<style>${styles}</style>` +
    `</head><body>${content}</body></html>`;
}

async function openPrintWindow(html) {
  if (typeof window === 'undefined') {
    throw new Error('Browser environment required for window.print');
  }
  const printWindow = window.open('', '_blank', 'width=320,height=640');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please allow popups for this site.');
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  return new Promise((resolve) => {
    let resolved = false;
    const finalize = () => {
      if (resolved) return;
      resolved = true;
      try { printWindow.close(); } catch (err) {
        console.warn('Failed to close print window', err);
      }
      resolve();
    };

    if ('onafterprint' in printWindow) {
      printWindow.onafterprint = finalize;
    } else if (printWindow.addEventListener) {
      printWindow.addEventListener('afterprint', finalize);
    }

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Fallback in case onafterprint does not fire (some browsers)
      setTimeout(finalize, 4000);
    }, 200);
  });
}

export async function printTextBrowser(message, { title = 'Print', footerLines = [] } = {}) {
  const lines = Array.isArray(message) ? message.map(line => String(line ?? '')) : String(message ?? '').split(/\r?\n/);
  const body = `
    <div class="receipt">
      <div class="center title">${escapeHtml(title)}</div>
      <div class="divider"></div>
      ${lines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
      ${footerLines.length ? '<div class="divider"></div>' : ''}
      ${footerLines.map(line => `<div class="footer-line">${escapeHtml(line)}</div>`).join('')}
    </div>
  `;
  const html = buildPrintDocument({ title, styles: THERMAL_RECEIPT_STYLES, content: body });
  await openPrintWindow(html);
}

export async function printReceiptBrowser(options = {}) {
  const {
    businessName = '',
    header = 'Receipt',
    addressLines = [],
    items = [],
    subtotal = null,
    discount = 0,
    total = null,
    paymentMethod = '',
    amountReceived = null,
    changeAmount = null,
    notes = '',
    tableNumber = '',
    orderNumber = '',
    timestamp = new Date(),
    footerLines = ['Thank you!']
  } = options;

  const formattedTimestamp = (() => {
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return Number.isNaN(ts.getTime()) ? '' : ts.toLocaleString();
  })();

  const computedSubtotal = typeof subtotal === 'number'
    ? subtotal
    : items.reduce((sum, item) => {
        const qty = Number(item?.qty ?? 1);
        const price = Number(item?.price ?? 0);
        return sum + (Number.isNaN(qty) || Number.isNaN(price) ? 0 : qty * price);
      }, 0);

  const resolvedTotal = typeof total === 'number' ? total : computedSubtotal - Number(discount || 0);

  const itemsMarkup = items.map(item => {
    const name = escapeHtml(item?.name ?? 'Item');
    const qty = Number(item?.qty ?? 1);
    const unit = Number(item?.price ?? 0);
    const lineTotal = Number.isNaN(qty) || Number.isNaN(unit) ? 0 : qty * unit;
    return `
      <div class="item-row">
        <div class="item-name">${name}</div>
        <div class="item-qty">${qty} x ${formatCurrency(unit)}</div>
        <div class="item-total">${formatCurrency(lineTotal)}</div>
      </div>
    `;
  }).join('');

  const headerMarkup = `
    <div class="center title">${escapeHtml(businessName || header)}</div>
    ${businessName ? `<div class="center subtitle">${escapeHtml(header)}</div>` : ''}
    ${addressLines.length ? `<div class="meta">${addressLines.map(line => `<div class="center">${escapeHtml(line)}</div>`).join('')}</div>` : ''}
  `;

  const metaMarkup = [
    orderNumber ? `<div class="meta-row"><span>Order #</span><span>${escapeHtml(orderNumber)}</span></div>` : '',
    formattedTimestamp ? `<div class="meta-row"><span>Date</span><span>${escapeHtml(formattedTimestamp)}</span></div>` : '',
    tableNumber ? `<div class="meta-row"><span>Table</span><span>${escapeHtml(tableNumber)}</span></div>` : '',
    paymentMethod ? `<div class="meta-row"><span>Payment</span><span>${escapeHtml(paymentMethod)}</span></div>` : '',
    amountReceived !== null ? `<div class="meta-row"><span>Received</span><span>${formatCurrency(amountReceived)}</span></div>` : '',
    changeAmount !== null ? `<div class="meta-row"><span>Change</span><span>${formatCurrency(changeAmount)}</span></div>` : ''
  ].filter(Boolean).join('');

  const totalsMarkup = `
    <div class="totals">
      <div class="meta-row"><span>Subtotal</span><span>${formatCurrency(computedSubtotal)}</span></div>
      ${Number(discount) > 0 ? `<div class="meta-row"><span>Discount</span><span>- ${formatCurrency(discount)}</span></div>` : ''}
      <div class="meta-row total"><span>Total</span><span>${formatCurrency(resolvedTotal)}</span></div>
    </div>
  `;

  const notesMarkup = notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(notes)}</div>` : '';

  const footerMarkup = footerLines.length ? `
    <div class="footer">
      ${footerLines.map(line => `<div class="footer-line">${escapeHtml(line)}</div>`).join('')}
    </div>
  ` : '';

  const body = `
    <div class="receipt">
      ${headerMarkup}
      ${metaMarkup ? `<div class="meta">${metaMarkup}</div>` : ''}
      <div class="divider"></div>
      <div class="items">${itemsMarkup}</div>
      <div class="divider"></div>
      ${totalsMarkup}
      ${notesMarkup}
      ${footerMarkup}
    </div>
  `;

  const html = buildPrintDocument({ title: header, styles: THERMAL_RECEIPT_STYLES, content: body });
  await openPrintWindow(html);
}

export async function printText(message) {
  const res = await fetch(`${BASE_URL}/print/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: String(message ?? '') })
  });
  if (!res.ok) throw new Error(`printText failed: ${res.status}`);
  return res.json();
}

export async function printReceipt({ header = 'Receipt', items = [], total = 0 }) {
  const payload = { header, items, total };
  const res = await fetch(`${BASE_URL}/print/receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`printReceipt failed: ${res.status}`);
  return res.json();
}
