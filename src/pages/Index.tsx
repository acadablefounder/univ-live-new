import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { StepsSection } from "@/components/sections/StepsSection";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { TeamSection } from "@/components/sections/TeamSection";
import { CTASection } from "@/components/sections/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <StepsSection />
      <BenefitsSection />
      <PricingSection />
      <TestimonialsSection />
      <TeamSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
