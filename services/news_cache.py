"""Background auto-refresh for news ingestion."""

from __future__ import annotations

import logging
from pathlib import Path
from threading import Event, Lock, Thread
from typing import Optional

from services.ingest import ingest_all


log = logging.getLogger(__name__)

_DEFAULT_INTERVAL_SECONDS = 2 * 60 * 60  # 2 hours
_THREAD_STARTED = False
_STOP_EVENT: Event | None = None
_INGEST_LOCK = Lock()


def _ensure_data_path(path: Path) -> None:
    """Guarantee the news data file exists so watchers do not fail."""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_text("[]", encoding="utf-8")
    except Exception as exc:  # pragma: no cover - defensive
        log.warning("[news] unable to prepare data path %s: %s", path, exc)


def _run_ingest(
    data_path: Path,
    *,
    include_alpha_vantage: bool = True,
    include_newsapi: bool = True,
) -> Optional[int]:
    """Serialize ingest_all calls so concurrent refreshes don't collide."""
    with _INGEST_LOCK:
        return ingest_all(
            str(data_path),
            include_alpha_vantage=include_alpha_vantage,
            include_newsapi=include_newsapi,
        )


def init_news_cache(
    app,
    *,
    interval_seconds: Optional[int] = None,
) -> None:
    """Kick off a background worker that refreshes news every few hours."""
    global _THREAD_STARTED, _STOP_EVENT

    if _THREAD_STARTED:
        return

    cfg = app.config
    data_path = Path(cfg["DATA_PATH"])
    include_alpha = bool(cfg.get("NEWS_AUTO_INCLUDE_ALPHA_VANTAGE", True))
    include_newsapi = bool(cfg.get("NEWS_AUTO_INCLUDE_NEWSAPI", True))
    interval = (
        _DEFAULT_INTERVAL_SECONDS
        if interval_seconds is None
        else max(int(interval_seconds), 0)
    )

    _ensure_data_path(data_path)

    try:
        total = _run_ingest(
            data_path,
            include_alpha_vantage=include_alpha,
            include_newsapi=include_newsapi,
        )
        if total is not None:
            app.logger.info("[news] cache refreshed with %s articles", total)
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.warning("[news] initial ingest failed: %s", exc)

    if interval == 0:
        _THREAD_STARTED = True
        return

    stop_event = Event()

    def refresh_loop():  # pragma: no cover - background worker
        with app.app_context():
            wait_interval = max(interval, 60)
            while not stop_event.wait(wait_interval):
                try:
                    total = _run_ingest(
                        data_path,
                        include_alpha_vantage=include_alpha,
                        include_newsapi=include_newsapi,
                    )
                    if total is not None:
                        app.logger.debug("[news] cache refreshed (%s articles)", total)
                except Exception as exc:
                    app.logger.warning("[news] scheduled ingest failed: %s", exc)

    thread = Thread(target=refresh_loop, name="news-auto-ingest", daemon=True)
    thread.start()

    _THREAD_STARTED = True
    _STOP_EVENT = stop_event
