import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const posts = [
  {
    id: 1,
    title: "10 Tips to Stay Motivated While Learning Online",
    excerpt: "Discover proven strategies to maintain your motivation and achieve your learning goals in the digital age.",
    category: "Learning Tips",
    date: "Jan 15, 2026",
    readTime: "5 min read",
    image: "tips",
  },
  {
    id: 2,
    title: "The Future of AI in Education: What to Expect",
    excerpt: "Explore how artificial intelligence is transforming the education landscape and what it means for learners.",
    category: "Technology",
    date: "Jan 12, 2026",
    readTime: "8 min read",
    image: "ai",
  },
  {
    id: 3,
    title: "How Gamification Increases Course Completion Rates",
    excerpt: "Learn how game elements can boost engagement and help students complete more courses.",
    category: "Research",
    date: "Jan 10, 2026",
    readTime: "6 min read",
    image: "gamification",
  },
  {
    id: 4,
    title: "Building a Learning Culture in Your Organization",
    excerpt: "A comprehensive guide for leaders who want to foster continuous learning in their teams.",
    category: "Business",
    date: "Jan 8, 2026",
    readTime: "7 min read",
    image: "culture",
  },
  {
    id: 5,
    title: "Top 5 Skills to Learn in 2026",
    excerpt: "Stay ahead of the curve with these in-demand skills that employers are looking for.",
    category: "Career",
    date: "Jan 5, 2026",
    readTime: "4 min read",
    image: "skills",
  },
  {
    id: 6,
    title: "How to Create Effective Study Notes",
    excerpt: "Master the art of note-taking with these research-backed techniques for better retention.",
    category: "Learning Tips",
    date: "Jan 3, 2026",
    readTime: "5 min read",
    image: "notes",
  },
];

const Blog = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-main">
          {/* Header */}
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Blog & <span className="text-primary">Articles</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Insights, tips, and stories to help you learn better and achieve more.
            </p>
          </motion.div>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                className="group bg-card rounded-3xl border border-border shadow-soft overflow-hidden hover-lift"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link to={`/blog/${post.id}`}>
                  {/* Image placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-peach to-orange-light flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary/20 uppercase">
                      {post.image}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>

                    <span className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                      Read More <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
