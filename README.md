# feedTune — Modern RSS & YouTube Feed Manager

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Zustand](https://img.shields.io/badge/Zustand-FFCC00)](https://zustand-bear.github.io/)

feedTune is a subscription management app that lets you follow RSS feeds and YouTube channels in one place. Built with Next.js App Router, Supabase, and a glassmorphism UI.

---

## Features

- **RSS Feed Management** — Add, categorize, and follow RSS feeds from any website.
- **YouTube RSS Integration** — Track YouTube channels via the YouTube Data API v3.
- **Favorites & Read Later** — Save articles or videos for quick access.
- **Dark / Light Theme** — Class-based theming via `next-themes`.
- **Multi-Language Support** — English and Turkish (i18next + react-i18next).
- **Responsive Design** — Works on desktop and mobile.
- **Glassmorphism UI** — Consistent glass-effect styling across the app.
- **Cron-based Cleanup** — Automated cleanup jobs triggered by Vercel Cron.

---

## Tech Stack

| Layer | Libraries |
|---|---|
| Framework | Next.js (App Router), React 18 |
| Styling | Tailwind CSS, tailwindcss-animate, Geist font |
| UI Components | shadcn/ui, Radix UI, Lucide React, Framer Motion |
| State | Zustand (`useAuthStore`, `useFeedStore`, `useSettingsStore`) |
| Data Fetching | TanStack Query v5 (staleTime: 10 min, gcTime: 1 hr) |
| Forms | react-hook-form + Zod |
| Auth & DB | Supabase (PostgreSQL + RLS) |
| i18n | i18next, react-i18next |
| Feed Parsing | rss-parser (proxied via `/api/feed-proxy`) |
| Utilities | date-fns, axios, flag-icons |

---

## Project Structure

```
src/
├── app/               # Next.js App Router pages and API routes
├── components/
│   ├── core/          # Layout shells, loading/error states, base UI primitives
│   ├── features/      # Feature-specific components (auth, feeds, navigation…)
│   ├── shared/        # Reusable cards and containers
│   └── public-home/   # Landing page (unauthenticated)
├── lib/               # Auth helpers, API utilities, Supabase clients, schema
├── locales/           # i18n translation files (en/, tr/)
├── providers/         # AppProvider: QueryProvider → LanguageProvider → ThemeProvider → AuthProvider
└── store/             # Zustand stores
```

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or Yarn
- A Supabase project
- A YouTube Data API v3 key

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Sselimkoc/feedTune.git
   cd feedTune
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   YOUTUBE_API_KEY=your_youtube_data_api_v3_key
   ```

   > `SUPABASE_SERVICE_ROLE_KEY` is server-only and bypasses RLS. Never expose it on the client.

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:3000`.

### Available Commands

```bash
npm run dev     # Start development server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

---

## Database

Supabase (PostgreSQL) with the following key tables:

`users` · `categories` · `feeds` · `rss_items` · `youtube_items` · `user_interactions` · `tags` · `search_history`

Full schema: `src/lib/schema.sql`

---

## Authentication

- **Server-side**: `getSecureUser()` reads and verifies the Supabase session from cookies. All API routes are wrapped with `withAuth()`.
- **Client-side**: Zustand `useAuthStore` persists auth state via the Supabase browser client.
- Route protection is handled server-side by `withAuth()` — no `middleware.js`.

---

## Deployment

Deploy to [Vercel](https://vercel.com/) for automatic Cron job support. Add all four environment variables to your Vercel project settings.

---

## Contributing

Issues and pull requests are welcome. Please open an issue first for major changes.

---

## License

MIT License. See the `LICENSE` file for details.
