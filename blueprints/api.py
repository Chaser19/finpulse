from __future__ import annotations

from flask import Blueprint

from services.market_live import (
    live_energy_weekly,
    live_heatmap,
    live_index_ohlc,
    live_top_movers,
)

api_bp = Blueprint("api", __name__)


@api_bp.get("/market/indexes")
def api_market_indexes():
    return live_index_ohlc()


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
