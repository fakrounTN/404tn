# monitor/app/services/freshness.py
from datetime import datetime, timezone
import dateutil.parser

def get_freshness_label(published_at_str: str, current_or_historical: str = "CURRENT") -> str:
    """Calculates human-readable freshness label (<24H, <7D, <30D, STALE, HISTORICAL)."""
    if current_or_historical == "HISTORICAL BASELINE":
        return "HISTORICAL"
    if current_or_historical == "NO RECENT MEASUREMENT":
        return "NO CURRENT DATA"

    if not published_at_str:
        return "UNKNOWN"

    try:
        pub_date = dateutil.parser.parse(published_at_str)
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        delta = now - pub_date
        hours = delta.total_seconds() / 3600
        days = delta.days

        if hours <= 24:
            return "<24H"
        elif days <= 7:
            return "<7D"
        elif days <= 30:
            return "<30D"
        else:
            return "STALE"
    except Exception:
        return "UNKNOWN"

def calculate_freshness(published_at_str: str, current_or_historical: str = "CURRENT") -> str:
    """Returns standard database column value: CURRENT | HISTORICAL BASELINE | NO RECENT MEASUREMENT."""
    if current_or_historical in ["HISTORICAL BASELINE", "NO RECENT MEASUREMENT"]:
        return current_or_historical
    return "CURRENT"
