import React from 'react';
import { ThemeToggle } from './theme';

const statusStyles = {
  pending: 'border-amber-600/35 bg-amber-500/12 text-amber-700 dark:text-amber-200',
  picked_up: 'border-sky-600/35 bg-sky-500/12 text-sky-700 dark:text-sky-200',
  in_transit: 'border-blue-700/35 bg-blue-600/12 text-blue-700 dark:text-blue-200',
  delivered: 'border-emerald-600/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
  lost: 'border-rose-700/35 bg-rose-600/12 text-rose-700 dark:text-rose-200',
  returned: 'border-orange-700/35 bg-orange-600/12 text-orange-700 dark:text-orange-200',
  cancelled: 'border-slate-500/35 bg-slate-500/12 text-slate-700 dark:text-slate-200',
};

const statusLabels = {
  pending: 'Pending',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  lost: 'Lost',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

export function AppShell({ children, className = '', headerActions = null, headerClassName = '' }) {
  return (
    <div className={`app-shell ${className}`.trim()}>
      <header className={`app-header relative z-10 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6 ${headerClassName}`.trim()}>
        <div className="app-header-row mx-auto w-full max-w-[1600px] 2xl:max-w-[92vw]">
          <div className="brand-lockup">
            <img
              src="/routepulse-logo.png"
              alt="RoutePulse"
              className="brand-logo"
            />
          </div>
          <div className="app-header-actions">
            <ThemeToggle />
            {headerActions ? <div className="app-header-secondary-actions">{headerActions}</div> : null}
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PageFrame({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-[1600px] 2xl:max-w-[92vw] px-4 py-6 sm:px-6 lg:px-8 lg:py-10 ${className}`}>{children}</div>;
}

export function GlassCard({ children, className = '' }) {
  return <section className={`surface-card ${className}`.trim()}>{children}</section>;
}

export function SurfacePanel({ children, className = '' }) {
  return <div className={`surface-panel ${className}`.trim()}>{children}</div>;
}

export function SectionKicker({ children }) {
  return <p className="section-kicker">{children}</p>;
}

export function SectionHeading({
  kicker,
  title,
  description,
  action,
  as = 'h2',
  className = '',
  stacked = false,
  titleClassName = '',
  actionClassName = '',
}) {
  const HeadingTag = as;

  return (
    <div className={`${stacked ? 'flex flex-col gap-3' : 'flex flex-col gap-4 md:flex-row md:items-end md:justify-between'} ${className}`.trim()}>
      <div className="max-w-3xl">
        {kicker ? <SectionKicker>{kicker}</SectionKicker> : null}
        <HeadingTag className={`${kicker ? 'mt-3 ' : ''}text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)] sm:text-3xl ${titleClassName}`.trim()}>
          {title}
        </HeadingTag>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">{description}</p> : null}
      </div>
      {action ? <div className={`shrink-0 ${actionClassName}`.trim()}>{action}</div> : null}
    </div>
  );
}

export function PageTitle({ kicker = 'Operations workspace', title, description, action }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <SectionKicker>{kicker}</SectionKicker>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[color:var(--text)] sm:text-5xl">{title}</h1>
        {description ? <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[color:var(--text)]">{label}</span>
        {hint ? <span className="text-xs text-[color:var(--muted)]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

const baseInput = 'field-shell';

export function TextInput({ className = '', ...props }) {
  return <input {...props} className={`${baseInput} ${className}`.trim()} />;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="search-input-icon">
      <circle cx="8.5" cy="8.5" r="4.75" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SearchInput({ className = '', value = '', onClear, ...props }) {
  return (
    <div className="search-input-shell">
      <span className="search-input-icon-shell">
        <SearchIcon />
      </span>
      <input
        {...props}
        value={value}
        className={`${baseInput} search-input-control ${value ? 'search-input-has-value' : ''} ${className}`.trim()}
      />
      {value ? (
        <button
          type="button"
          className="search-input-clear"
          onClick={onClear}
          aria-label="Clear search"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

export function TextArea({ className = '', ...props }) {
  return <textarea {...props} className={`${baseInput} min-h-28 resize-y ${className}`.trim()} />;
}

export function SelectInput({ className = '', ...props }) {
  return <select {...props} className={`${baseInput} ${className}`.trim()} />;
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button {...props} className={`button-primary ${className}`.trim()}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', tone = 'default', ...props }) {
  return (
    <button {...props} className={`button-secondary ${tone === 'danger' ? 'button-secondary-danger' : ''} ${className}`.trim()}>
      {children}
    </button>
  );
}

export function GhostChip({ children, className = '' }) {
  return <span className={`ghost-chip ${className}`.trim()}>{children}</span>;
}

export function FilterPill({ children, active = false, className = '', ...props }) {
  return (
    <button
      {...props}
      type={props.type || 'button'}
      className={`filter-pill ${active ? 'is-active' : ''} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

const toneValueColors = {
  accent: 'text-[#60a5fa]',
  success: 'text-[#34d399]',
  danger: 'text-[#fb7185]',
  neutral: 'text-[#a78bfa]',
  default: 'text-[color:var(--text)]',
};

export function MetricCard({ label, value, detail, tone = 'default' }) {
  const valueColor = toneValueColors[tone] ?? toneValueColors.default;
  return (
    <div className={`metric-card metric-card-${tone}`}>
      <p className="metric-card-label">{label}</p>
      <p className={`metric-card-value ${valueColor}`}>{value}</p>
      {detail ? <p className="metric-card-detail">{detail}</p> : null}
    </div>
  );
}

export function Alert({ children, tone = 'error' }) {
  const toneMap = {
    error: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-100',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100',
    info: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-100',
  };

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneMap[tone] ?? toneMap.error}`}>{children}</div>;
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${statusStyles[status] ?? 'border-white/10 bg-white/5 text-slate-200'}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <GlassCard className="p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-[color:var(--text)]">
        +
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[color:var(--text)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </GlassCard>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-[color:var(--border)]" />;
}
