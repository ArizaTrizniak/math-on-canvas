# Auth Service v1 — Детальный план работ

**Дата:** 2026-03-05
**Статус:** Проект
**Общая оценка:** ~5 недель (1 разработчик full-time)
**Scope:** Всё, что помечено P0 (v1) в [02-requirements.md](02-requirements.md)

---

## Сводка

| Phase | Название | Длительность | Результат |
|-------|----------|-------------|-----------|
| 0 | Foundation | 1 неделя | Инфраструктура + скелет проекта |
| 1 | Core Auth | 2 недели | OAuth login, JWT, sessions, RBAC |
| 2 | Integration | 1 неделя | Потребители + entitlement sync + GDPR |
| 3 | Hardening | 1 неделя | Security, observability, load test |

---

## Предусловия (до старта Phase 0)

Решить открытые вопросы, блокирующие работу:

| # | Вопрос | Ref | Кто | Дедлайн |
|---|--------|-----|-----|---------|
| ~~OQ-1~~ | ~~Финальный выбор провайдера: Firebase vs Cognito~~ | — | — | ✅ **Решено: Cognito** |
| ~~OQ-3~~ | ~~Subdomain strategy: `auth.math-on-canvas.com` vs `api.math-on-canvas.com/auth`~~ | — | — | ✅ **Решено: `api.math-on-canvas.com/auth` — Auth и Backend API на общем API Gateway** |
| ~~OQ-6~~ | ~~Cookie domain: wildcard `.math-on-canvas.com` vs точный~~ | — | — | ✅ **Решено: `Domain=.math-on-canvas.com` (wildcard) — покрывает api., www. и корневой домен для SSR** |
| DEP-1 | Cognito User Pool setup (Google as federated IdP, App Client, hosted UI или custom callback) | [10-risks](10-risks-and-roadmap.md#5-dependencies-external) | DevOps | До Phase 1 |
| ~~DEP-2~~ | ~~Domain DNS configuration~~ | — | — | ✅ **Решено: ACM wildcard cert `*.math-on-canvas.com` + `math-on-canvas.com` — Issued; CAA records для `amazon.com` добавлены в Vercel DNS** |

---

## Phase 0: Foundation (Неделя 1)

**Цель:** Работающая инфраструктура + скелет приложения + local dev environment.

### 0.1 Terraform — AWS-ресурсы

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 0.1.1 | DynamoDB table `math-on-canvas-auth-{env}` (PK/SK + GSI1 + GSI2 + TTL + PITR + SSE-KMS) | [04-data-model](04-data-model.md#2-таблица-math-on-canvas-auth), [08-deployment](08-deployment.md#21-ресурсы) | 2h | `terraform apply` создаёт таблицу |
| 0.1.2 | SSM Parameter Store: signing key + provider config (SecureString + KMS) | [08-deployment](08-deployment.md#21-ресурсы) | 1h | Параметры с PLACEHOLDER |
| 0.1.3 | Lambda function `math-on-canvas-auth-{env}` (Node.js 22, arm64, 256 MB, 15s timeout); env `AUTH_PROVIDER=cognito` | [08-deployment](08-deployment.md#21-ресурсы) | 2h | Lambda развёрнута |
| 0.1.4 | Создать HTTP API Gateway `api.math-on-canvas.com` (общий для Auth + Backend API): custom domain, routes `/auth/*` → Auth Lambda proxy, CORS для auth-endpoints | [08-deployment](08-deployment.md#21-ресурсы), [05-api-contracts](05-api-contracts.md#5-cors-configuration) | 2.5h | GET `api.math-on-canvas.com/auth/health` доступен |
| 0.1.5 | IAM roles: Lambda execution role (DynamoDB, SSM, CloudWatch, SQS) | [07-security](07-security.md#41-iam-policies-principle-of-least-privilege) | 1h | Least-privilege policies |
| 0.1.6 | SQS queue + DLQ для entitlement events | [08-deployment](08-deployment.md#21-ресурсы) | 1h | Queue ready |
| 0.1.7 | CloudWatch alarm: auth-service-errors | [08-deployment](08-deployment.md#21-ресурсы) | 0.5h | Базовый error alarm |
| 0.1.8 | Terraform variables + staging.tfvars + prod.tfvars | [08-deployment](08-deployment.md#22-variables) | 0.5h | Configurable environments |

**Итого:** ~10h

### 0.2 Node.js — Scaffold проекта

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 0.2.1 | Инициализация: `package.json`, TypeScript 5, esbuild config → single `dist/handler.js` | [08-deployment](08-deployment.md#3-nodejs-project-structure) | 2h | `npm run build` → bundled handler |
| 0.2.2 | Lambda handler entry point (`src/handler.ts`): API Gateway v2 proxy event → router → response | [08-deployment](08-deployment.md#3-nodejs-project-structure) | 2h | Роутинг запросов |
| 0.2.3 | Lightweight router (`src/router/router.ts`): method + path → controller mapping (~50 строк) | [08-deployment](08-deployment.md#3-nodejs-project-structure) | 1h | Маршрутизация |
| 0.2.4 | Config module (`src/config/config.ts`): Zod-валидация env vars при startup | [08-deployment](08-deployment.md#3-nodejs-project-structure) | 1h | Fail-fast при отсутствии env |
| 0.2.5 | Models/types: `User`, `RefreshToken`, `Entitlement`, `AuditLog`, `AuthContext` | [04-data-model](04-data-model.md), [06-auth-flows](06-auth-flows.md#4-jwt-lifecycle) | 1.5h | Типы |
| 0.2.6 | Structured logger (JSON, CloudWatch-compatible) с sensitive data policy | [09-observability](09-observability.md#1-structured-logging) | 1.5h | Logger ready |
| 0.2.7 | Error model: единый формат ошибок с error codes | [05-api-contracts](05-api-contracts.md#3-общие-модели) | 1h | Error handling |
| 0.2.8 | Utility: `jwtUtil.ts` (RS256 sign/verify, jose), `cryptoUtil.ts` (SHA-256, AES-GCM), `cookieUtil.ts` | [07-security](07-security.md#22-jwt-security), [07-security](07-security.md#23-refresh-token-security) | 2h | Crypto primitives |
| 0.2.9 | Health check endpoint: `GET /auth/health` с DynamoDB + SSM dependency check | [05-api-contracts](05-api-contracts.md#29-get-authhealth), [09-observability](09-observability.md#7-health-check) | 1h | `/auth/health` → 200 |
| 0.2.10 | Vitest setup + первые unit-тесты (router, config, utils) | [08-deployment](08-deployment.md#3-nodejs-project-structure) | 2h | `npm test` green |

**Итого:** ~14h

### 0.3 Local Dev Environment

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 0.3.1 | Dockerfile для auth-service | [08-deployment](08-deployment.md#4-docker-local-development) | 1h | Image builds |
| 0.3.2 | docker-compose.yml: auth-service + DynamoDB Local + dynamodb-admin + table setup | [08-deployment](08-deployment.md#4-docker-local-development) | 2h | `docker-compose up` |
| 0.3.3 | RSA key pair generation script (`make generate-local-keys`) | [08-deployment](08-deployment.md#4-docker-local-development) | 0.5h | local-secrets/ |
| 0.3.4 | Makefile: build, test, local-up, local-down | [08-deployment](08-deployment.md#4-docker-local-development) | 0.5h | DX shortcuts |

**Итого:** ~4h

### 0.4 CI/CD Pipeline

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 0.4.1 | GitHub Actions workflow: test → build → deploy-staging (develop) → deploy-prod (main) | [08-deployment](08-deployment.md#5-cicd-pipeline-github-actions) | 3h | Pipeline green |
| 0.4.2 | AWS OIDC role для GitHub Actions (staging + prod) | [08-deployment](08-deployment.md#5-cicd-pipeline-github-actions) | 1h | Secure deploy |

**Итого:** ~4h

### Phase 0 — Критерии приёмки

- [ ] `GET /auth/health` возвращает 200 в staging
- [ ] Docker local environment запускается `make local-up` и `/auth/health` → 200 на `localhost:3001`
- [ ] CI pipeline: push → test → build → deploy → green
- [ ] `npm test` — все unit-тесты проходят
- [ ] Terraform state в S3, workspace-ы staging/prod

---

## Phase 1: Core Auth (Недели 2–3)

### Milestone 1.1: OAuth + User Provisioning (Неделя 2)

**Цель:** Полный login flow от нажатия кнопки до JWT cookie в браузере.

#### 1.1.1 Provider Abstraction Layer

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 1.1.1a | `AuthProvider` interface: `getAuthorizationUrl()`, `exchangeCode()`, `verifyIdToken()`, `revokeToken()` | [03-architecture](03-architecture.md#41-authprovider-adapter-pattern) | 1h | Interface |
| 1.1.1b | `CognitoAuthProvider` implementation (Google OAuth через Cognito federation: Authorization Code Flow, `exchangeCode()` → Cognito `/token`, `verifyIdToken()` → Cognito JWKS) | [03-architecture](03-architecture.md#41-authprovider-adapter-pattern) | 4h | Cognito adapter |
| 1.1.1c | Provider factory: выбор по env `AUTH_PROVIDER=cognito\|firebase` (cognito — default) | [02-requirements](02-requirements.md) FR-5.4 | 0.5h | Runtime switching |
| 1.1.1d | Unit-тесты CognitoAuthProvider (mocked Cognito endpoints via msw или nock) | — | 2h | Tests green |

**Итого:** ~7.5h

#### 1.1.2 DynamoDB Repositories

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 1.1.2a | `UserRepository`: create, getById, getByEmail (GSI2), updateLastLogin, softDelete | [04-data-model](04-data-model.md#31-user) | 3h | User CRUD |
| 1.1.2b | `TokenRepository`: create, getByHash, revoke, revokeAllForUser (GSI1), updateLastUsed | [04-data-model](04-data-model.md#32-refreshtoken) | 3h | Token CRUD |
| 1.1.2c | `EntitlementRepository`: getAll, getSpecific, grant, revoke, decrementAiCredits (conditional) | [04-data-model](04-data-model.md#33-entitlement) | 2.5h | Entitlement CRUD |
| 1.1.2d | `AuditLogRepository`: append event (auto-TTL 90d) | [04-data-model](04-data-model.md#34-auditlog) | 1.5h | Audit writes |
| 1.1.2e | Unit-тесты repositories (mocked DynamoDB client) | — | 3h | Tests green |

**Итого:** ~13h

#### 1.1.3 OAuth Login Flow

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 1.1.3a | `AuthService.initiateLogin()`: generate state + nonce, encrypt (AES-256-GCM), set auth_state cookie, build authorization URL | [06-auth-flows](06-auth-flows.md#1-oauth-20-authorization-code-flow-google), [05-api-contracts](05-api-contracts.md#21-get-authlogin) | 2h | Login initiation |
| 1.1.3b | `OAuthController.login()` → `GET /auth/login` → 302 redirect to Google | [05-api-contracts](05-api-contracts.md#21-get-authlogin) | 1h | Controller |
| 1.1.3c | `AuthService.handleCallback()`: verify state cookie, exchange code via AuthProvider, verify id_token, upsert user, load entitlements, generate JWT + refresh token, store hash, set cookies, audit log | [06-auth-flows](06-auth-flows.md#1-oauth-20-authorization-code-flow-google), [05-api-contracts](05-api-contracts.md#22-get-authcallback) | 4h | Callback logic |
| 1.1.3d | `OAuthController.callback()` → `GET /auth/callback` → 302 redirect to /editor + cookies | [05-api-contracts](05-api-contracts.md#22-get-authcallback) | 1h | Controller |
| 1.1.3e | CSRF protection: encrypted state in auth_state cookie → verify on callback (10-min expiry) | [06-auth-flows](06-auth-flows.md#state-parameter-csrf-protection), [07-security](07-security.md#11-spoofing-подмена-идентичности) T-S3 | 1.5h | CSRF |
| 1.1.3f | User provisioning при first login: create User + default entitlements (free_user, 5 AI credits) | [06-auth-flows](06-auth-flows.md#5-first-login-user-provisioning) | 1.5h | Provisioning |
| 1.1.3g | **[tech-debt]** Нормализатор ошибок в `logger.ts`: сериализация `name`/`message`/`stack`/`cause` вместо `{}` для Error-объектов; редактирование sensitive полей | — | 1h | Logger fix |
| 1.1.3h | **[tech-debt]** Инфраструктурные ошибки в `config.ts` и `providers/factory.ts`: заменить `throw new Error(...)` на `AppError` с кодом и метаданными | — | 0.5h | Error unification |
| 1.1.3i | **[tech-debt]** PKCE в Cognito authorization URL: добавить `code_challenge` / `code_challenge_method=S256` в `cognito.ts` | [07-security](07-security.md) | 1h | PKCE |

**Итого:** ~14h

#### 1.1.4 JWT Generation

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 1.1.4a | `TokenService.generateAccessToken()`: RS256 JWT с claims (iss, sub, aud, exp, iat, jti, role, ent, ver) | [03-architecture](03-architecture.md#42-tokenservice), [06-auth-flows](06-auth-flows.md#4-jwt-lifecycle) | 2h | JWT generation |
| 1.1.4b | `TokenService.generateRefreshToken()`: crypto.randomBytes(32) → hex; store SHA-256 hash in DynamoDB + deviceInfo, IP | [07-security](07-security.md#23-refresh-token-security) | 1.5h | Refresh token |
| 1.1.4c | RSA key loading from SSM Parameter Store (с кэшированием, cold-start optimized) | [07-security](07-security.md#22-jwt-security) | 1.5h | Key management |
| 1.1.4d | Cookie builder: access_token (Path=/, 15 min), refresh_token (Path=/auth, 7d), auth_state (Path=/auth/callback, 10 min) — HttpOnly, Secure, SameSite=Lax, **Domain=.math-on-canvas.com** | [05-api-contracts](05-api-contracts.md#4-cookie-strategy) | 1h | Cookie management |
| 1.1.4e | Unit-тесты: JWT generation, verification, expired token, tampered token, refresh token hashing | — | 2h | Tests green |

**Итого:** ~8h

#### Milestone 1.1 — Критерии приёмки

- [ ] E2E (manual): Click "Sign in with Google" → OAuth redirect → callback → JWT cookie → redirect to `/editor`
- [ ] User record создан в DynamoDB с `role=free_user`, `status=active`
- [ ] Default entitlements: `ai_credits` (qty=5), `plan_free`
- [ ] JWT содержит корректные claims (sub, role, ent); верифицируется jose
- [ ] Refresh token hash в DynamoDB; raw token в cookie
- [ ] AuditLog: `LOGIN_SUCCESS` запись с IP, User-Agent
- [ ] При повторном login: `lastLoginAt` обновляется, новый User не создаётся

---

### Milestone 1.2: Token Management (Неделя 3, первая половина)

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 1.2.1 | `TokenService.refreshAccessToken()`: extract cookie → SHA-256 → lookup DynamoDB → verify (not expired, not revoked) → load user + entitlements → verify user active → generate new JWT → update lastUsedAt → audit log | [06-auth-flows](06-auth-flows.md#2-token-refresh-flow), [05-api-contracts](05-api-contracts.md#23-post-authrefresh) | 3h | Refresh logic |
| 1.2.2 | `TokenController.refresh()` → `POST /auth/refresh` → 200 + новый access_token cookie | [05-api-contracts](05-api-contracts.md#23-post-authrefresh) | 1h | Controller |
| 1.2.3 | `AuthService.logout()`: extract refresh_token cookie → hash → mark revoked → clear cookies → audit log | [06-auth-flows](06-auth-flows.md#3-logout-flow), [05-api-contracts](05-api-contracts.md#24-post-authlogout) | 2h | Logout |
| 1.2.4 | `OAuthController.logout()` → `POST /auth/logout` → 204 + cleared cookies | [05-api-contracts](05-api-contracts.md#24-post-authlogout) | 0.5h | Controller |
| 1.2.5 | `GET /auth/.well-known/jwks.json` → JWKS endpoint (RSA public key, kid, Cache-Control: max-age=3600) | [05-api-contracts](05-api-contracts.md#28-get-authwell-knownjwksjson), [03-architecture](03-architecture.md#42-tokenservice) | 2h | JWKS |
| 1.2.6 | `UserService.getProfile()` + `UserController.getMe()` → `GET /auth/me` → 200 + profile + entitlements | [05-api-contracts](05-api-contracts.md#25-get-authme) | 2h | Profile |
| 1.2.7 | JWT verification middleware (`src/middleware/authMiddleware.ts`): extract JWT from cookie/Authorization header → verify RS256 → enrich request context (sub, role, ent) | [07-security](07-security.md#33-jwt-verification-algorithm-for-consumers) | 2h | Auth middleware |
| 1.2.8 | Error responses по спеке: `invalid_token`, `token_expired`, `token_revoked`, `user_suspended` | [05-api-contracts](05-api-contracts.md#23-post-authrefresh) | 1h | Error codes |
| 1.2.9 | Unit + integration тесты: refresh happy path, expired refresh, revoked refresh, JWKS format, /me response | — | 3h | Tests green |

**Итого:** ~16.5h

#### Milestone 1.2 — Критерии приёмки

- [ ] Access token expires (15 min) → `POST /auth/refresh` → новый access_token cookie → 200
- [ ] Logout → refresh token revoked → subsequent refresh → 401 `token_revoked`
- [ ] `GET /auth/.well-known/jwks.json` → valid RSA public key(s) с kid
- [ ] `GET /auth/me` (with JWT) → 200 + полный профиль с entitlements
- [ ] Suspended user: refresh → 403 `user_suspended`
- [ ] Expired refresh: → 401 `token_expired`

---

### Milestone 1.3: Authorization (Неделя 3, вторая половина)

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 1.3.1 | RBAC middleware: role extraction из JWT claims → роль доступна в request context | [07-security](07-security.md#31-rbac--entitlements-model), [07-security](07-security.md#32-enforcement-points) | 1h | Role middleware |
| 1.3.2 | Permission matrix: реализация в коде (role → permissions map) | [07-security](07-security.md#31-rbac--entitlements-model), [05-api-contracts](05-api-contracts.md#27-post-authcheck-access) | 2h | Permission engine |
| 1.3.3 | `EntitlementService.checkAccess()`: resolve by userId → check role + entitlements + quotas | [05-api-contracts](05-api-contracts.md#27-post-authcheck-access) | 2h | Check logic |
| 1.3.4 | `UserController.checkAccess()` → `POST /auth/check-access` → 200 + results array | [05-api-contracts](05-api-contracts.md#27-post-authcheck-access) | 1.5h | Controller |
| 1.3.5 | Default entitlements при регистрации: free_user (5 AI credits/mo, 10 docs, watermark PDF) | [06-auth-flows](06-auth-flows.md#5-first-login-user-provisioning) | 1h | Defaults |
| 1.3.6 | `requireRole(minRole)` middleware guard для protected endpoints | [07-security](07-security.md#16-elevation-of-privilege-повышение-привилегий) T-E3 | 1h | Role guard |
| 1.3.7 | Unit-тесты: permission matrix (all roles × all resources), quota enforcement, admin access | — | 2.5h | Tests green |

**Итого:** ~11h

#### Milestone 1.3 — Критерии приёмки

- [ ] `POST /auth/check-access` с `free_user`: AI → allowed (remaining: 5), PDF → watermark_only, SVG → denied
- [ ] `POST /auth/check-access` с `pro_user`: AI → allowed (remaining: 50), PDF → allowed, SVG → allowed
- [ ] `admin` role → все ресурсы разрешены
- [ ] JWT claims `role` и `ent` корректно отражают текущее состояние пользователя
- [ ] Middleware `requireRole('admin')` блокирует non-admin вызовы → 403

---

## Phase 2: Integration (Неделя 4)

**Цель:** Потребители подключены, entitlement sync работает, GDPR compliance.

### 2.1 Editor SPA Integration

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 2.1.1 | Auth guard: при загрузке Editor проверить наличие access_token cookie → если нет, redirect на `/auth/login?redirect_uri=/editor` | [06-auth-flows](06-auth-flows.md#2-token-refresh-flow) | 2h | Auth guard |
| 2.1.2 | Auth interceptor: при 401 от Backend API → `POST /auth/refresh` → retry; при провале refresh → redirect to login | [06-auth-flows](06-auth-flows.md#2-token-refresh-flow) (Frontend Interceptor) | 3h | Auto-refresh |
| 2.1.3 | Login/Logout UI: кнопка "Sign in with Google" → `GET /auth/login`; кнопка "Sign out" → `POST /auth/logout` + redirect to `/` | — | 2h | UI buttons |
| 2.1.4 | User context provider: `GET /auth/me` при загрузке → display name, role, avatar в UI | — | 1.5h | User context |

**Итого:** ~8.5h

### 2.2 Landing SSR Integration

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 2.2.1 | Next.js middleware: server-side JWT verification через JWKS (jose `createRemoteJWKSet`) | [07-security](07-security.md#33-jwt-verification-algorithm-for-consumers) | 2h | SSR auth |
| 2.2.2 | Protected pages middleware: проверка auth на server-side → redirect to login если нет JWT | — | 1.5h | Protected routes |
| 2.2.3 | User context в SSR: передача role/entitlements через server components | — | 1.5h | Server context |

**Итого:** ~5h

### 2.3 Entitlement Sync

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 2.3.1 | SQS consumer Lambda (event source mapping): parse `entitlement.granted` / `entitlement.revoked` events | [06-auth-flows](06-auth-flows.md#6-entitlement-sync-from-billing-service) | 3h | Event consumer |
| 2.3.2 | Idempotency: проверка по eventId в AuditLog перед обработкой | [06-auth-flows](06-auth-flows.md#6-entitlement-sync-from-billing-service) | 1h | Idempotent |
| 2.3.3 | `EntitlementService.grantEntitlement()`: upsert entitlement + update user role (free→pro→business) | [06-auth-flows](06-auth-flows.md#6-entitlement-sync-from-billing-service) | 2h | Grant logic |
| 2.3.4 | `EntitlementService.revokeEntitlement()`: mark revoked + downgrade role if needed | [06-auth-flows](06-auth-flows.md#6-entitlement-sync-from-billing-service) | 1.5h | Revoke logic |
| 2.3.5 | Unit-тесты: event processing, idempotency, role upgrade/downgrade | — | 2h | Tests green |

**Итого:** ~9.5h

### 2.4 GDPR Account Deletion

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 2.4.1 | `UserService.deleteAccount()`: soft-delete user (status=deleted) → revoke all refresh tokens → soft-delete entitlements → audit log (ACCOUNT_DELETED) | [06-auth-flows](06-auth-flows.md#7-account-deletion-flow-gdpr), [04-data-model](04-data-model.md#5-gdpr-data-deletion) | 3h | Deletion logic |
| 2.4.2 | `UserController.deleteMe()` → `DELETE /auth/me` → require confirmation → 202 Accepted → clear cookies | [05-api-contracts](05-api-contracts.md#26-delete-authme) | 1.5h | Controller |
| 2.4.3 | Emit `user.deleted` event → SQS/SNS → Billing Service (cancel subscriptions) | [06-auth-flows](06-auth-flows.md#7-account-deletion-flow-gdpr) | 1h | Event emission |
| 2.4.4 | Hard delete scheduler: EventBridge rule → Lambda → purge after 30 days | [06-auth-flows](06-auth-flows.md#7-account-deletion-flow-gdpr) | 2h | Scheduled cleanup |
| 2.4.5 | Unit-тесты: deletion cascade, event emission, blocked user login attempt | — | 1.5h | Tests green |

**Итого:** ~9h

### 2.5 Audit Logging Completion

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 2.5.1 | Audit logging во всех security-критичных flow-ах: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH, TOKEN_REFRESH_FAILED, ROLE_CHANGED, ENTITLEMENT_GRANTED, ENTITLEMENT_REVOKED, ACCOUNT_DELETED, SUSPICIOUS_ACTIVITY | [04-data-model](04-data-model.md#34-auditlog), [09-observability](09-observability.md) | 2h | Полное покрытие |
| 2.5.2 | Audit log query helper для admin debug (by userId + time range) | [04-data-model](04-data-model.md#34-auditlog) | 1h | Query helper |

**Итого:** ~3h

### Phase 2 — Критерии приёмки

- [ ] Editor SPA: неаутентифицированный запрос → redirect на login → Google OAuth → JWT cookie → /editor загружается с user context
- [ ] Editor SPA: access token expires → interceptor auto-refreshes → retry succeeds (прозрачно для пользователя)
- [ ] Landing SSR: server-side rendering с user context (role, name)
- [ ] Entitlement sync: `entitlement.granted` event от Billing → entitlement в DynamoDB → следующий refresh JWT содержит новый entitlement
- [ ] Account deletion: `DELETE /auth/me` → soft delete → all sessions terminated → `user.deleted` event emitted
- [ ] Все AuditLog actions из enum записываются корректно

---

## Phase 3: Hardening (Неделя 5)

**Цель:** Production readiness — security, observability, performance validation.

### 3.1 Input Validation & Rate Limiting

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 3.1.1 | Runtime-валидация всех входящих payloads (Zod schemas): login params, callback params, check-access body, delete confirmation | [02-requirements](02-requirements.md) NFR-3.8, [07-security](07-security.md#12-tampering-модификация-данных) T-T4 | 3h | Validated inputs |
| 3.1.2 | API Gateway throttling: burst=100, rate=50 на stage level | [08-deployment](08-deployment.md#21-ресурсы) | 0.5h | Gateway limits |
| 3.1.3 | Per-endpoint rate limits (Lambda-level): login 10/min per IP, refresh 30/min per IP, me 100/min per user | [05-api-contracts](05-api-contracts.md#6-rate-limiting), [07-security](07-security.md#15-denial-of-service-отказ-в-обслуживании) | 3h | Granular limits |
| 3.1.4 | Rate limit middleware: in-memory (per Lambda instance) + DynamoDB atomic counter fallback | — | 2h | Rate limiter |

**Итого:** ~8.5h

### 3.2 Observability

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 3.2.1 | CloudWatch custom metrics: business metrics (login.success, login.failure, refresh.success, refresh.failure, logout, deletion, entitlement.*) | [09-observability](09-observability.md#21-business-metrics-cloudwatch-custom-metrics) | 3h | Custom metrics |
| 3.2.2 | Request correlation: `X-Request-Id` propagation через все log entries | [09-observability](09-observability.md#6-tracing-correlation) | 1h | Correlation |
| 3.2.3 | CloudWatch Dashboard: Overview (active users, logins, error rate, P95 latency, DynamoDB capacity, cold starts) | [09-observability](09-observability.md#41-auth-service-overview-dashboard) | 2h | Dashboard |
| 3.2.4 | Security Dashboard: failed logins, revoked tokens, suspicious activity, rate limit hits | [09-observability](09-observability.md#42-security-dashboard) | 1.5h | Security dashboard |
| 3.2.5 | CloudWatch Logs Insights: saved queries (login activity, errors, cold starts, suspicious activity) | [09-observability](09-observability.md#5-cloudwatch-logs-insights-queries) | 1h | Saved queries |

**Итого:** ~8.5h

### 3.3 Alerts

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 3.3.1 | Critical alarms: Auth Service Down (5XX > 10%), Login Flow Broken, DynamoDB Throttling, Signing Key Error → PagerDuty/Slack + SMS | [09-observability](09-observability.md#31-critical-pagerdutyslack--sms) | 2h | Critical alerts |
| 3.3.2 | Warning alarms: High Error Rate, Elevated Latency, Refresh Failure Spike, Cold Start Rate, Unusual Login Pattern → Slack | [09-observability](09-observability.md#32-warning-slack-only) | 1.5h | Warning alerts |
| 3.3.3 | Informational: Daily Active Users, New Registrations, Cost Anomaly → Slack | [09-observability](09-observability.md#33-informational-slack) | 1h | Info alerts |

**Итого:** ~4.5h

### 3.4 Security Hardening

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 3.4.1 | STRIDE checklist verification: пройти все T-* entries из модели угроз, verify status = ✅ Covered на деле | [07-security](07-security.md#1-модель-угроз-stride) | 3h | Verified |
| 3.4.2 | Log sanitization audit: убедиться что ни в одном месте не логируются raw tokens, JWT, auth codes | [09-observability](09-observability.md#1-structured-logging), [07-security](07-security.md#52-log-sanitization) | 1h | Sanitized |
| 3.4.3 | CORS validation: тест с disallowed origin → reject; тест с allowed origins | [05-api-contracts](05-api-contracts.md#5-cors-configuration) | 0.5h | CORS OK |
| 3.4.4 | Cookie security audit: все cookies HttpOnly + Secure + SameSite=Lax; refresh_token ограничен Path=/auth | [05-api-contracts](05-api-contracts.md#4-cookie-strategy) | 0.5h | Cookies OK |
| 3.4.5 | OWASP Top 10 basic checks (по чек-листу из security doc) | [07-security](07-security.md#62-owasp-top-10-coverage) | 2h | OWASP OK |

**Итого:** ~7h

### 3.5 Load Testing

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 3.5.1 | Load test скрипт (k6 or Artillery): 100 concurrent logins, 500 concurrent refreshes | [10-risks](10-risks-and-roadmap.md#6-success-metrics-v1) | 3h | Test script |
| 3.5.2 | Прогон load test на staging, сбор метрик: P50/P95/P99 latency, error rate, cold starts | [09-observability](09-observability.md#23-latency-percentiles) | 2h | Results |
| 3.5.3 | Анализ результатов vs SLO targets (login P95 < 2s, refresh P95 < 200ms, error rate < 1%) | [02-requirements](02-requirements.md) NFR-1, [10-risks](10-risks-and-roadmap.md#6-success-metrics-v1) | 1h | Report |

**Итого:** ~6h

### 3.6 Documentation

| # | Задача | Ref | Оценка | Выход |
|---|--------|-----|--------|-------|
| 3.6.1 | API documentation final review: все endpoints корректно задокументированы, примеры актуальны | [05-api-contracts](05-api-contracts.md) | 1.5h | API docs |
| 3.6.2 | Runbook: incident response (key compromise, provider outage, token breach) | [07-security](07-security.md#53-incident-response) | 2h | Runbook |
| 3.6.3 | README: setup guide, environment variables, local dev quickstart | — | 1h | README |

**Итого:** ~4.5h

### Phase 3 — Критерии приёмки

- [ ] Rate limiting: 10+ req/min на `/auth/login` с одного IP → 429
- [ ] Dashboard: метрики отображаются в CloudWatch в реальном времени
- [ ] Critical алерты настроены и протестированы (simulate 5XX → alert fires)
- [ ] STRIDE checklist: все 17 угроз → verified mitigation на деле
- [ ] OWASP Top 10 basic checks: pass
- [ ] Log sanitization: grep по логам → 0 raw tokens
- [ ] Load test: login P95 < 2s, refresh P95 < 200ms, error rate < 1% при 100 concurrent users
- [ ] Zod validation: malformed payloads → 400 с информативным error

---

## Сводная таблица трудозатрат

| Phase | Часы | Дни (8h) | Недели |
|-------|------|----------|--------|
| **0: Foundation** | ~32h | 4д | 1 нед |
| **1.1: OAuth + Users** | ~39.5h | 5д | 1 нед |
| **1.2: Token Management** | ~16.5h | 2д | 0.5 нед |
| **1.3: Authorization** | ~11h | 1.4д | 0.5 нед |
| **2: Integration** | ~35h | 4.4д | 1 нед |
| **3: Hardening** | ~39h | 4.9д | 1 нед |
| **ИТОГО** | **~173h** | **~22д** | **~5 нед** |

---

## Зависимости между задачами

```
Phase 0 (Foundation)
├── 0.1 Terraform ──┐
├── 0.2 Scaffold ───┼──► Phase 1.1 (OAuth + Users)
├── 0.3 Docker ─────┘           │
└── 0.4 CI/CD                   │
                                ▼
                    Phase 1.1 (OAuth + Users)
                    ├── 1.1.1 Provider abstraction
                    ├── 1.1.2 Repositories ──────────┐
                    ├── 1.1.3 OAuth login flow ◄──── 1.1.1 + 1.1.2
                    └── 1.1.4 JWT generation ◄────── 0.2.8 (crypto utils)
                                │
                                ▼
                    Phase 1.2 (Token Management) ◄── 1.1.4
                    Phase 1.3 (Authorization) ◄───── 1.1.2 + 1.1.4
                                │
                                ▼
                    Phase 2 (Integration)
                    ├── 2.1 Editor SPA ◄──────────── 1.2 (refresh, JWKS)
                    ├── 2.2 Landing SSR ◄─────────── 1.2 (JWKS)
                    ├── 2.3 Entitlement sync ◄────── 1.1.2 (repos) + 0.1.6 (SQS)
                    ├── 2.4 GDPR deletion ◄───────── 1.1.2 + 1.2
                    └── 2.5 Audit logging ◄───────── 1.1.2d (AuditLogRepo)
                                │
                                ▼
                    Phase 3 (Hardening)  — всё после Phase 2
```

---

## Риски плана

| Риск | Вероятность | Влияние | Митигация |
|------|------------|---------|-----------|
| Cognito User Pool / App Client setup затянется | Средняя | +1 нед | Mock provider (`MockAuthProvider`) для Phase 1 dev; параллельная работа DevOps |
| Cookie cross-domain issues (SPA ↔ API на разных доменах) | Средняя | +2-3 дня | Тестировать в staging с реальными доменами в Phase 1.1; SameSite fallback |
| Entitlement sync: Billing Service не готов | Низкая | Минимальное | Mock SQS events; Phase 2.3 не блокирует остальное |
| Load test выявит проблему с cold start | Низкая | +2 дня | Provisioned Concurrency как fallback; Node.js cold start обычно в пределах 300ms |
| Интеграция с Landing SSR (Next.js middleware) сложнее ожидаемого | Средняя | +1-2 дня | Проработать POC в Phase 0 параллельно |

---

## Definition of Done (v1 Production Release)

- [ ] Все Phase 0–3 выполнены и критерии приёмки пройдены
- [ ] Unit test coverage ≥ 80%
- [ ] Все P0 (v1) функциональные требования из [02-requirements](02-requirements.md) реализованы
- [ ] NFR targets из [02-requirements](02-requirements.md) подтверждены load test-ом
- [ ] Security: STRIDE verified, OWASP basic pass, log sanitization OK
- [ ] Observability: dashboard + critical alerts active
- [ ] CI/CD: push to main → auto-deploy to prod
- [ ] Documentation: API docs, runbook, README — актуальны
- [ ] Все открытые вопросы решены (OQ-1 ✅ Cognito, OQ-3 ✅ shared API Gateway, OQ-6 ✅ wildcard domain)

---

## Что НЕ входит в v1

Для ясности — явный out-of-scope (откладывается на v2+):

| Функциональность | Phase | Ref |
|-----------------|-------|-----|
| Apple Sign-In | v2 (Phase 4–5) | FR-1.5 |
| Firebase adapter implementation | v2 (Phase 4) | FR-5.3 |
| Token rotation (on each refresh) | v2 (Phase 4) | OQ-2 |
| Logout-all (все сессии) | v2 (Phase 5) | FR-2.4 |
| Data export (`GET /auth/me/export`) | v2 | FR-3.4 |
| Account Linking Policy | v2 | FR-1.7 |
| Admin UI | v2–v3 (Phase 5) | [10-risks](10-risks-and-roadmap.md) |
| MFA | v3 | [10-risks](10-risks-and-roadmap.md) |
| SAML/OIDC SSO | v3 | FR-1.6 |
| API keys (M2M auth) | v3 | [10-risks](10-risks-and-roadmap.md) |
| VPC for Lambda | v2 | [07-security](07-security.md#43-network-security) |
