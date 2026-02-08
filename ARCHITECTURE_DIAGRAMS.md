# Visual Architecture & Data Flow Diagrams

## 1. APPLICATION CONTEXT HIERARCHY

```
┌─────────────────────────────────────────────────────────────────┐
│                    QueryClientProvider                          │
│                  (React Query Management)                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   AuthProvider                            │ │
│  │         (Global Auth State & User Profile)               │ │
│  │                                                           │ │
│  │  State:                                                   │ │
│  │  • firebaseUser (Firebase User)                          │ │
│  │  • profile (AppUserProfile)                              │ │
│  │  • uid, role, enrolledTenants                            │ │
│  │  • loading, refreshProfile()                             │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │              TenantProvider                         ││ │
│  │  │    (Tenant Context Based on Hostname)              ││ │
│  │  │                                                     ││ │
│  │  │  State:                                            ││ │
│  │  │  • tenantSlug (from hostname subdomain)           ││ │
│  │  │  • tenant (TenantProfile)                         ││ │
│  │  │  • isTenantDomain (boolean)                       ││ │
│  │  │  • loading                                         ││ │
│  │  │                                                     ││ │
│  │  │  ┌───────────────────────────────────────────────┐││ │
│  │  │  │                                               │││ │
│  │  │  │  TooltipProvider                             │││ │
│  │  │  │  ├─ Toaster (UI Notifications)              │││ │
│  │  │  │  ├─ Sonner (Toast Messages)                 │││ │
│  │  │  │  └─ BrowserRouter + AppRoutes               │││ │
│  │  │  │                                               │││ │
│  │  │  └───────────────────────────────────────────────┘││ │
│  │  │                                                     ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. HOSTNAME → TENANT SLUG → CONTEXT INITIALIZATION FLOW

```
┌──────────────────────────────────────┐
│   Browser URL / Hostname             │
│                                      │
│   www.univ.live       (main)        │
│   abc-coaching.univ.live (tenant)   │
│   localhost?tenant=abc (local dev)   │
└──────────────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │  getTenantSlugFromHostname()
        │  [src/lib/tenant.ts]     │
        └──────────────┬───────────┘
                       │
        ┌──────────────┴────────────────┐
        │                               │
        ▼                               ▼
    Tenant Domain              Main Domain
    (subdomain detected)       (www or no subdomain)
        │                           │
    tenantSlug="abc-coaching"   tenantSlug=null
    isTenantDomain=true         isTenantDomain=false
        │                           │
        ▼                           ▼
    ┌────────────────────┐    ┌──────────────┐
    │ TenantProvider     │    │ Routes to:   │
    │ Queries:           │    │              │
    │ /educators?        │    │ Landing page │
    │  tenantSlug==slug  │    │ Signup form  │
    │                    │    │ Login form   │
    │ Loads:             │    │              │
    │ • coachingName    │    │ (no tenant)   │
    │ • educatorId      │    └──────────────┘
    │ • contact info    │
    │ • website config  │
    └────────────────────┘
           │
           ▼
    ┌─────────────────────────────────┐
    │  useTenant() Hook Available:    │
    │  • tenantSlug                   │
    │  • tenant (profile data)        │
    │  • isTenantDomain              │
    │  • loading                      │
    └─────────────────────────────────┘
```

---

## 3. EDUCATOR SIGNUP → TENANT CREATION FLOW

```
User visits: www.univ.live/signup?role=educator
│
▼
┌────────────────────────────────────────────┐
│  Signup Form (EffectiveRole="educator")    │
│                                            │
│  Inputs:                                   │
│  • Full Name (e.g., "John Doe")           │
│  • Coaching Name (e.g., "ABC Coaching")   │
│  • Desired Slug (e.g., "abc-coaching")    │
│  • Phone Number (optional)                │
│  • Email                                  │
│  • Password                               │
└───────────────┬────────────────────────────┘
                │
                ▼
       ┌────────────────────┐
       │ normSlug()         │
       │ Normalizes:        │
       │ "ABC Coaching"     │
       │       ↓            │
       │ "abc-coaching"     │
       └────────┬───────────┘
                │
                ▼
       ┌──────────────────────┐
       │ checkSlugAvailable() │
       │ Query:               │
       │ db.tenants/{slug}    │
       │ (exists?)            │
       └────────┬─────────────┘
                │
         ┌──────┴──────┐
         │             │
      Available      Taken
         │             │
         ▼             ▼
       ✅ OK      ❌ Error
         │        "Already taken"
         │
         ▼
┌──────────────────────────────────────────┐
│ Firebase Auth:                           │
│ createUserWithEmailAndPassword(          │
│   email, password                        │
│ )                                        │
│                                          │
│ Returns: uid (e.g., "edu123abc")        │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Create 3 Firestore Documents:           │
│                                          │
│  1️⃣  /users/{uid}                       │
│     ├─ uid: "edu123abc"                │
│     ├─ role: "EDUCATOR"                │
│     ├─ displayName: "John Doe"         │
│     ├─ email: "john@example.com"       │
│     ├─ tenantSlug: "abc-coaching"      │
│     ├─ createdAt: NOW()                │
│     └─ updatedAt: NOW()                │
│                                          │
│  2️⃣  /educators/{uid}                   │
│     ├─ tenantSlug: "abc-coaching"      │
│     ├─ coachingName: "ABC Coaching"    │
│     ├─ email: "john@example.com"       │
│     ├─ phone: "9876543210"             │
│     ├─ createdAt: NOW()                │
│     └─ updatedAt: NOW()                │
│                                          │
│  3️⃣  /tenants/abc-coaching             │
│     ├─ educatorId: "edu123abc"         │
│     ├─ tenantSlug: "abc-coaching"      │
│     ├─ createdAt: NOW()                │
│     └─ updatedAt: NOW()                │
│                                          │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ Auto-redirect:                           │
│ nav("/educator")                         │
│                                          │
│ Since isTenantDomain=false,              │
│ routes to main domain educator routes    │
│                                          │
│ ⚠️  ISSUE: User still on www.univ.live   │
│ Should be: abc-coaching.univ.live        │
└──────────────────────────────────────────┘
```

---

## 4. EDUCATOR LOGIN → SUBDOMAIN REDIRECT FLOW (INCOMPLETE)

```
┌─────────────────────────────────────────────────────────────────┐
│  User visits: www.univ.live/login?role=educator                 │
│                                                                 │
│  Enters: email, password                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Firebase Auth:         │
        │ signInWithEmailAndPassword(
        │   email, password      │
        │ )                      │
        └────────┬───────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
    Success            Error
        │                  │
        ▼                  ▼
    ✅ Auth OK        ❌ Invalid Creds
                    "Invalid email or password"
        │
        ▼
┌─────────────────────────────────────────┐
│ Fetch user profile:                     │
│ getDoc(/users/{uid})                    │
│                                         │
│ Returns:                                │
│ {                                       │
│   role: "EDUCATOR",                    │
│   tenantSlug: "abc-coaching",          │
│   displayName: "John Doe",             │
│   email: "john@example.com",           │
│   createdAt: timestamp,                │
│   ...                                  │
│ }                                      │
└────────┬────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────┐
    │ Current behavior:                       │
    │ nav("/educator")                        │
    │                                         │
    │ ❌ WRONG: Stays on www.univ.live        │
    │    User redirected to www.univ.live     │
    │    (main domain educator dashboard)     │
    │                                         │
    │ ✅ SHOULD BE:                           │
    │    Extract tenantSlug from profile      │
    │    Redirect to subdomain URL:           │
    │    https://abc-coaching.univ.live       │
    │    /educator                            │
    └─────────────────────────────────────────┘
         │
         ▼ (AFTER FIX)
    ┌──────────────────────────────────────┐
    │ Browser loads:                       │
    │ https://abc-coaching.univ.live       │
    │                                      │
    │ getTenantSlugFromHostname()         │
    │ Returns: "abc-coaching"              │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ TenantProvider:                      │
    │ • Detects: isTenantDomain=true       │
    │ • Queries /educators               │
    │   where tenantSlug=="abc-coaching"  │
    │ • Loads tenant profile              │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ AuthProvider (already has user)      │
    │ • Loads profile (already cached)     │
    │ • role="EDUCATOR"                   │
    │ • tenantSlug="abc-coaching"         │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ AppRoutes detects:                   │
    │ isTenantDomain=true                  │
    │ Routes educator to                   │
    │ /educator on tenant subdomain        │
    │                                      │
    │ EducatorLayout loads with            │
    │ tenant context                       │
    └──────────────────────────────────────┘
```

---

## 5. DATA FLOW: EDUCATOR OPERATIONS ON SUBDOMAIN

```
                Educator on Subdomain
                (abc-coaching.univ.live)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Create Tests │ │View Students │ │Update Website│
│              │ │              │ │              │
│  Queries:    │ │  Queries:    │ │  Updates:    │
│              │ │              │ │              │
│ /tests/      │ │ /students/   │ │ /educators/  │
│  docId:..    │ │  uid         │ │  {uid}       │
│              │ │              │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
            ┌──────────────────────────┐
            │  Firestore Query Filter  │
            │                          │
            │  All queries auto-filter:│
            │  where educatorId == uid │
            │                          │
            │  (Tenant isolation)      │
            │                          │
            │  Example: Get students   │
            │  query(                  │
            │    collection("students")│
            │    where("educatorId",   │
            │      "==", uid)          │
            │  )                       │
            └──────────────────────────┘
                        │
                        ▼
            ┌──────────────────────────┐
            │  Data Loaded in Context: │
            │                          │
            │  useAuth() → profile     │
            │  useTenant() → tenant    │
            │                          │
            │  Components can access:  │
            │  • educatorId (from auth)│
            │  • tenantSlug (from URL) │
            │  • coachingName (from    │
            │    tenant)               │
            │  • studentList, etc.     │
            └──────────────────────────┘
```

---

## 6. STUDENT SIGNUP ON TENANT SUBDOMAIN

```
User visits: abc-coaching.univ.live/signup (auto student mode)
│
▼
┌─────────────────────────────────────────────────────────┐
│  Signup Form (EffectiveRole="student")                  │
│  isTenantDomain=true → student only                     │
│                                                         │
│  Inputs:                                                │
│  • Full Name                                            │
│  • Email                                                │
│  • Password                                             │
│                                                         │
│  Note: tenantSlug extracted from hostname               │
│  ("abc-coaching" from abc-coaching.univ.live)          │
│  tenant.educatorId loaded from TenantProvider           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Firebase Auth:             │
        │ createUserWithEmailAndPassword(
        │   email, password          │
        │ )                          │
        └────────┬───────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  Create /users/{uid} Document:                       │
│                                                      │
│  {                                                   │
│    uid: "stu456def",                                │
│    role: "STUDENT",                                │
│    displayName: "Jane Smith",                       │
│    email: "jane@example.com",                       │
│    educatorId: "edu123abc"  ← FROM tenantProvider   │
│    tenantSlug: "abc-coaching"  ← FROM hostname      │
│    enrolledTenants: ["abc-coaching"]  ← ARRAY!      │
│    createdAt: NOW(),                                │
│    updatedAt: NOW()                                 │
│  }                                                   │
│                                                      │
│  Note: enrolledTenants is an ARRAY because a         │
│  student could potentially enroll in multiple       │
│  coaching centers in future                         │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│  Call API: POST /api/tenant/register-student         │
│  (Backend: api/tenant/register-student.ts)           │
│                                                      │
│  Payload: { tenantSlug: "abc-coaching" }            │
│  Auth: Bearer {idToken}                             │
│                                                      │
│  Backend processes:                                  │
│  • Records student enrollment                       │
│  • Sets up billing if needed                        │
│  • Initializes student data                         │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│  Auto-redirect:                                      │
│  nav("/student")                                     │
│                                                      │
│  Routes to: abc-coaching.univ.live/student/         │
│  StudentLayout + Dashboard loads                     │
│                                                      │
│  Data available via hooks:                          │
│  • useAuth() → studentProfile, enrolledTenants       │
│  • useTenant() → tenantSlug, tenant data            │
└──────────────────────────────────────────────────────┘
```

---

## 7. REQUEST ROUTING DECISION TREE

```
┌─────────────────────────────────────────────────────────┐
│         Browser Request Arrives                         │
│    [URL, Auth Token, User Session]                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ getTenantSlugFromHost- │
        │ name()                 │
        │                        │
        │ Extract subdomain?     │
        └────────┬───────────────┘
                 │
         ┌───────┴────────┐
         │                │
      YES                 NO
         │                │
         ▼                ▼
    ┌────────────┐   ┌──────────────┐
    │ Tenant     │   │ Main Domain  │
    │ Subdomain  │   │              │
    │ Detected   │   │ www.univ.live│
    └─────┬──────┘   └──────┬───────┘
          │                 │
          ▼                 ▼
    ┌────────────────┐  ┌───────────────────┐
    │ AppRoutes:     │  │ AppRoutes:        │
    │ isTenantDomain │  │ isTenantDomain    │
    │ =true          │  │ =false            │
    │                │  │                   │
    │ Public routes: │  │ Public routes:    │
    │ /              │  │ /                 │
    │ /login         │  │ /login            │
    │ /signup        │  │ /signup           │
    │ /courses       │  │ /pricing          │
    │                │  │ /how-it-works     │
    │ Protected:     │  │ /features         │
    │ /student       │  │                   │
    │ /educator      │  │ Protected:        │
    │ (both!)        │  │ /educator         │
    │                │  │ /admin            │
    └────────────────┘  └───────────────────┘
          │                     │
          ▼                     ▼
    ┌─────────────┐    ┌────────────────┐
    │ TenantProvider   │ TenantProvider │
    │ isTenantDomain   │ isTenantDomain │
    │ =true            │ =false         │
    │ tenantSlug=slug  │ tenantSlug=null│
    │ tenant=loaded    │ tenant=null    │
    └────┬────────┘    └────────────────┘
         │
         ▼
    ┌─────────────────────┐
    │ Render component    │
    │ with context data   │
    └─────────────────────┘
```

---

## 8. FIRESTORE COLLECTION STRUCTURE

```
Firestore Database
├── users/
│   ├── edu123abc (EDUCATOR)
│   │   ├── uid: "edu123abc"
│   │   ├── role: "EDUCATOR"
│   │   ├── displayName: "John Doe"
│   │   ├── email: "john@example.com"
│   │   ├── tenantSlug: "abc-coaching"
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   │
│   └── stu456def (STUDENT)
│       ├── uid: "stu456def"
│       ├── role: "STUDENT"
│       ├── displayName: "Jane Smith"
│       ├── email: "jane@example.com"
│       ├── educatorId: "edu123abc"
│       ├── tenantSlug: "abc-coaching"
│       ├── enrolledTenants: ["abc-coaching"]
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── educators/
│   └── edu123abc
│       ├── tenantSlug: "abc-coaching"
│       ├── coachingName: "ABC Coaching"
│       ├── email: "john@example.com"
│       ├── phone: "9876543210"
│       ├── tagline: "Best coaching in city"
│       ├── contact: { phone, email, address }
│       ├── socials: { instagram, facebook, ... }
│       ├── websiteConfig: { theme, colors, ... }
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── tenants/
│   └── abc-coaching
│       ├── educatorId: "edu123abc"
│       ├── tenantSlug: "abc-coaching"
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── tests/
│   ├── test001
│   │   ├── educatorId: "edu123abc" ← Always filtered
│   │   ├── tenantSlug: "abc-coaching"
│   │   ├── title: "Physics Part 1"
│   │   ├── questions: 50
│   │   └── ...
│   │
│   └── test002 (different educator)
│       ├── educatorId: "edu999xyz"
│       ├── tenantSlug: "xyz-academy"
│       └── ...
│
├── students/ (if needed separately)
│   ├── stu456def
│   │   ├── educatorId: "edu123abc"
│   │   ├── tenantSlug: "abc-coaching"
│   │   └── ...
│   │
│   └── stu999abc
│       ├── educatorId: "edu999xyz"
│       ├── tenantSlug: "xyz-academy"
│       └── ...
│
└── ... (other collections)


KEY PATTERN:
Every document MUST have educatorId to enable row-level security
and tenant isolation!
```

---

## 9. Domain Configuration

### Current Setup (Hardcoded)
```typescript
// src/lib/tenant.ts
const parts = hostname.split(".");

if (
  parts.length === 3 &&
  parts[1] === "univ" &&
  parts[2] === "live"
) {
  return parts[0];  // Returns subdomain
}
```

### For Production (example.com)
```typescript
// Would need to be:
// example.com → no subdomain (main)
// coaching.example.com → "coaching" (tenant)
// abc-coaching.example.com → "abc-coaching" (tenant)

const parts = hostname.split(".");

if (parts.length >= 2) {
  const lastTwo = parts.slice(-2).join(".");
  
  if (lastTwo === "example.com") {
    if (parts.length === 2) return null;  // www.example.com or example.com
    if (parts[0] === "www") return null;
    return parts[0];  // Any other subdomain
  }
}
```

---

## 10. SESSION & AUTH FLOW TIMELINE

```
Timeline: Educator Login Scenario

TIME 0:00 - User visits www.univ.live/login?role=educator
├─ Page loads
├─ BrowserRouter initialized
├─ App.tsx mounts context providers:
│  ├─ AuthProvider starts listening (onAuthStateChanged)
│  ├─ TenantProvider detects hostname
│  │  └─ getTenantSlugFromHostname() returns null
│  │     (because it's www.univ.live)
│  ├─ AppRoutes renders with isTenantDomain=false
│  └─ Login page displays
│
TIME 0:05 - User enters credentials and submits
├─ Firebase.signInWithEmailAndPassword(email, password)
│
TIME 0:10 - Auth success
├─ Firebase updates firebaseUser in AuthProvider
├─ AuthProvider calls loadProfile(uid)
│  └─ Fetches /users/{uid} from Firestore
│     └─ Data includes tenantSlug: "abc-coaching"
├─ setProfile() updates AuthContext
├─ useAuth() hook subscribers re-render
│
TIME 0:15 - Current behavior (WRONG)
├─ nav("/educator") called
├─ Router navigates to /educator on SAME domain
├─ URL changes to www.univ.live/educator
├─ Educator sees their dashboard
│  (but not isolated to their tenant!)
│
TIME 0:15 - DESIRED behavior (AFTER FIX)
├─ Extract tenantSlug from profile: "abc-coaching"
├─ Construct subdomain URL: https://abc-coaching.univ.live
├─ window.location.href = url + "/educator"
├─ Browser performs FULL PAGE RELOAD
├─ New hostname: abc-coaching.univ.live
│
TIME 0:20 - New page load on subdomain
├─ App.tsx mounts context providers:
│  ├─ AuthProvider (Firebase user still in session)
│  │  └─ Reloads profile from Firestore
│  ├─ TenantProvider detects hostname
│  │  ├─ getTenantSlugFromHostname() returns "abc-coaching"
│  │  ├─ Queries /educators where tenantSlug=="abc-coaching"
│  │  └─ Loads tenant profile with educatorId, coachingName, etc.
│  ├─ setTenantDomain=true, setTenantSlug="abc-coaching"
│  └─ AppRoutes renders with isTenantDomain=true
├─ Route matches /educator path
├─ EducatorLayout component loads
│  ├─ Can now access:
│  │  ├─ useAuth() → uid, role, tenantSlug
│  │  └─ useTenant() → tenant profile, isTenantDomain
│  └─ Can filter all queries by educatorId
│
TIME 0:25 - Dashboard fully loaded
└─ Educator can view their students, tests, analytics
   all properly isolated by tenant
```

---

## Summary Diagram

```
                     ┌─────────────────────┐
                     │  Multi-Tenant Flow  │
                     └──────────┬──────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
         ┌────────────┐  ┌────────────┐  ┌──────────────┐
         │ Signup     │  │ Login      │  │ Use Portal   │
         │ (main)     │  │ (main)     │  │ (subdomain)  │
         │            │  │            │  │              │
         │ Creates    │  │ Validates  │  │ Operates on  │
         │ 3 Docs     │  │ Credentials│  │ their tenant │
         │            │  │            │  │              │
         │ Sets:      │  │ Extracts:  │  │ Data filtered│
         │ tenantSlug │  │ tenantSlug │  │ by educatorId│
         │ educatorId │  │ role       │  │              │
         │            │  │            │  │ Multi-tenant │
         │ Redirect:  │  │ Redirect:  │  │ context works│
         │ /educator  │  │ /tenant    │  │              │
         └────────────┘  │ domain     │  └──────────────┘
                         │ /educator  │
                         └────────────┘
```

