import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";

const STS_LOGO_URL = "https://www.ststaxrepair.net/wp-content/uploads/2024/12/STS-Tax-Logo-2.png";

export default function AboutPage() {
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/agents", label: "Agents" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <img src={STS_LOGO_URL} alt="STS TaxRepair" className="h-14 w-auto object-contain" />
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="text-gray-700 hover:text-sts-primary font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate("/client-login")}
                className="font-bold border-2 border-sts-primary text-sts-primary hover:bg-sts-primary hover:text-white"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate("/client-login")}
                className="bg-gradient-to-r from-sts-gold to-yellow-400 text-sts-dark font-semibold"
              >
                Book Appointment
              </Button>
            </div>

            <button 
              className="lg:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-sts-dark via-[#0a1f14] to-sts-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
              About Us
            </h1>
          </motion.div>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://www.ststaxrepair.net/wp-content/uploads/2024/12/stephedena-cherfils.webp"
                  alt="STS Tax Repair Team Member"
                  className="w-full h-full object-cover aspect-[3/4]"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://www.ststaxrepair.net/wp-content/uploads/2024/12/c13f606f-7eac-4a87-8ddb-98f54020d6d1-6750cccc01f1b.webp"
                  alt="STS Tax Repair Team"
                  className="w-full h-full object-cover aspect-[3/4]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
                ABOUT US
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Your Maximum Refund,
                <br />
                <span className="text-sts-primary">Our Expert Promise</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                At STS Tax Repair, we're driven by a simple yet powerful goal: to empower you with every dollar you deserve. Through meticulous attention to detail and an in-depth mastery of the tax code, our mission is crystal clear. We're committed to maximizing your financial returns by asking the right questions, uncovering often overlooked credits and deductions, and ensuring that your hard work translates into the maximum refund possible.
              </p>
              <Button 
                size="lg"
                className="bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-bold"
                onClick={() => navigate("/contact")}
              >
                Contact Us <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sts-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Let our team of experts help you maximize your tax refund.
          </p>
          <Button 
            size="lg"
            className="bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-bold"
            onClick={() => navigate("/contact")}
          >
            Book Appointment <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <img src={STS_LOGO_URL} alt="STS TaxRepair" className="h-12 mx-auto mb-4" />
          <p className="text-gray-400">© 2024 STS Tax Repair. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
