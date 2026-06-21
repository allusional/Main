# CondoScore — Planning Doc

> A "Glassdoor for condos & apartments." Renters and buyers research a building's
> management, noise, amenities, maintenance, safety, and value *before* they move in.
>
> **MVP market:** Greater Toronto Area (GTA)
> **Stack:** Next.js + PostgreSQL
> **Trust model:** Email signup + moderation queue

---

## 1. Product in one sentence

A searchable directory of GTA residential buildings where each building has an
aggregate score built from structured, multi-dimensional resident reviews — so a
prospective tenant/owner can compare buildings on the things that actually matter
day-to-day.

### Core user stories (MVP)
- As a mover, I can **search** for a building by name, address, or neighbourhood and see it on a map.
- As a mover, I can open a **building profile** and see aggregate scores per category, amenities, and resident reviews.
- As a resident, I can **write a structured review** (ratings + pros/cons + free text + how long I lived there).
- As a resident, I can **sign up with email** and manage my reviews.
- As an admin, I can **moderate** reviews in a queue and act on reported content.

### Explicitly OUT of MVP (later phases)
- Verified-resident proof (lease/utility upload)
- Building-vs-building comparison view
- Neighbourhood data (transit, crime, walkability) overlays
- Property-manager "claim your building" / response feature
- Mobile apps

---

## 2. The rating model (what makes this useful)

Reviews are **structured**, not just star + text. Proposed 1–5 dimensions:

| Category | What it captures |
|---|---|
| Management & responsiveness | How fast/fairly issues get handled |
| Noise | Neighbours, street, mechanical, soundproofing |
| Maintenance & cleanliness | Common areas, elevators, repairs |
| Amenities | Gym, pool, party room, parking — quality not just presence |
| Building & unit quality | Construction, finishes, age, reliability |
| Safety & security | Concierge, access control, neighbourhood feel |
| Value for money | Rent/fees vs what you get |

Each review also has: overall score (derived or explicit), title, free-text body,
**pros / cons**, tenure (move-in/out or "current"), unit type, and rent band (optional).

**Amenities** are a separate structured list on the building (checkboxes): gym, pool,
sauna, party room, guest suite, concierge, EV charging, parking, locker, pet spa, etc.

---

## 3. Tech stack (confirmed direction)

- **Framework:** Next.js (App Router) + TypeScript — SSR/SSG is important here for SEO
  (building pages need to rank in Google for "X building reviews").
- **DB:** PostgreSQL with **PostGIS** extension (for map-bounds + radius queries).
  Hosted on **Supabase** or **Neon**.
- **ORM:** **Prisma** (fast to build, great DX). Drizzle is the alternative if we want
  lighter/edge-friendly queries — recommending Prisma for MVP speed.
- **Auth:** **Auth.js (NextAuth)** with email **magic links** — no passwords, lowest friction
  that still gives us a real identity to attach reviews to and rate-limit.
- **Maps:** **Mapbox GL JS** (generous free tier, good vector maps). Geocoding via Mapbox.
  Google Maps/Places is the alternative (better POI data, higher cost).
- **Search:** Postgres full-text + trigram (`pg_trgm`) for MVP. Upgrade to Typesense/Algolia
  if/when needed.
- **Images:** Supabase Storage (or Cloudinary) for review/building photos.
- **Hosting/CI:** Vercel (app) + Supabase/Neon (DB). GitHub Actions for lint/test/typecheck.

---

## 4. Data model (first cut)

```
users            id, email, display_name, role(user|admin), created_at, banned_at
buildings        id, slug, name, address, city, postal_code,
                 lat, lng, geom(geography), building_type(condo|rental|coop),
                 year_built, num_units, num_floors,
                 developer, management_company_id, source(osm|places|user), claimed_by,
                 created_at, updated_at
amenities        id, name, icon            (lookup)
building_amenities  building_id, amenity_id
mgmt_companies   id, name, slug
reviews          id, building_id, user_id,
                 rating_management, rating_noise, rating_maintenance,
                 rating_amenities, rating_quality, rating_safety, rating_value,
                 overall (computed), title, body, pros, cons,
                 unit_type, tenure_start, tenure_end, rent_band,
                 status(pending|published|rejected), created_at
review_votes     review_id, user_id, helpful(bool)
reports          id, review_id, reporter_id, reason, status, created_at
moderation_log   id, review_id, admin_id, action, note, created_at
```

Aggregate scores per building are computed (materialized view or a cached column updated
on review publish) so building pages are fast.

---

## 5. GTA data sourcing & the cold-start problem ⚠️

You asked: *"we should try and scrape initial reviews for the main properties too, right?"*
**My recommendation: do NOT scrape third-party reviews to seed the site.** This is the
biggest legal risk in the project, and I want to be clear about it before we build anything:

- Scraping Google/Yelp/Rentals.ca/RentCafe reviews almost always **violates their Terms of
  Service**, and they actively block it.
- Review **text is copyrighted** by the author/platform — republishing it is infringement.
- It raises **privacy issues** (PIPEDA in Canada) and would poison our own trust/quality story.
- Reviews scraped from elsewhere aren't tied to *our* verified accounts, so they undermine
  the exact "is this trustworthy?" value we're selling.

**What we CAN do legally to avoid an empty site:**

1. **Seed building *shells* (metadata only)** so search/maps aren't empty. Legal sources:
   - **OpenStreetMap** (ODbL license — bulk import OK with attribution).
   - **City of Toronto / Ontario Open Data** (some building & development datasets).
   - **Mapbox/Google Places API** for name + address + lat/lng (per their API terms; this is
     metadata, not reviews).
2. **Bootstrap reviews organically** (the legitimate version of "seeding"):
   - Outreach in r/TorontoRealEstate, r/askTO, condo Facebook groups, Discords.
   - A small launch incentive ("review your building, enter a draw").
   - Personal network / friends in GTA condos for the first ~50 buildings.
3. Let users **add or claim a building** that isn't in our seed set.

> Decision needed from you: confirm we go the **metadata-seed + organic-reviews** route.
> If you specifically want to ingest reviews, the only clean path is content we're *licensed*
> to use (e.g. a data partnership) — not scraping. I'll plan around the compliant route unless
> you tell me otherwise.

---

## 6. Trust, moderation & legal safety

- **Auth:** email magic link → every review tied to an account.
- **Review lifecycle:** `pending` → automated checks (rate-limit, profanity, spam/dup
  detection, one-review-per-user-per-building) → auto-publish low-risk OR route to manual
  queue → `published` / `rejected`.
- **Reporting:** any user can flag a review; flagged items surface in the admin queue.
- **Admin dashboard:** queue, approve/reject with note, ban user, edit building data.
- **Defamation guardrails:** ToS + review guidelines — review the *building/management*, not
  named individuals; opinions framed as experience; takedown process. (Worth a quick legal
  review before launch given Canadian defamation law.)
- **Future trust tier:** optional "Verified Resident" badge via email domain / lease upload.

---

## 7. Pages / routes

```
/                       home: hero search + map + top-rated buildings
/search?q=&bounds=      results list synced with map + filters (type, amenities, min score)
/building/[slug]        profile: scores, amenities, photos, reviews, "write a review" CTA
/building/[slug]/review review form (auth-gated)
/buildings/new          add a missing building
/account                my reviews / account
/auth/signin            magic-link sign in
/admin                  moderation queue + building edits (role-gated)
```

---

## 8. Phased build roadmap

| Phase | Deliverable |
|---|---|
| **0. Foundations** | Next.js + TS scaffold, Postgres/PostGIS, Prisma, Auth.js skeleton, CI, deploy to Vercel |
| **1. Buildings data** | Schema + seed script importing GTA building shells from OSM/Places |
| **2. Discovery (read-only)** | Search + Mapbox map + building profile pages (SSG/SSR for SEO) |
| **3. Reviews** | Auth, structured review form, aggregate score computation, helpful votes |
| **4. Trust** | Moderation queue, reporting, admin dashboard, rate-limiting/spam checks |
| **5. Polish** | Photos, filters, SEO metadata + sitemaps, empty-state UX, analytics |
| **6. Later** | Verified residents, building comparison, neighbourhood overlays, manager responses |

---

## 9. Open questions before we start Phase 0

1. **Scraping stance** — confirm metadata-seed + organic-reviews (see §5).
2. **Maps provider** — Mapbox (recommended) vs Google Maps/Places?
3. **Building scope** — condos only, or also rental apartment buildings (and houses)?
4. **Hosted Postgres** — Supabase (auth+storage+PostGIS bundled) vs Neon?
5. **Project name** — "CondoScore" is a placeholder.
