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
  Search,
} from "lucide-react";

import { useTenant } from "@/contexts/TenantProvider";
import { db } from "@/lib/firebase";
import { collection, documentId, getDocs, limit, orderBy, query, where } from "firebase/firestore";

import { Button } from "@/components/ui/button";
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
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf8] text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf8] text-stone-900">
        <div className="text-center px-6">
          <h2 className="text-3xl font-medium tracking-tight">Coaching not found</h2>
          <p className="text-stone-500 mt-2">
            This coaching website does not exist. Check the URL or contact support.
          </p>
        </div>
      </div>
    );
  }

  const config = tenant.websiteConfig || {};

  const coachingName = config.coachingName || tenant.coachingName || "Your Institute";
  const tagline = config.tagline || tenant.tagline || "Learn smarter. Score higher.";
  // Put your default fallback image link here
const defaultHeroImage = "https://plus.unsplash.com/premium_photo-1683887034491-f58b4c4fca72?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
const finalHeroImage = config.heroImage || tenant.heroImage || defaultHeroImage;

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
            answer: "Once you purchase (or enroll if free), the test series appears in your student dashboard under 'My Tests'.",
          },
          {
            question: "Can I access content on mobile?",
            answer: "Yes. The platform is mobile-responsive and works smoothly on phones and tablets.",
          },
          {
            question: "Do you provide performance analytics?",
            answer: "Yes. Students get score insights and progress tracking inside the dashboard.",
          },
          {
            question: "Is there any demo / preview available?",
            answer: "Many educators provide free tests or previews. Check the Featured section or login to see what's included.",
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
        if (rows.length > 0) setActiveTestId(rows[0].id);
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
    { label: "Programs", href: "#tests" },
    { label: "Impact", href: "#results" },
    { label: "Faculty", href: "#faculty" },
    { label: "Contact", href: "#faq" },
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
    <div id="top" className="min-h-screen bg-[#fcfaf8] text-stone-900 font-sans selection:bg-[#3424d1] selection:text-white">
      
      {/* TOP INFO BAR (Mimicking Image 1 Orange Header) */}
      <div className="hidden md:flex bg-[#eb5a28] text-white/90 text-sm py-2 px-6 items-center justify-between font-medium">
        <div className="flex items-center gap-6">
          {tenant.contact?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {tenant.contact.phone}
            </div>
          )}
          {tenant.contact?.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {tenant.contact.email}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          {tenant.contact?.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {tenant.contact.address}
            </div>
          )}
          <span className="opacity-75 hidden lg:inline-block">|</span>
          <span className="hidden lg:inline-block">Empowering Futures</span>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#fcfaf8]/90 backdrop-blur-md border-b border-stone-200">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3424d1] text-white shadow-sm">
              <span className="text-lg font-bold">
                {coachingName?.trim()?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <span className="text-xl font-medium tracking-tight text-stone-900">
              {coachingName}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[15px] font-medium text-stone-600 transition-colors hover:text-stone-900"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium text-[15px]">
              <Search className="h-4 w-4" /> Search
            </button>
            <Link to="/login?role=student">
              <Button variant="outline" className="hidden lg:inline-flex rounded-full px-6 border-stone-300 text-stone-900 font-medium hover:bg-stone-100">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="rounded-full px-6 bg-[#1a1a1a] text-white hover:bg-[#333] font-medium hidden sm:inline-flex">
                Apply Now
              </Button>
            </Link>

            <button className="md:hidden text-stone-900" onClick={() => setMobileOpen((s) => !s)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-stone-200 bg-[#fcfaf8] px-4 py-4 md:hidden shadow-lg">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-lg font-medium text-stone-600 hover:text-stone-900 border-b border-stone-100"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4">
              <Link to="/login?role=student" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full rounded-full border-stone-300">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full bg-[#1a1a1a] text-white">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO (Mimicking Image 1 Layout) */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto z-10 relative">
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl sm:text-7xl lg:text-[5.5rem] font-medium leading-[1.05] tracking-tight text-stone-900"
            >
              Your Journey <br />
              Begins at {coachingName.split(' ')[0]}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 sm:mt-8 max-w-xl text-lg sm:text-xl text-stone-500 leading-relaxed font-light"
            >
              {tagline}. These words reflect a strong educational mission and personal growth journey in our programs.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4"
            >
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-8 h-14 text-base font-medium bg-[#3424d1] hover:bg-[#281baf] text-white">
                  Start Your Journey
                </Button>
              </Link>
              <span className="text-sm font-medium text-stone-500 mt-2 sm:mt-0 sm:ml-4">
                Trusted by {(stats[0]?.value) || "thousands of"} students
              </span>
            </motion.div>
          </div>

          {/* Absolute decorative/layout images similar to Image 1 */}
          <div className="mt-16 relative w-full h-[400px] sm:h-[500px] lg:h-auto lg:mt-0">
             {/* Left floating image (using heroImage if exists) */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:absolute lg:top-[-450px] lg:-left-4 w-[280px] h-[360px] lg:w-[320px] lg:h-[440px] rounded-sm overflow-hidden shadow-2xl mx-auto lg:mx-0 z-0 hidden lg:block"
            >
              <img src={finalHeroImage} alt="Students" className="w-full h-full object-cover" />
            </motion.div>

             {/* Right floating image (Placeholder context) */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:absolute lg:top-[-320px] lg:-right-4 w-[280px] h-[360px] lg:w-[320px] lg:h-[400px] rounded-sm overflow-hidden shadow-2xl mx-auto mt-8 lg:mt-0 lg:mx-0 z-0 hidden lg:block"
            >
               <img 
		  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
		  alt="Hero Decoration" 
		  className="w-full h-full object-cover" 
		/>
            </motion.div>
          </div>

        </div>
      </section>

      {/* HIGHLIGHTS / ABOUT (Mimicking Image 2 Layout) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1] text-stone-900">
                Innovative Education <br className="hidden sm:block" />
                for Global Impact
              </h2>
            </div>
            <div className="flex flex-col gap-6 lg:pt-4">
              <p className="text-lg sm:text-xl text-stone-600 leading-relaxed font-light">
                At {coachingName}, we are committed to delivering an education experience that prepares students for the challenges of a rapidly changing world. Since our founding, we have stood for academic excellence.
              </p>
              <Link to="/about" className="inline-flex items-center text-[#3424d1] font-medium hover:underline">
                Read More About Us <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-2 gap-8 items-end">
            <div className="aspect-[4/5] md:aspect-square w-full max-w-sm overflow-hidden rounded-sm bg-stone-100">
               <img 
		  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
		  alt="About Highlight" 
		  className="w-full h-full object-cover" 
		/>
            </div>
            <div className="aspect-[16/10] w-full overflow-hidden rounded-sm bg-stone-100">
               <img 
		  src="https://images.unsplash.com/photo-1565689157206-0fddef7589a2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
		  alt="Campus" 
		  className="w-full h-full object-cover" 
		/>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM CENTER / FEATURED (Mimicking Image 3 Layout) */}
      <section id="tests" className="py-24 bg-[#fcfaf8]">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-stone-900 mb-16">
            Our Academic Programs
          </h2>

          {loadingFeatured ? (
            <div className="flex justify-center text-stone-500 py-20">
              <Loader2 className="h-6 w-6 animate-spin mr-3" /> Loading programs...
            </div>
          ) : featured.length === 0 ? (
            <div className="py-20 text-stone-500 font-light text-xl">
              No programs available right now.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              
              {/* Left Side: Dynamic Image Area based on active test */}
              <div className="sticky top-32 overflow-hidden rounded-sm aspect-square lg:aspect-[4/5] bg-stone-100 shadow-xl order-last lg:order-first">
                {featured.find(f => f.id === activeTestId)?.coverImage ? (
                  <img 
                    key={activeTestId}
                    src={featured.find(f => f.id === activeTestId)?.coverImage} 
                    alt="Program cover" 
                    className="w-full h-full object-cover animate-in fade-in duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400">
                    <FileText className="h-16 w-16 opacity-30" />
                  </div>
                )}
              </div>

              {/* Right Side: List of Programs */}
              <div className="flex flex-col">
                <div className="flex flex-col mb-12">
                  {featured.slice(0, 6).map((t) => {
                    const isActive = t.id === activeTestId;
                    return (
                      <button
                        key={t.id}
                        onMouseEnter={() => setActiveTestId(t.id)}
                        onClick={() => setActiveTestId(t.id)}
                        className={`text-left py-6 border-b border-stone-200 transition-colors duration-300 ${
                          isActive ? "text-stone-900 border-stone-400" : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        <h3 className="text-2xl sm:text-3xl font-medium tracking-tight">{t.title}</h3>
                      </button>
                    )
                  })}
                </div>

                {/* Info block for active item */}
                <div className="bg-white p-8 rounded-sm shadow-sm border border-stone-100 min-h-[200px]">
                  {featured.map(t => (
                    t.id === activeTestId && (
                      <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h4 className="text-xl font-medium mb-3">Learn {t.subject || t.title} from the best</h4>
                        <p className="text-stone-600 font-light leading-relaxed mb-6 line-clamp-3">
                          {t.description || "The program is designed to equip students with a strong foundation in the chosen subject, preparing them for advanced challenges."}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className={`text-lg font-medium ${t.price === "Included" || t.price == 0 ? "text-[#eb5a28]" : "text-stone-900"}`}>
                            {t.price === "Included" || t.price == 0 ? "Free Access" : `₹${t.price}`}
                          </span>
                          <Link to="/login?role=student">
                            <Button className="rounded-full bg-[#1a1a1a] text-white hover:bg-[#333]">
                              Apply Now
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    )
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS (Mimicking Image 4 Layout) */}
      <section id="reviews" className="py-24 bg-[#1c1815] text-[#f5f0e6]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Left large text */}
            <div>
              <h2 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-medium tracking-tight leading-[1.05]">
                Happy students <br />
                sharing experiences
              </h2>
            </div>

            {/* Right single highlighted testimonial or list */}
            <div>
              <p className="text-stone-400 mb-8 font-light uppercase tracking-widest text-sm">
                Inspired Journeys, Honest Reflections.
              </p>

              {(!testimonials || testimonials.length === 0) ? (
                 <p className="text-stone-500 font-light">No reflections added yet.</p>
              ) : (
                <div className="space-y-16">
                  {testimonials.slice(0, 2).map((t, idx) => (
                    <motion.div 
                      key={`${t.name}-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="flex flex-col gap-6"
                    >
                      <p className="text-2xl sm:text-3xl font-light leading-snug">
                        "{t.text}"
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <Avatar className="h-14 w-14 border border-stone-700">
                          <AvatarImage src={t.avatar} />
                          <AvatarFallback className="bg-stone-800 text-stone-200">{initials(t.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-lg text-white">{t.name}</p>
                          <p className="text-sm text-stone-400 mt-0.5">
                            {t.course || "Student"}
                            {t.rating ? ` • ${t.rating} Stars` : ""}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS / NEWS (Mimicking Image 5 Layout for "Results/Highlights") */}
      <section id="results" className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-stone-900 mb-16 text-center">
            Highlights & Announcements
          </h2>

          <div className="grid lg:grid-cols-3 gap-8">
             {/* Left Large Card */}
             {achievements.length > 0 && (
               <div className="lg:col-span-1 lg:row-span-2 flex flex-col group cursor-pointer">
                  <div className="aspect-[3/4] overflow-hidden rounded-sm bg-stone-100 mb-4 relative">
                     {/* Placeholder for achievement image */}
                     <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent z-10" />
                     <img 
			  src="https://plus.unsplash.com/premium_photo-1770480460854-b1170b7b282a?q=80&w=895&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
			  alt="Main Highlight" 
			  className="w-full h-full object-cover" 
			/>
                     <div className="absolute bottom-6 left-6 z-20 pr-6">
                        <h3 className="text-2xl font-medium text-white leading-tight">{achievements[0].title}</h3>
                        <p className="text-white/80 mt-2 line-clamp-2 text-sm">{achievements[0].description}</p>
                     </div>
                  </div>
               </div>
             )}

             {/* Right Grid Smaller Cards */}
             <div className="lg:col-span-2 grid sm:grid-cols-2 gap-8">
               {(achievements.length ? achievements.slice(1) : [
                 { title: "Structured Test Series", description: "Chapter-wise, subject-wise, and full mocks." },
                 { title: "Expert Faculty", description: "Guidance that improves accuracy and speed." },
                 { title: "Performance Insights", description: "Track improvement and focus weak areas." },
                 { title: "Global Curriculum", description: "Meeting international standards." }
               ]).slice(0, 4).map((a, idx) => (
                 <div key={`${a.title}-${idx}`} className="flex flex-col group cursor-pointer">
                   <div className="aspect-video overflow-hidden rounded-sm bg-stone-100 mb-4 relative">
                      {/* Using generic placeholders for achievements lacking images to match Image 5 style */}
                      <img 
			  src="https://plus.unsplash.com/premium_photo-1713229181330-1d1671608945?q=80&w=862&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
			  alt="Secondary Highlight" 
			  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
			/>
                   <span className="text-xs uppercase tracking-wider text-stone-500 mb-2 font-medium">Highlight</span>
                   <h3 className="text-xl font-medium text-stone-900 mb-2">{a.title}</h3>
                   <p className="text-stone-600 font-light line-clamp-2">{a.description}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* FACULTY SECTION (Clean Grid Style) */}
      <section id="faculty" className="py-24 bg-[#fcfaf8] border-t border-stone-200">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-stone-900">Leadership & Faculty</h2>
            <p className="text-stone-500 mt-4 max-w-2xl font-light text-lg">Learn from experienced educators dedicated to your success.</p>
          </div>

          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {(faculty.length ? faculty : []).slice(0, 8).map((f, idx) => (
              <div key={`${f.name}-${idx}`} className="flex flex-col">
                <div className="aspect-[4/5] overflow-hidden rounded-sm bg-stone-100 mb-5">
                   {f.image ? (
                     <img src={f.image} alt={f.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400">
                        <AvatarFallback className="text-4xl rounded-none bg-transparent">{initials(f.name)}</AvatarFallback>
                     </div>
                   )}
                </div>
                <h3 className="text-xl font-medium text-stone-900">{f.name}</h3>
                <p className="text-sm text-[#eb5a28] font-medium mt-1 uppercase tracking-wide">
                  {[f.designation, f.subject].filter(Boolean).join(" • ") || "Faculty"}
                </p>
                {f.bio && (
                  <p className="text-stone-600 font-light mt-3 line-clamp-3 text-sm">
                    {f.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {faculty.length === 0 && (
             <div className="text-center text-stone-500 font-light">Faculty profiles will appear here once added.</div>
          )}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-stone-900 mb-12 text-center">
            Common Inquiries
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((f, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="rounded-none border-b border-stone-200 px-0">
                <AccordionTrigger className="text-left text-lg font-medium text-stone-900 hover:no-underline hover:text-[#3424d1] py-6">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-stone-600 font-light text-base leading-relaxed pb-6">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a1a1a] text-stone-400 py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-12 md:grid-cols-4 md:gap-8 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm">
                  <span className="text-lg font-bold">{coachingName?.trim()?.[0]?.toUpperCase() || "U"}</span>
                </div>
                <span className="text-2xl font-medium tracking-tight text-white">{coachingName}</span>
              </div>
              <p className="text-stone-400 font-light leading-relaxed">
                {tagline}
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-6 uppercase tracking-wider text-sm">Explore</h4>
              <div className="space-y-3 font-light">
                <Link className="block hover:text-white transition-colors" to="/">Home</Link>
                <Link className="block hover:text-white transition-colors" to="/courses">Programs</Link>
                <Link className="block hover:text-white transition-colors" to="/login?role=student">Student Portal</Link>
                <Link className="block hover:text-white transition-colors" to="/signup">Apply Now</Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
              <div className="space-y-4 font-light">
                {tenant.contact?.address && (
                  <p className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-stone-500" />
                    <span>{tenant.contact.address}</span>
                  </p>
                )}
                {tenant.contact?.phone && (
                  <p className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-stone-500" />
                    <a className="hover:text-white transition-colors" href={`tel:${tenant.contact.phone}`}>{tenant.contact.phone}</a>
                  </p>
                )}
                {tenant.contact?.email && (
                  <p className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-stone-500" />
                    <a className="hover:text-white transition-colors" href={`mailto:${tenant.contact.email}`}>{tenant.contact.email}</a>
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-6 uppercase tracking-wider text-sm">Connect</h4>
              <div className="flex gap-4 mb-8">
                {Object.entries(socials).map(([k, v]) => {
                  const Icon = socialIconMap[k];
                  if (!Icon) return null;
                  return (
                    <a
                      key={k}
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-stone-800 p-3 rounded-full hover:bg-[#3424d1] hover:text-white transition-all"
                      title={k}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
              <p className="text-xs font-light text-stone-500">
                Powered by UNIV.LIVE to help educators publish and scale.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-light">
            <span>© {new Date().getFullYear()} {coachingName}. All rights reserved.</span>
            <div className="flex gap-6">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
