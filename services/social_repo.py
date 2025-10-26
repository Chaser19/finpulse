from __future__ import annotations

import os
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
import json
import time
import requests

from services.sample_social_data import get_sample_user_tweets
from services.twitter_auth import normalize_bearer_token


@dataclass
class TweetItem:
    id: str
    date: str  # ISO8601
    text: str
    url: str


def _cache_path(data_dir: Path, username: str) -> Path:
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / f"tweets_{username.lower()}.json"


def _load_cache(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _save_cache(path: Path, payload: dict[str, Any]) -> None:
    try:
        tmp = path.with_suffix(".tmp")
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(payload, f)
        tmp.replace(path)
    except Exception:
        pass


def _now_epoch() -> int:
    return int(time.time())


def _twitter_bearer_token() -> str | None:
    raw = os.getenv("SOCIAL_TWITTER_BEARER_TOKEN") or os.getenv("TWITTER_BEARER_TOKEN")
    return normalize_bearer_token(raw)

def _sample_user_tweet_items(username: str, limit: int) -> list[TweetItem]:
    items: list[TweetItem] = []
    for raw in get_sample_user_tweets(username)[: max(0, limit)]:
        try:
            items.append(TweetItem(**raw))
        except TypeError:
            continue
    return items


def _fetch_with_twitter_api(token: str, username: str, limit: int) -> list[TweetItem]:
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "FinPulse/1.0",
    }

    try:
        user_resp = requests.get(
            f"https://api.twitter.com/2/users/by/username/{username}",
            headers=headers,
            timeout=10,
        )
    except Exception as exc:
        print(f"[social] Twitter API user lookup failed: {exc}")
        return []

    if user_resp.status_code != 200:
        snippet = user_resp.text.strip().replace("\n", " ")[:200]
        print(f"[social] Twitter API user lookup HTTP {user_resp.status_code}: {snippet}")
        return []

    data = user_resp.json().get("data") or {}
    user_id = data.get("id")
    if not user_id:
        print(f"[social] Twitter API user lookup missing id for {username}")
        return []

    items: list[TweetItem] = []
    next_token: str | None = None
    remaining = max(1, int(limit))

    while remaining > 0:
        params: dict[str, Any] = {
            "max_results": max(5, min(remaining, 100)),
            "tweet.fields": "created_at,public_metrics",
        }
        if next_token:
            params["pagination_token"] = next_token

        try:
            timeline_resp = requests.get(
                f"https://api.twitter.com/2/users/{user_id}/tweets",
                headers=headers,
                params=params,
                timeout=10,
            )
        except Exception as exc:
            print(f"[social] Twitter API timeline failed: {exc}")
            return []

        if timeline_resp.status_code == 429:
            reset = timeline_resp.headers.get("x-rate-limit-reset")
            remain = timeline_resp.headers.get("x-rate-limit-remaining")
            window = timeline_resp.headers.get("x-rate-limit-limit")
            meta = f"remaining={remain or '?'} window={window or '?'}"
            if reset:
                print(
                    f"[social] Twitter API rate limited until {reset} ({meta}); returning cached data if available"
                )
            else:
                print(f"[social] Twitter API rate limited ({meta}); returning cached data if available")
            return []

        if timeline_resp.status_code != 200:
            snippet = timeline_resp.text.strip().replace("\n", " ")[:200]
            print(
                f"[social] Twitter API timeline HTTP {timeline_resp.status_code}: {snippet}"
            )
            return []

        payload = timeline_resp.json()
        tweets = payload.get("data", [])
        if not tweets:
            break

        for tw in tweets:
            created_at_str = tw.get("created_at")
            if created_at_str:
                try:
                    created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                except ValueError:
                    created_dt = datetime.utcnow()
            else:
                created_dt = datetime.utcnow()

            text = tw.get("text", "")
            tweet_id = str(tw.get("id", ""))
            items.append(
                TweetItem(
                    id=tweet_id,
                    date=created_dt.astimezone(timezone.utc).isoformat(),
                    text=text,
                    url=f"https://twitter.com/{username}/status/{tweet_id}",
                )
            )

        remaining = limit - len(items)
        next_token = payload.get("meta", {}).get("next_token")
        if not next_token:
            break

    return items[:limit]


def get_user_tweets(data_dir: Path, username: str, *, limit: int = 5, cache_minutes: int = 10) -> list[dict[str, Any]]:
    """Return recent tweets for a user, caching results to disk.

    - Uses the Twitter v2 API (bearer token required); falls back to cache/empty list on failure.
    - Cache is per-user file at data_dir/tweets_<user>.json
    """
    token = _twitter_bearer_token()
    if not token:
        sample_items = _sample_user_tweet_items(username, limit)
        if sample_items:
            print(f"[social] Using sample timeline tweets for @{username}")
            return [asdict(it) for it in sample_items]
        return []

    cache_file = _cache_path(data_dir, username)
    cache = _load_cache(cache_file)
    now = _now_epoch()
    ttl = max(1, cache_minutes) * 60

    if cache and int(cache.get("fetched_at", 0)) + ttl > now:
        items = cache.get("items", [])
        # limit may be smaller than cached size
        return items[:limit]

    fetched = _fetch_with_twitter_api(token, username, limit=limit)
    if fetched:
        payload = {
            "username": username,
            "fetched_at": now,
            "items": [asdict(it) for it in fetched],
        }
        _save_cache(cache_file, payload)
        return payload["items"][:limit]

    if cache:
        return cache.get("items", [])[:limit]

    sample_items = _sample_user_tweet_items(username, limit)
    if sample_items:
        print(f"[social] Using sample timeline tweets for @{username}")
        return [asdict(it) for it in sample_items]

    return []
