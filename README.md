FinPulse

FinPulse is a Flask web application that surfaces live market context alongside curated financial news. The goal is to provide a clean, dark-themed dashboard that’s reliable, lightweight on external APIs, and easy to extend. The homepage embeds live TradingView charts for major indexes, shows a market heatmap and daily movers, and lists current headlines. Dedicated pages let users browse and filter the full news corpus by category, tags, and free-text queries.

On the homepage, FinPulse renders three live charts (SPY/QQQ/DIA) via TradingView embeds, a Stock Heatmap (S&P 500 by sector), a Top Movers widget, and a Headlines list. The headlines are produced by the project’s ingestion pipeline, which normalizes and tags articles from supported providers, then stores them in data/news.json. The News page supports category navigation plus an “Advanced Filters” panel for industries, hashtags (e.g., #AAPL, #oil), and keyword search—all in a consistent, accessible dark theme.

Early iterations fetched index OHLC, heatmap tiles, and movers from live market APIs. In practice, free tiers and rate limits made the site brittle. I chose to embed TradingView for live visuals (indexes, heatmap, movers) so that the UI remains fast and reliable without constantly spending API quota. Meanwhile, the backend still manages news ingestion and search—where customization matters most. This split keeps the experience “live” for end-users while dramatically reducing backend complexity and operational risk.

I also hardened the ingest pipeline so a provider outage never breaks the site: provider calls are wrapped in try/except, invalid responses are ignored, and the file is only overwritten with valid JSON. A small “system meta row” (filtered out from the UI) records when ingestion last ran, which is useful during development.

The ingestion layer now applies a finance-and-policy focus: articles must come from an allowlisted desk (Reuters, Bloomberg, WSJ, Politico, etc.) and match curated macro/markets or policy keyword sets before they’re kept. A new NewsAPI adapter supplements Marketaux, Finnhub, and Alpha Vantage so you can blend a second source of wire copy while still filtering out lifestyle or entertainment noise.

----

File guide
App + Blueprints

app.py
Flask app factory (create_app()), loads .env, sets DATA_PATH, registers the web and api blueprints, and exposes a CLI command flask ingest-news to refresh data/news.json.

web.py
“Pages” blueprint. Routes:

/ – homepage (TradingView charts, heatmap, movers, headlines)

/news – category cards, keyword search, article grid

/curated – industries + tag checkboxes, keyword search, card grid
Passes categories, items, q, etc. to Jinja templates.

api.py
“API” blueprint. Today the homepage only uses:

GET /api/market/headlines – returns a small list of the latest article titles/links for the homepage Headlines section.
(Endpoints for programmatic heatmap/movers/indexes exist historically but are no longer necessary after switching to TradingView.)

----

Backend Logic

services/ingest.py
Fetches articles from providers (Marketaux, Finnhub, optionally Alpha Vantage news), normalizes fields, auto-tags via tagger.py, de-duplicates, and writes a clean JSON array to data/news.json. It logs provider counts and never writes invalid JSON.

services/providers.py
Provider adapters: fetch_marketaux, fetch_finnhub_general, and fetch_alpha_vantage (for news). Each returns normalized dicts with id/title/summary/source/date/tags/url/category.

services/news_repo.py
A small repository over data/news.json with helpers: load/save, list categories, keyword and tag filtering, and “top tags.” Used by /news and /curated.

services/tagger.py
Lightweight tag generation from titles/summaries; also respects any existing tags from providers.

services/market_live.py
Retained for compatibility; now mainly provides headline helpers. (Previous FMP/AV OHLC/heatmap/movers fetchers are obsolete after the TradingView switch.)

services/market_repo.py
Historical local snapshot reader (no longer used on the homepage).

----

Templates

templates/layout.html
Dark navbar + search; includes Bootstrap, global CSS/JS; sets page blocks.

templates/index.html
Macro snapshot stack, TradingView Stock Heatmap, Hotlists (Top Movers), and homepage headlines.

templates/news.html
Category selector, quick “lenses” presets, trending tag chips, an “On the radar” category pulse, story clusters, and enriched article cards (credibility, read-time, sentiment, context links). Filters out any internal “System” entries so users only see real news.

templates/social.html
Embeds timelines from selected social media accounts (currently X/Twitter). Handles are configured via the SOCIAL_TWITTER_ACCOUNTS environment variable.

Static assets

static/js/home.js
Minimal JS that fetches /api/market/headlines and renders the homepage headlines list. (Heatmap and movers are now pure TradingView embeds and need no JS.)

static/js/tv-charts.js
Legacy helper that mounted TradingView “advanced chart” widgets for AMEX:SPY, NASDAQ:QQQ, and AMEX:DIA (kept for reference; homepage now relies on heatmap + movers only).

static/css/styles.css
Dark theme, card styling, TradingView iframe sizing (fill parent), dark list items for headlines, and legible dark form controls for the News advanced filters.

static/js/social.js
Optional client script that fetches `/api/social/tweets` (when the Twitter API integration is configured) and renders a small tweet list.

Data + config

data/news.json
The ingested news database (JSON array of article objects).

.env
API keys for news ingestion

Macro trends data

The Macro Trends dashboard pulls directly from FRED (employment, inflation, spending) and the EIA (energy). To serve live values instead of the bundled fallbacks:

- Request free API keys from https://fred.stlouisfed.org/ and https://www.eia.gov/opendata/.
- Add them to `.env` as `FRED_API_KEY=<your fred key>` and `EIA_API_KEY=<your eia key>`.
- Start the Flask app (or run any CLI command); the cache warm-up in `create_app()` fetches all series and keeps them refreshed every 15 minutes.
- Need to force a refresh without running the server? Execute `flask shell -c "from services.macro_trends import get_macro_trends; get_macro_trends(force_refresh=True)"`.

Without keys the site continues to render using the curated fallback dataset, so development still works offline.

Social feeds

You can surface selected social media accounts on the homepage and on a dedicated Social page.

- Variable: SOCIAL_TWITTER_ACCOUNTS
- Type: comma-separated list of X/Twitter handles (without @)
- Example: SOCIAL_TWITTER_ACCOUNTS=WSJMarkets,CNBC,TheTerminal

Behavior

- Home page shows a "Social Pulse" section rendering up to two configured accounts with recent posts.
- The Social page (/social) renders all configured accounts in a responsive grid.
- Embeds use the official Twitter widgets script and do not require API keys.

Note: If no handles are configured, the UI shows a helpful message with setup instructions instead of embeds.

Server-side social sentiment (optional)

The `/api/social` endpoints enrich dashboards with recent cashtag chatter, engagement-weighted sentiment, and cached user timelines. Under the hood the ingest can talk to the Twitter v2 API and fetch a TradingView market snapshot so the web UI can plot sentiment vs. price/volume.

- Provision a Twitter v2 Project/App with Elevated (or Essential) access that allows recent search and user timeline endpoints.
- Add to `.env`:
  - `SOCIAL_TWITTER_BEARER_TOKEN=<your v2 bearer token>` (omit to use sample data only)
  - `SOCIAL_SCRAPE_SYMBOLS=IXHL,AAPL,ONDS` (comma-separated cashtags to ingest)
  - Optional macro keys if you want live trend bullets on the homepage:
    - `FRED_API_KEY=<your stlouisfed.org key>` (inflation/growth data)
    - `EIA_API_KEY=<your eia.gov key>` (energy/commodities data)
  - Optional tuning:
    - `SOCIAL_SCRAPE_MAX_POSTS=30` (matches the bundled fixtures; increase carefully to stay inside rate limits)
    - `SOCIAL_SCRAPE_LOOKBACK_HOURS=12`
    - `SOCIAL_TWITTER_SCRAPE_USER=your_handle` (used by the social page timeline card)
- Run `flask ingest-social` to write `data/social.json` and populate the latest summaries. The command now also calls TradingView’s public scanner endpoint (`https://scanner.tradingview.com/america/scan`) to pull close/volume/change for the requested tickers.
- Want historical trends while using sample data? After the first ingest, run `flask seed-social-history --points 24` to synthesize a day’s worth of history so the Social dashboard sparklines have signal immediately.
- Diagnose connectivity with `flask diag-social --symbol SPY`.

Rate limits: the free/essential tiers allow 450 requests per 15 minutes on the `recent search` endpoint. Reduce `SOCIAL_SCRAPE_MAX_POSTS` or lengthen `SOCIAL_SCRAPE_LOOKBACK_HOURS` if you encounter HTTP 429 responses.

Working without Twitter API access? Leave the bearer token blank. The ingest falls back to `data/sample_twitter_posts.json` (or point `SOCIAL_TWITTER_SAMPLE_FILE` to your own fixture). The bundled sample provides 30 posts per ticker with uneven bullish/neutral/bearish mixes so the Social page still renders top posts, engagement tiers, and net-score trends.

**What the Social page now shows**

- Engagement-weighted net score and bullish/neutral/bearish bar with counts.
- Top weighted posts (weight = naïve sentiment × likes/reposts amplification) per symbol.
- Engagement tier badges (high/medium/low) based on likes/reposts.
- Sparkline trends for net score vs. post volume alongside the latest price/percent-change snapshot from TradingView.

----

How to run
# 1) Install
Option A: Conda env with Python 3.11

conda create -y -n finpulse311 python=3.11
conda run -n finpulse311 pip install -r requirements.txt

Option B: venv

python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 2) Set keys (.env)
cp .env.example .env  # if present, else create .env with keys
# Required for live news:  MARKETAUX_KEY / FINNHUB_KEY / ALPHAVANTAGE_KEY / NEWSAPI_KEY (see services/providers.py)
# Optional for macro dashboard: FRED_API_KEY, EIA_API_KEY
# Optional for social sentiment: SOCIAL_TWITTER_BEARER_TOKEN, SOCIAL_SCRAPE_SYMBOLS, etc.

# 3) Ingest / refresh data
export FLASK_APP=app:create_app
# News (required for fresh headlines and the /news page)
flask ingest-news

# Social sentiment (optional dashboard)
# flask ingest-social

# Macro trends (auto-refreshes). To force an immediate refresh:
# flask shell -c "from services.macro_trends import get_macro_trends; get_macro_trends(force_refresh=True)"

# 4) Serve
python app.py
# open http://127.0.0.1:5000

Conda shortcuts

- `make dev311` runs the app with the conda env
- `make ingest311` runs the news ingestion command using the conda env
