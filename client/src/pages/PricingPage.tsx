import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import logoUrl from "@/assets/sts-logo.png";

const pricingInfo = {
  startingPrice: "$150",
  description: "Professional tax filing services starting at $150. Pricing varies based on your specific tax situation complexity.",
  features: [
    "Transparent, upfront pricing quotes",
    "No hidden fees or surprises",
    "Professional expert guidance",
    "E-File included",
    "Free audit support",
    "Personalized tax planning"
  ]
};

export default function PricingPage() {
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
              <img src={logoUrl} alt="STS TaxRepair" className="h-14 w-auto object-contain" />
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
            <Badge className="bg-sts-gold/20 text-sts-gold border-0 mb-4">
              Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
              Simple, Transparent <span className="text-sts-gold">Pricing</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Display */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6">
              Transparent Tax Pricing
            </h2>
            <p className="text-xl text-gray-600">
              {pricingInfo.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-12 bg-white border-2 border-sts-gold/30 shadow-xl">
              <div className="text-center mb-12">
                <Badge className="bg-sts-gold text-sts-dark mb-6 text-lg px-4 py-2">Starting Price</Badge>
                <div className="mb-8">
                  <span className="text-6xl md:text-7xl font-black text-sts-primary">{pricingInfo.startingPrice}</span>
                </div>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Our pricing starts at $150 for simple returns. We'll provide a detailed quote based on your specific tax situation.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">What's Included</h3>
                <ul className="grid md:grid-cols-2 gap-6 mb-12">
                  {pricingInfo.features.map((feature) => (
                    <motion.li 
                      key={feature} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                    >
                      <Check className="w-6 h-6 text-sts-gold flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-lg">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-center"
                >
                  <Button 
                    size="lg"
                    className="bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-bold px-12 h-16 text-lg"
                    onClick={() => navigate("/contact")}
                  >
                    Get Your Free Quote
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sts-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Not Sure Which Plan Is Right?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Contact us for a free consultation and we'll help you choose the best option.
          </p>
          <Button 
            size="lg"
            className="bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-bold"
            onClick={() => navigate("/contact")}
          >
            Contact Us <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <img src={logoUrl} alt="STS TaxRepair" className="h-12 mx-auto mb-4" />
          <p className="text-gray-400">© 2025 STS Tax Repair. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
