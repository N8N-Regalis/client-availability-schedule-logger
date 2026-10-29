import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { TIME_SLOTS, slotId } from '../lib/schedule.js';

// Memoized so toggling one slot doesn't re-render the other ~670 cells
const SlotCell = memo(function SlotCell({ id, pressed, previewed, dragging, onToggle }) {
  const className = ['slot', previewed && 'slot-preview', dragging && 'slot-drag'].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={className}
      data-slot-id={id}
      aria-pressed={pressed}
      onClick={() => onToggle(id)}
    >
      {pressed ? '✓' : ''}
    </button>
  );
});

// Every weekday slot in the rectangle between two slots, like selecting a block of cells in Excel
function rectIds(weekdays, a, b) {
  const [aDate, aTime] = a.split('_');
  const [bDate, bTime] = b.split('_');
  const cols = [weekdays.indexOf(aDate), weekdays.indexOf(bDate)];
  const rows = [TIME_SLOTS.indexOf(aTime), TIME_SLOTS.indexOf(bTime)];
  if (cols.includes(-1) || rows.includes(-1)) return [];

  const ids = [];
  for (let c = Math.min(...cols); c <= Math.max(...cols); c++) {
    for (let r = Math.min(...rows); r <= Math.max(...rows); r++) ids.push(slotId(weekdays[c], TIME_SLOTS[r]));
  }
  return ids;
}

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const edgeSpeed = (distance) => Math.min(24, 4 + distance / 4); // px per tick while dragging past an edge

export default function ScheduleGrid({
  days, selected, anytime, preview, onToggleSlot, onToggleDay, onToggleTime, onSetSlots,
}) {
  const wrapperRef = useRef(null);
  const weekdays = useMemo(() => days.filter((day) => !day.isWeekend).map((day) => day.dateKey), [days]);

  // Mouse drag: { anchor, current, value } while the button is held. Shift+click uses the last anchor.
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const anchorRef = useRef(null); // { id, value } of the last click/drag, the start for Shift+click
  const pointerRef = useRef({ x: 0, y: 0 });
  const suppressClick = useRef(false); // the click that follows a pointer press we already handled
  const latest = useRef({ weekdays, onSetSlots });
  useEffect(() => { latest.current = { weekdays, onSetSlots }; });

  const dragging = drag !== null;
  const dragIds = useMemo(() => (drag ? new Set(rectIds(weekdays, drag.anchor, drag.current)) : null), [drag, weekdays]);

  // The slot under the pointer, treating the pointer as if it never leaves the cell area
  // (so dragging over the sticky headers or past the edge keeps selecting the nearest cells)
  function slotNear(x, y) {
    const wrap = wrapperRef.current;
    const box = wrap.getBoundingClientRect();
    const left = box.left + wrap.clientLeft + wrap.querySelector('tbody th').offsetWidth + 2;
    const top = box.top + wrap.clientTop + wrap.querySelector('thead').offsetHeight + 2;
    const right = box.left + wrap.clientLeft + wrap.clientWidth - 2;
    const bottom = box.top + wrap.clientTop + wrap.clientHeight - 2;
    const button = document.elementFromPoint(clamp(x, left, right), clamp(y, top, bottom))?.closest('[data-slot-id]');
    return button && !button.disabled ? button.dataset.slotId : null;
  }

  // Scrolls the table when the pointer is held past its edge, then extends the selection to the cell there
  function followPointer() {
    const current = dragRef.current;
    if (!current) return;
    const wrap = wrapperRef.current;
    const box = wrap.getBoundingClientRect();
    const { x, y } = pointerRef.current;
    const headerBottom = box.top + wrap.clientTop + wrap.querySelector('thead').offsetHeight;
    const bottom = box.top + wrap.clientTop + wrap.clientHeight;
    if (y < headerBottom) wrap.scrollTop -= edgeSpeed(headerBottom - y);
    else if (y > bottom) wrap.scrollTop += edgeSpeed(y - bottom);
    if (x < box.left) wrap.scrollLeft -= edgeSpeed(box.left - x);
    else if (x > box.right) wrap.scrollLeft += edgeSpeed(x - box.right);

    const id = slotNear(x, y);
    if (id && id !== current.current) {
      dragRef.current = { ...current, current: id };
      setDrag(dragRef.current);
    }
  }

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      followPointer();
    };
    const stop = () => { dragRef.current = null; setDrag(null); };
    const onUp = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      followPointer();
      const d = dragRef.current;
      stop();
      if (!d) return;
      anchorRef.current = { id: d.anchor, value: d.value };
      latest.current.onSetSlots(rectIds(latest.current.weekdays, d.anchor, d.current), d.value);
    };
    const onKey = (e) => { if (e.key === 'Escape') stop(); };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('keydown', onKey);
    const timer = setInterval(followPointer, 50); // keeps scrolling while the pointer is held still at an edge
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('keydown', onKey);
      clearInterval(timer);
    };
    // followPointer only reads refs, so it's safe to leave out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  function handlePointerDown(e) {
    if (anytime || e.button !== 0 || e.pointerType === 'touch') return; // touch keeps plain tap-to-toggle and scrolling
    const button = e.target.closest('[data-slot-id]');
    if (!button || button.disabled) return;
    const id = button.dataset.slotId;

    e.preventDefault(); // no text selection or focus ring while dragging
    // The click that follows this press has already been handled here
    suppressClick.current = true;
    const release = () => setTimeout(() => { suppressClick.current = false; }, 0);
    window.addEventListener('pointerup', release, { once: true });
    window.addEventListener('pointercancel', release, { once: true });

    // Shift+click: fill the block between the last clicked box and this one with the same state as that box
    if (e.shiftKey && anchorRef.current) {
      onSetSlots(rectIds(weekdays, anchorRef.current.id, id), anchorRef.current.value);
      return;
    }

    // Start of a click or drag: the whole block gets checked, unless the first box was already checked, then unchecked
    pointerRef.current = { x: e.clientX, y: e.clientY };
    dragRef.current = { anchor: id, current: id, value: !selected.has(id) };
    setDrag(dragRef.current);
  }

  return (
    <div className="grid-wrapper" ref={wrapperRef}>
      <table
        className="schedule-table"
        onPointerDown={handlePointerDown}
        onClickCapture={(e) => { if (suppressClick.current) e.stopPropagation(); }}
      >
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
              {/* Clicking a time checks that slot on every weekday shown (or unchecks them if all are checked) */}
              <th
                className="time-header"
                tabIndex={0}
                title="Click to select this time on all weekdays"
                onClick={() => onToggleTime(time)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleTime(time);
                  }
                }}
              >
                {time}
              </th>
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
                const inDrag = !!dragIds && dragIds.has(id);
                return (
                  <td key={day.dateKey}>
                    <SlotCell
                      id={id}
                      pressed={anytime || (inDrag ? drag.value : selected.has(id))}
                      previewed={!!preview && preview.has(id) && !selected.has(id)}
                      dragging={inDrag}
                      onToggle={onToggleSlot}
                    />
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
