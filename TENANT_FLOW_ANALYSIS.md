# Tenant Slug & Educator Subdomain Flow Analysis

## Current Architecture Overview

Your project uses a **multi-tenant SaaS model** with subdomain-based tenant isolation:
- **Main domain**: `www.univ.live` - Platform landing page, educator signup/login
- **Tenant subdomains**: `{tenantSlug}.univ.live` - Student portals for each coaching center

---

## 1. EDUCATOR SIGNUP → TENANT SLUG CREATION

### Location: [src/pages/Signup.tsx](src/pages/Signup.tsx#L30-L190)

### Flow:
```
Educator fills form on www.univ.live/signup?role=educator
    ↓
normSlug() converts desired slug to valid format
    - Lowercase, alphanumeric + hyphens only
    - Removes leading/trailing hyphens
    Example: "ABC Coaching" → "abc-coaching"
    ↓
checkSlugAvailable() checks if slug already exists in Firestore
    ↓
Three documents created on success:
```

### Documents Created in Signup (lines 145-180):

**1. Users Collection** (`/users/{uid}`)
```javascript
{
  uid: "edu123",
  role: "EDUCATOR",
  displayName: "John Doe",
  email: "john@example.com",
  tenantSlug: "abc-coaching",        // ← Stored here
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

**2. Educators Collection** (`/educators/{uid}`)
```javascript
{
  tenantSlug: "abc-coaching",        // ← Stored here
  coachingName: "ABC Coaching",
  phone: "9876543210",
  email: "john@example.com",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

**3. Tenants Collection** (`/tenants/{slug}`)
```javascript
{
  educatorId: "edu123",              // ← Links back to educator
  tenantSlug: "abc-coaching",        // ← This is the key
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### Key Function: [normSlug](src/pages/Signup.tsx#L17-L22)
```typescript
function normSlug(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}
```

---

## 2. TENANT SLUG DETECTION FROM HOSTNAME

### Location: [src/lib/tenant.ts](src/lib/tenant.ts)

### Function: `getTenantSlugFromHostname()`
```typescript
export function getTenantSlugFromHostname(): string | null {
  // For localhost: ?tenant=abc-coaching
  if (hostname === "localhost") {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  // Pattern: {tenantSlug}.univ.live
  const parts = hostname.split(".");
  
  if (parts.length === 3 && 
      parts[1] === "univ" && 
      parts[2] === "live") {
    const subdomain = parts[0];
    
    // Block www explicitly
    if (subdomain === "www") return null;
    
    return subdomain;  // ← Returns the tenant slug
  }
  
  return null;  // Not a tenant domain
}
```

### Examples:
| Hostname | Detected Slug | Is Tenant? |
|----------|---------------|-----------|
| `www.univ.live` | `null` | ❌ Main domain |
| `abc-coaching.univ.live` | `abc-coaching` | ✅ Tenant |
| `localhost?tenant=abc-coaching` | `abc-coaching` | ✅ Local dev |
| `random.com` | `null` | ❌ Not our domain |

---

## 3. TENANT CONTEXT INITIALIZATION

### Location: [src/contexts/TenantProvider.tsx](src/contexts/TenantProvider.tsx)

### How TenantProvider Works:

```typescript
export function TenantProvider({ children }) {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [isTenantDomain, setIsTenantDomain] = useState(false);

  // Step 1: Extract slug from hostname on mount
  useEffect(() => {
    const slug = getTenantSlugFromHostname(window.location.hostname);
    setTenantSlug(slug);
    setIsTenantDomain(Boolean(slug));
  }, []);

  // Step 2: If tenant slug detected, fetch tenant profile from Firestore
  useEffect(() => {
    if (!tenantSlug) {
      setTenant(null);
      setLoading(false);
      return;
    }
    
    // Query educators collection for this tenant slug
    const q = query(
      collection(db, "educators"), 
      where("tenantSlug", "==", tenantSlug), 
      limit(1)
    );
    
    const snap = await getDocs(q);
    
    if (snap.empty) {
      setTenant(null);  // Invalid tenant
    } else {
      const docSnap = snap.docs[0];
      const data = docSnap.data();
      setTenant({
        educatorId: docSnap.id,
        tenantSlug,
        coachingName: data.coachingName,
        tagline: data.tagline,
        contact: data.contact,
        socials: data.socials,
        websiteConfig: data.websiteConfig
      });
    }
  }, [tenantSlug]);
}
```

### Context Usage:
```typescript
const { tenant, tenantSlug, isTenantDomain, loading } = useTenant();
```

---

## 4. EDUCATOR LOGIN → REDIRECT TO SUBDOMAIN

### Location: [src/pages/Login.tsx](src/pages/Login.tsx)

### Current Login Flow:

```typescript
// On main domain (www.univ.live)
if (effectiveRole === "educator") {
  // Educator logs in on main site
  const cred = await signInWithEmailAndPassword(auth, email, password);
  
  // Check if user is EDUCATOR role
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  const roleDb = snap.data()?.role;  // Should be "EDUCATOR"
  
  // Redirect to /educator
  nav("/educator");  // ← Currently goes to /educator on SAME domain!
}
```

### **ISSUE IDENTIFIED:**

When educator logs in on `www.univ.live`, they get `nav("/educator")` which:
- Keeps them on `www.univ.live/educator` ✗ WRONG
- Should redirect them to `{tenantSlug}.univ.live/educator` ✓ CORRECT

---

## 5. HOW THE SUBDOMAIN REDIRECT SHOULD WORK

### Proposed Solution:

**After educator login, you need to:**

1. Get their tenant slug from the user profile
2. Construct the subdomain URL
3. Redirect to: `https://{tenantSlug}.univ.live/educator`

### Implementation Example:

```typescript
// In Login.tsx, after educator authentication
const snap = await getDoc(doc(db, "users", cred.user.uid));
const userData = snap.data();
const tenantSlug = userData?.tenantSlug;

if (!tenantSlug) {
  toast.error("Tenant slug not found for educator");
  return;
}

// Construct subdomain URL
const tenantUrl = `https://${tenantSlug}.univ.live`;
window.location.href = `${tenantUrl}/educator`;

// OR for localhost testing:
if (window.location.hostname === "localhost") {
  nav("/educator?tenant=" + tenantSlug);
} else {
  window.location.href = `https://${tenantSlug}.univ.live/educator`;
}
```

---

## 6. ROUTING SETUP (CURRENT STATE)

### Location: [src/AppRoutes.tsx](src/AppRoutes.tsx)

### Current Behavior:
```typescript
export default function AppRoutes() {
  const { isTenantDomain } = useTenant();

  if (isTenantDomain) {
    // Routes for abc-coaching.univ.live
    <Route path="/educator" element={<EducatorLayout />} />
    <Route path="/student" element={<StudentRoute />} />
  } else {
    // Routes for www.univ.live
    <Route path="/educator" element={<EducatorLayout />} />
  }
}
```

### What's Working:
✅ Both main domain and tenant subdomains can serve `/educator` routes
✅ TenantProvider correctly detects which domain is being accessed
✅ Students on `abc-coaching.univ.live` can access `/student`
✅ Educators on `abc-coaching.univ.live` can access `/educator`

### What's Not Working:
❌ Educators who login on `www.univ.live` don't get redirected to their tenant subdomain

---

## 7. DATA FLOW SUMMARY

### Complete Educator Journey:

```
1. SIGNUP (on www.univ.live)
   ┌─────────────────────────────────────────┐
   │ Fill form: name, coaching name, slug    │
   │ Email: john@example.com                 │
   │ Desired slug: "My Coaching" → slug used │
   └─────────────────────────────────────────┘
         ↓
   ┌─────────────────────────────────────────┐
   │ Firebase Auth creates user              │
   │ Firestore saves 3 docs:                 │
   │  - users/uid → {role, tenantSlug}      │
   │  - educators/uid → {tenantSlug}        │
   │  - tenants/slug → {educatorId}         │
   └─────────────────────────────────────────┘
         ↓
   Auto redirected to /educator

2. LOGOUT & LATER LOGIN (on www.univ.live)
   ┌─────────────────────────────────────────┐
   │ Enter email + password                  │
   │ Firebase Auth validates credentials     │
   │ Load user profile from users/{uid}      │
   │ Check: role === "EDUCATOR"?             │
   │ Extract: tenantSlug from profile        │
   └─────────────────────────────────────────┘
         ↓
   ┌─────────────────────────────────────────┐
   │ REDIRECT TO:                            │
   │ https://{tenantSlug}.univ.live/educator │
   └─────────────────────────────────────────┘
         ↓
   ┌─────────────────────────────────────────┐
   │ Browser loads subdomain                 │
   │ TenantProvider detects: isTenantDomain  │
   │ Loads educator profile from Firestore   │
   │ Routes to /educator (protected)         │
   │ AuthProvider confirms role              │
   │ Dashboard loads with tenant context     │
   └─────────────────────────────────────────┘

3. STUDENT SIGNUP (on tenant subdomain)
   ┌─────────────────────────────────────────┐
   │ Student fills form on subdomain         │
   │ abc-coaching.univ.live/signup           │
   └─────────────────────────────────────────┘
         ↓
   ┌─────────────────────────────────────────┐
   │ Create new user with role: "STUDENT"    │
   │ Add to enrolledTenants: [slug]          │
   │ Save to users/{uid}                     │
   │ tenantSlug extracted from hostname      │
   │ educatorId fetched from tenant profile  │
   └─────────────────────────────────────────┘
         ↓
   Auto redirected to /student

4. STUDENT LOGIN (on tenant subdomain)
   ┌─────────────────────────────────────────┐
   │ Validate credentials                    │
   │ Check: enrolledTenants.includes(slug)?  │
   │ Check: role === "STUDENT"               │
   │ Register student via API                │
   └─────────────────────────────────────────┘
         ↓
   Redirected to /student
```

---

## 8. KEY FILES & THEIR ROLES

| File | Purpose | Key Function |
|------|---------|--------------|
| [src/lib/tenant.ts](src/lib/tenant.ts) | Slug detection | `getTenantSlugFromHostname()` |
| [src/contexts/TenantProvider.tsx](src/contexts/TenantProvider.tsx) | Tenant context | Auto-loads tenant profile by slug |
| [src/contexts/AuthProvider.tsx](src/contexts/AuthProvider.tsx) | Auth context | Loads user profile, stores enrolledTenants |
| [src/pages/Signup.tsx](src/pages/Signup.tsx) | Registration | Creates 3 Firestore docs per educator |
| [src/pages/Login.tsx](src/pages/Login.tsx) | Authentication | **NEEDS MODIFICATION** for subdomain redirect |
| [src/AppRoutes.tsx](src/AppRoutes.tsx) | Routing | Routes differ based on `isTenantDomain` |
| [src/services/authService.ts](src/services/authService.ts) | Auth helpers | `signUpEducator()` utility function |

---

## 9. WHAT'S MISSING

### Currently NOT Implemented:
❌ **Subdomain redirect after educator login**
   - Educators login on www but need to redirect to {slug}.univ.live
   - Currently they stay on main domain

❌ **Production domain handling**
   - Code assumes `.univ.live` domain
   - Will need to update for `www.example.com`

---

## 10. ACTION ITEMS

To complete the educator subdomain flow:

1. **Modify [src/pages/Login.tsx](src/pages/Login.tsx#L95-L115)**
   - After educator authentication succeeds
   - Get `tenantSlug` from user profile
   - Redirect to `https://{tenantSlug}.univ.live/educator`
   - Handle localhost case: append `?tenant={slug}`

2. **Update domain detection in [src/lib/tenant.ts](src/lib/tenant.ts)**
   - Replace hardcoded `.univ.live` with dynamic logic or env variable
   - Support both `example.com` and `subdomain.example.com`

3. **Test flow:**
   - Signup educator on main domain
   - Logout and login again
   - Should redirect to tenant subdomain
   - TenantProvider should detect and load tenant profile
   - Educator Dashboard should render with tenant context

---

## Summary

Your architecture is **already mostly complete**:
- ✅ Tenant slugs are created and saved during signup
- ✅ TenantProvider detects slugs from hostname
- ✅ Both student and educator routes work on subdomains
- ✅ Context properly isolates data per tenant

**What needs completion:**
- ⚠️ Educator login → subdomain redirect (simple addition)
- ⚠️ Domain configuration for production
