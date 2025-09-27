"""Sample social data helpers used when Twitter API access is unavailable.

This module loads a JSON fixture containing representative X/Twitter posts and
user timelines so the rest of the app can operate without live API calls.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List


def _default_sample_path() -> Path:
    override = os.getenv("SOCIAL_TWITTER_SAMPLE_FILE")
    if override:
        return Path(override).expanduser()
    return (Path(__file__).resolve().parent.parent / "data" / "sample_twitter_posts.json")


@lru_cache(maxsize=1)
def _load_sample_data() -> Dict[str, Any]:
    path = _default_sample_path()
    if not path.exists():
        return {"symbols": {}, "users": {}}
    try:
        with path.open("r", encoding="utf-8") as fh:
            payload = json.load(fh)
        symbols = payload.get("symbols") or {}
        users = payload.get("users") or {}
        return {"symbols": symbols, "users": users}
    except Exception:
        return {"symbols": {}, "users": {}}


def get_sample_symbol_posts(symbol: str) -> List[Dict[str, Any]]:
    data = _load_sample_data()
    return list((data["symbols"].get(symbol.upper()) or []))


def get_sample_user_tweets(username: str) -> List[Dict[str, Any]]:
    data = _load_sample_data()
    return list((data["users"].get(username.lower()) or []))
