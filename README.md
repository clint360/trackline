# TripCart

Premium intercity bus booking platform for Cameroon. Built with Next.js 15 (App Router), TypeScript, TailwindCSS, Framer Motion, Zod and React Hook Form.

## Routes

- `/` — Public booking flow (6-step wizard)
- `/admin` — Raw, functional CRUD panel
- `/dashboard` — Premium operator workspace (locked behind access code)
- `/ticket/[consignment]` — Public ticket lookup

## Demo access

- Dashboard access code: `TRIPCART2026`

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Notes

- Mocked APIs live under `app/api/*`.
- The dashboard persists to `localStorage` under the `tripcart:store:v1` key.
- Tickets are exportable as PNG and PDF.
- WhatsApp support button is wired to `wa.me/237600000000` (placeholder).
