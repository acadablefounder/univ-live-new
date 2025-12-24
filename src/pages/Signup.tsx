// src/pages/Signup.tsx
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, GraduationCap, Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import { signUpEducator, signUpStudent } from "@/services/authService";
import { useTenant } from "@/contexts/TenantProvider";

function slugify(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9- ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomSuffix() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
}

export default function Signup() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const [role, setRole] = useState<"educator" | "student">(roleParam === "student" ? "student" : "educator");

  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coachingName, setCoachingName] = useState("");
  const [city, setCity] = useState("");
  const [coachingCode, setCoachingCode] = useState(""); // fallback if no subdomain
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const heroTitle = useMemo(() => {
    return role === "educator" ? "Launch Your Website in 6 Hours" : "Start Your Exam Prep Today";
  }, [role]);

  const heroDesc = useMemo(() => {
    return role === "educator"
      ? "AI-powered websites and management tools for modern coaching institutes."
      : "Access thousands of practice tests and track your progress with AI analytics.";
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      if (role === "educator") {
        if (!coachingName.trim() || !city.trim()) {
          toast.error("Please enter Coaching Name and City.");
          setIsLoading(false);
          return;
        }

        // auto tenantSlug derived from coachingName (+ city for uniqueness)
        const base = slugify(`${coachingName}-${city}`) || slugify(coachingName) || "coaching";
        let tenant = base;

        // Try signup; if slug taken, retry with suffix automatically
        let lastErr: any = null;
        for (let i = 0; i < 5; i++) {
          try {
            await signUpEducator({
              name: name.trim(),
              email: email.trim(),
              password,
              coachingName: coachingName.trim(),
              tenantSlug: tenant,
            });
            lastErr = null;
            break;
          } catch (err: any) {
            lastErr = err;
            const msg = String(err?.message || "");
            if (msg.toLowerCase().includes("slug is already taken")) {
              tenant = `${base}-${randomSuffix()}`;
              continue;
            }
            throw err;
          }
        }

        if (lastErr) throw lastErr;

        toast.success("Account created! Redirecting to dashboard...");
        navigate("/educator/dashboard", { replace: true });
        return;
      }

      // Student
      // If on a tenant subdomain, use that tenantSlug; otherwise require coachingCode.
      const effectiveTenant = tenantSlug || coachingCode.trim();
      if (!effectiveTenant) {
        toast.error("Please enter Coaching Access Code to join your coaching (or sign up from coaching subdomain).");
        setIsLoading(false);
        return;
      }

      await signUpStudent({
        name: name.trim(),
        email: email.trim(),
        password,
        tenantSlug: effectiveTenant,
      });

      toast.success("Account created! Redirecting...");
      navigate("/student/dashboard", { replace: true });
    } catch (err: any) {
      const msg =
        typeof err?.message === "string"
          ? err.message.replace("Firebase: ", "")
          : "Signup failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... the same UI markup you already have (unchanged) ...
    // For brevity here the UI remains identical; paste your existing Signup JSX after this change.
    // (Make sure to keep all inputs wired to the updated state variables above.)
    <div className="min-h-screen bg-background flex">
      {/* Left - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white max-w-md">
            <h2 className="text-4xl font-display font-bold mb-6">{heroTitle}</h2>
            <p className="text-lg text-white/80">{heroDesc}</p>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      {/* Right - Form (copy your existing JSX bindings here) */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-8"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <span className="text-white font-display font-bold text-lg">U</span>
            </div>
            <span className="font-display font-bold text-2xl">
              <span className="gradient-text">UNIV</span>
              <span className="text-foreground">.LIVE</span>
            </span>
          </Link>

          <h1 className="text-3xl font-display font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-8">
            {role === "educator" ? "Start your 14-day free trial" : "Join your coaching and start practicing"}
          </p>

          {/* Role Selector */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setRole("educator")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === "educator"
                  ? "border-brand-start bg-brand-start/5"
                  : "border-border hover:border-brand-start/50"
              }`}
              type="button"
            >
              <Building2 className={`w-5 h-5 ${role === "educator" ? "text-brand-blue" : "text-muted-foreground"}`} />
              <span className={`font-medium ${role === "educator" ? "text-foreground" : "text-muted-foreground"}`}>
                Educator
              </span>
            </button>
            <button
              onClick={() => setRole("student")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === "student"
                  ? "border-brand-start bg-brand-start/5"
                  : "border-border hover:border-brand-start/50"
              }`}
              type="button"
            >
              <GraduationCap className={`w-5 h-5 ${role === "student" ? "text-brand-blue" : "text-muted-foreground"}`} />
              <span className={`font-medium ${role === "student" ? "text-foreground" : "text-muted-foreground"}`}>
                Student
              </span>
            </button>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                className="h-12"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="h-12"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {role === "educator" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="coachingName">Coaching/Institute Name *</Label>
                  <Input
                    id="coachingName"
                    type="text"
                    placeholder="Your coaching name"
                    className="h-12"
                    required
                    value={coachingName}
                    onChange={(e) => setCoachingName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Your city"
                    className="h-12"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </>
            )}

            {role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="coachingCode">Coaching Access Code (Optional)</Label>
                <Input
                  id="coachingCode"
                  type="text"
                  placeholder="Enter code if you have one"
                  className="h-12"
                  value={coachingCode}
                  onChange={(e) => setCoachingCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  For now, this is required to link you to the right coaching. Later it will auto-detect from subdomain.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                className="h-12"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="h-12 pr-12"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {role === "educator" && (
              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-brand-start/50 transition-colors cursor-pointer"
                  onClick={() => toast.info("Logo upload will be connected to Firebase Storage next.")}
                  role="button"
                  tabIndex={0}
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" className="text-brand-blue hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-brand-blue hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full group"
              disabled={isLoading}
            >
              {isLoading ? (
                "Creating account..."
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Social Signup (UI only for now) */}
          <Button
            variant="outline"
            className="w-full h-12"
            type="button"
            onClick={() => toast.info("Google signup will be added next.")}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Login Link */}
          <p className="text-center text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to={`/login?role=${role}`} className="text-brand-blue hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
        {/* Place the same Signup form JSX you already had (inputs bound to state variables above). */}
        {/* This file preserves all UI. */}
        {/* ... */}
      </div>
    </div>
  );
}

