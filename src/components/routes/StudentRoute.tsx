import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useTenant } from "@/contexts/TenantProvider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function StudentRoute() {
  const { profile, loading: authLoading } = useAuth();
  const { tenantSlug, isTenantDomain, loading: tenantLoading } = useTenant();

  // 1. Wait for Auth & Tenant to load
  if (authLoading || tenantLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Not Logged In? -> Redirect to Login
  if (!profile) {
    return <Navigate to="/login?role=student" replace />;
  }

  // 3. Not a Student? -> Redirect appropriately
  if (profile.role !== "STUDENT") {
    // If they are an educator trying to access student pages, send them to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 4. THE CRITICAL CHECK: Are they enrolled in THIS website?
  if (isTenantDomain) {
    const enrolledList = profile.enrolledTenants || [];
    
    // Check if current site is in their enrolled list OR matches legacy slug
    const isEnrolled = enrolledList.includes(tenantSlug!) || profile.tenantSlug === tenantSlug;

    if (!isEnrolled) {
      // If not enrolled, kick them out of the PROTECTED route only.
      // Redirect them to the Home Page of this site (which is public).
      return <RedirectToHomeWithError />;
    }
  }

  // 5. All checks passed? Render the requested page.
  return <Outlet />;
}

// Helper component to show toast and redirect safely
function RedirectToHomeWithError() {
  useEffect(() => {
    // Using setTimeout to ensure toast renders after navigation
    setTimeout(() => {
        toast.error("You are not enrolled in this coaching. Please Register first.");
    }, 100);
  }, []);
  
  return <Navigate to="/" replace />;
}
