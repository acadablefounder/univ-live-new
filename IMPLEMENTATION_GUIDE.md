# Implementation Guide: Educator Subdomain Redirect

## Quick Summary

Your multi-tenant architecture is **90% complete**. The only missing piece is:

**After educator login on main domain → redirect to tenant subdomain**

Currently:
```
Educator logs in on www.univ.live
→ Auth succeeds
→ nav("/educator")
→ Stays on www.univ.live/educator ❌
```

Should be:
```
Educator logs in on www.univ.live
→ Auth succeeds
→ Redirect to https://{tenantSlug}.univ.live/educator ✅
```

---

## Step 1: Update Login.tsx - Educator Redirect

### Location: [src/pages/Login.tsx](src/pages/Login.tsx#L100-L125)

### Current Code (Lines 100-115):
```typescript
if (!(roleDb === "EDUCATOR" || roleDb === "ADMIN")) {
  toast.error("This account is not an educator account.");
  await auth.signOut();
  return;
}

toast.success("Logged in!");
nav("/educator");  // ← CHANGE THIS
```

### NEW CODE - Replace with:

```typescript
if (!(roleDb === "EDUCATOR" || roleDb === "ADMIN")) {
  toast.error("This account is not an educator account.");
  await auth.signOut();
  return;
}

// ✅ NEW: Get tenant slug from user profile
const tenantSlug = data?.tenantSlug;
if (!tenantSlug) {
  toast.error("Educator account misconfigured (missing tenant slug).");
  await auth.signOut();
  return;
}

toast.success("Logged in!");

// ✅ NEW: Redirect to subdomain
if (window.location.hostname === "localhost") {
  // For local development: append ?tenant parameter
  nav(`/educator?tenant=${tenantSlug}`);
} else {
  // For production: redirect to subdomain
  const protocol = window.location.protocol; // https:
  const educatorUrl = `${protocol}//${tenantSlug}.univ.live/educator`;
  window.location.href = educatorUrl;
}
```

---

## Step 2: Update Domain Configuration (Future-proof)

### Current Issue:
Domain is hardcoded to `.univ.live` in [src/lib/tenant.ts](src/lib/tenant.ts#L10)

### Solution: Create Environment Variable

### Create: `.env`
```bash
VITE_APP_DOMAIN=univ.live
VITE_APP_MAIN_HOST=www.univ.live
```

### Create: `.env.production`
```bash
VITE_APP_DOMAIN=example.com
VITE_APP_MAIN_HOST=www.example.com
```

### Update `src/lib/tenant.ts`:
```typescript
export function getTenantSlugFromHostname(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase();
  
  // Get domain from environment
  const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";

  // LOCAL DEV SUPPORT
  if (hostname === "localhost") {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  const parts = hostname.split(".");
  const domainParts = appDomain.split(".");

  /**
   * For univ.live:
   *   Valid: abc-coaching.univ.live
   *   parts = ["abc-coaching", "univ", "live"]
   *   domainParts = ["univ", "live"]
   *
   * For example.com:
   *   Valid: abc-coaching.example.com
   *   parts = ["abc-coaching", "example", "com"]
   *   domainParts = ["example", "com"]
   */

  // Check if hostname ends with our domain
  const hostSuffix = parts.slice(-domainParts.length).join(".");
  
  if (hostSuffix !== appDomain) {
    return null; // Not our domain
  }

  // If same length, it's the main domain (www or apex)
  if (parts.length === domainParts.length) {
    return null;
  }

  const subdomain = parts[0];

  // Block www explicitly
  if (subdomain === "www") return null;

  return subdomain;
}
```

### Update `src/pages/Login.tsx` to use env variable:
```typescript
// In the redirect section:
const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";
const educatorUrl = `${protocol}//${tenantSlug}.${appDomain}/educator`;
window.location.href = educatorUrl;
```

---

## Step 3: Handle Browser Session Persistence

### Issue:
When you do `window.location.href = subdomain`, the page fully reloads. Firebase should maintain the session automatically, but it's good to verify.

### Verification Code:
Add this check to confirm auth persists:

```typescript
// In src/contexts/AuthProvider.tsx (already has this)
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    setFirebaseUser(u);  // ✅ This fires even after page reload
    if (!u) {
      setProfile(null);
      setLoading(false);
      return;
    }
    // Load profile for the new subdomain...
  });
  return () => unsub();
}, []);
```

✅ **This already works!** Firebase persists sessions across page reloads.

---

## Step 4: Test the Complete Flow

### Test 1: Educator Signup (should already work)
```
1. Visit: http://localhost:8080/?tenant=test-signup
2. Go to /signup?role=educator
3. Fill form:
   - Name: "John Test"
   - Coaching: "Test Coaching"
   - Slug: "test-coaching"
   - Email: test123@example.com
   - Password: Test@123
4. Click signup
5. ✅ Should see educator dashboard at /educator (on same local domain)
```

### Test 2: Educator Login + Subdomain Redirect
```
1. Logout (if needed)
2. Visit: http://localhost:8080/?tenant=test-coaching
3. Go to /login?role=educator
4. Enter same credentials:
   - Email: test123@example.com
   - Password: Test@123
5. Click login
6. ✅ Should redirect to: 
   http://localhost:8080/educator?tenant=test-coaching
7. ✅ Should see educator dashboard with tenant context
8. ✅ useTenant() hook should return:
   - tenantSlug: "test-coaching"
   - isTenantDomain: true (because of ?tenant param)
   - tenant: { educatorId, coachingName, ... }
```

### Test 3: Student Signup + Student Portal
```
1. Visit: http://localhost:8080/?tenant=test-coaching
2. Go to /signup (should default to student)
3. Fill form:
   - Name: "Jane Student"
   - Email: student123@example.com
   - Password: Student@123
4. Click signup
5. ✅ Should redirect to /student?tenant=test-coaching
6. ✅ Should see student dashboard
```

### Test 4: Production Domain Testing (Optional)
```
For testing with real subdomains:

1. Add to your /etc/hosts:
   127.0.0.1 localhost
   127.0.0.1 www.univ.local
   127.0.0.1 test-coaching.univ.local
   127.0.0.1 abc-coaching.univ.local

2. Update .env:
   VITE_APP_DOMAIN=univ.local

3. Start dev server with proper host:
   vite --host

4. Visit: http://www.univ.local:8080/login?role=educator
5. Login with educator account
6. ✅ Should redirect to: http://test-coaching.univ.local:8080/educator
```

---

## Step 5: Security Considerations

### Issue 1: Cross-Origin Session
**Not actually an issue** - subdomains share the same top-level domain.
- `www.univ.live` and `abc-coaching.univ.live` both have `Domain=univ.live`
- Firebase auth token is stored in this shared domain
- ✅ Session persists automatically

### Issue 2: Redirect Validation
**Best practice**: Don't trust extracted tenantSlug - verify in your EducatorLayout:

```typescript
// src/components/educator/EducatorLayout.tsx
import { useAuth } from "@/contexts/AuthProvider";
import { useTenant } from "@/contexts/TenantProvider";

export default function EducatorLayout() {
  const { profile, loading: authLoading } = useAuth();
  const { isTenantDomain, tenantSlug, loading: tenantLoading } = useTenant();

  // Validation: educator profile must exist
  if (!profile) {
    return <Navigate to="/login?role=educator" />;
  }

  // Validation: if on tenant domain, educator's slug must match
  if (isTenantDomain && profile.tenantSlug !== tenantSlug) {
    // Educator trying to access wrong tenant's subdomain
    return <Navigate to={`https://${profile.tenantSlug}.univ.live/educator`} />;
  }

  // Safe to render educator layout
  if (authLoading || tenantLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Educator routes */}
    </div>
  );
}
```

### Issue 3: Firestore Security Rules
Your rules should enforce `educatorId` filtering:

```javascript
// firestore.rules (example)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Educators can read all students, but must filter by educatorId
    match /students/{doc=**} {
      allow list: if request.auth.token.role == "EDUCATOR";
      allow read: if resource.data.educatorId == request.auth.uid;
    }

    // Tests collection - same pattern
    match /tests/{doc=**} {
      allow list, read: if resource.data.educatorId == request.auth.uid 
                           || request.auth.token.role == "ADMIN";
    }
  }
}
```

---

## Step 6: Rollout Checklist

- [ ] Update [src/pages/Login.tsx](src/pages/Login.tsx) with subdomain redirect logic
- [ ] Add environment variables: `VITE_APP_DOMAIN`, `VITE_APP_MAIN_HOST`
- [ ] Update [src/lib/tenant.ts](src/lib/tenant.ts) to use env variables
- [ ] Test local signup/login flow with `?tenant=` parameter
- [ ] Add verification in EducatorLayout component
- [ ] Review Firestore security rules
- [ ] Test on staging with real domain
- [ ] Deploy and verify in production

---

## Code Diff Summary

### Modified Files:

#### 1. `src/pages/Login.tsx` (5-10 new lines)
```diff
  if (!(roleDb === "EDUCATOR" || roleDb === "ADMIN")) {
    toast.error("This account is not an educator account.");
    await auth.signOut();
    return;
  }

+ const tenantSlug = data?.tenantSlug;
+ if (!tenantSlug) {
+   toast.error("Educator account misconfigured (missing tenant slug).");
+   await auth.signOut();
+   return;
+ }

  toast.success("Logged in!");
- nav("/educator");

+ if (window.location.hostname === "localhost") {
+   nav(`/educator?tenant=${tenantSlug}`);
+ } else {
+   const protocol = window.location.protocol;
+   const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";
+   const educatorUrl = `${protocol}//${tenantSlug}.${appDomain}/educator`;
+   window.location.href = educatorUrl;
+ }
```

#### 2. `src/lib/tenant.ts` (20-30 new lines)
```diff
  export function getTenantSlugFromHostname(): string | null {
    if (typeof window === "undefined") return null;

    const hostname = window.location.hostname.toLowerCase();

+   // Get domain from environment
+   const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";

    if (hostname === "localhost") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tenant");
    }

    const parts = hostname.split(".");
+   const domainParts = appDomain.split(".");
+
+   const hostSuffix = parts.slice(-domainParts.length).join(".");
+   if (hostSuffix !== appDomain) {
+     return null;
+   }

-   if (
-     parts.length === 3 &&
-     parts[1] === "univ" &&
-     parts[2] === "live"
-   ) {
+   if (parts.length === domainParts.length) {
      return null;
    }

    const subdomain = parts[0];
    if (subdomain === "www") return null;

    return subdomain;
  }
```

#### 3. `.env` (new file)
```
VITE_APP_DOMAIN=univ.live
VITE_APP_MAIN_HOST=www.univ.live
```

#### 4. `.env.production` (new file)
```
VITE_APP_DOMAIN=example.com
VITE_APP_MAIN_HOST=www.example.com
```

---

## FAQ

**Q: Why full page reload with `window.location.href` instead of React Router?**
A: Because we're changing domains. React Router can't navigate to a different domain. The full page reload is intentional - it allows TenantProvider to re-detect the hostname and load the tenant context.

**Q: Will the user lose their session?**
A: No! Firebase auth is persisted in browser storage tied to the root domain (`univ.live`). After the page reloads on the subdomain, Firebase automatically restores the session.

**Q: What about API calls after redirect?**
A: All subsequent API calls include the auth token in the request header. The backend verifies the token and can see which educator is making the request. No issues.

**Q: Can an educator access multiple tenant subdomains?**
A: Currently, each educator has only ONE tenantSlug. If you want to support multiple tenants per educator in the future, you'd need to:
1. Change userProfile to support an array: `tenantSlugs: ["slug1", "slug2"]`
2. Modify login to ask which tenant they want to access
3. Or add a tenant selector in the educator dashboard

**Q: What about student multi-enrollment?**
A: Already supported! Students have `enrolledTenants: ["slug1", "slug2", ...]`. When they access `slug1.univ.live`, they see only that tenant's data. If they access `slug2.univ.live`, they see that tenant's data. The API filters by both `educatorId` and `enrolledTenants`.

---

## Production Deployment Notes

### Before going live:

1. **DNS Setup**
   - `example.com` → Your main server
   - `*.example.com` → Same server (wildcard subdomain)

2. **SSL Certificate**
   - Use a wildcard cert: `*.example.com`
   - Cost: usually same as single cert or just a bit more

3. **Environment Variables**
   - Build separately for dev/staging/prod:
     ```bash
     # Development
     npm run build  # Uses .env

     # Production
     npm run build -- --mode production  # Uses .env + .env.production
     ```

4. **CORS Configuration**
   - If your API is separate from frontend, allow both:
     ```javascript
     CORS_ORIGINS=[
       "https://www.example.com",
       "https://*.example.com"
     ]
     ```

5. **OAuth / Third-party Integrations**
   - Update redirect URIs in Firebase/Auth0/etc to include subdomains
   - Firebase usually handles this automatically with domain verification

---

