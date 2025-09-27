from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional


class MarketRepo:
    """
    Local market snapshot loader. Reads finpulse/data/market.json.
    Swap this later for live APIs (e.g., FMP, Finnhub, Marketaux entities, etc).
    """

    def __init__(self, data_path: str | Path):
        self.path = Path(data_path)

    def _load(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {}
        with self.path.open("r", encoding="utf-8") as f:
            return json.load(f)

    # Index OHLC series for charts
    def index_ohlc(self) -> Dict[str, List[Dict[str, Any]]]:
        return self._load().get("indexes", {})

    # “Impactful” headlines (simple heuristic = latest N titles from NewsRepo or curated list)
    def today_headlines(self) -> List[Dict[str, str]]:
        # If you want to compute dynamically, you could read NewsRepo here.
        # For now, return the curated list in market.json
        return self._load().get("headlines_today", [])

    # Weekly commodity changes (%)
    def energy_weekly(self) -> List[Dict[str, Any]]:
        return self._load().get("energy_weekly", [])

    # Top movers list with tiny sparkline series
    def top_movers(self) -> List[Dict[str, Any]]:
        return self._load().get("top_movers", [])