import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";

const STS_LOGO_URL = "https://www.ststaxrepair.net/wp-content/uploads/2024/12/STS-Tax-Logo-2.png";

const agents = [
  {
    name: "Stephedena Cherfils",
    title: "Service Support",
    image: "https://iili.io/fxO4Uog.png",
    phone: "954-534-5227",
    email: "Info.ststax@gmail.com",
    location: "Houston, TX"
  },
  {
    name: "Withney Simon",
    title: "Service Support",
    image: "https://iili.io/fxO48DF.jpg",
    phone: "407-427-7619",
    email: "Withney.ststax@yahoo.com",
    location: "Houston, TX"
  },
  {
    name: "Keelie Duvignaud",
    title: "Service Support",
    image: "https://iili.io/fxOivNS.png",
    phone: "772-877-1588",
    email: "Taxesbykeys@gmail.com",
    location: "Port St. Lucie, FL"
  }
];

export default function AgentsPage() {
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
            <Badge className="bg-sts-gold/20 text-sts-gold border-0 mb-4">
              Our Team
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
              Meet Our <span className="text-sts-gold">Agents</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Our team of certified tax professionals is dedicated to helping you maximize your refund.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={agent.image} 
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{agent.name}</h3>
                    <p className="text-sts-primary font-medium mb-4">{agent.title}</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-sts-primary" />
                        {agent.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-sts-primary" />
                        {agent.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sts-primary" />
                        {agent.location}
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 bg-sts-primary hover:bg-sts-primary/90"
                      onClick={() => navigate("/contact")}
                    >
                      Contact Agent
                    </Button>
                  </div>
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
            Ready to Work With Our Team?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Schedule a consultation with one of our expert tax professionals today.
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
