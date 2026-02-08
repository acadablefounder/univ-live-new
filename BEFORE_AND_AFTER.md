# Before & After: The One Change Needed

## The Single Fix

Your application needs ONE change to be complete. Here's the exact before/after:

---

## File: [src/pages/Login.tsx](src/pages/Login.tsx)

### Current Code (Lines 113-115)

```typescript
      toast.success("Logged in!");
      nav("/educator");
    } catch (error: any) {
```

### Fixed Code (Lines 113-131)

```typescript
      // ✅ NEW: Validate and redirect educator to their subdomain
      const tenantSlug = data?.tenantSlug;
      if (!tenantSlug) {
        toast.error("Educator account misconfigured (missing tenant slug).");
        await auth.signOut();
        return;
      }

      toast.success("Logged in!");

      // ✅ NEW: Redirect to subdomain
      if (window.location.hostname === "localhost") {
        // Local development: use query parameter
        nav(`/educator?tenant=${tenantSlug}`);
      } else {
        // Production: redirect to subdomain
        const protocol = window.location.protocol;
        const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";
        const educatorUrl = `${protocol}//${tenantSlug}.${appDomain}/educator`;
        window.location.href = educatorUrl;
      }
    } catch (error: any) {
```

---

## Supporting Changes

### File: `.env` (Create New)

```env
VITE_APP_DOMAIN=univ.live
VITE_APP_MAIN_HOST=www.univ.live
```

### File: `.env.production` (Create New)

```env
VITE_APP_DOMAIN=example.com
VITE_APP_MAIN_HOST=www.example.com
```

### File: [src/lib/tenant.ts](src/lib/tenant.ts)

#### Current Code:
```typescript
export function getTenantSlugFromHostname(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase();

  if (hostname === "localhost") {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  const parts = hostname.split(".");

  if (
    parts.length === 3 &&
    parts[1] === "univ" &&
    parts[2] === "live"
  ) {
    const subdomain = parts[0];
    if (subdomain === "www") return null;
    return subdomain;
  }

  return null;
}
```

#### Fixed Code:
```typescript
export function getTenantSlugFromHostname(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase();
  
  // ✅ NEW: Get domain from environment
  const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";

  if (hostname === "localhost") {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  const parts = hostname.split(".");
  const domainParts = appDomain.split(".");

  // ✅ NEW: Check if hostname ends with our domain
  const hostSuffix = parts.slice(-domainParts.length).join(".");
  
  if (hostSuffix !== appDomain) {
    return null;
  }

  // ✅ NEW: If same length, it's the main domain
  if (parts.length === domainParts.length) {
    return null;
  }

  const subdomain = parts[0];

  if (subdomain === "www") return null;

  return subdomain;
}
```

---

## What Changes & Why

### What Changes:
1. **After educator login**, extract their `tenantSlug` from Firestore
2. **Validate** that slug exists (error handling)
3. **Redirect** to subdomain instead of staying on main domain
4. **Use environment variables** for domain configuration

### Why It Matters:

#### Before Fix:
```
User visits: www.univ.live/login
Logs in as educator
App redirects to: www.univ.live/educator
TenantProvider sees: isTenantDomain = false
Result: Educator dashboard NOT isolated by tenant ❌
```

#### After Fix:
```
User visits: www.univ.live/login
Logs in as educator
App redirects to: abc-coaching.univ.live/educator
Browser reloads on subdomain
TenantProvider sees: isTenantDomain = true ✓
Loads tenant profile
Result: Educator dashboard properly isolated ✓
```

---

## Testing the Fix

### Test 1: Local Development (with ?tenant parameter)

```bash
# Start dev server
npm run dev

# Create educator account
Visit: http://localhost:8080/?tenant=test-coaching
Go to: /signup?role=educator
Fill form and submit
✓ Should see dashboard

# Test login
Logout
Visit: http://localhost:8080/?tenant=test-coaching
Go to: /login?role=educator
Enter credentials
✓ Should redirect to: http://localhost:8080/educator?tenant=test-coaching
✓ TenantProvider should have isTenantDomain=true
```

### Test 2: Local with Subdomain (Optional)

```bash
# Add to /etc/hosts
127.0.0.1 www.univ.local
127.0.0.1 test-coaching.univ.local

# Update .env
VITE_APP_DOMAIN=univ.local

# Start dev server with host binding
vite --host

# Test flow
Visit: http://www.univ.local:8080/login?role=educator
Login
✓ Should redirect to: http://test-coaching.univ.local:8080/educator
```

### Test 3: Production Simulation

```bash
# Build for production
npm run build -- --mode production

# Preview
npm run preview

# This will use .env.production values
# Verify domain configuration
```

---

## Code Diff Format

If you prefer to see the exact changes in diff format:

### [src/pages/Login.tsx](src/pages/Login.tsx)

```diff
      toast.success("Logged in!");
-     nav("/educator");
+     
+     // ✅ NEW: Validate and redirect educator to their subdomain
+     const tenantSlug = data?.tenantSlug;
+     if (!tenantSlug) {
+       toast.error("Educator account misconfigured (missing tenant slug).");
+       await auth.signOut();
+       return;
+     }
+     
+     if (window.location.hostname === "localhost") {
+       // Local development: use query parameter
+       nav(`/educator?tenant=${tenantSlug}`);
+     } else {
+       // Production: redirect to subdomain
+       const protocol = window.location.protocol;
+       const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";
+       const educatorUrl = `${protocol}//${tenantSlug}.${appDomain}/educator`;
+       window.location.href = educatorUrl;
+     }
    } catch (error: any) {
```

### [src/lib/tenant.ts](src/lib/tenant.ts)

```diff
  export function getTenantSlugFromHostname(): string | null {
    if (typeof window === "undefined") return null;

    const hostname = window.location.hostname.toLowerCase();
+
+   // ✅ NEW: Get domain from environment
+   const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";

    if (hostname === "localhost") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tenant");
    }

    const parts = hostname.split(".");
+   const domainParts = appDomain.split(".");
+
+   // ✅ NEW: Check if hostname ends with our domain
+   const hostSuffix = parts.slice(-domainParts.length).join(".");
+
+   if (hostSuffix !== appDomain) {
+     return null;
+   }

-   if (
-     parts.length === 3 &&
-     parts[1] === "univ" &&
-     parts[2] === "live"
-   ) {
+   // ✅ NEW: If same length, it's the main domain
+   if (parts.length === domainParts.length) {
      return null;
    }

    const subdomain = parts[0];
    if (subdomain === "www") return null;

    return subdomain;
  }
```

---

## Impact Analysis

### Lines Changed:
- **[src/pages/Login.tsx](src/pages/Login.tsx)**: +18 lines (add educator redirect logic)
- **[src/lib/tenant.ts](src/lib/tenant.ts)**: +12 lines (make domain configurable)
- **.env**: +2 lines (new file, environment config)
- **.env.production**: +2 lines (new file, production config)

**Total**: ~34 new lines of code

### Tests Affected:
- ✅ Educator login flow
- ✅ TenantProvider initialization
- ⚠️ Domain detection (now uses env variables)
- ⚠️ Redirect behavior (now includes subdomain)

### Features Enabled:
- ✅ Educator dashboard isolation
- ✅ Multi-tenant context availability
- ✅ Tenant data filtering
- ✅ Production domain support

### Backwards Compatibility:
- ⚠️ Educators will be redirected to subdomain after login
  - This is a behavior change (but necessary)
  - URL changes from `www.univ.live/educator` to `abc-coaching.univ.live/educator`
  - User experience improves (proper tenant isolation)

---

## Deployment Checklist

```markdown
## Pre-Deployment
- [ ] Review the changes above
- [ ] Make code changes in development branch
- [ ] Run `npm run build` to verify no errors
- [ ] Test local flow with ?tenant parameter
- [ ] Test with local subdomain (optional)

## Staging Deployment
- [ ] Push to staging branch
- [ ] Deploy build to staging environment
- [ ] Verify DNS includes wildcard (*.staging.example.com)
- [ ] Test educator signup → login → dashboard
- [ ] Test student signup → login → dashboard
- [ ] Test role-based access restrictions
- [ ] Check browser console for errors
- [ ] Verify Firestore queries filter correctly

## Production Deployment
- [ ] Update .env.production with production domain
- [ ] Push to main/production branch
- [ ] Build for production
- [ ] Verify wildcard SSL certificate
- [ ] Verify DNS wildcard record
- [ ] Deploy to production
- [ ] Test live flow
- [ ] Monitor error logs
- [ ] Get stakeholder signoff

## Post-Deployment
- [ ] Create documentation for educators
- [ ] Update help/FAQ pages
- [ ] Monitor educator/student logins
- [ ] Watch for any auth errors
- [ ] Be ready to rollback if needed
```

---

## Why This Works

### Session Persistence:
When you do `window.location.href = subdomain_url`:
1. Browser performs a full page reload
2. All React state is lost (this is OK)
3. Firebase auth session persists in browser storage
4. Page reloads and AuthProvider re-initializes
5. Firebase automatically restores the session
6. User appears "logged in" on the new subdomain
7. TenantProvider detects the new subdomain and loads tenant profile

### No Manual Token Management:
- Firebase handles auth token storage
- Tokens are stored with domain scope (`univ.live`)
- Subdomains automatically inherit parent domain cookies/storage
- No need to manually pass tokens between domains

### Clean Architecture:
- Same user can be logged in on multiple tabs (different subdomains)
- Each tab loads the appropriate tenant context
- No cross-tenant data leakage
- Truly isolated multi-tenant experience

---

## Expected Behavior After Fix

### Educator Login Journey:
```
1. User at www.univ.live/login?role=educator
2. Enters email + password
3. Firebase authenticates → uid loaded
4. Profile fetched from Firestore → tenantSlug retrieved
5. Check: tenantSlug exists? → Yes ✓
6. Check: localhost? → No (production)
7. Construct: https://abc-coaching.univ.live/educator
8. Execute: window.location.href = that URL
9. Browser navigates to new URL
10. Page reloads completely
11. AuthProvider re-initializes
12. Firebase restores session automatically
13. TenantProvider detects: hostname = "abc-coaching.univ.live"
14. TenantProvider sets: isTenantDomain = true
15. TenantProvider loads: educator profile, coachingName, contact info
16. AppRoutes renders with isTenantDomain = true
17. Route matches: /educator
18. EducatorLayout component loads
19. Dashboard renders with full tenant context
20. Educator can see their data (students, tests, analytics)
```

---

## One-Line Summary

**Add educator subdomain redirect after login so TenantProvider can properly isolate multi-tenant data.**

That's it! Everything else is already working perfectly.

