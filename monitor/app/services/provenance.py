# monitor/app/services/provenance.py
import yaml
import os

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")

def load_source_registry():
    src_path = os.path.join(CONFIG_DIR, "sources.yaml")
    if os.path.exists(src_path):
        with open(src_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return {s["id"]: s for s in data.get("sources", [])}
    return {}

SOURCE_MAP = load_source_registry()

def calculate_provenance(source_id: str, source_domain: str) -> dict:
    src_info = SOURCE_MAP.get(source_id)
    if src_info:
        return {
            "source_name": src_info.get("name", source_domain),
            "source_type": src_info.get("source_type", "independent_reporting"),
            "trust_weight": src_info.get("trust_weight", 0.85)
        }
    return {
        "source_name": source_domain,
        "source_type": "independent_reporting",
        "trust_weight": 0.80
    }
