import { motion } from "framer-motion";
import { ButtonWithIcon } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="section-padding">
      <div className="container-main">
        <motion.div
          className="relative bg-peach rounded-3xl lg:rounded-[2.5rem] p-10 lg:p-16 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-green-300/50 rounded-full blur-sm" />
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-primary/30 rounded-lg rotate-12" />
          <div className="absolute top-1/2 right-1/4 w-12 h-6 bg-purple-300/50 rounded-full" />

          {/* Floating cards */}
          <motion.div
            className="absolute left-[5%] bottom-[20%] hidden lg:block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
              <div className="text-xs text-muted-foreground mb-1">Performance</div>
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12" viewBox="0 0 50 50">
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="4"
                    />
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      strokeDasharray="100"
                      strokeDashoffset="20"
                      strokeLinecap="round"
                      transform="rotate(-90 25 25)"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    80%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute right-[10%] top-[15%] hidden lg:block"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-yellow-100 rounded-2xl p-4 shadow-card rotate-6">
              <div className="text-sm font-medium italic">Learn Python</div>
              <div className="text-sm font-medium italic">within 30 Days</div>
            </div>
          </motion.div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Stay Ahead in Education and Unlock Your Full Potential!
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Want to stay updated on the latest trends in online learning? Join the LearnFlow
              newsletter and receive expert insights, new course launches, and exclusive offers!
            </p>

            {/* Email Input */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-6 py-4 rounded-full border border-border bg-card shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <ButtonWithIcon variant="heroOutline" size="lg" className="w-full sm:w-auto whitespace-nowrap">
                Subscribe
              </ButtonWithIcon>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
