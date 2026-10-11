import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatRp } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Scissors,
  CreditCard,
  QrCode,
  Printer,
  Package,
  Search,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  X,
  User,
  Phone,
  Tag,
  DollarSign,
  Clock,
  Send,
  Lock,
  Unlock,
  Coins,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { printReceipt, printZReport } from '../utils/printReceipt'
import { getBarbers } from '../utils/barberManager'
import { PRESET_DISCOUNTS, calculateDiscount } from '../utils/discounts'
import {
  getActiveShift,
  openShift,
  closeShift,
  recordSaleInShift,
} from '../utils/shiftManager'
import { addExpense, EXPENSE_CATEGORIES } from '../utils/expenseManager'

export default function POS() {
  const { profile } = useAuth()
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [cart, setCart] = useState([])
  const [payment, setPayment] = useState('Cash')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [q, setQ] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Barbers list & selection
  const barbers = useMemo(() => getBarbers(), [])
  const [selectedBarber, setSelectedBarber] = useState(barbers[0]?.nama || 'Doni')

  // Customer identity
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Discount
  const [selectedDiscountId, setSelectedDiscountId] = useState('none')
  const [customDiscountNominal, setCustomDiscountNominal] = useState(0)

  // Cash calculation
  const [cashTendered, setCashTendered] = useState('')

  // Shift Management State
  const [activeShift, setActiveShift] = useState(() => getActiveShift())
  const [openShiftModal, setOpenShiftModal] = useState(false)
  const [startingCashInput, setStartingCashInput] = useState(200000)
  const [closeShiftModal, setCloseShiftModal] = useState(false)
  const [actualCashInput, setActualCashInput] = useState('')
  const [closingNoteInput, setClosingNoteInput] = useState('')
  const [closedShiftResult, setClosedShiftResult] = useState(null)

  // Quick Expense Modal
  const [expenseModal, setExpenseModal] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0])
  const [expenseNote, setExpenseNote] = useState('')

  async function load() {
    try {
      const [p, s] = await Promise.all([
        supabase.from('products').select('*').order('nama'),
        supabase.from('services').select('*').order('nama'),
      ])
      setProducts(p.data || [])
      setServices(s.data || [])
    } catch (err) {
      console.error('POS load error:', err)
    }
  }

  useEffect(() => {
    load()
    // Refresh active shift
    setActiveShift(getActiveShift())
  }, [])

  // Add Item to Cart
  function add(item, type) {
    const id = item.id || item.kode
    const kapsterToAssign = type === 'service' ? selectedBarber : null
    const cartKey = type === 'service' ? `${id}-${kapsterToAssign}` : id

    const exists = cart.find(c => c.key === cartKey)
    if (type === 'product' && Number(item.stok ?? 0) <= 0) return

    if (exists) {
      if (type === 'product' && exists.qty >= Number(item.stok ?? 0)) return
      setCart(cart.map(c => (c.key === cartKey ? { ...c, qty: c.qty + 1 } : c)))
    } else {
      setCart([
        ...cart,
        {
          key: cartKey,
          id: item.id,
          kode: item.kode,
          nama: item.nama,
          harga: Number(item.harga),
          qty: 1,
          type,
          stok: Number(item.stok ?? 0),
          kapster: kapsterToAssign,
        },
      ])
    }
  }

  function updateItemKapster(cartKey, newKapster) {
    setCart(
      cart.map(c => {
        if (c.key === cartKey) {
          return {
            ...c,
            key: `${c.id}-${newKapster}`,
            kapster: newKapster,
          }
        }
        return c
      })
    )
  }

  function updateQty(key, d) {
    setCart(
      cart
        .map(c => {
          if (c.key !== key) return c
          const n = c.qty + d
          if (n <= 0) return null
          if (c.type === 'product' && n > c.stok) return c
          return { ...c, qty: n }
        })
        .filter(Boolean)
    )
  }

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((s, c) => s + c.harga * c.qty, 0)
  }, [cart])

  const activeDiscountObj = useMemo(() => {
    if (selectedDiscountId === 'custom') {
      return { id: 'custom', type: 'nominal', value: Number(customDiscountNominal) || 0 }
    }
    return PRESET_DISCOUNTS.find(d => d.id === selectedDiscountId) || PRESET_DISCOUNTS[0]
  }, [selectedDiscountId, customDiscountNominal])

  const { discountAmount, finalTotal } = useMemo(() => {
    return calculateDiscount(subtotal, activeDiscountObj)
  }, [subtotal, activeDiscountObj])

  const parsedCashTendered = Number(cashTendered) || 0
  const change = Math.max(0, parsedCashTendered - finalTotal)
  const isCashInsufficient = payment === 'Cash' && parsedCashTendered > 0 && parsedCashTendered < finalTotal

  // Shift Actions
  function handleOpenShift() {
    const s = openShift({
      cashierName: profile?.full_name || 'Kasir',
      startingCash: Number(startingCashInput) || 0,
      note: 'Buka Shift Kasir',
    })
    setActiveShift(s)
    setOpenShiftModal(false)
  }

  function handleCloseShift() {
    if (actualCashInput === '') {
      alert('Harap masukkan jumlah uang tunai fisik aktual di laci kasir!')
      return
    }
    try {
      const closed = closeShift({
        actualCash: Number(actualCashInput) || 0,
        closingNote: closingNoteInput,
      })
      setActiveShift(null)
      setCloseShiftModal(false)
      setClosedShiftResult(closed)
    } catch (err) {
      alert(err.message)
    }
  }

  function handleSaveExpense() {
    const amt = Number(expenseAmount)
    if (!amt || amt <= 0 || !expenseNote.trim()) {
      alert('Harap isi nominal dan keterangan pengeluaran!')
      return
    }
    addExpense({
      kategori: expenseCategory,
      jumlah: amt,
      keterangan: expenseNote,
      dicatatOleh: profile?.full_name || 'Kasir',
      dariKasKasir: true,
    })
    setExpenseModal(false)
    setExpenseAmount('')
    setExpenseNote('')
    setActiveShift(getActiveShift())
    alert('Pengeluaran berhasil dicatat dan dipotong dari laci kasir!')
  }

  // Checkout Execution
  async function checkout() {
    if (!cart.length || loading) return

    // Require active shift before checkout
    if (!activeShift) {
      setOpenShiftModal(true)
      return
    }

    if (payment === 'Cash' && parsedCashTendered < finalTotal) {
      alert(`Uang tunai yang diterima kurang! Total tagihan adalah ${formatRp(finalTotal)}`)
      return
    }

    setLoading(true)
    const trxId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`

    try {
      const now = new Date()
      const tanggal = now.toISOString().slice(0, 10)
      const jam = now.toTimeString().slice(0, 8)

      const pelangganLabel = customerName.trim()
        ? `${customerName.trim()}${customerPhone.trim() ? ` (${customerPhone.trim()})` : ''}`
        : 'Pelanggan Walk-in'

      // 1. Insert transaction into Supabase
      const { error: tErr } = await supabase.from('transactions').insert({
        id: trxId,
        tanggal,
        jam,
        total: finalTotal,
        metode: payment,
        kasir: profile?.full_name || 'Kasir',
        pelanggan: pelangganLabel,
        status: 'Berhasil',
      })
      if (tErr) throw tErr

      // 2. Insert transaction items & update product stocks
      for (const c of cart) {
        // Tag kapster clearly in item name so reports can attribute commissions
        const itemNameWithKapster =
          c.type === 'service' && c.kapster
            ? `${c.nama} [Kapster: ${c.kapster}]`
            : c.nama

        await supabase.from('transaction_items').insert({
          transaction_id: trxId,
          item_id: c.key,
          nama: itemNameWithKapster,
          harga: c.harga,
          qty: c.qty,
          type: c.type,
        })

        if (c.type === 'product') {
          const { data: p } = await supabase
            .from('products')
            .select('stok, id')
            .eq('id', c.id)
            .single()

          if (p) {
            const next = Number(p.stok) - Number(c.qty)
            await supabase.from('products').update({ stok: next }).eq('id', p.id)
            await supabase.from('stock_mutations').insert({
              product_id: p.id,
              produk_nama: c.nama,
              jenis: 'Penjualan',
              jumlah: -c.qty,
              sebelum: p.stok,
              sesudah: next,
              pengguna: profile?.full_name || 'Kasir',
              note: trxId,
            })
          }
        }
      }

      // 3. Record in shift
      const updatedShift = recordSaleInShift({
        paymentMethod: payment,
        amount: finalTotal,
        trxId,
      })
      if (updatedShift) setActiveShift(updatedShift)

      // 4. Set receipt modal
      setReceipt({
        id: trxId,
        items: cart,
        subtotal,
        diskon: discountAmount,
        diskonLabel: activeDiscountObj.label || '',
        total: finalTotal,
        payment,
        cashTendered: payment === 'Cash' ? parsedCashTendered : finalTotal,
        change: payment === 'Cash' ? change : 0,
        date: `${tanggal} ${jam.slice(0, 5)}`,
        pelanggan: pelangganLabel,
        phone: customerPhone.trim(),
        customerName: customerName.trim() || 'Pelanggan',
      })

      // Reset cart and customer details
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setCashTendered('')
      setSelectedDiscountId('none')
      load()
    } catch (e) {
      alert('Gagal menyelesaikan transaksi: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Categories list extracted from products
  const categories = ['Semua', ...new Set(products.map(p => p.kategori).filter(Boolean))]

  // Filtered Services
  const filteredServices = services.filter(s => {
    const qLower = q.toLowerCase()
    return (
      (s.nama || '').toLowerCase().includes(qLower) ||
      (s.deskripsi || '').toLowerCase().includes(qLower)
    )
  })

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const qLower = q.toLowerCase()
    const matchesSearch =
      (p.nama || '').toLowerCase().includes(qLower) ||
      (p.kategori || '').toLowerCase().includes(qLower) ||
      (p.kode || '').toLowerCase().includes(qLower)
    const matchesCat =
      selectedCategory === 'Semua' || p.kategori === selectedCategory
    return matchesSearch && matchesCat
  })

  // Format WhatsApp Message for Digital Receipt
  function sendWhatsAppReceipt(r) {
    const phone = r.phone || prompt('Masukkan nomor WhatsApp pelanggan (contoh: 08123456789):')
    if (!phone) return

    // Clean phone number (replace 08 with 628)
    let cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    }

    const itemsText = r.items
      .map(
        i =>
          `• *${i.nama}* ${i.kapster ? `_(${i.kapster})_` : ''}\n   ${i.qty} x ${formatRp(i.harga)} = ${formatRp(i.harga * i.qty)}`
      )
      .join('\n')

    const message = `💈 *SITAMPAN YK BARBERSHOP* 💈
Pakem, Sleman, D.I. Yogyakarta
Telp: 0812-3456-7890
-----------------------------------
*STRUK PEMBAYARAN DIGITAL*
No. Nota  : *${r.id}*
Waktu     : ${r.date} WIB
Kasir     : ${profile?.full_name || 'Kasir'}
Pelanggan : ${r.pelanggan}
-----------------------------------
*RINCIAN TRANSAKSI:*
${itemsText}
-----------------------------------
Subtotal : ${formatRp(r.subtotal)}
${r.diskon > 0 ? `Diskon   : -${formatRp(r.diskon)}\n` : ''}*TOTAL*    : *${formatRp(r.total)}*
Metode   : ${r.payment.toUpperCase()}
${r.payment === 'Cash' ? `Diterima : ${formatRp(r.cashTendered)}\nKembali  : ${formatRp(r.change)}\n` : ''}Status   : *LUNAS ✅*
-----------------------------------
Terima kasih telah berkunjung ke SITAMPAN YK! 
_Ganteng Maksimal, Percaya Diri Setiap Hari!_ ✨`

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SHIFT & BARBER TOP BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Shift Indicator */}
        <div className="flex items-center gap-3">
          {activeShift ? (
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Shift Aktif: {activeShift.cashierName}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    {activeShift.transactionCount || 0} Trx
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kas Awal: <span className="font-semibold">{formatRp(activeShift.startingCash)}</span> • Kas Masuk: <span className="font-semibold text-emerald-600">{formatRp(activeShift.cashSales || 0)}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Shift Kasir Belum Dibuka
                </p>
                <p className="text-[11px] text-amber-700">
                  Buka shift untuk mulai mencatat transaksi laci kasir
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right: Shift & Petty Cash Actions + Barber quick-selector */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Default Kapster Chip Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Scissors size={14} className="text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">
              Kapster Standby:
            </span>
            <select
              value={selectedBarber}
              onChange={e => setSelectedBarber(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {barbers.map(b => (
                <option key={b.id} value={b.nama}>
                  {b.nama} ({b.title})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          {activeShift ? (
            <>
              <button
                type="button"
                onClick={() => setExpenseModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Catat pengeluaran operasional / kas kasir"
              >
                <Coins size={14} className="text-amber-600" />
                <span className="hidden sm:inline">Beban Kasir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActualCashInput('')
                  setCloseShiftModal(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
              >
                <Lock size={13} />
                <span>Tutup Shift (Z-Report)</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOpenShiftModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            >
              <Unlock size={14} />
              <span>Buka Shift Kasir</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN POS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)] min-h-[580px]">
        {/* LEFT: Catalog List (Services & Retail Products) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 overflow-hidden">
          {/* Search input bar */}
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search size={18} className="text-slate-400 shrink-0 ml-1" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cari layanan cukur atau produk retail (Pomade, Tonic, Powder)..."
              className="flex-1 text-sm bg-transparent border-none focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Scrollable Items Container */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
            {/* SECTION 1: SERVICES */}
            {filteredServices.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Scissors size={15} />
                    </span>
                    Layanan Haircut & Treatment
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {filteredServices.length} Pilihan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredServices.map(s => (
                    <button
                      key={s.id}
                      onClick={() => add(s, 'service')}
                      className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/5 text-left transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-sm">
                            {s.nama}
                          </p>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 ml-1">
                            Layanan
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                          {s.deskripsi || 'Layanan potong rambut & styling'}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-black text-slate-900 text-base">
                          {formatRp(s.harga)}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                          + Pilih ({selectedBarber})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: RETAIL PRODUCTS */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Package size={15} />
                  </span>
                  Produk Retail & Grooming
                </h3>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  <Package size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">
                    Tidak ada produk retail yang cocok
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Coba ubah kata kunci pencarian atau pilih kategori lain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProducts.map(p => {
                    const isOutOfStock = Number(p.stok ?? 0) <= 0
                    const isLow =
                      Number(p.stok ?? 0) > 0 &&
                      Number(p.stok ?? 0) <= Number(p.minimum ?? 0)

                    return (
                      <button
                        key={p.id}
                        onClick={() => add(p, 'product')}
                        disabled={isOutOfStock}
                        className={`group bg-white p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                          isOutOfStock
                            ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50/50'
                            : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/5'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <p
                              className={`font-bold text-xs sm:text-sm line-clamp-1 ${
                                isOutOfStock
                                  ? 'text-slate-400 line-through'
                                  : 'text-slate-900 group-hover:text-emerald-700'
                              }`}
                            >
                              {p.nama}
                            </p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isOutOfStock
                                ? 'Habis'
                                : isLow
                                ? `Sisa ${p.stok}`
                                : `${p.stok} pcs`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            {p.kategori || 'Produk'}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-black text-slate-900 text-sm">
                            {formatRp(p.harga)}
                          </span>
                          {!isOutOfStock ? (
                            <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                              + Tambah
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-500">
                              Habis
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* RIGHT: Cart & Checkout Section */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Cart Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShoppingCart size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Keranjang Transaksi</h3>
                <p className="text-[11px] text-slate-500">
                  {cart.reduce((s, c) => s + c.qty, 0)} item dipilih
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Customer Identity Bar */}
          <div className="px-3.5 py-2.5 bg-slate-50/40 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-slate-200">
              <User size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nama Pelanggan (Walk-in)"
                className="w-full bg-transparent focus:outline-none text-[11px] font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-slate-200">
              <Phone size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="No WhatsApp (08...)"
                className="w-full bg-transparent focus:outline-none text-[11px] font-medium"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <ShoppingCart size={24} />
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  Keranjang masih kosong
                </p>
                <p className="text-[11px] text-slate-400 text-center max-w-[200px]">
                  Pilih layanan cukur atau produk retail di samping.
                </p>
              </div>
            ) : (
              cart.map(c => (
                <div
                  key={c.key}
                  className="flex flex-col gap-1.5 p-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {c.nama}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            c.type === 'service'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {c.type === 'service' ? 'Layanan' : 'Produk'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatRp(c.harga)} x {c.qty} ={' '}
                        <span className="font-bold text-slate-800">
                          {formatRp(c.harga * c.qty)}
                        </span>
                      </p>
                    </div>

                    {/* Qty controller */}
                    <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => updateQty(c.key, -1)}
                        className="w-5 h-5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-5 text-center text-xs font-extrabold text-slate-900">
                        {c.qty}
                      </span>
                      <button
                        onClick={() => updateQty(c.key, 1)}
                        className="w-5 h-5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Kapster Selector per service */}
                  {c.type === 'service' && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Scissors size={11} /> Kapster:
                      </span>
                      <select
                        value={c.kapster || selectedBarber}
                        onChange={e => updateItemKapster(c.key, e.target.value)}
                        className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 focus:outline-none"
                      >
                        {barbers.map(b => (
                          <option key={b.id} value={b.nama}>
                            {b.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing, Discount, Tender & Checkout Actions */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
            {/* Discount selector */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Tag size={12} className="text-amber-500" /> Diskon / Promo:
                </span>
                {discountAmount > 0 && (
                  <span className="font-bold text-rose-600">
                    -{formatRp(discountAmount)}
                  </span>
                )}
              </div>
              <select
                value={selectedDiscountId}
                onChange={e => setSelectedDiscountId(e.target.value)}
                className="w-full text-xs font-semibold bg-white p-2 rounded-xl border border-slate-200 focus:outline-none"
              >
                {PRESET_DISCOUNTS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subtotal & Final Total Display */}
            <div className="space-y-1 pt-1 border-t border-slate-200/60">
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatRp(subtotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Tagihan
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {formatRp(finalTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayment('Cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    payment === 'Cash'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>TUNAI (CASH)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayment('QRIS')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    payment === 'QRIS'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <QrCode size={14} />
                  <span>QRIS</span>
                </button>
              </div>
            </div>

            {/* Cash Calculator (Uang Diterima & Kembalian) */}
            {payment === 'Cash' && (
              <div className="p-2.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <DollarSign size={13} className="text-emerald-600" /> Uang Diterima:
                  </span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    placeholder="Contoh: 100000"
                    className="w-32 text-right font-mono font-bold text-slate-900 text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>

                {/* Quick Cash Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={() => setCashTendered(String(finalTotal))}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  >
                    Pas
                  </button>
                  {[50000, 100000, 150000, 200000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashTendered(String(val))}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                    >
                      {val / 1000}k
                    </button>
                  ))}
                </div>

                {/* Kembalian row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-500">Kembalian:</span>
                  <span
                    className={`font-black ${
                      isCashInsufficient
                        ? 'text-rose-600'
                        : 'text-emerald-600 text-sm'
                    }`}
                  >
                    {isCashInsufficient
                      ? `Kurang ${formatRp(finalTotal - parsedCashTendered)}`
                      : formatRp(change)}
                  </span>
                </div>
              </div>
            )}

            {/* Process Payment Button */}
            <button
              onClick={checkout}
              disabled={loading || !cart.length || isCashInsufficient}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition tracking-wider uppercase flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>
                    {!activeShift
                      ? 'BUKA SHIFT DAHULU'
                      : isCashInsufficient
                      ? 'UANG TUNAI KURANG'
                      : 'PROSES TRANSAKSI'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: BUKA SHIFT KASIR */}
      {openShiftModal && (
        <Modal
          open={openShiftModal}
          onClose={() => setOpenShiftModal(false)}
          title="Buka Shift Kasir Baru"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p className="font-bold">Informasi Pembukaan Shift:</p>
              <p>
                Masukkan jumlah uang kas modal / kembalian awal yang ada di laci kasir sebelum melayani pelanggan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kas Awal di Laci (Modal Kasir):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  value={startingCashInput}
                  onChange={e => setStartingCashInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="200000"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[100000, 150000, 200000, 300000, 500000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStartingCashInput(val)}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  >
                    {val / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setOpenShiftModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleOpenShift}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
              >
                Buka Shift Sekarang
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: TUTUP SHIFT KASIR (REKONSILIASI KAS LACI / Z-REPORT) */}
      {closeShiftModal && activeShift && (
        <Modal
          open={closeShiftModal}
          onClose={() => setCloseShiftModal(false)}
          title="Tutup Shift Kasir (Z-Report)"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir Bertugas:</span>
                <span className="font-bold text-slate-900">{activeShift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kas Awal Modal:</span>
                <span className="font-semibold">{formatRp(activeShift.startingCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Tunai (+):</span>
                <span className="font-semibold text-emerald-600">+{formatRp(activeShift.cashSales || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beban / Pengeluaran (-):</span>
                <span className="font-semibold text-rose-600">-{formatRp(activeShift.cashExpenses || 0)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Kas Seharusnya di Laci:</span>
                <span className="text-indigo-600 text-sm">
                  {formatRp(
                    (activeShift.startingCash || 0) +
                      (activeShift.cashSales || 0) -
                      (activeShift.cashExpenses || 0)
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hitung & Masukkan Uang Fisik Aktual di Laci:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={e => setActualCashInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="Masukkan jumlah uang fisik di laci"
                />
              </div>
              {actualCashInput !== '' && (
                <div className="mt-2 text-xs flex justify-between p-2 rounded-xl bg-slate-100 font-bold">
                  <span>Status Selisih:</span>
                  {Number(actualCashInput) -
                    ((activeShift.startingCash || 0) +
                      (activeShift.cashSales || 0) -
                      (activeShift.cashExpenses || 0)) ===
                  0 ? (
                    <span className="text-emerald-600">PAS / COCOK (Rp 0)</span>
                  ) : Number(actualCashInput) -
                      ((activeShift.startingCash || 0) +
                        (activeShift.cashSales || 0) -
                        (activeShift.cashExpenses || 0)) >
                    0 ? (
                    <span className="text-blue-600">
                      LEBIH +
                      {formatRp(
                        Number(actualCashInput) -
                          ((activeShift.startingCash || 0) +
                            (activeShift.cashSales || 0) -
                            (activeShift.cashExpenses || 0))
                      )}
                    </span>
                  ) : (
                    <span className="text-rose-600">
                      KURANG{' '}
                      {formatRp(
                        Number(actualCashInput) -
                          ((activeShift.startingCash || 0) +
                            (activeShift.cashSales || 0) -
                            (activeShift.cashExpenses || 0))
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Shift (Opsional):
              </label>
              <textarea
                value={closingNoteInput}
                onChange={e => setClosingNoteInput(e.target.value)}
                rows={2}
                placeholder="Misal: Uang fisik pas, shift pagi lancar..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCloseShiftModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                Tutup Shift & Cetak Z-Report
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Z-REPORT SUMMARY (AFTER SHIFT CLOSED) */}
      {closedShiftResult && (
        <Modal
          open={!!closedShiftResult}
          onClose={() => setClosedShiftResult(null)}
          title="Laporan Penutupan Shift (Z-Report)"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <p className="font-bold text-emerald-900 text-sm">
                Shift Berhasil Ditutup & Direkonsiliasi!
              </p>
              <div className="grid grid-cols-2 gap-2 text-emerald-800">
                <div>Total Transaksi: <b>{closedShiftResult.transactionCount}</b></div>
                <div>Total Omset: <b>{formatRp(closedShiftResult.totalSales)}</b></div>
                <div>Kas Fisik: <b>{formatRp(closedShiftResult.actualCash)}</b></div>
                <div>
                  Selisih:{' '}
                  <b>
                    {closedShiftResult.discrepancy === 0
                      ? 'Sesuai (Rp 0)'
                      : formatRp(closedShiftResult.discrepancy)}
                  </b>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  printZReport(closedShiftResult)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl"
              >
                <Printer size={14} /> Cetak Nota Z-Report (Thermal)
              </button>
              <button
                type="button"
                onClick={() => setClosedShiftResult(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Selesai
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: CATAT BEBAN KASIR / PETTY CASH */}
      {expenseModal && (
        <Modal
          open={expenseModal}
          onClose={() => setExpenseModal(false)}
          title="Catat Pengeluaran Kasir (Petty Cash)"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Pengeluaran:
              </label>
              <select
                value={expenseCategory}
                onChange={e => setExpenseCategory(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nominal (Rp):
              </label>
              <input
                type="number"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                placeholder="Contoh: 25000"
                className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan / Keperluan:
              </label>
              <input
                type="text"
                value={expenseNote}
                onChange={e => setExpenseNote(e.target.value)}
                placeholder="Misal: Refill air galon Aqua 1 galon"
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * Pengeluaran ini akan langsung memotong kas fisik laci kasir pada shift yang aktif.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setExpenseModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveExpense}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
              >
                Simpan Pengeluaran
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: STRUK TRANSAKSI SELESAI & WHATSAPP RECEIPT */}
      {receipt && (
        <Modal
          open={!!receipt}
          onClose={() => setReceipt(null)}
          title="Struk Transaksi Selesai"
        >
          <div className="space-y-4">
            <div
              id="printable-receipt"
              className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 font-mono text-xs space-y-3"
            >
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="font-black text-sm tracking-wider">
                  SITAMPAN YK BARBERSHOP
                </h4>
                <p className="text-[11px] text-slate-500">Pakem, Sleman, Yogyakarta</p>
                <p className="text-[11px] text-slate-500">Telp: 0812-3456-7890</p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-bold text-slate-900">{receipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{receipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{profile?.full_name || 'Kasir'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{receipt.pelanggan}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5">
                {receipt.items.map(i => (
                  <div key={i.key} className="flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">
                        {i.nama} {i.kapster ? `(${i.kapster})` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {i.qty} x {formatRp(i.harga)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatRp(i.harga * i.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-dashed border-slate-300 space-y-1 text-xs">
                {receipt.diskon > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>{formatRp(receipt.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Diskon ({receipt.diskonLabel}):</span>
                      <span>-{formatRp(receipt.diskon)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
                  <span>TOTAL:</span>
                  <span>{formatRp(receipt.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Metode:</span>
                  <span className="font-bold">{receipt.payment}</span>
                </div>
                {receipt.payment === 'Cash' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Tunai Diterima:</span>
                      <span>{formatRp(receipt.cashTendered)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Kembalian:</span>
                      <span>{formatRp(receipt.change)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Status:</span>
                  <span>LUNAS</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                <p>Terima kasih atas kunjungan Anda!</p>
                <p>Ganteng Maksimal bersama SITAMPAN YK</p>
              </div>
            </div>

            {/* Receipt Modal Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-end no-print">
              {/* WhatsApp Digital Receipt Button */}
              <button
                type="button"
                onClick={() => sendWhatsAppReceipt(receipt)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Send size={14} /> Kirim Struk WhatsApp
              </button>

              {/* Thermal Print Button */}
              <button
                type="button"
                onClick={() =>
                  printReceipt({
                    id: receipt.id,
                    date: receipt.date,
                    kasir: profile?.full_name || 'Kasir',
                    pelanggan: receipt.pelanggan,
                    items: receipt.items,
                    subtotal: receipt.subtotal,
                    diskon: receipt.diskon,
                    diskonLabel: receipt.diskonLabel,
                    total: receipt.total,
                    payment: receipt.payment,
                    cashTendered: receipt.cashTendered,
                    change: receipt.change,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Printer size={14} /> Cetak Struk (Thermal)
              </button>

              <button
                onClick={() => setReceipt(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
