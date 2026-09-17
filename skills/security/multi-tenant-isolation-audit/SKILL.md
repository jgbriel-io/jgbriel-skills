---
name: multi-tenant-isolation-audit
description: Audits multi-tenant systems for cross-tenant data leakage — missing isolation filters, privileged-role bypass (service_role/admin), untested boundaries. Mechanism-agnostic (RLS, ORM tenant_id, schema-per-tenant). Use when user asks about tenant isolation, multi-tenancy security, data leakage between clients/orgs, or auditing access control across accounts.
---

# Multi-Tenant Isolation Audit

Auditing isolation between tenants — clients, organisations, accounts — in a
multi-tenant system. This skill does not teach how to implement the isolation
mechanism; that belongs to the database and framework skills
(`supabase-postgres`/`postgres-conventions` for RLS). The job here is to audit:
does isolation exist, is it correct, and where does it leak?

## What isolation means

Every resource — a row, a file, a message, a job — belongs to exactly one tenant.
Every read and write is restricted to the authenticated user's tenant, never to
the tenant the client claims to be.

```
// ❌ the tenant comes from the payload
GET /invoices?companyId=123

// ✅ the tenant comes from the session or token, never from input
GET /invoices  →  companyId = session.tenantId
```

## Isolation mechanisms (any of these is valid)

| Mechanism | Where the guarantee lives | Typical risk |
|---|---|---|
| RLS / row security in the database | The database | Bypass through a privileged role: service_role, superuser |
| A `tenant_id` filter in every query (ORM/repository) | The application layer | One developer forgets the filter on a new query |
| Schema per tenant | Connection and `search_path` | A migration or job runs against the wrong schema |
| Database per tenant | Connection string | A connection pool accidentally shared across tenants |

No mechanism is safe by default; each depends on discipline somewhere. The audit
is about finding that somewhere.

## Where isolation leaks

- **Direct queries**: a new endpoint that forgot the filter or the policy
- **Joins and aggregations**: joining a tenant-scoped table to one without a
  tenant, or a view or report that sums across every tenant
- **Privileged-role bypass**: an admin, service-role or superuser connection that
  skips RLS or runs with filtering disabled — used in jobs, seeds, migrations and
  internal scripts
- **Background jobs, queues, cron**: batches processed with no tenant context, or
  inheriting the context of the last request handled
- **Cache and search index**: a cache or search key without the tenant id, so one
  tenant's result surfaces for another
- **File storage**: a predictable path (`/uploads/{fileId}`) with no ownership
  check, allowing cross-tenant access by enumerating ids
- **Webhooks and integrations**: a callback payload persisted without validating
  which tenant it belongs to
- **Exports and reports**: an export that runs with elevated privilege "for
  performance" and skips the standard filter
- **Logs and error messages**: an error that leaks another tenant's data — "email
  already registered" reveals that a record exists
- **Impersonation and support mode**: "log in as client X" with no audit trail and
  no scope revoked on exit

## Testing isolation

Every multi-tenant resource needs an automated test that attempts cross-tenant
access and expects failure — not only the happy path.

```
The isolation test, in any stack:
1. create tenant A and tenant B
2. create resource R as tenant A
3. authenticate as tenant B
4. attempt to read, update and delete R
5. assert: 403/404/empty — never 200 carrying A's data
```

Running that matrix against every new endpoint or table is the cheapest regression
test there is against leaking between clients. See `integration-testing` for how
to keep it as a versioned suite.

## Checklist

- [ ] Every new table or collection has an isolation mechanism applied — RLS enabled, a repository-level `tenant_id` filter, or the right schema — not only the "sensitive" ones
- [ ] The tenant, company or org id comes from the authenticated session token, never from a query parameter, body or client-controlled header
- [ ] Every privileged connection or role (service_role, superuser, admin API key) has a mapped, justified use; where it skips isolation, the calling code carries an equivalent control
- [ ] Async jobs, queues and cron carry the tenant id explicitly in the message payload — never inferred from a global or thread-local that can leak between runs
- [ ] Cross-table joins, aggregations and reports do not mix tenants
- [ ] Cache keys and search indexes include the tenant id
- [ ] Storage paths are not guessable by sequential id without an ownership check
- [ ] Webhooks validate which tenant an event belongs to before persisting it
- [ ] Error messages do not reveal the existence or detail of another tenant's data
- [ ] An automated isolation test exists for each critical endpoint and table
- [ ] Impersonation or support mode, where it exists, is audited and its scope revoked on exit
- [ ] Migrations and seeds respect the same isolation mechanism, with no bypass "because it is a script"

## Anti-patterns

- ❌ Trusting a client-side filter (`.eq('tenant_id', ...)` assembled in the frontend) as the only guarantee — without a server-side policy it is cosmetic
- ❌ Using a privileged connection on the common path "because it is simpler", instead of reserving it for exceptional, audited cases
- ❌ Accepting `tenant_id` as a client parameter rather than deriving it from the session
- ❌ A job or worker that inherits its tenant from a global reused across runs
- ❌ No isolation test at all — only a happy path per tenant
- ❌ A "temporary" or "internal" new table with no isolation, because "it is not client data yet"
- ❌ An export or report with its own query that ignores the filter the rest of the system uses
- ❌ An error message that distinguishes "does not exist" from "exists but is not yours", leaking existence across tenants

## By stack

**Supabase/Postgres with RLS:**
```sql
-- Isolation tested in the database, as the application role rather than superuser
set role app_user;
set app.current_user_id = '<user-id-tenant-b>';
select * from invoices where id = '<invoice-id-tenant-a>';
-- Expected: 0 rows, because RLS blocked it. Never tenant A's row.
```

**NestJS/TypeORM (explicit `tenant_id` in every repository):**
```ts
// ❌ the tenant id arrives from the controller's caller
findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }); }

// ✅ always taken from the authenticated request, never from a caller parameter
@Injectable()
export class InvoicesService {
  findAll(@CurrentTenant() tenantId: string) {
    return this.repo.find({ where: { tenantId } });
  }
}
```

**Django (one central filter in the manager, not per view):**
```python
# Middleware sets the current tenant; the manager applies the filter by default
class TenantManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(tenant_id=get_current_tenant())
# Every multi-tenant model uses this manager, so the filter does not depend on
# each view remembering to apply it.
```
