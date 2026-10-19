import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatRp, getStatus } from '../lib/utils'
import {
  Download,
  Filter,
  Scissors,
  DollarSign,
  TrendingUp,
  Receipt,
  Lock,
  Plus,
  Trash2,
  Printer,
  Calendar,
  Layers,
  ShoppingBag,
  Coins,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { getBarbers, fetchBarbers } from '../utils/barberManager'
import {
  getExpenses,
  addExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
} from '../utils/expenseManager'
import { getShiftHistory, fetchShiftHistoryCloud } from '../utils/shiftManager'
import { printZReport } from '../utils/printReceipt'
import { useAuth } from '../hooks/useAuth'

const tabs = [
  'Laba Bersih & PnL',
  'Komisi Kapster',
  'Beban Toko',
  'Riwayat Shift (Z-Report)',
  'Transaksi',
  'Penjualan Produk',
  'Persediaan',
  'Mutasi Stok',
]

export default function Reports() {
  const { profile } = useAuth()
  const [active, setActive] = useState('Laba Bersih & PnL')
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [mutations, setMutations] = useState([])
  const [transactionItems, setTransactionItems] = useState([])
  const [salesSummary, setSalesSummary] = useState([])
  const [loading, setLoading] = useState(true)

  // Expenses & Shifts state
  const [expenses, setExpenses] = useState(() => getExpenses())
  const [shiftHistory, setShiftHistory] = useState(() => getShiftHistory())
  const [expenseModal, setExpenseModal] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0])
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseNote, setExpenseNote] = useState('')

  // Barbers
  const [barbers, setBarbers] = useState(() => getBarbers())

  useEffect(() => {
    async function loadReports() {
      setLoading(true)
      const [tRes, pRes, mRes, iRes, cloudShifts, cloudBarbers] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, transaction_items(*)')
          .order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('kode'),
        supabase
          .from('stock_mutations')
          .select('*')
          .order('tanggal', { ascending: false }),
        supabase.from('transaction_items').select('*'),
        fetchShiftHistoryCloud(),
        fetchBarbers(),
      ])

      if (tRes.data) setTransactions(tRes.data)
      if (pRes.data) setProducts(pRes.data)
      if (mRes.data) setMutations(mRes.data)
      if (cloudShifts && cloudShifts.length > 0) setShiftHistory(cloudShifts)
      if (cloudBarbers && cloudBarbers.length > 0) setBarbers(cloudBarbers)
      if (iRes.data) {
        setTransactionItems(iRes.data)
        const map = {}
        iRes.data.forEach(item => {
          if (!map[item.nama]) {
            map[item.nama] = {
              produk: item.nama,
              kategori: item.type === 'service' ? 'Layanan' : 'Produk',
              terjual: 0,
              pendapatan: 0,
            }
          }
          map[item.nama].terjual += item.qty
          map[item.nama].pendapatan += item.harga * item.qty
        })
        setSalesSummary(Object.values(map))
      }
      setLoading(false)
    }
    loadReports()
  }, [])

  async function refreshLocalData() {
    setExpenses(getExpenses())
    const [s, b] = await Promise.all([fetchShiftHistoryCloud(), fetchBarbers()])
    if (s) setShiftHistory(s)
    if (b) setBarbers(b)
  }

  // 1. Kapster Commission Aggregation
  const barberCommissions = useMemo(() => {
    // Map of barber stats
    const stats = {}
    barbers.forEach(b => {
      stats[b.nama] = {
        barber: b,
        customerCount: 0,
        serviceRevenue: 0,
        commissionRate: b.komisiRate || 40,
        commissionEarned: 0,
        servicesList: [],
      }
    })

    // Fallback barber for unassigned services
    const defaultBarber = barbers[0]?.nama || 'Doni'

    transactionItems.forEach(item => {
      if (item.type === 'service') {
        // Try parsing kapster from "[Kapster: Name]" in item.nama
        let assignedBarber = defaultBarber
        const match = item.nama.match(/\[Kapster:\s*([^\]]+)\]/i)
        if (match && match[1]) {
          assignedBarber = match[1].trim()
        }

        if (!stats[assignedBarber]) {
          stats[assignedBarber] = {
            barber: { nama: assignedBarber, title: 'Barber', komisiRate: 40 },
            customerCount: 0,
            serviceRevenue: 0,
            commissionRate: 40,
            commissionEarned: 0,
            servicesList: [],
          }
        }

        const rev = Number(item.harga || 0) * Number(item.qty || 1)
        stats[assignedBarber].customerCount += Number(item.qty || 1)
        stats[assignedBarber].serviceRevenue += rev
        stats[assignedBarber].commissionEarned += Math.round(
          (rev * stats[assignedBarber].commissionRate) / 100
        )
        stats[assignedBarber].servicesList.push(item)
      }
    })

    return Object.values(stats)
  }, [barbers, transactionItems])

  // Total commissions across all barbers
  const totalBarberCommission = useMemo(() => {
    return barberCommissions.reduce((s, b) => s + b.commissionEarned, 0)
  }, [barberCommissions])

  // 2. Financials & Profit/Loss Calculation
  const totalOmset = useMemo(() => {
    return transactions.reduce((s, t) => s + Number(t.total || 0), 0)
  }, [transactions])

  const totalRetailProductRevenue = useMemo(() => {
    return transactionItems
      .filter(i => i.type === 'product')
      .reduce((s, i) => s + Number(i.harga || 0) * Number(i.qty || 1), 0)
  }, [transactionItems])

  // Estimated HPP of Retail Products (standard retail markup estimate ~60% HPP)
  const estimatedHPP = useMemo(() => {
    return Math.round(totalRetailProductRevenue * 0.6)
  }, [totalRetailProductRevenue])

  const totalExpenses = useMemo(() => {
    return expenses.reduce((s, e) => s + Number(e.jumlah || 0), 0)
  }, [expenses])

  const grossProfit = totalOmset - estimatedHPP
  const netProfit = totalOmset - estimatedHPP - totalBarberCommission - totalExpenses
  const netProfitMargin = totalOmset > 0 ? ((netProfit / totalOmset) * 100).toFixed(1) : 0

  // Handle Add Expense
  function handleAddExpenseSubmit() {
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
    refreshLocalData()
  }

  function handleDeleteExpense(id) {
    if (confirm('Hapus catatan pengeluaran ini?')) {
      deleteExpense(id)
      refreshLocalData()
    }
  }

  if (loading)
    return <div className="p-8 text-center text-slate-500">Memuat laporan...</div>

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                active === t
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 rounded-xl px-3 py-1.5 text-slate-500 bg-slate-50">
            <Filter size={13} /> <span>Supabase Live Data</span>
          </div>
        </div>
      </div>

      {/* TAB 1: LABA BERSIH & PNL */}
      {active === 'Laba Bersih & PnL' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Omset Penjualan
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {formatRp(totalOmset)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Dari {transactions.length} transaksi
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimasi HPP Produk Retail
              </span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                -{formatRp(estimatedHPP)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Modal barang retail terjual
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Bagi Hasil Komisi Kapster
              </span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                -{formatRp(totalBarberCommission)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hak komisi cukur barber
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl shadow-lg shadow-emerald-600/20 text-white">
              <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
                Laba Bersih Riil (Net Profit)
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {formatRp(netProfit)}
              </p>
              <p className="text-xs text-emerald-100 mt-1 font-semibold">
                Margin Bersih: {netProfitMargin}%
              </p>
            </div>
          </div>

          {/* Detailed P&L Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Laporan Laba Rugi Komprehensif (P&L Barbershop)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhitungan omset, modal produk, pembagian komisi kapster, dan beban toko
                </p>
              </div>
            </div>

            <div className="p-6 max-w-3xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>1. PENDAPATAN OPERASIONAL (OMSET)</span>
                  <span className="font-mono text-emerald-600">{formatRp(totalOmset)}</span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>• Omset Layanan Cukur & Treatment</span>
                    <span className="font-mono font-medium">
                      {formatRp(totalOmset - totalRetailProductRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Penjualan Produk Retail Grooming</span>
                    <span className="font-mono font-medium">{formatRp(totalRetailProductRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>2. BEBAN POKOK PENJUALAN (HPP)</span>
                  <span className="font-mono text-rose-600">-{formatRp(estimatedHPP)}</span>
                </div>
                <div className="pl-4 text-xs text-slate-600 flex justify-between">
                  <span>• Modal Pembelian Pomade, Tonic & Retail</span>
                  <span className="font-mono font-medium">-{formatRp(estimatedHPP)}</span>
                </div>
              </div>

              <div className="pt-2 pb-2 bg-slate-50 p-3 rounded-xl flex justify-between items-center font-bold text-sm text-slate-900">
                <span>LABA KOTOR (GROSS MARGIN):</span>
                <span className="font-mono text-indigo-700">{formatRp(grossProfit)}</span>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>3. BEBAN OPERASIONAL & BAGI HASIL</span>
                  <span className="font-mono text-rose-600">
                    -{formatRp(totalBarberCommission + totalExpenses)}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>• Bagi Hasil Komisi Barber / Kapster</span>
                    <span className="font-mono font-medium">
                      -{formatRp(totalBarberCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Beban Operasional / Kasir Toko</span>
                    <span className="font-mono font-medium">-{formatRp(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center font-black text-base text-slate-900 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                <div>
                  <span>LABA BERSIH RIIL (NET PROFIT)</span>
                  <p className="text-[11px] font-normal text-slate-500">
                    Kas bersih yang dapat ditarik owner / modal ekspansi
                  </p>
                </div>
                <span className="font-mono text-xl text-emerald-700">
                  {formatRp(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KOMISI KAPSTER */}
      {active === 'Komisi Kapster' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Scissors size={18} className="text-indigo-600" />
                  Rekap Bagi Hasil & Komisi Barber (Kapster)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhitungan otomatis berdasarkan layanan cukur yang diselesaikan oleh masing-masing kapster
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                Total Komisi Barber: {formatRp(totalBarberCommission)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Nama Barber</th>
                    <th className="px-6 py-3.5 text-left">Peran / Jabatan</th>
                    <th className="px-6 py-3.5 text-center">Kepala / Cust Dilayani</th>
                    <th className="px-6 py-3.5 text-right">Omset Layanan</th>
                    <th className="px-6 py-3.5 text-center">Rate Bagi Hasil</th>
                    <th className="px-6 py-3.5 text-right">Komisi Hak Barber</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {barberCommissions.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {b.barber.nama[0]}
                        </div>
                        {b.barber.nama}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {b.barber.title || 'Barber'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full font-bold text-xs">
                          {b.customerCount} orang
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-800">
                        {formatRp(b.serviceRevenue)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-indigo-600">
                        {b.commissionRate}%
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 text-sm">
                        {formatRp(b.commissionEarned)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BEBAN TOKO */}
      {active === 'Beban Toko' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Coins size={18} className="text-amber-600" />
                  Beban Operasional & Pengeluaran Toko (Petty Cash)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar pengeluaran harian kasir dan operasional barbershop
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">
                  Total Pengeluaran: <b className="text-rose-600">{formatRp(totalExpenses)}</b>
                </span>
                <button
                  onClick={() => setExpenseModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Plus size={14} /> Catat Pengeluaran
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Waktu</th>
                    <th className="px-6 py-3.5 text-left">Kategori</th>
                    <th className="px-6 py-3.5 text-left">Keterangan</th>
                    <th className="px-6 py-3.5 text-left">Sumber Kas</th>
                    <th className="px-6 py-3.5 text-left">Dicatat Oleh</th>
                    <th className="px-6 py-3.5 text-right">Nominal</th>
                    <th className="px-6 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                        Belum ada catatan pengeluaran operasional.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 text-xs text-slate-500">
                          {new Date(e.tanggal).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            {e.kategori}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-800">{e.keterangan}</td>
                        <td className="px-6 py-3.5 text-xs">
                          {e.dariKasKasir ? (
                            <span className="text-emerald-700 font-semibold">Kas Laci Kasir</span>
                          ) : (
                            <span className="text-slate-500">Rekening Owner</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">{e.dicatatOleh}</td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-rose-600">
                          -{formatRp(e.jumlah)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT SHIFT (Z-REPORT) */}
      {active === 'Riwayat Shift (Z-Report)' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Lock size={18} className="text-rose-600" />
                  Riwayat Tutup Shift & Rekonsiliasi Kasir (Laporan Z)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar laporan penutupan shift, kesesuaian fisik kas di laci, dan selisih
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">ID Shift</th>
                    <th className="px-6 py-3.5 text-left">Kasir</th>
                    <th className="px-6 py-3.5 text-left">Waktu Buka / Tutup</th>
                    <th className="px-6 py-3.5 text-right">Kas Awal</th>
                    <th className="px-6 py-3.5 text-right">Penjualan Tunai</th>
                    <th className="px-6 py-3.5 text-right">Kas Seharusnya</th>
                    <th className="px-6 py-3.5 text-right">Kas Fisik Aktual</th>
                    <th className="px-6 py-3.5 text-center">Selisih</th>
                    <th className="px-6 py-3.5 text-center">Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {shiftHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-slate-400 text-xs">
                        Belum ada shift yang ditutup.
                      </td>
                    </tr>
                  ) : (
                    shiftHistory.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900">
                          {s.id}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {s.cashierName}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-500">
                          <div>Buka: {new Date(s.openedAt).toLocaleTimeString('id-ID')}</div>
                          <div>Tutup: {new Date(s.closedAt).toLocaleTimeString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-slate-700">
                          {formatRp(s.startingCash)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-emerald-600 font-bold">
                          +{formatRp(s.cashSales || 0)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-indigo-700">
                          {formatRp(s.expectedCash)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                          {formatRp(s.actualCash)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {s.discrepancy === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PAS (Rp 0)
                            </span>
                          ) : s.discrepancy > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              Lebih +{formatRp(s.discrepancy)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Kurang {formatRp(s.discrepancy)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => printZReport(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                          >
                            <Printer size={12} /> Z-Report
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TRANSAKSI */}
      {active === 'Transaksi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">Laporan Riwayat Transaksi</h3>
            <span className="text-xs text-slate-500 font-semibold">
              Total {transactions.length} Transaksi
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 text-left">ID Nota</th>
                  <th className="px-6 py-3.5 text-left">Waktu</th>
                  <th className="px-6 py-3.5 text-left">Pelanggan</th>
                  <th className="px-6 py-3.5 text-left">Rincian Item</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                  <th className="px-6 py-3.5 text-center">Metode</th>
                  <th className="px-6 py-3.5 text-left">Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900">
                      {t.id}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {t.tanggal} {t.jam ? String(t.jam).slice(0, 5) : ''}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-slate-800">
                      {t.pelanggan || 'Walk-in'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                      {(t.transaction_items || []).map(i => `${i.nama} x${i.qty}`).join(', ')}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                      {formatRp(t.total)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {String(t.metode || '').toLowerCase().includes('split') || (Number(t.split_cash) > 0 && Number(t.split_qris) > 0) ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-800">
                            SPLIT
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                            T: {formatRp(t.split_cash || 0)} | Q: {formatRp(t.split_qris || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                          {t.metode || 'Cash'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">{t.kasir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PENJUALAN PRODUK & LAYANAN */}
      {active === 'Penjualan Produk' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base">
              Laporan Penjualan Produk & Layanan Terlaris
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 text-left">Produk / Layanan</th>
                  <th className="px-6 py-3.5 text-left">Kategori</th>
                  <th className="px-6 py-3.5 text-center">Qty Terjual</th>
                  <th className="px-6 py-3.5 text-right">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salesSummary.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{r.produk}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                          r.kategori === 'Layanan'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {r.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-800">
                      {r.terjual}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                      {formatRp(r.pendapatan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: PERSEDIAAN */}
      {active === 'Persediaan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base">Laporan Persediaan Produk Retail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 text-left">Kode</th>
                  <th className="px-6 py-3.5 text-left">Nama Produk</th>
                  <th className="px-6 py-3.5 text-center">Stok</th>
                  <th className="px-6 py-3.5 text-center">Batas Minimum</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map(p => {
                  const s = getStatus(p.stok, p.minimum)
                  return (
                    <tr key={p.kode} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900">
                        {p.kode}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">{p.nama}</td>
                      <td className="px-6 py-3.5 text-center font-black text-slate-900">
                        {p.stok}
                      </td>
                      <td className="px-6 py-3.5 text-center text-slate-500">{p.minimum}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            s === 'Habis'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : s === 'Stok Menipis'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {s}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: MUTASI STOK */}
      {active === 'Mutasi Stok' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base">Laporan Log Mutasi Stok</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 text-left">Waktu</th>
                  <th className="px-6 py-3.5 text-left">Nama Produk</th>
                  <th className="px-6 py-3.5 text-left">Jenis</th>
                  <th className="px-6 py-3.5 text-center">Jumlah</th>
                  <th className="px-6 py-3.5 text-right">Perubahan Stok</th>
                  <th className="px-6 py-3.5 text-left">Pengguna</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mutations.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {m.tanggal ? new Date(m.tanggal).toLocaleString('id-ID') : ''}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {m.produk_nama || m.produk}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                          m.jenis === 'Penjualan'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {m.jenis}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-3.5 text-center font-bold ${
                        m.jumlah > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {m.jumlah > 0 ? `+${m.jumlah}` : m.jumlah}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-700">
                      {m.sebelum} → {m.sesudah}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">{m.pengguna}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: INPUT EXPENSE */}
      {expenseModal && (
        <Modal
          open={expenseModal}
          onClose={() => setExpenseModal(false)}
          title="Catat Pengeluaran Baru"
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
                placeholder="Contoh: 30000"
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
                placeholder="Misal: Beli 2 pak silet & alkohol pembersih"
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

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
                onClick={handleAddExpenseSubmit}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
