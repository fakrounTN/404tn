# Security Policy

## 404TN Project Security & Confidentiality Principles

404TN is an independent investigative documentation platform operating under strict standards of data integrity, confidentiality, and operational security.

### Reporting a Vulnerability

If you discover a potential security vulnerability in any component of the 404TN software or infrastructure, we encourage you to report it responsibly.

**Contact:**
- **Signal:** `+1 (202) 404-TN26` (Encrypted voice & messaging)
- **PGP Fingerprint:** `404A B89C 7E31 02D4 F592 1A83 9C24 E817 3A50 404B`
- **Email:** `security@404tn.com`

Please include:
1. Description of the vulnerability and attack vector.
2. Steps or proof-of-concept to reproduce the behavior safely.
3. Potential impact on platform integrity or user privacy.

We commit to acknowledging receipt within **24 hours** and providing an assessment and remediation timeline within **72 hours**.

### Scope & Out of Scope

**In Scope:**
- Main platform frontend (`404tn.com`)
- FastAPI Evidence API (`api.404tn.com`)
- Collector framework and verification logic
- Storage and database encryption controls

**Out of Scope:**
- Denial of Service (DoS / DDoS) against infrastructure
- Social engineering or phishing targeting journalists/contributors
- Third-party upstream institutional services monitored by 404TN

### Security Architecture Highlights
- **Zero Commercial Tracking:** No Google Analytics, Meta Pixel, ad cookies, or tracking beacons.
- **Strict TLS & Truststore:** Native operating system certificate verification enforced on all collector requests without exceptions.
- **Non-Root Containers:** All container images run under unprivileged system users with minimal capabilities.
- **Isolated Network Topology:** Backend microservices and databases are internal-only and inaccessible directly from the public internet.
