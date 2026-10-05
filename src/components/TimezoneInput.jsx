import { TIMEZONE_OPTIONS, findOptionByTz } from '../lib/timezones.js';

export default function TimezoneInput({ value, onChange }) {
  // If someone types or pastes a raw value like "Etc/GMT+11", show its friendly label instead
  function normalizeRawValue() {
    const match = findOptionByTz(value);
    if (match) onChange(match.label);
  }

  return (
    <div className="control-group">
      <label htmlFor="tz-select">Timezone:</label>
      <input
        list="timezone-options"
        id="tz-select"
        value={value}
        placeholder="Select timezone..."
        onChange={(e) => onChange(e.target.value)}
        onBlur={normalizeRawValue}
      />
      <datalist id="timezone-options">
        {TIMEZONE_OPTIONS.map((o) => <option key={o.label} value={o.label} />)}
      </datalist>
    </div>
  );
}
