import React, { createContext, useContext, useEffect, useState } from "react";
import { getTenantSlugFromHostname } from "@/lib/tenant";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthProvider";

// Define the shape of the Tenant Data
export type TenantProfile = {
  educatorId: string;
  tenantSlug: string;
  coachingName?: string;
  tagline?: string;
  contact?: { phone?: string; email?: string; address?: string };
  socials?: Record<string, string | null>;
  websiteConfig?: any;
};

type TenantContextValue = {
  tenant: TenantProfile | null;
  tenantSlug: string | null;
  loading: boolean;
  isTenantDomain: boolean;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth(); // AuthProvider MUST wrap TenantProvider
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const tenantSlug = getTenantSlugFromHostname();
  const isTenantDomain = !!tenantSlug;

  // 1. Load Tenant Data (Coaching Info)
  useEffect(() => {
    let mounted = true;
    async function loadTenant() {
      setLoading(true);
      setTenant(null);
      
      // If we are on main domain (localhost or univ.live), no tenant to load
      if (!tenantSlug) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "educators"), where("slug", "==", tenantSlug));
        const snaps = await getDocs(q);
        
        if (mounted && !snaps.empty) {
          const d = snaps.docs[0].data() as any;
          setTenant({
            educatorId: snaps.docs[0].id,
            tenantSlug: d.slug, 
            coachingName: d.coachingName,
            tagline: d.tagline,
            websiteConfig: d.websiteConfig,
          });
        }
      } catch (err) {
        console.error("Failed to load tenant", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTenant();
    return () => { mounted = false; };
  }, [tenantSlug]);

  // NOTE: The previous security useEffect that forced signOut is REMOVED.
  // Security is now handled by the StudentRoute component.

  const value: TenantContextValue = {
    tenant,
    tenantSlug,
    loading,
    isTenantDomain,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
