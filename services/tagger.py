from __future__ import annotations
import re
from typing import Iterable, List, Set

# Curated keyword → tag mapping (extend as you wish)
KEYWORD_TAGS = {
    # Macro
    r"\b(inflation|cpi|ppi|deflator|core inflation)\b": "Inflation",
    r"\b(gdp|growth)\b": "GDP",
    r"\b(fed|fomc|powell)\b": "Fed",
    r"\b(boj|bank of japan)\b": "BoJ",
    r"\b(boe|bank of england)\b": "BoE",
    r"\b(ecb|lagarde)\b": "ECB",

    # Energy / commodities
    r"\b(opec\+?|opec)\b": "OPEC",
    r"\b(brent|wti|crude)\b": "Oil",
    r"\b(natural gas|lng)\b": "NaturalGas",
    r"\b(copper|aluminum|aluminium|nickel|zinc)\b": "BaseMetals",
    r"\b(wheat|corn|soy|soybeans|sugar)\b": "Ags",

    # Markets
    r"\b(equities|stocks|shares|equity)\b": "Equities",
    r"\b(treasuries|bonds|yields|yield)\b": "Rates",
    r"\b(fx|forex|currency|currencies|usd|eur|gbp|jpy|cny)\b": "FX",

    # Policy / geopolitics
    r"\b(sanction|sanctions)\b": "Sanctions",
    r"\b(tariff|tariffs)\b": "Tariffs",
    r"\b(fiscal|budget|deficit)\b": "Fiscal",
    r"\b(regulation|regulatory|legislation|bill)\b": "Policy",
    r"\b(congress|senate|parliament|white house)\b": "Government",
    r"\b(election|elections|campaign)\b": "Elections",
    r"\b(geopolitic|geopolitical|nato|conflict|war)\b": "Geopolitics",
}

# Simple ticker pattern: $TSLA, $AAPL, $BRNT etc.
TICKER_RX = re.compile(r"(?<!\w)\$[A-Z]{1,5}(?!\w)")

# Uppercase token extractor for things like OPEC, CPI when not covered above
UPPER_TOKEN_RX = re.compile(r"\b[A-Z]{2,6}\b")

# You can expand this to avoid false positives
STOP_TOKENS: Set[str] = {
    "AND","THE","FOR","WITH","FROM","THIS","THAT","WHAT","WILL","HAVE","HAS",
    "OPEC","CPI","PPI","GDP","ECB","BOE","BOJ","FED"  # already covered via KEYWORD_TAGS
}

def _keyword_tags(text: str) -> List[str]:
    tags: List[str] = []
    lo = text.lower()
    for rx, tag in KEYWORD_TAGS.items():
        if re.search(rx, lo):
            tags.append(tag)
    return tags

def _tickers(text: str) -> List[str]:
    return [m.group()[1:] for m in TICKER_RX.finditer(text)]  # drop leading $

def _upper_tokens(text: str) -> List[str]:
    toks = []
    for m in UPPER_TOKEN_RX.finditer(text):
        tok = m.group()
        if tok not in STOP_TOKENS and not tok.isdigit():
            toks.append(tok)
    return toks

def dedupe_preserve_order(items: Iterable[str]) -> List[str]:
    seen: Set[str] = set()
    out: List[str] = []
    for it in items:
        t = it.strip()
        if not t:
            continue
        norm = t.lower()
        if norm not in seen:
            seen.add(norm)
            out.append(t)
    return out

def auto_tags(title: str, summary: str = "", base: Iterable[str] | None = None, limit: int = 6) -> List[str]:
    """
    Generate a small set of hashtags from title (and summary).
    - base: existing tags to include/merge (e.g., provider-provided)
    - limit: cap the total number for a clean UI
    """
    text = f"{title} {summary}".strip()
    candidates: List[str] = []
    candidates += _keyword_tags(text)
    candidates += _tickers(text)
    candidates += _upper_tokens(title)  # keep this limited to title to reduce noise

    # Merge with provided base tags
    if base:
        candidates = list(base) + candidates

    # Dedupe and cap
    return dedupe_preserve_order(candidates)[:limit]
