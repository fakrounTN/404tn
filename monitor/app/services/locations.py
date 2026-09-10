# monitor/app/services/locations.py
import yaml
import os
import re
import unicodedata
from dataclasses import dataclass
from typing import Tuple, Optional, Dict, Any, List, Set

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")

@dataclass
class ResolvedLocation:
    canonical_name: str
    scope: str                      # "LOCAL" | "GOVERNORATE" | "MULTI_GOVERNORATE" | "NATIONAL" | "UNRESOLVED"
    governorate: Optional[str]      # e.g. "Sfax", "Gabès", "Kasserine", or None
    delegation: Optional[str]       # e.g. "El Amra", "Metlaoui", "Zarzis", or None
    locality: Optional[str]         # e.g. "Chatt Essalam", "Port de pêche", or None
    latitude: Optional[float]
    longitude: Optional[float]
    location_confidence: float      # 0.0 to 1.0
    location_method: str            # "EXPLICIT_LOCALITY" | "DELEGATION_MATCH" | "GOVERNORATE_MATCH" | "NATIONAL_CONTEXT" | "UNRESOLVED"
    reason: str
    matched_phrase: Optional[str] = None
    evidence_context: Optional[str] = None

def load_locations() -> Dict[str, Dict[str, Any]]:
    loc_path = os.path.join(CONFIG_DIR, "locations.yaml")
    if os.path.exists(loc_path):
        with open(loc_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return {l["slug"]: l for l in data.get("locations", [])}
    return {}

LOCATIONS_MAP = load_locations()

# Authoritative dictionary of all 24 Tunisian governorates, delegations, and localities
GOVERNORATE_DEFINITIONS = [
    {
        "slug": "tunis",
        "governorate": "Tunis",
        "name_ar": "تونس",
        "name_fr": "Tunis",
        "centroid": (36.8065, 10.1815),
        "gov_patterns": [
            r"\b(gouvernorat\s+de\s+tunis|ville\s+de\s+tunis|municipalite\s+de\s+tunis|tunis\s+centre|centre-ville\s+de\s+tunis|tunis\s+marine|capital\s+tunis|tunis\s+capitale|quartiers?\s+de\s+tunis|a\s+tunis|in\s+tunis|grand\s+tunis|tunis-ville|ولاية\s+تونس|مدينة\s+تونس|بلدية\s+تونس|تونس\s+العاصمة|في\s+تونس\s+العاصمة)\b"
        ],
        "delegations": [
            {"name": "Carthage", "patterns": [r"\b(carthage|قرطاج)\b"], "coords": (36.8588, 10.3308)},
            {"name": "Le Bardo", "patterns": [r"\b(le\s+bardo|bardo|باردو)\b"], "coords": (36.8092, 10.1406)},
            {"name": "La Goulette", "patterns": [r"\b(la\s+goulette|goulette|حلق\s+الوادي)\b"], "coords": (36.8181, 10.3050)},
            {"name": "La Marsa", "patterns": [r"\b(la\s+marsa|marsa|المرسى)\b"], "coords": (36.8782, 10.3247)},
            {"name": "Sidi Bou Said", "patterns": [r"\b(sidi\s+bou\s+said|سيدي\s+بوسعيد|سيدي\s+بو\s+سعيد)\b"], "coords": (36.8711, 10.3417)},
            {"name": "El Menzah", "patterns": [r"\b(el\s+menzah|menzah|المنزه)\b"], "coords": (36.8378, 10.1772)},
            {"name": "El Omrane", "patterns": [r"\b(el\s+omrane|العمران)\b"], "coords": (36.8200, 10.1600)},
            {"name": "Bab Souika", "patterns": [r"\b(bab\s+souika|باب\s+سويقة)\b"], "coords": (36.8080, 10.1680)},
            {"name": "Bab Bhar", "patterns": [r"\b(bab\s+bhar|porte\s+de\s+france|باب\s+بحر)\b"], "coords": (36.7990, 10.1760)},
            {"name": "Sidi Hassine", "patterns": [r"\b(sidi\s+hassine|سيدي\s+حسين)\b"], "coords": (36.7600, 10.1100)},
            {"name": "Le Kram", "patterns": [r"\b(le\s+kram|kram|الكرم)\b"], "coords": (36.8330, 10.3170)}
        ]
    },
    {
        "slug": "ariana",
        "governorate": "Ariana",
        "name_ar": "أريانة",
        "name_fr": "Ariana",
        "centroid": (36.8665, 10.1647),
        "gov_patterns": [
            r"\b(ariana|أريانة|اريانة|ولاية\s+أريانة|ولاية\s+اريانة)\b"
        ],
        "delegations": [
            {"name": "Raoued", "patterns": [r"\b(raoued|رواد)\b"], "coords": (36.9200, 10.1800)},
            {"name": "La Soukra", "patterns": [r"\b(la\s+soukra|soukra|السكرة|سكرة)\b"], "coords": (36.8800, 10.2500)},
            {"name": "Kalaat el Andalous", "patterns": [r"\b(kalaat\s+el\s+andalous|قلعة\s+الأندلس|قلعة\s+الاندلس)\b"], "coords": (37.0600, 10.1200)},
            {"name": "Sidi Thabet", "patterns": [r"\b(sidi\s+thabet|سيدي\s+ثابت)\b"], "coords": (36.9100, 10.0400)},
            {"name": "Ettadhamen", "patterns": [r"\b(ettadhamen|التضامن|حي\s+التضامن)\b"], "coords": (36.8300, 10.1200)},
            {"name": "Mnihla", "patterns": [r"\b(mnihla|المنيهلة)\b"], "coords": (36.8400, 10.1100)}
        ]
    },
    {
        "slug": "ben_arous",
        "governorate": "Ben Arous",
        "name_ar": "بن عروس",
        "name_fr": "Ben Arous",
        "centroid": (36.7531, 10.2189),
        "gov_patterns": [
            r"\b(ben\s+arous|بن\s+عروس|ولاية\s+بن\s+عروس)\b"
        ],
        "delegations": [
            {"name": "Rades", "patterns": [r"\b(rades|port\s+de\s+rades|رادس|ميناء\s+رادس)\b"], "coords": (36.7700, 10.2700)},
            {"name": "Megrine", "patterns": [r"\b(megrine|مقرين)\b"], "coords": (36.7700, 10.2300)},
            {"name": "Ezzahra", "patterns": [r"\b(ezzahra|الزهراء)\b"], "coords": (36.7400, 10.3100)},
            {"name": "Hammam Lif", "patterns": [r"\b(hammam\s+lif|حمام\s+الأنف|حمام\s+الانف)\b"], "coords": (36.7300, 10.3400)},
            {"name": "Hammam Chott", "patterns": [r"\b(hammam\s+chott|حمام\s+الشط)\b"], "coords": (36.7200, 10.3600)},
            {"name": "Boumhel", "patterns": [r"\b(boumhel|بومهل)\b"], "coords": (36.7200, 10.3000)},
            {"name": "Fouchana", "patterns": [r"\b(fouchana|فوشانة)\b"], "coords": (36.7000, 10.1700)},
            {"name": "Mornag", "patterns": [r"\b(mornag|مرناق)\b"], "coords": (36.6800, 10.2900)},
            {"name": "Mohamedia", "patterns": [r"\b(mohamedia|المحمدية)\b"], "coords": (36.6700, 10.1600)}
        ]
    },
    {
        "slug": "manouba",
        "governorate": "Manouba",
        "name_ar": "منوبة",
        "name_fr": "Manouba",
        "centroid": (36.8083, 10.0972),
        "gov_patterns": [
            r"\b(manouba|منوبة|ولاية\s+منوبة)\b"
        ],
        "delegations": [
            {"name": "Oued Ellil", "patterns": [r"\b(oued\s+ellil|وادي\s+الليل)\b"], "coords": (36.8200, 10.0400)},
            {"name": "Douar Hicher", "patterns": [r"\b(douar\s+hicher|دوار\s+هيشر)\b"], "coords": (36.8300, 10.0800)},
            {"name": "Mornaguia", "patterns": [r"\b(mornaguia|المرناقية)\b"], "coords": (36.7800, 10.0200)},
            {"name": "Borj El Amri", "patterns": [r"\b(borj\s+el\s+amri|برج\s+العامري)\b"], "coords": (36.7200, 9.8800)},
            {"name": "Djedeida", "patterns": [r"\b(djedeida|الجديدة)\b"], "coords": (36.8500, 9.9300)},
            {"name": "Tebourba", "patterns": [r"\b(tebourba|طبربة)\b"], "coords": (36.8300, 9.8400)},
            {"name": "El Batan", "patterns": [r"\b(el\s+batan|البطان)\b"], "coords": (36.8100, 9.8400)}
        ]
    },
    {
        "slug": "nabeul",
        "governorate": "Nabeul",
        "name_ar": "نابل",
        "name_fr": "Nabeul",
        "centroid": (36.4561, 10.7376),
        "gov_patterns": [
            r"\b(nabeul|نابل|ولاية\s+نابل|cap\s+bon|الوطن\s+القبلي)\b"
        ],
        "delegations": [
            {"name": "Hammamet", "patterns": [r"\b(hammamet|الحمامات|حمامات)\b"], "coords": (36.4000, 10.6200)},
            {"name": "Dar Chaabane", "patterns": [r"\b(dar\s+chaabane|دار\s+شعبان)\b"], "coords": (36.4700, 10.7500)},
            {"name": "Beni Khiar", "patterns": [r"\b(beni\s+khiar|بني\s+خيار)\b"], "coords": (36.4800, 10.7800)},
            {"name": "Korba", "patterns": [r"\b(korba|قربة)\b"], "coords": (36.5800, 10.8600)},
            {"name": "Menzel Temime", "patterns": [r"\b(menzel\s+temime|منزل\s+تميم)\b"], "coords": (36.7800, 10.9900)},
            {"name": "Kelibia", "patterns": [r"\b(kelibia|قليبية)\b"], "coords": (36.8500, 11.0900)},
            {"name": "El Haouaria", "patterns": [r"\b(el\s+haouaria|الهوارية)\b"], "coords": (37.0500, 11.0200)},
            {"name": "Soliman", "patterns": [r"\b(soliman|سليمان)\b"], "coords": (36.7000, 10.4900)},
            {"name": "Grombalia", "patterns": [r"\b(grombalia|قرمبالية)\b"], "coords": (36.6000, 10.5000)},
            {"name": "Bou Argoub", "patterns": [r"\b(bou\s+argoub|بوعرقوب)\b"], "coords": (36.5400, 10.5500)},
            {"name": "Takelsa", "patterns": [r"\b(takelsa|تاكلسة)\b"], "coords": (36.7800, 10.6300)}
        ]
    },
    {
        "slug": "zaghouan",
        "governorate": "Zaghouan",
        "name_ar": "زغوان",
        "name_fr": "Zaghouan",
        "centroid": (36.4029, 10.1429),
        "gov_patterns": [
            r"\b(zaghouan|زغوان|ولاية\s+زغوان)\b"
        ],
        "delegations": [
            {"name": "Zriba", "patterns": [r"\b(zriba|الزريبة|زريبة)\b"], "coords": (36.3300, 10.2300)},
            {"name": "El Fahs", "patterns": [r"\b(el\s+fahs|الفحص)\b"], "coords": (36.3700, 9.9000)},
            {"name": "Nadhour", "patterns": [r"\b(nadhour|الناظور)\b"], "coords": (36.1100, 10.0500)},
            {"name": "Bir Mcherga", "patterns": [r"\b(bir\s+mcherga|بئر\s+مشارقة)\b"], "coords": (36.5100, 10.1600)},
            {"name": "Saouaf", "patterns": [r"\b(saouaf|صواف)\b"], "coords": (36.2100, 10.1400)}
        ]
    },
    {
        "slug": "bizerte",
        "governorate": "Bizerte",
        "name_ar": "بنزرت",
        "name_fr": "Bizerte",
        "centroid": (37.2744, 9.8739),
        "gov_patterns": [
            r"\b(bizerte|بنزرت|ولاية\s+بنزرت)\b"
        ],
        "delegations": [
            {"name": "Menzel Bourguiba", "patterns": [r"\b(menzel\s+bourguiba|منزل\s+بورقيبة)\b"], "coords": (37.1500, 9.7800)},
            {"name": "Mateur", "patterns": [r"\b(mateur|ماطر)\b"], "coords": (37.0400, 9.6600)},
            {"name": "Ras Jebel", "patterns": [r"\b(ras\s+jebel|رأس\s+الجبل|راس\s+الجبل)\b"], "coords": (37.2100, 10.1300)},
            {"name": "Ghar El Melh", "patterns": [r"\b(ghar\s+el\s+melh|غار\s+الملح)\b"], "coords": (37.1700, 10.1900)},
            {"name": "Sejnane", "patterns": [r"\b(sejnane|سجنان)\b"], "coords": (37.0500, 9.2400)},
            {"name": "Joumine", "patterns": [r"\b(joumine|جومين)\b"], "coords": (36.9600, 9.5700)},
            {"name": "Ghezala", "patterns": [r"\b(ghezala|غزالة)\b"], "coords": (37.0600, 9.5300)},
            {"name": "Tinja", "patterns": [r"\b(tinja|تينجة)\b"], "coords": (37.1600, 9.7600)},
            {"name": "Utique", "patterns": [r"\b(utique|أوتيك|اوتيك)\b"], "coords": (37.0500, 10.0300)},
            {"name": "Ichkeul", "patterns": [r"\b(ichkeul|parc\s+d\'ichkeul|إشكول|اشكول|بحيرة\s+إشكول)\b"], "coords": (37.1600, 9.6700)}
        ]
    },
    {
        "slug": "beja",
        "governorate": "Béja",
        "name_ar": "باجة",
        "name_fr": "Béja",
        "centroid": (36.7256, 9.1817),
        "gov_patterns": [
            r"\b(beja|béja|باجة|ولاية\s+باجة)\b"
        ],
        "delegations": [
            {"name": "Medjez El Bab", "patterns": [r"\b(medjez\s+el\s+bab|مجاز\s+الباب)\b"], "coords": (36.6500, 9.6100)},
            {"name": "Testour", "patterns": [r"\b(testour|تستور)\b"], "coords": (36.5500, 9.4400)},
            {"name": "Teboursouk", "patterns": [r"\b(teboursouk|تبرسق)\b"], "coords": (36.4600, 9.2500)},
            {"name": "Nefza", "patterns": [r"\b(nefza|نفزة)\b"], "coords": (36.9300, 9.0700)},
            {"name": "Goubellat", "patterns": [r"\b(goubellat|قبلاط)\b"], "coords": (36.5400, 9.6600)},
            {"name": "Amdoun", "patterns": [r"\b(amdoun|عمدون)\b"], "coords": (36.7800, 9.0900)},
            {"name": "Thibar", "patterns": [r"\b(thibar|تيبار)\b"], "coords": (36.5200, 9.1000)},
            {"name": "Sidi Salem", "patterns": [r"\b(barrage\s+sidi\s+salem|sidi\s+salem|سد\s+سيدي\s+سالم)\b"], "coords": (36.6000, 9.4000)}
        ]
    },
    {
        "slug": "jendouba",
        "governorate": "Jendouba",
        "name_ar": "جندوبة",
        "name_fr": "Jendouba",
        "centroid": (36.5011, 8.7802),
        "gov_patterns": [
            r"\b(jendouba|جندوبة|ولاية\s+جندوبة)\b"
        ],
        "delegations": [
            {"name": "Tabarka", "patterns": [r"\b(tabarka|طبرقة)\b"], "coords": (36.9500, 8.7500)},
            {"name": "Ain Draham", "patterns": [r"\b(ain\s+draham|aïn\s+draham|عين\s+دراهم)\b"], "coords": (36.7800, 8.6900)},
            {"name": "Fernana", "patterns": [r"\b(fernana|فرنانة)\b"], "coords": (36.6500, 8.7000)},
            {"name": "Ghardimaou", "patterns": [r"\b(ghardimaou|غار\s+الدماء)\b"], "coords": (36.4500, 8.4400)},
            {"name": "Oued Meliz", "patterns": [r"\b(oued\s+meliz|وادي\s+مليز)\b"], "coords": (36.4700, 8.5500)},
            {"name": "Bou Salem", "patterns": [r"\b(bou\s+salem|بوسالم)\b"], "coords": (36.6100, 8.9700)},
            {"name": "Balta Bou Aouane", "patterns": [r"\b(balta\s+bou\s+aouane|بلطة\s+بوعوان)\b"], "coords": (36.6900, 8.9300)},
            {"name": "Bou Heurtma", "patterns": [r"\b(barrage\s+bou\s+heurtma|bou\s+heurtma|سد\s+بوهرتمة|بوهرتمة)\b"], "coords": (36.6700, 8.8000)}
        ]
    },
    {
        "slug": "kef",
        "governorate": "Le Kef",
        "name_ar": "الكاف",
        "name_fr": "Le Kef",
        "centroid": (36.1822, 8.7149),
        "gov_patterns": [
            r"\b(le\s+kef|el\s+kef|kef|الكاف|ولاية\s+الكاف)\b"
        ],
        "delegations": [
            {"name": "Dahmani", "patterns": [r"\b(dahmani|الدهماني)\b"], "coords": (35.9400, 8.8300)},
            {"name": "Tajerouine", "patterns": [r"\b(tajerouine|تاجروين)\b"], "coords": (35.8900, 8.5500)},
            {"name": "Sakiet Sidi Youssef", "patterns": [r"\b(sakiet\s+sidi\s+youssef|ساقية\s+سيدي\s+يوسف)\b"], "coords": (36.2200, 8.3600)},
            {"name": "Kalaat Khasba", "patterns": [r"\b(kalaat\s+khasba|قلعة\s+الخصبة|قلعة\s+سنان)\b"], "coords": (35.7900, 8.5400)},
            {"name": "Nebeur", "patterns": [r"\b(nebeur|نبر)\b"], "coords": (36.2900, 8.7700)},
            {"name": "Sers", "patterns": [r"\b(sers|السرس|سرس)\b"], "coords": (36.0700, 9.0200)},
            {"name": "Jerissa", "patterns": [r"\b(jerissa|djérissa|الجريصة)\b"], "coords": (35.8400, 8.6300)},
            {"name": "Mellègue", "patterns": [r"\b(barrage\s+mellegue|barrage\s+mellègue|سد\s+ملاق|ملاق)\b"], "coords": (36.3100, 8.7000)}
        ]
    },
    {
        "slug": "siliana",
        "governorate": "Siliana",
        "name_ar": "سليانة",
        "name_fr": "Siliana",
        "centroid": (36.0849, 9.3708),
        "gov_patterns": [
            r"\b(siliana|سليانة|ولاية\s+سليانة)\b"
        ],
        "delegations": [
            {"name": "Makthar", "patterns": [r"\b(makthar|مكثر)\b"], "coords": (35.8600, 9.2000)},
            {"name": "Bouarada", "patterns": [r"\b(bouarada|bou\s+arada|بوعرادة)\b"], "coords": (36.3500, 9.6200)},
            {"name": "Gaafour", "patterns": [r"\b(gaafour|قعفور)\b"], "coords": (36.3200, 9.3300)},
            {"name": "El Krib", "patterns": [r"\b(el\s+krib|الكريب)\b"], "coords": (36.3300, 9.1400)},
            {"name": "Rouhia", "patterns": [r"\b(rouhia|الروحية)\b"], "coords": (35.6700, 9.0500)},
            {"name": "Kesra", "patterns": [r"\b(kesra|كسرى)\b"], "coords": (35.8100, 9.3600)},
            {"name": "Bargou", "patterns": [r"\b(bargou|برقو)\b"], "coords": (36.0900, 9.5800)},
            {"name": "Sidi Bou Rouis", "patterns": [r"\b(sidi\s+bou\s+rouis|سيدي\s+بورويس)\b"], "coords": (36.2300, 9.1200)}
        ]
    },
    {
        "slug": "kairouan",
        "governorate": "Kairouan",
        "name_ar": "القيروان",
        "name_fr": "Kairouan",
        "centroid": (35.6781, 10.0963),
        "gov_patterns": [
            r"\b(kairouan|القيروان|ولاية\s+القيروان)\b"
        ],
        "delegations": [
            {"name": "Sbikha", "patterns": [r"\b(sbikha|السبيخة|سبيخة)\b"], "coords": (35.9300, 10.0100)},
            {"name": "Bouhajla", "patterns": [r"\b(bouhajla|bou\s+hajla|بوحجلة)\b"], "coords": (35.4000, 10.0500)},
            {"name": "Oueslatia", "patterns": [r"\b(oueslatia|الوسلاتية)\b"], "coords": (35.8500, 9.5800)},
            {"name": "Haffouz", "patterns": [r"\b(haffouz|حفوز)\b"], "coords": (35.6300, 9.6800)},
            {"name": "Nasrallah", "patterns": [r"\b(nasrallah|نصر\s+الله|نصرالله)\b"], "coords": (35.4500, 9.7900)},
            {"name": "Chebika", "patterns": [r"\b(chebika\s+kairouan|الشبيكة\s+القيروان|شبيكة\s+القيروان)\b"], "coords": (35.6200, 9.9300)},
            {"name": "Hajeb El Ayoun", "patterns": [r"\b(hajeb\s+el\s+ayoun|حاجب\s+العيون)\b"], "coords": (35.3900, 9.5500)},
            {"name": "El Alaâ", "patterns": [r"\b(el\s+alaa|el\s+alaâ|العلا)\b"], "coords": (35.6100, 9.5600)},
            {"name": "Nebhana", "patterns": [r"\b(barrage\s+nebhana|nebhana|سد\s+نبهانة|نبهانة)\b"], "coords": (35.9800, 9.8700)},
            {"name": "El Houareb", "patterns": [r"\b(barrage\s+el\s+houareb|el\s+houareb|سد\s+الهوارب|الهوارب)\b"], "coords": (35.5700, 9.7500)}
        ]
    },
    {
        "slug": "kasserine",
        "governorate": "Kasserine",
        "name_ar": "القصرين",
        "name_fr": "Kasserine",
        "centroid": (35.1676, 8.8365),
        "gov_patterns": [
            r"\b(kasserine|القصرين|ولاية\s+القصرين)\b"
        ],
        "delegations": [
            {"name": "Sbeitla", "patterns": [r"\b(sbeitla|سبيطلة)\b"], "coords": (35.2300, 9.1300)},
            {"name": "Feriana", "patterns": [r"\b(feriana|فريانة)\b"], "coords": (34.9500, 8.5700)},
            {"name": "Thala", "patterns": [r"\b(thala|تالة)\b"], "coords": (35.5700, 8.6700)},
            {"name": "Foussana", "patterns": [r"\b(foussana|فوسانة)\b"], "coords": (35.3500, 8.6200)},
            {"name": "Haidra", "patterns": [r"\b(haidra|حيدرة)\b"], "coords": (35.5600, 8.4500)},
            {"name": "Sbiba", "patterns": [r"\b(sbiba|سبيبة)\b"], "coords": (35.5400, 9.0700)},
            {"name": "Majel Bel Abbes", "patterns": [r"\b(majel\s+bel\s+abbes|ماجل\s+بلعباس)\b"], "coords": (34.6900, 8.5200)},
            {"name": "Jedelienne", "patterns": [r"\b(jedelienne|جدليان)\b"], "coords": (35.5300, 8.8600)},
            {"name": "Hassi El Ferid", "patterns": [r"\b(hassi\s+el\s+ferid|حاسي\s+الفريد)\b"], "coords": (35.0300, 8.9700)},
            {"name": "Djebel Chambi", "patterns": [r"\b(chambi|chaambi|جبل\s+الشعانبي|الشعانبي)\b"], "coords": (35.2000, 8.6800)}
        ]
    },
    {
        "slug": "sidi_bouzid",
        "governorate": "Sidi Bouzid",
        "name_ar": "سيدي بوزيد",
        "name_fr": "Sidi Bouzid",
        "centroid": (35.0382, 9.4849),
        "gov_patterns": [
            r"\b(sidi\s+bouzid|سيدي\s+بوزيد|ولاية\s+سيدي\s+بوزيد)\b"
        ],
        "delegations": [
            {"name": "Regueb", "patterns": [r"\b(regueb|الرقاب|رقاب)\b"], "coords": (34.8600, 9.7900)},
            {"name": "Menzel Bouzaiane", "patterns": [r"\b(menzel\s+bouzaiane|menzel\s+bouzayane|منزل\s+بوزيان)\b"], "coords": (34.8600, 9.3800)},
            {"name": "Jilma", "patterns": [r"\b(jilma|جلمة)\b"], "coords": (35.2700, 9.3700)},
            {"name": "Bir El Hfey", "patterns": [r"\b(bir\s+el\s+hfey|بئر\s+الحفي)\b"], "coords": (34.9300, 9.1900)},
            {"name": "Meknassy", "patterns": [r"\b(meknassy|المكناسي|مكناسي)\b"], "coords": (34.6100, 9.6100)},
            {"name": "Cebbala Ouled Asker", "patterns": [r"\b(cebbala|السبالة)\b"], "coords": (35.1900, 9.2700)},
            {"name": "Sidi Ali Ben Aoun", "patterns": [r"\b(sidi\s+ali\s+ben\s+aoun|ben\s+aoun|سيدي\s+علي\s+بن\s+عون)\b"], "coords": (34.8600, 9.1300)},
            {"name": "Ouled Haffouz", "patterns": [r"\b(ouled\s+haffouz|أولاد\s+حفوز|اولاد\s+حفوز)\b"], "coords": (35.2600, 9.7100)},
            {"name": "Souk Jedid", "patterns": [r"\b(souk\s+jedid|السوق\s+الجديد)\b"], "coords": (34.9100, 9.5400)},
            {"name": "Mezzouna", "patterns": [r"\b(mezzouna|المزونة)\b"], "coords": (34.5800, 9.8500)}
        ]
    },
    {
        "slug": "sousse",
        "governorate": "Sousse",
        "name_ar": "سوسة",
        "name_fr": "Sousse",
        "centroid": (35.8256, 10.6369),
        "gov_patterns": [
            r"\b(sousse|سوسة|ولاية\s+سوسة)\b"
        ],
        "delegations": [
            {"name": "Hammam Sousse", "patterns": [r"\b(hammam\s+sousse|حمام\s+سوسة)\b"], "coords": (35.8600, 10.6000)},
            {"name": "Kalaa Kebira", "patterns": [r"\b(kalaa\s+kebira|القلعة\s+الكبيرة)\b"], "coords": (35.8700, 10.5400)},
            {"name": "Kalaa Seghira", "patterns": [r"\b(kalaa\s+seghira|القلعة\s+الصغيرة)\b"], "coords": (35.8300, 10.5600)},
            {"name": "Enfidha", "patterns": [r"\b(enfidha|النفيضة|نفيضة)\b"], "coords": (36.1400, 10.3800)},
            {"name": "Msaken", "patterns": [r"\b(msaken|m\'saken|مساكن)\b"], "coords": (35.7300, 10.5800)},
            {"name": "Akouda", "patterns": [r"\b(akouda|أكودة|اكودة)\b"], "coords": (35.8700, 10.5700)},
            {"name": "Bouficha", "patterns": [r"\b(bouficha|بوفيشة)\b"], "coords": (36.3000, 10.4500)},
            {"name": "Kondar", "patterns": [r"\b(kondar|كندار)\b"], "coords": (35.9300, 10.3000)},
            {"name": "Sidi Bou Ali", "patterns": [r"\b(sidi\s+bou\s+ali|سيدي\s+بوعلي)\b"], "coords": (35.9600, 10.4700)},
            {"name": "Sidi El Hani", "patterns": [r"\b(sidi\s+el\s+hani|سيدي\s+الهاني)\b"], "coords": (35.6700, 10.3200)}
        ]
    },
    {
        "slug": "monastir",
        "governorate": "Monastir",
        "name_ar": "المنستير",
        "name_fr": "Monastir",
        "centroid": (35.7779, 10.8261),
        "gov_patterns": [
            r"\b(monastir|المنستير|ولاية\s+المنستير)\b"
        ],
        "delegations": [
            {"name": "Moknine", "patterns": [r"\b(moknine|مكنين)\b"], "coords": (35.6300, 10.9000)},
            {"name": "Jemmal", "patterns": [r"\b(jemmal|جمال)\b"], "coords": (35.6300, 10.7600)},
            {"name": "Ksar Hellal", "patterns": [r"\b(ksar\s+hellal|ksar\s+hallal|قصر\s+هلال)\b"], "coords": (35.6500, 10.8900)},
            {"name": "Teboulba", "patterns": [r"\b(teboulba|طبلبة)\b"], "coords": (35.6400, 10.9700)},
            {"name": "Sahline", "patterns": [r"\b(sahline|الساحلين)\b"], "coords": (35.7500, 10.7100)},
            {"name": "Bekalta", "patterns": [r"\b(bekalta|بقالطة)\b"], "coords": (35.6200, 11.0000)},
            {"name": "Sayada", "patterns": [r"\b(sayada|صيادة)\b"], "coords": (35.6700, 10.9000)},
            {"name": "Lamta", "patterns": [r"\b(lamta|لمطة)\b"], "coords": (35.6800, 10.8800)},
            {"name": "Zeramdine", "patterns": [r"\b(zeramdine|زرمدين)\b"], "coords": (35.5800, 10.7300)},
            {"name": "Beni Hassen", "patterns": [r"\b(beni\s+hassen|بني\s+حسان)\b"], "coords": (35.5700, 10.8100)}
        ]
    },
    {
        "slug": "mahdia",
        "governorate": "Mahdia",
        "name_ar": "المهدية",
        "name_fr": "Mahdia",
        "centroid": (35.5047, 11.0622),
        "gov_patterns": [
            r"\b(mahdia|المهدية|ولاية\s+المهدية)\b"
        ],
        "delegations": [
            {"name": "Chebba", "patterns": [r"\b(chebba|la\s+chebba|الشابة|شابة)\b"], "coords": (35.2400, 11.1100)},
            {"name": "Ksour Essef", "patterns": [r"\b(ksour\s+essef|قصور\s+الساف)\b"], "coords": (35.4200, 11.0000)},
            {"name": "El Jem", "patterns": [r"\b(el\s+jem|el\s+djem|الجم)\b"], "coords": (35.3000, 10.7100)},
            {"name": "Rejiche", "patterns": [r"\b(rejiche|رجيش)\b"], "coords": (35.4700, 11.0400)},
            {"name": "Bou Merdes", "patterns": [r"\b(bou\s+merdes|بومرداس)\b"], "coords": (35.4500, 10.7400)},
            {"name": "Sidi Alouane", "patterns": [r"\b(sidi\s+alouane|سيدي\s+علوان)\b"], "coords": (35.3800, 10.9400)},
            {"name": "Melloulech", "patterns": [r"\b(melloulech|ملولش)\b"], "coords": (35.1600, 11.0300)},
            {"name": "Souassi", "patterns": [r"\b(souassi|السواسي)\b"], "coords": (35.3500, 10.5500)},
            {"name": "Hebira", "patterns": [r"\b(hebira|هبيرة)\b"], "coords": (35.1900, 10.2500)},
            {"name": "Chorbane", "patterns": [r"\b(chorbane|شربان)\b"], "coords": (35.2800, 10.3800)},
            {"name": "Ouled Chamekh", "patterns": [r"\b(ouled\s+chamekh|أولاد\s+شامخ|اولاد\s+شامخ)\b"], "coords": (35.4500, 10.2600)}
        ]
    },
    {
        "slug": "sfax",
        "governorate": "Sfax",
        "name_ar": "صفاقس",
        "name_fr": "Sfax",
        "centroid": (34.7406, 10.7603),
        "gov_patterns": [
            r"\b(sfax|صفاقس|ولاية\s+صفاقس)\b"
        ],
        "delegations": [
            {"name": "El Amra", "patterns": [r"\b(el\s+amra|العامرة|عامرة)\b"], "coords": (34.9800, 10.8700)},
            {"name": "Jbeniana", "patterns": [r"\b(jbeniana|جبنيانة|جبنيانه)\b"], "coords": (35.0300, 10.9100)},
            {"name": "Kerkennah", "patterns": [r"\b(kerkennah|iles\s+kerkennah|قرقنة|جزر\s+قرقنة)\b"], "coords": (34.7000, 11.2000)},
            {"name": "Sakiet Ezzit", "patterns": [r"\b(sakiet\s+ezzit|ساقية\s+الزيت)\b"], "coords": (34.8000, 10.7700)},
            {"name": "Sakiet Eddaier", "patterns": [r"\b(sakiet\s+eddaier|ساقية\s+الدائر)\b"], "coords": (34.7900, 10.7900)},
            {"name": "Thyna", "patterns": [r"\b(thyna|tina|طينة)\b"], "coords": (34.6800, 10.7100)},
            {"name": "Mahres", "patterns": [r"\b(mahres|المحرس|محرس)\b"], "coords": (34.5300, 10.5000)},
            {"name": "Skhira", "patterns": [r"\b(skhira|la\s+skhira|الصخيرة|صخيرة)\b"], "coords": (34.3000, 10.0700)},
            {"name": "Agareb", "patterns": [r"\b(agareb|عقارب)\b"], "coords": (34.7300, 10.5300)},
            {"name": "Menzel Chaker", "patterns": [r"\b(menzel\s+chaker|منزل\s+شاكر)\b"], "coords": (34.9200, 10.4000)},
            {"name": "Bir Ali Ben Khalifa", "patterns": [r"\b(bir\s+ali\s+ben\s+khalifa|بئر\s+علي\s+بن\s+خليفة)\b"], "coords": (34.7300, 10.1000)},
            {"name": "Graiba", "patterns": [r"\b(graiba|الغريبة)\b"], "coords": (34.5200, 10.2400)},
            {"name": "Hencha", "patterns": [r"\b(hencha|el\s+hencha|الحنشة)\b"], "coords": (35.1000, 10.7500)}
        ]
    },
    {
        "slug": "gafsa",
        "governorate": "Gafsa",
        "name_ar": "قفصة",
        "name_fr": "Gafsa",
        "centroid": (34.4250, 8.7842),
        "gov_patterns": [
            r"\b(gafsa|قفصة|ولاية\s+قفصة|bassin\s+minier|الحوض\s+المنجمي)\b"
        ],
        "delegations": [
            {"name": "Metlaoui", "patterns": [r"\b(metlaoui|المتلوي|متلوي)\b"], "coords": (34.3300, 8.4000)},
            {"name": "Mdhilla", "patterns": [r"\b(mdhilla|المظيلة|مظيلة)\b"], "coords": (34.2500, 8.7500)},
            {"name": "Redeyef", "patterns": [r"\b(redeyef|الرديف|رديف)\b"], "coords": (34.3800, 8.1600)},
            {"name": "Moulares", "patterns": [r"\b(moulares|oum\s+el\s+araies|أم\s+العرائس|ام\s+العرائس|المتلوي|أم\s+العرائس)\b"], "coords": (34.4800, 8.2700)},
            {"name": "El Guettar", "patterns": [r"\b(el\s+guettar|القطار)\b"], "coords": (34.3300, 8.9200)},
            {"name": "Sened", "patterns": [r"\b(sened|السند)\b"], "coords": (34.4600, 9.2600)},
            {"name": "Belkhir", "patterns": [r"\b(belkhir|بلخير)\b"], "coords": (34.3200, 9.3500)},
            {"name": "Sidi Aich", "patterns": [r"\b(sidi\s+aich|سيدي\s+عيش)\b"], "coords": (34.6800, 8.7000)},
            {"name": "El Ksar", "patterns": [r"\b(el\s+ksar|القصر\s+قفصة)\b"], "coords": (34.4000, 8.8000)}
        ]
    },
    {
        "slug": "tozeur",
        "governorate": "Tozeur",
        "name_ar": "توزر",
        "name_fr": "Tozeur",
        "centroid": (33.9197, 8.1335),
        "gov_patterns": [
            r"\b(tozeur|توزر|ولاية\s+توزر|chott\s+el\s+djerid|شط\s+الجريد)\b"
        ],
        "delegations": [
            {"name": "Nefta", "patterns": [r"\b(nefta|نفطة)\b"], "coords": (33.8700, 7.8800)},
            {"name": "Degache", "patterns": [r"\b(degache|دقاش)\b"], "coords": (33.9800, 8.2100)},
            {"name": "Tamerza", "patterns": [r"\b(tamerza|تمغزة)\b"], "coords": (34.3800, 7.9500)},
            {"name": "Chebika", "patterns": [r"\b(chebika\s+tozeur|الشبيكة\s+توزر|شبيكة\s+توزر)\b"], "coords": (34.3200, 7.9300)},
            {"name": "Hazoua", "patterns": [r"\b(hazoua|حزوة)\b"], "coords": (33.7400, 7.6300)},
            {"name": "Hammet Jerid", "patterns": [r"\b(hammet\s+jerid|حامة\s+الجريد)\b"], "coords": (34.0100, 8.1600)}
        ]
    },
    {
        "slug": "kebili",
        "governorate": "Kébili",
        "name_ar": "قبلي",
        "name_fr": "Kébili",
        "centroid": (33.7044, 8.9690),
        "gov_patterns": [
            r"\b(kebili|kébili|قبلي|ولاية\s+قبلي|nefzaoua|نفزاوة)\b"
        ],
        "delegations": [
            {"name": "Douz", "patterns": [r"\b(douz|دوز)\b"], "coords": (33.4600, 9.0200)},
            {"name": "Souk Lahad", "patterns": [r"\b(souk\s+lahad|souk\s+el\s+ahad|سوق\s+الأحد|سوق\s+الاحد)\b"], "coords": (33.7800, 8.8400)},
            {"name": "El Golaa", "patterns": [r"\b(el\s+golaa|القلعة\s+قبلي)\b"], "coords": (33.5000, 9.0000)},
            {"name": "Faouar", "patterns": [r"\b(faouar|el\s+faouar|الفوار)\b"], "coords": (33.3700, 8.6800)},
            {"name": "Rjim Maatoug", "patterns": [r"\b(rjim\s+maatoug|رجيم\s+معتوق)\b"], "coords": (33.4500, 7.8200)}
        ]
    },
    {
        "slug": "gabes",
        "governorate": "Gabès",
        "name_ar": "قابس",
        "name_fr": "Gabès",
        "centroid": (33.8815, 10.0982),
        "gov_patterns": [
            r"\b(gabes|gabès|qabis|قابس|ولاية\s+قابس|golfe\s+de\s+gabes|خليج\s+قابس)\b"
        ],
        "delegations": [
            {"name": "Chatt Essalam", "patterns": [r"\b(chatt\s+essalam|chott\s+essalam|شط\s+السلام)\b"], "coords": (33.8900, 10.1100)},
            {"name": "Ghannouch", "patterns": [r"\b(ghannouch|غنوش)\b"], "coords": (33.9400, 10.0700)},
            {"name": "El Hamma", "patterns": [r"\b(el\s+hamma|الحامة|حامة\s+قابس)\b"], "coords": (33.8900, 9.8000)},
            {"name": "Mareth", "patterns": [r"\b(mareth|مارث)\b"], "coords": (33.6100, 10.2800)},
            {"name": "Matmata", "patterns": [r"\b(matmata|مطماطة)\b"], "coords": (33.5400, 9.9700)},
            {"name": "Nouvelle Matmata", "patterns": [r"\b(nouvelle\s+matmata|مطماطة\s+الجديدة)\b"], "coords": (33.6800, 10.0200)},
            {"name": "Zarat", "patterns": [r"\b(zarat|الزارات|زارات)\b"], "coords": (33.6700, 10.3500)},
            {"name": "Menzel Habib", "patterns": [r"\b(menzel\s+habib|منزل\s+الحبيب)\b"], "coords": (34.0600, 9.7700)},
            {"name": "Dakhla Toujane", "patterns": [r"\b(toujane|dakhla\s+toujane|توجان|دخيلة\s+توجان)\b"], "coords": (33.5100, 10.0800)}
        ]
    },
    {
        "slug": "medenine",
        "governorate": "Médenine",
        "name_ar": "مدنين",
        "name_fr": "Médenine",
        "centroid": (33.3549, 10.5055),
        "gov_patterns": [
            r"\b(medenine|médenine|مدنين|ولاية\s+مدنين)\b"
        ],
        "delegations": [
            {"name": "Zarzis", "patterns": [r"\b(zarzis|جرجيس)\b"], "coords": (33.5040, 11.1122)},
            {"name": "Djerba", "patterns": [r"\b(djerba|houmt\s+souk|midoun|ajim|جربة|حومة\s+السوق|ميدون|أجيم|اجيم)\b"], "coords": (33.8100, 10.8600)},
            {"name": "Ben Guerdane", "patterns": [r"\b(ben\s+guerdane|ben\s+gardane|ras\s+jedir|ras\s+jdir|بن\s+قردان|رأس\s+جدير|راس\s+جدير)\b"], "coords": (33.1400, 11.2200)},
            {"name": "Beni Khedache", "patterns": [r"\b(beni\s+khedache|بني\s+خداش)\b"], "coords": (33.2500, 10.2000)},
            {"name": "Sidi Makhlouf", "patterns": [r"\b(sidi\s+makhlouf|سيدي\s+مخلوف)\b"], "coords": (33.5500, 10.4500)}
        ]
    },
    {
        "slug": "tataouine",
        "governorate": "Tataouine",
        "name_ar": "تطاوين",
        "name_fr": "Tataouine",
        "centroid": (32.9297, 10.4518),
        "gov_patterns": [
            r"\b(tataouine|تطاوين|ولاية\s+تطاوين)\b"
        ],
        "delegations": [
            {"name": "Ghomrassen", "patterns": [r"\b(ghomrassen|غمراسن)\b"], "coords": (33.0600, 10.3300)},
            {"name": "Remada", "patterns": [r"\b(remada|رمادة)\b"], "coords": (32.3100, 10.4000)},
            {"name": "Dehiba", "patterns": [r"\b(dehiba|ذهيبة)\b"], "coords": (32.0100, 10.7000)},
            {"name": "Smar", "patterns": [r"\b(smar|الصمار)\b"], "coords": (32.9700, 10.9700)},
            {"name": "Bir Lahmar", "patterns": [r"\b(bir\s+lahmar|بئر\s+لحمر)\b"], "coords": (33.1800, 10.4400)},
            {"name": "El Kamour", "patterns": [r"\b(el\s+kamour|kamour|الكامور|كامور)\b"], "coords": (32.3000, 9.8000)}
        ]
    }
]

# Substantive national indicators that establish countrywide subject scope.
# Note: Mentioning Tunisia or an institution name alone is NOT sufficient.
NATIONAL_PATTERNS = [
    # 1. Explicit nationwide spatial / population scale phrases
    r"\b(a\s+l['’]echelle\s+nationale|sur\s+tout\s+le\s+territoire|sur\s+l['’]ensemble\s+du\s+territoire|territoire\s+national|countrywide|nationwide|dans\s+tout\s+le\s+pays|a\s+travers\s+le\s+pays|dans\s+l['’]ensemble\s+du\s+pays)\b",
    r"\b(على\s+المستوى\s+الوطني|على\s+نطاق\s+وطني|على\s+كامل\s+التراب|التراب\s+الوطني|كامل\s+تراب\s+الجمهورية|في\s+كامل\s+البلاد|على\s+نطاق\s+البلاد|في\s+كافة\s+انحاء\s+البلاد|في\s+كافة\s+انحاء\s+الجمهورية)\b",

    # 2. National strategies, plans, policies, programs, campaigns, framework agreements
    r"\b(strategie\s+nationale|plan\s+national|politique\s+nationale|programme\s+national|campagne\s+nationale|reforme\s+nationale|accord\s+cadre\s+national|convention\s+collective\s+nationale|securite\s+alimentaire\s+nationale|souverainete\s+alimentaire)\b",
    r"\b(الاستراتيجية\s+الوطنية|استراتيجية\s+وطنية|المخطط\s+الوطني|الخطة\s+الوطنية|السياسة\s+الوطنية|برنامج\s+وطني|البرنامج\s+الوطني|حملة\s+وطنية|اصلاح\s+وطني|اتفاق\s+اطاري\s+وطني|الامن\s+الغذائي\s+الوطني|السيادة\s+الغذائية)\b",

    # 3. National constitutional, legal, judicial & statutory governance framework
    r"\b(constitution\s+de\s+2022|vacance\s+du\s+pouvoir|cour\s+constitutionnelle|code\s+electoral|loi\s+de\s+finances|journal\s+officiel|jort|decret\s+presidentiel|decret\s+gouvernemental|ordonnance\s+presidentielle)\b",
    r"\b(دستور\s+2022|شغور\s+منصب|المحكمة\s+الدستورية|القانون\s+الانتخابي|قانون\s+المالية|الرائد\s+الرسمي|مرسوم\s+رئاسي|امر\s+رئاسي|مرسوم\s+بقانون)\b",

    # 4. Country-level statistical aggregates, surveys, demographic & macroeconomic indicators
    r"\b(indicateurs?\s+(?:de\s+l['’]emploi|du\s+chomage|economiques?|nationa(?:l|ux))|taux\s+(?:de\s+chomage|d['’]inflation|de\s+croissance|d['’]emploi)|bilan\s+national|rapport\s+national|enquete\s+nationale|recensement\s+general|basculement\s+demographique|demographie\s+de\s+la\s+tunisie|produit\s+interieur\s+brut|indices?\s+des\s+prix|production\s+industrielle\s+en\s+tunisie|croissance\s+economique|conjoncture\s+nationale)\b",
    r"\b(مؤشرات\s+(?:التشغيل|البطالة|الاقتصاد|الوطنية)|معدل\s+(?:البطالة|التضخم|النمو)|نسبة\s+(?:البطالة|التضخم|النمو)|الحصيلة\s+الوطنية|التقرير\s+الوطني|مسح\s+وطني|التعداد\s+العام|التحول\s+الديمغرافي|الناتج\s+المحلي|مؤشر\s+اسعار\s+الاستهلاك|الانتاج\s+الصناعي|النمو\s+الاقتصادي)\b",

    # 5. Systemic countrywide infrastructure, utilities & institutional system analysis ("en chiffres", nationwide grids/systems)
    r"\b(crise\s+de\s+l['’]electricite\s+en\s+chiffres|reseau\s+electrique\s+national|production\s+nationale\s+d['’]electricite|capacite\s+nationale|reserves?\s+nationales?|barrages\s+nationaux|barrages\s+tunisiens|etat\s+d['’]urgence\s+hydrique|urgence\s+hydrique|les\s+prisons\s+tunisiennes|prisons\s+en\s+tunisie|systeme\s+carceral\s+tunisien|hopitaux\s+publics\s+en\s+tunisie|systeme\s+de\s+sante\s+en\s+tunisie|systeme\s+educatif\s+en\s+tunisie)\b",
    r"\b(ازمة\s+الكهرباء\s+بالارقام|الشبكة\s+الوطنية\s+للكهرباء|الانتاج\s+الوطني\s+للكهرباء|مخزون\s+السدود|سدود\s+تونس|حالة\s+الطوارئ\s+المائية|طوارئ\s+مائية|السجون\s+التونسية|السجون\s+في\s+تونس|المنظومة\s+السجنية|المستشفيات\s+العمومية\s+في\s+تونس|المنظومة\s+الصحية|المنظومة\s+التربوية)\b",

    # 6. Qualified substantive national sector/macro topics
    r"\b(secteur\s+national|economie\s+nationale|greve\s+generale\s+nationale|deuil\s+national|urgence\s+nationale|production\s+nationale|consommation\s+nationale)\b",
    r"\b(القطاع\s+الوطني|الاقتصاد\s+الوطني|اضراب\s+عام\s+وطني|حداد\s+وطني|طوارئ\s+وطنية|الإنتاج\s+الوطني|الانتاج\s+الوطني|الاستهلاك\s+الوطني)\b"
]

def normalize_text(text: str) -> str:
    """Normalize accents, ligatures, and orthography for robust matching."""
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFKD", text)
    cleaned = "".join(c for c in decomposed if not unicodedata.combining(c)).lower()
    # Normalize Arabic alef forms and ta marbuta
    cleaned = re.sub(r"[إأآا]", "ا", cleaned)
    cleaned = re.sub(r"ة", "ه", cleaned)
    cleaned = re.sub(r"ى", "ي", cleaned)
    # Normalize dialectal Tunisian gaf/veh variants (ڤ, ڨ) to qaf (ق)
    cleaned = re.sub(r"[ڤڨ]", "ق", cleaned)
    # Strip common single-letter attached Arabic prepositions (bi-, wa-, fa-, li-, ka-) when attached to regional names
    cleaned = re.sub(
        r"(^|\s)[بوكلف](?=(?:تطاوين|توزر|سوسه|صفاقس|مدنين|قابس|قفصه|نابل|بنزرت|باجه|جندوبه|الكاف|كاف|سليانه|القيروان|قيروان|القصرين|قصرين|قبلي|زغوان|منوبه|اريانه|بن\s+عروس|المهديه|مهديه|المنستير|منستير|سيدي\s+بوزيد|جرجيس|جربه|متلوي|رديف|الرديف|عمره|العماره|العمره|جبنيانه|قرقنه|سبيطله|ماطر|غار\s+الدماء|طبرقه|عين\s+دراهم|بن\s+قردان|بنقردان))",
        r"\1",
        cleaned
    )
    return cleaned

def _strip_dateline(text: str) -> str:
    """Strip generic news agency datelines (e.g. 'TUNIS (TAP) — ...') that merely indicate wire desk."""
    if not text:
        return ""
    cleaned = re.sub(r"^\s*tunis\s*(\([^\)]+\)|,[^—–-]+)?\s*[—–-]\s*", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*تونس\s*(\([^\)]+\)|,[^—–-]+)?\s*[—–-]\s*", "", cleaned, flags=re.IGNORECASE)
    return cleaned

GOVERNORATES_24 = GOVERNORATE_DEFINITIONS
ALL_24_GOVERNORATES_LIST = [g["governorate"] for g in GOVERNORATE_DEFINITIONS]

def resolve_location_advanced(
    text: str,
    headline: str = "",
    summary: str = "",
    source_domain: str = None
) -> ResolvedLocation:
    """
    Authoritative 24-governorate location extraction engine.
    
    Priority:
    1. Explicit locality / delegation match -> LOCAL (0.95 confidence) or MULTI_LOCALITY_SAME_GOVERNORATE (0.85 confidence)
    2. Governorate-level match -> GOVERNORATE (0.90 confidence)
    3. Multiple distinct governorates matched -> MULTI_GOVERNORATE (0.75 confidence, no fake coords)
    4. National scope match -> NATIONAL (0.90 confidence, no fake coords)
    5. Unresolved -> UNRESOLVED (0.0 confidence, no coords)
    
    GUARANTEE: A national article NEVER receives Tunis coordinates.
    """
    full_text = f"{headline} {summary} {text}".strip()
    if not full_text:
        return ResolvedLocation(
            canonical_name="Tunisia",
            scope="UNRESOLVED",
            governorate=None,
            delegation=None,
            locality=None,
            latitude=None,
            longitude=None,
            location_confidence=0.0,
            location_method="UNRESOLVED",
            reason="Empty text payload"
        )

    norm_full = normalize_text(full_text)
    # Strip news agency datelines from title/lead
    norm_lead = normalize_text(_strip_dateline(f"{headline} {summary}"))

    # Track matched delegations and governorates
    matched_delegations: List[Dict[str, Any]] = []
    matched_governorates: Set[str] = set()
    gov_matched_phrases: Dict[str, str] = {}
    gov_matched_contexts: Dict[str, str] = {}
    gov_meta_map: Dict[str, Dict[str, Any]] = {}

    for gov_def in GOVERNORATE_DEFINITIONS:
        gov_slug = gov_def["slug"]
        gov_name = gov_def["governorate"]
        gov_meta_map[gov_slug] = gov_def

        # 1. Check delegations
        for deleg in gov_def.get("delegations", []):
            for pat in deleg["patterns"]:
                n_pat = normalize_text(pat)
                m_lead = re.search(n_pat, norm_lead, flags=re.IGNORECASE)
                m_full = re.search(n_pat, norm_full, flags=re.IGNORECASE)
                if m_lead or m_full:
                    m = m_lead or m_full
                    # snippet extraction
                    s_idx = max(0, m.start() - 30)
                    e_idx = min(len(full_text), m.end() + 30)
                    ctx = full_text[s_idx:e_idx].strip()
                    matched_delegations.append({
                        "gov_slug": gov_slug,
                        "gov_name": gov_name,
                        "delegation_name": deleg["name"],
                        "coords": deleg["coords"],
                        "in_lead": bool(m_lead),
                        "matched_phrase": m.group(0),
                        "evidence_context": ctx
                    })
                    matched_governorates.add(gov_slug)
                    if gov_slug not in gov_matched_phrases:
                        gov_matched_phrases[gov_slug] = m.group(0)
                        gov_matched_contexts[gov_slug] = ctx
                    break

        # 2. Check governorate patterns
        for pat in gov_def["gov_patterns"]:
            n_pat = normalize_text(pat)
            m_lead = re.search(n_pat, norm_lead, flags=re.IGNORECASE)
            m_full = re.search(n_pat, norm_full, flags=re.IGNORECASE)
            if m_lead or m_full:
                m = m_lead or m_full
                s_idx = max(0, m.start() - 30)
                e_idx = min(len(full_text), m.end() + 30)
                ctx = full_text[s_idx:e_idx].strip()
                matched_governorates.add(gov_slug)
                if gov_slug not in gov_matched_phrases:
                    gov_matched_phrases[gov_slug] = m.group(0)
                    gov_matched_contexts[gov_slug] = ctx
                break

    # PRIORITY 1: Check matched delegations / explicit localities
    if matched_delegations:
        distinct_deleg_names = {d["delegation_name"] for d in matched_delegations}
        gov_slugs_in_delegs = {d["gov_slug"] for d in matched_delegations}

        # Case 1A: Exactly ONE unique delegation matched
        if len(distinct_deleg_names) == 1 and len(gov_slugs_in_delegs) == 1:
            chosen = matched_delegations[0]
            gov_slug = chosen["gov_slug"]
            gov_name = chosen["gov_name"]
            lat, lon = chosen["coords"]
            return ResolvedLocation(
                canonical_name=f"{chosen['delegation_name']}, {gov_name}",
                scope="LOCAL",
                governorate=gov_name,
                delegation=chosen["delegation_name"],
                locality=None,
                latitude=lat,
                longitude=lon,
                location_confidence=0.95,
                location_method="EXPLICIT_LOCALITY" if chosen["delegation_name"] in ["Chatt Essalam", "Kerkennah", "El Amra", "Zarzis", "Metlaoui"] else "DELEGATION_MATCH",
                reason=f"Matched delegation '{chosen['delegation_name']}' in governorate {gov_name}",
                matched_phrase=chosen["matched_phrase"],
                evidence_context=chosen["evidence_context"]
            )

        # Case 1B: >= 2 distinct delegations inside the SAME governorate
        elif len(distinct_deleg_names) >= 2 and len(gov_slugs_in_delegs) == 1:
            gov_slug = list(gov_slugs_in_delegs)[0]
            gov_def = gov_meta_map[gov_slug]
            gov_name = gov_def["governorate"]
            lat, lon = gov_def["centroid"]
            all_phrases = [d["matched_phrase"] for d in matched_delegations]
            deleg_list_str = ", ".join(sorted(distinct_deleg_names))
            return ResolvedLocation(
                canonical_name=gov_name,
                scope="GOVERNORATE",
                governorate=gov_name,
                delegation=None,
                locality=None,
                latitude=lat,
                longitude=lon,
                location_confidence=0.85,
                location_method="MULTI_LOCALITY_SAME_GOVERNORATE",
                reason=f"Multiple delegations ({deleg_list_str}) within governorate {gov_name}",
                matched_phrase=", ".join(all_phrases),
                evidence_context=matched_delegations[0]["evidence_context"]
            )

        # Case 1C: Multiple delegations across DIFFERENT governorates
        elif len(gov_slugs_in_delegs) > 1:
            all_phrases = [d["matched_phrase"] for d in matched_delegations]
            gov_names = [gov_meta_map[s]["governorate"] for s in gov_slugs_in_delegs]
            return ResolvedLocation(
                canonical_name="Multi-Governorate",
                scope="MULTI_GOVERNORATE",
                governorate=None,
                delegation=None,
                locality=None,
                latitude=None,
                longitude=None,
                location_confidence=0.75,
                location_method="MULTI_GOVERNORATE",
                reason=f"Multiple delegations across governorates: {', '.join(gov_names)}",
                matched_phrase=", ".join(all_phrases),
                evidence_context=matched_delegations[0]["evidence_context"]
            )

    # PRIORITY 2: Exactly one governorate matched
    if len(matched_governorates) == 1:
        gov_slug = list(matched_governorates)[0]
        gov_def = gov_meta_map[gov_slug]
        gov_name = gov_def["governorate"]
        lat, lon = gov_def["centroid"]
        return ResolvedLocation(
            canonical_name=gov_name,
            scope="GOVERNORATE",
            governorate=gov_name,
            delegation=None,
            locality=None,
            latitude=lat,
            longitude=lon,
            location_confidence=0.90,
            location_method="GOVERNORATE_MATCH",
            reason=f"Matched governorate name/aliases for {gov_name}",
            matched_phrase=gov_matched_phrases.get(gov_slug, gov_name),
            evidence_context=gov_matched_contexts.get(gov_slug, full_text[:100])
        )

    # PRIORITY 3: Multiple distinct governorates matched
    if len(matched_governorates) > 1:
        gov_names = [gov_meta_map[s]["governorate"] for s in matched_governorates]
        all_phrases = [gov_matched_phrases.get(s, s) for s in matched_governorates]
        first_ctx = next(iter(gov_matched_contexts.values()), full_text[:100])
        return ResolvedLocation(
            canonical_name="Multi-Governorate",
            scope="MULTI_GOVERNORATE",
            governorate=None,
            delegation=None,
            locality=None,
            latitude=None,
            longitude=None,
            location_confidence=0.75,
            location_method="MULTI_GOVERNORATE",
            reason=f"Multiple governorates mentioned: {', '.join(gov_names)}",
            matched_phrase=", ".join(all_phrases),
            evidence_context=first_ctx
        )

    # PRIORITY 4: National context match (e.g. national dam statistics, central government policy)
    for pat in NATIONAL_PATTERNS:
        n_pat = normalize_text(pat)
        m = re.search(n_pat, norm_full, flags=re.IGNORECASE)
        if m:
            s_idx = max(0, m.start() - 30)
            e_idx = min(len(full_text), m.end() + 30)
            ctx = full_text[s_idx:e_idx].strip()
            return ResolvedLocation(
                canonical_name="Tunisia",
                scope="NATIONAL",
                governorate=None,
                delegation=None,
                locality=None,
                latitude=None,
                longitude=None,
                location_confidence=0.90,
                location_method="NATIONAL_CONTEXT",
                reason="National scope without specific regional or governorate anchor",
                matched_phrase=m.group(0),
                evidence_context=ctx
            )

    # PRIORITY 5: Unresolved
    return ResolvedLocation(
        canonical_name="Tunisia",
        scope="UNRESOLVED",
        governorate=None,
        delegation=None,
        locality=None,
        latitude=None,
        longitude=None,
        location_confidence=0.0,
        location_method="UNRESOLVED",
        reason="No authoritative geographic signals detected",
        matched_phrase=None,
        evidence_context=None
    )

def extract_location(text: str) -> Tuple[str, Optional[float], Optional[float]]:
    """
    Backward-compatible location extractor.
    Returns: (canonical_name, latitude, longitude)
    """
    res = resolve_location_advanced(text)
    if res.scope in ["LOCAL", "GOVERNORATE"] and res.latitude is not None:
        return res.governorate or res.canonical_name, res.latitude, res.longitude
    return "Tunisia", None, None

def get_location_coords(location_slug: str) -> Tuple[Optional[float], Optional[float], str]:
    """Return (latitude, longitude, name) for a given location slug from the 24-governorate registry."""
    loc = LOCATIONS_MAP.get(location_slug)
    if loc:
        return loc["lat"], loc["lon"], loc["name"]
    for gov in GOVERNORATE_DEFINITIONS:
        if gov["slug"] == location_slug or gov["governorate"].lower() == location_slug.lower():
            return gov["centroid"][0], gov["centroid"][1], gov["governorate"]
    return None, None, location_slug
