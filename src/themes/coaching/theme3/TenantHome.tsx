import React from "react";
import { useTenant } from "@/contexts/TenantProvider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function TenantHomeTheme3() {
  const { tenant, loading } = useTenant();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!tenant) return null;

  const config = tenant.websiteConfig || {};
  const coachingName = config.coachingName || "Your Institute";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-3xl border p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold">Theme 3 is coming soon</h1>
        <p className="text-muted-foreground">
          {coachingName} selected Theme 3, but it’s not available yet. Please switch to Theme 1 or Theme 2 for now.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/signup">Sign up</Link></Button>
        </div>
      </div>
    </div>
  );
}

