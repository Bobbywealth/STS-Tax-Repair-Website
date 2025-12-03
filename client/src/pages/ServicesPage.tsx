import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

const STS_LOGO_URL = "https://www.ststaxrepair.net/wp-content/uploads/2024/12/STS-Tax-Logo-2.png";

const services = [
  {
    title: "Professional Tax Filing",
    description: "Our expert tax filing service ensures accuracy and maximum returns. We meticulously navigate the complexities of tax codes, asking the right questions to secure your highest refund. Trust our professionals to handle your taxes with precision and expertise, delivering peace of mind and financial benefit.",
    iconImage: "https://www.ststaxrepair.net/wp-content/uploads/2024/12/svgviewer-output-3.svg"
  },
  {
    title: "Credit Restoration",
    description: "Rebuild your credit with our comprehensive restoration service. We analyze credit reports, identifying discrepancies and errors. Through strategic interventions, we dispute inaccuracies and guide you towards improved credit health. Let us help restore your financial standing and open doors to better opportunities.",
    iconImage: "https://www.ststaxrepair.net/wp-content/uploads/2024/12/svgviewer-output-2.svg"
  },
  {
    title: "Business Registration",
    description: "Seamlessly establish your business with our registration service. We navigate the bureaucratic landscape, ensuring your incorporation process is efficient and compliant. From paperwork to legal formalities, we handle every step, allowing you to focus on your business vision. Trust us to register your business accurately and expediently.",
    iconImage: "https://www.ststaxrepair.net/wp-content/uploads/2024/12/svgviewer-output.svg"
  },
  {
    title: "Business Loans",
    description: "Access financial support for your business growth with our comprehensive loan service. We assess your needs, guiding you to suitable loan options. From application to approval, we streamline the process, securing favorable terms. Count on us to help your business thrive with tailored loan solutions designed for your success.",
    iconImage: "https://www.ststaxrepair.net/wp-content/uploads/2024/12/svgviewer-output-4.svg"
  }
];

export default function ServicesPage() {
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

      {/* Hero Section - Dark teal/green with building image */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-sts-dark via-[#0a1f14] to-sts-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920')] bg-cover bg-center" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white">
              Services
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-sts-gold/20 text-sts-dark border-0 mb-4 px-4 py-1">
              Our Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
              Expert Tax Consulting <span className="text-sts-primary">Services</span>
            </h2>
          </motion.div>

          {/* 2x2 Grid of Service Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-xl transition-shadow bg-white border-0 shadow-lg group">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-sts-primary/10 flex items-center justify-center mb-6 group-hover:bg-sts-primary group-hover:scale-110 transition-all overflow-hidden">
                    <img 
                      src={service.iconImage} 
                      alt={service.title}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-sts-primary mb-4">{service.title}</h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
                  
                  {/* Learn More Link */}
                  <Button 
                    variant="ghost" 
                    className="text-sts-primary p-0 h-auto font-semibold group/btn"
                    onClick={() => navigate("/contact")}
                  >
                    Learn More 
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Card>
              </motion.div>
            ))}
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
            Contact us today for a free consultation and let us help you with your tax needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              className="bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-bold"
              onClick={() => navigate("/contact")}
            >
              Contact Us <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-sts-dark"
              onClick={() => navigate("/client-login")}
            >
              Book Appointment
            </Button>
          </div>
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
