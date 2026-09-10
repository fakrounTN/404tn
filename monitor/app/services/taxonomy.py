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
        "natural_gas", "household_gas", "fuel", "energy_imports", "energy_security"
    ],
    "food_security": [
        "food_shortage", "cereals", "bread", "milk", "sugar",
        "cooking_oil", "agricultural_supply"
    ],
    "prices_cost_of_living": [
        "inflation", "food_prices", "fuel_prices", "purchasing_power", "household_costs"
    ],
    "work_unemployment": [
        "unemployment", "layoffs", "strikes", "wages",
        "labor_rights", "informal_work", "workplace_safety"
    ],
    "migration": [
        "irregular_migration", "sea_crossings", "deaths_missing",
        "border_policy", "deportation", "migrant_rights", "EU_tunisia", "return_policy"
    ],
    "health": [
        "medicine_shortage", "hospitals", "emergency_services",
        "medical_staff", "public_health", "healthcare_access"
    ],
    "public_services": [
        "transport", "administration", "sanitation", "municipal_services", "telecommunications"
    ],
    "pollution_environment": [
        "gabes", "phosphate", "industrial_pollution", "air_pollution",
        "water_pollution", "waste", "climate", "coastal_pollution"
    ],
    "rights_freedoms": [
        "freedom_of_expression", "political_rights", "civil_society",
        "digital_rights", "detention", "human_rights"
    ],
    "justice_law": [
        "decree_law_54", "judiciary", "trials", "prosecution",
        "detention", "constitutional_law", "legal_reform"
    ],
    "media_press_freedom": [
        "journalist_arrest", "journalist_prosecution", "censorship",
        "press_freedom", "media_regulation"
    ],
    "governance_institutions": [
        "presidency", "executive_power", "constitutional_system",
        "appointments", "presidential_decrees", "government_policy", "institutional_accountability"
    ],
    "economy_public_finance": [
        "inflation", "growth", "public_debt", "budget", "IMF",
        "foreign_reserves", "trade", "public_enterprises"
    ],
    "corruption_accountability": [
        "corruption", "procurement", "misuse_of_public_funds",
        "conflict_of_interest", "audit", "state_accountability"
    ],
    "protests_social_movements": [
        "demonstrations", "strikes", "sit_ins", "road_blocks", "social_movements"
    ],
    "security_policing": [
        "policing", "arrests", "use_of_force", "prisons", "border_security"
    ],
    "education": [
        "schools", "universities", "teachers", "infrastructure", "student_services"
    ],
    "agriculture": [
        "drought", "irrigation", "crops", "livestock", "agricultural_workers"
    ],
    "housing_infrastructure": [
        "roads", "housing", "public_works", "infrastructure_failure"
    ]
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
            r"drinking water", r"مياه الشرب", r"انقطاع الما[ءء]", r"انقطاع المياه", r"قطع المياه",
            r"صوناد", r"الصوناد", r"سدود", r"السدود", r"شح المياه", r"طوارئ مائية", r"ازمة مياه"
        ],
        "sub_rules": {
            "water_cuts": [r"coupures? d['’]eau", r"انقطاع.*الما[ءء]", r"انقطاع.*مياه", r"اضطراب.*مياه", r"قطع المياه", r"water cuts?"],
            "dam_capacity": [r"barrages?", r"مخزون السدود", r"السدود", r"dam storage", r"taux de remplissage"],
            "drought": [r"secheresse", r"جفاف", r"الجفاف", r"drought", r"stress hydrique"],
            "drinking_water": [r"eau potable", r"مياه الشرب", r"drinking water", r"qualite de l['’]eau"],
            "groundwater_depletion": [r"nappe phreatique", r"المائدة المائية", r"groundwater"],
            "sonede_infrastructure": [r"sonede", r"الصوناد", r"reseau de distribution", r"travaux de reparation"]
        }
    },
    "electricity": {
        "strong": [
            r"\bsteg\b", r"electricite", r"power cuts?", r"power outages?", r"blackout",
            r"load shedding", r"power grid", r"coupures? d['’]electricite", r"delestage",
            r"reseau electrique", r"انقطاع الكهرباء", r"انقطاع التيار", r"الستاغ", r"ستاغ",
            r"شبكة الكهرباء", r"توليد الكهرباء"
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
            r"قوارير الغاز", r"نقص الغاز", r"الغاز الجزائري", r"الغاز الطبيعي", r"المحروقات", r"بنزين"
        ],
        "sub_rules": {
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
            r"stocks? de ble", r"cereales", r"securite alimentaire",
            r"نقص المواد الغذائية", r"ازمة الخبز", r"نقص الخبز", r"نقص الحليب", r"نقص السكر",
            r"الزيت المدعم", r"ديوان الحبوب", r"مخزون القمح", r"الامن الغذائي", r"المواد الاساسية"
        ],
        "sub_rules": {
            "bread": [r"pain", r"boulangerie", r"farine", r"خبز", r"الخبز", r"مخابز", r"فرينة", r"سميد"],
            "milk": [r"lait", r"filiere laitiere", r"حليب", r"الحليب", r"مشتقات الحليب"],
            "sugar": [r"sucre", r"سكر", r"السكر", r"office du commerce"],
            "cooking_oil": [r"huile vegetale", r"huile subventionnee", r"زيت نباتي", r"الزيت المدعم"],
            "cereals": [r"ble", r"cereales", r"office des cereales", r"قمح", r"حبوب", r"ديوان الحبوب", r"صوامع الغلال"]
        }
    },
    "prices_cost_of_living": {
        "strong": [
            r"pouvoir d['’]achat", r"flambee des prix", r"hausse des prix", r"cout de la vie",
            r"indice des prix a la consommation", r"inflation des prix alimentaires",
            r"غلا[ءء] الاسعار", r"القدرة الشرائية", r"ارتفاع الاسعار", r"تكلفة المعيشة",
            r"مؤشر اسعار الاستهلاك", r"الاسعار المشطة"
        ],
        "sub_rules": {
            "food_prices": [r"prix des legumes", r"prix des viandes", r"prix alimentaires", r"اسعار الخضر", r"اسعار اللحوم"],
            "purchasing_power": [r"pouvoir d['’]achat", r"القدرة الشرائية", r"تدهور القدرة الشرائية", r"purchasing power"],
            "inflation": [r"inflation", r"taux d['’]inflation", r"تضخم", r"نسبة التضخم"],
            "fuel_prices": [r"ajustement des prix du carburant", r"الزيادة في اسعار المحروقات"]
        }
    },
    "work_unemployment": {
        "strong": [
            r"taux de chomage", r"demandeurs d['’]emploi", r"diplomes chomeurs", r"\bsmig\b",
            r"greve de l['’]ugtt", r"greve generale", r"licenciements", r"ouvriers de chantiers",
            r"marche du travail", r"بطالة", r"البطالة", r"نسبة البطالة", r"تشغيل", r"اجور",
            r"عمال الحضائر", r"التشغيل الهش", r"اضراب", r"الاتحاد العام التونسي للشغل", r"اصحاب الشهائد المعطلين"
        ],
        "sub_rules": {
            "unemployment": [r"chomage", r"chomeurs", r"بطالة", r"المعطلين عن العمل", r"unemployment"],
            "strikes": [r"greve", r"اضراب", r"الاضراب العام", r"strike", r"تحرك نقابي"],
            "wages": [r"salaires", r"smig", r"اجور", r"الاجور", r"زيادة في الاجور", r"wages"],
            "labor_rights": [r"ouvriers de chantiers", r"عمال الحضائر", r"التشغيل الهش", r"حقوق العمال"],
            "layoffs": [r"licenciements", r"fermeture d['’]usine", r"طرد عمال", r"غلق المصنع"]
        }
    },
    "migration": {
        "strong": [
            r"\bharqa\b", r"\bharraga\b", r"migration irreguliere", r"garde maritime",
            r"corps repeches", r"naufrage d['’]une embarcation", r"migrants subsahariens",
            r"el amra", r"jbeniana", r"interception en mer",
            r"هجرة غير نظامية", r"حرقة", r"حراقة", r"حرس بحري", r"غرق مركب", r"انتشال جثث",
            r"مهاجرين غير نظاميين", r"العامرة", r"جبنيانة", r"مفقودين في البحر"
        ],
        "sub_rules": {
            "irregular_migration": [r"harqa", r"harraga", r"حرقة", r"حراقة", r"هجرة الشباب التونسي"],
            "sea_crossings": [r"embarcation clandestine", r"traversee maritime", r"قارب هجرة", r"اجتياز الحدود البحرية"],
            "deaths_missing": [r"naufrage", r"corps repeches", r"noyade", r"غرق", r"انتشال جثث", r"مفقودين", r"ضحايا البحر"],
            "border_policy": [r"garde maritime", r"el amra", r"jbeniana", r"الحرس البحري", r"مخيمات المهاجرين"],
            "migrant_rights": [r"migrants subsahariens", r"droits des migrants", r"حقوق المهاجرين", r"الترحيل القسري"]
        }
    },
    "health": {
        "strong": [
            r"penurie de medicaments", r"pharmacie centrale", r"hopitaux publics",
            r"urgences hospitalieres", r"crise sanitaire", r"sante publique", r"\bcnam\b",
            r"نقص الادوية", r"الصيدلية المركزية", r"مستشفيات عمومية", r"صحة عمومية",
            r"طوارئ المستشفيات", r"فقدان الادوية الحياتية", r"صندوق التامين على المرض"
        ],
        "sub_rules": {
            "medicine_shortage": [r"penurie de medicaments", r"medicaments en rupture", r"نقص الادوية", r"فقدان الادوية", r"pharmacie centrale"],
            "hospitals": [r"hopital", r"hopitaux", r"مستشفى", r"مستشفيات", r"تجهيزات طبية"],
            "emergency_services": [r"urgences", r"samu", r"اقسام الاستعجالي", r"طوارئ طبية"],
            "medical_staff": [r"medecins", r"personnel soignant", r"اطباء", r"هجرة الاطباء", r"اطار تمريضي"],
            "healthcare_access": [r"cnam", r"couverture sanitaire", r"صندوق التامين على المرض", r"العلاج المجاني"]
        }
    },
    "public_services": {
        "strong": [
            r"transport public", r"\btranstu\b", r"\bsncft\b", r"ramassage des ordures",
            r"crise des dechets", r"\bonas\b", r"assainissement", r"services municipaux",
            r"نقل عمومي", r"شركة نقل تونس", r"السكك الحديدية", r"تراكم النفايات",
            r"صرف صحي", r"التطهير", r"البلديات", r"مرفق عمومي"
        ],
        "sub_rules": {
            "transport": [r"transtu", r"sncft", r"transport public", r"metro", r"bus", r"نقل عمومي", r"حافلات", r"قطار"],
            "sanitation": [r"onas", r"assainissement", r"dechets", r"poubelles", r"تطهير", r"صرف صحي", r"نفايات"],
            "municipal_services": [r"municipalite", r"delegation speciale", r"بلدية", r"خدمات بلدية"],
            "administration": [r"bureaucratie", r"guichet", r"مرفق اداري", r"استخراج الوثائق"]
        }
    },
    "pollution_environment": {
        "strong": [
            r"phosphogypse", r"groupe chimique", r"\bgct\b", r"pollution a gabes",
            r"pollution marine", r"chatt essalam", r"gaz toxiques", r"bassin minier pollution",
            r"erosion cotiere", r"anpe",
            r"فسفوجبس", r"المجمع الكيميائي", r"تلوث قابس", r"شاطئ السلام",
            r"تلوث بحري", r"غازات سامة", r"تلوث الفسفاط", r"تاكل السواحل", r"كارثة بيئية"
        ],
        "sub_rules": {
            "gabes": [r"gabes", r"chatt essalam", r"phosphogypse", r"قابس", r"شاطئ السلام", r"فسفوجبس", r"المجمع الكيميائي بقابس"],
            "phosphate": [r"gafsa", r"cpg", r"bassin minier", r"قفصة", r"الحوض المنجمي", r"مغاسل الفسفاط"],
            "industrial_pollution": [r"pollution industrielle", r"rejets chimiques", r"تلوث صناعي", r"انبعاثات كيميائية"],
            "air_pollution": [r"pollution de l['’]air", r"gaz toxiques", r"تلوث الهواء", r"غازات سامة"],
            "coastal_pollution": [r"pollution marine", r"littoral", r"erosion cotiere", r"تلوث بحري", r"شواطئ ملوثة"]
        }
    },
    "rights_freedoms": {
        "strong": [
            r"droits humains", r"droits de l['’]homme", r"liberte d['’]expression",
            r"prisonniers politiques", r"detention arbitraire", r"societe civile",
            r"\bltdh\b", r"torture en detention", r"atteinte aux libertes",
            r"حقوق الانسان", r"حرية التعبير", r"حرية الراي", r"سجناء سياسيين", r"معتقلي الراي",
            r"المجتمع المدني", r"الرابطة التونسية للدفاع عن حقوق الانسان", r"التضييق على الحريات"
        ],
        "sub_rules": {
            "freedom_of_expression": [r"liberte d['’]expression", r"liberte d['’]opinion", r"حرية التعبير", r"حرية الراي", r"حرية التظاهر"],
            "political_rights": [r"opposition politique", r"partis politiques", r"معارضة سياسية", r"العمل الحزبي"],
            "civil_society": [r"societe civile", r"associations", r"decret 88", r"المجتمع المدني", r"الجمعيات"],
            "detention": [r"detention arbitraire", r"prisonniers politiques", r"معتقلين سياسيين", r"ايقاف تعسفي"],
            "human_rights": [r"torture", r"dignite humaine", r"ltdh", r"تعذيب", r"حقوق الانسان"]
        }
    },
    "justice_law": {
        "strong": [
            r"decret[- ]loi 54", r"decret 54", r"mandat de depot", r"juge d['’]instruction",
            r"magistrats", r"tribunal de premiere instance", r"revocation de magistrats",
            r"independance de la justice", r"\bjort\b",
            r"مرسوم 54", r"المرسوم 54", r"بطاقة ايداع", r"قاضي التحقيق", r"قضاة",
            r"المحكمة الابتدائية", r"اعفاء قضاة", r"استقلالية القضاء", r"الرائد الرسمي", r"وكيل الجمهورية"
        ],
        "sub_rules": {
            "decree_law_54": [r"decret[- ]loi 54", r"decret 54", r"المرسوم 54", r"مرسوم 54", r"الفصل 24 من المرسوم 54"],
            "judiciary": [r"magistrats", r"conseil superieur de la magistrature", r"قضاة", r"المجلس الاعلى للقضاء", r"سلك القضاء"],
            "trials": [r"proces", r"audience", r"محاكمة", r"جلسة محاكمة", r"قضايا راي عام"],
            "prosecution": [r"parquet", r"ministere public", r"juge d['’]instruction", r"النيابة العمومية", r"قاضي التحقيق"],
            "constitutional_law": [r"droit constitutionnel", r"cour constitutionnelle", r"قانون دستوري", r"المحكمة الدستورية"]
        }
    },
    "media_press_freedom": {
        "strong": [
            r"poursuites? (?:d['’]un |de )?journaliste", r"journalistes?", r"liberte de la presse",
            r"\bsnjt\b", r"arrestations? (?:d['’]un |de )?journaliste",
            r"proces (?:d['’]un |de |contre un )?journaliste", r"censure mediatique", r"\bhaica\b",
            r"syndicat des journalistes", r"carte de presse",
            r"حرية الصحافة", r"نقابة الصحفيين", r"ايقاف صحفي", r"محاكمة صحفيين", r"صحفي",
            r"التضييق على الصحافة", r"الهايكا", r"النقابة الوطنية للصحفيين"
        ],
        "sub_rules": {
            "journalist_prosecution": [r"poursuite", r"condamnation", r"محاكمة صحفي", r"سجن صحفي", r"قضية ضد صحفي", r"decret 54"],
            "journalist_arrest": [r"arrestation de journaliste", r"interpellation de journaliste", r"ايقاف صحفي", r"احتجاز صحفي"],
            "press_freedom": [r"liberte de la presse", r"liberte d['’]informer", r"حرية الصحافة", r"حرية الاعلام"],
            "censorship": [r"censure", r"interdiction de diffusion", r"حجب", r"صنصرة", r"منع من البث"],
            "media_regulation": [r"haica", r"regulation audiovisuelle", r"الهايكا", r"الهيئة العليا المستقلة للاتصال السمعي البصري"]
        }
    },
    "governance_institutions": {
        "strong": [
            r"presidence de la republique", r"palais de carthage", r"constitution de 2022",
            r"decret presidentiel", r"remaniement ministeriel", r"assemblee des representants",
            r"\barp\b", r"la kasbah", r"vacance du pouvoir", r"chef du gouvernement",
            r"institutions executives", r"pouvoirs executifs",
            r"رئاسة الجمهورية", r"قصر قرطاج", r"دستور 2022", r"مرسوم رئاسي", r"امر رئاسي",
            r"تحوير وزاري", r"مجلس نواب الشعب", r"القصبة", r"رئيس الحكومة", r"شغور منصب"
        ],
        "sub_rules": {
            "presidential_decrees": [r"decret presidentiel", r"arrete presidentiel", r"مرسوم رئاسي", r"امر رئاسي"],
            "presidency": [r"presidence de la republique", r"palais de carthage", r"رئاسة الجمهورية", r"قصر قرطاج", r"carthage"],
            "executive_power": [r"remaniement ministeriel", r"chef du gouvernement", r"la kasbah", r"تحوير وزاري", r"رئاسة الحكومة", r"institutions executives"],
            "constitutional_system": [r"constitution de 2022", r"regime politique", r"دستور 2022", r"النظام السياسي"],
            "appointments": [r"nomination de gouverneurs", r"mouvement des delegues", r"حركة المعتمدين", r"تعيين ولاة", r"تسميات جديدة"]
        }
    },
    "economy_public_finance": {
        "strong": [
            r"dette publique", r"deficit budgetaire", r"banque centrale de tunisie", r"\bbct\b",
            r"fonds monetaire international", r"\bfmi\b", r"reserves en devises", r"loi de finances",
            r"croissance economique", r"cours du dinar",
            r"الدين العمومي", r"عجز الميزانية", r"البنك المركزي التونسي", r"صندوق النقد الدولي",
            r"احتياطي العملة الاجنبية", r"قانون المالية", r"النمو الاقتصادي", r"سعر صرف الدينار"
        ],
        "sub_rules": {
            "public_debt": [r"dette publique", r"service de la dette", r"الدين العمومي", r"سداد الديون"],
            "IMF": [r"fmi", r"fonds monetaire international", r"صندوق النقد الدولي", r"مفاوضات صندوق النقد"],
            "budget": [r"loi de finances", r"deficit budgetaire", r"قانون المالية", r"عجز الميزانية"],
            "foreign_reserves": [r"reserves en devises", r"jours d['’]importation", r"احتياطي العملة", r"موجودات الصرف"],
            "growth": [r"croissance du pib", r"recession", r"النمو الاقتصادي", r"الناتج المحلي"]
        }
    },
    "corruption_accountability": {
        "strong": [
            r"detournement de fonds", r"marches publics corrompus", r"cour des comptes",
            r"pole judiciaire financier", r"enrichissement illicite", r"malversations",
            r"فساد مالي", r"اهدار المال العام", r"دائرة المحاسبات", r"القطب القضائي المالي",
            r"شبهات فساد", r"صفقات مشبوهة", r"الاثراء غير المشروع"
        ],
        "sub_rules": {
            "corruption": [r"corruption", r"pot-de-vin", r"فساد", r"رشوة", r"شبهة فساد"],
            "misuse_of_public_funds": [r"detournement de fonds", r"dilapidation", r"اهدار المال العام", r"اختلاس"],
            "procurement": [r"marches publics", r"appels d['’]offres truques", r"صفقات عمومية", r"طلبات العروض"],
            "audit": [r"cour des comptes", r"rapport d['’]audit", r"دائرة المحاسبات", r"تقرير رقابي"]
        }
    },
    "protests_social_movements": {
        "strong": [
            r"manifestations?", r"mouvements? sociaux", r"sit[- ]in", r"blocage de routes",
            r"marche de protestation", r"contestation populaire", r"rassemblement de protestation",
            r"احتجاجات", r"مظاهرات", r"اعتصام", r"غلق الطرقات", r"مسيرة احتجاجية",
            r"تحركات احتجاجية", r"غضب شعبي", r"وقفة احتجاجية"
        ],
        "sub_rules": {
            "demonstrations": [r"manifestation", r"marche", r"مظاهرة", r"مسيرة احتجاجية", r"وقفة احتجاجية"],
            "sit_ins": [r"sit[- ]in", r"اعتصام", r"اعتصامات", r"مقر الاعتصام"],
            "road_blocks": [r"blocage de routes", r"coupure de route", r"غلق الطرقات", r"قطع الطريق"],
            "social_movements": [r"mouvements sociaux", r"coordinations", r"حراك اجتماعي", r"التنسيقيات"]
        }
    },
    "security_policing": {
        "strong": [
            r"forces de l['’]ordre", r"arrestations massives", r"bavures policieres",
            r"conditions carcerales", r"prisons tunisiennes", r"garde nationale",
            r"قوات الامن", r"ايقافات امنية", r"تجاوزات امنية", r"اوضاع السجون",
            r"السجون التونسية", r"الحرس الوطني", r"مراكز الاحتفاظ"
        ],
        "sub_rules": {
            "policing": [r"police", r"garde nationale", r"امنيين", r"الحرس الوطني", r"دوريات امنية"],
            "arrests": [r"arrestations", r"descentes de police", r"ايقافات", r"مداهمات امنية"],
            "prisons": [r"prisons", r"milieu carceral", r"detenus", r"السجون", r"سجن المرناقية", r"اوضاع السجون"],
            "use_of_force": [r"violences policieres", r"torture au poste", r"عنف امني", r"تجاوزات امنية"]
        }
    },
    "education": {
        "strong": [
            r"crise de l['’]education", r"greve des enseignants", r"ecoles publiques",
            r"enseignants suppleants", r"universites tunisiennes", r"rentree scolaire difficile",
            r"ازمة التعليم", r"اضراب الاساتذة", r"المدارس العمومية", r"المعلمين النواب",
            r"الجامعات التونسية", r"العودة المدرسية", r"بنية المدارس"
        ],
        "sub_rules": {
            "schools": [r"ecoles", r"colleges", r"lycees", r"مدارس", r"معاهد", r"مدارس ابتدائية"],
            "teachers": [r"enseignants", r"professeurs", r"suppleants", r"اساتذة", r"معلمين", r"المعلمين النواب"],
            "universities": [r"universites", r"facultes", r"جامعات", r"كليات", r"التعليم العالي"],
            "infrastructure": [r"infrastructure scolaire", r"salles de classe", r"بنية تحتية مدرسية", r"تهيئة المدارس"]
        }
    },
    "agriculture": {
        "strong": [
            r"secheresse agricole", r"recolte de cereales", r"filiere lait", r"eau d['’]irrigation",
            r"huile d['’]olive", r"aliments de betail", r"\butap\b", r"ouvrieres agricoles",
            r"فلاحة", r"محاصيل الحبوب", r"مياه الري الفلاحي", r"زيت الزيتون", r"الاعلاف",
            r"اتحاد الفلاحة", r"العاملات الفلاحيات", r"الجفاف الفلاحي"
        ],
        "sub_rules": {
            "drought": [r"secheresse agricole", r"deficit pluviometrique", r"جفاف فلاحي", r"شح الامطار"],
            "crops": [r"recolte de ble", r"cereales", r"huile d['’]olive", r"صابة الحبوب", r"زيت الزيتون"],
            "irrigation": [r"eau d['’]irrigation", r"perimetres irrigues", r"مياه الري", r"المناطق السقوية"],
            "livestock": [r"betail", r"aliments pour betail", r"filiere laitiere", r"اعلاف", r"تربية الماشية"],
            "agricultural_workers": [r"ouvrieres agricoles", r"transport des ouvrieres", r"عاملات فلاحيات", r"شاحنات الموت"]
        }
    },
    "housing_infrastructure": {
        "strong": [
            r"effondrement", r"effondrement d['’](?:un )?immeuble", r"routes degradees",
            r"travaux publics", r"inondations urbaines", r"batiments? menacant ruine",
            r"degradation (?:avancee )?de la chaussee", r"chaussee", r"voirie", r"ministere de l['’]equipement",
            r"انهيار مبنى", r"رداءة الطرقات", r"البنية التحتية", r"اشغال عمومية",
            r"فيضانات وتصريف المياه", r"مباني متداعية للسقوط", r"وزارة التجهيز", r"تصدع بناية"
        ],
        "sub_rules": {
            "roads": [r"routes", r"chaussee", r"voirie", r"nids-de-poule", r"طرقات", r"حالة الطرقات"],
            "infrastructure_failure": [r"effondrement", r"fissures", r"menacant ruine", r"انهيار مبنى", r"تصدع بناية", r"انهيار جسر", r"متداعية للسقوط"],
            "public_works": [r"travaux publics", r"ponts", r"اشغال عمومية", r"جسور", r"منشات مائية"],
            "housing": [r"logement social", r"habitations", r"سكن اجتماعي", r"احياء سكنية"]
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
    has_presidential_mention = bool(
        re.search(r"kais saied|kaïs saïed|قيس سعيد|رئاسة الجمهورية|carthage", norm_full)
    )

    if issue_scores:
        sorted_issues = sorted(issue_scores.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_issues[0][0]
        secondaries = [k for k, v in sorted_issues[1:] if v >= 1.0]
    elif has_presidential_mention:
        primary = "governance_institutions"
        secondaries = []
    else:
        primary = "governance_institutions"
        secondaries = []

    primary_sub = matched_sub_issues.get(primary)
    if not primary_sub and primary in CANONICAL_SUB_ISSUES:
        primary_sub = CANONICAL_SUB_ISSUES[primary][0]

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
        r"etude", r"chronique", r"تحليل", r"تقرير استقصائي", r"قراءة في", r"دراسة", r"مقال راي"
    ]
    claim_markers = [
        r"declare", r"affirme", r"selon le ministre", r"promet", r"revendique", r"assure",
        r"صرح", r"اكد", r"وعد", r"بحسب الوزير", r"طالب", r"اعلن"
    ]

    if any(re.search(m, norm_hl) for m in analysis_markers) or source_type in ["investigative_media", "scientific_registry"]:
        classification = "ANALYSIS"
        status = "REPORTED"
    elif any(re.search(m, norm_hl) for m in claim_markers) or source_type == "official":
        classification = "CLAIM"
        status = "OFFICIAL STATEMENT" if source_type == "official" else "REPORTED"
    else:
        classification = "FACT"
        status = "REPORTED"

    # Confidence calculation
    primary_score = issue_scores.get(primary, 1.0)
    conf = min(0.95, 0.70 + (primary_score * 0.08))
    reason = f"Primary matched '{primary}' (sub: {primary_sub}) with score {primary_score:.1f} across multi-axis scan."

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
