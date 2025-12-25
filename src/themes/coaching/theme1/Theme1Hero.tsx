import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Star, Users, Award, BookOpen, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantProvider";

export default function Theme1Hero() {
  const { tenant } = useTenant();

  if (!tenant) return null;

  // --- 1. Access the Config ---
  const config = tenant.websiteConfig || {};
  
  // --- 2. Define Variables with Fallbacks ---
  const coachingName = config.coachingName || "Your Institute";
  const tagline = config.tagline || "Empowering the next generation of leaders";
  const heroImage = config.heroImage; // We will handle null later
  const stats = config.stats || [];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pastel-mint/30 via-background to-pastel-lavender/30 py-16 lg:py-24">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* --- Left Column: Text Content --- */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-muted/50 border shadow-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium">Admissions Open 2024-25</span>
            </div>

            {/* DYNAMIC COACHING NAME */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Welcome to <br />
              <span className="text-primary">{coachingName}</span>
            </h1>

            {/* DYNAMIC TAGLINE */}
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              {tagline}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/courses">
                <Button size="lg" className="gradient-bg text-white shadow-lg shadow-primary/20 h-12 px-8 rounded-full">
                  Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-full">
                <Play className="mr-2 h-4 w-4 fill-current" /> Watch Demo
              </Button>
            </div>

            {/* DYNAMIC STATS */}
            {stats.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 pt-8 border-t">
                {stats.map((stat: any, index: number) => (
                  <StatCard key={index} icon={getIcon(stat.icon)} stat={stat} />
                ))}
              </div>
            )}
          </motion.div>

          {/* --- Right Column: Hero Image --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-card aspect-square max-w-md mx-auto">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={coachingName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground">
                   <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                   <p className="text-sm">No Hero Image Set</p>
                </div>
              )}
              
              {/* Floating Badge Example (Static for visual appeal) */}
              <motion.div
                animate={{ y: [-10, 0, -10] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute top-8 -right-4 bg-white dark:bg-card rounded-xl shadow-lg p-3 flex items-center gap-3"
              >
                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Achievement</p>
                  <p className="text-sm font-bold">#1 Rated</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Helper to map string icon names to Lucide components
function getIcon(name: string) {
  switch (name) {
    case "Users": return <Users className="h-5 w-5 text-primary" />;
    case "Trophy": return <Award className="h-5 w-5 text-primary" />;
    case "BookOpen": return <BookOpen className="h-5 w-5 text-primary" />;
    case "Star": return <Star className="h-5 w-5 text-primary" />;
    default: return <Users className="h-5 w-5 text-primary" />;
  }
}

function StatCard({ icon, stat }: { icon: React.ReactNode; stat: any }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="text-left">
        <p className="font-bold text-xl leading-none">{stat.value}</p>
        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
      </div>
    </div>
  );
}