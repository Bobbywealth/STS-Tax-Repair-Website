import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Mail, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@/assets/sts-logo.png";

const offices = [
  {
    address: "70 E Sunrise Hwy, Valley Stream, NY 11581 [5th floor East]",
    phone: "(929) 235-0185",
    email: "amtaxrepair@gmail.com",
    social: "@amtaxrepair"
  },
  {
    address: "2100 West Loop South, Suite 900, Houston, 77027",
    phone: "(954) 851-4159",
    email: "ststaxrepair@gmail.com",
    social: "@ststaxrepair"
  },
  {
    address: "110 East Broward Blvd., Suite 1700, Fort Lauderdale, 33301",
    phone: "(954) 851-4159",
    email: "ststaxrepair@gmail.com",
    social: "@ststaxrepair"
  }
];

export default function ContactPage() {
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    message: "",
    smsConsent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/agents", label: "Agents" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
    
    setFormData({ name: "", location: "", phone: "", email: "", message: "", smsConsent: false });
    setIsSubmitting(false);
  };

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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white">
              Contact Us
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Side - Addresses */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
                CONTACT
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8">
                Get In <span className="text-sts-primary">Touch</span>
              </h2>

              <div className="space-y-6">
                {offices.map((office, index) => (
                  <Card key={index} className="p-6 border-0 shadow-lg bg-white">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-sts-primary mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{office.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-sts-primary flex-shrink-0" />
                        <a href={`tel:${office.phone}`} className="text-gray-700 hover:text-sts-primary">
                          {office.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-sts-primary flex-shrink-0" />
                        <a href={`mailto:${office.email}`} className="text-gray-700 hover:text-sts-primary">
                          {office.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-sts-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                        </svg>
                        <span className="text-gray-700">{office.social}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 border-0 shadow-lg bg-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input 
                      placeholder="Your Name" 
                      className="h-12"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Input 
                      placeholder="Your Location" 
                      className="h-12"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      data-testid="input-location"
                    />
                  </div>
                  <div>
                    <Input 
                      type="tel"
                      placeholder="Phone Number" 
                      className="h-12"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Input 
                      type="email"
                      placeholder="Your Email" 
                      className="h-12"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Textarea 
                      placeholder="Message" 
                      className="min-h-[120px]"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      data-testid="input-message"
                    />
                  </div>
                  <div className="flex items-start space-x-3 p-4 rounded-md border bg-gray-50/50">
                    <Checkbox
                      id="sms-consent-contact"
                      checked={formData.smsConsent}
                      onCheckedChange={(checked) => setFormData({ ...formData, smsConsent: !!checked })}
                      data-testid="checkbox-sms-consent-contact"
                    />
                    <div className="space-y-1 leading-none">
                      <label 
                        htmlFor="sms-consent-contact"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        SMS Opt-In Consent
                      </label>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        I consent to receive appointment reminders, scheduling updates, and tax service notifications via SMS/text message from STS TaxRepair LLC to the phone number I provided. Message and data rates may apply. Reply HELP for information, STOP to unsubscribe. See our <Link href="/privacy-policy" className="text-sts-primary hover:underline">Privacy Policy</Link> and <Link href="/terms-conditions" className="text-sts-primary hover:underline">Terms & Conditions</Link>.
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-sts-primary hover:bg-sts-primary/90 h-12 text-lg font-bold"
                    disabled={isSubmitting || !formData.smsConsent}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? "Sending..." : "Submit"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
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
