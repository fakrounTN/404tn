# monitor/app/services/locations.py
import yaml
import os

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")

def load_locations():
    loc_path = os.path.join(CONFIG_DIR, "locations.yaml")
    if os.path.exists(loc_path):
        with open(loc_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return {l["slug"]: l for l in data.get("locations", [])}
    return {}

LOCATIONS_MAP = load_locations()

def get_location_coords(location_slug: str):
    loc = LOCATIONS_MAP.get(location_slug)
    if loc:
        return loc["lat"], loc["lon"], loc["name"]
    return None, None, location_slug
