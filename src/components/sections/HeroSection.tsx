import { motion } from "framer-motion";
import { ButtonWithIcon } from "@/components/ui/button";
import { Star, Award } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden section-padding">
      {/* Floating dashboard cards - left */}
      <motion.div
        className="absolute left-[-5%] top-1/3 hidden lg:block"
        initial={{ opacity: 0, x: -50, rotate: -12 }}
        animate={{ opacity: 1, x: 0, rotate: -12 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="w-48 h-64 bg-card rounded-3xl shadow-card border border-border p-4 transform hover:scale-105 transition-transform">
          <div className="text-xs text-muted-foreground mb-2">Performance</div>
          <div className="relative w-full h-24 flex items-center justify-center">
            <svg className="w-20 h-20" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="8"
                strokeDasharray="251.2"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset="50"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span className="absolute text-2xl font-bold">80%</span>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-2">Performance</div>
          <div className="text-center text-xs text-green-600 mt-1">You did a great job!</div>
        </div>
      </motion.div>

      {/* Floating dashboard cards - right */}
      <motion.div
        className="absolute right-[-5%] top-1/4 hidden lg:block"
        initial={{ opacity: 0, x: 50, rotate: 8 }}
        animate={{ opacity: 1, x: 0, rotate: 8 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="w-52 h-48 bg-card rounded-3xl shadow-card border border-border p-4 transform hover:scale-105 transition-transform">
          <div className="text-xs text-muted-foreground mb-2">Time Spent</div>
          <div className="text-2xl font-bold text-primary">13.6 Hours</div>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" /> Study
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted" /> Exams
            </span>
          </div>
          <div className="flex items-end gap-1 mt-4 h-16">
            {[40, 60, 30, 80, 45, 70, 55, 90, 50, 65, 75, 40].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/20 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <div className="container-main relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Trust badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Award className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Trusted by over 50,000+ students
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
            Your Ultimate LMS for{" "}
            <span className="text-primary">Seamless Learning</span> & Growth
          </h1>

          {/* Subtext */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform the way you teach and learn with our AI-driven Learning Management
            System. Manage courses, track progress, and engage learners like never before.
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ButtonWithIcon variant="hero" size="xl">
              Get Started for Free
            </ButtonWithIcon>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Clutch</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-muted-foreground">4.5/5</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-green-500 text-green-500" />
              <span className="font-bold text-foreground">Trustpilot</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-green-500 flex items-center justify-center">
                    <Star className="h-3 w-3 fill-white text-white" />
                  </div>
                ))}
              </div>
              <span className="text-muted-foreground">4.5/5</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
