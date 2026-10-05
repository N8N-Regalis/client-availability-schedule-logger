export const DAYS_SHOWN = 14;

// "Available Anytime" saves every weekday slot from today through this many days ahead,
// in the SAME slots format as manual selections, so the Schedule Viewer needs no changes.
// Each time the client saves again, the window rolls forward from that day.
export const ANYTIME_HORIZON_DAYS = 365;

// Placed at the start of the saved notes so staff (and this portal on next login) can recognise it.
export const ANYTIME_NOTE_MARKER = '[AVAILABLE ANYTIME]';

// 12-hour AM/PM labels, 24 hours in 30-minute steps: "12:00 AM" ... "11:30 PM"
export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minutes} ${period}`;
});

const pad = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD in the browser's local calendar
export function formatDateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

// The key a slot is saved under, e.g. "2026-10-05_9:30 AM"
export const slotId = (dateKey, time) => `${dateKey}_${time}`;

// The columns of the grid: today plus the next 13 days
export function buildDays(count = DAYS_SHOWN, from = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return {
      dateKey: formatDateKey(d),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateFormatted: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      isWeekend: isWeekend(d),
    };
  });
}

// IDs of every slot a client is allowed to pick (weekdays in the visible grid)
export function weekdaySlotIds(days) {
  return days.filter((day) => !day.isWeekend).flatMap((day) => TIME_SLOTS.map((time) => slotId(day.dateKey, time)));
}

// Every weekday slot from today through ANYTIME_HORIZON_DAYS, keyed exactly like grid slots
export function buildAnytimeSlots(from = new Date()) {
  const result = {};
  for (let i = 0; i < ANYTIME_HORIZON_DAYS; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    if (isWeekend(d)) continue; // weekends stay unavailable, same as the grid
    const dateKey = formatDateKey(d);
    TIME_SLOTS.forEach((time) => { result[slotId(dateKey, time)] = true; });
  }
  return result;
}
