import { memo } from 'react';
import { TIME_SLOTS, slotId } from '../lib/schedule.js';

// Memoized so toggling one slot doesn't re-render the other ~670 cells
const SlotCell = memo(function SlotCell({ id, pressed, onToggle }) {
  return (
    <button
      type="button"
      className="slot"
      data-slot-id={id}
      aria-pressed={pressed}
      onClick={() => onToggle(id)}
    >
      {pressed ? '✓' : ''}
    </button>
  );
});

export default function ScheduleGrid({ days, selected, anytime, onToggleSlot, onToggleDay }) {
  return (
    <div className="grid-wrapper">
      <table className="schedule-table">
        <thead>
          <tr>
            <th>Time</th>
            {days.map((day) => {
              const label = `${day.dayName}\n${day.dateFormatted}`;
              if (day.isWeekend) {
                return <th key={day.dateKey} className="weekend-col">{label}</th>;
              }
              // Clicking a weekday date checks every slot for that date (or unchecks them if all are checked)
              return (
                <th
                  key={day.dateKey}
                  className="day-header"
                  tabIndex={0}
                  title="Click to select all time slots for this date"
                  onClick={() => onToggleDay(day.dateKey)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleDay(day.dateKey);
                    }
                  }}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((time) => (
            <tr key={time}>
              <th>{time}</th>
              {days.map((day) => {
                const id = slotId(day.dateKey, time);
                if (day.isWeekend) {
                  return (
                    <td key={day.dateKey} className="weekend-col">
                      <button
                        type="button"
                        className="slot disabled-slot"
                        data-slot-id={id}
                        aria-pressed={false}
                        title="Weekend unavailable"
                        disabled
                      />
                    </td>
                  );
                }
                return (
                  <td key={day.dateKey}>
                    <SlotCell id={id} pressed={anytime || selected.has(id)} onToggle={onToggleSlot} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
