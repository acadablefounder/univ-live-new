import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Clock, Users, Trophy } from "lucide-react";

const benefits = [
  { icon: Sparkles, title: "AI-Powered Recommendations", description: "Get personalized learning paths tailored to your goals." },
  { icon: Zap, title: "Lightning Fast", description: "Optimized performance for seamless learning experience." },
  { icon: Shield, title: "Secure & Private", description: "Your data is protected with enterprise-grade security." },
  { icon: Clock, title: "Learn Anytime", description: "Access your courses 24/7 from any device." },
  { icon: Users, title: "Community Support", description: "Join a thriving community of learners." },
  { icon: Trophy, title: "Earn Certificates", description: "Get recognized for your achievements." },
];

export function BenefitsSection() {
  return (
    <section className="section-padding overflow-hidden">
      <div className="container-main">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Benefits of LearnFlow — Why Learners Love It!
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover the features that make LearnFlow the preferred choice for thousands of students worldwide.
          </p>
        </motion.div>

        {/* Fanned Cards Visual */}
        <div className="relative flex items-center justify-center min-h-[400px] lg:min-h-[500px]">
          {benefits.map((benefit, index) => {
            const totalCards = benefits.length;
            const centerIndex = (totalCards - 1) / 2;
            const offset = index - centerIndex;
            const rotation = offset * 8;
            const translateX = offset * 60;
            const translateY = Math.abs(offset) * 20;
            const zIndex = totalCards - Math.abs(offset);
            const blur = Math.abs(offset) > 1 ? Math.abs(offset) * 0.5 : 0;
            const scale = 1 - Math.abs(offset) * 0.05;

            return (
              <motion.div
                key={benefit.title}
                className="absolute w-72 bg-card rounded-3xl p-6 border border-border shadow-card"
                style={{
                  zIndex,
                  filter: blur > 0 ? `blur(${blur}px)` : "none",
                }}
                initial={{ opacity: 0, y: 50, rotate: rotation, x: translateX }}
                whileInView={{
                  opacity: 1,
                  y: translateY,
                  rotate: rotation,
                  x: translateX,
                  scale,
                }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{
                  scale: scale + 0.05,
                  zIndex: 10,
                  filter: "blur(0px)",
                  transition: { duration: 0.2 },
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
