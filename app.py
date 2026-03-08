# made possible with ChatGpt

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, url_for

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

print("[env] FMP_KEY set:", bool(os.getenv("FMP_KEY")))
print("[env] ALPHAVANTAGE_KEY set:", bool(os.getenv("ALPHAVANTAGE_KEY")))


def create_app(test_config: dict | None = None) -> Flask:
    # Attempt to load environment variables. Fall back to .env.gitignore when .env is absent
    # so local sample keys are picked up during development.
    if not load_dotenv():
        load_dotenv(".env.gitignore")

    app = Flask(__name__, instance_relative_config=False)
    app.config.setdefault("SEND_FILE_MAX_AGE_DEFAULT", 0)
    app.config["TEMPLATES_AUTO_RELOAD"] = True

    if test_config:
        app.config.update(test_config)

    @app.context_processor
    def inject_asset_url():
        def asset_url(filename: str) -> str:
            try:
                version = int((STATIC_DIR / filename).stat().st_mtime)
            except OSError:
                version = 0
            return url_for("static", filename=filename, v=version)

        return {"asset_url": asset_url}

    from blueprints.api import api_bp
    from blueprints.web import web_bp

    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
