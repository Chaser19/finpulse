from __future__ import annotations

from pathlib import Path

from flask import Blueprint, abort, jsonify, request

from services.market_live import (
    live_energy_weekly,
    live_heatmap,
    live_index_ohlc,
    live_top_movers,
    todays_headlines_from_repo,
)
from services.market_repo import MarketRepo
from services.news_repo import NewsRepo

api_bp = Blueprint("api", __name__)


def repo() -> NewsRepo:
    from flask import current_app

    return NewsRepo(current_app.config["DATA_PATH"])


def market_repo() -> MarketRepo:
    from flask import current_app

    data_dir = Path(current_app.config["DATA_PATH"]).parent
    return MarketRepo(data_dir / "market.json")


@api_bp.get("/news")
def api_news_list():
    """List news with optional filtering: /api/news?tag=Oil&q=OPEC"""
    tag = request.args.get("tag")
    q = request.args.get("q", "").strip()
    items = repo().query_news(tag=tag, q=q)
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


@api_bp.get("/market/indexes")
def api_market_indexes():
    return live_index_ohlc()


@api_bp.get("/market/headlines")
def api_market_headlines():
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

    idx = live_index_ohlc() or {}
    mv = live_top_movers() or []
    hm = live_heatmap() or []
    en = live_energy_weekly() or []
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
