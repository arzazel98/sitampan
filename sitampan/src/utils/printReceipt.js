import { formatRp } from '../lib/utils'

export function printReceipt({
  id = 'TRX-0000',
  date = new Date().toLocaleString('id-ID'),
  kasir = 'Kasir',
  pelanggan = 'Walk-in',
  items = [],
  subtotal = 0,
  diskon = 0,
  diskonLabel = '',
  total = 0,
  payment = 'Cash',
  cashTendered = 0,
  change = 0,
  storeName = 'SITAMPAN YK BARBERSHOP',
  storeAddress = 'Pakem, Sleman, D.I. Yogyakarta',
  storePhone = '0812-3456-7890',
}) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const finalSubtotal = subtotal > 0 ? subtotal : total + diskon

  const itemsHtml = items
    .map(item => {
      const itemTotal = Number(item.harga || 0) * Number(item.qty || 1)
      const kapsterText = item.kapster ? `<div style="font-size: 10px; color: #555;">Kapster: ${item.kapster}</div>` : ''
      return `
        <div style="margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${item.nama}</span>
            <span>${formatRp(itemTotal)}</span>
          </div>
          ${kapsterText}
          <div style="font-size: 11px; color: #444;">
            ${item.qty} x ${formatRp(item.harga)}
          </div>
        </div>
      `
    })
    .join('')

  const isCash = payment.toLowerCase() === 'cash' || payment.toLowerCase() === 'tunai'

  const receiptContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Struk - ${id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 4px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .border-b {
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .border-t {
            border-top: 1px dashed #000;
            padding-top: 8px;
            margin-top: 8px;
          }
          .flex {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .header-title {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            margin-bottom: 2px;
          }
          .header-sub {
            font-size: 10px;
            color: #333;
          }
          .meta-info {
            font-size: 11px;
            margin-bottom: 8px;
          }
          .total-box {
            font-size: 13px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .footer {
            margin-top: 12px;
            font-size: 10px;
            text-align: center;
            color: #333;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="text-center border-b">
          <div class="header-title">${storeName}</div>
          <div class="header-sub">${storeAddress}</div>
          <div class="header-sub">Telp: ${storePhone}</div>
        </div>

        <div class="meta-info border-b">
          <div class="flex">
            <span>No. Nota:</span>
            <span class="bold">${id}</span>
          </div>
          <div class="flex">
            <span>Waktu:</span>
            <span>${date}</span>
          </div>
          <div class="flex">
            <span>Kasir:</span>
            <span>${kasir}</span>
          </div>
          <div class="flex">
            <span>Pelanggan:</span>
            <span>${pelanggan}</span>
          </div>
        </div>

        <div class="items border-b">
          ${itemsHtml}
        </div>

        <div>
          ${
            diskon > 0
              ? `
              <div class="flex" style="font-size: 11px;">
                <span>Subtotal:</span>
                <span>${formatRp(finalSubtotal)}</span>
              </div>
              <div class="flex" style="font-size: 11px; color: #222;">
                <span>Diskon ${diskonLabel ? `(${diskonLabel})` : ''}:</span>
                <span>-${formatRp(diskon)}</span>
              </div>
            `
              : ''
          }
          <div class="total-box">
            <span>TOTAL:</span>
            <span>${formatRp(total)}</span>
          </div>
          <div class="flex" style="font-size: 11px;">
            <span>Metode Bayar:</span>
            <span class="bold">${payment.toUpperCase()}</span>
          </div>
          ${
            isCash && cashTendered > 0
              ? `
              <div class="flex" style="font-size: 11px;">
                <span>Tunai Diterima:</span>
                <span>${formatRp(cashTendered)}</span>
              </div>
              <div class="flex" style="font-size: 11px; font-weight: bold;">
                <span>Kembalian:</span>
                <span>${formatRp(change)}</span>
              </div>
            `
              : ''
          }
          <div class="flex" style="font-size: 11px; margin-top: 4px;">
            <span>Status:</span>
            <span class="bold">LUNAS</span>
          </div>
        </div>

        <div class="footer border-t">
          <div>Terima kasih atas kunjungan Anda!</div>
          <div>Ganteng Maksimal bersama SITAMPAN YK</div>
        </div>
      </body>
    </html>
  `

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(receiptContent)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch (err) {
      console.error('Print iframe error:', err)
      window.print()
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }
  }, 250)
}

// Print Z-Report (Laporan Tutup Shift Kasir)
export function printZReport({
  shiftId = 'SHIFT-0000',
  cashierName = 'Kasir',
  openedAt = '',
  closedAt = '',
  startingCash = 0,
  cashSales = 0,
  qrisSales = 0,
  totalSales = 0,
  transactionCount = 0,
  cashExpenses = 0,
  expectedCash = 0,
  actualCash = 0,
  discrepancy = 0,
  note = '',
  storeName = 'SITAMPAN YK BARBERSHOP',
}) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const discrepancyStatus =
    discrepancy === 0
      ? 'SESUAI (PAS)'
      : discrepancy > 0
      ? `LEBIH +${formatRp(discrepancy)}`
      : `KURANG ${formatRp(discrepancy)}`

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Z-Report - ${shiftId}</title>
        <style>
          @page { size: 80mm auto; margin: 5mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 4px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .border-b { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
          .border-t { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
          .flex { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .title { font-size: 13px; font-weight: 900; }
          .sub { font-size: 10px; color: #444; }
        </style>
      </head>
      <body>
        <div class="text-center border-b">
          <div class="title">${storeName}</div>
          <div class="bold">LAPORAN TUTUP SHIFT (Z-REPORT)</div>
          <div class="sub">Realisasi & Rekonsiliasi Kas Laci</div>
        </div>

        <div class="border-b">
          <div class="flex"><span>ID Shift:</span><span class="bold">${shiftId}</span></div>
          <div class="flex"><span>Kasir:</span><span class="bold">${cashierName}</span></div>
          <div class="flex"><span>Buka:</span><span>${new Date(openedAt).toLocaleString('id-ID')}</span></div>
          <div class="flex"><span>Tutup:</span><span>${new Date(closedAt).toLocaleString('id-ID')}</span></div>
          <div class="flex"><span>Total Trx:</span><span class="bold">${transactionCount} transaksi</span></div>
        </div>

        <div class="border-b">
          <div class="bold" style="margin-bottom: 4px;">PENJUALAN:</div>
          <div class="flex"><span>Penjualan Tunai:</span><span>${formatRp(cashSales)}</span></div>
          <div class="flex"><span>Penjualan QRIS:</span><span>${formatRp(qrisSales)}</span></div>
          <div class="flex bold"><span>TOTAL OMSET:</span><span>${formatRp(totalSales)}</span></div>
        </div>

        <div class="border-b">
          <div class="bold" style="margin-bottom: 4px;">REKONSILIASI KAS LACI:</div>
          <div class="flex"><span>(+) Kas Awal / Modal:</span><span>${formatRp(startingCash)}</span></div>
          <div class="flex"><span>(+) Kas Masuk (Tunai):</span><span>${formatRp(cashSales)}</span></div>
          <div class="flex"><span>(-) Beban / Kas Keluar:</span><span>-${formatRp(cashExpenses)}</span></div>
          <div class="flex bold" style="padding-top: 4px; border-top: 1px dotted #ccc;">
            <span>(=) Kas Seharusnya:</span><span>${formatRp(expectedCash)}</span>
          </div>
          <div class="flex bold"><span>(x) Kas Fisik Aktual:</span><span>${formatRp(actualCash)}</span></div>
          <div class="flex bold" style="font-size: 12px; margin-top: 3px;">
            <span>SELISIH:</span>
            <span>${discrepancyStatus}</span>
          </div>
        </div>

        ${
          note
            ? `
          <div class="border-b">
            <span>Catatan Kasir:</span>
            <div style="font-style: italic; font-size: 10px;">${note}</div>
          </div>
        `
            : ''
        }

        <div class="text-center border-t" style="font-size: 9px; margin-top: 10px;">
          <p>Tanda Tangan Kasir: _________________</p>
          <br/>
          <p>Diperiksa oleh: _____________________</p>
        </div>
      </body>
    </html>
  `

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(content)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch (err) {
      console.error('Print Z-Report error:', err)
      window.print()
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }
  }, 250)
}
