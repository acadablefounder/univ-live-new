import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Users, Target, Heart, Award } from "lucide-react";
import { ButtonWithIcon } from "@/components/ui/button";
import { Link } from "react-router-dom";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're on a mission to make quality education accessible to everyone, everywhere.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "We build for learners and educators, putting their needs at the center of everything.",
  },
  {
    icon: Heart,
    title: "Passion for Learning",
    description: "We believe in the transformative power of education and lifelong learning.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We strive for excellence in every course, feature, and interaction.",
  },
];

const stats = [
  { value: "2019", label: "Founded" },
  { value: "150+", label: "Team Members" },
  { value: "1M+", label: "Learners" },
  { value: "50+", label: "Countries" },
];

const About = () => {
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
              About <span className="text-primary">LearnFlow</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We're building the future of education — one learner at a time. Our AI-powered
              platform helps millions of people achieve their learning goals.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-card rounded-2xl p-6 border border-border shadow-soft text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Story Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  LearnFlow was founded in 2019 with a simple belief: education should be
                  accessible, engaging, and effective for everyone.
                </p>
                <p>
                  What started as a small team of educators and technologists has grown into
                  a global platform serving over a million learners across 50+ countries.
                </p>
                <p>
                  Today, we're using AI and cutting-edge technology to personalize learning
                  experiences and help people unlock their full potential.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="aspect-video bg-peach rounded-3xl flex items-center justify-center"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-10 w-10 text-primary" />
                </div>
                <p className="text-lg font-medium">Our Mission in Action</p>
              </div>
            </motion.div>
          </div>

          {/* Values */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do at LearnFlow.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="bg-card rounded-2xl p-6 border border-border shadow-soft text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/contact">
              <ButtonWithIcon variant="hero" size="xl">
                Join Our Team
              </ButtonWithIcon>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
