# Game Nite Lounge × Off the Couch: integration plan and proof of concept

**Status:** working proof of concept against a mock of Off the Couch (OTC). Every OTC ID, price and rule here is a placeholder.
**Sources:** [OTC features](https://www.offthecouch.io/features) · [API reference](https://docs.offthecouch.io/api-docs) · [Webhooks](https://docs.offthecouch.io/api-docs/webhooks/overview)

---

## 1. The principle: OTC is the system of record, and the website is the storefront

OTC already handles availability, checkout, payments, deposits, gift cards, waivers, check-in, point of sale, photos, surveys and email. The website shouldn't rebuild any of that. The site's job is the parts OTC doesn't do well for this business:

| Job | Owner | Why |
|---|---|---|
| Lounge sessions for 2–8 people (book and pay) | **OTC booking site, embedded** | Its checkout, deposits and waivers are already built and handle payments safely |
| Gift cards | **OTC** | Built in, including digital and physical cards |
| Waivers, check-in, point of sale, photos, surveys | **OTC** | Built in |
| Brand, games menu, food menu, SEO, reviews | **Website** | Marketing content |
| Corporate pricing and quotes for 9–80 people | **Website → OTC** | OTC has no self-serve quote builder or quote PDF |
| Holding a date for 72 hours with no payment | **Website → OTC API** | Creates a private hold slot plus a transaction in OTC |
| Attendee RSVPs and dietary tally | **Website**, summarized into OTC | OTC waivers have no custom fields in the API |
| Live "open lounges today" | **Website ← OTC API** | Read-only availability |
| Seattle pre-opening waitlist | **Email tool** (Klaviyo or Mailchimp) | The OTC API has no standalone "create customer" endpoint |

## 2. How Game Nite Lounge maps onto OTC

| Game Nite Lounge | OTC concept | Notes |
|---|---|---|
| Memphis, Seattle | **Company group** (location) | Open Seattle by copying the Memphis setup |
| 10 lounges per location | **Resources** | OTC blocks availability automatically when a lounge is in use |
| Lounge session, 1/2/3 hours | **One "game" (product) sold at several lengths** | OTC supports "one event sold at several lengths and prices". Per-ticket pricing with a morning rate |
| Christmas Special | Its own product | Seasonal |
| Team event (9–80 people) | Product **"Team event"**, private, not public | Held through the API (see §3B) |
| Birthday party | Product **"Birthday party"** with its own booking template | A package price rather than per-ticket |
| Food, drinks, extras | **Items** | Added as transaction line items so the kitchen sees them |
| Company name, paperwork needs, quote, hold expiry | **Custom fields** on the transaction | IDs go in `config.mjs` |
| Corporate vs. birthday vs. public checkout | **Separate booking-site templates** | OTC: "One venue can present differently to corporate clients and birthday parties." |

> Naming trap: OTC calls bookable products "games." Our 70+ in-lounge titles are **not** OTC games. Keep them on the website's game menu.

## 3. The flows

### A. Groups of 2–8 (most bookings)
Website → **embedded OTC booking template** ("Lounge sessions", one per city) → OTC checkout (2-ticket deposit, rest paid on arrival) → OTC sends the confirmation and waiver link → `booking.created` webhook → the website logs it and fires conversion tracking.

### B. Corporate, 9–80 people (built in this proof of concept)
1. A planner prices the event in the **event builder**. The browser shows an estimate.
2. **Hold this date** → `POST /api/events/hold`. The server **re-prices from config** and ignores the browser's total, then:
   - `POST /bookings`: creates a **private hold slot** on the *Team event* product, for the group size and time, labeled `HOLD · Company · 20 guests · expires …`. OTC documents this endpoint as "for staff creating calendar slots", which is what a hold is.
   - `POST /transactions`: attaches the planner as the customer (found or created by email), the food/drink/extra items, and custom fields (company, paperwork, quote JSON, hold expiry), plus UTM tags.
3. Staff see the hold on the OTC calendar. The planner gets an **RSVP link**.
4. **Deposit**: an OTC **payment request** (from the console, or an automation on the custom field) is emailed to the planner → `payment.succeeded` webhook → the hold becomes **confirmed**.
5. If no deposit arrives within 72 hours, the server releases the hold (see open question 3).
6. As RSVPs arrive, the server updates the OTC slot label (`RSVP 14/20 · diet: 3 vegan, 1 GF · allergies: 2`) so the kitchen and hosts see it on the calendar.

### C. Birthdays
Start with **no code**: an OTC "Birthday" booking template with request-to-book (staff approve before charging), a package price and add-ons. Move it to the API pattern above only if it needs the builder.

### D. After the visit
`event.completed` webhook → an OTC survey automation sends a thank-you, the group photo and a **Google review link**. Memphis is at 4.9 stars from 340 reviews (Nov 2026), and this keeps the reviews coming.

## 4. Webhooks the site subscribes to

| Event | What the website does |
|---|---|
| `booking.created` (`booking_created_customer`) | Record the conversion (server-side GA4/Meta) and post a heads-up for big groups |
| `payment.succeeded` | Hold → **confirmed**; notify the event manager |
| `booking.cancelled` / `transaction.cancelled` | Release the hold and notify the planner |
| `booking.rescheduled` / `datetime_updated` | Update the RSVP page's date and time |
| `event.completed` | Start the review-request flow (if not done in OTC) |

Implemented per OTC's spec: HMAC-SHA256 over `"<timestamp>.<raw_body>"`, deliveries older than 5 minutes rejected, deduplication by `X-OTC-Webhook-Id`, acknowledge within 8 seconds then process, and return **200 even on a bad signature** so OTC doesn't retry endlessly.

## 5. Questions for OTC (ask before building for real)
1. **Memberships.** Memphis sells $49.99 and $99.99 annual memberships. OTC's feature list doesn't mention memberships. Is there a native feature, or should these be promo codes plus customer tags?
2. **Holding several lounges.** Does a private slot on a product with `required_resource_count` block *N* lounges? Or does a 20-person event need one product per size tier, or *N* linked slots?
3. **Releasing a hold.** There's no documented cancel endpoint. Is `PUT /transactions/{id}` with `remove_bookings` right, or is another call needed?
4. **Payment requests through the API.** Can the server create and email a deposit payment request, or is that console-only? An automation triggered by the "hold expires" custom field would also work.
5. **Pre-filled embeds.** Can a booking-site embed be opened with the date, time, party size and product already selected?
6. **Invoices / net-30** for companies: is that a "custom payment method" plus a payment link?
7. **Rate limits** for availability reads. The proof of concept caches for 60 seconds.
8. **Creating customers** without a transaction, for the Seattle waitlist.

## 6. Rollout
1. **Memphis on OTC:** move from Bookeo to OTC, with the lounge-session template embedded on `/memphis` and gift cards and memberships in OTC. No API needed.
2. **Webhooks and analytics:** deploy this server (any small Node host). Register `/webhooks/otc` and turn on GA4 and Meta Pixel in OTC.
3. **Corporate holds and RSVPs:** turn on `/api/events/hold` with the real IDs. Staff get used to holds on the calendar.
4. **Seattle:** copy the Memphis location in OTC, add the Seattle prices and tax, and switch the site's Seattle buttons from waitlist to booking at launch.

---

## Run the proof of concept

```bash
node otc-poc/server.mjs
```
Open http://localhost:8138. With no API key it uses **mock OTC** (`mock-otc.mjs`), which keeps lounge availability in memory and **sends signed webhooks** back to the server the way OTC would.

Try it:
- `/memphis/`: the "Open lounges today" strip reads availability from the mock.
- `/events/#builder`: price an event, then **Hold this date** creates the hold. Click **Simulate deposit payment**, and the `payment.succeeded` webhook confirms it.
- Open the RSVP link, then submit RSVPs. The tally updates and the slot label in "OTC" is rewritten.
- `GET /api/dev/log`: an event log of holds, webhooks and RSVPs (mock mode only).

Going live: set `OTC_API_KEY`, `OTC_WEBHOOK_SECRET` and `PUBLIC_URL` (HTTPS, because OTC only delivers to HTTPS), replace the IDs in `config.mjs`, and register `https://<host>/webhooks/otc` under Settings › Company Settings › API › Webhooks.

| File | Purpose |
|---|---|
| `config.mjs` | OTC IDs (locations, products, items, custom fields), corporate pricing |
| `pricing.mjs` | Server-side pricing (the source of truth for holds) |
| `otc-client.mjs` | Real OTC API client (`X-API-Key`, pagination) |
| `mock-otc.mjs` | Mock OTC with lounge capacity and signed webhooks |
| `server.mjs` | Static site, `/api/*`, `/webhooks/otc`, hold expiry |

**Not production-ready.** It uses a JSON-file store instead of a database, has no admin login, no rate limiting and no email sending. Pricing is duplicated in `website/assets/site.js` for the browser estimate; in production that file should load prices from `/api/catalog` instead.
