import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = 'indigo',
  subtitle,
  trend,
  trendType = 'up',
  badge,
  onClick,
}) {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-200',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      glow: 'group-hover:border-indigo-300',
      accent: 'from-indigo-500/10 via-transparent to-transparent',
    },
    emerald: {
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      glow: 'group-hover:border-emerald-300',
      accent: 'from-emerald-500/10 via-transparent to-transparent',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-200',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      glow: 'group-hover:border-amber-300',
      accent: 'from-amber-500/10 via-transparent to-transparent',
    },
    rose: {
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-200',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      glow: 'group-hover:border-rose-300',
      accent: 'from-rose-500/10 via-transparent to-transparent',
    },
    violet: {
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-200',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
      glow: 'group-hover:border-violet-300',
      accent: 'from-violet-500/10 via-transparent to-transparent',
    },
    sky: {
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-200',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      glow: 'group-hover:border-sky-300',
      accent: 'from-sky-500/10 via-transparent to-transparent',
    },
  }

  const currentStyle = colorStyles[color] || colorStyles.indigo

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
        currentStyle.glow
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Decorative gradient corner */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${currentStyle.accent} pointer-events-none rounded-bl-full`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {badge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStyle.badgeBg}`}
              >
                {badge}
              </span>
            )}
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
            {value}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                  trendType === 'up'
                    ? 'bg-emerald-50 text-emerald-700'
                    : trendType === 'down'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {trendType === 'up' && <TrendingUp size={12} />}
                {trendType === 'down' && <TrendingDown size={12} />}
                {trendType === 'neutral' && <Minus size={12} />}
                {trend}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-slate-500 truncate">{subtitle}</span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${currentStyle.iconBg}`}
          >
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}
