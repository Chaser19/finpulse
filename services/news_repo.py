"""
NewsRepo: a tiny data-access layer for FinPulse.

- Reads/writes: local JSON file (no DB yet).
- Caches records in-memory and hot-reloads when the file changes.
- Normalizes items (e.g., parses dates, cleans tags).
- Provides query helpers for:
    - list_all, list_categories, get_by_id
    - query_news (single category + search or #tag)
    - list_top_tags (for building tag filters)
    - query_curated (multi-industry + multi-#tag + search)
"""

from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from collections import Counter


class NewsRepo:
    """Lightweight repository over a JSON file.

    Notes on in-memory fields:
      - Each item gets an internal `_date: datetime` derived from its `date` string.
        This makes sorting by recency trivial. `_date` is NOT persisted back to disk.
      - All other fields (id, title, summary, source, url, category, tags) are kept
        as strings/lists of strings to match your JSON schema.
    """

    # -------------------------------------------------------------------------
    # Construction & cache state
    # -------------------------------------------------------------------------
    def __init__(self, data_path: str | Path):
        # Path to the JSON data file
        self.path = Path(data_path)

        # In-memory cache of items (list[dict]) and the file modification time we last saw
        self._cache: List[Dict[str, Any]] | None = None
        self._mtime: float | None = None

    # -------------------------------------------------------------------------
    # Internal: load (or reload) JSON file into cache if the file changed.
    #           This allows hot-reloading without restarting the server.
    # -------------------------------------------------------------------------
    def _load_if_changed(self) -> None:
        # Current filesystem mtime
        mtime = self.path.stat().st_mtime

        # If we have no cache yet, or the file changed since last load, read it fresh
        if self._cache is None or self._mtime != mtime:
            with self.path.open("r", encoding="utf-8") as f:
                items: List[Dict[str, Any]] = json.load(f)

            # Normalize and enrich every record
            for item in items:
                # Parse date → internal datetime for reliable, fast sorting
                try:
                    item["_date"] = datetime.strptime(item.get("date", "1970-01-01"), "%Y-%m-%d")
                except Exception:
                    # Fall back to epoch-like value if date is malformed
                    item["_date"] = datetime(1970, 1, 1)

                # Ensure tags is always a list[str]
                raw_tags = item.get("tags", [])
                item["tags"] = [str(t).strip() for t in raw_tags] if isinstance(raw_tags, list) else []

                # Default category and id normalization
                item["category"] = item.get("category", "Uncategorized")
                item["id"] = str(item.get("id"))

            # Keep cache sorted newest → oldest by internal _date
            self._cache = sorted(items, key=lambda x: x.get("_date") or datetime(1970, 1, 1), reverse=True)
            self._mtime = mtime

    # -------------------------------------------------------------------------
    # Basic accessors
    # -------------------------------------------------------------------------
    def list_all(self) -> List[Dict[str, Any]]:
        """Return ALL items (already sorted newest → oldest)."""
        self._load_if_changed()
        # Return a shallow copy so callers don't accidentally mutate the cache
        return list(self._cache or [])

    def list_categories(self) -> List[str]:
        """Return all distinct categories (alphabetical)."""
        self._load_if_changed()
        return sorted({n.get("category", "Uncategorized") for n in (self._cache or [])})

    def get_by_id(self, news_id: str) -> Optional[Dict[str, Any]]:
        """Lookup a single item by its 'id' string."""
        self._load_if_changed()
        for n in (self._cache or []):
            if n.get("id") == str(news_id):
                # Return a copy to prevent external mutation of cache
                return dict(n)
        return None

    # -------------------------------------------------------------------------
    # Query: simple list with optional single-category filter and search
    # Search rules:
    #   - If q starts with '#', do an EXACT tag match (case-insensitive).
    #   - Else, do a case-insensitive substring search across title, summary, and tags.
    # -------------------------------------------------------------------------
    def query_news(self, *, tag: str | None = None, q: str | None = None) -> List[Dict[str, Any]]:
        self._load_if_changed()
        items = self._cache or []

        # Filter by category if provided
        if tag:
            items = [n for n in items if n.get("category") == tag]

        # Free-text or exact-#tag search
        if q:
            q = q.strip()
            if q.startswith("#"):
                # Exact tag match, ignoring case and optional leading '#'
                needle = q[1:].lower()
                items = [n for n in items if any(needle == t.lower() for t in n.get("tags", []))]
            else:
                # Substring match across fields
                ql = q.lower()

                def matches(n: Dict[str, Any]) -> bool:
                    return (
                        ql in n.get("title", "").lower()
                        or ql in n.get("summary", "").lower()
                        or any(ql in t.lower() for t in n.get("tags", []))
                    )

                items = [n for n in items if matches(n)]

        # Already sorted by _date in cache
        return list(items)

    # -------------------------------------------------------------------------
    # Analytics helper: most common tags, used for building UI filters.
    # Returns a list of (tag, count) tuples.
    # -------------------------------------------------------------------------
    def list_top_tags(self, limit: int = 30) -> List[Tuple[str, int]]:
        self._load_if_changed()
        counter: Counter[str] = Counter()
        for n in (self._cache or []):
            for t in n.get("tags", []):
                if t and isinstance(t, str):
                    counter[t] += 1
        return counter.most_common(limit)

    # -------------------------------------------------------------------------
    # Curated query:
    #   - industries: select items whose category is in this list
    #   - tags:       select items by one or more tags (strings with/without '#')
    #   - tag_mode:   'any' (default) returns if any tag matches,
    #                 'all' returns only if ALL provided tags match
    #   - q:          same search behavior as query_news (supports '#exact' tag)
    #
    # Always returns newest → oldest.
    # -------------------------------------------------------------------------
    def query_curated(
        self,
        *,
        industries: List[str] | None = None,
        tags: List[str] | None = None,    # multiple #tags supported
        tag_mode: str = "any",            # "any" or "all"
        q: str | None = None
    ) -> List[Dict[str, Any]]:
        self._load_if_changed()
        items = self._cache or []

        # 1) Filter by industries (categories)
        if industries:
            want = set(industries)
            items = [n for n in items if n.get("category") in want]

        # 2) Filter by multiple tags with 'any' / 'all' logic
        if tags:
            # Normalize input tags: strip leading '#' and lowercase
            want_tags = [t.lower().lstrip("#") for t in tags if t]

            if tag_mode not in ("any", "all"):
                tag_mode = "any"

            def tag_pred(n: Dict[str, Any]) -> bool:
                ntags = [t.lower().lstrip("#") for t in n.get("tags", [])]
                if tag_mode == "all":
                    return all(w in ntags for w in want_tags)
                return any(w in ntags for w in want_tags)

            items = [n for n in items if tag_pred(n)]

        # 3) Optional search (same semantics as query_news)
        if q:
            q = q.strip()
            if q.startswith("#"):
                needle = q[1:].lower()
                items = [n for n in items if any(needle == t.lower() for t in n.get("tags", []))]
            else:
                ql = q.lower()

                def matches(n: Dict[str, Any]) -> bool:
                    return (
                        ql in n.get("title", "").lower()
                        or ql in n.get("summary", "").lower()
                        or any(ql in t.lower() for t in n.get("tags", []))
                    )

                items = [n for n in items if matches(n)]

        # 4) Ensure newest → oldest
        items = sorted(items, key=lambda x: x.get("_date") or datetime(1970, 1, 1), reverse=True)
        return list(items)