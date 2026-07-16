// Xiayoki Service — LLM-powered chatbot for Quikden

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

const SYSTEM_PROMPT = `You are Xiayoki, the friendly AI assistant for Quikden (also called Quikden) — India's easiest rental housing platform.

## About Quikden
Quikden connects tenants with property owners for rental housing across India. Users can find houses, rooms, hostels/PGs, and land for sale.

## Listing Types
1. **House Rental** — Full apartments/houses (1BHK, 2BHK, 3BHK, 4+BHK). Includes rent, deposit, maintenance, bedrooms, bathrooms, amenities, parking, furnished status.
2. **Room Sharing** — Shared rooms with gender-specific options. Includes lifestyle preferences (smoking, drinking, diet, pets), age, occupation.
3. **Hostel / PG** — Paying guest accommodations with multiple sharing tiers (1-share, 2-share, 3-share, 4-share) and separate pricing.
4. **Land Sale** — Residential, commercial, and farm land plots.

## User Roles
- **Guest** — Browse listings, view photos/maps, read reviews. Cannot chat, save, or send requests.
- **Tenant** — Save listings, send rental/roommate requests, chat with owners, report listings, rate owners.
- **Owner** — Upload/manage listings, accept/reject requests, chat with tenants, view analytics, rate tenants.
- **Admin** — Moderate listings, ban users, handle reports, verify listings, view analytics.

## Key Features
- **AI Search** — Natural language search (e.g., "2BHK near Mehdipatnam under 15000"). The AI parses it into structured filters.
- **Advanced Filters** — City, type, budget, bedrooms, furnished, gender, amenities, nearby places.
- **Real-time Chat** — Socket.io messaging between tenants and owners. Unlocked only after owner accepts a request.
- **Request Flow** — Tenant sends request → Owner gets notification → Owner accepts/rejects → If accepted, chat unlocks and phone number is revealed.
- **Saved Listings** — Heart icon to save listings to a wishlist.
- **Reviews & Ratings** — Tenants rate owners and vice versa. Trust scores displayed.
- **Nearby Places** — Shows hospitals, schools, metro stations, bus stops, gyms, restaurants via OpenStreetMap.
- **Maps** — Leaflet maps with location picker and approximate/exact location display.
- **Report System** — Report listings for fake info, wrong price, scam, spam, etc.
- **Push Notifications** — Browser push notifications for new messages, request updates.
- **PWA** — Installable as a progressive web app on mobile and desktop.

## Pages & Routes
- Home: /
- Search: /search (with filters in query params)
- House Detail: /listing/:id
- Room Detail: /room/:id
- Hostel Detail: /hostel/:id
- Land Detail: /land/:id
- Login: /login
- Register: /register
- Dashboard (Tenant): /dashboard/tenant
- Dashboard (Owner): /dashboard/owner
- My Listings: /dashboard/listings (owner) or /dashboard/my-listings (tenant)
- Add Listing: /dashboard/listings/new
- Edit Listing: /dashboard/listings/:id/edit
- Saved Listings: /dashboard/saved
- Requests: /dashboard/requests
- Chats: /dashboard/chats
- Analytics: /dashboard/analytics (owner)
- Profile: /dashboard/profile
- Admin Panel: /admin

## Tech Stack
- Frontend: React 19, Tailwind CSS, React Router, React Query, Socket.io Client, Leaflet
- Backend: Node.js, Express.js, Prisma ORM, PostgreSQL (Neon)
- Auth: JWT (access + refresh tokens), bcrypt
- Storage: Cloudinary for images
- Real-time: Socket.io
- Maps: OpenStreetMap + Leaflet + Overpass API
- Search: PostgreSQL full-text search + AI query parser
- Deployment: Vercel (frontend), Render (backend), Neon (database)

## Multilingual Support
You MUST detect and respond in the SAME language the user writes in. You support English, Hindi, and Telugu.

### Language Detection Examples:
- Hindi: "kaisa ghar rent pe daalu", "mujhe ghar chahiye", "rent pe ghar kaise dhundhe", "kaise list kare", "mera dashboard kahan hai", "kya hai quikden", "namaste"
- Telugu: "illu rent ki yela ivvali", "rent ki illu kavali", "illu ela veyali", "enta rent undi", "emiti quikden", "ela search cheyali", "namaskaram"
- English: "how to list property", "find house near me", "what is quikden"

### Response Language Rules:
- If user writes in Hindi → reply ENTIRELY in Hindi (Hinglish is fine, e.g., "Aap Dashboard mein jaake...")
- If user writes in Telugu → reply ENTIRELY in Telugu (Tanglish is fine, e.g., "Meeru Dashboard loki velli...")
- If user writes in English → reply in English
- If mixed language, use the dominant language

### Hindi Keywords to Recognize:
- ghar = house, rent = rent, daalu/dalna = list/post, chahiye = need, kaise = how, kahan = where
- dhundhe = find, list kare = list property, dashboard = dashboard, save = save, request = request
- chat = chat, baat = talk, malik = owner, kirayedar = tenant, kamra = room

### Telugu Keywords to Recognize:
- illu = house, rent ki = for rent, yela = how, ivvali = to give, kavali = need, ekkada = where
- veyali = to list, search = search, chat = chat, matladali = to talk, landlord = owner
- renter = tenant, room = room, bamardi = room

## Response Format
You MUST respond with a valid JSON object (no markdown, no code fences):
{
  "reply": "Your message here",
  "actions": [
    { "label": "Action label", "to": "/route/path" }
  ]
}

- "actions" should include relevant navigation links when applicable (max 3 actions).
- If no actions are relevant, return an empty array: []
- Examples of when to include actions:
  - User asks how to search → include { "label": "Go to Search", "to": "/search" }
  - User asks how to list property → include { "label": "Add Listing", "to": "/dashboard/listings/new" }
  - User asks about their requests → include { "label": "View Requests", "to": "/dashboard/requests" }
`;

/**
 * Get a reply from Xiayoki LLM
 * @param {string} message - User's message
 * @param {Array} history - Previous messages [{role: 'user'|'assistant', content: string}]
 * @returns {{ reply: string, actions: Array }}
 */
const getReply = async (message, history = []) => {
  if (!OPENROUTER_KEY) {
    return getFallbackReply(message);
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map((msg) => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role,
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://quikden.vercel.app',
        'X-Title': 'Quikden Xiayoki Chatbot',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from AI');

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { reply: text, actions: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      reply: parsed.reply || text,
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
    };
  } catch (err) {
    console.error('Xiayoki LLM error:', err.message);
    return getFallbackReply(message);
  }
};

/**
 * Detect user language from message
 */
function detectLanguage(message) {
  const lower = message.toLowerCase();

  // Hindi patterns (Devanagari or Hinglish)
  const hindiWords = ['kaisa', 'kaise', 'kahan', 'kya', 'hai', 'hain', 'mein', 'mera', 'meri', 'hum', 'aap',
    'ghar', 'daalu', 'dalna', 'chahiye', 'dhundhe', 'rent', 'list', 'kare', 'karo',
    'malik', 'kirayedar', 'kamra', 'baat', 'save', 'request', 'dashboard',
    'namaste', 'shukriya', 'dhanyavaad', 'acha', 'theek', 'batao', 'bataiye',
    'kaise', 'ye', 'wo', 'yahan', 'wahan', 'abhi', 'kal', 'subah', 'raat',
    'dhoond', 'dhundh', 'chahiye', 'mujhe', 'humein', 'unka', 'unhe'];

  const hindiPattern = hindiWords.some(w => lower.includes(w)) ||
    /[\u0900-\u097F]/.test(message); // Devanagari script

  // Telugu patterns (Telugu script or Tanglish)
  const teluguWords = ['illu', 'yela', 'ivvali', 'kavali', 'ekkada', 'enti', 'emiti', 'undhi',
    'veyali', 'matladali', 'search', 'cheyali', 'kavali', 'ivvu', 'ivvali',
    'namaskaram', 'dhanyavaadalu', 'bagundi', 'sare', 'andi', 'lanti',
    'rent', 'room', 'owner', 'tenant', 'house', 'flat',
    'meeru', 'nenu', 'memu', 'vaaru', 'deeni', 'dani'];

  const teluguPattern = teluguWords.some(w => lower.includes(w)) ||
    /[\u0C00-\u0C7F]/.test(message); // Telugu script

  if (hindiPattern) return 'hi';
  if (teluguPattern) return 'te';
  return 'en';
}

/**
 * Fallback replies when LLM is unavailable
 */
function getFallbackReply(message) {
  const lower = message.toLowerCase();
  const lang = detectLanguage(message);

  // ── Greetings ─────────────────────────────────────
  if (/^(hi|hello|hey|namaste|sup|hii|hy|namaskaram|namaskar)/i.test(lower.trim())) {
    const replies = {
      en: "Hey there! 👋 I'm Xiayoki, your Quikden assistant. I can help you with finding rentals, listing properties, using chat, and anything else about the app. What would you like to know?",
      hi: "Namaste! 🙏 Main Xiayoki hoon, aapka Quikden assistant. Mai aapki help kar sakta hoon — ghar dhundhne mein, property list karne mein, chat mein, ya app ke baare mein kuch bhi puchne mein. Bataiye, kya jaanna hai?",
      te: "Namaskaram! 🙏 Nenu Xiayoki, mee Quikden assistant. Nenu meeku help cheyagalenu — illu vethakadam, property list cheyadam, chat, leka app gurinchi emaina adigite. Cheppandi, emi telusukovali?",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Search Listings', to: '/search' },
        { label: 'Add Listing', to: '/dashboard/listings/new' },
      ],
    };
  }

  // ── What is Quikden ───────────────────────────────
  if (lower.includes('what is') || lower.includes('about') || lower.includes('quikden') || lower.includes('quikden') ||
    lower.includes('kya hai') || lower.includes('emiti') || lower.includes('enti')) {
    const replies = {
      en: "Quikden (also called Quikden) is India's rental housing platform 🏠. You can find houses, rooms, hostels/PGs, and land for sale. It features AI-powered search, real-time chat, reviews, maps, and more!",
      hi: "Quikden (jise Quikden bhi kehte hain) India ka rental housing platform hai 🏠. Aap yahan ghar, kamre, hostel/PG, aur zameen khareed sakte hain. Isme AI search, real-time chat, reviews, maps, aur bahut kuch hai!",
      te: "Quikden (daniini Quikden ani kuda antaaru) India yokka rental housing platform 🏠. Meeru illu, kameralu, hostel/PG, aur bhoomi konnachu. Dantlo AI search, real-time chat, reviews, maps, inka chala unnai!",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Explore Listings', to: '/search' },
        { label: 'Learn More', to: '/' },
      ],
    };
  }

  // ── How to search / find ──────────────────────────
  if (lower.includes('search') || lower.includes('find') || lower.includes('look for') ||
    lower.includes('dhund') || lower.includes('chahiye') || lower.includes('kahan') ||
    lower.includes('vethak') || lower.includes('ekkada')) {
    const replies = {
      en: "🔍 You can search listings from the Search page! Use AI search by typing naturally (e.g., '2BHK near Mehdipatnam under 15000') or use filters for city, budget, type, gender, amenities, and more.",
      hi: "🔍 Aap Search page se ghar/space dhundh sakte hain! AI search use karein — bas naturally type karein (jaise '2BHK Mehdipatnam ke paas 15000 ke neeche') ya filters lagayein — city, budget, type, gender, amenities wagera.",
      te: "🔍 Meeru Search page nunchi illu/space vethakachu! AI search vaadandi — simple ga type cheyandi (udāharaṇa ki '2BHK Mehdipatnam daggara 15000 kinda') leka filters veyandi — city, budget, type, gender, amenities mīru.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Go to Search', to: '/search' },
      ],
    };
  }

  // ── How to list / post property ───────────────────
  if (lower.includes('list') || lower.includes('post') || lower.includes('upload') ||
    lower.includes('rent out') || lower.includes('add') ||
    lower.includes('daalu') || lower.includes('dalna') || lower.includes('kare') ||
    lower.includes('veyali') || lower.includes('ivvali')) {
    const replies = {
      en: "📝 To list your property: 1) Go to Dashboard → Add Listing. 2) Fill in details (title, rent, location, amenities). 3) Upload photos. 4) Publish! It's a 5-step wizard that takes about 2 minutes.",
      hi: "📝 Apni property list karne ke liye: 1) Dashboard → Add Listing par jaayein. 2) Details bharein (title, rent, location, amenities). 3) Photos upload karein. 4) Publish karein! Bas 2 minute lagte hain.",
      te: "📝 Mee property list cheyadaniki: 1) Dashboard → Add Listing ki velli. 2) Details nimpandi (title, rent, location, amenities). 3) Photos upload cheyandi. 4) Publish cheyandi! Koncham 2 nimishalu matrame untundi.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Add Listing', to: '/dashboard/listings/new' },
        { label: 'Go to Dashboard', to: '/dashboard' },
      ],
    };
  }

  // ── Chat / message ────────────────────────────────
  if (lower.includes('chat') || lower.includes('message') || lower.includes('talk') ||
    lower.includes('baat') || lower.includes('matladali')) {
    const replies = {
      en: "💬 Chat works like this: Send a request to an owner for a listing. Once they accept, chat unlocks and you can message them in real-time. You'll also see their phone number after acceptance.",
      hi: "💬 Chat aise kaam karta hai: Kisi listing ke owner ko request bhejein. Jab wo accept kare, chat unlock ho jaega aur aap real-time mein baat kar sakte hain. Accept hone ke baad unka phone number bhi dikhega.",
      te: "💬 Chat ila panichestundi: Oka listing ki owner ki request pampandi. Vaaru accept cheste, chat unlock avtundi meeru real-time lo matladachu. Accept ayina tarvata vaari phone number kuda kanipistundi.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Open Chats', to: '/dashboard/chats' },
        { label: 'My Requests', to: '/dashboard/requests' },
      ],
    };
  }

  // ── Request / apply ───────────────────────────────
  if (lower.includes('request') || lower.includes('apply') || lower.includes('booking') ||
    lower.includes('bhej') || lower.includes('karna')) {
    const replies = {
      en: "📋 To apply for a listing: 1) Open the listing detail page. 2) Click 'Send Request'. 3) Wait for the owner to accept. 4) Once accepted, chat unlocks and you can contact them. Track all requests in your dashboard.",
      hi: "📋 Listing ke liye apply kaise karein: 1) Listing ki detail page kholein. 2) 'Send Request' par click karein. 3) Owner ka wait karein jab tak accept na kare. 4) Accept hone pe chat unlock ho jaega. Saare requests dashboard mein dikhte hain.",
      te: "📋 Listing ki apply ela cheyali: 1) Listing detail page ni open cheyandi. 2) 'Send Request' meeda click cheyandi. 3) Owner accept cheyavaraku wait cheyandi. 4) Accept ayina tarvata chat unlock avtundi. Dashboard lo anni requests chudachu.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'My Requests', to: '/dashboard/requests' },
        { label: 'Browse Listings', to: '/search' },
      ],
    };
  }

  // ── Saved / wishlist ──────────────────────────────
  if (lower.includes('save') || lower.includes('wishlist') || lower.includes('bookmark') || lower.includes('heart') ||
    lower.includes('bacha') || lower.includes('favorite')) {
    const replies = {
      en: "❤️ To save a listing, tap the heart icon on any listing card. Find all your saved listings in Dashboard → Saved Listings. You can remove them anytime by tapping the heart again.",
      hi: "❤️ Koi listing save karne ke liye, listing card par heart icon par tap karein. Saare saved listings Dashboard → Saved Listings mein milenge. Kabhi bhi hata sakte hain — bas phir se heart par tap karein.",
      te: "❤️ Oka listing ni save cheyadaniki, listing card meeda heart icon ni click cheyandi. Dashboard → Saved Listings lo mee anni saved listings kanipistayi. Eppatikaina teeseyachu — malli heart ni click cheyandi.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'View Saved', to: '/dashboard/saved' },
        { label: 'Browse Listings', to: '/search' },
      ],
    };
  }

  // ── Reviews ───────────────────────────────────────
  if (lower.includes('review') || lower.includes('rate') || lower.includes('rating')) {
    const replies = {
      en: "⭐ After a rental interaction, both tenants and owners can rate each other. Reviews and trust scores help build a safe community. You can view ratings on user profiles and listing pages.",
      hi: "⭐ Rental interaction ke baad, tenant aur owner dono ek dusre ko rate kar sakte hain. Reviews aur trust scores se safe community banti hai. Ratings aapko user profiles aur listing pages par dikhti hain.",
      te: "⭐ Rent interaction tarvata, tenant lu owner lu ikkalini rate cheyachu. Reviews aur trust scores tho safe community vastundi. Mee user profiles aur listing pages lo ratings kanipistayi.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'My Profile', to: '/dashboard/profile' },
      ],
    };
  }

  // ── Nearby places ─────────────────────────────────
  if (lower.includes('nearby') || lower.includes('hospital') || lower.includes('school') || lower.includes('metro') || lower.includes('place') ||
    lower.includes('paas') || lower.includes('najdeek')) {
    const replies = {
      en: "📍 Every listing shows nearby places like hospitals, schools, metro stations, bus stops, gyms, restaurants, and more — powered by OpenStreetMap. Check the 'Nearby Places' section on any listing detail page.",
      hi: "📍 Har listing mein nearby places dikhte hain — hospitals, schools, metro stations, bus stops, gyms, restaurants, aur bahut kuch — OpenStreetMap se powered. Kisi bhi listing detail page par 'Nearby Places' section dekhein.",
      te: "📍 Prathi listing lo nearby places kanipistayi — hospitals, schools, metro stations, bus stops, gyms, restaurants, inka chala — OpenStreetMap powered. Ee listing detail page lo 'Nearby Places' section chudandi.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Search Listings', to: '/search' },
      ],
    };
  }

  // ── Report ────────────────────────────────────────
  if (lower.includes('report') || lower.includes('fake') || lower.includes('scam')) {
    const replies = {
      en: "🚨 If you see a suspicious listing, tap the 'Report' button on the listing detail page. You can report for: fake listing, wrong price, scam, spam, duplicate, or other reasons. Our team reviews all reports.",
      hi: "🚨 Agar koi suspicious listing dikhe, to listing detail page par 'Report' button par tap karein. Aap report kar sakte hain: fake listing, galat price, scam, spam, duplicate, ya kisi aur reason ke liye. Humari team saare reports review karti hai.",
      te: "🚨 Etuvanti suspicious listing kanipiste, listing detail page meeda 'Report' button ni click cheyandi. Meeru report cheyachu: fake listing, wrong price, scam, spam, duplicate, leka inkoka reason. Memu anni reports review chestam.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Search Listings', to: '/search' },
      ],
    };
  }

  // ── Dashboard / profile ───────────────────────────
  if (lower.includes('dashboard') || lower.includes('account') || lower.includes('profile')) {
    const replies = {
      en: "📊 Your Dashboard is your command center! Tenants can see saved listings, requests, and chats. Owners get analytics, listing management, and request handling. Access it from the navbar avatar menu.",
      hi: "📊 Aapka Dashboard aapka command center hai! Tenants saved listings, requests, aur chats dekh sakte hain. Owners ko analytics, listing management, aur request handling milta hai. Navbar ke avatar menu se access karein.",
      te: "📊 Mee Dashboard mee command center! Tenants saved listings, requests, chat lu chudachu. Owners ki analytics, listing management, request handling vastayi. Navbar avatar menu nunchi access cheyandi.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Go to Dashboard', to: '/dashboard' },
        { label: 'My Profile', to: '/dashboard/profile' },
      ],
    };
  }

  // ── Owner specific ────────────────────────────────
  if (lower.includes('owner') || lower.includes('landlord') || lower.includes('property owner') ||
    lower.includes('malik') || lower.includes('makaan')) {
    const replies = {
      en: "🏠 As an owner, you can: list properties, accept/reject tenant requests, chat with tenants, view analytics (views, requests), and rate tenants. Your dashboard has everything you need to manage your listings.",
      hi: "🏠 Owner ke taur par aap: properties list kar sakte hain, tenant requests accept/reject kar sakte hain, tenants se chat kar sakte hain, analytics dekh sakte hain (views, requests), aur tenants ko rate kar sakte hain. Aapke dashboard mein sab kuch hai.",
      te: "🏠 Owner ga, meeru: properties list cheyachu, tenant requests accept/reject cheyachu, tenants tho chat cheyachu, analytics chudachu (views, requests), inka tenants ni rate cheyachu. Mee dashboard lo anni unnai.",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Owner Dashboard', to: '/dashboard/owner' },
        { label: 'My Listings', to: '/dashboard/listings' },
      ],
    };
  }

  // ── Tenant / looking for ──────────────────────────
  if (lower.includes('tenant') || lower.includes('looking for') || lower.includes('need room') || lower.includes('need house') ||
    lower.includes('kirayedar') || lower.includes('mujhe') || lower.includes('chahiye') ||
    lower.includes('kavali')) {
    const replies = {
      en: "🔑 As a tenant, you can: search listings with AI, save favorites, send requests to owners, chat after acceptance, and rate owners. Start by searching for your ideal rental!",
      hi: "🔑 Tenant ke taur par aap: AI se listings dhundh sakte hain, favorites save kar sakte hain, owners ko request bhej sakte hain, accept hone pe chat kar sakte hain, aur owners ko rate kar sakte hain. Apna ideal rental dhundh ke shuru karein!",
      te: "🔑 Tenant ga, meeru: AI tho listings vethakachu, favorites save cheyachu, owners ki request pampachu, accept ayina tarvata chat cheyachu, inka owners ni rate cheyachu. Mee ideal rental ni vethaki modalandi!",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Search Now', to: '/search' },
        { label: 'My Requests', to: '/dashboard/requests' },
      ],
    };
  }

  // ── Types of listings ─────────────────────────────
  if (lower.includes('type') || lower.includes('kind') || lower.includes('option') || lower.includes('bhk') ||
    lower.includes('hostel') || lower.includes('pg') || lower.includes('room sharing') ||
    lower.includes('kya hai') || lower.includes('kitne')) {
    const replies = {
      en: "🏘️ Quikden has 4 listing types: 1) House Rental (1-4+ BHK), 2) Room Sharing (gender-specific), 3) Hostel/PG (with sharing tiers), 4) Land Sale (residential/commercial/farm). Filter by type on the search page!",
      hi: "🏘️ Quikden mein 4 tarah ki listings hain: 1) House Rental (1-4+ BHK), 2) Room Sharing (gender-specific), 3) Hostel/PG (sharing tiers ke saath), 4) Land Sale (residential/commercial/farm). Search page par type se filter karein!",
      te: "🏘️ Quikden lo 4 rakala listings unnai: 1) House Rental (1-4+ BHK), 2) Room Sharing (gender-specific), 3) Hostel/PG (sharing tiers tho), 4) Land Sale (residential/commercial/farm). Search page meeda type ni filter cheyandi!",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Search by Type', to: '/search' },
      ],
    };
  }

  // ── Amenities ─────────────────────────────────────
  if (lower.includes('amenit') || lower.includes('wifi') || lower.includes('parking') || lower.includes('ac') || lower.includes('furnish')) {
    const replies = {
      en: "✨ Listings on Quikden include amenities like WiFi, parking, AC, furnished options, lift, security/CCTV, power backup, water supply, kitchen, and balcony. Use the amenity filters on the search page to find what you need!",
      hi: "✨ Quikden ki listings mein amenities milti hain jaise WiFi, parking, AC, furnished options, lift, security/CCTV, power backup, water supply, kitchen, aur balcony. Search page par amenity filters use karein!",
      te: "✨ Quikden listings lo amenities unnai — WiFi, parking, AC, furnished options, lift, security/CCTV, power backup, water supply, kitchen, balcony. Search page meeda amenities filters vaadandi!",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Search with Filters', to: '/search' },
      ],
    };
  }

  // ── Thank you ─────────────────────────────────────
  if (/^(thanks|thank you|thx|dhanyavaad|shukriya|dhanyavaadalu)/i.test(lower.trim())) {
    const replies = {
      en: "You're welcome! 😊 Happy to help. If you have any more questions about Quikden, just ask!",
      hi: "Aapka swagat hai! 😊 Help karke khushi hui. Agar Quikden ke baare mein koi aur sawaal ho, toh poochh lijiye!",
      te: "Mee kosam! 😊 Help cheyadam lo anandam. Quikden gurinchi inka emaina adigithe, adagandi!",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [],
    };
  }

  // ── Help / general ────────────────────────────────
  if (lower.includes('help') || lower.includes('how') || lower.includes('what') || lower.includes('can you') ||
    lower.includes('batao') || lower.includes('madad')) {
    const replies = {
      en: "I can help you with: 🔍 Finding rentals, 📝 Listing properties, 💬 Chatting with owners/tenants, ❤️ Saving listings, 📋 Managing requests, ⭐ Reviews, 📍 Nearby places, and more! What would you like to know?",
      hi: "Main aapki help kar sakta hoon: 🔍 Rental dhundhne mein, 📝 Property list karne mein, 💬 Owner/tenant se chat karne mein, ❤️ Listings save karne mein, 📋 Requests manage karne mein, ⭐ Reviews, 📍 Nearby places, aur bahut kuch! Kya jaanna hai?",
      te: "Nenu meeku help cheyagalenu: 🔍 Rentals vethakadam, 📝 Properties list cheyadam, 💬 Owner/tenant tho chat cheyadam, ❤️ Listings save cheyadam, 📋 Requests manage cheyadam, ⭐ Reviews, 📍 Nearby places, inka chala! Emi telusukovali?",
    };
    return {
      reply: replies[lang] || replies.en,
      actions: [
        { label: 'Search Listings', to: '/search' },
        { label: 'Add Listing', to: '/dashboard/listings/new' },
        { label: 'My Dashboard', to: '/dashboard' },
      ],
    };
  }

  // ── Default fallback ──────────────────────────────
  const replies = {
    en: "I'm here to help with anything about Quikden! 🏠 You can ask about searching rentals, listing properties, how chat works, the request flow, saved listings, reviews, or anything else about the app.",
    hi: "Main Quikden ke baare mein kuch bhi help karne ke liye hoon! 🏠 Aap rental dhundhne, property list karne, chat kaise kaam karta hai, request flow, saved listings, reviews, ya app ke baare mein kuch bhi poochh sakte hain.",
    te: "Nenu Quikden gurinchi emaina help kosam unnamu! 🏠 Meeru rental vethakadam, property list cheyadam, chat ela panichestundi, request flow, saved listings, reviews, leka app gurinchi emaina adagachu.",
  };
  return {
    reply: replies[lang] || replies.en,
    actions: [
      { label: 'Search Listings', to: '/search' },
      { label: 'Go to Dashboard', to: '/dashboard' },
    ],
  };
}

module.exports = { getReply };
