# Personal Finance Manager — Frontend

A modern single-page application for managing personal finances, built with **Angular 20**, **Angular CDK**, and standalone component architecture. Consumes the [Personal Finance Manager API](../api/README.md).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 20.3 |
| Language | TypeScript 5.9 |
| UI Components | Angular CDK 20.2 + Angular Material 20.2 |
| Reactivity | Angular Signals + RxJS 7.8 |
| HTTP | Angular HttpClient with functional interceptors |
| Testing | Jasmine 5.9 + Karma 6.4 |
| Build | Angular CLI 20.3 |

---

## Features

| Route | Description |
|---|---|
| `/dashboard` | Total balance, monthly summary, 13-month cashflow projection, recent transactions |
| `/accounts` | Manage bank accounts (CHECKING, SAVINGS, CASH) — create, edit, delete, view balance |
| `/accounts/:id` | Account detail with balance and last 10 transactions |
| `/categories` | Manage INCOME and EXPENSE categories |
| `/projects` | Manage expense projects (e.g. trips, renovations) with financial summary |
| `/extrato` | Unified statement feed — posted transactions, transfers, and upcoming scheduled bills with infinite scroll |
| `/transactions` | Transactions list with filters (account, type, date range) — create, edit, delete |
| `/scheduled-bills` | Manage future bills and income — create, edit, post (converts to transaction), delete |
| `/transfers` | List and create transfers between accounts |
| `/reports` | Monthly expense report by category and income/expense summary |

---

## Architecture

```
src/app/
├── features/           # Route-level components (one folder per route)
├── core/
│   ├── models/         # TypeScript interfaces (Account, Transaction, etc.)
│   ├── services/       # API service layer (one service per resource)
│   └── interceptors/   # HTTP interceptors (base URL, loading, error)
├── shared/
│   ├── components/     # Reusable UI (shell, dialogs, paginator, toast, empty state)
│   ├── pipes/          # FinancialAmountPipe (USD formatting)
│   └── services/       # Dialog, Toast, Loading, Refresh services
├── app.routes.ts       # Lazy-loaded route definitions
├── app.config.ts       # App providers (router, HttpClient, interceptors, locale)
└── environments/       # API base URL per environment
```

**Key architectural choices:**
- **Standalone components** — no NgModules
- **Lazy loading** — every route is lazy-loaded
- **Signals** — reactive local state without RxJS Subjects
- **OnPush change detection** — all components
- **inject() syntax** — constructor-free dependency injection
- **takeUntilDestroyed()** — automatic subscription cleanup

---

## HTTP Interceptors

| Interceptor | What it does |
|---|---|
| `apiBaseInterceptor` | Prepends `environment.apiBaseUrl` to every relative request |
| `loadingInterceptor` | Shows global spinner (150ms delay to avoid flicker) |
| `errorInterceptor` | 404 → rethrows for local handling; 500+ → "Server unavailable"; others → extracts `error.message` |

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- API running (see [api/README.md](../api/README.md))

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at **http://localhost:4200** and auto-reloads on file changes.

By default the dev environment points to `http://localhost:3002`. If your API runs on a different port, update `src/environments/environment.ts`:

```typescript
export const environment = {
  apiBaseUrl: 'http://localhost:3000',
  production: false,
};
```

---

## Available Scripts

```bash
npm start         # Development server → http://localhost:4200
npm run build     # Production build → dist/
npm run watch     # Incremental build in watch mode
npm test          # Unit tests (Karma + Jasmine, requires Chrome)
```

---

## Key Design Patterns

### Dialogs

All create/edit forms open as CDK dialogs via the shared `DialogService`:

```typescript
const ref = this.dialog.open(MyFormDialogComponent, { data: { item } });
ref.closed.subscribe(result => { if (result) this.load(); });
```

### Idempotency

Financial write operations (create transaction, scheduled bill, transfer) send a `crypto.randomUUID()` as `Idempotency-Key` header — preventing duplicates on retries or double-clicks.

### Global Refresh

`RefreshService.emit()` signals all subscribed components (dashboard, statement, transactions) to reload their data after a mutation.

### Statement — Extrato

The `/extrato` route uses **bidirectional infinite scroll** via `IntersectionObserver`:
- Scrolling up loads older posted records (`past` mode)
- Scrolling down loads upcoming scheduled bills (`future` mode)
- Initial load fetches both in a single request (`initial` mode)

### Monetary values

All amounts come from the API as strings to avoid floating-point issues. The `FinancialAmountPipe` formats them as USD:

```html
{{ transaction.amount | financialAmount }}  →  "$1,200.50"
```

---

## Environment Variables

| File | Used for |
|---|---|
| `src/environments/environment.ts` | Development — set `apiBaseUrl` to match your local API port |
| `src/environments/environment.prod.ts` | Production — `apiBaseUrl: ''` uses relative URLs |
