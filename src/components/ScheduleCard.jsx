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
  onClear,
  onSelectAllWeekdays,
  onToggleAnytime,
}) {
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
            onClick={onToggleAnytime}
          >
            Available Anytime
          </button>
        </div>
      </div>

      {anytime && (
        <div className="anytime-banner" role="status">
          <strong>You're available anytime.</strong> Every weekday time slot is marked as available, including dates beyond the 14 days shown.
          Click <strong>Available Anytime</strong> again to go back to choosing specific times.
        </div>
      )}

      <ScheduleGrid
        days={days}
        selected={selected}
        anytime={anytime}
        onToggleSlot={onToggleSlot}
        onToggleDay={onToggleDay}
      />
    </div>
  );
}
