const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${BASE_URL}. Start Spring Boot and try again.`);
  }
  const text = await response.text();
  let body = null;
  if (text) { try { body = JSON.parse(text); } catch { body = text; } }
  if (!response.ok) {
    const detail = typeof body === 'string' ? body : body?.message || body?.error || `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return body;
}

export const getSummary = () => api('/api/dashboard/summary');
export const getIncidents = () => api('/api/incidents');
export const getTankers = () => api('/api/tankers');
export const runScenario = (scenario) => api(`/api/demo/scenario/${scenario}`, { method: 'POST' });
export const updateIncident = (id, status, note = '') => api(`/api/incidents/${id}/status`, {
  method: 'PATCH', body: JSON.stringify({ status, note }),
});
export const getHealth = () => api('/api/health');
export const getTelemetry = (tankerId) =>
  api(`/api/telemetry/${encodeURIComponent(tankerId)}`);