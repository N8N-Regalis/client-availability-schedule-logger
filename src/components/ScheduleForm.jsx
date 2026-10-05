const SLOT_MINUTES = 30;

const pad = (n) => String(n).padStart(2, '0');

function summarize(anytime, slotCount) {
  if (anytime) {
    return { hours: 'Anytime (ongoing)', slots: 'All weekday slots, every week' };
  }
  const totalMinutes = slotCount * SLOT_MINUTES;
  return {
    hours: `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)} hours`,
    slots: `${slotCount} slots (${totalMinutes} mins)`,
  };
}

export default function ScheduleForm({ anytime, slotCount, notes, onNotesChange, onSubmit }) {
  const { hours, slots } = summarize(anytime, slotCount);

  return (
    <aside className="card">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="field">
          <label htmlFor="avail-hours">Total available hours</label>
          <input type="text" id="avail-hours" className="readonly-total" value={hours} readOnly />
        </div>

        <div className="field">
          <label htmlFor="selected-slots-count">Selected Slots</label>
          <input type="text" id="selected-slots-count" className="readonly-muted" value={slots} readOnly />
        </div>

        <div className="field">
          <label htmlFor="instructions">Special Instructions</label>
          <textarea
            id="instructions"
            placeholder="any additional notes?"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        <button type="submit" className="primary">Save Schedule</button>
      </form>
    </aside>
  );
}
