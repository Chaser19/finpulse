# made possible with ChatGpt

from __future__ import annotations

import os
from pathlib import Path

import click
from dotenv import load_dotenv
from flask import Flask, current_app
from flask.cli import with_appcontext

BASE_DIR = Path(__file__).resolve().parent

print("[env] FMP_KEY set:", bool(os.getenv("FMP_KEY")))
print("[env] ALPHAVANTAGE_KEY set:", bool(os.getenv("ALPHAVANTAGE_KEY")))


def _env_flag(name: str, default: bool = True) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@click.command("ingest-news")
@with_appcontext
def ingest_news_cmd():
    """Fetch from providers and merge into data/news.json."""
    from services.ingest import ingest_all

    n = ingest_all(current_app.config["DATA_PATH"])
    click.echo(f"Ingested. Total items now: {n}")


def create_app(test_config: dict | None = None) -> Flask:
    # Attempt to load environment variables. Fall back to .env.gitignore when .env is absent
    # so local sample keys are picked up during development.
    if not load_dotenv():
        load_dotenv(".env.gitignore")

    app = Flask(__name__, instance_relative_config=False)

    news_refresh_interval = int(os.getenv("NEWS_REFRESH_INTERVAL_SECONDS", str(2 * 60 * 60)))

    app.config.from_mapping(
        {
            "DATA_PATH": str(BASE_DIR / "data" / "news.json"),
            "NEWS_REFRESH_INTERVAL_SECONDS": news_refresh_interval,
            "NEWS_AUTO_INCLUDE_ALPHA_VANTAGE": _env_flag("NEWS_AUTO_INCLUDE_ALPHA_VANTAGE", True),
            "NEWS_AUTO_INCLUDE_NEWSAPI": _env_flag("NEWS_AUTO_INCLUDE_NEWSAPI", True),
        }
    )

    if test_config:
        app.config.update(test_config)

    from blueprints.api import api_bp
    from blueprints.web import web_bp

    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    app.cli.add_command(ingest_news_cmd, name="ingest-news")

    try:
        from services.news_cache import init_news_cache

        init_news_cache(app, interval_seconds=app.config.get("NEWS_REFRESH_INTERVAL_SECONDS"))
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.warning("Unable to start news auto-ingest: %s", exc)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
