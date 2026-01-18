import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BlogPost = () => {
  const { id } = useParams();

  // Mock post data
  const post = {
    id: id || "1",
    title: "10 Tips to Stay Motivated While Learning Online",
    category: "Learning Tips",
    date: "Jan 15, 2026",
    readTime: "5 min read",
    author: {
      name: "Sarah Mitchell",
      role: "Learning Expert",
      avatar: "SM",
    },
    content: `
      <p>Online learning offers incredible flexibility, but staying motivated can be challenging without the structure of a traditional classroom. Here are ten proven strategies to keep you on track.</p>
      
      <h2>1. Set Clear Goals</h2>
      <p>Before starting any course, define what you want to achieve. Whether it's gaining a new skill for your career or personal enrichment, having clear goals gives you something to work toward.</p>
      
      <h2>2. Create a Dedicated Learning Space</h2>
      <p>Having a specific area for studying helps your brain associate that space with focus and learning. Keep it organized and free from distractions.</p>
      
      <h2>3. Establish a Routine</h2>
      <p>Consistency is key. Set aside specific times for learning each day or week. Treat these sessions like important appointments you can't miss.</p>
      
      <h2>4. Break It Down</h2>
      <p>Large courses can feel overwhelming. Break them into smaller, manageable chunks. Celebrate each milestone you complete.</p>
      
      <h2>5. Stay Connected</h2>
      <p>Join study groups, participate in forums, and connect with fellow learners. Having a community makes the journey more enjoyable and keeps you accountable.</p>
      
      <h2>6. Use the Pomodoro Technique</h2>
      <p>Work in focused 25-minute sessions followed by 5-minute breaks. This technique helps maintain concentration and prevents burnout.</p>
      
      <h2>7. Reward Yourself</h2>
      <p>Set up a reward system for completing lessons or reaching milestones. Small treats can provide the motivation boost you need.</p>
      
      <h2>8. Track Your Progress</h2>
      <p>Use LearnFlow's built-in analytics to monitor your learning journey. Seeing how far you've come is incredibly motivating.</p>
      
      <h2>9. Stay Curious</h2>
      <p>Remember why you started learning. Keep that curiosity alive by exploring related topics and expanding your knowledge.</p>
      
      <h2>10. Be Kind to Yourself</h2>
      <p>Learning is a journey, not a race. If you miss a day or struggle with a concept, don't be too hard on yourself. Progress, not perfection, is the goal.</p>
    `,
  };

  return (
    <Layout>
      <article className="section-padding">
        <div className="container-main">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back Button */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            {/* Header */}
            <div className="mb-8">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {post.category}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary text-sm">{post.author.avatar}</span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{post.author.name}</div>
                    <div className="text-sm">{post.author.role}</div>
                  </div>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="aspect-video bg-gradient-to-br from-peach to-orange-light rounded-3xl mb-10 flex items-center justify-center">
              <span className="text-5xl font-bold text-primary/20">Featured Image</span>
            </div>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Share */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
              <span className="text-muted-foreground">Share this article</span>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
