// src/themes/coaching/theme2/TenantHome.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  Menu,
  X,
  Play,
  FileText,
  Star,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Twitter,
  Globe,
  MessageCircle,
  Send,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";

import { useTenant } from "@/contexts/TenantProvider";
import { db } from "@/lib/firebase";
import { collection, documentId, getDocs, limit, orderBy, query, where } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type StatItem = { label: string; value: string; icon?: string };
type AchievementItem = { title: string; description: string; icon?: string };
type FacultyItem = { name: string; subject?: string; designation?: string; experience?: string; bio?: string; image?: string };
type TestimonialItem = { name: string; course?: string; rating?: number; text: string; avatar?: string };
type FAQItem = { question: string; answer: string };

type TestSeries = {
  id: string;
  title: string;
  description: string;
  price: string | number;
  coverImage?: string;
  subject?: string;
  difficulty?: string;
  testsCount?: number;
  durationMinutes?: number;
};

function initials(name: string) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");
}

function isTruthyUrl(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

export default function TenantHomeTheme2() {
  const { tenant, loading } = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [featured, setFeatured] = useState<TestSeries[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-2xl font-bold">Coaching not found</h2>
          <p className="text-muted-foreground mt-2">
            This coaching website does not exist. Check the URL or contact support.
          </p>
        </div>
      </div>
    );
  }

  const config = tenant.websiteConfig || {};

  const coachingName = config.coachingName || tenant.coachingName || "Your Institute";
  const tagline = config.tagline || tenant.tagline || "Learn smarter. Score higher.";
  const heroImage: string | undefined = config.heroImage;

  const stats: StatItem[] = Array.isArray(config.stats) ? config.stats : [];
  const achievements: AchievementItem[] = Array.isArray(config.achievements) ? config.achievements : [];
  const faculty: FacultyItem[] = Array.isArray(config.faculty) ? config.faculty : [];
  const testimonials: TestimonialItem[] = Array.isArray(config.testimonials) ? config.testimonials : [];

  const faqs: FAQItem[] =
    Array.isArray(config.faqs) && config.faqs.length > 0
      ? config.faqs
      : [
          {
            question: "How do I access the test series after purchase?",
            answer:
              "Once you purchase (or enroll if free), the test series appears in your student dashboard under 'My Tests'.",
          },
          {
            question: "Can I access content on mobile?",
            answer:
              "Yes. The platform is mobile-responsive and works smoothly on phones and tablets.",
          },
          {
            question: "Do you provide performance analytics?",
            answer:
              "Yes. Students get score insights and progress tracking inside the dashboard.",
          },
          {
            question: "Is there any demo / preview available?",
            answer:
              "Many educators provide free tests or previews. Check the Featured section or login to see what's included.",
          },
        ];

  const socials: Record<string, string> = useMemo(() => {
    const s = (config.socials || {}) as Record<string, string>;
    const cleaned: Record<string, string> = {};
    Object.entries(s).forEach(([k, v]) => {
      if (isTruthyUrl(v)) cleaned[k] = v.trim();
    });
    return cleaned;
  }, [config.socials]);

  const educatorId = tenant.educatorId;
  const featuredIds: string[] = Array.isArray(config.featuredTestIds) ? config.featuredTestIds : [];
  const featuredKey = featuredIds.join(",");

  useEffect(() => {
    if (!educatorId) return;

    async function loadFeatured() {
      setLoadingFeatured(true);
      try {
        let qRef;

        if (featuredIds.length > 0) {
          const safeIds = featuredIds.slice(0, 10);
          qRef = query(
            collection(db, "educators", educatorId, "my_tests"),
            where(documentId(), "in", safeIds)
          );
        } else {
          qRef = query(
            collection(db, "educators", educatorId, "my_tests"),
            orderBy("createdAt", "desc"),
            limit(4)
          );
        }

        const snap = await getDocs(qRef);
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as TestSeries[];

        setFeatured(rows);
      } catch {
        setFeatured([]);
      } finally {
        setLoadingFeatured(false);
      }
    }

    loadFeatured();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [educatorId, featuredKey]);

  const navLinks = [
    { label: "Home", href: "#top" },
    { label: "Test Series", href: "#tests" },
    { label: "Results", href: "#results" },
    { label: "Faculty", href: "#faculty" },
    { label: "Reviews", href: "#reviews" },
    { label: "FAQs", href: "#faq" },
  ];

  const socialIconMap: Record<string, any> = {
    instagram: Instagram,
    youtube: Youtube,
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    website: Globe,
    telegram: Send,
    whatsapp: MessageCircle,
  };

  return (
    <div id="top" className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur-lg">
        <div className="container mx-auto px-4 flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-primary via-primary/80 to-accent text-white shadow-sm">
              <span className="text-sm font-bold">
                {coachingName?.trim()?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <span className="text-lg font-bold text-foreground font-display">
              {coachingName}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login?role=student">
              <Button variant="outline" size="sm" className="hidden md:inline-flex rounded-full px-5">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="rounded-full px-5 bg-gradient-to-r from-primary via-primary/80 to-accent text-white hover:opacity-90">
                Get Started
              </Button>
            </Link>

            <button className="ml-1 md:hidden" onClick={() => setMobileOpen((s) => !s)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link to="/login?role=student" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="mt-2 w-full rounded-full">
                Log in
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary))_0,transparent_45%),radial-gradient(circle_at_80%_30%,hsl(var(--accent))_0,transparent_40%)]" />
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {tagline}
              </span>

              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Unlock{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  better ranks
                </span>{" "}
                with {coachingName}
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Explore structured test series, expert faculty guidance, and performance insights — all designed to move your score up.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <a href="#tests">
                  <Button
                    size="lg"
                    className="rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent px-8 text-base text-white hover:opacity-90"
                  >
                    Explore Test Series
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>

                <Link to="/login?role=student">
                  <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Student Login
                  </Button>
                </Link>
              </div>

              {/* Mini stats */}
              {(stats?.length ? stats : []).length > 0 && (
                <div className="flex flex-wrap gap-6 border-t border-border pt-6">
                  {(stats || []).slice(0, 6).map((s, idx) => (
                    <div key={`${s.label}-${idx}`}>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary via-primary/60 to-accent opacity-10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border bg-card shadow-lg">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={coachingName}
                    className="w-full object-cover aspect-[16/11]"
                  />
                ) : (
                  <div className="aspect-[16/11] w-full flex items-center justify-center text-muted-foreground bg-muted">
                    <div className="text-center">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No hero image set</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS (uses Achievements as highlight cards) */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <Badge variant="secondary" className="mb-3">Why students choose us</Badge>
              <h2 className="text-3xl font-bold">Built for consistency</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Same data as other themes — just a cleaner, modern presentation.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(achievements.length ? achievements : [
              { title: "Structured Test Series", description: "Chapter-wise, subject-wise, and full mocks.", icon: "Star" },
              { title: "Expert Faculty", description: "Guidance that improves accuracy and speed.", icon: "Users" },
              { title: "Performance Insights", description: "Track improvement and focus weak areas.", icon: "BookOpen" },
            ]).slice(0, 6).map((a, idx) => (
              <motion.div
                key={`${a.title}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
              >
                <Card className="h-full border-border/60 bg-card/60 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {a.description}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAM CENTER / FEATURED TEST SERIES */}
      <section id="tests" className="py-16 bg-muted/20 border-y border-border/60">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-10">
            <div>
              <Badge variant="secondary" className="mb-3">Featured</Badge>
              <h2 className="text-3xl font-bold">Exam Center</h2>
              <p className="text-muted-foreground mt-2">
                Featured test series picked by the educator.
              </p>
            </div>

            <Link to="/courses">
              <Button variant="outline" className="rounded-full">
                View all series
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="py-14 flex justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading test series...
            </div>
          ) : featured.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">
              No featured series available right now.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featured.slice(0, 8).map((t) => (
                <Card key={t.id} className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {t.coverImage ? (
                      <img src={t.coverImage} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <FileText className="h-10 w-10 opacity-40" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold leading-snug line-clamp-1">{t.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
                          {t.description}
                        </p>
                      </div>
                      {t.subject ? (
                        <Badge variant="outline" className="shrink-0">{t.subject}</Badge>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                      <span className={`font-bold ${t.price === "Included" || t.price == 0 ? "text-green-600" : ""}`}>
                        {t.price === "Included" || t.price == 0 ? "Free" : `₹${t.price}`}
                      </span>
                      <Link to="/login?role=student">
                        <Button size="sm" className="rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent text-white hover:opacity-90">
                          Enroll
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ACHIEVEMENTS (Results) */}
      <section id="results" className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <Badge variant="secondary" className="mb-3">Proof</Badge>
            <h2 className="text-3xl font-bold">Results & Highlights</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Achievements added in Website Settings appear here.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(achievements.length ? achievements : []).slice(0, 9).map((a, idx) => (
              <motion.div
                key={`${a.title}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
              >
                <Card className="h-full border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {a.description}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {(!achievements || achievements.length === 0) && (
            <div className="mt-8 text-sm text-muted-foreground">
              No achievements added yet. Educator can add them in Website Settings → Awards.
            </div>
          )}
        </div>
      </section>

      {/* FACULTY */}
      <section id="faculty" className="py-16 bg-muted/20 border-y border-border/60">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <Badge variant="secondary" className="mb-3">Team</Badge>
            <h2 className="text-3xl font-bold">Meet the Faculty</h2>
            <p className="text-muted-foreground mt-2">
              Faculty added in Website Settings appear here.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(faculty.length ? faculty : []).slice(0, 9).map((f, idx) => (
              <Card key={`${f.name}-${idx}`} className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={f.image} />
                      <AvatarFallback>{initials(f.name)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="font-semibold leading-none">{f.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {[f.designation, f.subject].filter(Boolean).join(" • ") || "Faculty"}
                      </p>
                      {f.experience ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Experience: {f.experience}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {f.bio ? (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-4">
                      {f.bio}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          {(!faculty || faculty.length === 0) && (
            <div className="mt-8 text-sm text-muted-foreground">
              No faculty added yet. Educator can add them in Website Settings → Faculty.
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Reviews</Badge>
            <h2 className="text-3xl font-bold">What students say</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Testimonials added in Website Settings appear here.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {(testimonials.length ? testimonials : []).slice(0, 9).map((t, idx) => (
              <Card key={`${t.name}-${idx}`} className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={t.avatar} />
                      <AvatarFallback>{initials(t.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold leading-none">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {t.course || "Student"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: Math.max(1, Math.min(5, t.rating || 5)) }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!testimonials || testimonials.length === 0) && (
            <div className="mt-8 text-sm text-muted-foreground text-center">
              No testimonials added yet. Educator can add them in Website Settings → Reviews.
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-muted/20 border-y border-border/60">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">FAQs</Badge>
            <h2 className="text-3xl font-bold">Your questions, answered</h2>
            <p className="text-muted-foreground mt-2">
              Common questions about the platform and access.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="rounded-xl border border-border/60 bg-background px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl border border-border/60 bg-gradient-to-r from-primary via-primary/80 to-accent p-8 md:p-12 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_10%,white_0,transparent_45%),radial-gradient(circle_at_80%_60%,white_0,transparent_40%)]" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold">
                  Ready to start preparing?
                </h3>
                <p className="text-white/85 mt-3 text-lg">
                  Join students learning with <span className="font-semibold">{coachingName}</span>.
                  Login to access your dashboard and start tests.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Link to="/login?role=student">
                    <Button size="lg" variant="secondary" className="rounded-full">
                      Student Login
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  <Link to="/courses">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      Browse Series
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(stats.length ? stats : [
                  { label: "Learners", value: "10,000+" },
                  { label: "Selections", value: "1,200+" },
                  { label: "Tests", value: "300+" },
                  { label: "Mentors", value: "20+" },
                ]).slice(0, 4).map((s, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold mb-1">{s.value}</div>
                    <p className="text-sm text-white/80">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="font-bold text-lg">{coachingName}</div>
              <p className="text-sm text-muted-foreground mt-2">{tagline}</p>
              <div className="flex gap-3 mt-4">
                {Object.entries(socials).map(([k, v]) => {
                  const Icon = socialIconMap[k];
                  if (!Icon) return null;
                  return (
                    <a
                      key={k}
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                      title={k}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-semibold mb-3">Links</div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link className="block hover:text-foreground" to="/">Home</Link>
                <Link className="block hover:text-foreground" to="/courses">Test Series</Link>
                <Link className="block hover:text-foreground" to="/login?role=student">Login</Link>
                <Link className="block hover:text-foreground" to="/signup">Signup</Link>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-3">Contact</div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {tenant.contact?.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a className="hover:text-foreground" href={`tel:${tenant.contact.phone}`}>{tenant.contact.phone}</a>
                  </div>
                ) : null}
                {tenant.contact?.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a className="hover:text-foreground" href={`mailto:${tenant.contact.email}`}>{tenant.contact.email}</a>
                  </div>
                ) : null}
                {tenant.contact?.address ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{tenant.contact.address}</span>
                  </div>
                ) : null}
                {!tenant.contact?.phone && !tenant.contact?.email && !tenant.contact?.address ? (
                  <span>Contact info not set.</span>
                ) : null}
              </div>
            </div>

            <div>
              <div className="font-semibold mb-3">Powered by</div>
              <p className="text-sm text-muted-foreground">
                UNIV.LIVE helps educators publish test series, onboard students, and track progress at scale.
              </p>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} {coachingName}. All rights reserved.</span>
            <span>Powered by UNIV.LIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

