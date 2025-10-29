from __future__ import annotations

from urllib.parse import unquote


def normalize_bearer_token(value: str | None) -> str | None:
    """Return a cleaned bearer token (trimmed + percent-decoded)."""
    if not value:
        return None

    token = value.strip()

    # Drop wrapping quotes that sometimes appear in .env exports
    if len(token) >= 2 and token[0] == token[-1] and token[0] in {"'", '"'}:
        token = token[1:-1].strip()

    if "%" in token:
        try:
            decoded = unquote(token)
        except Exception:
            pass
        else:
            if decoded:
                token = decoded

    return token or None
