# Point 2dcite.com (GoDaddy) at Vercel

Domain is registered with **GoDaddy** (`ns59.domaincontrol.com` / `ns60.domaincontrol.com`).
Vercel already has `2dcite.com` and `www.2dcite.com` attached to the project.
`www` is configured to **308 redirect → 2dcite.com**.

Right now DNS still points at **GoDaddy Website Builder** (not Vercel), so
https://2dcite.com shows the old parking/builder page.

## DNS records to set in GoDaddy

GoDaddy → **My Products** → **2dcite.com** → **DNS** → **Manage DNS**

### 1. Apex / root (`@`)

**Remove** existing A records that point to:
- `76.223.105.230`
- `13.248.243.5`
(and any other non-Vercel A/AAAA/CNAME on `@`)

**Add** A records (use **both** if GoDaddy allows multiple; otherwise use the single classic record):

| Type | Name | Value | TTL |
|------|------|--------|-----|
| **A** | `@` | `216.198.79.1` | 600 (or 1 hour) |
| **A** | `@` | `64.29.17.1` | 600 |

**Fallback** (if GoDaddy only allows one A record, use this classic Vercel IP):

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |

### 2. `www`

**Remove** CNAME `www` → `2dcite.com` (or any builder CNAME).

**Add**:

| Type | Name | Value | TTL |
|------|------|--------|-----|
| **CNAME** | `www` | `d33c0d431b3cc610.vercel-dns-017.com` | 600 |

(If that hostname fails verification later, use `cname.vercel-dns.com` instead.)

### 3. Do **not** change nameservers

Keep GoDaddy nameservers unless you intentionally move DNS to Vercel/Cloudflare.

### 4. Optional: disable GoDaddy Website Builder

If the builder keeps re-adding parking records, disconnect/disable the free website product for this domain.

## Verify

After DNS propagates (often 5–30 minutes; can take up to 48h):

```bash
# Should show Vercel IPs or vercel-dns CNAME chain
dig +short 2dcite.com A
dig +short www.2dcite.com CNAME

curl -sI https://2dcite.com | head -5
curl -s https://2dcite.com/api/v1/health
# expect storage: blob, db: ok
```

In Vercel Dashboard → Project → **Domains**, both domains should show **Valid Configuration**.

## After DNS works

Redeploy once so Stripe webhooks and absolute URLs use the custom domain:

```bash
cd ~/2dcite && vercel --prod --yes
```

Stripe webhook URL should be:

`https://2dcite.com/api/v1/webhooks/stripe`
