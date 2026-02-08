import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantProvider";

type RoleUI = "student" | "educator";

export default function Login() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const { isTenantDomain, tenantSlug, loading: tenantLoading } = useTenant();

  const roleParam = (searchParams.get("role") || "").toLowerCase();
  const initialRole: RoleUI = roleParam === "educator" ? "educator" : "student";

  const [role, setRole] = useState<RoleUI>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectiveRole: RoleUI = isTenantDomain ? "student" : role;

  const title = useMemo(() => {
    if (tenantLoading) return "Loading…";
    if (isTenantDomain) return `Login to ${tenantSlug || "your coaching"}`;
    return effectiveRole === "educator" ? "Educator Login" : "Student Login";
  }, [tenantLoading, isTenantDomain, tenantSlug, effectiveRole]);

  async function registerStudent(token: string) {
    if (!tenantSlug) return;
    await fetch("/api/tenant/register-student", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenantSlug }),
    });
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // load profile doc
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const data: any = snap.exists() ? snap.data() : {};

      const roleDb = String(data?.role || "STUDENT").toUpperCase();
      const enrolledTenants: string[] = Array.isArray(data?.enrolledTenants)
        ? data.enrolledTenants
        : typeof data?.tenantSlug === "string"
        ? [data.tenantSlug]
        : [];

      // ---- tenant domain: students only ----
      if (isTenantDomain) {
        if (!tenantSlug) {
          toast.error("Invalid coaching URL (tenant slug missing).");
          await auth.signOut();
          return;
        }

        if (roleDb === "EDUCATOR" || roleDb === "ADMIN") {
          toast.error("Educators must login from the main website, not the coaching URL.");
          await auth.signOut();
          return;
        }

        if (!enrolledTenants.includes(tenantSlug)) {
          toast.error("You are not enrolled in this coaching. Please signup on this coaching URL first.");
          await auth.signOut();
          return;
        }

        const token = await cred.user.getIdToken();
        await registerStudent(token).catch(() => {});
        toast.success("Welcome back!");
        nav("/student");
        return;
      }

      // ---- main domain: educators only (students must use coaching URL) ----
      if (effectiveRole === "student") {
        toast.error("Students must login from their coaching URL (tenant website).");
        await auth.signOut();
        return;
      }

      if (!(roleDb === "EDUCATOR" || roleDb === "ADMIN")) {
        toast.error("This account is not an educator account.");
        await auth.signOut();
        return;
      }

      const tenantSlugDb = data?.tenantSlug;
      if (!tenantSlugDb) {
        toast.error("Educator account misconfigured (missing tenant slug).");
        await auth.signOut();
        return;
      }

      toast.success("Logged in!");

      // ✅ NEW: Redirect to subdomain
      if (window.location.hostname === "localhost") {
        // For local development: append ?tenant parameter
        nav(`/educator?tenant=${tenantSlugDb}`);
      } else {
        // For production: redirect to subdomain
        const protocol = window.location.protocol; // https:
        const educatorUrl = `${protocol}//${tenantSlugDb}.univ.live/educator`;
        window.location.href = educatorUrl;
      }
    } catch (error: any) {
      console.error(error);
      let msg = "Failed to login";
      if (error.code === "auth/invalid-credential") msg = "Invalid email or password";
      else msg = error.message || msg;
      toast.error(msg);
      await auth.signOut().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          {!isTenantDomain && (
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant={effectiveRole === "student" ? "default" : "outline"}
                onClick={() => setRole("student")}
              >
                Student
              </Button>
              <Button
                type="button"
                variant={effectiveRole === "educator" ? "default" : "outline"}
                onClick={() => setRole("educator")}
              >
                Educator
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link className="underline" to={`/signup?role=${effectiveRole}`}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

