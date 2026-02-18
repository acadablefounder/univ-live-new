import React from "react";
import { Link } from "react-router-dom";
import { useTenant } from "@/contexts/TenantProvider";
import { Button } from "@/components/ui/button";

export default function TenantHomeTheme2() {
  const { tenant, loading } = useTenant();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!tenant) return null;

  const config = tenant.websiteConfig || {};
  const coachingName = config.coachingName || "Your Institute";
  const tagline = config.tagline || "Build your future with structured learning";
  const heroImage = config.heroImage || "";

  const stats: Array<{ label: string; value: string }> = (config.stats || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-foreground text-background grid place-items-center font-bold">
              {coachingName.slice(0, 1).toUpperCase()}
            </div>
            <div className="font-semibold">{coachingName}</div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faculty" className="hover:text-foreground">Instructor</a>
            <a href="#faq" className="hover:text-foreground">FAQs</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>

          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-10 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full border text-xs text-muted-foreground">
            Earn better results with structure
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            {tagline}
          </h1>

          <p className="text-muted-foreground max-w-xl">
            Turn your preparation into confidence. Practice tests, smart analytics, and guided improvement — all in one place.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-xl">
              <Link to="/signup">Start learning</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/courses">Browse courses</Link>
            </Button>
          </div>

          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              {stats.map((s, idx) => (
                <div key={idx} className="rounded-2xl border p-4">
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="rounded-3xl border overflow-hidden shadow-sm bg-muted">
            {heroImage ? (
              <img src={heroImage} alt="Hero" className="w-full h-[360px] object-cover" />
            ) : (
              <div className="w-full h-[360px] grid place-items-center text-muted-foreground">
                Hero media (image/video) will appear here
              </div>
            )}
          </div>

          <div className="absolute -bottom-4 right-6 rounded-2xl border bg-background px-4 py-3 text-sm shadow-sm">
            <div className="font-medium">Free preview available</div>
            <div className="text-xs text-muted-foreground">Login / signup to access.</div>
          </div>
        </div>
      </section>

      {/* Sections (placeholders; Lovable theme2 will replace these) */}
      <section id="faculty" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold">Instructor</h2>
        <p className="text-muted-foreground mt-2">
          This section will be fully replaced by the Lovable Theme2 build (using the same Website Settings data).
        </p>
      </section>

      <section id="faq" className="max-w-6xl mx-auto px-4 py-14 border-t">
        <h2 className="text-2xl font-bold">FAQs</h2>
        <p className="text-muted-foreground mt-2">
          Theme2 FAQ design will come from Lovable.
        </p>
      </section>

      <section id="contact" className="max-w-6xl mx-auto px-4 py-14 border-t">
        <h2 className="text-2xl font-bold">Contact</h2>
        <p className="text-muted-foreground mt-2">
          Add contact details from Website Settings (same config).
        </p>
      </section>

      <footer className="border-t py-10">
        <div className="max-w-6xl mx-auto px-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {coachingName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

