import React, { createContext, useContext, useEffect, useState } from "react";
import { getTenantSlugFromHostname } from "@/lib/tenant";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthProvider";

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
  isTenantDomain: boolean;
  loading: boolean;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth(); // Get logged-in user's profile
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTenantDomain, setIsTenantDomain] = useState(false);

  useEffect(() => {
    // 1. First, try to get tenant slug from hostname (subdomain)
    const slugFromHostname = getTenantSlugFromHostname(window.location.hostname);
    
    if (slugFromHostname) {
      // On tenant subdomain (e.g., coaching.univ.live)
      setTenantSlug(slugFromHostname);
      setIsTenantDomain(true);
    } else if (profile?.tenantSlug) {
      // Fallback: if on main domain but educator is logged in, use their tenantSlug
      // This allows educator dashboard to access tenant data from main domain
      setTenantSlug(profile.tenantSlug);
      setIsTenantDomain(false);
    } else {
      // No tenant context available
      setTenantSlug(null);
      setIsTenantDomain(false);
    }
  }, [profile?.tenantSlug]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!tenantSlug) {
        setTenant(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, "educators"), where("tenantSlug", "==", tenantSlug), limit(1));
        const snap = await getDocs(q);

        if (!alive) return;

        if (snap.empty) {
          setTenant(null);
        } else {
          const docSnap = snap.docs[0];
          const data: any = docSnap.data() || {};
          setTenant({
            educatorId: docSnap.id,
            tenantSlug,
            coachingName: data.coachingName,
            tagline: data.tagline,
            contact: data.contact,
            socials: data.socials,
            websiteConfig: data.websiteConfig,
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [tenantSlug]);

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

