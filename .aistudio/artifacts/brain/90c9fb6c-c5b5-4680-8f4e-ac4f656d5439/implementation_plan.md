# CinNova — Online Movie Ticket Booking System

CinNova is an online movie ticket booking web application modeled after modern cinema ticketing platforms, featuring a floating dynamic showcase banner, a 30-movie TMDB-powered catalog grid, an interactive theater seat selection dashboard, and an integrated multi-mode payment gateway. Built for academic micro-project evaluation, it includes a ready-to-connect Express backend API layer and TMDB v3 schema integration with seamless fallback data so mentors can review the complete booking lifecycle immediately.

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the following design and integration choices before implementation begins:
> - **Electric Cobalt Blue & Acid Lime Contrast Strategy**: Pure neon cobalt text on Midnight Black can strain legibility for long descriptions. By default, **Midnight Black** (`#06080F`) will serve as the primary canvas, **Electric Cobalt Blue** (`#3B82F6` / `#60A5FA`) will anchor primary headings, structural UI text, and interactive controls, **Acid Lime** (`#BEF264`) will highlight active selections, ratings, seats, and primary CTAs, and crisp cool slate (`#E2E8F0`) will support dense secondary copy where needed. Toggling to **Light Mode** switches to a crisp cool-white canvas (`#F4F7FC`) with deep cobalt (`#1D4ED8`) and high-contrast lime accents (`#65A30D` / `#BEF264` with dark ink).
> - **TMDB Database + Custom Backend Readiness**: The frontend will communicate through a clean REST service layer backed by an Express server proxy. When a `TMDB_API_KEY` environment variable is supplied, movies, genres, and search queries fetch live from TMDB v3; when absent (such as during immediate teacher/mentor review), the server serves a TMDB-schema-identical 30-film catalog with locally generated high-resolution posters so zero broken images or API errors occur.
> - **Logo Slot**: A dedicated custom logo container will be placed in the header with a clean geometric fallback mark and clear drop-in replacement support so you can insert your custom CinNova logo image at any time.

---

## 1. Overview & Core Concept

- **What It Does**: Allows moviegoers to search films, switch cities, browse genres, explore dynamic promotional banners, pick showtimes, select specific theater seats on a tiered seating map, pay via simulated UPI, Card, Net Banking, or Wallet options, and receive a digital ticket confirmation.
- **Target Audience / Persona**: Cinema-goers booking tickets online, alongside faculty/mentors evaluating full-stack architecture, UI craft, TMDB API schema compatibility, and end-to-end booking state management.
- **Key Value**: Combines an authentic BookMyShow-style browsing experience with a responsive seat dashboard, clear payment breakdown, and clean REST API contracts ready for database/backend expansion.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Discovery & Filtering**: User lands on CinNova, views the floating animated advertisement showcase, selects their city, searches by title, or filters movies via the category navigation bar below the header.
  2. **Authentication**: Clicking "Sign In" opens an interactive authentication modal supporting user sign-in/registration via backend endpoints plus a one-click demo student/reviewer account for rapid mentor testing.
  3. **Movie Detail & Showtime Selection**: Clicking any poster in the 5-column (5–6 row) recommended grid opens the movie detail & showtime sheet for the active city (selecting cinema, format like 2D/IMAX/4DX, date, and showtime).
  4. **Seat Selection Dashboard**: Interactive theater layout showing screen curvature, tiered rows (Recliner, Prime, Classic), real-time seat states (Available, Selected in Acid Lime, Occupied), tabular price calculation, and seat count enforcement.
  5. **Payment Gateway & Digital Ticket**: Multi-tab checkout (UPI, Credit/Debit Card, Net Banking, Wallets) with form validation, convenience fee + tax breakdown, and instant confirmed booking pass saved to "My Bookings".

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast neo-cinema storefront with crisp architectural grids, dark-first nocturnal atmosphere, and clean single-elevation cards.
  - *Color Palette & Mood*:
    - **Dark Theme (Default)**: Midnight Black canvas (`--background: #06080F`), elevated Obsidian cards (`--surface: #0D1220`), Electric Cobalt Blue (`--primary-text: #60A5FA` / `#3B82F6`), Acid Lime highlights & CTAs (`--accent: #BEF264` with `#06080F` button ink).
    - **Light Theme (Toggleable)**: Cool Alabaster canvas (`--background: #F4F7FC`), crisp white cards (`--surface: #FFFFFF`), Deep Cobalt Blue (`--primary-text: #1E40AF`), and high-contrast Lime highlight badges/buttons (`--accent: #BEF264` / `#4D7C0F`).
  - *Typography & Hierarchy*: `Plus Jakarta Sans` or `Outfit` for bold geometric display headings, `DM Sans` for crisp body scannability, and `JetBrains Mono` with `tabular-nums` for seat codes, showtimes, ticket counts, and prices.
  - *Component Styling & Layout*:
    - **Header**: CinNova logo slot + wordmark, live search input, city selector dropdown, theme toggle (Light/Dark), and Sign In / Profile button.
    - **Category Nav Bar**: Single-line scrollable genre/category tabs (`All Movies`, `Now Showing`, `Action & Sci-Fi`, `Drama`, `Thriller`, `Comedy`, `Animation`, `Upcoming`) plus quick access to `My Bookings`.
    - **Floating Advertisement Section**: Centered floating carousel container with dynamic Framer Motion (`motion/react`) slide + scale transitions, subtle backdrop blur, auto-play with pause-on-hover, and direct "Book Tickets" action.
    - **Recommended Movies Grid**: Uniform 5-column desktop grid (`5 × 6 = 30 movies` across 6 rows), `2:3` poster aspect ratio, smooth hover elevation + scrim reveal (rating, genre, language, quick book button), and clean unboxed metadata (`Genre · Runtime · Rating`).
    - **Footer**: CinNova branding, `"Created by Neon"`, copyright notice (`© 2026 CinNova`), and a compact `"API & Mentor Guide"` trigger summarizing TMDB/Backend endpoints for evaluators.

- **Interactive Feedback & Motion**:
  - Floating ad transitions use GPU-composited `transform` and `opacity` animations.
  - Poster cards respond within 180ms on hover with subtle upward lift, border highlight in Electric Cobalt / Acid Lime, and overlay reveal.
  - Loading skeletons for TMDB search/filter states, clear empty-state reset buttons, and toast notifications on sign-in, seat lock, and booking confirmation.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Integrated Modal/Drawer Booking Flow vs. Separate Route Pages**
  - *Chosen Approach*: Multi-step interactive booking overlay/dashboard triggered directly from any movie poster or ad banner.
  - *Why*: Keeps mentors and users anchored in the storefront without losing search/city/filter context while still providing a dedicated full-width seat map and checkout experience.
  - *Alternatives Considered*: Separate browser URLs via a router, which adds navigation boilerplate for a micro-project showcase.

- **Decision 2: Express Backend Proxy + TMDB v3 Schema Adapter**
  - *Chosen Approach*: Run an Express API layer alongside the Vite frontend that speaks standard TMDB v3 JSON structures (`/movie/now_playing`, `/movie/popular`, `/search/movie`, `/genre/movie/list`) and manages shows, seat locks, auth, and bookings.
  - *Why*: Protects any future `TMDB_API_KEY` on the server side, satisfies the requirement to write backend-connected and TMDB-compatible code, and provides a configurable `VITE_API_BASE_URL` so you can swap in your own external backend effortlessly.
  - *Alternatives Considered*: Direct browser-to-TMDB calls, which expose API keys in client code and lack booking/seat persistence endpoints.

- **Decision 3: Locally Generated High-Resolution Poster Assets + TMDB Image Path Resolver**
  - *Chosen Approach*: Resolve TMDB `poster_path` values dynamically (`https://image.tmdb.org/t/p/w500/...` when live TMDB paths start with `/`, or local generated cinematic poster artwork for curated fallback items).
  - *Why*: Guarantees zero broken images during offline or unkeyed teacher evaluation while working natively with real TMDB image paths once configured.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CinNova React Frontend                           │
│                                                                         │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────────┐  │
│  │  Top Header Bar  │   │ Category Nav Bar │   │ Floating Ad Banner  │  │
│  │ (Logo, Search,   │   │ (Genres, Filter, │   │ (Dynamic Carousel   │  │
│  │  City, Auth,     │   │  My Bookings)    │   │  & Book CTA)        │  │
│  │  Light/Dark)     │   └────────┬─────────┘   └──────────┬──────────┘  │
│  └────────┬─────────┘            │                        │             │
│           └──────────────────────┼────────────────────────┘             │
│                                  ▼                                      │
│                    ┌───────────────────────────┐                        │
│                    │ Recommended Movies Grid   │                        │
│                    │ (5 Columns x 6 Rows = 30) │                        │
│                    └─────────────┬─────────────┘                        │
│                                  │ Click Movie / Book                   │
│                                  ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │               Interactive Booking Workspace                       │  │
│  │  [1. Showtimes] ──▶ [2. Seat Dashboard] ──▶ [3. Payment Gateway]  │  │
│  │                                                 │                 │  │
│  │                                                 ▼                 │  │
│  │                                     [4. Digital Ticket Pass]      │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │ Typed REST Client (API Base URL)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Express Backend API Layer                           │
│                                                                         │
│  ┌─────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │   TMDB Service Proxy    │   │    Booking & Auth Controllers       │  │
│  │  GET /api/tmdb/movies   │   │  POST /api/auth/login & /register   │  │
│  │  GET /api/tmdb/genres   │   │  GET  /api/shows/:movieId           │  │
│  │  GET /api/tmdb/search   │   │  POST /api/bookings                 │  │
│  └────────────┬────────────┘   │  GET  /api/bookings                 │  │
│               │                └──────────────────┬──────────────────┘  │
│               ▼                                   ▼                     │
│  ┌─────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │ TMDB v3 API (if keyed)  │   │  In-Memory / Pluggable Store        │  │
│  │ or Curated TMDB Catalog │   │  (Booked Seats, Users, Receipts)    │  │
│  └─────────────────────────┘   └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **TMDB Movie Entity**: Follows exact TMDB v3 shape (`id`, `title`, `overview`, `poster_path`, `backdrop_path`, `genre_ids`, `vote_average`, `vote_count`, `release_date`, `original_language`, `popularity`) extended cleanly with cinema metadata (`runtime_mins`, `certification`, `formats`).
  - **Theater & Show Entity**: Represents cinemas per city, screen types (`IMAX`, `4DX`, `Dolby Atmos`), showtimes, tier pricing (`Recliner`, `Prime`, `Classic`), and occupied seat coordinates (e.g., `A4`, `D7`).
  - **Booking Receipt Entity**: Stores `bookingId`, `userId`, `movieId`, `movieTitle`, `city`, `theaterName`, `showtime`, `seats[]`, `paymentMethod`, `totalAmount`, `status`, and `createdAt`.
  - **UI State**: Active theme (`dark` / `light`), selected city, active genre filter, search query, authenticated user session, and active booking wizard step.

- **Interactive Component & State Mapping**:
  - **Search & Category Bar**: Debounced search input and category buttons call the TMDB API client (`fetchMovies`) with loading skeleton feedback and empty-state recovery.
  - **Seat Selection Dashboard**: Clicking available seats toggles selection in state (up to 10 seats per booking), updates subtotal + convenience fee + GST in real time, and disables proceeding until at least 1 seat is picked.
  - **Payment Gateway**: Switching payment tabs (`UPI`, `Card`, `Net Banking`, `Wallet`) renders method-specific inputs with client-side validation before invoking `POST /api/bookings`, which locks the chosen seats in backend state so re-opening the same showtime reflects those seats as occupied.
  - **Theme & Auth Persistence**: Theme preference and user session persist smoothly across reloads, and `.dark` class toggling updates all semantic CSS variables cleanly without contrast collisions.
