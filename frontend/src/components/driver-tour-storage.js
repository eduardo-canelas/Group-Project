const STORAGE_KEY = 'routepulse:driver-tour-seen-v1';

export function hasSeenDriverTour() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export function markDriverTourSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
}

export function clearDriverTourFlag() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
