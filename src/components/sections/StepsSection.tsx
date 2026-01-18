import { motion } from "framer-motion";
import { UserPlus, BookOpen, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Register Account",
    description:
      "Hey, why not create a free account with your email address? It's super easy and takes just a few moments!",
  },
  {
    icon: BookOpen,
    title: "Choose a Course",
    description:
      "Take a moment to browse through our extensive catalog and enroll in a course that truly interests you!",
  },
  {
    icon: GraduationCap,
    title: "Start Learning",
    description:
      "Explore our easy lessons, try out fun quizzes to see what you know, and earn cool certificates to show off your success!",
  },
];

export function StepsSection() {
  return (
    <section className="section-padding">
      <div className="container-main">
        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Start Learning with LearnFlow in Just 3 Simple Steps
        </motion.h2>

        <motion.div
          className="bg-peach rounded-3xl lg:rounded-[2rem] p-8 lg:p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="flex flex-col">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-card shadow-soft flex items-center justify-center mb-6">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>

                {/* Dotted separator */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <div className="h-32 border-r-2 border-dashed border-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
