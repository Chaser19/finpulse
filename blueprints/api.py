from __future__ import annotations
from flask import Blueprint, jsonify, request, current_app, abort
from services.news_repo import NewsRepo
from services.market_repo import MarketRepo
from pathlib import Path
from typing import Any
from datetime import datetime
import json

from services.market_live import (
    live_index_ohlc,
    live_energy_weekly,
    live_top_movers,
    todays_headlines_from_repo,
    live_heatmap,
)
from services.social_repo import get_user_tweets
from services.finnhub_live import (
    get_quote as finnhub_get_quote,
    get_profile as finnhub_get_profile,
)
from services.macro_trends import get_macro_trends
from services.tradingview import fetch_snapshots as tradingview_snapshots

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
    cfg = current_app.config
    payload: dict[str, Any] = {"symbols": {}, "history": {}, "generated_at": None}
    cfg_path = cfg.get("SOCIAL_DATA_PATH")
    if cfg_path:
        p = Path(cfg_path)
        if p.exists():
            try:
                raw = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                raw = {}
            if isinstance(raw, dict):
                payload["symbols"] = raw.get("symbols") if isinstance(raw.get("symbols"), dict) else {}
                payload["history"] = raw.get("history") if isinstance(raw.get("history"), dict) else {}
                payload["generated_at"] = raw.get("generated_at")

    symbols_map = payload.setdefault("symbols", {})
    history_map = payload.setdefault("history", {})

    def _configured_symbols() -> list[str]:
        raw_symbols = cfg.get("SOCIAL_TWITTER_SYMBOLS") or cfg.get("SOCIAL_SCRAPE_SYMBOLS") or ""
        tokens: list[str] = []
        for token in raw_symbols.replace("\n", ",").split(","):
            cleaned = token.strip().lstrip("$").upper()
            if cleaned:
                tokens.append(cleaned)
        return tokens

    for sym in _configured_symbols():
        if sym not in symbols_map:
            symbols_map[sym] = {"summary": {}, "history": history_map.get(sym, [])}
            history_map.setdefault(sym, [])

    if not symbols_map:
        return jsonify(payload)

    max_count = int(cfg.get("SOCIAL_FINNHUB_MAX_SYMBOLS", 25))
    resolution = cfg.get("SOCIAL_FINNHUB_RESOLUTION", "30")
    lookback_hours = int(cfg.get("SOCIAL_FINNHUB_LOOKBACK_HOURS", 24) or 24)

    target_symbols = list(symbols_map.keys())[:max_count]
    tv_snapshots = tradingview_snapshots(target_symbols)

    def _to_float(val):
        try:
            if val is None:
                return None
            return float(val)
        except (TypeError, ValueError):
            return None

    def _parse_timestamp(val):
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return int(val)
        if isinstance(val, str):
            try:
                return int(datetime.fromisoformat(val.replace("Z", "+00:00")).timestamp())
            except ValueError:
                return None
        return None

    def _guess_tradingview_symbol(sym: str, snapshot_symbol: str | None, profile: dict | None) -> str:
        if snapshot_symbol:
            return snapshot_symbol
        if profile:
            exch = (profile.get("exchange") or "").upper()
            ticker = (profile.get("ticker") or sym or "").upper()
            mapping = {
                "NASDAQ": "NASDAQ",
                "NYSE": "NYSE",
                "AMEX": "AMEX",
                "CBOE": "AMEX",
                "OTC": "OTC",
            }
            for key, prefix in mapping.items():
                if key in exch:
                    return f"{prefix}:{ticker}"
        return f"NASDAQ:{sym.upper()}"

    for sym in target_symbols:
        symbol_payload = symbols_map.get(sym)
        if not isinstance(symbol_payload, dict):
            symbol_payload = {}
            symbols_map[sym] = symbol_payload
        price_block = symbol_payload.setdefault("price", {})

        snapshot = tv_snapshots.get(sym.upper())
        if snapshot:
            price_block.update(snapshot)

        quote = finnhub_get_quote(sym)
        if quote:
            close = _to_float(quote.get("c"))
            prev_close = _to_float(quote.get("pc"))
            high = _to_float(quote.get("h"))
            low = _to_float(quote.get("l"))
            open_px = _to_float(quote.get("o"))
            ts = _parse_timestamp(quote.get("t"))

            if close is not None:
                price_block["close"] = close
            if prev_close is not None:
                price_block["previous_close"] = prev_close
            if high is not None:
                price_block["high"] = high
            if low is not None:
                price_block["low"] = low
            if open_px is not None:
                price_block["open"] = open_px
            if ts is not None:
                price_block["timestamp"] = ts

            if close is not None and prev_close not in (None, 0):
                change_abs = close - prev_close
                change_pct = (change_abs / prev_close) * 100
                price_block["change_abs"] = change_abs
                price_block["change_pct"] = change_pct

            price_block["source"] = "finnhub"

        profile = finnhub_get_profile(sym)
        if profile:
            price_block["exchange"] = profile.get("exchange")
            price_block["currency"] = profile.get("currency")
            price_block["company_name"] = profile.get("name")

        tv_symbol = _guess_tradingview_symbol(sym, price_block.get("tradingview_symbol"), profile)
        price_block["tradingview_symbol"] = tv_symbol

        history_entries = history_map.get(sym, [])
        if history_entries and not price_block.get("history"):
            series = []
            for entry in history_entries:
                close_val = _to_float(entry.get("close"))
                ts_val = _parse_timestamp(entry.get("timestamp"))
                if close_val is None or ts_val is None:
                    continue
                series.append({"time": ts_val, "close": close_val})
            if series:
                price_block["history"] = series
                price_block["history_resolution"] = resolution
                price_block["history_lookback_hours"] = lookback_hours

    return jsonify(payload)


@api_bp.get("/social/tweets")
def api_social_tweets():
    """Return recent tweets for a user.

    Query params:
      user: handle without @. If omitted, uses SOCIAL_TWITTER_PRIMARY_USER or first SOCIAL_TWITTER_ACCOUNTS.
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
        cfg = (current_app.config.get("SOCIAL_TWITTER_PRIMARY_USER") or "").strip().lstrip("@")
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
        return jsonify({"error": "no_user", "hint": "Provide ?user=handle or set SOCIAL_TWITTER_PRIMARY_USER"}), 400

    try:
        limit = max(1, min(50, int(request.args.get("limit", 5))))
    except Exception:
        limit = 5

    data_dir = Path(current_app.config["DATA_PATH"]).parent
    ttl = int(current_app.config.get("SOCIAL_TWITTER_TIMELINE_CACHE_MINUTES", 10))
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
