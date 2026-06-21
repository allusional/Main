# RateMyCondo — Planning Doc

> A "Glassdoor for condos & apartments." Renters and buyers research a building's
> management, noise, amenities, maintenance, safety, and value *before* they move in —
> and can also look up the **property management company** that runs it.
>
> **MVP market:** Greater Toronto Area (GTA)
> **MVP scope:** Condo buildings + rental apartment buildings + management companies
> **Stack:** Next.js + PostgreSQL (Supabase)
> **Trust model:** Email signup + moderation queue
> **Decided:** No review scraping · Google Maps/Places · Houses deferred to a later phase

---

## 1. Product in one sentence

A searchable directory of GTA residential buildings — and the companies that manage them —
where each entity has an aggregate score built from structured, multi-dimensional resident
reviews, so a prospective tenant/owner can compare on the things that matter day-to-day.

### Core user stories (MVP)
- As a mover, I can **search** for a building by name, address, or neighbourhood and see it on a map.
- As a mover, I can open a **building profile** and see aggregate scores per category, amenities, reviews, and **who manages it**.
- As a mover, I can open a **management-company profile** and see how it's rated *across all the buildings it runs*.
- As a resident, I can **write a structured review** of my building (and rate its management).
- As a resident, I can **sign up with email** and manage my reviews.
- As an admin, I can **moderate** reviews in a queue and act on reported content.

### Explicitly OUT of MVP (later phases)
- **Houses / individual-landlord reviews** (deferred — see §5)
- Verified-resident proof (lease/utility upload)
- Building-vs-building comparison view
- Neighbourhood data (transit, crime, walkability) overlays
- Property-manager "claim your building" / response feature
- Mobile apps

---

## 2. The rating model (what makes this useful)

Reviews are **structured**, not just star + text.

**Building review dimensions (1–5):**

| Category | What it captures |
|---|---|
| Management & responsiveness | How fast/fairly issues get handled |
| Noise | Neighbours, street, mechanical, soundproofing |
| Maintenance & cleanliness | Common areas, elevators, repairs |
| Amenities | Gym, pool, party room, parking — quality not just presence |
| Building & unit quality | Construction, finishes, age, reliability |
| Safety & security | Concierge, access control, neighbourhood feel |
| Value for money | Rent/fees vs what you get |

Each building review also has: title, free-text body, **pros / cons**, tenure
(move-in/out or "current"), unit type, optional rent band.

**Management-company review dimensions (1–5):** responsiveness, fee/financial transparency,
fairness & professionalism, communication, issue resolution. A company's headline score is
also informed by the management ratings rolled up from all the buildings it operates.

**Amenities** are a structured list on the building (checkboxes): gym, pool, sauna, party
room, guest suite, concierge, EV charging, parking, locker, pet spa, etc.

---

## 3. Tech stack (confirmed)

- **Framework:** Next.js (App Router) + TypeScript — SSR/SSG matters for SEO (building &
  company pages need to rank for "X building reviews").
- **DB:** PostgreSQL with **PostGIS** on **Supabase** (bundles Postgres + Auth + Storage + PostGIS).
- **ORM:** **Prisma** (fast to build, great DX).
- **Auth:** **Supabase Auth** (or Auth.js) with email **magic links** — lowest friction that
  still gives a real identity to attach reviews to and rate-limit.
- **Maps & geocoding:** **Google Maps + Places API.**
  - ⚠️ *Terms note:* Google restricts long-term storage of Places data — cache the `place_id`,
    treat Google as the geocoding source, and store our own canonical address + coords keyed by
    `place_id` for refresh. Budget for billing (pay-per-load beyond the free credit).
- **Search:** Postgres full-text + trigram (`pg_trgm`) for MVP; upgrade to Typesense/Algolia later.
- **Images:** Supabase Storage for review/building photos.
- **Hosting/CI:** Vercel (app) + Supabase (DB). GitHub Actions for lint/test/typecheck.

---

## 4. Data model (first cut)

```
users            id, email, display_name, role(user|admin), created_at, banned_at

mgmt_companies   id, slug, name, website, created_at        (reviewable entity)

buildings        id, slug, name, address, city, postal_code,
                 lat, lng, geom(geography), building_type(condo|rental|coop),
                 year_built, num_units, num_floors,
                 developer, mgmt_company_id,
                 google_place_id, source(google|osm|user), claimed_by,
                 created_at, updated_at

amenities        id, name, icon                              (lookup)
building_amenities  building_id, amenity_id

reviews          id, author_id, target_type(building|company), target_id,
                 -- building ratings (null for company reviews)
                 r_management, r_noise, r_maintenance, r_amenities,
                 r_quality, r_safety, r_value,
                 -- company ratings (null for building reviews)
                 c_responsiveness, c_transparency, c_fairness,
                 c_communication, c_resolution,
                 overall (computed), title, body, pros, cons,
                 unit_type, tenure_start, tenure_end, rent_band,
                 status(pending|published|rejected), created_at

review_votes     review_id, user_id, helpful(bool)
reports          id, review_id, reporter_id, reason, status, created_at
moderation_log   id, review_id, admin_id, action, note, created_at
```

Reviews use a **polymorphic target** (`target_type` + `target_id`) so the same pipeline,
moderation queue, and voting serve both buildings and management companies. Aggregate scores
per entity are computed (materialized view or cached column updated on review publish) so
pages stay fast.

---

## 5. GTA data sourcing & the cold-start problem

**Decided: no scraping of third-party reviews.** (Scraping Google/Yelp/Rentals.ca reviews
violates their ToS, the text is copyrighted, it triggers PIPEDA privacy concerns, and scraped
reviews aren't tied to *our* verified accounts — undermining the trust we're selling.)

**Legal seeding plan:**

1. **Seed building *shells* (metadata only)** so search/maps aren't empty:
   - **Google Places API** for name + address + lat/lng (store `place_id`, per §3 terms note).
   - **OpenStreetMap** (ODbL — bulk import OK with attribution).
   - **City of Toronto / Ontario Open Data** (building & development datasets).
2. **Seed management companies** from public sources (company sites, condo board records) and
   link buildings → companies as we learn them.
3. **Bootstrap reviews organically:** outreach in r/TorontoRealEstate, r/askTO, condo Facebook
   groups/Discords; a small launch incentive; personal network for the first ~50 buildings.
4. Let users **add or claim** a building/company not in our seed set.

### Houses — deferred (and why)
A single house = reviewing one **identifiable private landlord at a specific address**
(defamation + PIPEDA + doxxing risk), and it gets ~1 review ever, so the aggregation that makes
buildings trustworthy breaks down. We'll revisit houses in a later phase, likely modelled as
**landlord reviews** (attached to a landlord entity, exact unit not shown publicly) with proper
guardrails — not as raw address listings.

---

## 6. Trust, moderation & legal safety

- **Auth:** email magic link → every review tied to an account.
- **Review lifecycle:** `pending` → automated checks (rate-limit, profanity, spam/dup detection,
  one-review-per-user-per-target) → auto-publish low-risk OR route to manual queue →
  `published` / `rejected`.
- **Reporting:** any user can flag a review; flagged items surface in the admin queue.
- **Admin dashboard:** queue, approve/reject with note, ban user, edit building/company data.
- **Defamation guardrails:** ToS + review guidelines — review the *building/company*, not named
  individuals; opinions framed as lived experience; clear takedown process. Worth a quick legal
  review before launch given Canadian defamation law.
- **Future trust tier:** optional "Verified Resident" badge via email domain / lease upload.

---

## 7. Pages / routes

```
/                       home: hero search + map + top-rated buildings & companies
/search?q=&bounds=      results list synced with map + filters (type, amenities, min score)
/building/[slug]        profile: scores, amenities, photos, reviews, manager link, review CTA
/company/[slug]         management-company profile: cross-building score + reviews
/building/[slug]/review building review form (auth-gated)
/company/[slug]/review  company review form (auth-gated)
/buildings/new          add a missing building
/account                my reviews / account
/auth/signin            magic-link sign in
/admin                  moderation queue + building/company edits (role-gated)
```

---

## 8. Phased build roadmap

| Phase | Deliverable |
|---|---|
| **0. Foundations** | Next.js + TS scaffold, Supabase Postgres/PostGIS, Prisma, auth skeleton, CI, deploy to Vercel |
| **1. Buildings + companies data** | Schema + seed script importing GTA building shells (Google/OSM) and management companies |
| **2. Discovery (read-only)** | Search + Google map + building & company profile pages (SSG/SSR for SEO) |
| **3. Reviews** | Auth, structured review forms (building + company), aggregate scores, helpful votes |
| **4. Trust** | Moderation queue, reporting, admin dashboard, rate-limiting/spam checks |
| **5. Polish** | Photos, filters, SEO metadata + sitemaps, empty-state UX, analytics |
| **6. Later** | Houses/landlord reviews, verified residents, comparison view, neighbourhood overlays, manager responses |

---

## 9. Resolved decisions

1. ✅ **Scraping:** none — metadata-seed + organic reviews.
2. ✅ **Scope:** condo + rental apartment buildings + management companies; houses deferred.
3. ✅ **Maps:** Google Maps/Places (with `place_id` caching strategy).
4. ✅ **DB/host:** Supabase + Vercel.
5. ✅ **Name:** RateMyCondo.

**Next step:** scaffold Phase 0 (Next.js + Supabase + Prisma + auth skeleton + CI) on approval.
