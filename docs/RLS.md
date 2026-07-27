# PostgreSQL Row Level Security (2dcite)

## What it does

Every tenant table has **FORCE ROW LEVEL SECURITY** and **explicit policies per command** (SELECT / INSERT / UPDATE / DELETE) based on the **authenticated user**.

### Enforcement model

Neon’s default role (`neondb_owner`) has **`BYPASSRLS`**, so policies never run until each transaction does:

```sql
SET LOCAL ROLE twodcite_app;  -- NOLOGIN, NOBYPASSRLS
SELECT set_config('app.user_id',   '<userId>', true);
SELECT set_config('app.user_role', '<role>',   true);
SELECT set_config('app.rls_bypass','on|off',   true);
```

The app does this automatically via `applyRlsConfig()` on every Prisma query transaction.

### Who can do what

| Actor | Access |
|-------|--------|
| **Unauthenticated / deny** (`__none__`) | No rows |
| **ATTORNEY / JUDGE** | Own jobs (`clientId`), own profile/membership/sessions; payments on own jobs |
| **STUDENT** | Assigned jobs (`studentId`); own student profile; insert/update reviews on assigned jobs |
| **ADMIN** | All rows (authenticated admin) |
| **System bypass** | Matching, Stripe webhooks, login/register lookup, cert issuance (after app-layer auth) |

### Command matrix (summary)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| User | self, admin | self*, admin, system | self, admin | admin, system |
| Session | self, admin | self, system | self, system | self, admin, system |
| Job | client, student, admin | **client only** | client or student | admin, system |
| Review | job participants | **assigned student** | assigned student | admin, system |
| Certificate | job participants | **admin/system only** | admin/system | admin/system |
| Payment | job participants | client / system | client / system | admin/system |
| Payout | job participants / student | **admin/system only** | admin/system | admin/system |
| Profiles / Membership / DeviceToken | self | self (role-checked) | self | admin/system |
| AuditLog | own actor rows | own / system | admin/system | admin/system |

\* Registration creates users under system bypass.

## Apply / verify

```bash
export DATABASE_URL='postgresql://…'   # Neon URL
pnpm --filter @2dcite/db rls:apply     # create role + 52 policies
pnpm --filter @2dcite/db rls:verify    # smoke tests
```

SQL: `packages/db/prisma/sql/rls.sql`

## Application API

| Helper | Use |
|--------|-----|
| `enterUserRls(user, fn)` | Authenticated request work |
| `enterBypassRls(fn)` | Trusted system paths only |
| `applyRlsConfig(tx, ctx)` | First line inside manual `$transaction` |
| Default (prod) | No ALS → deny-all |

`prisma` export is RLS-aware (wraps each model op in a transaction + config).

### Strict mode

- Production: strict deny when no context  
- Dev: soft bypass if `RLS_STRICT` unset  
- Override: `RLS_STRICT=true|false`

## Ops

1. Re-run `rls:apply` after adding tables (extend SQL).  
2. Do **not** grant `BYPASSRLS` to `twodcite_app`.  
3. Prefer `enterUserRls` on every new authenticated route.
