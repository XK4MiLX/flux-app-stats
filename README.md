# Flux App Analyzer

A Vue 3 application for analyzing app registrations on the Flux network. Set custom time periods and get detailed insights with interactive charts and statistics.

## Features

- **Custom Time Period Analysis**: Analyze app registrations from any start date/time to now or a specific end date
- **Real-time Data**: Fetches data directly from Flux API (`api.runonflux.io`)
- **Interactive Charts**:
  - Top 10 app owners (bar chart)
  - Instance distribution (doughnut chart)
  - Apps over time timeline
  - Category breakdown (pie chart)
- **Detailed Statistics**:
  - New apps count and rate
  - Total instances deployed
  - Multi-component apps
  - Block height range
  - Top contributors
- **Comprehensive Lists**:
  - All new apps with timestamps, heights, and owner info
  - Top 10 owners with app and instance counts

## Installation

```bash
cd flux-app-analyzer
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Set Start Date**: Choose the start date and time (in UTC) for your analysis
2. **Set End Date** (Optional): Leave empty to analyze until now, or set a specific end date
3. **Click Analyze**: The app will fetch data from the Flux API and display results

### Default Analysis

The app defaults to the AMA date (January 28, 2026 at 17:00 UTC) for quick analysis.

## Data Source

All data is fetched from the Flux public API:
- Endpoint: `https://api.runonflux.io/apps/permanentmessages`
- Filter: `type = 'fluxappregister'`
- Time range: User-specified

## Technology Stack

- **Vue 3**: Composition API with `<script setup>`
- **Vite**: Fast build tool and dev server
- **Chart.js**: Interactive charts
- **Vue-ChartJS**: Vue 3 wrapper for Chart.js

## App Categories

Apps are automatically categorized:
- WordPress
- Conduit
- Presearch
- Game Servers (Terraria, Valheim, Rust, etc.)
- Blockchain Nodes
- Other

## Screenshots

### Summary Cards
Shows key metrics: new apps, instances, multi-component apps, time period, block range, and contributors.

### Charts
- Bar chart for top app owners
- Doughnut chart for instance distribution
- Line chart showing apps registered over time
- Pie chart for app categories

### Lists
- Top 10 owners with detailed statistics
- All apps in chronological order with full details

## License

AGPL-3.0-or-later
