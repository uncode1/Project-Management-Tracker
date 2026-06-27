# Flask Backend Architecture Plan

This document outlines the target architecture, data model, API surface, and security controls for the upcoming Flask backend that will power authentication, authorization, and data persistence for the Project Management Tracker. The design aligns with the GDPR and NDPR requirements captured in `docs/compliance.md`.

## High-Level Overview

- **Stack**: Python 3.12, Flask 3.x, SQLAlchemy 2.x, Alembic for migrations, PostgreSQL 15, Redis (session/token blacklist + rate limiting), Celery (asynchronous jobs for email/DSR exports), Nginx or API gateway fronting Gunicorn/Uvicorn workers.
- **Authentication**: Email + password with Argon2id hashing, JWT access tokens (15 min) + rotating refresh tokens (7 days) stored in HttpOnly Secure cookies. Optional MFA planned (TOTP via authenticator app) using `pyotp`.
- **Authorization**: Role-Based Access Control (RBAC) with hierarchical scopes: `owner`, `admin`, `member`, `viewer`. Resource-level permissions for workspaces/boards/teams/cards enforced in service layer and DB policies where possible.
- **Persistence**: Postgres schemas for tenants, users, teams, boards, lists, cards, comments, assignments, audit logs, consent records, and DSR requests. Soft-delete columns for GDPR right-to-erasure with background scrubbing.
- **Deployment**: Containerized service (Docker) deployed to preferred infrastructure (e.g., Azure App Service, AWS ECS, or on-prem). Terraform/IaC recommended for reproducibility.

## Data Model (Initial Tables)

| Table | Purpose | Key Fields |
| --- | --- | --- |
| `tenants` | Multi-tenant separation (optional) | `id`, `name`, `data_region`, `plan_tier` |
| `users` | Identity records | `id`, `tenant_id`, `email`, `password_hash`, `full_name`, `role`, `team_id`, `mfa_enabled`, `last_login_at`, timestamps |
| `teams` | Team grouping | `id`, `tenant_id`, `name`, `description`, `lead_user_id`, timestamps |
| `boards` | Board metadata | `id`, `tenant_id`, `name`, `description`, `owner_id`, `visibility`, timestamps |
| `lists` | Columns within boards | `id`, `board_id`, `title`, `position`, timestamps |
| `cards` | Tasks | `id`, `board_id`, `list_id`, `title`, `description`, `due_date`, `status`, `priority`, `reporter_id`, `assignee_id`, timestamps |
| `card_labels` | Optional labels | `id`, `card_id`, `color`, `text` |
| `card_comments` | Discussion | `id`, `card_id`, `author_id`, `body`, timestamps |
| `assignments` | Historical assignment log | `id`, `card_id`, `assignee_id`, `assigned_by`, `assigned_at` |
| `consents` | GDPR/NDPR consent log | `id`, `user_id`, `policy_version`, `consent_type`, `granted_at`, `withdrawn_at` |
| `dsr_requests` | Data subject rights | `id`, `user_id`, `type`, `status`, `requested_at`, `due_at`, `completed_at`, metadata |
| `audit_logs` | Append-only auditing | `id`, `tenant_id`, `actor_id`, `action`, `resource_type`, `resource_id`, `metadata`, `ip`, timestamps |
| `refresh_tokens` | Rotating token store | `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, device metadata |

All tables include `created_at`, `updated_at`, and optional `deleted_at` for soft deletes. Foreign keys enforced with cascading rules respecting GDPR erasure requirements (anonymize references instead of hard delete when needed).

## API Endpoints (Phase 1)

### Auth
- `POST /api/v1/auth/register`: Create account (tenant-aware). Validates consent, sends email verification (email service integration).
- `POST /api/v1/auth/login`: Issue access + refresh tokens; enforce device fingerprint, rate limiting.
- `POST /api/v1/auth/refresh`: Rotate refresh token, issue new access token.
- `POST /api/v1/auth/logout`: Revoke refresh token chain, clear cookies.
- `POST /api/v1/auth/mfa/setup` & `POST /api/v1/auth/mfa/verify`: Optional TOTP enrollment.
- `POST /api/v1/auth/password/forgot` & `/reset`: Email-based password reset flow.

### Users & Teams
- `GET /api/v1/users/me`: Profile data, consent status.
- `PATCH /api/v1/users/me`: Update profile fields.
- `GET /api/v1/users`: Admin-only directory with pagination and filters.
- `POST /api/v1/users`: Invite/create new user (sends invite email).
- `PATCH /api/v1/users/{id}`: Update role/team; enforce RBAC.
- `DELETE /api/v1/users/{id}`: Soft delete / initiate erasure workflow.
- `GET /api/v1/teams`: List teams with members.
- `POST /api/v1/teams`: Create team.
- `PATCH /api/v1/teams/{id}`: Update metadata or membership.
- `DELETE /api/v1/teams/{id}`: Soft delete.

### Boards, Lists, Cards
- `GET /api/v1/boards`: Boards visible to requester.
- `POST /api/v1/boards`: Create board; assign owner.
- `GET /api/v1/boards/{id}`: Board detail with lists + cards.
- `PATCH /api/v1/boards/{id}` / `DELETE`: Update metadata or archive.
- `POST /api/v1/boards/{id}/lists`: Add list.
- `PATCH /api/v1/lists/{id}` / `DELETE`: Update list title/position or remove.
- `POST /api/v1/lists/{id}/cards`: Create card with optional assignee.
- `PATCH /api/v1/cards/{id}`: Update title, description, due date, status, assignee, labels.
- `DELETE /api/v1/cards/{id}`: Soft delete/archive card.
- `POST /api/v1/cards/{id}/comments`: Add comment.
- `GET /api/v1/cards/{id}/history`: Change log (assignment, status, comments) for auditing.

### Dashboard & Analytics
- `GET /api/v1/dashboard/summary`: Aggregated metrics (tasks per status, overdue counts, completion rate) with tenant filters.
- `GET /api/v1/dashboard/teams`: Team-level metrics for leadership view.

### Compliance & DSR
- `POST /api/v1/dsr`: Submit access/erasure/portability request.
- `GET /api/v1/dsr`: Admin view of requests + status.
- `POST /api/v1/consent`: Update consent flags (marketing, analytics).

## Security & Middleware

- **Input Validation**: `pydantic` or `marshmallow` schemas for every request body.
- **Error Handling**: Central error blueprint returning RFC 7807 Problem Details JSON.
- **Rate Limiting**: `flask-limiter` backed by Redis; per-IP and per-user thresholds, stricter on auth routes.
- **RBAC Decorators**: Custom decorators pulling user context from JWT claims + DB to enforce role/resource checks.
- **Data Encryption**: Field-level encryption using libsodium/Fernet for refresh token hashes and audit metadata containing PII.
- **Logging**: Structured logs with trace IDs (OpenTelemetry-friendly) shipped to centralized log store.
- **Monitoring & Metrics**: Prometheus/Grafana or Azure Monitor integration; health checks at `/healthz`, `/readyz`.

## Frontend Integration Notes

1. **Auth Context**: React app stores access token in memory, relies on HttpOnly refresh cookie. On load, call `/auth/refresh` to bootstrap session.
2. **Protected Routes**: Use guard to redirect unauthenticated users to login. Display 403 messages based on RBAC errors returned by API.
3. **Data Fetching**: Replace localStorage persistence with API client layer (e.g., `axios` wrapper) handling retries and token renewal.
4. **Optimistic UI**: Keep optimistic updates for drag-and-drop but reconcile with server response; handle 409 conflicts when multiple users edit.
5. **DSR & Consent UI**: Add profile settings allowing data export/deletion request triggers and consent toggles.

## Implementation Phases

1. **Foundation**: Scaffold Flask project, config management, DB migrations, base models, and health checks.
2. **Auth & Users**: Build registration/login flows, JWT handling, RBAC middleware, user CRUD, consent logging.
3. **Boards & Tasks**: Implement board/list/card endpoints, assignments, comments, and audit logging.
4. **Compliance & DSR**: Add DSR endpoints, export tooling, anonymization workers, and admin dashboard for requests.
5. **Frontend Integration**: Incrementally switch React app to API-backed data, starting with auth context then board CRUD.
6. **Hardening**: Pen tests, logging/monitoring, rate limits, and MFA rollout.

This plan provides the baseline for development. Once approved, we can proceed to scaffolding the Flask service and iterating through the implementation phases.
