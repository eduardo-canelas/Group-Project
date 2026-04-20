import React from 'react';
import { EmptyState, GhostChip, MetricCard, SectionHeading, StatusBadge, SurfacePanel } from './ui';

const routeProgressByStatus = {
  pending: 24,
  picked_up: 44,
  in_transit: 68,
  delivered: 92,
  returned: 38,
  lost: 30,
  cancelled: 20,
};

const toneClassNames = {
  critical: 'showcase-priority-critical',
  high: 'showcase-priority-high',
  medium: 'showcase-priority-medium',
  low: 'showcase-priority-low',
};

function toTitleCase(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function WarehouseIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 10.5 12 4l9 6.5v8.5a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-4.5h5V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5V15H3V7.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15 9h3.6a1 1 0 0 1 .8.4l1.6 2.1a1 1 0 0 1 .2.6V15h-6.2V9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6.5 18.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm11 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PacketIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3.5 20 7.5v9L12 20.5 4 16.5v-9L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 12.25 4.2 7.8M12 12.25l7.8-4.45M12 12.25v8.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FreightTruckMarker({ className = '', packageCount = 2 }) {
  return (
    <span className={`freight-truck-marker ${className}`.trim()} aria-hidden="true">
      <span className="freight-truck-packages">
        {Array.from({ length: packageCount }).map((_, index) => (
          <span
            key={index}
            className={`freight-truck-package freight-truck-package-${index + 1}`}
          />
        ))}
      </span>
      <span className="freight-truck-shell">
        <span className="freight-truck-cargo">
          <span className="freight-truck-door freight-truck-door-main" />
          <span className="freight-truck-door freight-truck-door-inner" />
        </span>
        <span className="freight-truck-cab" />
        <span className="freight-truck-wheel freight-truck-wheel-front" />
        <span className="freight-truck-wheel freight-truck-wheel-rear" />
      </span>
    </span>
  );
}

function AdminIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3.5 4.5 6.8v5.1c0 4.1 2.8 7.9 7.5 8.6 4.7-.7 7.5-4.5 7.5-8.6V6.8L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.4 12.1 11 13.7l3.8-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InsightMetricStrip({ items = [], dense = false, className = '' }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className={`insight-metric-strip grid gap-3 min-[360px]:grid-cols-2 sm:gap-4 ${dense ? 'metric-strip-dense xl:grid-cols-2' : 'xl:grid-cols-4'} ${className}`.trim()}>
      {items.map((item) => (
        <MetricCard
          key={`${item.label}-${item.value}`}
          label={item.label}
          value={item.value}
          detail={item.detail}
          tone={item.tone}
        />
      ))}
    </div>
  );
}

export function LogisticsFlowBoard({
  title,
  description,
  className = '',
  lanes = [],
  summary = [],
  emptyTitle = 'No active lanes yet',
  emptyDescription = 'Once packages start moving, this board will visualize who is carrying them and where they are headed.',
}) {
  return (
    <SurfacePanel className={`logistics-flow-board motion-card motion-flow-board ${className}`.trim()}>
      <SectionHeading
        as="h3"
        stacked
        title={title}
        description={description}
        className="logistics-flow-heading"
        titleClassName="logistics-flow-title"
        actionClassName="logistics-flow-summary"
        action={summary.length ? (
          <div className="flex flex-wrap gap-2">
            {summary.map((item) => (
              <GhostChip key={`${item.label}-${item.value}`}>{item.label}: {item.value}</GhostChip>
            ))}
          </div>
        ) : null}
      />

      {lanes.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="logistics-lane-grid mt-6">
          {lanes.map((lane, index) => {
            const truckPosition = `${Math.min(97, Math.max(18, lane.progress ?? 52))}%`;
            const packetPosition = `${Math.min(91, Math.max(14, (lane.progress ?? 52) - 14))}%`;

            return (
              <div
                key={lane.id || `${lane.title}-${index}`}
                className={`logistics-lane-card motion-lane logistics-lane-${lane.emphasis || 'neutral'}`}
                style={{
                  '--truck-position': truckPosition,
                  '--packet-position': packetPosition,
                  '--lane-delay': `${index * 0.75}s`,
                }}
              >
                <div className="logistics-lane-copy">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="logistics-lane-title">{lane.title}</p>
                      {lane.summary ? <span className="text-sm text-[color:var(--muted)]">— {lane.summary}</span> : null}
                    </div>
                    {lane.metric ? <GhostChip>{lane.metric}</GhostChip> : null}
                  </div>

                  <div className="logistics-lane-track">
                    <div className="logistics-stop">
                      <span className="logistics-stop-icon"><AdminIcon className="h-4 w-4" /></span>
                      <span>{lane.startLabel || 'Dispatch'}</span>
                    </div>

                    <div className="logistics-track-line motion-flow-path">
                      <span className="logistics-track-progress" />
                      <span className="logistics-track-truck">
                        <FreightTruckMarker packageCount={2} />
                      </span>
                    </div>

                    <div className="logistics-stop logistics-stop-end">
                      <span className="logistics-stop-icon">
                        {lane.endType === 'warehouse' ? <WarehouseIcon className="h-4 w-4" /> : <PacketIcon className="h-4 w-4" />}
                      </span>
                      <span>{lane.endLabel || 'Drop-off'}</span>
                    </div>
                  </div>

                  <div className="logistics-lane-footer">
                    <p>{lane.truckLabel || 'Truck not assigned'}</p>
                    <p>{lane.stateLabel || 'Route in progress'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SurfacePanel>
  );
}

export function RouteProgressStrip({
  pickup = 'Pickup',
  truckId = 'Truck',
  dropoff = 'Drop-off',
  status = 'pending',
}) {
  const truckProgress = routeProgressByStatus[status] ?? 40;

  return (
    <div
      className={`route-progress-strip route-progress-${status}`}
      style={{ '--route-progress-position': `${truckProgress}%` }}
    >
      <div className="route-progress-line motion-flow-path">
        <span className="route-progress-segment" />
        <span className="route-progress-fill" />
        <span className="route-progress-truck">
          <FreightTruckMarker packageCount={1} className="freight-truck-marker-compact" />
        </span>
      </div>
      <div className="route-progress-points">
        <div className="route-progress-point">
          <span className="route-progress-node"><WarehouseIcon className="h-4 w-4" /></span>
          <p>{pickup}</p>
        </div>
        <div className="route-progress-point route-progress-point-center">
          <span className="route-progress-node"><TruckIcon className="h-4 w-4" /></span>
          <p>{truckId}</p>
        </div>
        <div className="route-progress-point route-progress-point-end">
          <span className="route-progress-node"><PacketIcon className="h-4 w-4" /></span>
          <p>{dropoff}</p>
        </div>
      </div>
    </div>
  );
}

export function CapabilityNarrative({ title, description, items = [], eyebrow = 'Why This Product Wins' }) {
  return (
    <SurfacePanel className="showcase-story-card motion-card">
      <SectionHeading as="h3" kicker={eyebrow} title={title} description={description} />

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div key={item} className="showcase-story-row">
            <span className="showcase-story-dot" />
            <p className="text-sm leading-7 text-[color:var(--text)]">{item}</p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}

export function ExceptionRadar({ items = [], title, description, emptyTitle, emptyDescription }) {
  return (
    <div>
      <SectionHeading
        as="h3"
        title={title}
        description={description}
        action={<GhostChip>{items.length} in radar</GhostChip>}
      />

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <SurfacePanel key={item.id} className="showcase-risk-card motion-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xl font-semibold text-[color:var(--text)]">{item.packageId}</p>
                    <StatusBadge status={item.status} />
                    <span className={`showcase-priority-pill ${toneClassNames[item.severity] || toneClassNames.medium}`}>
                      {toTitleCase(item.severity)}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
                  <div className="grid gap-2 text-sm text-[color:var(--muted)] md:grid-cols-2">
                    <p>Driver: {item.driver}</p>
                    <p>Truck: {item.truckId}</p>
                    <p>Route: {item.route}</p>
                    <p>Facility: {item.currentFacility}</p>
                  </div>
                </div>

                <div className="min-w-[11rem] rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Last update</p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--text)]">{item.lastUpdatedLabel}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">Risk score {item.riskScore}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="showcase-subcard">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Why it is at risk</p>
                  <div className="mt-3 space-y-2">
                    {item.reasons.map((reason) => (
                      <p key={reason} className="text-sm leading-6 text-[color:var(--text)]">{reason}</p>
                    ))}
                  </div>
                </div>
                <div className="showcase-subcard showcase-subcard-accent">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Recommended action</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--text)]">{item.recommendation}</p>
                </div>
              </div>
            </SurfacePanel>
          ))}
        </div>
      )}
    </div>
  );
}

export function CustodyTimeline({ items = [], title, description, compact = false }) {
  return (
    <div>
      <SectionHeading
        as="h3"
        title={title}
        description={description}
        action={<GhostChip>{items.length} latest</GhostChip>}
      />

      <div className={`mt-5 grid gap-3 ${compact ? '' : 'lg:grid-cols-2'}`}>
        {items.map((item, index) => (
          <div key={item.id || `${item.packageId}-${index}`} className="showcase-timeline-row motion-card">
            <div className="showcase-timeline-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-semibold text-[color:var(--text)]">{item.packageId}</p>
                {item.status ? <StatusBadge status={item.status} /> : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text)]">{item.summary}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {item.facility ? `${item.facility}${item.facilityType ? ` · ${item.facilityType}` : ''}` : item.route}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-strong)]">
                {item.eventLabel || item.priority}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {item.happenedAtLabel || item.updatedAtLabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WatchGrid({ title, description, items = [], metricLabel, valueKey, detailKey = 'summary' }) {
  return (
    <div>
      <p className="section-kicker">{title}</p>
      {description ? <p className="mt-2 text-sm text-[color:var(--muted)]">{description}</p> : null}

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <SurfacePanel key={`${title}-${item.route || item.facility || item.driver}`} className="motion-card">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[color:var(--text)]">{item.route || item.facility || item.driver}</p>
                <p className="mt-0.5 truncate text-xs text-[color:var(--muted)]">{item[detailKey]}</p>
              </div>
              <GhostChip className="shrink-0">{item[valueKey]} {metricLabel}</GhostChip>
            </div>
          </SurfacePanel>
        ))}
      </div>
    </div>
  );
}
