# Compliance Requirements

This document captures the initial security, privacy, and compliance requirements for the upcoming Flask backend that will power authentication, authorization, and persistence for the Project Management Tracker. The primary regulatory scopes are the EU General Data Protection Regulation (GDPR) and Nigeria Data Protection Regulation (NDPR).

## Regulatory Scope

- **GDPR**: Applies to all EU/EEA-located users and any processing of their personal data, regardless of where the service is hosted.
- **NDPR**: Applies to data subjects residing in Nigeria; mirrors many GDPR concepts but requires Nigeria Data Protection Commission (NDPC) oversight for certain processing activities.
- **Data Categories**: User profile information (name, email, role), authentication secrets (hashed passwords, refresh tokens), task content that may contain personal or business-sensitive details, team metadata, audit logs, and usage analytics.

## Lawful Basis & Consent

- Determine the appropriate lawful basis for processing (likely **contract** for core app usage and **legitimate interest** or **consent** for analytics/marketing emails).
- Capture explicit consent for optional processing; log consent timestamps and versions of the privacy policy.
- Provide granular opt-in/opt-out controls for non-essential cookies and marketing notifications.

## Data Minimization & Purpose Limitation

- Collect only required identity attributes (name, email, role, team memberships). Defer optional profile fields until justified by a feature requirement.
- Avoid storing plaintext task attachments or files containing PII unless necessary; consider separate encrypted object storage if/when attachments are introduced.
- Ensure each API endpoint’s payload is scoped to what the caller’s role requires (principle of least privilege).

## Data Subject Rights (DSR)

Implement automated or admin-assisted workflows for:

1. **Right of access**: Export all user-related data (profile, teams, tasks authored/assigned, audit logs).
2. **Right to rectification**: Allow self-service profile updates; log changes.
3. **Right to erasure**: Provide account deletion that removes or anonymizes personal data while preserving referential integrity in boards/tasks.
4. **Data portability**: Deliver machine-readable exports (JSON/CSV) upon request.
5. **Objection & restriction**: Flag accounts to halt non-essential processing (email, analytics).

All requests must be timestamped, tracked, and responded to within statutory timelines (GDPR ≤30 days, NDPR ≤30 days unless extended).

## Authentication & Authorization Controls

- Enforce secure password policy (min length 12, complexity or passphrase, prevent breached passwords, rate-limit login attempts).
- Store passwords with Argon2id (preferred) or bcrypt with strong cost factor.
- Use short-lived JWT access tokens + rotating refresh tokens stored as HttpOnly, Secure cookies (or device-bound storage), with IP/UA binding where practical.
- Role-based access control (RBAC) tiers: `owner`, `admin`, `member`, `viewer`. Map permissions for boards, teams, and cards. Deny by default when role metadata is missing.
- Optional step-up MFA (TOTP/WebAuthn) should be planned for higher-risk tenants.

## Security Safeguards

- Enforce TLS everywhere (HTTPS front-door, TLS between services). Use HSTS.
- Encrypt sensitive columns at rest (Postgres TDE / field-level encryption for refresh tokens, audit logs referencing PII).
- Implement secrets management (environment variables backed by Vault/KeyVault/Secrets Manager). No secrets in source control.
- Apply request-level rate limiting, bot detection, and anomaly monitoring (suspicious login patterns, brute force).
- Maintain secure coding pipeline: dependency scanning (pip-audit), SAST, DAST, container image scanning where applicable.
- Conduct regular penetration tests and vulnerability management aligned with GDPR Article 32.

## Logging, Auditing, and Incident Response

- Centralized structured logging (JSON) with minimal PII—pseudonymize user identifiers where feasible.
- Retain auth logs (logins, password changes, MFA events) and data access events for at least 12 months, subject to storage policies.
- Append-only audit trail for administrative actions and DSR handling, exportable for regulators.
- Define incident response runbooks, including breach notification timelines (72 hours for GDPR, NDPR requires notifying NDPC and affected subjects where risk is high).

## Data Residency & Cross-Border Transfers

- Determine hosting regions (e.g., EU West + Africa). If data leaves the EU/EEA or Nigeria, implement appropriate safeguards (SCCs, IDTA, NDPR-compliant data transfer agreements).
- Keep encryption keys in-region to minimize regulatory exposure.

## Third-Party Processors

- Maintain a vendor inventory for any subprocessors (email delivery, logging, analytics). Ensure DPAs are signed and subprocessors meet GDPR/NDPR obligations.
- Provide transparency to customers via a published subprocessors list and update notices.

## Documentation & Policies

- Draft/update Privacy Policy, Data Processing Agreement (DPA), and Terms of Service referencing GDPR/NDPR rights and obligations.
- Maintain Records of Processing Activities (RoPA) covering user/team data, auth events, and support tickets.
- Create internal policies for access control, data retention, backup/restore, and secure development lifecycle.

## Next Steps

1. Confirm data hosting regions, vendor list, and encryption strategy.
2. Finalize RBAC matrix and MFA roadmap.
3. Implement DSR workflow tooling (internal dashboard or ticket integration).
4. Align Flask backend architecture with these requirements (encryption, logging, API contract updates).
