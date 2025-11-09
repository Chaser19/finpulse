"""WSGI entrypoint for production servers (e.g. gunicorn on Azure)."""

from app import create_app

app = create_app()

