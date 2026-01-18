import { motion } from "framer-motion";
import { ButtonWithIcon } from "@/components/ui/button";
import { Check, Clock, ThumbsUp, Users, BookOpen, Award, Globe } from "lucide-react";

const stats = [
  { value: "1M+", label: "Active Learners", icon: Users },
  { value: "10K+", label: "Courses Available", icon: BookOpen },
  { value: "25K+", label: "Certificates Issued", icon: Award },
  { value: "50+", label: "Countries Reached", icon: Globe },
];

const features = [
  { icon: Clock, text: "24/7 Access to All Courses" },
  { icon: ThumbsUp, text: "98% Student Satisfaction Rate" },
];

export function AboutSection() {
  return (
    <section className="section-padding">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Trust Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
                  >
                    <span className="text-xs font-medium text-primary">
                      {["JD", "AK", "MR"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Trusted by 50,000+ learners</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Your Gateway to Smarter, Faster Learning
            </h2>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              LearnFlow is designed to transform how you learn and grow. With AI-powered
              recommendations, interactive courses, and a supportive community, you'll achieve
              your goals faster than ever before.
            </p>

            {/* Feature List */}
            <div className="space-y-4 mb-8">
              {features.map((feature) => (
                <div key={feature.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <ButtonWithIcon variant="heroOutline" size="lg">
              Learn More
            </ButtonWithIcon>
          </motion.div>

          {/* Right Content - Image & Stats */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image Placeholder */}
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-peach to-orange-light overflow-hidden mb-6">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-foreground/80">Collaborative Learning Environment</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-card rounded-2xl p-4 border border-border shadow-soft text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
