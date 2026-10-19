import { useEffect, useMemo, useRef, useState } from 'react';
import { TIME_SLOTS, slotId } from '../lib/schedule.js';

const END_OF_DAY = TIME_SLOTS.length; // index 48 = midnight at the end of the day
const endLabel = (index) => (index === END_OF_DAY ? '12:00 AM (end of day)' : TIME_SLOTS[index]);

// The date fields are typed as mm/dd/yyyy (the browser's own date input follows the computer's locale instead)
const isoToText = (iso) => (iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : '');

// "10/16/2026" -> "2026-10-16", or null when it isn't a real calendar date
function textToIso(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const real = d.getFullYear() === Number(yyyy) && d.getMonth() === Number(mm) - 1 && d.getDate() === Number(dd);
  return real ? `${yyyy}-${mm}-${dd}` : null;
}

// Keeps only digits and adds the slashes as the client types: "1016" -> "10/16", "10162026" -> "10/16/2026"
function maskDate(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function DateField({ label, hint, text, onTextChange, min, max }) {
  const pickerRef = useRef(null);

  function openCalendar() {
    const picker = pickerRef.current;
    try { picker.showPicker(); } catch { picker.focus(); }
  }

  return (
    <label>
      {label}
      <span className="date-field">
        <input
          type="text"
          inputMode="numeric"
          placeholder="mm/dd/yyyy"
          maxLength={10}
          autoComplete="off"
          value={text}
          onChange={(e) => onTextChange(maskDate(e.target.value))}
        />
        <button type="button" className="date-picker-btn" aria-label={`Open calendar for ${label}`} onClick={openCalendar}>
          📅
        </button>
        {/* Hidden native calendar; picking a day fills the mm/dd/yyyy box above */}
        <input
          ref={pickerRef}
          type="date"
          className="date-native"
          tabIndex={-1}
          aria-hidden="true"
          min={min}
          max={max}
          value={textToIso(text) ?? ''}
          onChange={(e) => onTextChange(isoToText(e.target.value))}
        />
      </span>
      {hint && <span className="range-optional">{hint}</span>}
    </label>
  );
}

// Every weekday slot in the chosen dates and hours; the end time is exclusive (9:00 AM-5:00 PM = 9:00 ... 4:30 PM)
function buildRangeIds(days, fromText, toText, startIndex, endIndex) {
  const firstKey = days[0].dateKey;
  const lastKey = days[days.length - 1].dateKey;

  if (!fromText) return { ids: [], error: 'Choose a start date.' };
  const fromDate = textToIso(fromText);
  if (!fromDate) return { ids: [], error: 'Enter the start date as mm/dd/yyyy.' };

  const lastDate = toText ? textToIso(toText) : fromDate; // leaving "To" empty means just that one day
  if (!lastDate) return { ids: [], error: 'Enter the end date as mm/dd/yyyy, or leave it empty for a single day.' };

  if (lastDate < fromDate) return { ids: [], error: 'The end date can’t be before the start date.' };
  if (fromDate < firstKey || lastDate > lastKey) {
    return { ids: [], error: `Dates must fall within the days shown in the table (${isoToText(firstKey)} to ${isoToText(lastKey)}).` };
  }
  if (endIndex <= startIndex) return { ids: [], error: 'The end time must be after the start time.' };

  const ids = days
    .filter((day) => !day.isWeekend && day.dateKey >= fromDate && day.dateKey <= lastDate)
    .flatMap((day) => TIME_SLOTS.slice(startIndex, endIndex).map((time) => slotId(day.dateKey, time)));

  if (ids.length === 0) return { ids, error: 'That range has no weekdays in the dates shown. Weekends can’t be selected.' };
  return { ids, error: '' };
}

export default function DateRangePanel({ days, onSave, onCancel, onPreview }) {
  const firstKey = days[0].dateKey;
  const lastKey = days[days.length - 1].dateKey;

  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [startIndex, setStartIndex] = useState(TIME_SLOTS.indexOf('9:00 AM'));
  const [endIndex, setEndIndex] = useState(TIME_SLOTS.indexOf('5:00 PM'));
  const [showError, setShowError] = useState(false);

  // The slots this range would add, or why it can't yet. Drives both the live preview and Save.
  const { ids, error } = useMemo(
    () => buildRangeIds(days, fromText, toText, startIndex, endIndex),
    [days, fromText, toText, startIndex, endIndex],
  );

  // Show the pending slots in the table while the client is still choosing
  useEffect(() => { onPreview(error ? null : new Set(ids)); }, [ids, error, onPreview]);

  const editText = (setter) => (value) => { setter(value); setShowError(false); };

  function save() {
    if (error) return setShowError(true);
    onSave(ids);
  }

  return (
    <div className="range-panel" role="group" aria-label="Date range">
      <div className="range-fields">
        <DateField label="From date" text={fromText} onTextChange={editText(setFromText)} min={firstKey} max={lastKey} />
        <DateField
          label="To date"
          hint="(optional, same day if empty)"
          text={toText}
          onTextChange={editText(setToText)}
          min={textToIso(fromText) || firstKey}
          max={lastKey}
        />
        <label>
          From time
          <select value={startIndex} onChange={(e) => { setStartIndex(Number(e.target.value)); setShowError(false); }}>
            {TIME_SLOTS.map((time, i) => <option key={time} value={i}>{time}</option>)}
          </select>
        </label>
        <label>
          To time
          <select value={endIndex} onChange={(e) => { setEndIndex(Number(e.target.value)); setShowError(false); }}>
            {Array.from({ length: END_OF_DAY }, (_, i) => i + 1).map((i) => (
              <option key={i} value={i}>{endLabel(i)}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="range-hint">
        The table shows a preview as you choose; nothing is added until you click Save. Every weekday from the start
        date to the end date is marked available for the chosen hours. Weekends are skipped, and only the dates shown
        in the table can be chosen.
      </p>
      {showError && <p className="range-error" role="alert">{error}</p>}
      <div className="range-actions">
        <button type="button" className="range-save" onClick={save}>Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
