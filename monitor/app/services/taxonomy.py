# monitor/app/services/taxonomy.py
import re
import unicodedata
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Set, Any

CANONICAL_PRIMARY_ISSUES = [
    "water",
    "electricity",
    "gas_energy",
    "food_security",
    "prices_cost_of_living",
    "work_unemployment",
    "migration",
    "health",
    "public_services",
    "pollution_environment",
    "rights_freedoms",
    "justice_law",
    "media_press_freedom",
    "governance_institutions",
    "economy_public_finance",
    "corruption_accountability",
    "protests_social_movements",
    "security_policing",
    "education",
    "agriculture",
    "housing_infrastructure"
]

CANONICAL_SUB_ISSUES: Dict[str, List[str]] = {
    "water": [
        "water_cuts", "drinking_water", "drought", "dam_capacity",
        "groundwater_depletion", "water_quality", "sonede_infrastructure"
    ],
    "electricity": [
        "outage", "load_shedding", "generation", "grid",
        "electricity_prices", "renewable_energy"
    ],
    "gas_energy": [
        "energy_security", "renewable_energy", "natural_gas", "household_gas", "fuel", "energy_imports"
    ],
    "food_security": [
        "food_shortage", "cereals", "bread", "milk", "sugar",
        "cooking_oil", "agricultural_supply"
    ],
    "prices_cost_of_living": [
        "inflation", "food_prices", "household_costs", "purchasing_power", "fuel_prices"
    ],
    "work_unemployment": [
        "unemployment", "labor_rights", "layoffs", "strikes", "wages",
        "informal_work", "workplace_safety"
    ],
    "migration": [
        "irregular_migration", "sea_crossings", "deaths_missing",
        "border_policy", "deportation", "migrant_rights", "EU_tunisia", "return_policy"
    ],
    "health": [
        "public_health", "medicine_shortage", "hospitals", "emergency_services",
        "medical_staff", "healthcare_access"
    ],
    "public_services": [
        "transport", "administration", "sanitation", "municipal_services", "telecommunications"
    ],
    "pollution_environment": [
        "industrial_pollution", "gabes", "phosphate", "air_pollution",
        "water_pollution", "waste", "climate", "coastal_pollution"
    ],
    "rights_freedoms": [
        "freedom_of_expression", "political_rights", "civil_society",
        "digital_rights", "detention", "human_rights"
    ],
    "justice_law": [
        "judiciary", "decree_law_54", "trials", "prosecution",
        "detention", "constitutional_law", "legal_reform"
    ],
    "media_press_freedom": [
        "press_freedom", "journalist_arrest", "journalist_prosecution", "censorship",
        "media_regulation"
    ],
    "governance_institutions": [
        "government_policy", "presidency", "executive_power", "constitutional_system",
        "appointments", "presidential_decrees", "institutional_accountability"
    ],
    "economy_public_finance": [
        "growth", "trade", "public_debt", "budget", "IMF",
        "foreign_reserves", "banking_monetary", "investment", "public_enterprises", "inflation"
    ],
    "corruption_accountability": [
        "corruption", "procurement", "misuse_of_public_funds",
        "conflict_of_interest", "audit", "state_accountability"
    ],
    "protests_social_movements": [
        "social_movements", "demonstrations", "strikes", "sit_ins", "road_blocks"
    ],
    "security_policing": [
        "policing", "arrests", "use_of_force", "prisons", "border_security"
    ],
    "education": [
        "schools", "universities", "teachers", "infrastructure", "student_services"
    ],
    "agriculture": [
        "crops", "drought", "irrigation", "livestock", "agricultural_workers"
    ],
    "housing_infrastructure": [
        "public_works", "roads", "housing", "infrastructure_failure"
    ]
}

DEFAULT_SUB_ISSUES: Dict[str, str] = {
    "water": "water_cuts",
    "electricity": "outage",
    "gas_energy": "energy_security",
    "food_security": "food_shortage",
    "prices_cost_of_living": "purchasing_power",
    "work_unemployment": "labor_rights",
    "migration": "irregular_migration",
    "health": "public_health",
    "public_services": "transport",
    "pollution_environment": "industrial_pollution",
    "rights_freedoms": "civil_society",
    "justice_law": "judiciary",
    "media_press_freedom": "press_freedom",
    "governance_institutions": "government_policy",
    "economy_public_finance": "growth",
    "corruption_accountability": "corruption",
    "protests_social_movements": "social_movements",
    "security_policing": "policing",
    "education": "schools",
    "agriculture": "crops",
    "housing_infrastructure": "public_works"
}

# Legacy Slugs Normalization Mapping
LEGACY_ISSUE_MAP: Dict[str, str] = {
    "work": "work_unemployment",
    "public-services": "public_services",
    "public_service": "public_services",
    "rights-institutions": "rights_freedoms",
    "rights": "rights_freedoms",
    "institutions": "governance_institutions",
    "governance": "governance_institutions",
    "gabes": "pollution_environment",
    "pollution": "pollution_environment",
    "economy": "economy_public_finance",
    "cost_of_living": "prices_cost_of_living",
    "food": "food_security",
    "energy": "gas_energy",
    "press": "media_press_freedom",
    "justice": "justice_law",
    "protests": "protests_social_movements",
    "security": "security_policing",
    "infrastructure": "housing_infrastructure"
}

# Public Route / SEO Friendly URL Slug Mapping Layer
PUBLIC_TAXONOMY_SLUG_MAP: Dict[str, str] = {
    "water": "water",
    "electricity": "electricity",
    "gas_energy": "energy",
    "food_security": "food-security",
    "prices_cost_of_living": "cost-of-living",
    "work_unemployment": "work",
    "migration": "migration",
    "health": "health",
    "public_services": "public-services",
    "pollution_environment": "pollution",
    "rights_freedoms": "rights",
    "justice_law": "law",
    "media_press_freedom": "press-freedom",
    "governance_institutions": "governance",
    "economy_public_finance": "economy",
    "corruption_accountability": "accountability",
    "protests_social_movements": "protests",
    "security_policing": "security",
    "education": "education",
    "agriculture": "agriculture",
    "housing_infrastructure": "infrastructure"
}

PUBLIC_TAXONOMY_PATH_MAP: Dict[str, str] = {
    k: f"/issues/{v}" for k, v in PUBLIC_TAXONOMY_SLUG_MAP.items()
}

# Alias for backward compatibility
PUBLIC_TAXONOMY_ROUTE_MAP = PUBLIC_TAXONOMY_SLUG_MAP

def canonical_to_public_slug(issue: str) -> str:
    """Maps internal 21-category taxonomy ID to approved public URL slug."""
    normalized = normalize_issue_slug(issue)
    return PUBLIC_TAXONOMY_SLUG_MAP.get(normalized, normalized.replace("_", "-"))

def canonical_to_public_path(issue: str) -> str:
    """Maps internal taxonomy ID to canonical English public URL path (e.g. /issues/water, /gabes)."""
    cleaned = issue.strip().lower()
    if cleaned == "gabes":
        return "/gabes"
    normalized = normalize_issue_slug(cleaned)
    slug = canonical_to_public_slug(normalized)
    return f"/issues/{slug}"

def canonical_to_public_route(issue: str) -> str:
    """Maps a canonical 21-category primary issue slug to its public frontend/SEO route slug."""
    return canonical_to_public_slug(issue)

def public_slug_to_canonical(slug: str) -> str:
    """Maps a public URL slug (e.g. 'food-security', 'law', 'accountability') back to internal canonical issue."""
    cleaned = slug.strip().lower().replace("_", "-")
    reverse_map = {v: k for k, v in PUBLIC_TAXONOMY_SLUG_MAP.items()}
    if cleaned in reverse_map:
        return reverse_map[cleaned]
    if cleaned == "gabes":
        return "pollution_environment"
    return normalize_issue_slug(cleaned)

def public_path_to_canonical(path: str) -> str:
    """Maps a full public URL path (e.g. '/issues/food-security', '/gabes') back to internal canonical issue."""
    cleaned = path.strip().lower().strip("/")
    if cleaned == "gabes":
        return "pollution_environment"
    if cleaned.startswith("issues/"):
        slug = cleaned.split("/", 1)[1]
        return public_slug_to_canonical(slug)
    return public_slug_to_canonical(cleaned)

def public_route_to_canonical(route: str) -> str:
    """Maps a public route back to its canonical primary issue slug."""
    return public_path_to_canonical(route)

@dataclass
class MultiAxisClassificationResult:
    primary_issue: str
    sub_issue: Optional[str] = None
    secondary_issues: List[str] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    entities: List[str] = field(default_factory=list)
    classification: str = "FACT"  # FACT | CLAIM | ANALYSIS
    status: str = "REPORTED"      # VERIFIED | REPORTED | UNDER REVIEW | etc.
    confidence: float = 0.90
    reason: str = ""

def normalize_issue_slug(issue: Optional[str]) -> str:
    """Normalizes any legacy or alias issue slug into one of the 21 canonical categories."""
    if not issue:
        return "governance_institutions"
    cleaned = issue.strip().lower().replace("-", "_")
    if cleaned in CANONICAL_PRIMARY_ISSUES:
        return cleaned
    return LEGACY_ISSUE_MAP.get(cleaned, "governance_institutions")

def clean_text_for_matching(text: str) -> str:
    """Normalizes text for robust token and phrase matching."""
    if not text:
        return ""
    # Normalize unicode forms
    nfkd = unicodedata.normalize("NFKD", text)
    # Strip diacritics
    stripped = "".join(c for c in nfkd if not unicodedata.combining(c))
    # Normalize Arabic variations
    stripped = re.sub(r"[إأآا]", "ا", stripped)
    stripped = re.sub(r"ة\b", "ه", stripped)
    stripped = re.sub(r"[\u064B-\u065F]", "", stripped)  # Harakat
    return stripped.lower()

# Specific Domain Matchers
DOMAIN_PATTERNS: Dict[str, Dict[str, Any]] = {
    "water": {
        "strong": [
            r"eau potable", r"coupures? d['’]eau", r"penurie d['’]eau", r"stress hydrique",
            r"ressources hydrauliques", r"\bsonede\b", r"barrages?", r"urgence hydrique",
            r"deficit hydrique", r"nappes? phreatiques?", r"water cuts?", r"water scarcity",
            r"drinking water", r"dam storage", r"dam capacity", r"water rationing", r"water disruption",
            r"reseau d['’]eau", r"distribution d['’]eau", r"approvisionnement en eau", r"water network", r"water grid",
            r"مياه الشرب", r"انقطاع الما[ءء]", r"انقطاع المياه", r"قطع المياه",
            r"صوناد", r"الصوناد", r"سدود", r"السدود", r"شح المياه", r"طوارئ مائية", r"ازمة مياه", r"الموارد المائية",
            r"شبكة المياه", r"شبكة مياه"
        ],
        "sub_rules": {
            "water_cuts": [r"coupures? d['’]eau", r"انقطاع.*الما[ءء]", r"انقطاع.*مياه", r"اضطراب.*مياه", r"قطع المياه", r"water cuts?"],
            "dam_capacity": [r"barrages?", r"مخزون السدود", r"السدود", r"dam storage", r"dam capacity", r"taux de remplissage"],
            "drought": [r"secheresse", r"جفاف", r"الجفاف", r"drought", r"stress hydrique"],
            "drinking_water": [r"eau potable", r"مياه الشرب", r"drinking water", r"qualite de l['’]eau"],
            "groundwater_depletion": [r"nappe phreatique", r"المائدة المائية", r"groundwater"],
            "sonede_infrastructure": [r"sonede", r"الصوناد", r"reseau de distribution", r"travaux de reparation"]
        }
    },
    "electricity": {
        "strong": [
            r"\bsteg\b", r"electricite", r"electricity", r"power cuts?", r"power outages?", r"blackouts?",
            r"load shedding", r"power grid", r"electrical grid", r"coupures? d['’]electricite", r"delestage",
            r"reseau electrique", r"centrale electrique", r"panne d['’]electricite",
            r"انقطاع الكهرباء", r"انقطاع التيار", r"الستاغ", r"ستاغ",
            r"شبكة الكهرباء", r"توليد الكهرباء", r"ازمة الكهرباء"
        ],
        "sub_rules": {
            "outage": [r"coupures? d['’]electricite", r"panne d['’]electricite", r"انقطاع الكهرباء", r"انقطاع التيار", r"blackout", r"power outage"],
            "load_shedding": [r"delestage", r"load shedding", r"ترشيد الاستهلاك", r"ذروة الاستهلاك"],
            "grid": [r"reseau electrique", r"transformateur", r"محطة تحويل", r"شبكة الكهرباء", r"power grid"],
            "generation": [r"production d['’]electricite", r"centrale electrique", r"توليد الكهرباء", r"megawatts"],
            "renewable_energy": [r"solaire", r"renouvelable", r"energie propre", r"طاقة شمسية", r"طاقة متجددة"]
        }
    },
    "gas_energy": {
        "strong": [
            r"bouteilles? de gaz", r"gaz naturel", r"penurie de gaz", r"gaz algerien",
            r"hydrocarbures", r"carburant", r"stations[- ]service", r"\betap\b", r"\bstir\b",
            r"parcs? eoliens?", r"energie eolienne", r"wind farm", r"wind energy", r"solar farm",
            r"centrale solaire", r"energie propre", r"energies? renouvelables?", r"renewable energy",
            r"transition energetique", r"energy security", r"energy transition", r"energy imports?",
            r"قوارير الغاز", r"نقص الغاز", r"الغاز الجزائري", r"الغاز الطبيعي", r"المحروقات", r"بنزين",
            r"طاقة شمسية", r"طاقة متجددة", r"طاقة الرياح", r"مزارع الرياح"
        ],
        "sub_rules": {
            "renewable_energy": [r"wind farm", r"wind energy", r"parc eolien", r"eolien", r"solaire", r"solar", r"renouvelable", r"renewable", r"طاقة متجددة", r"طاقة شمسية", r"طاقة الرياح"],
            "household_gas": [r"bouteilles? de gaz", r"gaz butane", r"قوارير الغاز", r"غاز المنازل"],
            "natural_gas": [r"gaz naturel", r"gazoduc", r"الغاز الطبيعي", r"انبوب الغاز"],
            "fuel": [r"carburant", r"essence", r"gasoil", r"stations[- ]service", r"بنزين", r"المحروقات", r"محطات الوقود"],
            "energy_imports": [r"gaz algerien", r"importation de gaz", r"الغاز الجزائري", r"اتاوة انبوب الغاز"],
            "energy_security": [r"deficit energetique", r"securite energetique", r"عجز الطاقة", r"الامن الطاقي"]
        }
    },
    "food_security": {
        "strong": [
            r"penurie alimentaire", r"crise du pain", r"penurie de farine", r"penurie de sucre",
            r"penurie de lait", r"huile vegetale subventionnee", r"office des cereales",
            r"stocks? de ble", r"cereales", r"securite alimentaire", r"prix alimentaires",
            r"food security", r"food shortages?", r"bread crisis", r"milk shortages?",
            r"sugar shortages?", r"cooking oil", r"wheat supply", r"grain stocks?", r"food prices?",
            r"نقص المواد الغذائية", r"ازمة الخبز", r"نقص الخبز", r"نقص الحليب", r"نقص السكر",
            r"الزيت المدعم", r"ديوان الحبوب", r"مخزون القمح", r"الامن الغذائي", r"المواد الاساسية"
        ],
        "sub_rules": {
            "bread": [r"pain", r"boulangerie", r"farine", r"bread", r"flour", r"خبز", r"الخبز", r"مخابز", r"فرينة", r"سميد"],
            "milk": [r"lait", r"filiere laitiere", r"milk", r"dairy", r"حليب", r"الحليب", r"مشتقات الحليب"],
            "sugar": [r"sucre", r"sugar", r"سكر", r"السكر", r"office du commerce"],
            "cooking_oil": [r"huile vegetale", r"huile subventionnee", r"cooking oil", r"زيت نباتي", r"الزيت المدعم"],
            "cereals": [r"ble", r"cereales", r"office des cereales", r"wheat", r"grain", r"قمح", r"حبوب", r"ديوان الحبوب", r"صوامع الغلال"],
            "food_shortage": [r"penurie", r"shortage", r"نقص المواد", r"فقدان المواد"]
        }
    },
    "prices_cost_of_living": {
        "strong": [
            r"pouvoir d['’]achat", r"flambee des prix", r"hausse des prix", r"cout de la vie",
            r"indice des prix a la consommation", r"inflation des prix alimentaires",
            r"\binflation\b", r"taux d['’]inflation", r"cost of living", r"purchasing power",
            r"food prices", r"price hikes?", r"price increase", r"consumer price index",
            r"back[- ]to[- ]school costs?", r"couts? de la rentree", r"prix des denrees",
            r"costs? rise\b", r"rising costs?", r"price rise\b",
            r"غلا[ءء] الاسعار", r"القدرة الشرائية", r"ارتفاع الاسعار", r"تكلفة المعيشة",
            r"مؤشر اسعار الاستهلاك", r"الاسعار المشطة", r"التضخم", r"نسبة التضخم", r"تكاليف العودة المدرسية", r"اسعار المواد"
        ],
        "sub_rules": {
            "household_costs": [r"back[- ]to[- ]school", r"rentree scolaire", r"cout de la vie", r"cost of living", r"household costs", r"تكلفة المعيشة", r"العودة المدرسية"],
            "food_prices": [r"prix des legumes", r"prix des viandes", r"prix alimentaires", r"food prices", r"اسعار الخضر", r"اسعار اللحوم", r"اسعار المواد الغذائية"],
            "purchasing_power": [r"pouvoir d['’]achat", r"purchasing power", r"القدرة الشرائية", r"تدهور القدرة الشرائية"],
            "inflation": [r"inflation", r"taux d['’]inflation", r"cpi", r"indice des prix", r"تضخم", r"نسبة التضخم"],
            "fuel_prices": [r"ajustement des prix du carburant", r"fuel prices", r"الزيادة في اسعار المحروقات"]
        }
    },
    "work_unemployment": {
        "strong": [
            r"taux de chomage", r"demandeurs d['’]emploi", r"diplomes chomeurs", r"\bsmig\b",
            r"greve de l['’]ugtt", r"greve generale", r"licenciements", r"ouvriers de chantiers",
            r"marche du travail", r"salaires", r"unemployment", r"unemployment rate",
            r"job market", r"wages", r"wage increase", r"minimum wage", r"labor strikes?",
            r"\bugtt\b", r"layoffs", r"job creation",
            r"بطالة", r"البطالة", r"نسبة البطالة", r"تشغيل", r"اجور", r"الاجور",
            r"عمال الحضائر", r"التشغيل الهش", r"اضراب", r"الاتحاد العام التونسي للشغل", r"اصحاب الشهائد المعطلين", r"سوق الشغل"
        ],
        "sub_rules": {
            "unemployment": [r"chomage", r"chomeurs", r"unemployment", r"بطالة", r"المعطلين عن العمل"],
            "strikes": [r"greve", r"strike", r"اضراب", r"الاضراب العام", r"تحرك نقابي"],
            "wages": [r"salaires", r"smig", r"wages", r"اجور", r"الاجور", r"زيادة في الاجور"],
            "labor_rights": [r"ouvriers de chantiers", r"labor rights", r"عمال الحضائر", r"التشغيل الهش", r"حقوق العمال"],
            "layoffs": [r"licenciements", r"layoffs", r"fermeture d['’]usine", r"طرد عمال", r"غلق المصنع"]
        }
    },
    "migration": {
        "strong": [
            r"\bharqa\b", r"\bharraga\b", r"migration irreguliere", r"garde maritime",
            r"corps repeches", r"naufrage d['’]une embarcation", r"migrants subsahariens",
            r"el amra", r"jbeniana", r"interception en mer",
            r"irregular migration", r"sea crossings?", r"drowned migrants", r"migrant boat",
            r"shipwreck", r"coast guard",
            r"هجرة غير نظامية", r"حرقة", r"حراقة", r"حرس بحري", r"غرق مركب", r"انتشال جثث",
            r"مهاجرين غير نظاميين", r"العامرة", r"جبنيانة", r"مفقودين في البحر"
        ],
        "sub_rules": {
            "irregular_migration": [r"harqa", r"harraga", r"irregular migration", r"حرقة", r"حراقة", r"هجرة الشباب التونسي"],
            "sea_crossings": [r"embarcation clandestine", r"traversee maritime", r"sea crossing", r"قارب هجرة", r"اجتياز الحدود البحرية"],
            "deaths_missing": [r"naufrage", r"corps repeches", r"noyade", r"drowned", r"غرق", r"انتشال جثث", r"مفقودين", r"ضحايا البحر"],
            "border_policy": [r"garde maritime", r"el amra", r"jbeniana", r"coast guard", r"الحرس البحري", r"مخيمات المهاجرين"],
            "migrant_rights": [r"migrants subsahariens", r"droits des migrants", r"migrant rights", r"حقوق المهاجرين", r"الترحيل القسري"]
        }
    },
    "health": {
        "strong": [
            r"penurie de medicaments", r"pharmacie centrale", r"hopitaux publics",
            r"urgences hospitalieres", r"crise sanitaire", r"sante publique", r"\bcnam\b",
            r"public health", r"medicine shortages?", r"drug shortages?", r"hospital crisis",
            r"medical staff", r"healthcare access",
            r"نقص الادوية", r"الصيدلية المركزية", r"مستشفيات عمومية", r"صحة عمومية",
            r"طوارئ المستشفيات", r"فقدان الادوية", r"صندوق التامين على المرض"
        ],
        "sub_rules": {
            "medicine_shortage": [r"penurie de medicaments", r"medicaments en rupture", r"medicine shortage", r"drug shortage", r"نقص الادوية", r"فقدان الادوية", r"pharmacie centrale"],
            "hospitals": [r"hopital", r"hopitaux", r"hospitals?", r"مستشفى", r"مستشفيات", r"تجهيزات طبية"],
            "emergency_services": [r"urgences", r"samu", r"emergency", r"اقسام الاستعجالي", r"طوارئ طبية"],
            "medical_staff": [r"medecins", r"personnel soignant", r"doctors", r"nurses", r"اطباء", r"هجرة الاطباء", r"اطار تمريضي"],
            "healthcare_access": [r"cnam", r"couverture sanitaire", r"healthcare access", r"صندوق التامين على المرض", r"العلاج المجاني"]
        }
    },
    "public_services": {
        "strong": [
            r"transport public", r"\btranstu\b", r"\bsncft\b", r"ramassage des ordures",
            r"crise des dechets", r"\bonas\b", r"assainissement", r"services municipaux",
            r"public transit", r"waste collection", r"sanitation", r"municipal services",
            r"نقل عمومي", r"شركة نقل تونس", r"السكك الحديدية", r"تراكم النفايات",
            r"صرف صحي", r"التطهير", r"البلديات", r"مرفق عمومي"
        ],
        "sub_rules": {
            "transport": [r"transtu", r"sncft", r"transport public", r"public transit", r"metro", r"bus", r"نقل عمومي", r"حافلات", r"قطار"],
            "sanitation": [r"onas", r"assainissement", r"dechets", r"poubelles", r"sanitation", r"waste", r"تطهير", r"صرف صحي", r"نفايات"],
            "municipal_services": [r"municipalite", r"delegation speciale", r"municipal", r"بلدية", r"خدمات بلدية"],
            "administration": [r"bureaucratie", r"guichet", r"public administration", r"مرفق اداري", r"استخراج الوثائق"]
        }
    },
    "pollution_environment": {
        "strong": [
            r"phosphogypse", r"groupe chimique", r"\bgct\b", r"pollution a gabes",
            r"pollution marine", r"chatt essalam", r"gaz toxiques", r"bassin minier pollution",
            r"erosion cotiere", r"\banpe\b", r"air pollution", r"toxic waste",
            r"industrial emissions", r"marine pollution", r"coastal erosion",
            r"فسفوجبس", r"المجمع الكيميائي", r"تلوث قابس", r"شاطئ السلام",
            r"تلوث بحري", r"غازات سامة", r"تلوث الفسفاط", r"تاكل السواحل", r"كارثة بيئية"
        ],
        "sub_rules": {
            "gabes": [r"gabes", r"chatt essalam", r"phosphogypse", r"قابس", r"شاطئ السلام", r"فسفوجبس", r"المجمع الكيميائي بقابس"],
            "phosphate": [r"gafsa", r"cpg", r"bassin minier", r"قفصة", r"الحوض المنجمي", r"مغاسل الفسفاط"],
            "industrial_pollution": [r"pollution industrielle", r"rejets chimiques", r"industrial pollution", r"تلوث صناعي", r"انبعاثات كيميائية"],
            "air_pollution": [r"pollution de l['’]air", r"gaz toxiques", r"air pollution", r"تلوث الهواء", r"غازات سامة"],
            "coastal_pollution": [r"pollution marine", r"littoral", r"erosion cotiere", r"marine pollution", r"تلوث بحري", r"شواطئ ملوثة"]
        }
    },
    "rights_freedoms": {
        "strong": [
            r"droits humains", r"droits de l['’]homme", r"liberte d['’]expression",
            r"prisonniers politiques", r"detention arbitraire", r"societe civile",
            r"\bltdh\b", r"torture en detention", r"atteinte aux libertes",
            r"human rights", r"freedom of expression", r"political prisoners",
            r"civil liberties", r"civil society", r"arbitrary detention",
            r"harcelement", r"harassment",
            r"حقوق الانسان", r"حرية التعبير", r"حرية الراي", r"سجناء سياسيين", r"معتقلي الراي",
            r"المجتمع المدني", r"الرابطة التونسية للدفاع عن حقوق الانسان", r"التضييق على الحريات",
            r"تنكيل", r"التنكيل"
        ],
        "sub_rules": {
            "freedom_of_expression": [r"liberte d['’]expression", r"liberte d['’]opinion", r"freedom of expression", r"تنكيل", r"التنكيل", r"harassment", r"حرية التعبير", r"حرية الراي", r"حرية التظاهر"],
            "political_rights": [r"opposition politique", r"partis politiques", r"political rights", r"معارضة سياسية", r"العمل الحزبي"],
            "civil_society": [r"societe civile", r"associations", r"decret 88", r"civil society", r"المجتمع المدني", r"الجمعيات"],
            "detention": [r"detention arbitraire", r"prisonniers politiques", r"arbitrary detention", r"معتقلين سياسيين", r"ايقاف تعسفي"],
            "human_rights": [r"torture", r"dignite humaine", r"ltdh", r"human rights", r"تعذيب", r"حقوق الانسان"]
        }
    },
    "justice_law": {
        "strong": [
            r"decret[- ]loi 54", r"decret 54", r"mandat de depot", r"juge d['’]instruction",
            r"magistrats", r"tribunal de premiere instance", r"revocation de magistrats",
            r"independance de la justice", r"\bjort\b",
            r"decree 54", r"decree[- ]law 54", r"judiciary", r"detention warrants?",
            r"examining magistrate", r"court of first instance",
            r"مرسوم 54", r"المرسوم 54", r"بطاقة ايداع", r"قاضي التحقيق", r"قضاة",
            r"المحكمة الابتدائية", r"اعفاء قضاة", r"استقلالية القضاء", r"الرائد الرسمي", r"وكيل الجمهورية"
        ],
        "sub_rules": {
            "decree_law_54": [r"decret[- ]loi 54", r"decret 54", r"decree 54", r"المرسوم 54", r"مرسوم 54", r"الفصل 24 من المرسوم 54"],
            "judiciary": [r"magistrats", r"conseil superieur de la magistrature", r"judiciary", r"قضاة", r"المجلس الاعلى للقضاء", r"سلك القضاء"],
            "trials": [r"proces", r"audience", r"trials?", r"court hearings?", r"محاكمة", r"جلسة محاكمة", r"قضايا راي عام"],
            "prosecution": [r"parquet", r"ministere public", r"juge d['’]instruction", r"prosecution", r"النيابة العمومية", r"قاضي التحقيق"],
            "constitutional_law": [r"droit constitutionnel", r"cour constitutionnelle", r"constitutional law", r"قانون دستوري", r"المحكمة الدستورية"]
        }
    },
    "media_press_freedom": {
        "strong": [
            r"poursuites? (?:d['’]un |de )?journaliste", r"journalistes?", r"liberte de la presse",
            r"\bsnjt\b", r"arrestations? (?:d['’]un |de )?journaliste",
            r"proces (?:d['’]un |de |contre un )?journaliste", r"censure mediatique", r"\bhaica\b",
            r"syndicat des journalistes", r"carte de presse",
            r"press freedom", r"journalist arrests?", r"journalist prosecution",
            r"media censorship", r"press union", r"media regulation",
            r"حرية الصحافة", r"نقابة الصحفيين", r"ايقاف صحفي", r"محاكمة صحفيين", r"صحفي",
            r"صحفيين", r"التضييق على الصحافة", r"الهايكا", r"النقابة الوطنية للصحفيين"
        ],
        "sub_rules": {
            "journalist_prosecution": [r"poursuite", r"condamnation", r"prosecution", r"trial of journalist", r"محاكمة صحفي", r"سجن صحفي", r"قضية ضد صحفي"],
            "journalist_arrest": [r"arrestation de journaliste", r"interpellation de journaliste", r"journalist arrest", r"ايقاف صحفي", r"احتجاز صحفي"],
            "press_freedom": [r"liberte de la presse", r"liberte d['’]informer", r"press freedom", r"حرية الصحافة", r"حرية الاعلام"],
            "censorship": [r"censure", r"interdiction de diffusion", r"censorship", r"حجب", r"صنصرة", r"منع من البث"],
            "media_regulation": [r"haica", r"regulation audiovisuelle", r"media regulation", r"الهايكا", r"الهيئة العليا المستقلة للاتصال السمعي البصري"]
        }
    },
    "governance_institutions": {
        "strong": [
            r"presidence de la republique", r"palais de carthage", r"constitution de 2022",
            r"decret presidentiel", r"remaniement ministeriel", r"assemblee des representants",
            r"\barp\b", r"la kasbah", r"vacance du pouvoir", r"chef du gouvernement",
            r"institutions executives", r"pouvoirs executifs",
            r"presidency of the republic", r"carthage palace", r"2022 constitution",
            r"presidential decrees?", r"cabinet reshuffle", r"parliament", r"head of government", r"executive power",
            r"رئاسة الجمهورية", r"قصر قرطاج", r"دستور 2022", r"مرسوم رئاسي", r"امر رئاسي",
            r"تحوير وزاري", r"مجلس نواب الشعب", r"القصبة", r"رئيس الحكومة", r"شغور منصب"
        ],
        "sub_rules": {
            "presidential_decrees": [r"decret presidentiel", r"arrete presidentiel", r"presidential decree", r"مرسوم رئاسي", r"امر رئاسي"],
            "presidency": [r"presidence de la republique", r"palais de carthage", r"presidency of the republic", r"رئاسة الجمهورية", r"قصر قرطاج", r"carthage"],
            "executive_power": [r"remaniement ministeriel", r"chef du gouvernement", r"la kasbah", r"cabinet reshuffle", r"head of government", r"تحوير وزاري", r"رئاسة الحكومة", r"institutions executives"],
            "constitutional_system": [r"constitution de 2022", r"regime politique", r"2022 constitution", r"دستور 2022", r"النظام السياسي"],
            "appointments": [r"nomination de gouverneurs", r"mouvement des delegues", r"appointments", r"حركة المعتمدين", r"تعيين ولاة", r"تسميات جديدة"],
            "government_policy": [r"politique gouvernementale", r"government policy", r"مجلس وزاري", r"السياسة الحكومية"]
        }
    },
    "economy_public_finance": {
        "strong": [
            r"dette publique", r"deficit budgetaire", r"banque centrale de tunisie", r"\bbct\b",
            r"fonds monetaire international", r"\bfmi\b", r"reserves en devises", r"loi de finances",
            r"croissance economique", r"cours du dinar", r"secteur bancaire", r"benefices? bancaires?",
            r"resultats? financiers?", r"banques?", r"\bbna\b", r"\bbiat\b", r"\battijari\b",
            r"\bamen bank\b", r"\bstb\b", r"\bbte\b", r"\bbh bank\b", r"\bbh assurance\b", r"masse monetaire",
            r"planche a billets", r"commerce exterieur", r"balance commerciale", r"exportations?",
            r"importations?", r"tourisme", r"recettes touristiques", r"nuitees hotelieres",
            r"investissements? etrangers?", r"secteur des assurances?", r"public debt",
            r"budget deficit", r"central bank of tunisia", r"foreign reserves", r"finance law",
            r"economic growth", r"dinar exchange rate", r"bank profits?", r"banking sector",
            r"commercial banks?", r"outstanding credit", r"credit outstanding", r"bank lending",
            r"bank loans?", r"lending volume", r"credits? bancaires?", r"credits? a l['’]economie",
            r"encours des credits?", r"foreign currency assets", r"foreign exchange reserves",
            r"fx reserves", r"import cover", r"import days", r"days of imports?",
            r"reserves in days of imports", r"avoirs en devises", r"avoirs nets en devises",
            r"trade balance", r"trade deficit", r"bilateral trade", r"\btrade\b", r"trade relations",
            r"echanges? commerciaux", r"commerce exterieur", r"money supply",
            r"money[- ]printing", r"treasury bills", r"tourism revenue",
            r"hotel bookings", r"foreign investment", r"investment freedom", r"freedom to invest",
            r"insurance sector", r"\bassurance\b", r"\binsurance\b", r"\bprofits?\b", r"\bh1 profit\b",
            r"exports? of\b", r"\bexports?\b", r"\bimports?\b", r"\binvest\b", r"\binvestment\b",
            r"\binvestir\b", r"\binvestissements?\b",
            r"الدين العمومي", r"عجز الميزانية", r"البنك المركزي التونسي", r"صندوق النقد الدولي",
            r"احتياطي العملة الاجنبية", r"احتياطي العملة الصعبة", r"احتياطي النقد الاجنبي",
            r"قانون المالية", r"النمو الاقتصادي", r"سعر صرف الدينار",
            r"القطاع البنكي", r"القطاع المصرفي", r"أرباح البنوك", r"ارباح البنوك",
            r"القروض البنكية", r"قروض بنكية", r"القروض المصرفية", r"قروض مصرفية", r"الائتمان المصرفي", r"القروض الممنوحة",
            r"ايام التوريد", r"ايام توريد", r"موجودات الصرف",
            r"التجارة الخارجية", r"الميزان التجاري", r"الصادرات", r"الواردات",
            r"السياحة", r"العائدات السياحية", r"الاستثمار", r"طباعة الاموال", r"الكتلة النقدية", r"قروض", r"التامين",
            r"تبادل تجاري", r"تجارة"
        ],
        "sub_rules": {
            "foreign_reserves": [
                r"foreign currency assets", r"foreign exchange reserves", r"fx reserves",
                r"import cover", r"import days", r"days of imports?", r"reserves in days of imports",
                r"reserves en devises", r"avoirs en devises", r"avoirs nets en devises",
                r"jours d['’]importation", r"foreign reserves",
                r"احتياطي العملة الاجنبية", r"احتياطي العملة الصعبة", r"احتياطي النقد الاجنبي",
                r"احتياطي العملة", r"موجودات الصرف", r"ايام التوريد", r"ايام توريد"
            ],
            "banking_monetary": [
                r"commercial bank", r"outstanding credit", r"credit outstanding",
                r"bank lending", r"bank loan", r"lending volume",
                r"bank profit", r"banking", r"banque", r"benefice", r"assurance", r"insurance",
                r"profit", r"money supply", r"money[- ]printing", r"masse monetaire",
                r"planche a billets", r"bct", r"credit bancaire", r"credits a l['’]economie",
                r"encours des credits", r"بنوك", r"البنك المركزي", r"ارباح",
                r"قروض بنكية", r"قروض مصرفية", r"ائتمان مصرفي", r"قروض"
            ],
            "trade": [
                r"\btrade\b", r"commerce exterieur", r"balance commerciale",
                r"exportations?", r"importations?", r"exports?", r"\bimports?\b",
                r"التجارة الخارجية", r"الميزان التجاري", r"صادرات", r"واردات", r"تبادل تجاري"
            ],
            "investment": [r"freedom to invest", r"invest\b", r"investment", r"investir", r"investissements?", r"الاستثمار"],
            "public_debt": [r"dette publique", r"service de la dette", r"public debt", r"الدين العمومي", r"سداد الديون"],
            "IMF": [r"fmi", r"fonds monetaire international", r"imf", r"صندوق النقد الدولي", r"مفاوضات صندوق النقد"],
            "budget": [r"loi de finances", r"deficit budgetaire", r"budget deficit", r"قانون المالية", r"عجز الميزانية"],
            "growth": [r"croissance du pib", r"recession", r"economic growth", r"tourism", r"tourisme", r"hotel bookings", r"النمو الاقتصادي", r"السياحة", r"الناتج المحلي"]
        }
    },
    "corruption_accountability": {
        "strong": [
            r"detournement de fonds", r"marches publics corrompus", r"cour des comptes",
            r"pole judiciaire financier", r"enrichissement illicite", r"malversations",
            r"corruption", r"dilapidation des deniers", r"embezzlement", r"procurement fraud",
            r"court of auditors", r"illicit enrichment", r"public funds misuse", r"state accountability",
            r"فساد مالي", r"اهدار المال العام", r"دائرة المحاسبات", r"القطب القضائي المالي",
            r"شبهات فساد", r"صفقات مشبوهة", r"الاثراء غير المشروع"
        ],
        "sub_rules": {
            "corruption": [r"corruption", r"pot[- ]de[- ]vin", r"فساد", r"رشوة", r"شبهة فساد"],
            "misuse_of_public_funds": [r"detournement de fonds", r"dilapidation", r"embezzlement", r"اهدار المال العام", r"اختلاس"],
            "procurement": [r"marches publics", r"appels d['’]offres truques", r"procurement fraud", r"صفقات عمومية", r"طلبات العروض"],
            "audit": [r"cour des comptes", r"rapport d['’]audit", r"court of auditors", r"دائرة المحاسبات", r"تقرير رقابي"]
        }
    },
    "protests_social_movements": {
        "strong": [
            r"manifestations?", r"mouvements? sociaux", r"sit[- ]in", r"blocage de routes",
            r"marche de protestation", r"contestation populaire", r"rassemblement de protestation",
            r"protests?", r"demonstrations?", r"social movements?", r"road blocks?", r"popular unrest",
            r"احتجاجات", r"مظاهرات", r"اعتصام", r"غلق الطرقات", r"مسيرة احتجاجية",
            r"تحركات احتجاجية", r"غضب شعبي", r"وقفة احتجاجية"
        ],
        "sub_rules": {
            "demonstrations": [r"manifestation", r"marche", r"protest", r"demonstration", r"مظاهرة", r"مسيرة احتجاجية", r"وقفة احتجاجية"],
            "sit_ins": [r"sit[- ]in", r"اعتصام", r"اعتصامات", r"مقر الاعتصام"],
            "road_blocks": [r"blocage de routes", r"coupure de route", r"road blocks?", r"غلق الطرقات", r"قطع الطريق"],
            "social_movements": [r"mouvements sociaux", r"coordinations", r"social movement", r"حراك اجتماعي", r"التنسيقيات"]
        }
    },
    "security_policing": {
        "strong": [
            r"forces de l['’]ordre", r"arrestations massives", r"bavures policieres",
            r"conditions carcerales", r"prisons tunisiennes", r"garde nationale",
            r"security forces", r"police arrests?", r"police brutality", r"prison conditions",
            r"detention centers", r"national guard",
            r"قوات الامن", r"ايقافات امنية", r"تجاوزات امنية", r"اوضاع السجون",
            r"السجون التونسية", r"الحرس الوطني", r"مراكز الاحتفاظ"
        ],
        "sub_rules": {
            "policing": [r"police", r"garde nationale", r"security forces", r"امنيين", r"الحرس الوطني", r"دوريات امنية"],
            "arrests": [r"arrestations", r"descentes de police", r"police arrests?", r"ايقافات", r"مداهمات امنية"],
            "prisons": [r"prisons", r"milieu carceral", r"detenus", r"prison conditions", r"السجون", r"سجن المرناقية", r"اوضاع السجون"],
            "use_of_force": [r"violences policieres", r"torture au poste", r"police brutality", r"عنف امني", r"تجاوزات امنية"]
        }
    },
    "education": {
        "strong": [
            r"crise de l['’]education", r"greve des enseignants", r"ecoles publiques",
            r"enseignants suppleants", r"universites tunisiennes", r"rentree scolaire",
            r"infrastructure scolaire", r"education crisis", r"teacher strikes?",
            r"public schools?", r"substitute teachers", r"higher education", r"school infrastructure",
            r"back[- ]to[- ]school",
            r"ازمة التعليم", r"اضراب الاساتذة", r"المدارس العمومية", r"المعلمين النواب",
            r"الجامعات التونسية", r"العودة المدرسية", r"بنية المدارس"
        ],
        "sub_rules": {
            "schools": [r"ecoles", r"colleges", r"lycees", r"schools", r"مدارس", r"معاهد", r"مدارس ابتدائية"],
            "teachers": [r"enseignants", r"professeurs", r"suppleants", r"teachers", r"اساتذة", r"معلمين", r"المعلمين النواب"],
            "universities": [r"universites", r"facultes", r"universities", r"higher education", r"جامعات", r"كليات", r"التعليم العالي"],
            "infrastructure": [r"infrastructure scolaire", r"salles de classe", r"school infrastructure", r"بنية تحتية مدرسية", r"تهيئة المدارس"]
        }
    },
    "agriculture": {
        "strong": [
            r"secheresse agricole", r"recolte de cereales", r"filiere lait", r"eau d['’]irrigation",
            r"huile d['’]olive", r"production d['’]huile d['’]olive", r"campagne oleicole",
            r"aliments de betail", r"\butap\b", r"ouvrieres agricoles", r"agriculteurs",
            r"secteur agricole", r"exportations agroalimentaires", r"agroalimentaires?", r"agricultural drought",
            r"grain harvest", r"dairy sector", r"irrigation water", r"olive oil",
            r"olive production", r"olive harvest", r"livestock feed", r"agricultural workers",
            r"crops?", r"agri[- ]?food", r"farming",
            r"فلاحة", r"محاصيل الحبوب", r"مياه الري الفلاحي", r"زيت الزيتون", r"صابة الزيتون",
            r"الاعلاف", r"اتحاد الفلاحة", r"العاملات الفلاحيات", r"الجفاف الفلاحي", r"القطاع الفلاحي"
        ],
        "sub_rules": {
            "crops": [r"olive oil", r"huile d['’]olive", r"olive production", r"recolte", r"crops?", r"grain harvest", r"زيت الزيتون", r"صابة", r"محاصيل"],
            "drought": [r"secheresse agricole", r"deficit pluviometrique", r"agricultural drought", r"جفاف فلاحي", r"شح الامطار"],
            "irrigation": [r"eau d['’]irrigation", r"perimetres irrigues", r"irrigation", r"مياه الري", r"المناطق السقوية"],
            "livestock": [r"betail", r"aliments pour betail", r"filiere laitiere", r"livestock", r"dairy", r"اعلاف", r"تربية الماشية"],
            "agricultural_workers": [r"ouvrieres agricoles", r"transport des ouvrieres", r"agricultural workers", r"عاملات فلاحيات", r"شاحنات الموت"]
        }
    },
    "housing_infrastructure": {
        "strong": [
            r"effondrement", r"effondrement d['’](?:un )?immeuble", r"routes degradees",
            r"travaux publics", r"inondations urbaines", r"batiments? menacant ruine",
            r"degradation (?:avancee )?de la chaussee", r"chaussee", r"voirie",
            r"ministere de l['’]equipement", r"building collapse", r"degraded roads",
            r"public works", r"urban flooding", r"infrastructure failure", r"road network", r"bridges",
            r"انهيار مبنى", r"رداءة الطرقات", r"البنية التحتية", r"اشغال عمومية",
            r"فيضانات وتصريف المياه", r"مباني متداعية للسقوط", r"وزارة التجهيز", r"تصدع بناية"
        ],
        "sub_rules": {
            "roads": [r"routes", r"chaussee", r"voirie", r"nids[- ]de[- ]poule", r"roads", r"طرقات", r"حالة الطرقات"],
            "infrastructure_failure": [r"effondrement", r"fissures", r"menacant ruine", r"building collapse", r"انهيار مبنى", r"تصدع بناية", r"انهيار جسر", r"متداعية للسقوط"],
            "public_works": [r"travaux publics", r"ponts", r"public works", r"bridges", r"اشغال عمومية", r"جسور", r"منشات مائية"],
            "housing": [r"logement social", r"habitations", r"housing", r"سكن اجتماعي", r"احياء سكنية"]
        }
    }
}

# Controlled Topic Tags
CONTROLLED_TOPICS: Dict[str, List[str]] = {
    "decree_law_54": [r"decret[- ]loi 54", r"decret 54", r"المرسوم 54", r"مرسوم 54"],
    "kais_saied": [r"kais saied", r"kaïs saïed", r"قيس سعيد", r"رئيس الدولة"],
    "presidency": [r"presidence", r"president", r"presidentiel", r"presidential", r"carthage", r"رئاسة الجمهورية", r"رئيس الجمهورية", r"قصر قرطاج"],
    "constitution_2022": [r"constitution de 2022", r"دستور 2022", r"الدستور الجديد"],
    "ugtt": [r"\bugtt\b", r"اتحاد الشغل", r"الاتحاد العام التونسي للشغل"],
    "snjt": [r"\bsnjt\b", r"نقابة الصحفيين", r"النقابة الوطنية للصحفيين"],
    "ftdes": [r"\bftdes\b", r"المنتدى التونسي للحقوق الاقتصادية والاجتماعية"],
    "ltdh": [r"\bltdh\b", r"الرابطة التونسية للدفاع عن حقوق الانسان"],
    "sonede": [r"\bsonede\b", r"الصوناد", r"صوناد"],
    "steg": [r"\bsteg\b", r"الستاغ", r"ستاغ"],
    "ins": [r"\bins\b", r"المعهد الوطني للاحصاء"],
    "onagri": [r"\bonagri\b", r"المرصد الوطني للفلاحة"],
    "gct": [r"\bgct\b", r"groupe chimique", r"المجمع الكيميائي", r"المجمع الكيميائي التونسي"],
    "cpg": [r"\bcpg\b", r"شركة فسفاط قفصة"],
    "imf": [r"\bfmi\b", r"\bimf\b", r"صندوق النقد الدولي"],
    "bct": [r"\bbct\b", r"البنك المركزي التونسي"],
    "gabes": [r"gabes", r"قابس", r"شط السلام", r"خليج قابس"]
}

# Named Entities Extractor Patterns
NAMED_ENTITY_PATTERNS: Dict[str, List[str]] = {
    "Kais Saied": [r"kais saied", r"kaïs saïed", r"قيس سعيد"],
    "Presidency of the Republic": [r"presidence de la republique", r"president de la republique", r"رئاسة الجمهورية", r"رئيس الجمهورية", r"قصر قرطاج"],
    "Presidency of the Government": [r"presidence du gouvernement", r"رئاسة الحكومة", r"القصبة"],
    "SONEDE": [r"\bsonede\b", r"الصوناد", r"الشركة الوطنية لاستغلال وتوزيع المياه"],
    "STEG": [r"\bsteg\b", r"الستاغ", r"الشركة التونسية للكهرباء والغاز"],
    "UGTT": [r"\bugtt\b", r"الاتحاد العام التونسي للشغل"],
    "SNJT": [r"\bsnjt\b", r"النقابة الوطنية للصحفيين التونسيين", r"نقابة الصحفيين"],
    "FTDES": [r"\bftdes\b", r"المنتدى التونسي للحقوق الاقتصادية والاجتماعية"],
    "LTDH": [r"\bltdh\b", r"الرابطة التونسية للدفاع عن حقوق الإنسان"],
    "GCT": [r"\bgct\b", r"groupe chimique", r"المجمع الكيميائي", r"المجمع الكيميائي التونسي"],
    "CPG": [r"\bcpg\b", r"شركة فسفاط قفصة"],
    "INS": [r"\bins\b", r"المعهد الوطني للإحصاء"],
    "ONAGRI": [r"\bonagri\b", r"المرصد الوطني للفلاحة"],
    "Central Bank of Tunisia (BCT)": [r"\bbct\b", r"البنك المركزي التونسي"],
    "Ministry of Agriculture": [r"ministere de l['’]agriculture", r"وزارة الفلاحة"],
    "Ministry of Health": [r"ministere de la sante", r"وزارة الصحة"],
    "Ministry of Justice": [r"ministere de la justice", r"وزارة العدل"],
    "Ministry of Interior": [r"ministere de l['’]interieur", r"وزارة الداخلية"],
    "National Guard": [r"garde nationale", r"الحرس الوطني", r"الحرس البحري"],
    "Court of Auditors": [r"cour des comptes", r"دائرة المحاسبات"]
}

def classify_multi_axis(
    text: str,
    headline: str = "",
    summary: str = "",
    body: str = "",
    source_type: str = "news_agency"
) -> MultiAxisClassificationResult:
    """
    Performs multi-axis classification across:
    1. Primary Issue (from 21 canonical categories)
    2. Sub-Issue
    3. Secondary Issues
    4. Topics & Controlled Tags
    5. Named Entities
    6. Epistemic Classification (FACT | CLAIM | ANALYSIS)
    7. Ingestion Status & Confidence
    """
    full_text = f"{headline} {summary} {body} {text}".strip()
    norm_full = clean_text_for_matching(full_text)
    norm_hl = clean_text_for_matching(headline)

    # 1. Score each primary issue
    issue_scores: Dict[str, float] = {}
    matched_sub_issues: Dict[str, str] = {}

    for issue, rule in DOMAIN_PATTERNS.items():
        score = 0.0
        # Check strong signals in headline (heavy weight)
        for pat in rule["strong"]:
            if re.search(pat, norm_hl):
                score += 4.0
            elif re.search(pat, norm_full):
                score += 1.0

        if score > 0:
            # Special case: Media / Journalist prosecution trumps generic justice_law when journalist context present
            if issue == "media_press_freedom" and re.search(r"journaliste|صحفي|snjt|presse", norm_hl):
                score += 3.0

            issue_scores[issue] = score

            # Find matching sub-issue
            sub_rules = rule.get("sub_rules", {})
            for sub_id, sub_pats in sub_rules.items():
                for spat in sub_pats:
                    if re.search(spat, norm_hl) or re.search(spat, norm_full):
                        matched_sub_issues[issue] = sub_id
                        break
                if issue in matched_sub_issues:
                    break

    # 2. Select primary issue and secondary issues
    has_presidential_context = bool(
        re.search(r"presidence de la republique|palais de carthage|decret presidentiel|constitution de 2022|رئاسة الجمهورية|قصر قرطاج|مرسوم رئاسي|دستور 2022", norm_hl)
    )

    if issue_scores:
        sorted_issues = sorted(issue_scores.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_issues[0][0]
        primary_score = sorted_issues[0][1]
        secondaries = [k for k, v in sorted_issues[1:] if v >= 1.0]
        conf = min(0.95, 0.70 + (primary_score * 0.08))
        reason = f"Primary matched '{primary}' with score {primary_score:.1f} across multi-axis scan."
    elif has_presidential_context:
        primary = "governance_institutions"
        primary_score = 2.0
        secondaries = []
        conf = 0.75
        reason = "Primary matched 'governance_institutions' based on direct presidential/executive powers context."
    else:
        primary = "governance_institutions"
        primary_score = 0.0
        secondaries = []
        conf = 0.40  # Below auto-accept threshold for unclassified material
        reason = "No matching domain patterns detected; assigned baseline unclassified topic."

    primary_sub = matched_sub_issues.get(primary)
    if not primary_sub:
        primary_sub = DEFAULT_SUB_ISSUES.get(primary, "general")

    # 3. Extract Topics
    topics: List[str] = []
    for topic_id, pats in CONTROLLED_TOPICS.items():
        for pat in pats:
            if re.search(pat, norm_full):
                topics.append(topic_id)
                break

    # 4. Extract Entities
    entities: List[str] = []
    for ent_name, pats in NAMED_ENTITY_PATTERNS.items():
        for pat in pats:
            if re.search(pat, norm_full):
                entities.append(ent_name)
                break

    # 5. Epistemic Classification (FACT | CLAIM | ANALYSIS)
    analysis_markers = [
        r"analyse", r"enquete", r"tribune", r"perspective", r"decryptage", r"rapport detaille",
        r"etude", r"chronique", r"تحليل", r"تقرير استقصائي", r"قراءة في", r"دراسة", r"مقال راي",
        r"analysis", r"investigation", r"in[- ]depth", r"editorial", r"commentary", r"heading for\b",
        r"difficulties\b", r"defis\b", r"enjeux\b", r"obstacles\b", r"perspectives?\b",
        r"elusive\b", r"revival\b",
        r"^[\"“'«]", r"\?$"
    ]
    claim_markers = [
        r"declare", r"affirme", r"selon le ministre", r"selon", r"promet", r"revendique", r"assure",
        r"appelle a", r"denonce", r"met en garde", r"accuse", r"demande", r"revendications",
        r"صرح", r"اكد", r"وعد", r"بحسب", r"طالب", r"اعلن", r"ندد", r"حذر", r"دعا الى", r"دعوة الى",
        r"اوقفوا", r"أوقفوا", r"بيان", r"بيان مساندة", r"استنكر", r"رفض", r"تحذير",
        r"claims?", r"demands?", r"warns?", r"alleges?", r"appeals?", r"condemns?", r"denounces?",
        r"calls? for\b", r"stop\b", r"statement\b"
    ]

    if any(re.search(m, norm_hl) for m in analysis_markers) or source_type in ["investigative_media", "scientific_registry"]:
        classification = "ANALYSIS"
        status = "REPORTED"
    elif any(re.search(m, norm_hl) for m in claim_markers) or source_type in ["official", "ngo", "civil_society", "union"]:
        classification = "CLAIM"
        status = "OFFICIAL STATEMENT" if source_type == "official" else "REPORTED"
    else:
        classification = "FACT"
        status = "REPORTED"

    return MultiAxisClassificationResult(
        primary_issue=primary,
        sub_issue=primary_sub,
        secondary_issues=secondaries[:4],
        topics=topics,
        entities=entities,
        classification=classification,
        status=status,
        confidence=round(conf, 2),
        reason=reason
    )
