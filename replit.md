# RIBS Farm (Lumion Farm)

## Overview

RIBS Farm is a Telegram Mini App built with Next.js that lets users "farm" RIBS coins through various mechanics. It's a gamified crypto-style earning app where users can claim coins on a timer, tap to earn, complete social media tasks, upgrade their earning rates, spin a wheel for rewards, refer friends, and compete on a leaderboard. The app is designed to run inside Telegram as a mini-app using the Telegram Apps SDK.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Next.js 15** with the App Router (`src/app/` directory structure) and Turbopack for development
- **React 19** with client-side rendering for most pages (`'use client'` directive)
- TypeScript throughout, though build errors are intentionally ignored (`ignoreBuildErrors: true`)
- Dark mode is the default (set via `className="dark"` on the `<html>` tag)

### Routing & Pages
The app uses Next.js App Router with these main routes:
- `/` — Loading/splash screen with progress bar, redirects to `/farm`
- `/farm` — Main earning page with claim timer, tap-to-earn, and upgrade system
- `/tasks` — Social media tasks for earning rewards
- `/referrals` — Referral link sharing and tracking
- `/leaderboard` — Top earners ranking table
- `/profile` — User stats and account info
- `/spin` — Spin-the-wheel reward game

All pages except the loading screen use `AppLayout` which provides a consistent container and a fixed bottom navigation bar.

### UI Component Library
- **shadcn/ui** components built on Radix UI primitives, stored in `src/components/ui/`
- **Tailwind CSS** with CSS variables for theming (HSL-based color system)
- **Lucide React** for icons
- Custom components in `src/components/ribs/` (app layout, bottom nav, RIBS icon, upgrade sheet, X/Twitter icon)
- Font: "Patrick Hand" (handwritten style) for both headlines and body text

### Data Layer
- **Supabase** is the backend database, accessed via `@supabase/supabase-js` client
- Client is initialized in `src/lib/supabase.ts` using environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Database schema (documented in `src/lib/supabase-schema.sql.ts`) includes:
  - `users` — Telegram user ID as primary key, RIBS balance, referral tracking
  - `tasks` — Earnable tasks with icons and links
  - `user_tasks` — Tracks which users completed which tasks
  - `upgrades` — Available upgrades with costs and levels
  - `user_upgrades` — Tracks user upgrade levels
- Data fetching and user sync logic lives in `src/lib/data.ts`

### Telegram Integration
- Uses `@telegram-apps/sdk-react` for Telegram Mini App SDK integration
- `TelegramProvider` wraps the entire app, initializes Telegram CSS variables, and syncs the Telegram user to Supabase on load
- User identity comes from Telegram launch parameters (user ID, username, first/last name)

### AI Integration
- **Genkit** with Google Generative AI plugin is set up in `src/ai/genkit.ts`
- Uses `googleai/gemini-2.5-flash` model
- Currently minimal/placeholder — `src/ai/dev.ts` is empty (flows would be imported there)

### Game Mechanics
- **Claim System**: Users claim RIBS every 2 hours (configurable via `CLAIM_DURATION_MS`)
- **Tap-to-Earn**: Daily tap limit (default 1000), each tap earns RIBS
- **Upgrade System**: Three upgrade types — faucet rate, tap power, tap energy — each with multiple levels and increasing costs
- **Spin Wheel**: Free and ad-based spins for random rewards
- **Referral System**: Users share invite links and earn from referrals
- **User Titles**: Rank titles based on total RIBS balance (Beginner → Legend)

### Image Handling
- Images are unoptimized (`unoptimized: true` in Next config)
- Remote image patterns allowed: placehold.co, unsplash, picsum.photos, and a Pinata IPFS gateway
- Avatar images use picsum.photos with seeded URLs

## External Dependencies

### Services & APIs
- **Supabase**: PostgreSQL database and backend (env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- **Telegram Mini Apps SDK**: User authentication and app embedding within Telegram
- **Google Generative AI (Gemini)**: AI capabilities via Genkit (likely needs `GOOGLE_API_KEY` or similar env var)
- **Pinata IPFS Gateway**: Image hosting at `gold-defensive-cattle-30.mypinata.cloud`

### Key NPM Packages
- `next` 15.5.9, `react` 19.x
- `@supabase/supabase-js` for database
- `@telegram-apps/sdk-react` for Telegram integration
- `genkit` + `@genkit-ai/google-genai` for AI
- `recharts` for charts
- `embla-carousel-react` for carousels
- `react-hook-form` + `@hookform/resolvers` + `zod` for forms
- `date-fns` for date formatting
- Full suite of `@radix-ui` primitives for UI components