import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu, X, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@/assets/sts-logo.png";

const faqs = [
  {
    question: "What Services Does STS Tax Repair Offer?",
    answer: "STS Tax Repair provides a range of services including professional tax filing, credit restoration, assistance with business registration, and support in securing business loans."
  },
  {
    question: "How Can I Contact STS Tax Repair?",
    answer: "You can reach us at different locations:\n\nValley Stream, NY: (929) 235-0185\nHouston, TX: (954) 851-4159\nFort Lauderdale, FL: (954) 851-4159\n\nAdditionally, you can email us at amtaxrepair@gmail.com or ststaxrepair@gmail.com, and find us on Instagram: @amtaxrepair and @ststaxrepair respectively."
  },
  {
    question: "What Are The Benefits Of Professional Tax Filing Services?",
    answer: "Our professional tax filing services ensure accuracy, compliance, and optimized returns, saving you time and stress while maximizing your eligible deductions."
  },
  {
    question: "Can STS Tax Repair Help With Business Registration?",
    answer: "Yes, we assist in streamlining the process of business registration, offering guidance on necessary paperwork and requirements to establish your business effectively."
  },
  {
    question: "What Types Of Business Loans Does STS Tax Repair Assist With?",
    answer: "We help businesses secure various types of loans including term loans, lines of credit, equipment financing, and Small Business Administration (SBA) loans, tailoring our assistance to specific business needs."
  },
  {
    question: "How Long Does Credit Restoration Typically Take?",
    answer: "Credit restoration timelines vary based on individual circumstances. However, our team at STS Tax Repair works efficiently to address issues and improve credit scores as quickly as possible."
  }
];

export default function FAQPage() {
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const { toast } = useToast();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/agents", label: "Agents" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" }
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      toast({
        title: "Subscribed!",
        description: "You've been added to our newsletter.",
      });
      setNewsletterEmail("");
    }
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
              FAQ
            </h1>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Frequently Asked Question
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Suspendisse ac condimentum velit. Nullam pulvinar a velit ac convallis. Proin non leo ac quam blandit faucibus sed nec ex. Pellentesque dapibus mi vehicula tincidunt porttitor.
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${index}`} 
                  className="bg-gray-50 rounded-xl border-0 px-6 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-sts-primary py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-5 whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-sts-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-sts-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
              Subscribe For Our Newsletter
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Stay Informed, Stay Ahead: Subscribe to STSTaxRepair
            </p>
            <p className="text-sts-primary font-semibold mb-8">
              Early Bird Notifications
            </p>

            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                type="email"
                placeholder="Enter your email" 
                className="h-12 flex-1"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                data-testid="input-newsletter-email"
              />
              <Button 
                type="submit"
                className="bg-sts-primary hover:bg-sts-primary/90 h-12 px-8 font-bold"
                data-testid="button-newsletter-submit"
              >
                Submit
              </Button>
            </form>
          </motion.div>
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
