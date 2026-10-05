import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  ANYTIME_NOTE_MARKER,
  TIME_SLOTS,
  buildAnytimeSlots,
  buildDays,
  slotId,
  weekdaySlotIds,
} from '../lib/schedule.js';
import { rememberTzLabel, tzLabelForDisplay, tzValueForSaving } from '../lib/timezones.js';
import PortalHeader from './PortalHeader.jsx';
import ScheduleCard from './ScheduleCard.jsx';
import ScheduleForm from './ScheduleForm.jsx';

export default function Portal({ user, onLogout }) {
  const days = useMemo(() => buildDays(), []);
  const pickableSlotIds = useMemo(() => new Set(weekdaySlotIds(days)), [days]);

  // The client's manual picks. While "Available Anytime" is on the grid shows every weekday slot as
  // selected but this set is left untouched, so turning Anytime off brings the earlier picks back.
  const [selected, setSelected] = useState(() => new Set());
  const [anytime, setAnytime] = useState(false);
  const [notes, setNotes] = useState('');
  const [timezone, setTimezone] = useState(''); // the friendly label the client sees

  // Load this client's saved schedule
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error('Supabase load error:', error);
        return;
      }
      if (!data) return;

      const rawNotes = data.notes || '';
      const isAnytime = rawNotes.startsWith(ANYTIME_NOTE_MARKER);

      if (isAnytime) {
        // Standing availability: lock the grid with every weekday slot selected
        setAnytime(true);
      } else if (data.slots) {
        // Saved slots outside the visible weekday grid are ignored
        setSelected(new Set(Object.keys(data.slots).filter((id) => pickableSlotIds.has(id))));
      }

      // Show only the client's own notes (the Anytime marker is shown as the banner instead)
      setNotes(isAnytime ? rawNotes.slice(ANYTIME_NOTE_MARKER.length).replace(/^\r?\n/, '') : rawNotes);

      if (data.timezone) setTimezone(tzLabelForDisplay(data.timezone, user.email));
    }

    load();
    return () => { cancelled = true; };
  }, [user.email, pickableSlotIds]);

  const toggleSlot = useCallback((id) => {
    if (anytime) return; // grid is locked while Available Anytime is on
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, [anytime]);

  // Checks every slot for the date; if they're all already checked, unchecks them instead
  const toggleDay = useCallback((dateKey) => {
    if (anytime) return;
    const ids = TIME_SLOTS.map((time) => slotId(dateKey, time));
    setSelected((prev) => {
      const allChecked = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      ids.forEach((id) => (allChecked ? next.delete(id) : next.add(id)));
      return next;
    });
  }, [anytime]);

  const clearSelection = () => {
    setAnytime(false);
    setSelected(new Set());
  };

  const selectAllWeekdays = () => {
    setAnytime(false); // back to the 14-day selection only
    setSelected(new Set(pickableSlotIds));
  };

  async function saveSchedule() {
    const slots = anytime
      ? buildAnytimeSlots()
      : Object.fromEntries([...selected].map((id) => [id, true]));

    const notesText = anytime
      ? (notes.trim() ? `${ANYTIME_NOTE_MARKER}\n${notes}` : ANYTIME_NOTE_MARKER)
      : notes;

    // Client sees the friendly label; Supabase still receives the original value (e.g. "Etc/GMT+11")
    const tzLabel = timezone.trim();
    const tzValue = tzValueForSaving(tzLabel);
    if (tzValue !== tzLabel) rememberTzLabel(user.email, tzLabel);

    const { error } = await supabase
      .from('schedules')
      .upsert({
        user_email: user.email,
        slots,
        notes: notesText,
        timezone: tzValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_email' });

    if (error) {
      console.error('Supabase save error:', error);
      alert('Error saving schedule: ' + error.message);
    } else {
      alert(anytime
        ? `Saved: ${user.name} is available anytime on weekdays.`
        : `Schedule successfully synced for ${user.name}!`);
    }
  }

  return (
    <main>
      <PortalHeader user={user} onLogout={onLogout} />
      <div className="app-layout">
        <ScheduleCard
          days={days}
          selected={selected}
          anytime={anytime}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          onToggleSlot={toggleSlot}
          onToggleDay={toggleDay}
          onClear={clearSelection}
          onSelectAllWeekdays={selectAllWeekdays}
          onToggleAnytime={() => setAnytime((on) => !on)}
        />
        <ScheduleForm
          anytime={anytime}
          slotCount={selected.size}
          notes={notes}
          onNotesChange={setNotes}
          onSubmit={saveSchedule}
        />
      </div>
    </main>
  );
}
