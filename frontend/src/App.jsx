
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, Droplets, ExternalLink, Gauge, LayoutDashboard, MapPin, Menu, RefreshCw, Search, ShieldCheck, Truck, Waves, X, Zap, List, Cloud, Globe, Server, ArrowRight, GitBranch } from 'lucide-react';

import {
  getHealth,
  getIncidents,
  getSummary,
  getTankers,
  getTelemetry,
  runScenario,
  updateIncident,
} from './api/client.js';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incident management', icon: AlertTriangle },
  { id: 'tankers', label: 'Tanker monitoring', icon: Truck },
  { id: 'simulation', label: 'Simulation lab', icon: Zap },
  { id: 'telemetry', label: 'Telemetry events', icon: List },
];
const fmt = (v) => Number(v ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 });
const dateFmt = (v) => v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const statusLabel = (s) => ({ OPEN: 'Open', ACKNOWLEDGED: 'Acknowledged', MAINTENANCE_REQUIRED: 'Maintenance required', RESOLVED: 'Resolved', FALSE_ALARM: 'False alarm' }[s] || s || 'Unknown');

function BrandMark() { return <div className="brand-mark"><Waves size={22} strokeWidth={2.4} /></div>; }
function MetricCard({ label, value, unit, icon: Icon, tone, note }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={18}/></span></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-note"><span className="note-dot" />{note}</div></article>;
}
function Badge({ children, kind = 'neutral' }) { return <span className={`badge ${kind}`}>{children}</span>; }
function MapViewport({ points }) {
  const map = useMap();
  const signature = points.map(point => `${point.lat},${point.lng}`).join('|');

  useEffect(() => {
    if (!points.length) return;
      const unique = points.map(point => [
    point.displayLat ?? point.lat,
    point.displayLng ?? point.lng,
  ]);
    if (unique.length > 1) {
      map.fitBounds(unique, { padding: [28, 28], maxZoom: 14, animate: true });
    } else {
      map.setView(unique[0], 14, { animate: true });
    }
  }, [map, signature]);

  return null;
}

function incidentStatusColor(status) {
  return ({
    OPEN: '#d97736',
    ACKNOWLEDGED: '#2878b5',
    MAINTENANCE_REQUIRED: '#c83f49',
    RESOLVED: '#16856b',
    FALSE_ALARM: '#7b8794',
  })[String(status || '').toUpperCase()] || '#7b8794';
}

function LocationMap({ incidents, tankers, onInspect }) {
  const points = useMemo(() => {
    const validIncidents = incidents.filter(i => {
      const lat = i.latitude;
      const lng = i.longitude;

      return (
        lat !== null &&
        lat !== undefined &&
        lng !== null &&
        lng !== undefined &&
        Number.isFinite(Number(lat)) &&
        Number.isFinite(Number(lng)) &&
        Number(lat) >= -90 &&
        Number(lat) <= 90 &&
        Number(lng) >= -180 &&
        Number(lng) <= 180
      );
    });

    // Keep every incident as a separate point.
    const sorted = [...validIncidents].sort(
      (a, b) =>
        new Date(b.detectedAt || b.createdAt || 0) -
        new Date(a.detectedAt || a.createdAt || 0)
    );

    // Group only to calculate visual offsets for overlapping markers.
    const groups = new Map();

    sorted.forEach(incident => {
      const lat = Number(incident.latitude);
      const lng = Number(incident.longitude);
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(incident);
    });

    const result = [];

    groups.forEach((group, key) => {
      group.forEach((incident, index) => {
        const lat = Number(incident.latitude);
        const lng = Number(incident.longitude);
        const count = group.length;

        // Spread overlapping markers in a small visual circle.
        // The original incident coordinates remain unchanged.
        const radius = count > 1 ? 0.00035 : 0;
        const angle = (2 * Math.PI * index) / count;

        const displayLat = lat + radius * Math.cos(angle);
        const displayLng =
          lng +
          (radius * Math.sin(angle)) /
            Math.max(Math.cos((lat * Math.PI) / 180), 0.2);

        result.push({
          key: String(incident.id),
          incident,
          lat,
          lng,
          displayLat,
          displayLng,
          color: incident.status === 'MAINTENANCE_REQUIRED'
            ? '#c83f49'
            : incident.status === 'OPEN'
              ? '#d97736'
              : incident.status === 'ACKNOWLEDGED'
                ? '#2878b5'
                : incident.status === 'RESOLVED'
                  ? '#16856b'
                  : '#7b8794',
        });
      });
    });

    return result;
  }, [incidents]);

  const center = points.length
    ? [points[0].lat, points[0].lng]
    : [28.6139, 77.2090];

  return (
    <div className="map-frame">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map(point => {
          const incident = point.incident;

          return (
            <CircleMarker
              key={point.key}
              center={[point.displayLat, point.displayLng]}
              radius={9}
              pathOptions={{
                color: '#fff',
                weight: 3,
                fillColor: point.color,
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong>Incident #{incident.id}</strong>

                  <p style={{ margin: '5px 0' }}>
                    {incident.tankerId} ·{' '}
                    {fmt(incident.estimatedLossLiters)} L estimated
                  </p>

                  <div
                    style={{
                      color: incidentStatusColor(incident.status),
                      fontWeight: 700,
                    }}
                  >
                    {statusLabel(incident.status)}
                  </div>

                  <small>{dateFmt(incident.detectedAt)}</small>

                  <div style={{ marginTop: 5, fontSize: 11, color: '#607080' }}>
                    Recorded coordinates: {point.lat.toFixed(6)},{' '}
                    {point.lng.toFixed(6)}
                  </div>

                  {String(incident.dataSource || '')
                    .toLowerCase()
                    .includes('simulat') && (
                    <div>
                      <em>Simulated location</em>
                    </div>
                  )}

                  {onInspect && (
                    <div>
                      <button
                        type="button"
                        onClick={() => onInspect(incident)}
                        style={{
                          marginTop: 6,
                          padding: '4px 8px',
                          border: '1px solid #d5e0e8',
                          borderRadius: 5,
                          background: '#fff',
                          color: '#087f82',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Open investigation
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <MapViewport points={points} />
      </MapContainer>

      <div className="map-legend">
        <span><i className="legend-dot amber" />Open</span>
        <span><i className="legend-dot blue" />Acknowledged</span>
        <span>
          <i className="legend-dot" style={{ background: '#c83f49' }} />
          Maintenance
        </span>
        <span>
          <i className="legend-dot" style={{ background: '#16856b' }} />
          Resolved
        </span>
      </div>

      {!points.length && (
        <div className="map-empty">
          <MapPin size={18} />
          <span>
            No incident coordinates available yet. Map centers on Delhi for
            orientation only.
          </span>
        </div>
      )}
    </div>
  );
}
function IncidentTable({ incidents, onInspect, onStatus, compact = false }) {
  if (!incidents.length) return <div className="empty-state"><ShieldCheck size={25}/><strong>No incidents to display</strong><span>When the backend detects a possible unexplained loss, it will appear here.</span></div>;
  return <div className="table-scroll"><table><thead><tr><th>Incident</th><th>Tanker</th><th>Estimated loss</th><th>Severity</th><th>Status</th><th>Detected</th><th></th></tr></thead><tbody>{incidents.slice(0, compact ? 5 : 100).map(i => <tr key={i.id}><td><button className="link-button" onClick={() => onInspect(i)}>#{i.id}</button></td><td><span className="tanker-id">{i.tankerId}</span>{String(i.dataSource || '').toLowerCase().includes('simulat') && <small className="subline">Simulated</small>}</td><td className="loss-cell">{fmt(i.estimatedLossLiters)} L</td><td><Badge kind={String(i.severity || '').toLowerCase()}>{i.severity || 'Unspecified'}</Badge></td><td><Badge kind={String(i.status || '').toLowerCase()}>{statusLabel(i.status)}</Badge></td><td className="date-cell">{dateFmt(i.detectedAt)}</td><td><button className="icon-button" aria-label={`Inspect incident ${i.id}`} onClick={() => onInspect(i)}><ExternalLink size={15}/></button></td></tr>)}</tbody></table></div>;
}
function App() {
  const [page, setPage] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [tankers, setTankers] = useState([]);
  const [connection, setConnection] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [running, setRunning] = useState('');
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editNote, setEditNote] = useState('');
  const [savingIncident, setSavingIncident] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [telemetry, setTelemetry] = useState([]);
  const [telemetryTankerId, setTelemetryTankerId] = useState('');
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState('');
  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const [s, inc, tan] = await Promise.all([getSummary(), getIncidents(), getTankers()]);
      setSummary(s); setIncidents(Array.isArray(inc) ? inc : []); setTankers(Array.isArray(tan) ? tan : []);
      setConnection('online'); setLastUpdated(new Date());
    } catch (e) { setConnection('offline'); setError(e.message || 'Unable to load backend data.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { refresh(true); }, [refresh]);

  const filteredIncidents = useMemo(() => incidents.filter(i => (filter === 'ALL' || i.status === filter) && `${i.id} ${i.tankerId} ${i.reason || ''} ${i.status || ''}`.toLowerCase().includes(search.toLowerCase())), [incidents, filter, search]);
  const currentNav = NAV.find(n => n.id === page) || NAV[0];

  async function simulate(scenario) {
    setRunning(scenario); setNotice(null); setError('');
    try {
      const result = await runScenario(scenario);
      await refresh(false);
      const found = (result?.events || []).filter(e => e.anomalyDetected).length;
      setNotice({ kind: 'success', title: `${scenario[0].toUpperCase()}${scenario.slice(1)} scenario completed`, message: `${result?.events?.length ?? 0} telemetry events processed · ${found} anomaly/anomalies reported. Values are simulated.` });
      if (scenario === 'leak' && result?.events?.some(e => e.incidentId)) setPage('incidents');
    } catch (e) { setNotice({ kind: 'error', title: 'Simulation failed', message: e.message }); }
    finally { setRunning(''); }
  }

  function openIncident(incident) {
    setSelected(incident);
    setEditStatus(incident.status || 'OPEN');
    setEditNote(incident.driverNote || '');
    setNotice(null);
  }
  async function loadTelemetry(tankerId) {
    if (!tankerId) {
      setTelemetry([]);
      return;
    }

    setTelemetryLoading(true);
    setTelemetryError('');

    try {
      const records = await getTelemetry(tankerId);
      setTelemetry(Array.isArray(records) ? records : []);
    } catch (error) {
      setTelemetryError(error.message || 'Could not load telemetry.');
    } finally {
      setTelemetryLoading(false);
    }
  }
  async function saveIncidentUpdate() {
    if (!selected || savingIncident) return;

    setSavingIncident(true);
    setNotice(null);

    try {
      const updated = await updateIncident(
        selected.id,
        editStatus,
        editNote.trim()
      );

      // Close the dialog immediately after a successful save.
      setSelected(null);

      // Update the incident in the local state.
      setIncidents(prev =>
        prev.map(i => i.id === updated.id ? updated : i)
      );

      // Show success notification.
      setNotice({
        kind: 'success',
        title: 'Investigation updated',
        message: `Incident #${updated.id} is now ${statusLabel(updated.status).toLowerCase()}.`
      });

      // Refresh the dashboard after closing the dialog.
      refresh(false).catch(console.error);

    } catch (e) {
      setNotice({
        kind: 'error',
        title: 'Update failed',
        message: e.message || 'Could not save the incident update.'
      });
    } finally {
      setSavingIncident(false);
    }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="brand"><BrandMark/><div><strong>TankerGuard</strong><span>WATER OPERATIONS</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); setMobileNav(false); }}><Icon size={18}/><span>{label}</span>{id === 'incidents' && (summary?.openIncidents > 0) && <b className="nav-count">{summary.openIncidents}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-status"><span className={`status-pulse ${connection}`}/><div><strong>{connection === 'online' ? 'API connected' : connection === 'offline' ? 'API unavailable' : 'Checking API'}</strong><small>Cloud API</small></div></div><div className="sidebar-foot"><div className="mini-brand">TG</div><div><strong>Operations workspace</strong><small>Prototype environment</small></div><ChevronDown size={15}/></div></div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumbs">Workspace <span>/</span> <strong>{currentNav.label}</strong></div></div><div className="topbar-actions"><div className={`connection-pill ${connection}`}><span className="status-pulse"/>{connection === 'online' ? 'Backend connected' : connection === 'offline' ? 'Backend offline' : 'Connecting'}</div><button type="button" className="button secondary architecture-trigger" onClick={() => setArchitectureOpen(true)} title="View deployed AWS architecture"><Cloud size={16}/><span>AWS architecture</span></button><div className="avatar" title="Operations workspace">OP</div></div></header>
      <div className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow">TANKER OPERATIONS / DELHI DEMO</div><h1>{page === 'overview' ? 'Operations overview' : page === 'incidents' ? 'Incident management' : page === 'tankers' ? 'Tanker monitoring' : 'Simulation lab'}</h1><p>{page === 'overview' ? 'Monitor possible water loss and keep response teams informed.' : page === 'incidents' ? 'Review suspicious volume drops and manage follow-up.' : page === 'tankers' ? 'Review registered tankers and available incident locations.' : 'Run controlled scenarios against the connected Spring Boot backend.'}</p></div><button className="button secondary refresh-btn" onClick={() => refresh(false)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin' : ''}/>{refreshing ? 'Refreshing' : 'Refresh data'}</button></div>
        <div className="data-banner"><span className="banner-icon"><CircleHelp size={17}/></span><div><strong>Prototype data notice</strong><span>{summary?.dataNote || 'This prototype can use simulated telemetry. Do not interpret demo measurements as real DJB data.'}</span></div><Badge kind="simulated">SIMULATION-AWARE</Badge></div>
        {error && <div className="error-banner"><AlertTriangle size={18}/><div><strong>Could not load live API data</strong><span>{error}</span></div><button className="button secondary small" onClick={() => refresh(false)}>Retry</button></div>}
        {notice && <div className={`notice-banner ${notice.kind}`}><span>{notice.kind === 'success' ? <Check size={18}/> : <AlertTriangle size={18}/>}</span><div><strong>{notice.title}</strong><small>{notice.message}</small></div><button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16}/></button></div>}

        {page === 'overview' && <>
          <section className="metric-grid">
            <MetricCard label="Registered tankers" value={summary ? fmt(summary.registeredTankers) : '—'} unit="units" icon={Truck} tone="blue" note="Persisted tanker records"/>
            <MetricCard label="Telemetry events" value={summary ? fmt(summary.telemetryEvents) : '—'} unit="events" icon={Activity} tone="teal" note="Received by the backend"/>
            <MetricCard label="Open incidents" value={summary ? fmt(summary.openIncidents) : '—'} unit="active" icon={AlertTriangle} tone="amber" note="Awaiting a final resolution"/>
            <MetricCard label="Estimated water loss" value={summary ? fmt(summary.estimatedWaterLossLiters) : '—'} unit="litres" icon={Droplets} tone="red" note="Excludes incidents marked false alarm"/>
          </section>
          <section className="content-grid overview-grid"><article className="panel incidents-panel"><div className="panel-heading"><div><h2>Recent incidents</h2><p>Latest possible-loss events recorded by the backend</p></div><button className="text-action" onClick={() => setPage('incidents')}>View all <ArrowUpRight size={15}/></button></div><IncidentTable incidents={[...incidents].sort((a,b) => new Date(b.detectedAt)-new Date(a.detectedAt))} compact onInspect={openIncident}/></article>
            <article className="panel map-panel"><div className="panel-heading"><div><h2>Incident locations</h2><p>Coordinates reported with incident records</p></div><span className="panel-icon"><MapPin size={17}/></span></div><LocationMap incidents={incidents} tankers={tankers} onInspect={openIncident}/><div className="map-foot"><span><MapPin size={14}/>{incidents.filter(i => i.latitude != null && i.longitude != null).length} incident coordinates</span><button className="text-action" onClick={() => setPage('tankers')}>Tanker records <ArrowDownRight size={14}/></button></div></article></section>
          <section className="panel workflow-panel"><div className="panel-heading"><div><h2>Detection workflow</h2><p>How TankerGuard turns telemetry into an actionable review</p></div><Badge kind="neutral">4 stages</Badge></div><div className="workflow-steps"><div className="workflow-step"><span className="workflow-number">01</span><div className="workflow-icon"><Gauge size={18}/></div><strong>Collect</strong><p>Read water volume, movement, delivery state and location.</p></div><div className="workflow-connector"/><div className="workflow-step"><span className="workflow-number">02</span><div className="workflow-icon"><Activity size={18}/></div><strong>Compare</strong><p>Compare consecutive readings and exclude reported delivery.</p></div><div className="workflow-connector"/><div className="workflow-step"><span className="workflow-number">03</span><div className="workflow-icon amber-icon"><AlertTriangle size={18}/></div><strong>Flag</strong><p>Create a possible-loss incident when the rules trigger.</p></div><div className="workflow-connector"/><div className="workflow-step"><span className="workflow-number">04</span><div className="workflow-icon"><ShieldCheck size={18}/></div><strong>Investigate</strong><p>Operator reviews the evidence and updates the incident status.</p></div></div></section>
        </>}

        {page === 'incidents' && <section className="panel full-panel"><div className="panel-heading"><div><h2>All incidents</h2><p>{incidents.length} records returned by the API</p></div><div className="table-tools"><div className="search-box"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents"/></div><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter incident status"><option value="ALL">All statuses</option>{['OPEN','ACKNOWLEDGED','MAINTENANCE_REQUIRED','RESOLVED','FALSE_ALARM'].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></div></div><IncidentTable incidents={filteredIncidents} onInspect={openIncident}/></section>}

        {page === 'tankers' && <><section className="metric-grid two-metrics"><MetricCard label="Registered tankers" value={summary ? fmt(summary.registeredTankers) : '—'} unit="units" icon={Truck} tone="blue" note="From GET /api/tankers"/><MetricCard label="Incident coordinates" value={fmt(incidents.filter(i => i.latitude != null && i.longitude != null).length)} unit="points" icon={MapPin} tone="teal" note="From persisted incident records"/></section><section className="panel full-panel"><div className="panel-heading"><div><h2>Registered tanker records</h2><p>Only fields returned by the backend are shown; latest GPS telemetry is not exposed by the current tanker endpoint.</p></div><Badge kind="neutral">{tankers.length} records</Badge></div>{tankers.length ? <div className="table-scroll"><table><thead><tr><th>Tanker ID</th><th>Name</th><th>Capacity</th><th>Operator</th><th>Active</th><th>Registered</th></tr></thead><tbody>{tankers.map(t => <tr key={t.tankerId}><td><span className="tanker-id">{t.tankerId}</span></td><td>{t.name}</td><td>{fmt(t.capacityLiters)} L</td><td>{t.operatorName}</td><td><Badge kind={t.active ? 'resolved' : 'neutral'}>{t.active ? 'Active' : 'Inactive'}</Badge></td><td>{dateFmt(t.createdAt)}</td></tr>)}</tbody></table></div> : <div className="empty-state"><Truck size={25}/><strong>No tanker records</strong><span>Run a simulation to create the demo tanker, or register one through the API.</span><button className="button primary" onClick={() => setPage('simulation')}>Open simulation lab</button></div>}</section><section className="panel map-panel standalone-map"><div className="panel-heading"><div><h2>Reported incident locations</h2><p>Map markers are incident coordinates, not live vehicle positions.</p></div></div><LocationMap incidents={incidents} tankers={tankers} onInspect={openIncident}/></section></>}
        {page === 'telemetry' && (
          <section className="panel full-panel">
            <div className="panel-heading">
              <div>
                <h2>Telemetry events</h2>
                <p>Actual readings stored by the backend. Demo readings are synthetic.</p>
              </div>
              <Badge kind="simulated">SIMULATION DATA</Badge>
            </div>

            <div className="table-tools">
              <select
                value={telemetryTankerId}
                onChange={(event) => {
                  const id = event.target.value;
                  setTelemetryTankerId(id);
                  loadTelemetry(id);
                }}
                aria-label="Select tanker"
              >
                <option value="">Select a tanker</option>
                {tankers.map((tanker) => (
                  <option key={tanker.tankerId} value={tanker.tankerId}>
                    {tanker.tankerId}
                  </option>
                ))}
              </select>

              <button
                className="button secondary"
                disabled={!telemetryTankerId || telemetryLoading}
                onClick={() => loadTelemetry(telemetryTankerId)}
              >
                {telemetryLoading ? 'Loading…' : 'Refresh events'}
              </button>
            </div>

            {telemetryError && (
              <div className="error-banner">
                <AlertTriangle size={18} />
                <span>{telemetryError}</span>
              </div>
            )}

            {!telemetryTankerId ? (
              <div className="empty-state">
                <Activity size={25} />
                <strong>Select a tanker</strong>
                <span>Choose a tanker to inspect its stored telemetry records.</span>
              </div>
            ) : telemetryLoading ? (
              <div className="empty-state">Loading telemetry records…</div>
            ) : telemetry.length === 0 ? (
              <div className="empty-state">No telemetry records found for this tanker.</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Recorded at</th>
                      <th>Event ID</th>
                      <th>Water volume</th>
                      <th>Location</th>
                      <th>Moving</th>
                      <th>Authorized delivery</th>
                      <th>Valve open</th>
                      <th>Outlet flow</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetry.map((event) => (
                      <tr key={event.eventId}>
                        <td>{dateFmt(event.recordedAt)}</td>
                        <td>
                          <span className="tanker-id">{event.eventId}</span>
                        </td>
                        <td>{fmt(event.waterVolumeLiters)} L</td>
                        <td>
                          {Number(event.latitude).toFixed(5)}, {Number(event.longitude).toFixed(5)}
                        </td>
                        <td>
                          <Badge kind={event.moving ? 'resolved' : 'neutral'}>
                            {event.moving ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td>{event.deliveryAuthorized ? 'Yes' : 'No'}</td>
                        <td>{event.valveOpen ? 'Yes' : 'No'}</td>
                        <td>{fmt(event.outletFlowLitersPerMinute)} L/min</td>
                        <td>
                          <Badge kind="simulated">{event.source || 'Unknown'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {page === 'simulation' && <><div className="simulation-intro"><div className="sim-intro-icon"><Zap size={23}/></div><div><h2>Test the detection rules</h2><p>Each run sends three simulated telemetry events to the running backend. The backend persists records; repeated runs may increase event and incident counts.</p></div></div><div className="scenario-grid"><article className="scenario-card leak-card"><div className="scenario-head"><div className="scenario-icon leak"><Droplets size={20}/></div><Badge kind="medium">Anomaly expected</Badge></div><h3>Possible leak in transit</h3><p>Simulates a significant water-volume drop while the tanker is moving and no authorized delivery is reported.</p><div className="scenario-detail"><span>Expected outcome</span><strong>Possible-loss incident</strong></div><button className="button primary full-button" disabled={!!running || connection !== 'online'} onClick={() => simulate('leak')}>{running === 'leak' ? <RefreshCw className="spin" size={16}/> : <Zap size={16}/>} {running === 'leak' ? 'Running scenario…' : 'Simulate leak'}</button></article><article className="scenario-card"><div className="scenario-head"><div className="scenario-icon normal"><Activity size={20}/></div><Badge kind="resolved">No anomaly expected</Badge></div><h3>Normal transit</h3><p>Simulates small water-volume variations during movement to verify that routine changes don't create an incident.</p><div className="scenario-detail"><span>Expected outcome</span><strong>No new incident</strong></div><button className="button secondary full-button" disabled={!!running || connection !== 'online'} onClick={() => simulate('normal')}>{running === 'normal' ? <RefreshCw className="spin" size={16}/> : <Truck size={16}/>} {running === 'normal' ? 'Running scenario…' : 'Simulate normal transit'}</button></article><article className="scenario-card"><div className="scenario-head"><div className="scenario-icon delivery"><Waves size={20}/></div><Badge kind="resolved">Authorized discharge</Badge></div><h3>Authorized delivery</h3><p>Simulates water leaving the tanker during a reported delivery with the valve open and vehicle stationary.</p><div className="scenario-detail"><span>Expected outcome</span><strong>No unexplained-loss alert</strong></div><button className="button secondary full-button" disabled={!!running || connection !== 'online'} onClick={() => simulate('delivery')}>{running === 'delivery' ? <RefreshCw className="spin" size={16}/> : <Check size={16}/>} {running === 'delivery' ? 'Running scenario…' : 'Simulate authorized delivery'}</button></article></div><div className="simulation-footnote"><AlertTriangle size={18}/><div><strong>Simulation only</strong><p>All generated readings, locations and results are synthetic. They do not represent live Delhi Jal Board measurements. An anomaly is a reason to inspect, not proof of a leak.</p></div></div><section className="panel"><div className="panel-heading"><div><h2>Current backend result</h2><p>Latest persisted summary after scenario runs</p></div><button className="text-action" onClick={() => refresh(false)}><RefreshCw size={14}/> Refresh</button></div><div className="simulation-summary">{[['Telemetry events', summary?.telemetryEvents], ['Total incidents', summary?.totalIncidents], ['Open incidents', summary?.openIncidents], ['Estimated water loss', summary ? `${fmt(summary.estimatedWaterLossLiters)} L` : null]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value == null ? '—' : typeof value === 'number' ? fmt(value) : value}</strong></div>)}</div></section></>}
        <footer className="page-footer"><span>© 2026 TankerGuard · Water-loss intelligence prototype</span><span><span className={`status-pulse ${connection}`}/>{connection === 'online' ? 'Connected to configured API' : connection === 'offline' ? 'Waiting for backend' : 'Checking connection'}{lastUpdated ? ` | Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</span></footer>
      </div>
    </main>

    {architectureOpen && (
      <div className="modal-backdrop architecture-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setArchitectureOpen(false); }}>
        <section className="architecture-modal" role="dialog" aria-modal="true" aria-labelledby="architecture-title">
          <style>{`
            .architecture-modal{width:min(1120px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;padding:26px;border-radius:18px;background:#fff;color:#183042;box-shadow:0 24px 80px #102a3a40}
            .architecture-modal-header{align-items:flex-start;gap:20px}
            .architecture-modal-header h2{margin:5px 0 6px;font-size:clamp(21px,3vw,28px);letter-spacing:-.6px}
            .architecture-modal-header p{margin:0;color:#718091;font-size:13px}
            .architecture-status{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:18px 0 22px;padding:11px 13px;border:1px solid #e4ebef;border-radius:10px;background:#f8fafb;color:#506576;font-size:12px}
            .architecture-status .badge{margin-left:auto}
            .architecture-flow{display:grid;grid-template-columns:minmax(0,1fr) 46px minmax(0,1fr) 46px minmax(0,1fr) 46px minmax(0,1fr);align-items:stretch;gap:6px}
            .architecture-node{min-width:0;padding:16px 13px;border:1px solid #e2eaf0;border-radius:13px;background:linear-gradient(180deg,#fff,#f9fbfc)}
            .architecture-node-icon{display:grid;place-items:center;width:42px;height:42px;margin-bottom:14px;border-radius:12px}
            .architecture-node-icon.frontend{color:#176b82;background:#e3f4f7}.architecture-node-icon.storage{color:#b36a19;background:#fff1dc}.architecture-node-icon.gateway{color:#6c55b5;background:#eee9ff}.architecture-node-icon.backend{color:#187a63;background:#e2f5ed}
            .architecture-node-kicker{color:#8393a0;font-size:9px;font-weight:800;letter-spacing:1px}
            .architecture-node h3{margin:5px 0 7px;font-size:16px}
            .architecture-node p{min-height:68px;margin:0 0 13px;color:#657786;font-size:12px;line-height:1.55}
            .architecture-node .badge{display:inline-flex;align-items:center;gap:6px;width:fit-content;max-width:100%;white-space:normal;line-height:1.4;overflow-wrap:anywhere}
            .architecture-link{display:inline-flex;align-items:center;gap:5px;color:#087f82;font-size:11px;font-weight:700;line-height:1.5;text-decoration:none;overflow-wrap:anywhere}.architecture-link:hover{text-decoration:underline}
            .architecture-connector{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px;color:#6b8291;text-align:center}.architecture-connector svg{color:#168a89}.architecture-connector span{font-size:9px;line-height:1.35}
            .architecture-notes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
            .architecture-notes>div{padding:14px;border:1px solid #e6edf1;border-radius:11px;background:#fbfcfd}
            .architecture-notes strong{display:flex;align-items:center;gap:7px;font-size:12px}.architecture-notes strong svg{color:#168a76}
            .architecture-notes p{margin:7px 0 0;color:#71808d;font-size:11px;line-height:1.6}
            .architecture-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:15px;border-top:1px solid #e9eef2}
            .architecture-footer>span{display:flex;align-items:center;gap:7px;color:#71808d;font-size:11px}
            .architecture-trigger{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
            @media(max-width:900px){.architecture-flow{grid-template-columns:1fr 30px 1fr}.architecture-flow>.architecture-connector:nth-child(6){display:none}.architecture-flow>.architecture-node:nth-child(7){grid-column:3}.architecture-node p{min-height:0}}
            @media(max-width:600px){.architecture-modal{padding:18px}.architecture-flow{grid-template-columns:1fr}.architecture-flow>.architecture-connector{min-height:26px;flex-direction:row}.architecture-connector svg{transform:rotate(90deg)}.architecture-flow>.architecture-node{grid-column:auto!important}.architecture-notes{grid-template-columns:1fr}.architecture-status .badge{margin-left:0}.architecture-trigger span{display:none}}
          `}</style>
          <div className="modal-header architecture-modal-header">
            <div><div className="eyebrow">DEPLOYED INFRASTRUCTURE</div><h2 id="architecture-title">TankerGuard AWS architecture</h2><p>How the deployed frontend reaches the Spring Boot API.</p></div>
            <button className="icon-button" type="button" onClick={() => setArchitectureOpen(false)} aria-label="Close AWS architecture"><X size={18}/></button>
          </div>
          <div className="architecture-status">
            <span className={`status-pulse ${connection}`}/>
            <span>{connection === 'online' ? 'Frontend can reach the configured API' : connection === 'offline' ? 'API connection is currently unavailable' : 'Checking API connection'}</span>
            <Badge kind="neutral">Production endpoint configured</Badge>
          </div>
          <div className="architecture-flow" aria-label="Request flow from browser to AWS backend">
            <article className="architecture-node">
              <div className="architecture-node-icon frontend"><Globe size={22}/></div><span className="architecture-node-kicker">CLIENT</span><h3>Browser</h3><p>React + Vite dashboard.</p><Badge kind="resolved">User interface</Badge>
            </article>
            <div className="architecture-connector"><ArrowRight size={19}/><span>Loads website</span></div>
            <article className="architecture-node">
              <div className="architecture-node-icon storage"><Cloud size={22}/></div><span className="architecture-node-kicker">AWS · FRONTEND</span><h3>Amazon S3</h3><p>Hosts the built static frontend files.</p>
              <Badge kind="resolved">
                <span className="live-indicator" />
                You're viewing the live deployment
              </Badge>
            </article>
            <div className="architecture-connector"><ArrowRight size={19}/><span>API requests</span></div>
            <article className="architecture-node">
              <div className="architecture-node-icon gateway"><GitBranch size={22}/></div><span className="architecture-node-kicker">AWS · API ENTRY</span><h3>API Gateway</h3><p>Receives API calls and forwards them through the configured proxy route.</p>
              <Badge kind="resolved">API endpoint configured</Badge>
            </article>
            <div className="architecture-connector"><ArrowRight size={19}/><span>Proxy route</span></div>
            <article className="architecture-node">
              <div className="architecture-node-icon backend"><Server size={22}/></div><span className="architecture-node-kicker">AWS · APPLICATION</span><h3>Elastic Beanstalk</h3><p>Runs the TankerGuard Spring Boot backend and REST endpoints.</p><Badge kind={connection === 'online' ? 'resolved' : 'neutral'}>{connection === 'online' ? 'API responding' : 'Runtime status not verified'}</Badge>
            </article>
          </div>
          <div className="architecture-notes">
            <div><strong><Check size={15}/> Confirmed deployment path</strong><p>S3 static website → API Gateway → Elastic Beanstalk / Spring Boot.</p></div>
            <div><strong><CircleHelp size={15}/> Data persistence</strong><p>Tanker, telemetry and incident records are persisted by the Spring Boot backend, keeping operational data available across requests.</p></div>
          </div>
          <div className="architecture-footer"><span><ShieldCheck size={15}/> Region: ap-south-1 (Mumbai)</span><button className="button secondary" type="button" onClick={() => setArchitectureOpen(false)}>Close</button></div>
        </section>
      </div>
    )}

    {selected && (
      <div
        className="modal-backdrop"
        role="presentation"
        onMouseDown={e => {
          if (e.target === e.currentTarget && !savingIncident) setSelected(null);
        }}
      >
        <section className="incident-modal" role="dialog" aria-modal="true" aria-labelledby="incident-modal-title">
          <div className="modal-header">
            <div>
              <div className="eyebrow">INCIDENT INVESTIGATION</div>
              <h2 id="incident-modal-title">Incident #{selected.id}</h2>
            </div>
            <button className="icon-button" onClick={() => setSelected(null)} disabled={savingIncident} aria-label="Close details">
              <X size={18}/>
            </button>
          </div>

          <div className="modal-badges">
            <Badge kind={String(selected.severity || '').toLowerCase()}>{selected.severity || 'Unspecified'}</Badge>
            <Badge kind={String(selected.status || '').toLowerCase()}>{statusLabel(selected.status)}</Badge>
            {String(selected.dataSource || '').toLowerCase().includes('simulat') && <Badge kind="simulated">Simulated data</Badge>}
          </div>

          <div className="detail-grid">
            <div><span>Tanker</span><strong>{selected.tankerId}</strong></div>
            <div><span>Estimated loss</span><strong>{fmt(selected.estimatedLossLiters)} L</strong></div>
            <div><span>Detected</span><strong>{dateFmt(selected.detectedAt)}</strong></div>
            <div><span>Location</span><strong>{selected.latitude ?? '—'}, {selected.longitude ?? '—'}</strong></div>
            <div className="detail-wide"><span>Reason for alert</span><p>{selected.reason || 'No reason provided by backend.'}</p></div>
            <div className="detail-wide"><span>Previously saved investigation note</span><p>{selected.driverNote || 'No investigation note has been recorded yet.'}</p></div>
          </div>

          <div className="modal-actions">
            <label htmlFor="incident-status">Investigation status</label>
            <select id="incident-status" value={editStatus} disabled={savingIncident} onChange={e => setEditStatus(e.target.value)}>
              {['OPEN', 'ACKNOWLEDGED', 'MAINTENANCE_REQUIRED', 'RESOLVED', 'FALSE_ALARM'].map(status => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>

            <label htmlFor="investigation-note">Investigation note</label>
            <textarea
              id="investigation-note"
              className="investigation-note"
              value={editNote}
              disabled={savingIncident}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Record inspection findings, dispatcher updates, or maintenance actions..."
              maxLength={1000}
              rows={4}
            />
            <small>Maximum 1,000 characters. Leave the note unchanged to preserve the existing record.</small>

            <button type="button" className="button primary full-button" disabled={savingIncident} onClick={saveIncidentUpdate}>
              {savingIncident ? 'Saving investigation...' : 'Save investigation'}
            </button>
          </div>
        </section>
      </div>
    )}
  </div>;
}

export default App;
