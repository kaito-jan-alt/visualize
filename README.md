# Visualize

A small, local-first app for goal visualization — mental rehearsal of who you
are once a goal is true, not just the outcome itself.

No accounts, no server, no analytics. Everything — goals, sessions, journal
entries — stays in your browser's local storage. Nothing is ever sent
anywhere. You can export a backup file at any time and import it elsewhere.

## What it does

- **Map** — add goals and write who you are once each one is true. Connect
  goals that depend on each other.
- **Visualize** — a short guided session: a quick mood check-in, then prompts
  timed to a breathing ring and a closing bell. Three styles — *I see
  images*, *I just know things*, and *breath & body* — so it works whether or
  not you can picture things mentally (aphantasia-friendly).
- **Schedule** — put a future session on your actual calendar, exported as an
  `.ics` file your calendar app understands. No push notifications, no
  backend to send them from.
- **Journal** — whatever came up during a session, saved so you can look back
  on it.
- **Need relief now** — a fixed 5-4-3-2-1 grounding exercise for acute
  stress, separate from the regular practice flow.

Installable as a PWA; works offline once loaded.

## Running locally

```bash
npm install
npm run dev
```

```bash
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run lint
```

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, Zustand (with localStorage
persistence), React Flow (goal map), vite-plugin-pwa.

## Privacy

There is no backend. No data ever leaves your device — not goals, not
journal entries, not voice input (speech-to-text runs entirely through the
browser's on-device API). The only file I/O is the explicit Export/Import
buttons, which read/write a JSON file you control.

## License

MIT — see [LICENSE](./LICENSE).
