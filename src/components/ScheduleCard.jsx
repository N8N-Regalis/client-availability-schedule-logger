import { useState } from 'react';
import DateRangePanel from './DateRangePanel.jsx';
import ScheduleGrid from './ScheduleGrid.jsx';
import TimezoneInput from './TimezoneInput.jsx';

export default function ScheduleCard({
  days,
  selected,
  anytime,
  timezone,
  onTimezoneChange,
  onToggleSlot,
  onToggleDay,
  onToggleTime,
  onClear,
  onSelectAllWeekdays,
  onToggleAnytime,
  onAddRange,
  onSetSlots,
}) {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [preview, setPreview] = useState(null); // slots the open Date Range panel would add, not yet saved

  return (
    <div className={`card${anytime ? ' anytime-on' : ''}`}>
      <div className="toolbar">
        <TimezoneInput value={timezone} onChange={onTimezoneChange} />
        <div className="control-group">
          <button type="button" onClick={onClear}>Clear Selection</button>
          <button type="button" onClick={onSelectAllWeekdays}>Select All Weekdays</button>
          <button
            type="button"
            className="btn-anytime"
            aria-pressed={anytime}
            title="Mark yourself available on every weekday, at any time, going forward"
            onClick={() => { setRangeOpen(false); onToggleAnytime(); }}
          >
            Available Anytime
          </button>
          <button
            type="button"
            className="btn-anytime"
            aria-pressed={rangeOpen}
            disabled={anytime}
            title={anytime ? 'Turn off Available Anytime to pick a date range' : 'Pick specific dates and an hour range'}
            onClick={() => setRangeOpen((open) => !open)}
          >
            Date Range
          </button>
        </div>
      </div>

      {rangeOpen && !anytime && (
        <DateRangePanel
          days={days}
          onSave={(ids) => { onAddRange(ids); setRangeOpen(false); }}
          onCancel={() => setRangeOpen(false)}
          onPreview={setPreview}
        />
      )}

      {anytime && (
        <div className="anytime-banner" role="status">
          <strong>You're available anytime.</strong> Every weekday time slot is marked as available, including dates beyond the 14 days shown.
          Click <strong>Available Anytime</strong> again to go back to choosing specific times.
        </div>
      )}

      {!anytime && (
        <p className="grid-hint">
          Tip: click and drag across boxes to select a block, or click one box and Shift+click another. Press Esc while dragging to cancel.
        </p>
      )}

      <ScheduleGrid
        days={days}
        selected={selected}
        anytime={anytime}
        preview={rangeOpen && !anytime ? preview : null}
        onToggleSlot={onToggleSlot}
        onToggleDay={onToggleDay}
        onToggleTime={onToggleTime}
        onSetSlots={onSetSlots}
      />
    </div>
  );
}
