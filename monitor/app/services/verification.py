# monitor/app/services/verification.py
def determine_status(classification: str, source_type: str, has_empirical_measurement: bool, is_government_promise: bool) -> str:
    if is_government_promise and not has_empirical_measurement:
        return "RESPONSE IDENTIFIED"
    if classification == "FACT" and has_empirical_measurement:
        return "VERIFIED"
    if source_type in ("official", "state_agency", "state_news_agency"):
        return "OFFICIAL STATEMENT"
    if classification == "CLAIM":
        return "REPORTED"
    if classification == "ANALYSIS":
        return "UNDER REVIEW"
    return "VERIFIED"
