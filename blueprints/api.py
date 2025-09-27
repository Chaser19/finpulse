from __future__ import annotations
from flask import Blueprint, jsonify, request, current_app, abort
from services.news_repo import NewsRepo
from services.market_repo import MarketRepo
from pathlib import Path
import json

from services.market_live import (
    live_index_ohlc,
    live_energy_weekly,
    live_top_movers,
    todays_headlines_from_repo,
    live_heatmap,
)
from services.social_repo import get_user_tweets
from services.macro_trends import get_macro_trends

api_bp = Blueprint("api", __name__)


def repo() -> NewsRepo:
    from flask import current_app
    return NewsRepo(current_app.config["DATA_PATH"])


@api_bp.get("/news")
def api_news_list():
    """List news with optional filtering: /api/news?tag=Oil&q=OPEC"""
    tag = request.args.get("tag")
    q = request.args.get("q", "").strip()
    items = repo().query_news(tag=tag, q=q)
    # Drop private fields before returning
    for it in items:
        it.pop("_date", None)
    return jsonify(items)


@api_bp.get("/news/<news_id>")
def api_news_detail(news_id: str):
    item = repo().get_by_id(news_id)
    if not item:
        abort(404)
    item.pop("_date", None)
    return jsonify(item)

def market_repo() -> MarketRepo:
    from flask import current_app
    data_dir = Path(current_app.config["DATA_PATH"]).parent
    return MarketRepo(data_dir / "market.json")

@api_bp.get("/market/indexes")
def api_market_indexes():
    return live_index_ohlc()

@api_bp.get("/market/headlines")
def api_market_headlines():
    # Use your news repo for the most impactful (newest) 3–5
    items = repo().list_all()
    return todays_headlines_from_repo(items, limit=5)

@api_bp.get("/market/energy_weekly")
def api_market_energy_weekly():
    return live_energy_weekly()

@api_bp.get("/market/movers")
def api_market_movers():
    return live_top_movers()

@api_bp.get("/market/heatmap")
def api_market_heatmap():
    return live_heatmap()

@api_bp.get("/_diag")
def api_diag():
    import os
    from services.market_live import live_index_ohlc, live_top_movers, live_heatmap, live_energy_weekly
    idx = live_index_ohlc() or {}
    mv  = live_top_movers() or []
    hm  = live_heatmap() or []
    en  = live_energy_weekly() or []
    return {
        "keys_set": {
            "FMP_KEY": bool(os.getenv("FMP_KEY")),
            "ALPHAVANTAGE_KEY": bool(os.getenv("ALPHAVANTAGE_KEY")),
        },
        "indexes_live_lengths": {k: len(v or []) for k, v in idx.items()},
        "movers_live_len": len(mv),
        "heatmap_live_len": len(hm),
        "energy_live_len": len(en),
    }


@api_bp.get("/social/summary")
def api_social_summary():
    """Return aggregated social sentiment from data/social.json.

    Structure: {
      generated_at: ISO8601,
      symbols: {
        "SPY": { summary: {...}, posts: [...] }, ...
      }
    }
    """
    cfg_path = current_app.config.get("SOCIAL_DATA_PATH")
    if not cfg_path:
        return jsonify({"symbols": {}, "generated_at": None})
    p = Path(cfg_path)
    if not p.exists():
        return jsonify({"symbols": {}, "generated_at": None})
    try:
        payload = json.loads(p.read_text(encoding="utf-8"))
        # Ensure expected keys exist
        if not isinstance(payload, dict):
            payload = {"symbols": {}, "generated_at": None}
        payload.setdefault("symbols", {})
        payload.setdefault("generated_at", None)
        return jsonify(payload)
    except Exception:
        return jsonify({"symbols": {}, "generated_at": None})


@api_bp.get("/social/tweets")
def api_social_tweets():
    """Return recent tweets for a user.

    Query params:
      user: handle without @. If omitted, uses SOCIAL_TWITTER_SCRAPE_USER or first SOCIAL_TWITTER_ACCOUNTS.
      limit: number of tweets (default 5, max 50).
    """
    token = (current_app.config.get("SOCIAL_TWITTER_BEARER_TOKEN") or "").strip()
    if not token:
        return (
            jsonify(
                {
                    "error": "twitter_token_missing",
                    "hint": "Set SOCIAL_TWITTER_BEARER_TOKEN in your environment to enable this endpoint.",
                }
            ),
            501,
        )

    u = (request.args.get("user") or "").strip().lstrip("@")
    if not u:
        cfg = (current_app.config.get("SOCIAL_TWITTER_SCRAPE_USER") or "").strip().lstrip("@")
        if cfg:
            u = cfg
        else:
            raw = (current_app.config.get("SOCIAL_TWITTER_ACCOUNTS") or "")
            for token in raw.replace("\n", ",").replace(" ", ",").split(","):
                t = token.strip().lstrip("@")
                if t:
                    u = t
                    break
    if not u:
        return jsonify({"error": "no_user", "hint": "Provide ?user=handle or set SOCIAL_TWITTER_SCRAPE_USER"}), 400

    try:
        limit = max(1, min(50, int(request.args.get("limit", 5))))
    except Exception:
        limit = 5

    data_dir = Path(current_app.config["DATA_PATH"]).parent
    ttl = int(current_app.config.get("SOCIAL_TWITTER_SCRAPE_CACHE_MINUTES", 10))
    items = get_user_tweets(data_dir, u, limit=limit, cache_minutes=ttl)
    return jsonify(items)


@api_bp.get("/macro/trends")
def api_macro_trends():
    cfg = current_app.config
    data = get_macro_trends(
        fred_api_key=cfg.get("FRED_API_KEY", ""),
        eia_api_key=cfg.get("EIA_API_KEY", ""),
    )
    return jsonify(data)
