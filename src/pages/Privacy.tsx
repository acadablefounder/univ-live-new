import  Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";

const Privacy = () => {
  return (
    <Layout>
      <section className="section-padding section-1">
        <div className="container-main">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-12">Last updated: 24/01/2026</p>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-8">
                At <strong className="text-foreground">Univ.live</strong>, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                  <p className="text-muted-foreground mb-2">We may collect:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Name, email, phone number</li>
                    <li>Coaching center or institution details</li>
                    <li>Student performance data (for analytics purposes)</li>
                    <li>Usage data (pages visited, features used)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                  <p className="text-muted-foreground mb-2">We use your information to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Provide and improve our services</li>
                    <li>Enable platform functionality</li>
                    <li>Communicate updates, support, and demos</li>
                    <li>Generate analytics for teachers and students</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">3. Data Protection</h2>
                  <p className="text-muted-foreground">
                    We take reasonable security measures to protect your data. However, no online system is completely secure.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">4. Data Sharing</h2>
                  <p className="text-muted-foreground mb-2">
                    We <strong className="text-foreground">do not sell or rent</strong> your personal data to third parties.
                  </p>
                  <p className="text-muted-foreground">We may share information only:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>When required by law</li>
                    <li>With trusted service providers (e.g., email or hosting services)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">5. Cookies</h2>
                  <p className="text-muted-foreground">
                    Univ.live may use cookies to improve user experience and platform performance.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">6. Student Data</h2>
                  <p className="text-muted-foreground mb-2">Student performance data is used strictly for:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Analytics</li>
                    <li>Progress tracking</li>
                    <li>Improving learning outcomes</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    We do not use student data for advertising purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">7. User Rights</h2>
                  <p className="text-muted-foreground mb-2">You may request to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Access your data</li>
                    <li>Update or correct your information</li>
                    <li>Delete your account (subject to applicable rules)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">8. Policy Updates</h2>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time. Any changes will be posted on this page.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have any questions about this Privacy Policy, contact us at:
                  </p>
                  <p className="text-primary font-semibold mt-2">
                    📧 info.univlive@gmail.com
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;