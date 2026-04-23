# ScoutAPI — Operations & Architecture Guide

## Overview

ScoutAPI is a multi-platform marketplace intelligence API that scrapes Craigslist, Facebook Marketplace, OfferUp, and Mercari. It's a SaaS product with user auth, subscription billing, usage tracking, rate limiting, and caching.

**Live URL:** https://scoutapi.io  
**GitHub:** https://github.com/sergio4156/ScoutAPI

---

## Service Providers

| Service | Provider | Purpose | Dashboard URL | Plan |
|---------|----------|---------|---------------|------|
| Hosting | Vercel | Website + API hosting | https://vercel.com/sergio4156-8116s-projects/scout-api | Pro ($20/mo) |
| Scraping | ScraperAPI | Proxy + headless Chrome (CL, OU, MC) | https://dashboard.scraperapi.com | Trial (5K free, then $49/mo) |
| Scraping | RapidAPI (UnitedAPI) | Facebook Marketplace API | https://rapidapi.com/UnitedAPI/api/facebook-marketplace1 | Free (30/mo, then $4.99/mo) |
| Auth | Clerk | User sign-up/sign-in/sessions | https://dashboard.clerk.com | Free (dev mode) |
| Payments | Stripe | Subscriptions + billing | https://dashboard.stripe.com | Test mode |
| Database | Supabase | PostgreSQL (users, keys, usage) | https://supabase.com/dashboard | Free |
| Cache | Upstash | Redis (scrape result caching) | https://console.upstash.com | Free |
| Domain | Namecheap | scoutapi.io domain registration | https://www.namecheap.com/myaccount | Paid ($34.98) |
| Monitoring | UptimeRobot | Uptime monitoring (5 min checks) | https://dashboard.uptimerobot.com | Free |
| DNS | Namecheap | A record + CNAME → Vercel | https://ap.www.namecheap.com/Domains/DomainControlPanel/scoutapi.io/advancedns | — |

---

## Architecture

```
User → scoutapi.io (Vercel)
         │
         ├── Frontend (Next.js pages)
         │     ├── / (landing page)
         │     ├── /docs (API documentation)
         │     ├── /sign-in, /sign-up (Clerk auth)
         │     ├── /dashboard (protected, shows plan/usage/API key)
         │     └── /#pricing (subscription plans)
         │
         ├── API Routes (Next.js serverless functions)
         │     ├── POST /api/scrape → Puppeteer scrapers (needs Vercel Pro)
         │     ├── POST /api/checkout → Creates Stripe Checkout session
         │     ├── POST /api/portal → Opens Stripe billing portal
         │     ├── POST /api/webhooks/stripe → Processes payment events
         │     └── GET /api/health → Platform status check
         │
         ├── Middleware (Clerk) → Protects /dashboard routes
         │
         └── External Services
               ├── Clerk → User authentication
               ├── Stripe → Payment processing + webhooks
               ├── Supabase → PostgreSQL database
               └── Upstash → Redis cache
```

---

## Database Schema (Supabase/PostgreSQL)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| User | Registered users | clerkId, email |
| ApiKey | API keys (SHA-256 hashed) | key, userId, active |
| Subscription | Stripe subscription status | stripeCustomerId, plan, status |
| Usage | Monthly API call tracking | userId, month, requestCount, limit |
| ApiRequest | Request log/history | endpoint, statusCode, responseTime |

**Connection:** Transaction pooler via `aws-1-us-west-1.pooler.supabase.com:6543`

---

## Environment Variables

All 18 env vars are stored in:
- **Local:** `.env.local` (gitignored)
- **Production:** Vercel Environment Variables

### Clerk (Authentication)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client-side Clerk key |
| `CLERK_SECRET_KEY` | Server-side Clerk key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |

### Stripe (Payments)
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Server-side Stripe key (sk_test_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe key (pk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (whsec_...) |
| `STRIPE_PRICE_STARTER` | Price ID for $49/mo Starter plan |
| `STRIPE_PRICE_AGENT` | Price ID for $149/mo Agent plan |
| `STRIPE_PRICE_ENTERPRISE` | Price ID for $499/mo Enterprise plan |
| `NEXT_PUBLIC_STRIPE_PRICE_STARTER` | Same as above (client-side) |
| `NEXT_PUBLIC_STRIPE_PRICE_AGENT` | Same as above (client-side) |
| `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE` | Same as above (client-side) |

### Database (Supabase)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

### Cache (Upstash Redis)
| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST API token |

### Scraping (ScraperAPI + RapidAPI)
| Variable | Description |
|----------|-------------|
| `SCRAPER_API_KEY` | ScraperAPI key — Craigslist, OfferUp, Mercari |
| `RAPIDAPI_KEY` | RapidAPI key — Facebook Marketplace (UnitedAPI) |

---

## Stripe Configuration

### Products & Prices
| Plan | Price | Monthly Limit | Price ID env var |
|------|-------|---------------|------------------|
| Starter | $49/mo | 10,000 calls | `STRIPE_PRICE_STARTER` |
| Agent | $149/mo | 100,000 calls | `STRIPE_PRICE_AGENT` |
| Enterprise | $499/mo | 500,000 calls | `STRIPE_PRICE_ENTERPRISE` |

### Webhook
- **Endpoint:** `https://www.scoutapi.io/api/webhooks/stripe`
- **Events:** checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
- **Dashboard:** Stripe > Workbench > Webhooks > engaging-breeze

### Test Card
- Number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

---

## Scraper Platforms

| Platform | URL Pattern | Location Format | Live Status | Notes |
|----------|-------------|-----------------|-------------|-------|
| Craigslist | `{location}.craigslist.org/search/sss?query=` | City code (`sfbay`, `newyork`) | Working | Most reliable |
| Facebook | `facebook.com/marketplace/{locationId}/search/` | Facebook location ID | Blocked (403) | FB blocks ScraperAPI; needs premium proxy or API |
| OfferUp | `offerup.com/search/?q=&location=` | `city-state` (`san-francisco-ca`) | Working | |
| Mercari | `mercari.com/search/?keyword=` | Not required (national) | Working | Title in img alt attribute |

### Scraper Architecture
- **Production:** ScraperAPI (proxy + headless Chrome service) + cheerio HTML parsing
- **Local dev:** puppeteer-extra + stealth plugin (full Chrome) + in-browser page.evaluate
- **Shared module:** `lib/scrapers/browser.ts` — `fetchWithScraperAPI()` for production, `launchBrowser()` for dev
- **Constants:** All location maps, timeouts, and error codes in `lib/constants.ts`

### Facebook
Uses RapidAPI (UnitedAPI) instead of ScraperAPI because Facebook blocks proxy services.
Returns structured JSON directly — no HTML parsing needed. Fast (~3.5s response time).

### Environment Variables
| Variable | Description |
|----------|-------------|
| `SCRAPER_API_KEY` | ScraperAPI key — Craigslist, OfferUp, Mercari |
| `RAPIDAPI_KEY` | RapidAPI key — Facebook Marketplace |

---

## Rate Limiting & Caching

### Rate Limiting
- **Limit:** 100 requests/minute per API key
- **Implementation:** In-memory (rate-limiter-flexible)
- **Headers:** `X-RateLimit-Remaining`, `Retry-After`

### Caching
- **TTL:** 15 minutes
- **Key format:** `scrape:{platform}:{location}:{query}`
- **Provider:** Upstash Redis
- **Headers:** `X-Cache: HIT` or `X-Cache: MISS`
- **Graceful degradation:** Works without Redis (no cache, scraper runs every time)

---

## DNS Configuration (Namecheap)

| Type | Host | Value |
|------|------|-------|
| A Record | @ | 216.198.79.1 |
| CNAME | www | 2e7b42ef0038a667.vercel-dns-017.com. |

---

## Development

### Local Setup
```bash
npm install --legacy-peer-deps
npm run dev          # Start dev server on localhost:3000
npm test             # Run 92 tests
npm run test:api     # API tests only
npm run test:ui      # Component tests only
npm run test:coverage # Coverage report
```

### Deploy
```bash
npx vercel --prod    # Deploy to production
```

### Database
Tables were created via raw SQL (not Prisma migrations) due to Supabase pooler limitations.

```bash
npx prisma generate  # Regenerate Prisma client after schema changes
```

---

## Going Live Checklist

When ready for real customers:

- [ ] Upgrade Vercel to Pro ($20/mo) — enables scraper endpoint
- [ ] Switch Stripe to live mode (live keys replace sk_test_/pk_test_)
- [ ] Switch Clerk to production mode (production keys)
- [ ] Create new Stripe webhook for live mode
- [ ] Update all env vars in Vercel with production values
- [ ] Make GitHub repo private
- [ ] Rotate all keys that were exposed during development
- [ ] Set up monitoring/alerts (Vercel Analytics, Stripe alerts)

---

## Project Structure

```
scoutapi/
├── app/
│   ├── page.tsx                          # Homepage
│   ├── layout.tsx                        # Root layout (ClerkProvider)
│   ├── globals.css                       # Global styles
│   ├── docs/page.tsx                     # API documentation
│   ├── dashboard/page.tsx                # User dashboard (protected)
│   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk sign-in
│   ├── sign-up/[[...sign-up]]/page.tsx   # Clerk sign-up
│   └── api/
│       ├── scrape/route.ts               # Main scraping endpoint
│       ├── checkout/route.ts             # Stripe checkout session
│       ├── portal/route.ts               # Stripe billing portal
│       ├── webhooks/stripe/route.ts      # Stripe webhook handler
│       └── health/route.ts               # Platform health check
├── components/
│   ├── Navbar.tsx                        # Navigation (auth-aware)
│   ├── Hero.tsx                          # Landing page hero
│   ├── ProblemSolution.tsx               # Problem/solution section
│   ├── CodeExample.tsx                   # API code examples
│   ├── Features.tsx                      # Feature grid
│   ├── UseCases.tsx                      # Use case cards
│   ├── PricingTable.tsx                  # Pricing plans + checkout
│   ├── FAQ.tsx                           # FAQ section
│   ├── Footer.tsx                        # Site footer
│   ├── ApiKeyDisplay.tsx                 # API key with copy button
│   ├── ManageSubscription.tsx            # Stripe portal button
│   └── SignOutButton.tsx                 # Sign out button
├── lib/
│   ├── scrapers/
│   │   ├── browser.ts                    # Shared Puppeteer launcher
│   │   ├── craigslist.ts                 # Craigslist scraper
│   │   ├── facebook.ts                   # Facebook Marketplace scraper
│   │   ├── offerup.ts                    # OfferUp scraper
│   │   ├── mercari.ts                    # Mercari scraper
│   │   ├── index.ts                      # Scraper dispatcher + health
│   │   └── types.ts                      # TypeScript types
│   ├── db.ts                             # Prisma client
│   ├── stripe.ts                         # Stripe client + plan config
│   ├── apiKey.ts                         # API key generation + hashing
│   ├── rateLimit.ts                      # Rate limiter (100/min)
│   └── cache.ts                          # Redis cache (15min TTL)
├── middleware.ts                          # Clerk auth middleware
├── prisma/schema.prisma                  # Database schema
├── __tests__/                            # 92 tests (API + UI)
├── .env.local                            # Environment variables (gitignored)
├── .env.example                          # Template for env vars
├── vercel.json                           # Vercel config
└── jest.config.ts                        # Test configuration
```
