from __future__ import annotations
from pathlib import Path
import json, time
from typing import Any

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

def cache_path(key: str) -> Path:
    return CACHE_DIR / f"{key}.json"

def write_cache(key: str, data: Any) -> None:
    p = cache_path(key)
    p.write_text(json.dumps({"ts": int(time.time()), "data": data}, ensure_ascii=False), encoding="utf-8")

def read_cache(key: str, max_age_sec: int) -> Any | None:
    p = cache_path(key)
    if not p.exists(): return None
    try:
        obj = json.loads(p.read_text(encoding="utf-8"))
        if int(time.time()) - int(obj.get("ts", 0)) <= max_age_sec:
            return obj.get("data")
    except Exception:
        return None
    return None