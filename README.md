<div align="center">

# 🌌 Night Sky Simulator

**A real-time, 3D night sky you can explore from any place, date, and time — right in your browser.**

[🇬🇧 English](README.md) · [🇹🇷 Türkçe](README.tr.md)

[![Live Demo](https://img.shields.io/badge/demo-live-4c9aff)](https://nevzatius.github.io/space/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black)](https://threejs.org/)

**[▶ Try it live](https://nevzatius.github.io/space/)**

</div>

---

## Overview

Night Sky Simulator renders an astronomically accurate view of the sky based on real orbital mechanics — not a static star map. Pick any location on Earth and any date/time (past, present, or future), and the app computes where every star, planet, and the Moon actually are, in real time, using [astronomy-engine](https://github.com/cosinekitty/astronomy).

## Features

- **3D interactive sky dome** — drag to look around; a live compass HUD tracks your heading.
- **Real star catalog** — thousands of stars rendered by true brightness and color, from the HYG catalog.
- **Constellations** — accurate line art and localized names (English/Turkish), clickable for details.
- **Sun, Moon & planets** — live phase, illumination, rise/set/transit times, and true sky position; a close-orbit "Approach Moon" camera mode with a high-resolution lunar texture.
- **Satellite tracking** — real-time TLE data for naked-eye-visible satellites (including the ISS), propagated with SGP4/SDP4.
- **Sky events** — upcoming conjunctions, eclipses, meteor showers, and aurora alerts.
- **Location tools** — device GPS, IP-based lookup, or pick-on-map/search, plus a light-pollution (Bortle scale) estimate for your sky.
- **Time travel** — scrub to any date/time to preview past or future skies.
- **Bilingual UI** — full English/Turkish interface, switchable at runtime.

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — dev server & build
- [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) / [@react-three/drei](https://github.com/pmndrs/drei)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) — Sun/Moon/planet positions and sky-event calculations
- [satellite.js](https://github.com/shashwatak/satellite-js) — satellite orbit propagation
- [react-leaflet](https://react-leaflet.js.org/) — location map
- [zustand](https://github.com/pmndrs/zustand) — app state
- [luxon](https://moment.github.io/luxon/) / [tz-lookup](https://www.npmjs.com/package/tz-lookup) — date, time & time zone handling

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

### Install & run

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

### Regenerating data catalogs

The star/constellation catalog and light-pollution map are generated from raw open datasets. You won't need this for normal development — only when the raw source data changes:

```bash
npm run build:catalog
npm run build:lightpollution
```

## Project Structure

```
src/
  components/   UI components (sky view, panels, map, menus, date/time)
  data/         Generated star/constellation/satellite data files
  hooks/        React hooks (live clock, satellites, sky events, …)
  i18n/         English/Turkish translation dictionaries and language state
  lib/          Astronomical calculations and utilities
  state/        Zustand global app state
  types/        Shared TypeScript types
scripts/        Build scripts that generate catalogs from raw datasets
```

## Data Sources & Licensing

See [CREDITS.md](CREDITS.md) for the open datasets, libraries, and license terms this project builds on (HYG catalog, d3-celestial, astronomy-engine, satellite.js, CelesTrak, Solar System Scope textures).

## Deployment

Pushes to `master` automatically build and deploy to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
