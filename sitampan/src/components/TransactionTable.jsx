export default function TransactionTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr><th className="px-6 py-3 text-left">ID</th><th className="px-6 py-3 text-left">Items</th><th className="px-6 py-3 text-right">Total</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(t=>(
            <tr key={t.id} className="hover:bg-slate-50"><td className="px-6 py-3 font-mono text-xs">{t.id}</td><td className="px-6 py-3">{t.items}</td><td className="px-6 py-3 text-right font-semibold">{t.total}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
