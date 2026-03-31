import React from 'react';

const statusStyles = {
  pending: 'border-amber-300/35 bg-amber-300/12 text-amber-100',
  picked_up: 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100',
  in_transit: 'border-indigo-300/35 bg-indigo-300/12 text-indigo-100',
  delivered: 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100',
};

export function AppShell({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-slate-900 text-slate-50 ${className}`}>
      <div className="relative">{children}</div>
    </div>
  );
}

export function PageFrame({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${className}`}>{children}</div>;
}

export function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-[24px] border border-white/12 bg-slate-900/75 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.75)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionKicker({ children }) {
  return <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-amber-200/80">{children}</p>;
}

export function PageTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <SectionKicker>Packet Tracker</SectionKicker>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-50 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300/95 sm:text-base">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = 'amber' }) {
  const accentMap = {
    amber: 'bg-amber-300 text-slate-950',
    sky: 'bg-cyan-300 text-slate-950',
    emerald: 'bg-emerald-300 text-slate-950',
    violet: 'bg-indigo-300 text-slate-950',
  };

  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">{label}</p>
        <span className={`inline-flex h-3 w-3 rounded-full ${accentMap[accent] ?? accentMap.amber}`} />
      </div>
      <div className="mt-5 flex items-end gap-3">
        <span className="text-3xl font-semibold tracking-[-0.04em] text-slate-50">{value}</span>
      </div>
      {hint ? <p className="mt-2 text-sm leading-6 text-slate-300">{hint}</p> : null}
    </GlassCard>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-slate-400">{hint}</span> : null}
    </label>
  );
}

const baseInput =
  'w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/70 focus:ring-4 focus:ring-amber-200/10';

export function TextInput(props) {
  return <input {...props} className={`${baseInput} ${props.className ?? ''}`.trim()} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`${baseInput} min-h-28 resize-y ${props.className ?? ''}`.trim()} />;
}

export function SelectInput(props) {
  return <select {...props} className={`${baseInput} ${props.className ?? ''}`.trim()} />;
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-300/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-200/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function Alert({ children, tone = 'error' }) {
  const toneMap = {
    error: 'border-rose-400/25 bg-rose-400/10 text-rose-100',
    success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
    info: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100',
  };

  return <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${toneMap[tone] ?? toneMap.error}`}>{children}</div>;
}

export function StatusBadge({ status }) {
  const label =
    {
      pending: 'Pending',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
    }[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${statusStyles[status] ?? 'border-white/10 bg-white/5 text-slate-200'
        }`}
    >
      {label}
    </span>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <GlassCard className="p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 text-slate-300">
        <span className="text-lg font-semibold">0</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </GlassCard>
  );
}
