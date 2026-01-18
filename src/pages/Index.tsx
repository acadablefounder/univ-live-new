import { useTenant } from "@/contexts/TenantProvider";

// Global homepage (existing UI – unchanged)
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { DashboardPreview } from "@/components/sections/DashboardPreview";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { StepsSection } from "@/components/sections/StepsSection";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { IntegrationsSection } from "@/components/sections/IntegrationsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";

// Tenant website (theme)
import Theme1Layout from "@/themes/coaching/theme1/Theme1Layout";
import Theme1Hero from "@/themes/coaching/theme1/Theme1Hero";
import Theme1Stats from "@/themes/coaching/theme1/Theme1Stats";
import Theme1CoursesPreview from "@/themes/coaching/theme1/Theme1CoursesPreview";
import Theme1Testimonials from "@/themes/coaching/theme1/Theme1Testimonials";
import Theme1CTA from "@/themes/coaching/theme1/Theme1CTA";

const Index = () => {
  const { isTenantDomain, loading, tenant } = useTenant();

  // ⏳ Wait for tenant to load
  if (isTenantDomain && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  // ❌ Invalid tenant slug
  if (isTenantDomain && !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-semibold">
          Coaching website not found
        </h1>
      </div>
    );
  }

  // 🟦 TENANT WEBSITE
  if (isTenantDomain && tenant) {
    return (
      <Theme1Layout>
        <Theme1Hero />
        <Theme1Stats />
        <Theme1CoursesPreview />
        <Theme1Testimonials />
        <Theme1CTA />
      </Theme1Layout>
    );
  }

  // 🟢 GLOBAL HOMEPAGE (univ.live)
  return (
    <Layout>
      <HeroSection />
      <DashboardPreview />
      <FeatureCards />
      <StepsSection />
      <BenefitsSection />
      <AboutSection />
      <IntegrationsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
