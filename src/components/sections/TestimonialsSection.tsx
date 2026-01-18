import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "UX Designer at Google",
    avatar: "SM",
    rating: 5,
    quote:
      "LearnFlow transformed my career. The AI recommendations helped me focus on exactly what I needed to learn. Highly recommend!",
  },
  {
    name: "James Rodriguez",
    role: "Software Engineer",
    avatar: "JR",
    rating: 5,
    quote:
      "The gamification features keep me motivated. I've completed more courses in 3 months than I did all last year!",
  },
  {
    name: "Emily Chen",
    role: "Product Manager",
    avatar: "EC",
    rating: 5,
    quote:
      "Finally, an LMS that understands how people learn. The progress tracking is incredibly detailed and helpful.",
  },
  {
    name: "Michael Brown",
    role: "Data Scientist",
    avatar: "MB",
    rating: 5,
    quote:
      "The course quality is exceptional. LearnFlow's AI suggestions have helped me stay on track with my learning goals.",
  },
  {
    name: "Lisa Wang",
    role: "Marketing Director",
    avatar: "LW",
    rating: 5,
    quote:
      "Our team onboarding time reduced by 50% after switching to LearnFlow. The analytics are game-changing.",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(1);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + testimonials.length) % testimonials.length;
      result.push({ ...testimonials[index], position: i });
    }
    return result;
  };

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
            Real Talk — What Users Are Saying
          </h2>
          <p className="text-muted-foreground text-lg">
            Hear from thousands of satisfied learners who have transformed their skills with LearnFlow.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="flex items-center justify-center gap-4 lg:gap-8 min-h-[320px]">
            <AnimatePresence mode="popLayout">
              {getVisibleTestimonials().map((testimonial) => (
                <motion.div
                  key={`${testimonial.name}-${testimonial.position}`}
                  className={`bg-card rounded-3xl p-6 lg:p-8 border border-border shadow-soft ${
                    testimonial.position === 0
                      ? "w-full max-w-md z-10"
                      : "hidden md:block w-72 opacity-50 scale-90"
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: testimonial.position === 0 ? 1 : 0.5,
                    scale: testimonial.position === 0 ? 1 : 0.9,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-muted-foreground leading-relaxed">{testimonial.quote}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-soft hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-soft hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
