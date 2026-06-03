# AD Space

Discover where you can place **out-of-home (OOH) advertising** — billboards, digital boards,
bus wraps, taxi tops, transit shelters and more — and get a **legitimate, transparent cost
estimate** before you ever talk to a salesperson.

AD Space is an **informational directory + planning tool**. It does **not** sell, broker, or book
ad space. Listings, vendors, and prices are **illustrative samples** drawn from public OOH industry
averages — not live inventory or quotes.

## Features

- 🗺️ **Map browse + filters** — interactive map (free MapLibre + OpenFreeMap tiles, no API key) with
  filtering by format, market tier, price, and search.
- 🧮 **Cost estimator** — transparent CPM × Daily-Effective-Circulation math with adjustable
  campaign length and unit count, shown as a ± range with a clear "estimate, not a quote" notice.
- ❤️ **Save & compare** — favorite spaces and compare up to four side by side.
- ✉️ **Request info (no sale)** — note your interest locally; no payment, booking, or contact is made.

Runs on **iOS, Android, and the web (PC)** from a single Expo / React Native codebase.

## How the estimate works

```
impressions = daily reach (DEC) × days
cost        = (impressions ÷ 1,000) × CPM
```

CPM (cost per 1,000 views) is scaled by market size; a one-time production cost is added for printed
formats, and the result is shown as a ±15% range. Baselines come from published 2025 OOH figures.

## Tech stack

- **Expo** (SDK 56) + **React Native** + **TypeScript**, file-based routing via **Expo Router**
- **MapLibre GL** with **OpenFreeMap** tiles — free, no key (web: `maplibre-gl`; native: a WebView map)
- **Zustand** (+ AsyncStorage / localStorage) for favorites, compare, filters, and saved requests
- StyleSheet-based design system with light + dark themes

## Getting started

```bash
npm install
npx expo start        # press w for web (PC), or open in Expo Go on your phone
```

Other useful commands:

```bash
npm run web                 # web dev server
npx expo export -p web      # static web build in ./dist (deployable to any static host)
npx tsc --noEmit            # type check
```

## Project structure

```
src/
  app/                 # screens (Expo Router): (tabs)/, listing/[id], compare
  components/          # UI primitives, map (web + native), cards, estimator, forms
  data/                # types, ad-format defs, market tiers, curated sample listings
  lib/                 # estimator, formatting, filtering, persisted store
  constants/theme.ts   # design tokens (light/dark)
```

## Roadmap

Budget mode, reach/frequency planning, shareable campaign plans, real OOH inventory integration,
and app-store builds via EAS.

---

> Estimates are illustrative and based on public industry averages. They are not quotes or offers.
> Confirm availability and pricing with media owners directly.
