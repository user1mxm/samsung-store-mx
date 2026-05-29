# Deploy: GitHub push + Vercel

This build integrates the v3 auth layer into the live source. The app **builds
green** (`npm run build` ✓). Below are the exact steps to push and deploy.

## What changed in this commit

```
src/components/auth/SocialAuthButtons.tsx   (NEW) Google/Facebook/X → /api/auth/{p}?role=
src/components/auth/PasswordStrength.tsx     (NEW) strength meter (pure)
src/components/auth/ForgotPasswordModal.tsx  (NEW) uses localAuth.forgotPassword
src/pages/AgentLogin.tsx                     (NEW) /login/agent — real localAuth.login
src/pages/AdminLoginEnhanced.tsx             (NEW) /login/admin — login({isAdmin:true})
src/pages/AgentDashboardEnhanced.tsx         (NEW) /agent — real referral/commission/agent/order
src/App.tsx                                  (EDIT) wires the new routes
vercel.json                                  (NEW) Vercel build + rewrites
api/vercel.ts                                (NEW) hono/vercel serverless adapter
```

All new auth flows call **procedures that already exist** in your backend
(`localAuth.login`, `localAuth.forgotPassword`, `referral.*`, `order.list`,
`agent.getMyStats`). No backend changes are required for these to work.

> The `/admin` route still uses your original `AdminDashboard`. The "enhanced"
> admin dashboard from the v3 package needs procedures that don't exist yet
> (`withdrawal.adminApprove`, `payment.adminConfirmSpei`, `product.lowStock`,
> `order.adminListAll`). Add those to the backend first, then swap the route.

## 1 — Push to GitHub (run on your machine)

I can't push from here (no write credentials, and you should never paste a
token into a chat). From your local clone of the repo:

```bash
# unzip the delivered archive over your working copy, OR apply the patch (below)
git checkout -b v3-auth-upgrade
git add -A
git commit -m "v3: real agent/admin login, social auth, forgot-password, agent dashboard, Vercel config"
git push origin v3-auth-upgrade
# then open a PR into the samsung-store-mx branch, or push directly:
# git push origin v3-auth-upgrade:samsung-store-mx
```

## 2 — Deploy to Vercel

Vercel deploys from GitHub automatically once connected:

1. vercel.com → **Add New → Project** → import `user1mxm/samsung-store-mx`
2. Framework preset: **Other** (vercel.json already configures it)
3. Build command: `vite build` · Output dir: `dist/public` (from vercel.json)
4. Add **Environment Variables** (from `.env.example`): `DATABASE_URL`,
   `APP_SECRET`, `APP_ID`, SMTP_*, GOOGLE/FACEBOOK/TWITTER OAuth, etc.
5. Deploy. Vercel rebuilds on every push to the connected branch.

### ⚠️ Important caveat about this stack on Vercel

This is a **Hono + MySQL** app originally built for a Node host (HostGator),
not a serverless platform. On Vercel:

- `api/vercel.ts` wraps the Hono app as a serverless function (works), but
- **MySQL on HostGator shared hosting** often refuses connections from Vercel's
  rotating serverless IPs, and opening a fresh DB connection per invocation is
  slow and can exhaust the connection limit.

For a reliable Vercel deployment, use a serverless-friendly database:
- **PlanetScale** (MySQL-compatible, HTTP driver) — best fit, minimal code change
- or keep MySQL but front it with a connection pooler and allowlist Vercel egress

If you want to stay on HostGator's MySQL, **HostGator (Node) is the better host**
for this app as-is — `npm run build` then `npm start` runs the bundled
`dist/boot.js` server directly. Vercel is ideal once the DB is serverless-ready.

## 3 — After deploy

- Set OAuth redirect URIs in Google/Facebook/X consoles to your Vercel domain:
  `https://<your-app>.vercel.app/api/oauth/<provider>/callback`
- Seed an agent + admin user (see repo `db/seed.ts`)
- Smoke test: `/login/agent`, `/login/admin`, `/agent`
