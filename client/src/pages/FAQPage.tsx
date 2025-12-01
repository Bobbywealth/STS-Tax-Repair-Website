import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";

const STS_LOGO_URL = "https://www.ststaxrepair.net/wp-content/uploads/2024/12/STS-Tax-Logo-2.png";

const faqs = [
  {
    question: "What documents do I need to file my taxes?",
    answer: "You'll need W-2s from employers, 1099s for other income, receipts for deductions, Social Security numbers for all dependents, and last year's tax return for reference."
  },
  {
    question: "How long does it take to get my refund?",
    answer: "E-filed returns typically receive refunds within 21 days. Paper returns can take 6-8 weeks. Opting for direct deposit speeds up the process."
  },
  {
    question: "What if I can't pay my taxes?",
    answer: "We can help you set up an installment agreement with the IRS or explore other options like an Offer in Compromise. Don't ignore tax debt - there are solutions available."
  },
  {
    question: "Do you offer year-round services?",
    answer: "Yes! We provide tax planning, bookkeeping, and consultation services throughout the year, not just during tax season."
  },
  {
    question: "How do I schedule an appointment?",
    answer: "You can book an appointment online through our website, call us at (954) 995-9702, or visit our Fort Lauderdale office during business hours."
  },
  {
    question: "What areas do you serve?",
    answer: "We serve clients nationwide! While our office is in Fort Lauderdale, FL, we work with clients in all 50 states through virtual consultations."
  }
];

export default function FAQPage() {
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
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Find answers to common questions about our tax services.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900">
              Frequently Asked <span className="text-sts-primary">Questions</span>
            </h2>
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
                <AccordionItem value={`item-${index}`} className="bg-white rounded-xl border px-6">
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-sts-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sts-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Still Have Questions?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Contact our team and we'll be happy to help.
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
          <img src={STS_LOGO_URL} alt="STS TaxRepair" className="h-12 mx-auto mb-4" />
          <p className="text-gray-400">© 2024 STS Tax Repair. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
