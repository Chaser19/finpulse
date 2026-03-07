FinPulse

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

Static assets

static/js/home.js
Minimal JS that fetches /api/market/headlines and renders the homepage headlines list. (Heatmap and movers are now pure TradingView embeds and need no JS.)

static/css/styles.css
Dark theme, card styling, TradingView iframe sizing (fill parent), dark list items for headlines, and legible dark form controls for the News advanced filters.

Data + config

data/news.json
The ingested news database (JSON array of article objects).

.env
API keys for news ingestion

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
# Required for live news and market charts:  MARKETAUX_KEY / FINNHUB_KEY / ALPHAVANTAGE_KEY / NEWSAPI_KEY (see services/providers.py)

# 3) Ingest / refresh data
export FLASK_APP=app:create_app
# News auto-refreshes every 2 hours in the background; run manually to force an update
flask ingest-news

# 4) Serve
python app.py
# open http://127.0.0.1:5000

Conda shortcuts

- `make dev311` runs the app with the conda env
- `make ingest311` runs the news ingestion command using the conda env

## Frontend PR Checklist

- Uses Material Kit/Bootstrap primitives first, custom styles second.
- Adds stable `data-*` hooks for any new JS-bound UI.
- Preserves existing Flask route and Jinja data contracts.
- Verifies `prefers-reduced-motion` behavior for new motion effects.
