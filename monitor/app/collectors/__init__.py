from monitor.app.collectors.science import PubMedCollector
# monitor/app/collectors/__init__.py
from typing import Dict, Type, Any, Optional

from monitor.app.collectors.base import BaseCollector
from monitor.app.collectors.rss import RSSCollector
from monitor.app.collectors.html import HTMLCollector
from monitor.app.collectors.tap import TAPCollector
from monitor.app.collectors.sonede import SONEDECollector
from monitor.app.collectors.steg import STEGCollector
from monitor.app.collectors.ins import INSCollector
from monitor.app.collectors.government import GovernmentCollector
from monitor.app.collectors.environment import EnvironmentCollector
from monitor.app.collectors.independent import IndependentCollector
from monitor.app.collectors.international import InternationalCollector

COLLECTORS: Dict[str, Type[BaseCollector]] = {
    "tap": TAPCollector,
    "rss": RSSCollector,
    "html": HTMLCollector,
    "sonede": SONEDECollector,
    "steg": STEGCollector,
    "ins": INSCollector,
    "government": GovernmentCollector,
    "environment": EnvironmentCollector,
    "independent": IndependentCollector,
    "international": InternationalCollector,
    "pubmed": PubMedCollector,
    "science": PubMedCollector
}

def get_collector(config: Dict[str, Any]) -> Optional[BaseCollector]:
    """Factory function to instantiate collector based on config type."""
    collector_type = config.get("collector", "html").lower()
    collector_cls = COLLECTORS.get(collector_type)
    if not collector_cls:
        raise ValueError(f"Unknown collector type '{collector_type}' for source '{config.get('id')}'")
    return collector_cls(config)

__all__ = [
    "BaseCollector",
    "RSSCollector",
    "HTMLCollector",
    "TAPCollector",
    "SONEDECollector",
    "STEGCollector",
    "INSCollector",
    "GovernmentCollector",
    "EnvironmentCollector",
    "IndependentCollector",
    "PubMedCollector",
    "COLLECTORS",
    "get_collector"
]
