/**
 * Shared seed data definitions for scripts/seed.mjs and supabase/seed.sql.
 * Fixed UUIDs keep re-runs idempotent (upsert / skip-if-exists).
 */

export const SEED_VERSION = "1";
export const SEED_MARKER_ID = "00000000-0000-4000-8000-000000000099";

export const DEFAULT_SEED_PASSWORD = "StreamquestDev123!";

export const STREAMERS = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    email: "streamer1@streamquest.test",
    displayName: "PixelPatriot",
    role: "streamer",
    bio: "Investigative streams and deep dives into local stories.",
    platformLinks: {
      twitch: "https://twitch.tv/pixelpatriot",
      youtube: "https://youtube.com/@PixelPatriot",
    },
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    email: "streamer2@streamquest.test",
    displayName: "GameGlitchQueen",
    role: "streamer",
    bio: "Challenge runs, speedruns, and chaotic gaming energy.",
    platformLinks: {
      youtube: "https://youtube.com/@GameGlitchQueen",
      kick: "https://kick.com/gameglitchqueen",
    },
  },
  {
    id: "a0000000-0000-4000-8000-000000000003",
    email: "streamer3@streamquest.test",
    displayName: "KickCommentaryKing",
    role: "both",
    bio: "Live commentary, react streams, and community watch parties.",
    platformLinks: {
      kick: "https://kick.com/kickcommentaryking",
      twitch: "https://twitch.tv/kickcommentaryking",
    },
  },
  {
    id: "a0000000-0000-4000-8000-000000000004",
    email: "streamer4@streamquest.test",
    displayName: "IRLExplorer",
    role: "streamer",
    bio: "Walking tours, food crawls, and real-world adventures.",
    platformLinks: {
      twitch: "https://twitch.tv/irl_explorer",
      instagram: "https://instagram.com/irl_explorer",
    },
  },
  {
    id: "a0000000-0000-4000-8000-000000000005",
    email: "streamer5@streamquest.test",
    displayName: "TechTalkTess",
    role: "streamer",
    bio: "Tech tutorials, homelab builds, and live coding.",
    platformLinks: {
      youtube: "https://youtube.com/@TechTalkTess",
      twitch: "https://twitch.tv/techtalktess",
    },
  },
];

export const VIEWERS = [
  {
    id: "a0000000-0000-4000-8000-000000000101",
    email: "viewer1@streamquest.test",
    displayName: "CuriousCat",
    role: "viewer",
  },
  {
    id: "a0000000-0000-4000-8000-000000000102",
    email: "viewer2@streamquest.test",
    displayName: "HypeViewer",
    role: "viewer",
  },
  {
    id: "a0000000-0000-4000-8000-000000000103",
    email: "viewer3@streamquest.test",
    displayName: "QuietLurker",
    role: "viewer",
  },
];

/** @type {Array<{id: string, authorId: string, title: string, description: string, category: string, tags: string[], status: string}>} */
export const REQUESTS = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Investigate local water quality reports",
    description:
      "Stream a deep dive into recent municipal water testing data. Interview residents, compare EPA standards, and show how to read public records.",
    category: "investigative_journalism",
    tags: ["investigation", "local", "environment"],
    status: "live_now",
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "Deep dive into city council spending",
    description:
      "Walk through the latest city budget PDFs live. Highlight unusual line items and explain where tax dollars actually go.",
    category: "investigative_journalism",
    tags: ["investigation", "politics", "local"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000003",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Beat Elden Ring blindfolded",
    description:
      "Take on a blindfolded boss rush challenge with chat choosing the route. No map, no HUD — just chaos and commentary.",
    category: "game_challenge",
    tags: ["challenge", "soulslike", "hardcore"],
    status: "completed",
  },
  {
    id: "b0000000-0000-4000-8000-000000000004",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Speedrun Mario 64 120 stars",
    description:
      "Attempt a sub-2-hour 120-star run with live splits and chat-triggered handicap rules every time I miss a jump.",
    category: "game_challenge",
    tags: ["speedrun", "retro", "challenge"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000005",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "React to this week's gaming news",
    description:
      "Hot takes on the biggest gaming headlines of the week. Bring your spicy opinions — I'll read the best ones on stream.",
    category: "commentary",
    tags: ["react", "news", "gaming"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000006",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Watch party: State of Play",
    description:
      "Sync up for Sony's next showcase. Live reactions, bingo cards, and immediate impressions after each trailer drop.",
    category: "commentary",
    tags: ["watchparty", "sony", "gaming"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000007",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Cozy Stardew Valley farm build",
    description:
      "Design a pixel-perfect farm layout from scratch. Chat votes on crops, decor, and which villager to romance.",
    category: "gaming",
    tags: ["cozy", "farming", "chill"],
    status: "live_now",
  },
  {
    id: "b0000000-0000-4000-8000-000000000008",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "Ranked Valorant grind to Immortal",
    description:
      "Climbing the ranked ladder with viewer coaching moments. Review VODs between games and fix bad habits live.",
    category: "gaming",
    tags: ["fps", "ranked", "competitive"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000009",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Walking tour of downtown Austin",
    description:
      "IRL stream through live music spots, food trucks, and hidden murals. Stop for chat-suggested detours along the way.",
    category: "irl",
    tags: ["walking", "city", "travel"],
    status: "completed",
  },
  {
    id: "b0000000-0000-4000-8000-000000000010",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "24-hour diner food crawl",
    description:
      "Hit every late-night diner in a 10-mile radius. Rate burgers, milkshakes, and vibes. Survive until sunrise.",
    category: "irl",
    tags: ["food", "irl", "challenge"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000011",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "Watch Lakers game with chat",
    description:
      "Sync-watch the next Lakers game with live chat reactions, stat breakdowns, and halftime hot takes.",
    category: "sports",
    tags: ["nba", "watchparty", "sports"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000012",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Learn Rust basics live",
    description:
      "Zero-to-hero Rust tutorial for beginners. Build a CLI tool together while explaining ownership and borrowing.",
    category: "learning",
    tags: ["programming", "rust", "tutorial"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000013",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Virtual tour of Tokyo neighborhoods",
    description:
      "Use Street View and travel docs to explore Shibuya, Shimokitazawa, and Yanaka. Share tips for first-time visitors.",
    category: "travel",
    tags: ["japan", "travel", "culture"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000014",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "Cook the perfect ramen broth",
    description:
      "12-hour tonkotsu broth attempt from scratch. Show technique, troubleshoot live, and taste-test with chat.",
    category: "food",
    tags: ["cooking", "japanese", "food"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000015",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Live acoustic covers by request",
    description:
      "Take song requests from chat and play acoustic covers live. Chill vibes, bad jokes, and occasional harmonies.",
    category: "music",
    tags: ["music", "acoustic", "requests"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000016",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Hot sauce tier list blind taste test",
    description:
      "Blind-rank 15 hot sauces from mild to volcanic. Chat picks the order; I guess the brand without looking.",
    category: "challenges",
    tags: ["challenge", "food", "spicy"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000017",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "E3 retrospective live discussion",
    description:
      "Rewatch classic E3 moments and debate which era had the best announcements. Nostalgia overload guaranteed.",
    category: "events",
    tags: ["events", "gaming", "nostalgia"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000018",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Build a Raspberry Pi media server",
    description:
      "Step-by-step homelab stream: install Jellyfin on a Pi 5, configure storage, and stream to every device at home.",
    category: "tech",
    tags: ["tech", "diy", "homelab"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000019",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Morning yoga flow for streamers",
    description:
      "Gentle 45-minute yoga routine aimed at desk and stream posture. Stretches, breathing, and wellness Q&A.",
    category: "fitness",
    tags: ["fitness", "yoga", "wellness"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000020",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "Digital art speedpaint commission",
    description:
      "Live speedpaint of a chat-submitted character concept. Explain layers, lighting, and brush choices as we go.",
    category: "creative",
    tags: ["art", "creative", "commission"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000021",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Live FOIA filing for police bodycam policy",
    description:
      "Screen-share drafting and submitting a public records request for bodycam retention policies. Explain exemptions and appeal paths.",
    category: "investigative_journalism",
    tags: ["foia", "police", "transparency"],
    status: "open",
    latitude: 38.9072,
    longitude: -77.0369,
    locationLabel: "Washington, DC, USA",
  },
  {
    id: "b0000000-0000-4000-8000-000000000022",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "Trace a local development subsidy package",
    description:
      "Pull city council packets and parcel maps to show who benefits from a new tax incentive deal.",
    category: "investigative_journalism",
    tags: ["housing", "subsidies", "local-government"],
    status: "open",
    latitude: 41.8781,
    longitude: -87.6298,
    locationLabel: "Chicago, IL, USA",
  },
  {
    id: "b0000000-0000-4000-8000-000000000023",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Fact-check a viral housing claim with primary sources",
    description:
      "Compare social posts to census, assessor, and zoning data live. Chat suggests leads.",
    category: "investigative_journalism",
    tags: ["fact-check", "housing", "primary-sources"],
    status: "open",
  },
  {
    id: "b0000000-0000-4000-8000-000000000024",
    authorId: "a0000000-0000-4000-8000-000000000101",
    title: "Tokyo night market food crawl (live)",
    description:
      "Handheld tour of a night market — stalls, prices, and what first-timers should order.",
    category: "travel",
    tags: ["tokyo", "night-market", "street-food"],
    status: "open",
    latitude: 35.6895,
    longitude: 139.6917,
    locationLabel: "Tokyo, Japan",
  },
  {
    id: "b0000000-0000-4000-8000-000000000025",
    authorId: "a0000000-0000-4000-8000-000000000102",
    title: "Lisbon neighborhood first-timer day",
    description:
      "Transit-first day: viewpoint, cheap lunch, one museum, sunset. Track every euro.",
    category: "travel",
    tags: ["lisbon", "budget", "neighborhood"],
    status: "open",
    latitude: 38.7223,
    longitude: -9.1393,
    locationLabel: "Lisbon, Portugal",
  },
  {
    id: "b0000000-0000-4000-8000-000000000026",
    authorId: "a0000000-0000-4000-8000-000000000103",
    title: "Mexico City street food under $15",
    description:
      "Tacos, aguas, and market snacks — show how far a small budget goes in a day.",
    category: "travel",
    tags: ["mexico-city", "street-food", "budget"],
    status: "open",
    latitude: 19.4326,
    longitude: -99.1332,
    locationLabel: "Mexico City, Mexico",
  },
];

/** requestId -> array of userIds who upvoted */
export const UPVOTES = {
  "b0000000-0000-4000-8000-000000000001": [
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000002",
  ],
  "b0000000-0000-4000-8000-000000000002": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000103",
  ],
  "b0000000-0000-4000-8000-000000000003": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000003",
    "a0000000-0000-4000-8000-000000000005",
  ],
  "b0000000-0000-4000-8000-000000000004": [
    "a0000000-0000-4000-8000-000000000102",
  ],
  "b0000000-0000-4000-8000-000000000005": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000003",
  ],
  "b0000000-0000-4000-8000-000000000006": [
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
  ],
  "b0000000-0000-4000-8000-000000000007": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000002",
    "a0000000-0000-4000-8000-000000000004",
  ],
  "b0000000-0000-4000-8000-000000000008": [
    "a0000000-0000-4000-8000-000000000103",
  ],
  "b0000000-0000-4000-8000-000000000009": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
  ],
  "b0000000-0000-4000-8000-000000000010": [
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000004",
  ],
  "b0000000-0000-4000-8000-000000000011": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
  ],
  "b0000000-0000-4000-8000-000000000012": [
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000005",
  ],
  "b0000000-0000-4000-8000-000000000013": [
    "a0000000-0000-4000-8000-000000000101",
  ],
  "b0000000-0000-4000-8000-000000000014": [
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000004",
  ],
  "b0000000-0000-4000-8000-000000000015": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
  ],
  "b0000000-0000-4000-8000-000000000016": [
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000003",
    "a0000000-0000-4000-8000-000000000004",
  ],
  "b0000000-0000-4000-8000-000000000017": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000003",
  ],
  "b0000000-0000-4000-8000-000000000018": [
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000005",
    "a0000000-0000-4000-8000-000000000103",
  ],
  "b0000000-0000-4000-8000-000000000019": [
    "a0000000-0000-4000-8000-000000000101",
  ],
  "b0000000-0000-4000-8000-000000000020": [
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000004",
  ],
  "b0000000-0000-4000-8000-000000000021": [
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000001",
  ],
  "b0000000-0000-4000-8000-000000000022": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000103",
  ],
  "b0000000-0000-4000-8000-000000000023": [
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000001",
  ],
  "b0000000-0000-4000-8000-000000000024": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000004",
  ],
  "b0000000-0000-4000-8000-000000000025": [
    "a0000000-0000-4000-8000-000000000103",
    "a0000000-0000-4000-8000-000000000004",
  ],
  "b0000000-0000-4000-8000-000000000026": [
    "a0000000-0000-4000-8000-000000000101",
    "a0000000-0000-4000-8000-000000000102",
    "a0000000-0000-4000-8000-000000000103",
  ],
};

/**
 * Live sessions use allowlisted URLs (see lib/stream-links.ts).
 * endedAt: null = currently live; ISO string = completed session.
 */
export const LIVE_SESSIONS = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    requestId: "b0000000-0000-4000-8000-000000000001",
    streamerId: "a0000000-0000-4000-8000-000000000001",
    streamUrl: "https://twitch.tv/pixelpatriot",
    platform: "twitch",
    endedAt: null,
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    requestId: "b0000000-0000-4000-8000-000000000007",
    streamerId: "a0000000-0000-4000-8000-000000000002",
    streamUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "youtube",
    endedAt: null,
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    requestId: "b0000000-0000-4000-8000-000000000003",
    streamerId: "a0000000-0000-4000-8000-000000000002",
    streamUrl: "https://youtube.com/@GameGlitchQueen",
    platform: "youtube",
    endedAt: "2026-06-28T18:00:00.000Z",
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    requestId: "b0000000-0000-4000-8000-000000000009",
    streamerId: "a0000000-0000-4000-8000-000000000004",
    streamUrl: "https://twitch.tv/irl_explorer",
    platform: "twitch",
    endedAt: "2026-06-27T22:30:00.000Z",
  },
];

export const ALL_USERS = [...STREAMERS, ...VIEWERS];
