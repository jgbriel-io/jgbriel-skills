---
name: auth-patterns
description: Authentication and authorization patterns — OTP/password/OAuth/OIDC flows, session vs JWT, RBAC/ABAC, MFA, token refresh/revocation — provider-agnostic (Auth0, Cognito, Keycloak, Supabase Auth, custom). Use when user asks about login flows, access tokens, permissions, roles, or "who can do what".
---

# Auth Patterns

Authentication (who the user is) and authorization (what they may do) are separate
layers, and conflating them is where most access bugs come from. The concepts hold
for any provider or stack; the code examples are at the end.

## Authentication: choosing a flow

| Flow | When | Main hazard |
|---|---|---|
| Password + hash | The default, full control | Never store it in plain text; use bcrypt or argon2 |
| Magic link / OTP | Less friction, no password to leak | Short expiry (5-15 min), single use, rate limited |
| OAuth (social login) | Delegates identity to a third party | Validate `state` (CSRF) and an exact `redirect_uri` |
| OIDC | OAuth plus a standard identity (`id_token` JWT) | Validate `iss`, `aud`, `exp` and the signature — never decode without verifying |
| MFA (TOTP/SMS/WebAuthn) | Sensitive accounts, admins | WebAuthn > TOTP > SMS; SMS is vulnerable to SIM swap |

```
// ❌ Comparing plain text, or a weak unsalted hash (MD5/SHA1)
if (user.password === input) { ... }

// ✅ A hash with a configurable cost, compared in constant time
const ok = await argon2.verify(user.passwordHash, input);
```

## Session vs. JWT

| | Session (server-side) | JWT (stateless) |
|---|---|---|
| Revocation | Immediate — delete it from the store | Hard: needs a blocklist or a short TTL |
| Scaling | Needs a shared store (Redis) | No server state |
| Size per request | Just the id, in a cookie | The whole payload, every request |
| Typical use | Monolithic apps, web sessions | APIs, mobile, microservices |

Rules that apply to both:

- Session and refresh cookies: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict` —
  never reachable from JavaScript
- A short-lived access token (5-15 min) plus a long-lived refresh token, rotated on
  every use
- Refresh-token reuse detected means revoking the whole token family: it is the
  signal of a stolen token
- JWTs: always validate the signature, `exp`, `iss` and `aud` server-side. Never
  trust a decoded payload whose signature was not checked

```
// ❌ Trusting a JWT because it decoded
const payload = jwt.decode(token); // does not verify the signature
if (payload.role === 'admin') { ... }

// ✅ Verify signature and claims before reading any field
const payload = jwt.verify(token, publicKey, { issuer, audience });
```

## Authorization: RBAC vs. ABAC

- **RBAC** (role-based): the user holds a role — `admin`, `editor`, `viewer` — and
  the role carries fixed permissions. Simple, and right for most cases.
- **ABAC** (attribute-based): the decision depends on attributes of the user, the
  resource or the context (`owner_id == resource.owner_id`, `dept == resource.dept`,
  time of day, IP). Necessary once RBAC turns into an explosion of roles
  (`admin-sp`, `admin-rj`, `editor-own-team`…).
- Multi-tenant: RBAC and ABAC are always scoped by tenant. An "admin" role is never
  global; it is admin *of tenant X*.

```
// ❌ Checking the role and ignoring who owns the resource
if (user.role === 'editor') return updateDoc(docId, data);

// ✅ Role AND relationship to the resource (ABAC on top of RBAC)
if (user.role === 'editor' && doc.ownerId === user.id) {
  return updateDoc(docId, data);
}
```

Authorization is decided on the server, always. A hidden button is UX, not access
control.

## Where the check lives

- Never only in the client: hiding a button or a route does not stop a direct API
  call
- Never only in route middleware: a deep link or a call to a different endpoint
  walks around it
- The right layer is the boundary that performs the action — the service or use
  case — or the database policy (RLS). Ideally both, with the database as the last
  line of defence
- Every sensitive action (delete, role change, data export) re-authenticates or
  demands an extra confirmation

## MFA and account recovery

- MFA optional for ordinary users, mandatory for admins and privileged roles
- "Forgot password" holds the same bar as login: single-use token, short expiry,
  and old sessions invalidated when the password changes
- Never reveal whether an email or username exists: "credenciais inválidas", not
  "email não encontrado"

## Checklist

- [ ] Passwords never stored in plain text (argon2 or bcrypt, never MD5/SHA1)
- [ ] Short-lived access token; refresh token rotated and revocable
- [ ] Session and refresh cookies with `HttpOnly`, `Secure` and `SameSite`
- [ ] JWTs validated (signature, `exp`, `iss`, `aud`) before any claim is read
- [ ] Authorization checked on the server, not merely hidden in the UI
- [ ] Multi-tenant: every role and permission scoped by tenant, never implicitly global
- [ ] Rate limiting on login, OTP and password reset
- [ ] Auth errors do not reveal whether the user or email exists
- [ ] MFA available for sensitive accounts, mandatory for admins
- [ ] Logout invalidates the session and refresh token server-side, not just the client

## By stack

**Postgres + RLS (authorization in the database, Supabase or custom):**
```sql
-- RBAC checked in the policy; the app sets the context per transaction:
-- SET LOCAL app.current_user_id = '<uuid>';
CREATE POLICY "editor_own_docs" ON documents
  FOR UPDATE TO app_user
  USING (
    owner_id = current_setting('app.current_user_id')::uuid
    AND (SELECT role FROM profiles WHERE id = current_setting('app.current_user_id')::uuid) = 'editor'
  );
```

**NestJS + Passport (JWT plus a guard):**
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Patch(':id')
update(@Param('id') id: string, @CurrentUser() user: User) {
  if (user.role !== 'admin' && user.id !== resourceOwnerId(id)) {
    throw new ForbiddenException();
  }
  // ...
}
```

**Keycloak/Auth0 (OIDC, token validation in a Python/Flask API):**
```python
# Never decode without verifying — always validate against the provider's JWKS
payload = jwt.decode(
    token, key=jwks_client.get_signing_key_from_jwt(token).key,
    algorithms=["RS256"], audience=API_AUDIENCE, issuer=ISSUER,
)
if "admin" not in payload.get("realm_access", {}).get("roles", []):
    raise Forbidden()
```

## Anti-patterns

- ❌ Authorization decided in the frontend alone, by hiding a button
- ❌ A JWT decoded without verifying its signature
- ❌ A long-lived access token with no refresh or revocation
- ❌ A global "admin" role in a multi-tenant system
- ❌ A password or token in a log, in plain text in the database, or in a query string
- ❌ An error message that reveals whether an email or user exists
- ❌ A reusable refresh token, with no rotation and no reuse detection
- ❌ SMS MFA as the only option for privileged accounts
- ❌ A session or refresh token left valid server-side after logout or a password change
