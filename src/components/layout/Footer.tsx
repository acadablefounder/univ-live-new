import { Link } from "react-router-dom";
import { Instagram, Twitter, Linkedin, Facebook } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: "About Us", path: "/about" },
    { name: "Pricing Plan", path: "/pricing" },
  ],
  resources: [
    { name: "Contact Us", path: "/contact" },
    { name: "Blog & Articles", path: "/blog" },
    { name: "Terms of Use", path: "#" },
    { name: "Privacy Policy", path: "#" },
  ],
};

const socialLinks = [
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "X.com", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "Facebook", icon: Facebook, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Large watermark text */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none overflow-hidden">
        <div className="text-[15vw] font-bold text-background/5 whitespace-nowrap tracking-tight leading-none">
          LEARNFLOW
        </div>
      </div>

      <div className="container-main py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-lg">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-bold text-xl">
                Learn<span className="text-primary">Flow</span>
              </span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              Transform your teaching with our AI-driven Learning Management System.
              Effortlessly manage courses and engage learners.
            </p>
            <p className="text-background/50 text-xs">
              © {new Date().getFullYear()} LearnFlow. All rights reserved.
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="font-semibold mb-5 text-background">Useful Links</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-background/70 hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-5 text-background">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-background/70 hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-5 text-background">Let's Connect</h4>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center gap-3 text-background/70 hover:text-primary transition-colors text-sm"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ✅ add default export so `import Footer from ".../Footer"` works
export default Footer;
