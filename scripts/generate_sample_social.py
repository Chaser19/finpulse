#!/usr/bin/env python3
"""Generate rich sample social data for offline testing."""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List


DEFAULT_USER_SAMPLES: Dict[str, List[dict]] = {
    "velajuel40": [
        {
            "id": "velajuel_001",
            "date": "2025-08-10T10:15:00+00:00",
            "text": "Scanning small caps for the week. $IXHL, $ONDS and $MNMD all on watch for continuation setups.",
            "url": "https://twitter.com/velajuel40/status/velajuel_001",
        },
        {
            "id": "velajuel_002",
            "date": "2025-08-11T14:32:18+00:00",
            "text": "Trimmed some $IXHL at 3.45 and rolling gains into September calls. Still think we see $4 with the catalyst stack.",
            "url": "https://twitter.com/velajuel40/status/velajuel_002",
        },
        {
            "id": "velajuel_003",
            "date": "2025-08-12T09:05:44+00:00",
            "text": "$AAPL upgrade out this morning bumping PT to 260. Keeping a swing core while scalping intraday levels.",
            "url": "https://twitter.com/velajuel40/status/velajuel_003",
        },
        {
            "id": "velajuel_004",
            "date": "2025-08-13T11:12:22+00:00",
            "text": "Watching $ONDS reaction around 10; neutral bias until new orders drop.",
            "url": "https://twitter.com/velajuel40/status/velajuel_004",
        },
    ]
}


def baseline_price(symbol: str) -> float:
    anchors = {"IXHL": 3.25, "AAPL": 215.0, "ONDS": 9.75}
    return anchors.get(symbol.upper(), 25.0 + (len(symbol) % 7) * 3)


def build_text(symbol: str, sentiment: str, rng: random.Random) -> str:
    levels = [
        "VWAP",
        "pre-market high",
        "gap fill",
        "trend line",
        "weekly pivot",
        "supply wall",
    ]
    catalysts = [
        "earnings call",
        "Fed speak",
        "short report",
        "option sweeps",
        "AI chatter",
        "deal rumor",
        "volume spike",
    ]
    verbs = [
        "watching",
        "scalping",
        "adding to",
        "fading",
        "accumulating",
        "hedging",
        "waiting on",
    ]
    moods = {
        "bullish": [
            "Bulls defending {level} with conviction",
            "Momentum screams higher if {symbol} holds {level}",
            "Call flow lighting up the tape",
            "Break of {price} opens room to {target}",
            "Accumulation zone all morning, dips keep getting bought",
        ],
        "bearish": [
            "Rejecting {level} again; sellers still control the tape",
            "Flow shows repeated put walls hitting every pop",
            "Shorting pops until it reclaims {price}",
            "Watch for liquidity rug if {symbol} loses {level}",
            "That {catalyst} headline killed the bid",
        ],
        "neutral": [
            "Range bound between {price} and {target}, waiting for confirmation",
            "Eyes on {catalyst} later today before choosing a direction",
            "Letting this base out near {level}",
            "Gamma pin keeping things tight into the close",
            "Need a close over {price} to care, under {target} becomes a fade",
        ],
    }

    base = baseline_price(symbol)
    delta = rng.uniform(-0.35, 0.6) * base
    price_a = round(max(0.25, base + delta), 2)
    price_b = round(max(0.25, base + rng.uniform(-0.2, 0.7) * base), 2)

    template = rng.choice(moods[sentiment])
    text = template.format(
        symbol=f"${symbol.upper()}",
        level=rng.choice(levels),
        catalyst=rng.choice(catalysts),
        price=price_a,
        target=price_b,
    )
    extra = rng.choice(
        [
            "Float rotation happening fast.",
            "Liquidity pockets are thin.",
            "Volume profile still bullish.",
            "Premiums exploding already.",
            "Risk defined under last pivot.",
            "Dollar strength is the only headwind.",
        ]
    )
    verb = rng.choice(verbs)
    return f"{verb.capitalize()} {text}. {extra}"


def generate_posts(symbol: str, count: int, seed: int) -> List[Dict[str, object]]:
    rng = random.Random(f"{symbol}-{seed}-{count}")
    base_time = datetime.now(timezone.utc) - timedelta(minutes=count * 5)
    posts: List[Dict[str, object]] = []
    sentiments = ["bullish", "bearish", "neutral"]
    weights = [0.46, 0.34, 0.2]

    for idx in range(1, count + 1):
        sentiment = rng.choices(sentiments, weights=weights, k=1)[0]
        created_at = base_time + timedelta(minutes=idx * 5 + rng.randint(0, 4))
        like_mu = {"bullish": 145, "bearish": 95, "neutral": 70}[sentiment]
        like_sigma = {"bullish": 55, "bearish": 45, "neutral": 35}[sentiment]
        likes = max(0, int(rng.normalvariate(like_mu, like_sigma)))
        likes = min(likes, 900)
        replies = rng.randint(0, max(1, likes // 7 + 3))
        reposts = rng.randint(0, max(1, likes // 5 + 2))
        posts.append(
            {
                "id": f"{symbol.lower()}_{idx:04d}",
                "source": "x",
                "symbol": symbol.upper(),
                "author": f"{sentiment[:4]}_{symbol.lower()}_{rng.randint(100, 999)}",
                "url": f"https://twitter.com/sample/{symbol.lower()}/{idx}",
                "created_at": created_at.isoformat(),
                "text": build_text(symbol, sentiment, rng),
                "like_count": likes,
                "reply_count": replies,
                "repost_count": reposts,
            }
        )
    return posts


def load_existing_users(path: Path) -> Dict[str, List[dict]]:
    if not path.exists():
        return DEFAULT_USER_SAMPLES
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        users = payload.get("users")
        return users if isinstance(users, dict) and users else DEFAULT_USER_SAMPLES
    except Exception:
        return DEFAULT_USER_SAMPLES


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate sample Twitter-style social data.")
    parser.add_argument("--symbols", nargs="+", default=["IXHL", "AAPL", "ONDS"], help="Symbols to populate")
    parser.add_argument("--posts", type=int, default=1000, help="Post count per symbol")
    parser.add_argument("--seed", type=int, default=42, help="Seed to keep samples deterministic")
    parser.add_argument("--output", type=Path, default=Path("data/sample_twitter_posts.json"), help="Output path")
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    users = load_existing_users(args.output)
    payload = {
        "symbols": {
            sym.upper(): generate_posts(sym.upper(), max(1, args.posts), args.seed) for sym in args.symbols
        },
        "users": users,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"Wrote {args.posts} posts for each of {len(args.symbols)} symbols "
        f"({len(args.symbols) * args.posts} total)."
    )


if __name__ == "__main__":
    main()
