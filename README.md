# Regalis Capital Client Portal

React (Vite) app for clients to log their weekly availability. Data is stored in Supabase
(`allowed_users` for login, `schedules` for saved availability).

## Setup

```
npm install
cp .env.example .env     # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev              # local dev server
npm run build            # production build in dist/
```

## Layout

```
src/
  App.jsx                  login screen <-> portal switch
  components/
    LoginScreen.jsx        email check against allowed_users
    Portal.jsx             schedule state, load/save with Supabase
    PortalHeader.jsx       branding + user badge + logout
    ScheduleCard.jsx       toolbar (timezone, clear, select all, anytime) + banner
    ScheduleGrid.jsx       14-day x 30-minute slot matrix
    TimezoneInput.jsx      timezone input with friendly labels
    ScheduleForm.jsx       totals, notes, save button
  lib/
    schedule.js            time slots, day columns, "Available Anytime" slot builder
    timezones.js           timezone labels <-> saved Etc/GMT values
    supabase.js            Supabase client (reads the VITE_ env vars)
```
