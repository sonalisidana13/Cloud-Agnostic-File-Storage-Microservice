export default function MetricsBar({ metrics }) {
  if (!metrics) {
    return null
  }

  const cards = [
    {
      label: 'Total files',
      value: metrics.totalFiles,
      note: 'Files currently stored in this tenant',
      accent: 'from-cyan-400/20 via-cyan-400/5 to-transparent',
    },
    {
      label: 'Storage used',
      value: metrics.totalBytesHuman,
      note: 'Combined footprint across uploaded assets',
      accent: 'from-fuchsia-400/18 via-fuchsia-400/5 to-transparent',
    },
    {
      label: 'Provider',
      value: metrics.provider,
      note: 'Active backing storage for this workspace',
      accent: 'from-emerald-400/18 via-emerald-400/5 to-transparent',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="panel-surface group relative overflow-hidden p-5 sm:p-6"
        >
          <div
            className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accent} opacity-80 transition duration-300 group-hover:opacity-100`}
          />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{card.note}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
