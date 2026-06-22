// Phase 2 data layer.
//
// These accessor functions are intentionally async and return UI-shaped view
// models, so swapping the mock store for real Prisma queries later is a drop-in
// change (the page/components don't change). Data below is invented sample data
// for development — not real reviews of real buildings.

export type BuildingType = "CONDO" | "RENTAL" | "COOP";

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  CONDO: "Condo",
  RENTAL: "Rental apartment",
  COOP: "Co-op",
};

// Building review subrating dimensions (1–5). `overall` is captured separately
// as an explicit reviewer-entered score, not a computed average.
export type BuildingDimension =
  | "quality"
  | "noise"
  | "maintenance"
  | "amenities"
  | "safety"
  | "management"
  | "concierge"
  | "location"
  | "value";

export const BUILDING_DIMENSIONS: {
  key: BuildingDimension;
  label: string;
  optional?: boolean;
}[] = [
  { key: "quality", label: "Building & unit quality" },
  { key: "noise", label: "Noise" },
  { key: "maintenance", label: "Maintenance & cleanliness" },
  { key: "amenities", label: "Amenities" },
  { key: "safety", label: "Safety & security" },
  { key: "management", label: "Management quality & service" },
  { key: "concierge", label: "Concierge quality & service", optional: true },
  { key: "location", label: "Location & neighbourhood" },
  { key: "value", label: "Value for money" },
];

// Management-company review dimensions (1–5).
export type CompanyDimension =
  | "responsiveness"
  | "transparency"
  | "fairness"
  | "communication"
  | "resolution";

export const COMPANY_DIMENSIONS: { key: CompanyDimension; label: string }[] = [
  { key: "responsiveness", label: "Responsiveness" },
  { key: "transparency", label: "Fee & financial transparency" },
  { key: "fairness", label: "Fairness & professionalism" },
  { key: "communication", label: "Communication" },
  { key: "resolution", label: "Issue resolution" },
];

export interface BuildingReview {
  id: string;
  author: string;
  title: string;
  body: string;
  pros?: string;
  cons?: string;
  unitType?: string;
  tenure?: string;
  createdAt: string;
  /** Explicit overall score (1–5), not an average of the subratings. */
  overall: number;
  /** Resident-reported monthly cost: condo fee or rent. Powers cost ranges. */
  monthlyCost?: number;
  /** Subratings; `concierge` may be absent for buildings without one. */
  ratings: Partial<Record<BuildingDimension, number>>;
}

export interface CompanyReview {
  id: string;
  author: string;
  title: string;
  body: string;
  createdAt: string;
  buildingName?: string;
  ratings: Record<CompanyDimension, number>;
}

export interface Building {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  lat: number;
  lng: number;
  buildingType: BuildingType;
  yearBuilt?: number;
  numUnits?: number;
  numFloors?: number;
  developer?: string;
  companySlug?: string;
  amenities: string[];
  /** What the condo fee / rent includes (building-level fact). */
  feesIncludes?: string[];
  reviews: BuildingReview[];
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  website?: string;
  reviews: CompanyReview[];
}

// ---------------------------------------------------------------------------
// Scoring helpers (pure — reused by pages and components).
// ---------------------------------------------------------------------------

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Overall building score: mean of each review's explicit overall. */
export function buildingOverall(reviews: BuildingReview[]): number {
  return round1(avg(reviews.map((r) => r.overall)));
}

/**
 * Per-dimension averages. Dimensions with no data (e.g. concierge in a building
 * without one) are omitted, so they read as N/A rather than dragging scores.
 */
export function buildingDimensionAverages(
  reviews: BuildingReview[],
): Partial<Record<BuildingDimension, number>> {
  const out: Partial<Record<BuildingDimension, number>> = {};
  for (const d of BUILDING_DIMENSIONS) {
    const values = reviews
      .map((r) => r.ratings[d.key])
      .filter((n): n is number => typeof n === "number");
    if (values.length) out[d.key] = round1(avg(values));
  }
  return out;
}

/** Resident-reported cost range, or null if nobody has reported one. */
export function reportedCostRange(
  reviews: BuildingReview[],
): { min: number; max: number; count: number } | null {
  const costs = reviews
    .map((r) => r.monthlyCost)
    .filter((n): n is number => typeof n === "number");
  if (!costs.length) return null;
  return { min: Math.min(...costs), max: Math.max(...costs), count: costs.length };
}

/** Overall company score: mean of every dimension across every company review. */
export function companyOverall(reviews: CompanyReview[]): number {
  const all = reviews.flatMap((r) =>
    COMPANY_DIMENSIONS.map((d) => r.ratings[d.key]),
  );
  return round1(avg(all));
}

export function companyDimensionAverages(
  reviews: CompanyReview[],
): Record<CompanyDimension, number> {
  const out = {} as Record<CompanyDimension, number>;
  for (const d of COMPANY_DIMENSIONS) {
    out[d.key] = round1(avg(reviews.map((r) => r.ratings[d.key])));
  }
  return out;
}

// ---------------------------------------------------------------------------
// View models returned by accessors.
// ---------------------------------------------------------------------------

export interface BuildingSummary {
  slug: string;
  name: string;
  address: string;
  city: string;
  buildingType: BuildingType;
  lat: number;
  lng: number;
  overall: number;
  reviewCount: number;
  amenities: string[];
  companyName?: string;
  companySlug?: string;
}

function toSummary(b: Building): BuildingSummary {
  const company = COMPANIES.find((c) => c.slug === b.companySlug);
  return {
    slug: b.slug,
    name: b.name,
    address: b.address,
    city: b.city,
    buildingType: b.buildingType,
    lat: b.lat,
    lng: b.lng,
    overall: buildingOverall(b.reviews),
    reviewCount: b.reviews.length,
    amenities: b.amenities,
    companyName: company?.name,
    companySlug: company?.slug,
  };
}

// ---------------------------------------------------------------------------
// Accessors (mock-backed today, Prisma-backed later).
// ---------------------------------------------------------------------------

export interface BuildingFilters {
  q?: string;
  type?: BuildingType;
  amenities?: string[];
  minScore?: number;
}

export async function listBuildings(
  filters: BuildingFilters = {},
): Promise<BuildingSummary[]> {
  const q = filters.q?.trim().toLowerCase();

  return BUILDINGS.map(toSummary)
    .filter((b) => {
      if (q && !`${b.name} ${b.address} ${b.city}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.type && b.buildingType !== filters.type) return false;
      if (filters.minScore && b.overall < filters.minScore) return false;
      if (
        filters.amenities?.length &&
        !filters.amenities.every((a) => b.amenities.includes(a))
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.overall - a.overall);
}

export async function getTopBuildings(limit = 4): Promise<BuildingSummary[]> {
  return (await listBuildings()).slice(0, limit);
}

export async function getBuildingBySlug(slug: string): Promise<Building | null> {
  return BUILDINGS.find((b) => b.slug === slug) ?? null;
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  return COMPANIES.find((c) => c.slug === slug) ?? null;
}

/** Buildings managed by a given company (summaries). */
export async function getCompanyBuildings(
  companySlug: string,
): Promise<BuildingSummary[]> {
  return BUILDINGS.filter((b) => b.companySlug === companySlug).map(toSummary);
}

/** Average building "management" rating across a company's portfolio. */
export async function companyManagementAcrossBuildings(
  companySlug: string,
): Promise<{ score: number; buildingCount: number }> {
  const buildings = BUILDINGS.filter((b) => b.companySlug === companySlug);
  const scores = buildings
    .flatMap((b) => b.reviews.map((r) => r.ratings.management))
    .filter((n): n is number => typeof n === "number");
  return {
    score: scores.length ? round1(avg(scores)) : 0,
    buildingCount: buildings.length,
  };
}

export async function allBuildingSlugs(): Promise<string[]> {
  return BUILDINGS.map((b) => b.slug);
}

export async function allCompanySlugs(): Promise<string[]> {
  return COMPANIES.map((c) => c.slug);
}

export const ALL_AMENITIES = [
  "Gym",
  "Pool",
  "Sauna",
  "Party Room",
  "Guest Suite",
  "Concierge",
  "EV Charging",
  "Visitor Parking",
  "Locker",
  "Pet Spa",
  "Rooftop Terrace",
  "Co-working Space",
  "Bike Storage",
];

// ---------------------------------------------------------------------------
// Sample dataset (Greater Toronto Area). Invented buildings & companies.
// ---------------------------------------------------------------------------

const COMPANIES: Company[] = [
  {
    id: "c1",
    slug: "summit-residential",
    name: "Summit Residential",
    website: "https://example.com/summit",
    reviews: [
      {
        id: "cr1",
        author: "Priya M.",
        title: "Responsive but slow on bigger repairs",
        body: "Front-desk requests are handled same-day. Larger building-wide issues (garage door, elevator) take longer than I'd like, but they communicate timelines.",
        createdAt: "2026-02-11",
        buildingName: "Harbour Light Residences",
        ratings: {
          responsiveness: 4,
          transparency: 4,
          fairness: 4,
          communication: 4,
          resolution: 3,
        },
      },
      {
        id: "cr2",
        author: "Devon R.",
        title: "Clear financials at the AGM",
        body: "Reserve fund and budget were explained well. Fee increases were reasonable and justified.",
        createdAt: "2025-11-03",
        buildingName: "Skyline 88",
        ratings: {
          responsiveness: 4,
          transparency: 5,
          fairness: 4,
          communication: 4,
          resolution: 4,
        },
      },
    ],
  },
  {
    id: "c2",
    slug: "anchor-property",
    name: "Anchor Property Group",
    website: "https://example.com/anchor",
    reviews: [
      {
        id: "cr3",
        author: "Sam T.",
        title: "Hard to reach",
        body: "Email replies take days and phone goes to voicemail. When they do engage, the work gets done, but getting there is frustrating.",
        createdAt: "2026-01-20",
        buildingName: "Maple Court Condos",
        ratings: {
          responsiveness: 2,
          transparency: 3,
          fairness: 3,
          communication: 2,
          resolution: 3,
        },
      },
    ],
  },
  {
    id: "c3",
    slug: "beacon-management",
    name: "Beacon Management Co.",
    website: "https://example.com/beacon",
    reviews: [
      {
        id: "cr4",
        author: "Lena K.",
        title: "Professional and proactive",
        body: "They flag maintenance before it becomes a problem and the newsletter actually keeps residents informed.",
        createdAt: "2026-03-02",
        buildingName: "The Esplanade Lofts",
        ratings: {
          responsiveness: 5,
          transparency: 4,
          fairness: 5,
          communication: 5,
          resolution: 4,
        },
      },
    ],
  },
];

const BUILDINGS: Building[] = [
  {
    id: "b1",
    slug: "harbour-light-residences",
    name: "Harbour Light Residences",
    address: "29 Queens Quay E",
    city: "Toronto",
    postalCode: "M5E 0A4",
    lat: 43.6446,
    lng: -79.3722,
    buildingType: "CONDO",
    yearBuilt: 2017,
    numUnits: 380,
    numFloors: 35,
    developer: "Waterfront Developments",
    companySlug: "summit-residential",
    amenities: ["Gym", "Pool", "Concierge", "Rooftop Terrace", "Visitor Parking", "Bike Storage"],
    feesIncludes: ["Heat", "Water", "Building insurance", "24/7 concierge"],
    reviews: [
      {
        id: "r1",
        author: "Priya M.",
        title: "Great location, thin walls",
        body: "Steps from the waterfront and the gym is excellent. Soundproofing between units could be better — you hear neighbours in the evenings.",
        pros: "Amazing amenities, walkable, secure",
        cons: "Noise transfer, busy elevators at rush hour",
        unitType: "1 bed + den",
        tenure: "2021–present",
        createdAt: "2026-02-11",
        overall: 4,
        monthlyCost: 720,
        ratings: { quality: 4, noise: 2, maintenance: 4, amenities: 5, safety: 4, management: 4, concierge: 4, location: 5, value: 3 },
      },
      {
        id: "r2",
        author: "Marcus L.",
        title: "Well run for its size",
        body: "Concierge is attentive and common areas are spotless. Maintenance requests get actioned within a couple of days.",
        pros: "Clean, attentive staff",
        cons: "Visitor parking fills up fast",
        unitType: "2 bed",
        tenure: "2019–2023",
        createdAt: "2025-09-18",
        overall: 4,
        monthlyCost: 1010,
        ratings: { quality: 4, noise: 3, maintenance: 5, amenities: 5, safety: 5, management: 4, concierge: 5, location: 5, value: 3 },
      },
    ],
  },
  {
    id: "b2",
    slug: "maple-court-condos",
    name: "Maple Court Condos",
    address: "5180 Yonge St",
    city: "North York",
    postalCode: "M2N 0E5",
    lat: 43.7701,
    lng: -79.4138,
    buildingType: "CONDO",
    yearBuilt: 2009,
    numUnits: 240,
    numFloors: 22,
    developer: "Yonge Heights Group",
    companySlug: "anchor-property",
    amenities: ["Gym", "Sauna", "Party Room", "Visitor Parking", "Locker"],
    feesIncludes: ["Heat", "Water"],
    reviews: [
      {
        id: "r3",
        author: "Sam T.",
        title: "Solid building, frustrating management",
        body: "The unit itself is great and the subway is right there. Management is slow to respond to anything that isn't an emergency.",
        pros: "Transit access, large units",
        cons: "Unresponsive management, aging hallways",
        unitType: "2 bed",
        tenure: "2020–present",
        createdAt: "2026-01-20",
        overall: 3,
        monthlyCost: 880,
        ratings: { quality: 4, noise: 4, maintenance: 3, amenities: 3, safety: 4, management: 2, location: 4, value: 4 },
      },
      {
        id: "r4",
        author: "Grace H.",
        title: "Quiet and convenient",
        body: "Very quiet for a downtown North York location. Older finishes but everything works.",
        unitType: "1 bed",
        tenure: "2018–2022",
        createdAt: "2025-06-30",
        overall: 3,
        monthlyCost: 560,
        ratings: { quality: 3, noise: 5, maintenance: 3, amenities: 3, safety: 4, management: 3, location: 4, value: 4 },
      },
    ],
  },
  {
    id: "b3",
    slug: "the-esplanade-lofts",
    name: "The Esplanade Lofts",
    address: "60 The Esplanade",
    city: "Toronto",
    postalCode: "M5E 1A6",
    lat: 43.6478,
    lng: -79.3739,
    buildingType: "CONDO",
    yearBuilt: 2004,
    numUnits: 120,
    numFloors: 12,
    developer: "Old Town Lofts Inc.",
    companySlug: "beacon-management",
    amenities: ["Concierge", "Rooftop Terrace", "Co-working Space", "Pet Spa", "Bike Storage"],
    feesIncludes: ["Heat", "Water", "Building insurance"],
    reviews: [
      {
        id: "r5",
        author: "Lena K.",
        title: "Character with great management",
        body: "Authentic hard-loft feel — exposed brick, high ceilings. Management is proactive and the building is genuinely well cared for.",
        pros: "Character, proactive management, pet friendly",
        cons: "Limited amenities vs newer builds",
        unitType: "Loft",
        tenure: "2022–present",
        createdAt: "2026-03-02",
        overall: 4,
        monthlyCost: 640,
        ratings: { quality: 4, noise: 3, maintenance: 5, amenities: 3, safety: 4, management: 5, concierge: 5, location: 5, value: 4 },
      },
    ],
  },
  {
    id: "b4",
    slug: "liberty-stack",
    name: "Liberty Stack",
    address: "85 Hanna Ave",
    city: "Toronto",
    postalCode: "M6K 3S3",
    lat: 43.6385,
    lng: -79.4202,
    buildingType: "RENTAL",
    yearBuilt: 2020,
    numUnits: 310,
    numFloors: 18,
    developer: "Liberty Village Rentals",
    companySlug: "summit-residential",
    amenities: ["Gym", "Co-working Space", "Pet Spa", "Rooftop Terrace", "EV Charging", "Bike Storage"],
    feesIncludes: ["Water", "Heat"],
    reviews: [
      {
        id: "r6",
        author: "Owen D.",
        title: "Modern but pricey",
        body: "Brand new finishes and a great co-working lounge. Rent is at the top of the market for the area and parking is extra.",
        pros: "New, great amenities, walkable",
        cons: "Expensive, thin walls",
        unitType: "Studio",
        tenure: "2023–present",
        createdAt: "2026-04-09",
        overall: 3,
        monthlyCost: 2200,
        ratings: { quality: 4, noise: 2, maintenance: 4, amenities: 5, safety: 4, management: 4, location: 5, value: 2 },
      },
    ],
  },
  {
    id: "b5",
    slug: "bayview-heights",
    name: "Bayview Heights",
    address: "8200 Birchmount Rd",
    city: "Markham",
    postalCode: "L3R 9W1",
    lat: 43.8512,
    lng: -79.337,
    buildingType: "CONDO",
    yearBuilt: 2014,
    numUnits: 200,
    numFloors: 16,
    developer: "Markham Skyline Corp.",
    companySlug: "anchor-property",
    amenities: ["Gym", "Pool", "Party Room", "Guest Suite", "Visitor Parking"],
    feesIncludes: ["Heat", "Water", "Central air"],
    reviews: [
      {
        id: "r7",
        author: "Nina P.",
        title: "Family friendly and spacious",
        body: "Big units and a great pool. Parking is easy. Management is hit or miss depending on who's on shift.",
        pros: "Space, pool, parking",
        cons: "Inconsistent management",
        unitType: "3 bed",
        tenure: "2017–present",
        createdAt: "2025-12-01",
        overall: 4,
        monthlyCost: 950,
        ratings: { quality: 4, noise: 4, maintenance: 4, amenities: 4, safety: 5, management: 3, location: 3, value: 4 },
      },
    ],
  },
  {
    id: "b6",
    slug: "riverside-commons",
    name: "Riverside Commons",
    address: "3590 Kaneff Cres",
    city: "Mississauga",
    postalCode: "L5A 3X3",
    lat: 43.5862,
    lng: -79.6075,
    buildingType: "RENTAL",
    yearBuilt: 1998,
    numUnits: 420,
    numFloors: 25,
    developer: "Square One Rentals",
    companySlug: "beacon-management",
    amenities: ["Gym", "Pool", "Sauna", "Visitor Parking", "Locker"],
    feesIncludes: ["Heat", "Water"],
    reviews: [
      {
        id: "r8",
        author: "Hassan A.",
        title: "Good value near Square One",
        body: "Older building but well maintained for its age. Close to the mall and transit. Heat included in rent.",
        pros: "Affordable, central, well kept",
        cons: "Dated kitchens, slow elevators",
        unitType: "2 bed",
        tenure: "2019–present",
        createdAt: "2026-02-27",
        overall: 4,
        monthlyCost: 2650,
        ratings: { quality: 3, noise: 3, maintenance: 4, amenities: 3, safety: 4, management: 4, location: 4, value: 5 },
      },
    ],
  },
  {
    id: "b7",
    slug: "skyline-88",
    name: "Skyline 88",
    address: "88 City Centre Dr",
    city: "Mississauga",
    postalCode: "L5B 1M5",
    lat: 43.5935,
    lng: -79.6446,
    buildingType: "CONDO",
    yearBuilt: 2022,
    numUnits: 500,
    numFloors: 45,
    developer: "City Centre Towers",
    companySlug: "summit-residential",
    amenities: ["Gym", "Pool", "Concierge", "EV Charging", "Rooftop Terrace", "Co-working Space", "Pet Spa"],
    feesIncludes: ["Water", "Building insurance", "24/7 concierge"],
    reviews: [
      {
        id: "r9",
        author: "Devon R.",
        title: "Resort-style living",
        body: "The amenities are unreal — pool, gym, lounges. Brand new so a few construction kinks still being sorted, but management is on it.",
        pros: "Incredible amenities, new, transparent board",
        cons: "Some new-build deficiencies",
        unitType: "1 bed",
        tenure: "2023–present",
        createdAt: "2025-11-03",
        overall: 5,
        monthlyCost: 590,
        ratings: { quality: 4, noise: 4, maintenance: 4, amenities: 5, safety: 5, management: 4, concierge: 4, location: 4, value: 4 },
      },
    ],
  },
  {
    id: "b8",
    slug: "parkdale-yards",
    name: "Parkdale Yards",
    address: "1540 King St W",
    city: "Toronto",
    postalCode: "M6K 1J6",
    lat: 43.6391,
    lng: -79.4341,
    buildingType: "CONDO",
    yearBuilt: 2012,
    numUnits: 160,
    numFloors: 14,
    developer: "West End Living",
    companySlug: "anchor-property",
    amenities: ["Gym", "Party Room", "Bike Storage", "Visitor Parking"],
    feesIncludes: ["Heat", "Water"],
    reviews: [
      {
        id: "r10",
        author: "Tara S.",
        title: "Trendy area, average building",
        body: "Love the neighbourhood — cafés and the lake nearby. The building is fine but management is slow and amenities are basic.",
        pros: "Neighbourhood, transit",
        cons: "Slow management, limited amenities",
        unitType: "1 bed + den",
        tenure: "2020–present",
        createdAt: "2026-01-05",
        overall: 3,
        monthlyCost: 610,
        ratings: { quality: 3, noise: 3, maintenance: 3, amenities: 2, safety: 3, management: 2, location: 5, value: 3 },
      },
    ],
  },
];
