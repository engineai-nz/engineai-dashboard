import React from 'react';

interface TelemetryCardProps {
  label: string;
  value: string | number;
  trend?: string;
  status?: 'nominal' | 'warning' | 'critical';
}

/**
 * Small KPI tile used throughout the cockpit. Brand recipe:
 * - rounded-[1.4rem] card on card-bg
 * - gold top accent bar (same pattern as marketing service cards)
 * - mono label in text-secondary, large light-weight value in white
 * - status-tinted trend pill: gold (nominal), amber (warning),
 *   signal-error (critical)
 */
const TelemetryCard: React.FC<TelemetryCardProps> = ({ label, value, trend, status = 'nominal' }) => {
  const trendTone =
    status === 'critical'
      ? 'border-signal-error/30 bg-signal-error/[0.08] text-signal-error'
      : status === 'warning'
        ? 'border-amber-400/30 bg-amber-400/[0.06] text-amber-300'
        : 'border-gold/30 bg-gold/[0.06] text-gold';

  return (
    <div className="group relative overflow-hidden rounded-[1.4rem] border border-white/[0.07] bg-[rgba(12,12,12,0.84)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.32)] transition duration-500 hover:-translate-y-1 hover:border-gold/25">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />

      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] uppercase leading-[1.1] tracking-[0.22em] text-[#888]">
          {label}
        </p>
        {trend && (
          <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${trendTone}`}>
            {trend}
          </span>
        )}
      </div>

      <p className="mt-6 truncate text-[2rem] font-light leading-none tracking-[-0.04em] text-white">
        {value}
      </p>

      {/* Gold gradient divider — same pattern as IntelligenceCard */}
      <div className="mt-6 h-px w-full bg-gradient-to-r from-gold/30 via-white/[0.06] to-transparent transition duration-500 group-hover:from-gold/60" />
    </div>
  );
};

export default TelemetryCard;
