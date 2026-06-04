# AD Space

A cross-platform app for discovering out-of-home (OOH) advertising space across the United States —
billboards, digital boards, bus wraps, taxi tops, transit shelters — with transparent cost
estimates. It is an informational directory and planning tool, not a broker: it does not sell or
book space, and listings and prices are illustrative samples, not quotes.

Runs on iOS, Android, and the web from one Expo / React Native codebase.

## Features

- Map browse with US-only framing, format/market/price filters, and location search (geocoded).
- Cost estimator using standard OOH math (CPM × Daily Effective Circulation), with adjustable
  duration and unit count, shown as a range with a clear "estimate, not a quote" note.
- Budget planner: enter a budget and duration to get the most cost-effective mix of spaces.
- Accounts (Supabase): email/password and Google sign-in, with per-user favorites, requests, and
  saved plans behind a login gate.
- Light / dark / system theme.

## How the estimate works

```
impressions = daily reach (DEC) × days
cost        = (impressions / 1000) × CPM
```

CPM is scaled by market size; a one-time production cost is added for printed formats; the result is
shown as a ±15% range. Baselines are derived from published OOH figures.

## Tech stack

- Expo (SDK 56) + React Native + TypeScript, file-based routing (Expo Router)
- MapLibre GL with OpenFreeMap tiles — no API key (web uses maplibre-gl; native uses a WebView map)
- Photon geocoder for location search — no API key
- Supabase for auth and per-user data (Postgres + Row Level Security)
- Zustand for local UI state (filters, compare selection, theme)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project (supabase.com), then in the SQL Editor run `supabase/schema.sql`.

3. Copy `.env.example` to `.env` and fill in your project values (Project Settings → API):

   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

   For Google sign-in, enable the Google provider under Authentication → Providers in Supabase.

4. Start the app:

   ```bash
   npx expo start        # press w for web, or open in Expo Go on a phone
   ```

Until the env vars are set, the app shows a short setup screen instead of the login.

## Useful commands

```bash
npx tsc --noEmit            # type check
npx expo export -p web      # static web build in ./dist
```

## Project structure

```
src/
  app/                 # screens (Expo Router): (auth)/, (tabs)/, listing/[id], compare
  components/          # UI primitives, map (web + native), cards, estimator, auth, forms
  data/                # types, ad-format defs, market tiers, sample listings
  lib/                 # estimator, budget, geocode, supabase, auth, per-user data, store
  constants/theme.ts   # design tokens (light/dark)
supabase/schema.sql    # database tables + row-level security
```
