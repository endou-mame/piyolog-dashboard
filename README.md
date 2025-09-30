# Piyolog Dashboard

A data analysis dashboard for Piyolog baby tracking app exports, built on Cloudflare Workers.

## Tech Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS + Vite
- **Backend**: Cloudflare Workers + Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **Charts**: Chart.js + react-chartjs-2
- **State Management**: Zustand

## Development

### Prerequisites

- Node.js 18+ and pnpm
- Wrangler CLI (`pnpm add -g wrangler`)
- Cloudflare account (for D1 database)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create D1 database:
```bash
wrangler d1 create piyolog-dashboard-db
```

3. Update `wrangler.toml` with the database ID from the previous command output.

4. Apply database schema locally:
```bash
wrangler d1 execute piyolog-dashboard-db --local --file=./schema.sql
```

5. (Optional) Load seed data for development:
```bash
wrangler d1 execute piyolog-dashboard-db --local --file=./seed.sql
```

6. Apply schema to production database (after deployment):
```bash
wrangler d1 execute piyolog-dashboard-db --file=./schema.sql
```

7. Set the dashboard password:
```bash
wrangler secret put DASHBOARD_PASSWORD
```

### Run Development Server

```bash
pnpm dev
```

Access the app at http://localhost:5173

### Deploy

```bash
pnpm build
pnpm deploy
```

## Project Structure

```
src/
├── client/          # React frontend
├── worker/          # Cloudflare Workers backend
├── types/           # Shared TypeScript types
└── lib/             # Shared utilities
```

## License

ISC