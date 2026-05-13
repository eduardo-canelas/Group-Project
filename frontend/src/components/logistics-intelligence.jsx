import React, { useMemo, useState } from 'react';
import {
  Field,
  GhostChip,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  SurfacePanel,
  TextInput,
} from './ui';
import {
  formatStatusLabel,
  getAccuracyLabel,
  getAccuracyTone,
  getDriverGPSUrl,
  getPackageAccuracy,
  getRouteMapUrl,
  getScanTypeLabel,
} from '../lib/packageInsights';
import api from '../lib/api';

const scanTypeOptions = [
  { value: 'intake', label: 'Intake' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'loaded', label: 'Loaded' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'exception', label: 'Exception' },
  { value: 'audit', label: 'Audit' },
];

const scanStatusOptions = [
  { value: '', label: 'Use scan default' },
  { value: 'pending', label: 'Pending' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'lost', label: 'Lost' },
  { value: 'cancelled', label: 'Cancelled' },
];

function getRouteProgress(pkg) {
  const progress = {
    pending: 18,
    picked_up: 38,
    in_transit: 64,
    delivered: 94,
    returned: 48,
    lost: 52,
    cancelled: 22,
  };

  return progress[pkg?.status] ?? 32;
}

export function AccuracyCommandPanel({ packages = [], title = 'Delivery accuracy' }) {
  const intelligence = useMemo(() => {
    const total = packages.length || 1;
    const scores = packages.map(getPackageAccuracy);
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1));
    const missingScans = packages.filter((pkg) => !pkg.scanCount && !pkg.lastScanType).length;
    const atRisk = packages.filter((pkg) => getPackageAccuracy(pkg) < 68 || ['lost', 'returned', 'cancelled'].includes(pkg.status)).length;
    const completeRoutes = packages.filter((pkg) => pkg.pickupLocation && pkg.dropoffLocation && pkg.truckId).length;

    return {
      average,
      missingScans,
      atRisk,
      routeCoverage: Math.round((completeRoutes / total) * 100),
    };
  }, [packages]);

  const metrics = [
    {
      label: 'Accuracy score',
      value: `${intelligence.average}%`,
      detail: getAccuracyLabel(intelligence.average),
      tone: getAccuracyTone(intelligence.average),
    },
    {
      label: 'Route coverage',
      value: `${intelligence.routeCoverage}%`,
      detail: 'Pickup, truck, and drop-off captured.',
      tone: 'accent',
    },
    {
      label: 'Needs scan',
      value: intelligence.missingScans,
      detail: 'Packages without scan history.',
      tone: intelligence.missingScans > 0 ? 'danger' : 'success',
    },
    {
      label: 'At risk',
      value: intelligence.atRisk,
      detail: 'Low accuracy or exception status.',
      tone: intelligence.atRisk > 0 ? 'danger' : 'success',
    },
  ];

  return (
    <div className="accuracy-command-panel">
      <div className="accuracy-command-heading">
        <div>
          <p className="section-kicker">Accuracy Intelligence</p>
          <h3>{title}</h3>
          <p>Shows how much the business can trust its package records before customers start asking where items are.</p>
        </div>
        <GhostChip>{packages.length} records</GhostChip>
      </div>

      <div className="accuracy-metric-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className={`accuracy-metric-card accuracy-metric-card-${metric.tone}`}>
            <p className="accuracy-metric-label">{metric.label}</p>
            <p className="accuracy-metric-value">{metric.value}</p>
            <p className="accuracy-metric-detail">{metric.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

const routeNextStatuses = {
  pending: ['picked_up'],
  picked_up: ['in_transit', 'delivered'],
  in_transit: ['delivered'],
};

function shortLoc(str) {
  if (!str) return null;
  return str.split(',')[0].trim().slice(0, 16);
}

export function RouteMapPanel({
  packages = [],
  title = 'Route map',
  description = 'Tap Navigate to get turn-by-turn directions.',
  onUpdateStatus,
  loadingId,
}) {
  const featuredPackages = packages.slice(0, 5);
  const activePackage = featuredPackages[0];
  const routeProgress = getRouteProgress(activePackage);
  const origin = shortLoc(activePackage?.pickupLocation) || 'Pickup';
  const dest = shortLoc(activePackage?.dropoffLocation) || 'Drop-off';

  return (
    <div className="route-map-panel">

      <div className="route-map-heading">
        <div>
          <p className="section-kicker">Map View</p>
          <h3>{title}</h3>
        </div>
        {activePackage ? (
          <a className="map-open-link" href={getRouteMapUrl(activePackage)} target="_blank" rel="noreferrer">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M10 1.5C6.41 1.5 3.5 4.41 3.5 8c0 5.25 6.5 10.5 6.5 10.5S16.5 13.25 16.5 8c0-3.59-2.91-6.5-6.5-6.5zm0 8.75a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5z" fill="currentColor"/>
            </svg>
            Open in Maps
          </a>
        ) : null}
      </div>

      <div className="route-map-canvas" aria-label="Route map preview">
        <div className="map-terrain" aria-hidden="true" />
        <div className="map-grid-lines" aria-hidden="true" />
        <div className="map-road-band" aria-hidden="true" />
        <div className="map-route-track" aria-hidden="true">
          <div className="map-route-fill" style={{ width: `${routeProgress}%` }} />
        </div>

        <div className="map-marker map-marker-origin" aria-hidden="true">
          <div className="map-marker-bubble">
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="4" fill="white"/></svg>
          </div>
          <span className="map-marker-label">{origin}</span>
        </div>

        <div className="map-marker map-marker-dest" aria-hidden="true">
          <div className="map-marker-bubble">
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M5 10l3.5 3.5L15 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="map-marker-label">{dest}</span>
        </div>

        <div
          className="map-truck-pin"
          style={{ '--map-route-progress': `${routeProgress}%` }}
          aria-hidden="true"
        >
          <div className="map-truck-ring" />
          <div className="map-truck-dot">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
              <circle cx="5.5" cy="18.5" r="2" fill="white"/>
              <circle cx="18.5" cy="18.5" r="2" fill="white"/>
            </svg>
          </div>
        </div>

        {activePackage?.lastScanLat && activePackage?.lastScanLng ? (
          <div
            className="map-gps-pin"
            style={{ '--map-route-progress': `${routeProgress}%` }}
            aria-hidden="true"
          >
            <div className="map-gps-pulse" />
            <div className="map-gps-dot" />
          </div>
        ) : null}

        {featuredPackages.length > 0 && (
          <div className="map-route-badge" aria-hidden="true">
            {featuredPackages.length} {featuredPackages.length === 1 ? 'route' : 'routes'} active
          </div>
        )}
      </div>

      <div className="route-card-list">
        {featuredPackages.length ? featuredPackages.map((pkg) => {
          const gpsUrl = getDriverGPSUrl(pkg);
          const nextStatuses = routeNextStatuses[pkg.status] || [];
          const isLoading = loadingId === pkg._id;
          const pkgOrigin = shortLoc(pkg.pickupLocation) || 'Origin';
          const pkgDest = shortLoc(pkg.dropoffLocation) || 'Destination';

          return (
            <div key={pkg._id} className={`route-card route-card-status-${pkg.status}`}>
              <div className="route-card-header">
                <div className="route-card-meta">
                  <p className="route-card-name">{pkg.description || pkg.packageId || 'Package'}</p>
                  <span className="route-card-route">
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                      <circle cx="4" cy="10" r="2.5" fill="currentColor"/>
                      <line x1="6.5" y1="10" x2="13.5" y2="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/>
                      <circle cx="16" cy="10" r="2.5" fill="currentColor"/>
                    </svg>
                    {pkgOrigin} → {pkgDest}
                  </span>
                </div>
                <span className={`route-card-badge route-card-badge-${pkg.status}`}>
                  {formatStatusLabel(pkg.status)}
                </span>
              </div>

              <div className="route-card-actions">
                <a
                  className="route-card-navigate-btn"
                  href={getRouteMapUrl(pkg)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 1.5C6.41 1.5 3.5 4.41 3.5 8c0 5.25 6.5 10.5 6.5 10.5S16.5 13.25 16.5 8c0-3.59-2.91-6.5-6.5-6.5zm0 8.75a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5z" fill="currentColor"/>
                  </svg>
                  Navigate
                </a>
                {nextStatuses.length > 0 && onUpdateStatus ? nextStatuses.map((status) => (
                  <button
                    key={status}
                    className="route-card-update-btn"
                    onClick={() => onUpdateStatus(pkg._id, status)}
                    disabled={isLoading}
                    type="button"
                  >
                    {isLoading ? (
                      <span className="route-card-loading-dot" />
                    ) : null}
                    {isLoading ? 'Saving' : `Mark ${formatStatusLabel(status)}`}
                  </button>
                )) : null}
              </div>

              {gpsUrl ? (
                <a className="route-card-gps-link" href={gpsUrl} target="_blank" rel="noreferrer">
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 2C6.686 2 4 4.686 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
                  </svg>
                  View driver location
                </a>
              ) : null}
            </div>
          );
        }) : (
          <div className="route-map-empty">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 1.5C6.41 1.5 3.5 4.41 3.5 8c0 5.25 6.5 10.5 6.5 10.5S16.5 13.25 16.5 8c0-3.59-2.91-6.5-6.5-6.5zm0 8.75a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5z" fill="currentColor"/>
            </svg>
            <p>No active routes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScanConsole({ title = 'Scan package', description = 'Scan by package ID or scan code.', defaultLocation = '', onScan }) {
  const [scanForm, setScanForm] = useState({
    code: '',
    scanType: 'audit',
    status: '',
    currentLocation: defaultLocation,
    note: '',
  });
  const [scanState, setScanState] = useState({ busy: false, message: '', tone: 'info' });
  const [proofPhoto, setProofPhoto] = useState(null);
  const photoInputRef = React.useRef(null);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      setProofPhoto(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = url;
  };

  const updateField = (field) => (event) => {
    setScanForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const captureGPS = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, maximumAge: 30000 },
      );
    });

  const submitScan = async (event) => {
    event.preventDefault();
    setScanState({ busy: true, message: 'Saving…', tone: 'info' });

    const coords = await captureGPS();
    const payload = coords ? { ...scanForm, lat: coords.lat, lng: coords.lng } : { ...scanForm };
    if (proofPhoto) payload.proofPhoto = proofPhoto;

    try {
      const scanned = await onScan?.(payload);
      setScanState({
        busy: false,
        tone: 'success',
        message: `${getScanTypeLabel(scanForm.scanType)} saved for ${scanned?.packageId || scanForm.code}.${coords ? ' Location sent to dispatch.' : ''}`,
      });
      setProofPhoto(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      setScanForm((current) => ({
        ...current,
        code: '',
        note: '',
      }));
    } catch (error) {
      setScanState({
        busy: false,
        tone: 'error',
        message: error?.response?.data?.error || error?.response?.data?.message || 'Could not save scan.',
      });
    }
  };

  return (
    <form className="scan-console" onSubmit={submitScan}>
      <div className="scan-console-heading">
        <div>
          <p className="section-kicker">Scanner</p>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <GhostChip>Database scan</GhostChip>
      </div>

      <div className="scan-console-grid">
        <Field label="Package ID or scan code">
          <TextInput value={scanForm.code} onChange={updateField('code')} placeholder="PKG-2048 or SCAN-2048" required autoComplete="off" />
        </Field>
        <Field label="Scan type">
          <SelectInput value={scanForm.scanType} onChange={updateField('scanType')}>
            {scanTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Status override">
          <SelectInput value={scanForm.status} onChange={updateField('status')}>
            {scanStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Current stop">
          <TextInput value={scanForm.currentLocation} onChange={updateField('currentLocation')} placeholder="Back room, truck, customer door…" autoComplete="off" />
        </Field>
      </div>

      <Field label="Driver note">
        <TextInput value={scanForm.note} onChange={updateField('note')} placeholder="Photo verified, customer signed, shelf count corrected…" autoComplete="off" />
      </Field>

      <div className="scan-photo-zone">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          id="scan-photo-input"
          className="scan-photo-input"
          onChange={handlePhotoChange}
        />
        {proofPhoto ? (
          <div className="scan-photo-preview-wrap">
            <img src={proofPhoto} alt="Proof photo preview" className="scan-photo-preview" />
            <button
              type="button"
              className="scan-photo-remove"
              onClick={() => { setProofPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ''; }}
              aria-label="Remove photo"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <label htmlFor="scan-photo-input" className="scan-photo-trigger">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="1" y="4" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6.5 4l1.2-2h4.6l1.2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Attach proof photo</span>
          </label>
        )}
      </div>

      <p className="scan-geo-indicator">
        <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M10 2C6.686 2 4 4.686 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor" />
        </svg>
        {navigator.geolocation ? 'GPS location sent to dispatch with each scan' : 'GPS not available — location will not be included'}
      </p>

      {scanState.message ? (
        <p className={`scan-console-message scan-console-message-${scanState.tone}`}>{scanState.message}</p>
      ) : null}

      <div className="scan-console-actions">
        <PrimaryButton type="submit" disabled={scanState.busy}>
          {scanState.busy ? 'Saving…' : 'Send Scan to Dispatch'}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => { setScanForm({ code: '', scanType: 'audit', status: '', currentLocation: defaultLocation, note: '' }); setProofPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ''; }}>
          Clear
        </SecondaryButton>
      </div>
    </form>
  );
}

const journeyEventLabels = {
  received: 'Received at facility',
  loaded: 'Loaded onto truck',
  unloaded: 'Unloaded at stop',
  assigned: 'Assigned to driver',
  inTransit: 'In transit',
};

const journeyTimestampFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatJourneyTime(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : journeyTimestampFormatter.format(date);
}

export function PackageJourneyTimeline({ packageId }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (events !== null) {
      setOpen(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/packages/${packageId}/history`);
      setEvents(response.data.events || []);
      setOpen(true);
    } catch {
      setError('Could not load journey history.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
    } else {
      void load();
    }
  };

  return (
    <div className="package-journey">
      <button type="button" className="package-journey-toggle" onClick={toggle} disabled={loading}>
        <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {loading ? 'Loading journey…' : open ? 'Hide facility journey' : 'View facility journey'}
      </button>

      {error ? <p className="scan-console-message scan-console-message-error">{error}</p> : null}

      {open && events ? (
        <div className="package-journey-timeline">
          {events.length === 0 ? (
            <p className="journey-empty">No handling events recorded yet.</p>
          ) : (
            events.map((event, index) => (
              <div key={String(event.id)} className={`journey-event ${index === events.length - 1 ? 'journey-event-last' : ''}`.trim()}>
                <div className="journey-event-rail">
                  <span className={`journey-event-dot journey-event-dot-${event.eventType}`} />
                  {index < events.length - 1 ? <span className="journey-event-line" /> : null}
                </div>
                <div className="journey-event-body">
                  <p className="journey-event-facility">{event.facilityName}</p>
                  <p className="journey-event-type">{journeyEventLabels[event.eventType] || event.eventType} &mdash; {event.statusSnapshot.replace(/_/g, ' ')}</p>
                  {event.notes ? <p className="journey-event-notes">{event.notes}</p> : null}
                  <p className="journey-event-time">{formatJourneyTime(event.happenedAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
