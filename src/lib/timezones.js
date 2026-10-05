// The client sees friendly labels (e.g. "Samoa Standard Time (UTC-11:00)"),
// but Supabase keeps receiving the original value (e.g. "Etc/GMT+11") for the Schedule Viewer.
export const TIMEZONE_OPTIONS = [
  { label: 'UTC-12:00', tz: 'Etc/GMT+12' },
  { label: 'Samoa Standard Time (UTC-11:00)', tz: 'Etc/GMT+11' },
  { label: 'Hawaii-Aleutian Standard Time (UTC-10:00)', tz: 'Etc/GMT+10' },
  { label: 'Alaska Standard Time (UTC-09:00 AKST)', tz: 'Etc/GMT+9' },
  { label: 'Alaska Daylight Time (UTC-08:00 AKDT)', tz: 'Etc/GMT+8' },
  { label: 'Pacific Standard Time (UTC-08:00 PST)', tz: 'Etc/GMT+8' },
  { label: 'Pacific Daylight Time (UTC-07:00 PDT)', tz: 'Etc/GMT+7' },
  { label: 'Mountain Standard Time (UTC-07:00 MST)', tz: 'Etc/GMT+7' },
  { label: 'Mountain Daylight Time (UTC-06:00 MDT)', tz: 'Etc/GMT+6' },
  { label: 'Central Standard Time (UTC-06:00 CST)', tz: 'Etc/GMT+6' },
  { label: 'Central Daylight Time (UTC-05:00 CDT)', tz: 'Etc/GMT+5' },
  { label: 'Eastern Standard Time (UTC-05:00 EST)', tz: 'Etc/GMT+5' },
  { label: 'Eastern Daylight Time (UTC-04:00 EDT)', tz: 'Etc/GMT+4' },
  { label: 'Atlantic Standard Time (UTC-04:00 AST)', tz: 'Etc/GMT+4' },
  { label: 'Atlantic Daylight Time (UTC-03:00 ADT)', tz: 'Etc/GMT+3' },
  { label: 'Chamorro Standard Time (UTC+10:00)', tz: 'Etc/GMT-10' },
  { label: 'UTC+12:00', tz: 'Etc/GMT-12' },
];

// If someone types or pastes a raw value like "Etc/GMT+11", this finds its friendly option.
export function findOptionByTz(text) {
  const t = (text || '').trim();
  return TIMEZONE_OPTIONS.find((o) => o.tz === t);
}

export function tzValueForSaving(text) {
  const t = (text || '').trim();
  const match = TIMEZONE_OPTIONS.find((o) => o.label === t);
  return match ? match.tz : t; // anything typed that isn't in the list is saved as-is
}

const tzStorageKey = (email) => 'regalis_tz_label:' + (email || '').toLowerCase();

export function rememberTzLabel(email, label) {
  try { localStorage.setItem(tzStorageKey(email), label); } catch { /* storage unavailable */ }
}

function recallTzLabel(email) {
  try { return localStorage.getItem(tzStorageKey(email)); } catch { return null; }
}

export function tzLabelForDisplay(tzValue, email) {
  if (!tzValue) return '';
  // Some values are shared by two labels (e.g. Etc/GMT+8 = Alaska Daylight and Pacific Standard).
  // Prefer the exact label this client last saved on this device, otherwise the first match.
  const remembered = recallTzLabel(email);
  if (remembered && TIMEZONE_OPTIONS.some((o) => o.label === remembered && o.tz === tzValue)) return remembered;
  const match = TIMEZONE_OPTIONS.find((o) => o.tz === tzValue);
  return match ? match.label : tzValue;
}
