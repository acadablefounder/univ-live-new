import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Trophy, 
  Sparkles, 
  Video, 
  Users, 
  Shield, 
  Clock, 
  Smartphone,
  Globe,
  Zap,
  BookOpen,
  Award
} from "lucide-react";
import { ButtonWithIcon } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description: "Get personalized course recommendations based on your goals, learning style, and progress.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Track your progress with detailed insights and performance metrics.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Stay motivated with badges, leaderboards, and achievement rewards.",
  },
  {
    icon: Video,
    title: "Live Classes",
    description: "Join interactive live sessions with instructors and fellow learners.",
  },
  {
    icon: Users,
    title: "Community Forums",
    description: "Connect with peers, ask questions, and share knowledge.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Your data is protected with bank-grade encryption and compliance.",
  },
  {
    icon: Clock,
    title: "Learn Anytime",
    description: "Access courses 24/7 from any device, anywhere in the world.",
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Download our app for seamless learning on the go.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Courses available in 20+ languages with subtitles.",
  },
  {
    icon: Zap,
    title: "Fast Performance",
    description: "Lightning-fast loading with optimized video streaming.",
  },
  {
    icon: BookOpen,
    title: "Rich Content",
    description: "Interactive quizzes, assignments, and hands-on projects.",
  },
  {
    icon: Award,
    title: "Certificates",
    description: "Earn verified certificates recognized by top employers.",
  },
];

const Features = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding">
        <div className="container-main">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Powerful Features for <span className="text-primary">Modern Learning</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover all the tools and features that make LearnFlow the most advanced
              learning management system on the market.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card rounded-2xl p-6 border border-border shadow-soft hover-lift cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/pricing">
              <ButtonWithIcon variant="hero" size="xl">
                View Pricing Plans
              </ButtonWithIcon>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Features;
