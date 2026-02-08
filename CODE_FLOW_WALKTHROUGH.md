# Current Code Flow: Detailed Walkthrough

## Scenario 1: Educator Signup (WORKING ✅)

### User Action:
Visit `www.univ.live/signup?role=educator` and submit form

### Code Execution:

#### File: [src/pages/Signup.tsx](src/pages/Signup.tsx)

```typescript
// Line 30: Detect we're on main domain
const { isTenantDomain, tenantSlug, tenant, loading: tenantLoading } = useTenant();
// isTenantDomain = false (no subdomain in www.univ.live)
// tenantSlug = null

// Line 33: Set initial role
const [role, setRole] = useState<RoleUI>(roleParam === "educator" ? "educator" : "student");
// role = "educator" (from ?role=educator param)

// Line 34: effectiveRole determined
const effectiveRole: RoleUI = isTenantDomain ? "student" : role;
// effectiveRole = "educator" (isTenantDomain is false)

// User fills form with:
// - name: "John Doe"
// - coachingName: "ABC Coaching"
// - desiredSlug: "my-coaching"
// - email: "john@example.com"
// - password: "SecurePass123"

// Line 128: onSubmit called
if (effectiveRole === "student") {
  // Not student, skip this block
}

// Line 130: Check if on tenant domain
if (isTenantDomain) {
  // false, skip
}

// Line 145: Normalize slug
const slug = normSlug(desiredSlug);
// normSlug("my-coaching") = "my-coaching"
// (trim, lowercase, remove special chars)

// Line 146: Check if slug available
if (!(await checkSlugAvailable(slug))) throw new Error("Tenant slug already taken");
// checkSlugAvailable queries: doc(db, "tenants", "my-coaching")
// Returns: doc doesn't exist → available ✓

// Line 149: Create Firebase account
const cred = await createUserWithEmailAndPassword(auth, email, password);
// Firebase Auth response:
// {
//   user: {
//     uid: "edu123abc456def",
//     email: "john@example.com",
//     ...
//   }
// }

// Line 150: Update Firebase profile
await updateProfile(cred.user, { displayName: "John Doe" });

// Line 152: Get uid
const uid = cred.user.uid;  // "edu123abc456def"

// Lines 154-163: Create /users/{uid} document
await setDoc(doc(db, "users", uid), {
  uid: "edu123abc456def",
  role: "EDUCATOR",
  displayName: "John Doe",
  email: "john@example.com",
  tenantSlug: "my-coaching",  // ← KEY: Stored here
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}, { merge: true });

// Lines 165-174: Create /educators/{uid} document
await setDoc(doc(db, "educators", uid), {
  tenantSlug: "my-coaching",  // ← KEY: Stored here
  coachingName: "ABC Coaching",
  phone: "",
  email: "john@example.com",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}, { merge: true });

// Lines 176-182: Create /tenants/my-coaching document
await setDoc(doc(db, "tenants", "my-coaching"), {
  educatorId: "edu123abc456def",  // ← KEY: Links back
  tenantSlug: "my-coaching",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}, { merge: true });

// Line 184: Show success
toast.success("Educator account created!");

// Line 185: Redirect to educator dashboard
nav("/educator");
// React Router navigates to: www.univ.live/educator
// Still on main domain ← This is fine after signup
```

### Database State After Signup:
```
Firestore:
├── /users/edu123abc456def
│   ├── role: "EDUCATOR"
│   └── tenantSlug: "my-coaching"
│
├── /educators/edu123abc456def
│   └── tenantSlug: "my-coaching"
│
└── /tenants/my-coaching
    └── educatorId: "edu123abc456def"
```

---

## Scenario 2: Educator Login (PARTIALLY WORKING ⚠️)

### User Action:
Visit `www.univ.live/login?role=educator` and submit credentials

### Code Execution:

#### File: [src/pages/Login.tsx](src/pages/Login.tsx)

```typescript
// Line 20: Read context
const { isTenantDomain, tenantSlug, loading: tenantLoading } = useTenant();
// isTenantDomain = false (on www.univ.live)
// tenantSlug = null

// Line 25: Set initial role
const [role, setRole] = useState<RoleUI>(initialRole);
// role = "educator" (from ?role=educator param)

// Line 30: effectiveRole
const effectiveRole: RoleUI = isTenantDomain ? "student" : role;
// effectiveRole = "educator" (isTenantDomain is false)

// User enters:
// - email: "john@example.com"
// - password: "SecurePass123"

// Line 53: onSubmit called
const cred = await signInWithEmailAndPassword(auth, email, password);
// Firebase validates password ✓
// Returns: uid = "edu123abc456def"

// Line 56-60: Load user profile
const snap = await getDoc(doc(db, "users", cred.user.uid));
const data: any = snap.exists() ? snap.data() : {};
// data = {
//   uid: "edu123abc456def",
//   role: "EDUCATOR",
//   tenantSlug: "my-coaching",  ← WE CAN ACCESS THIS
//   email: "john@example.com",
//   createdAt: timestamp,
//   ...
// }

// Line 62: Extract role from database
const roleDb = String(data?.role || "STUDENT").toUpperCase();
// roleDb = "EDUCATOR"

// Lines 63-67: Extract enrolledTenants
const enrolledTenants: string[] = Array.isArray(data?.enrolledTenants)
  ? data.enrolledTenants
  : typeof data?.tenantSlug === "string"
  ? [data.tenantSlug]
  : [];
// enrolledTenants = ["my-coaching"]

// Line 70: Check if on tenant domain
if (isTenantDomain) {
  // false, skip
}

// Line 97: Check if educator/admin
if (!(roleDb === "EDUCATOR" || roleDb === "ADMIN")) {
  toast.error("This account is not an educator account.");
  await auth.signOut();
  return;
}
// Passes ✓

// Line 114: Currently redirects (ISSUE HERE ❌)
toast.success("Logged in!");
nav("/educator");
// Redirects to: www.univ.live/educator
// Still on main domain!
// TenantProvider still has isTenantDomain=false
// Components can't filter by tenantSlug properly
```

### What's Missing (❌ THE PROBLEM):

```typescript
// After line 113 (before nav), we should:

// MISSING CODE:
const tenantSlug = data?.tenantSlug;
if (!tenantSlug) {
  toast.error("Educator account misconfigured");
  await auth.signOut();
  return;
}

// OPTION 1: For localhost
if (window.location.hostname === "localhost") {
  nav(`/educator?tenant=${tenantSlug}`);
}
// OPTION 2: For production (MISSING)
else {
  const protocol = window.location.protocol; // "https:"
  const appDomain = "univ.live";  // Hardcoded currently
  const educatorUrl = `${protocol}//${tenantSlug}.${appDomain}/educator`;
  window.location.href = educatorUrl;
  // Would navigate to: https://my-coaching.univ.live/educator
}
```

### Current Behavior:
```
✅ Auth works correctly
✅ User profile loaded from Firestore
✅ tenantSlug extracted from profile
❌ Stays on www.univ.live
❌ TenantProvider doesn't detect tenant domain
❌ isTenantDomain remains false
❌ Educator dashboard not isolated by tenant
```

---

## Scenario 3: Student Signup on Tenant Subdomain (WORKING ✅)

### User Action:
Visit `my-coaching.univ.live/signup` and submit form

### Code Execution:

#### File: [src/pages/Signup.tsx](src/pages/Signup.tsx)

```typescript
// Line 27: On subdomain, TenantProvider initializes
// getTenantSlugFromHostname() detects "my-coaching"
const { isTenantDomain, tenantSlug, tenant, loading: tenantLoading } = useTenant();
// isTenantDomain = true ✓
// tenantSlug = "my-coaching" ✓
// tenant = {
//   educatorId: "edu123abc456def",
//   tenantSlug: "my-coaching",
//   coachingName: "ABC Coaching",
//   ...
// } ✓

// Line 33: Detect role from URL param
const roleParam = (searchParams.get("role") || "").toLowerCase();
// roleParam = "" (no role param when visiting /signup from landing)

// Line 34: Set initial role
const [role, setRole] = useState<RoleUI>(roleParam === "educator" ? "educator" : "student");
// role = "student" (default for no param)

// Line 35: effectiveRole
const effectiveRole: RoleUI = isTenantDomain ? "student" : role;
// effectiveRole = "student" (isTenantDomain is true, forces student)

// User fills form:
// - name: "Jane Student"
// - email: "jane@example.com"
// - password: "StudentPass123"
// (No coaching name or slug fields shown for students)

// Line 128: onSubmit called
if (effectiveRole === "student") {
  // YES, execute student signup logic ✓

  // Line 129: Verify we're on tenant domain
  if (!isTenantDomain || !tenantSlug || !tenant?.educatorId) {
    toast.error("Students must signup from a valid coaching URL.");
    setLoading(false);
    return;
  }
  // All checks pass ✓

  // Line 135: Create Firebase account
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Firebase Auth response: uid = "stu456def789ghi"

  // Line 136: Update Firebase profile
  await updateProfile(cred.user, { displayName: "Jane Student" });

  // Lines 138-152: Create /users/{uid} document
  await setDoc(
    doc(db, "users", "stu456def789ghi"),
    {
      uid: "stu456def789ghi",
      role: "STUDENT",
      displayName: "Jane Student",
      email: "jane@example.com",
      educatorId: tenant.educatorId,  // "edu123abc456def" ← from tenant
      tenantSlug: tenantSlug,          // "my-coaching" ← from URL
      enrolledTenants: arrayUnion(tenantSlug),  // ["my-coaching"]
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Lines 154-165: Call backend to register student
  const token = await cred.user.getIdToken();
  await callRegisterStudent(token).catch(() => {});
  // POST /api/tenant/register-student
  // Body: { tenantSlug: "my-coaching" }
  // Auth: Bearer {idToken}

  // Line 166: Show success
  toast.success("Account created!");

  // Line 167: Redirect to student dashboard
  nav("/student");
  // React Router navigates to: my-coaching.univ.live/student ✓
  // AppRoutes matches isTenantDomain=true → /student route
  // StudentLayout loads with full tenant context
}
```

### Database State After Student Signup:
```
Firestore:
└── /users/stu456def789ghi
    ├── uid: "stu456def789ghi"
    ├── role: "STUDENT"
    ├── displayName: "Jane Student"
    ├── email: "jane@example.com"
    ├── educatorId: "edu123abc456def"  ← Filters to educator
    ├── tenantSlug: "my-coaching"
    ├── enrolledTenants: ["my-coaching"]
    └── createdAt: timestamp
```

---

## Scenario 4: Student Login on Tenant Subdomain (WORKING ✅)

### User Action:
Visit `my-coaching.univ.live/login` and submit credentials

### Code Execution:

#### File: [src/pages/Login.tsx](src/pages/Login.tsx)

```typescript
// Line 17: TenantProvider detects subdomain
const { isTenantDomain, tenantSlug, loading: tenantLoading } = useTenant();
// isTenantDomain = true ✓
// tenantSlug = "my-coaching" ✓

// Line 26: Set initial role
const [role, setRole] = useState<RoleUI>(initialRole);
// role = "student" (default, no role param on tenant subdomain)

// Line 30: effectiveRole
const effectiveRole: RoleUI = isTenantDomain ? "student" : role;
// effectiveRole = "student" (isTenantDomain forces student)
// Note: Prevents accidental educator login on student domain ✓

// User enters:
// - email: "jane@example.com"
// - password: "StudentPass123"

// Line 53: Authenticate
const cred = await signInWithEmailAndPassword(auth, email, password);
// Firebase validates → uid = "stu456def789ghi"

// Lines 56-67: Load profile and validate
const snap = await getDoc(doc(db, "users", "stu456def789ghi"));
const data = {
  uid: "stu456def789ghi",
  role: "STUDENT",
  displayName: "Jane Student",
  email: "jane@example.com",
  educatorId: "edu123abc456def",
  enrolledTenants: ["my-coaching"],
  ...
};

const roleDb = "STUDENT";
const enrolledTenants = ["my-coaching"];

// Line 70: Check if on tenant domain (YES)
if (isTenantDomain) {
  // Line 71: Verify tenant slug exists
  if (!tenantSlug) {
    toast.error("Invalid coaching URL (tenant slug missing).");
    await auth.signOut();
    return;
  }
  // Passes ✓

  // Line 76: Verify user is not educator
  if (roleDb === "EDUCATOR" || roleDb === "ADMIN") {
    toast.error("Educators must login from the main website...");
    await auth.signOut();
    return;
  }
  // Passes ✓ (role is STUDENT)

  // Line 82: Verify student is enrolled in this tenant
  if (!enrolledTenants.includes(tenantSlug)) {
    toast.error("You are not enrolled in this coaching...");
    await auth.signOut();
    return;
  }
  // Passes ✓ (enrolledTenants = ["my-coaching"])

  // Lines 85-87: Register student in backend
  const token = await cred.user.getIdToken();
  await registerStudent(token).catch(() => {});
  // POST /api/tenant/register-student
  // Body: { tenantSlug: "my-coaching" }

  // Line 88: Show success
  toast.success("Welcome back!");

  // Line 89: Redirect to student dashboard
  nav("/student");
  // React Router navigates to: my-coaching.univ.live/student ✓
  // StudentLayout loads with tenant context
  return;
}
```

### What's Validated:
✅ Student exists and can authenticate
✅ Student has correct role
✅ Student is enrolled in this specific tenant
✅ Student can't login to wrong tenant's subdomain
✅ Educators can't pretend to be students

---

## Scenario 5: Educator Tries to Login on Student Domain (BLOCKED ✅)

### User Action:
Visit `my-coaching.univ.live/login?role=educator` and submit credentials

### Code Execution:

```typescript
// Line 17: TenantProvider detects subdomain
const { isTenantDomain, tenantSlug, ... } = useTenant();
// isTenantDomain = true
// tenantSlug = "my-coaching"

// Line 26: Initial role from ?role=educator param
const [role, setRole] = useState<RoleUI>("educator");

// Line 30: effectiveRole
const effectiveRole: RoleUI = isTenantDomain ? "student" : role;
// effectiveRole = "student" ← FORCED TO STUDENT! ✓

// User enters credentials

// Line 53: Firebase validates

// Line 70: Check if on tenant domain (YES)
if (isTenantDomain) {
  // ... validation ...
  
  // Line 76: roleDb should be "EDUCATOR"
  if (roleDb === "EDUCATOR" || roleDb === "ADMIN") {
    toast.error("Educators must login from the main website, not the coaching URL.");
    await auth.signOut();
    return; ← BLOCKED! ✓
  }
}
```

### Result:
❌ Educators cannot login on tenant subdomains
✅ They're forced to use main domain (www.univ.live)
✅ Then redirected to their specific subdomain

---

## Scenario 6: Student Tries to Login on Main Domain (BLOCKED ✅)

### User Action:
Visit `www.univ.live/login?role=student` and submit credentials

### Code Execution:

```typescript
// Line 17: TenantProvider on main domain
const { isTenantDomain, tenantSlug, ... } = useTenant();
// isTenantDomain = false
// tenantSlug = null

// Line 26: Role from ?role=student
const [role, setRole] = useState<RoleUI>("student");

// Line 30: effectiveRole
const effectiveRole: RoleUI = isTenantDomain ? "student" : role;
// effectiveRole = "student" (takes param value since not tenant domain)

// User enters credentials

// Line 53: Firebase validates

// Line 70: NOT on tenant domain, skip that block

// Line 97: Check educator role
if (!(roleDb === "EDUCATOR" || roleDb === "ADMIN")) {
  toast.error("This account is not an educator account.");
  await auth.signOut();
  return; ← BLOCKED! ✓
}
```

### Result:
❌ Students cannot login on main domain
✅ They're directed to their coaching URL (e.g., my-coaching.univ.live)
✅ Prevents mixed authentication

---

## Summary: Current State

| Scenario | Status | Notes |
|----------|--------|-------|
| Educator Signup | ✅ Works | Creates 3 Firestore docs with tenantSlug |
| Educator Login | ⚠️ Partial | Auth works, but doesn't redirect to subdomain |
| Educator Access Own Subdomain | ⚠️ Not Tested | Should work, but depends on login redirect |
| Student Signup (Subdomain) | ✅ Works | Auto-enrolls in tenant, loads educator ID |
| Student Login (Subdomain) | ✅ Works | Validates enrollment, prevents wrong tenant |
| Student Login (Main Domain) | ✅ Blocked | Correctly prevents main domain login |
| Educator Login (Subdomain) | ✅ Blocked | Correctly forces educator to main domain |
| TenantProvider Detection | ✅ Works | Correctly detects subdomains and main domain |
| Context Isolation | ✅ Works | educatorId filtering enables multi-tenancy |

---

## What Needs to be Fixed

Only **ONE** issue:

**[src/pages/Login.tsx](src/pages/Login.tsx) Line 114**

Change:
```typescript
nav("/educator");
```

To:
```typescript
const tenantSlug = data?.tenantSlug;
if (!tenantSlug) {
  toast.error("Educator account misconfigured (missing tenant slug).");
  await auth.signOut();
  return;
}

if (window.location.hostname === "localhost") {
  nav(`/educator?tenant=${tenantSlug}`);
} else {
  const protocol = window.location.protocol;
  const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";
  const educatorUrl = `${protocol}//${tenantSlug}.${appDomain}/educator`;
  window.location.href = educatorUrl;
}
```

That's it! Everything else is already working correctly.

