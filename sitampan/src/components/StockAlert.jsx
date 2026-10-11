import { useState } from 'react'
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ArrowRight, PackagePlus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StockAlert({ items = [], onQuickRestock }) {
  const [expanded, setExpanded] = useState(true)
  const alertItems = items.filter(i => Number(i.stok ?? 0) <= Number(i.minimum ?? 0))

  if (alertItems.length === 0) return null

  const outOfStock = alertItems.filter(i => Number(i.stok ?? 0) === 0)
  const lowStock = alertItems.filter(i => Number(i.stok ?? 0) > 0)

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Peringatan Stok Persediaan
              </h4>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
                {alertItems.length} Produk Perlu Restock
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {outOfStock.length > 0 && (
                <span className="font-semibold text-rose-600 mr-2">
                  • {outOfStock.length} produk habis total
                </span>
              )}
              {lowStock.length > 0 && (
                <span className="font-medium text-amber-700">
                  • {lowStock.length} produk di bawah batas aman
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onQuickRestock && (
            <button
              onClick={() => onQuickRestock()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <PackagePlus size={14} />
              + Catat Restock
            </button>
          )}
          <Link
            to="/mutasi"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 px-2 py-1 rounded-md hover:bg-amber-100/60 transition"
          >
            Buka Mutasi <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-lg transition"
            title={expanded ? 'Sembunyikan detail' : 'Tampilkan detail'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-3 border-t border-amber-200/60">
          {alertItems.map((item) => {
            const isOut = Number(item.stok ?? 0) === 0
            return (
              <div
                key={item.kode || item.id}
                className="bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-amber-300 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isOut ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                    <p className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                      {item.nama}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Min: {item.minimum} {item.satuan || 'pcs'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isOut
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isOut ? 'Habis (0)' : `Sisa ${item.stok}`}
                  </span>
                  {onQuickRestock && (
                    <button
                      onClick={() => onQuickRestock(item)}
                      className="block text-[10px] text-amber-700 hover:text-amber-900 font-semibold mt-1 text-right w-full"
                    >
                      + Tambah
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
