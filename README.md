FinPulse

----

File guide
App + Blueprints

app.py
Flask app factory (`create_app()`), loads `.env`, and registers the web/api blueprints.

web.py
“Pages” blueprint. Routes:

/ – redirect to mission
/mission – mission page
/contact – contact page

It also injects real-time US market open/closed status into templates.

api.py
Market API endpoints:
- `GET /api/market/indexes`
- `GET /api/market/movers`
- `GET /api/market/heatmap`
- `GET /api/market/energy_weekly`
- `GET /api/_diag`

----

Backend Logic

services/market_live.py
Live market adapters for indexes, movers, heatmap, and weekly energy snapshots.

services/market_repo.py
Local `data/market.json` loader.

----

Templates

templates/layout.html
Dark navbar + search; includes Bootstrap, global CSS/JS; sets page blocks.

Static assets

static/css/styles.css
Global theme and component styling.

Data + config

data/market.json
Local market snapshot data.

.env
Environment variables for live market integrations.

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
# Required for live market data: ALPHAVANTAGE_KEY (and any optional provider keys used by your setup)

# 3) Serve
python app.py
# open http://127.0.0.1:5000

Conda shortcuts

- `make dev311` runs the app with the conda env

## Frontend PR Checklist

- Uses Material Kit/Bootstrap primitives first, custom styles second.
- Adds stable `data-*` hooks for any new JS-bound UI.
- Preserves existing Flask route and Jinja data contracts.
- Verifies `prefers-reduced-motion` behavior for new motion effects.
