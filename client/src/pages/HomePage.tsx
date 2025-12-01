import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ChevronRight,
  Star,
  Users,
  FileText,
  Shield,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  Zap,
  Play,
  ChevronLeft,
  Sparkles,
  Lock,
  HeadphonesIcon,
  BarChart3,
  FileCheck,
  Banknote,
  UserCheck,
  Globe,
  Quote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";

const MotionCard = motion.create(Card);

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const [contactForm, setContactForm] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    message: ""
  });
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.phone || !contactForm.email) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      
      setContactForm({
        name: "",
        location: "",
        phone: "",
        email: "",
        message: ""
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inquiryForm.name || !inquiryForm.phone || !inquiryForm.email) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsInquirySubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      
      setInquiryForm({
        name: "",
        location: "",
        phone: "",
        email: "",
        message: ""
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "#services" },
    { label: "About", href: "#about" },
    { label: "Process", href: "#process" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
    { label: "FAQ", href: "#faq" }
  ];

  const services = [
    {
      icon: Calculator,
      title: "Personal Tax Returns",
      description: "Expert preparation for individual returns, maximizing deductions and ensuring IRS compliance.",
      stats: "50K+ Returns Filed"
    },
    {
      icon: Building2,
      title: "Business Tax Services",
      description: "Comprehensive solutions for LLCs, corporations, partnerships, and sole proprietors.",
      stats: "5K+ Businesses Served"
    },
    {
      icon: Banknote,
      title: "Refund Advances",
      description: "Get your refund faster with same-day advance options up to $7,000.",
      stats: "24hr Approval"
    },
    {
      icon: Shield,
      title: "Audit Protection",
      description: "Full IRS representation and audit defense by enrolled agents.",
      stats: "100% Defense Rate"
    },
    {
      icon: TrendingUp,
      title: "Tax Planning",
      description: "Year-round strategies to minimize liability and maximize savings.",
      stats: "Avg. $4,200 Saved"
    },
    {
      icon: FileCheck,
      title: "Amendment Services",
      description: "Correct past returns and claim missed deductions from previous years.",
      stats: "3-Year Lookback"
    }
  ];

  const stats = [
    { value: 15, suffix: "+", label: "Years Experience" },
    { value: 50000, suffix: "+", label: "Clients Served" },
    { value: 100, prefix: "$", suffix: "M+", label: "Refunds Secured" },
    { value: 99, suffix: "%", label: "Client Satisfaction" }
  ];

  const testimonials = [
    {
      name: "Maria Johnson",
      role: "Small Business Owner",
      location: "Los Angeles, CA",
      content: "STS Tax Repair transformed my business finances. They found $12,000 in deductions I had no idea existed. Their team is responsive, professional, and truly cares about their clients.",
      rating: 5,
      image: "MJ"
    },
    {
      name: "James Williams",
      role: "Real Estate Investor",
      location: "Phoenix, AZ",
      content: "As someone with complex rental property income, I needed experts who understand real estate taxation. STS exceeded all expectations. Five years running and counting!",
      rating: 5,
      image: "JW"
    },
    {
      name: "Sandra Chen",
      role: "Freelance Consultant",
      location: "San Diego, CA",
      content: "Self-employment taxes used to stress me out every year. Now with STS handling everything, I actually look forward to tax season. The quarterly planning sessions are a game-changer.",
      rating: 5,
      image: "SC"
    },
    {
      name: "Robert Martinez",
      role: "Restaurant Owner",
      location: "Houston, TX",
      content: "After an IRS audit notice, I was terrified. STS represented me professionally and resolved everything in my favor. I'm a client for life now.",
      rating: 5,
      image: "RM"
    }
  ];

  const processSteps = [
    {
      step: "01",
      title: "Schedule Consultation",
      description: "Book a free 15-minute call to discuss your tax situation and needs.",
      icon: Phone
    },
    {
      step: "02",
      title: "Upload Documents",
      description: "Securely upload W-2s, 1099s, and other tax documents to our portal.",
      icon: FileText
    },
    {
      step: "03",
      title: "Expert Review",
      description: "Our certified preparers analyze your return for maximum refund.",
      icon: UserCheck
    },
    {
      step: "04",
      title: "Get Your Refund",
      description: "E-file and receive your refund via direct deposit or check.",
      icon: DollarSign
    }
  ];

  const faqs = [
    {
      q: "How much do your services cost?",
      a: "Our pricing is transparent and based on your tax situation complexity. Simple returns start at $150, while business returns vary. We provide upfront quotes before beginning any work."
    },
    {
      q: "How fast can I get my refund?",
      a: "With e-filing, most refunds arrive within 10-21 days. We also offer same-day refund advances up to $7,000 for qualified clients."
    },
    {
      q: "What if I get audited?",
      a: "All our returns come with free audit support. If the IRS questions your return, we'll represent you at no additional charge."
    },
    {
      q: "Can you help with back taxes?",
      a: "Absolutely. We specialize in resolving IRS debt, filing unfiled returns, and setting up payment plans. Many clients save thousands with our help."
    },
    {
      q: "Do you work with clients nationwide?",
      a: "Yes! While we have offices in California and Texas, we serve clients across all 50 states through our secure online portal."
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Sticky Header with Glass Effect */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100" 
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        data-testid="header-main"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group" data-testid="link-home-logo">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sts-primary via-sts-primary to-sts-dark flex items-center justify-center shadow-lg shadow-sts-primary/30 group-hover:shadow-sts-primary/50 transition-shadow">
                  <span className="text-white font-black text-xl">S</span>
                </div>
                <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-gradient-to-br from-sts-gold to-yellow-400 rounded-full flex items-center justify-center shadow-md">
                  <DollarSign className="w-3 h-3 text-sts-dark" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-xl tracking-tight leading-none ${isScrolled ? "text-sts-dark" : "text-white"}`}>
                  STS TaxRepair
                </span>
                <span className={`text-xs font-medium ${isScrolled ? "text-gray-500" : "text-white/70"}`}>
                  Tax Solutions You Can Trust
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    isScrolled 
                      ? "text-gray-600 hover:text-sts-primary hover:bg-sts-primary/5" 
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Button 
                variant="ghost"
                onClick={() => navigate("/client-login")}
                className={`font-semibold ${
                  isScrolled 
                    ? "text-gray-700 hover:text-sts-primary hover:bg-sts-primary/5" 
                    : "text-white hover:bg-white/10"
                }`}
                data-testid="button-login"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate("/client-login")}
                className="bg-gradient-to-r from-sts-gold to-yellow-400 hover:from-sts-gold hover:to-yellow-500 text-sts-dark font-semibold shadow-lg shadow-sts-gold/30 hover:shadow-sts-gold/50 transition-all"
                data-testid="button-appointment"
              >
                Book Appointment
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`xl:hidden p-2 rounded-lg transition-colors ${
                isScrolled ? "hover:bg-gray-100" : "hover:bg-white/10"
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className={`w-6 h-6 ${isScrolled ? "text-gray-900" : "text-white"}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isScrolled ? "text-gray-900" : "text-white"}`} />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                className="xl:hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <nav className="flex flex-col gap-1 py-4 border-t border-white/10">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className={`px-4 py-3 text-base font-medium rounded-lg ${
                        isScrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="flex flex-col gap-2 mt-4 px-4">
                    <Button 
                      variant="outline"
                      onClick={() => { navigate("/client-login"); setIsMobileMenuOpen(false); }}
                      className="w-full border-sts-primary text-sts-primary hover:bg-sts-primary hover:text-white"
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={() => { navigate("/client-login"); setIsMobileMenuOpen(false); }}
                      className="w-full bg-gradient-to-r from-sts-gold to-yellow-400 text-sts-dark font-semibold"
                    >
                      Book Appointment
                    </Button>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Hero Section - Enhanced */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ position: 'relative' }}
        data-testid="section-hero"
      >
        {/* Sophisticated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2818] via-sts-dark to-[#1a4d2e]" />
        
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sts-primary/40 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-sts-gold/20 via-transparent to-transparent" />
        </div>

        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-sts-primary/20 rounded-full blur-[120px]"
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sts-gold/15 rounded-full blur-[100px]"
            animate={{ 
              x: [0, -40, 0],
              y: [0, -20, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <motion.div 
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Hero Content */}
            <div className="lg:col-span-3 space-y-8">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4 text-sts-gold" />
                <span className="text-white/80 text-sm font-medium">
                  Trusted by 50,000+ Clients Nationwide
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Get Your{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-sts-gold via-yellow-300 to-sts-gold">
                    Maximum
                  </span>
                </span>
                <br />
                Tax Refund
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Professional tax preparation with a personal touch. Our certified experts find every deduction you deserve, guaranteed.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-sts-gold to-yellow-400 hover:from-sts-gold hover:to-yellow-500 text-sts-dark font-bold px-8 h-14 text-base shadow-xl shadow-sts-gold/30 hover:shadow-sts-gold/50 transition-all group"
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-hero-consultation"
                >
                  Free Consultation
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/30 font-semibold px-8 h-14 text-base"
                  onClick={() => navigate("/client-login")}
                  data-testid="button-hero-portal"
                >
                  Client Portal
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  { icon: Shield, text: "IRS Authorized E-File" },
                  { icon: Award, text: "CTEC Certified" },
                  { icon: Lock, text: "Bank-Level Security" }
                ].map((item, index) => (
                  <div key={item.text} className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-sts-gold" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Glass Contact Card */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="relative">
                {/* Card Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-sts-primary/20 to-sts-gold/20 rounded-3xl blur-2xl opacity-60" />
                
                <Card className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl" data-testid="form-contact-sidebar">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sts-gold to-yellow-400 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-sts-dark" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Get Started Today</h3>
                      <p className="text-white/60 text-sm">Free consultation • No obligation</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <Input
                        placeholder="Full Name *"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-sts-gold focus:ring-sts-gold/20 h-12 rounded-xl"
                        data-testid="input-contact-name"
                      />
                      <Input
                        placeholder="Phone Number *"
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-sts-gold focus:ring-sts-gold/20 h-12 rounded-xl"
                        data-testid="input-contact-phone"
                      />
                      <Input
                        placeholder="Email Address *"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-sts-gold focus:ring-sts-gold/20 h-12 rounded-xl"
                        data-testid="input-contact-email"
                      />
                      <Textarea
                        placeholder="How can we help you?"
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-sts-gold focus:ring-sts-gold/20 min-h-[80px] resize-none rounded-xl"
                        data-testid="input-contact-message"
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-sts-primary to-sts-dark hover:from-sts-primary/90 hover:to-sts-dark/90 text-white font-bold h-12 rounded-xl shadow-lg"
                      disabled={isSubmitting}
                      data-testid="button-contact-submit"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        "Request Free Consultation"
                      )}
                    </Button>
                  </form>

                  <p className="text-white/40 text-xs text-center mt-4">
                    We respect your privacy. No spam, ever.
                  </p>
                </Card>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div 
              className="w-1 h-2 bg-white/50 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5], y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section - Glass Cards */}
      <section className="relative py-20 bg-gradient-to-b from-sts-dark to-[#0d2818]" data-testid="section-stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                variants={fadeInUp}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sts-primary/20 to-sts-gold/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                  <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sts-gold to-yellow-300 mb-2">
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </div>
                  <div className="text-white/60 font-medium text-sm">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section - Modern Cards */}
      <section id="services" className="py-24 bg-gray-50" data-testid="section-services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
              Our Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
              Comprehensive Tax <span className="text-sts-primary">Solutions</span>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
              From simple returns to complex business filings, we have the expertise to handle all your tax needs.
            </p>
          </motion.div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.map((service, index) => (
              <motion.div key={service.title} variants={fadeInUp}>
                <Card 
                  className="group relative p-6 bg-white border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-sts-primary/10 transition-all duration-300 overflow-hidden h-full"
                  data-testid={`card-service-${index}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sts-primary/5 to-transparent rounded-bl-full" />
                  
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sts-primary to-sts-dark flex items-center justify-center mb-5 shadow-lg shadow-sts-primary/30 group-hover:scale-110 transition-transform">
                      <service.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                    
                    <div className="flex items-center gap-2 text-sts-primary font-semibold text-sm">
                      <BarChart3 className="w-4 h-4" />
                      {service.stats}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section - Timeline */}
      <section id="process" className="py-24 bg-white" data-testid="section-process">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-sts-gold/10 text-sts-gold border-0 mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
              Simple <span className="text-sts-primary">4-Step</span> Process
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
              Getting your maximum refund has never been easier. Here's how we work together.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-sts-primary via-sts-gold to-sts-primary -translate-y-1/2" />
            
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {processSteps.map((step, index) => (
                <motion.div 
                  key={step.step} 
                  variants={fadeInUp}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sts-primary to-sts-dark flex items-center justify-center mb-6 mx-auto shadow-lg shadow-sts-primary/30">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sts-gold font-black text-sm mb-2 block">{step.step}</span>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Split Section */}
      <section id="about" className="py-24 bg-gray-50" data-testid="section-about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
                Why Choose Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                Your Trusted <span className="text-sts-primary">Tax Partner</span>
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                For over 15 years, STS TaxRepair has been helping individuals and businesses navigate the complex world of taxation. Our commitment to excellence has earned us the trust of over 50,000 clients.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Target, title: "Maximum Refund Guarantee", desc: "We find every deduction and credit you're entitled to" },
                  { icon: Shield, title: "Free Audit Protection", desc: "We stand behind our work with full IRS representation" },
                  { icon: Clock, title: "Fast Turnaround", desc: "Most returns completed within 24-48 hours" },
                  { icon: HeadphonesIcon, title: "Year-Round Support", desc: "Questions? We're here for you 365 days a year" }
                ].map((item, index) => (
                  <motion.div 
                    key={item.title} 
                    className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sts-gold/20 to-yellow-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-sts-gold" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-sts-primary/20 to-sts-gold/20 rounded-3xl blur-2xl" />
                <div className="relative bg-gradient-to-br from-sts-dark via-[#1a4d2e] to-sts-primary rounded-2xl p-8 text-white overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                  </div>
                  
                  <div className="relative">
                    <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
                    <p className="text-white/70 mb-6">
                      Join thousands of satisfied clients who trust us with their taxes.
                    </p>
                    
                    <div className="space-y-3 mb-8">
                      {["Free initial consultation", "Transparent pricing upfront", "No hidden fees or surprises", "100% satisfaction guarantee"].map((item) => (
                        <div key={item} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-sts-gold/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-sts-gold" />
                          </div>
                          <span className="text-white/90">{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-sts-gold to-yellow-400 hover:from-sts-gold hover:to-yellow-500 text-sts-dark font-bold h-12 shadow-lg"
                      onClick={() => navigate("/client-login")}
                      data-testid="button-get-started"
                    >
                      Schedule Your Free Consultation
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Carousel */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-sts-dark via-[#1a4d2e] to-sts-dark overflow-hidden" data-testid="section-testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-white/10 text-sts-gold border-0 mb-4">
              Client Success Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              What Our Clients <span className="text-sts-gold">Say</span>
            </h2>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
              >
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12">
                  <Quote className="absolute top-6 left-6 w-12 h-12 text-sts-gold/20" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-sts-gold fill-sts-gold" />
                      ))}
                    </div>
                    
                    <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
                      "{testimonials[currentTestimonial].content}"
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sts-primary to-sts-dark flex items-center justify-center text-white font-bold text-lg">
                        {testimonials[currentTestimonial].image}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{testimonials[currentTestimonial].name}</div>
                        <div className="text-white/60">{testimonials[currentTestimonial].role}</div>
                        <div className="text-white/40 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {testimonials[currentTestimonial].location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial 
                      ? "bg-sts-gold w-8" 
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                  data-testid={`button-testimonial-${index}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between px-4 md:px-0 pointer-events-none">
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white pointer-events-auto transition-colors border border-white/20"
                data-testid="button-testimonial-prev"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white pointer-events-auto transition-colors border border-white/20"
                data-testid="button-testimonial-next"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white" data-testid="section-faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Frequently Asked <span className="text-sts-primary">Questions</span>
            </h2>
          </motion.div>

          <motion.div 
            className="space-y-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  data-testid={`button-faq-${index}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-gray-900">{faq.q}</span>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === index ? "rotate-90" : ""}`} />
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-gray-600 mt-4 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-50" data-testid="section-contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
                Contact Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6">
                Let's Start Your <span className="text-sts-primary">Tax Journey</span>
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Have questions? Our team is here to help. Reach out and we'll get back to you within 24 hours.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Phone, label: "Phone", value: "(877) STS-TAXES", subtext: "Mon-Sat 8am-8pm" },
                  { icon: Mail, label: "Email", value: "support@ststaxrepair.com", subtext: "We reply within 24 hours" },
                  { icon: MapPin, label: "Office", value: "Los Angeles, CA", subtext: "Serving clients nationwide" }
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sts-primary to-sts-dark flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">{item.label}</div>
                      <div className="font-bold text-gray-900">{item.value}</div>
                      <div className="text-sm text-gray-500">{item.subtext}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-sts-gold/10 to-yellow-50 rounded-2xl border border-sts-gold/20">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-sts-gold" />
                  <span className="font-bold text-gray-900">Business Hours</span>
                </div>
                <p className="text-gray-600">
                  Monday - Friday: 9:00 AM - 7:00 PM<br />
                  Saturday: 10:00 AM - 4:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 shadow-xl border-0" data-testid="form-inquiry-section">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h3>
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      placeholder="Your Name *"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12"
                      data-testid="input-inquiry-name"
                    />
                    <Input
                      placeholder="Phone Number *"
                      type="tel"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-12"
                      data-testid="input-inquiry-phone"
                    />
                  </div>
                  <Input
                    placeholder="Email Address *"
                    type="email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12"
                    data-testid="input-inquiry-email"
                  />
                  <Input
                    placeholder="Location"
                    value={inquiryForm.location}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, location: e.target.value }))}
                    className="h-12"
                    data-testid="input-inquiry-location"
                  />
                  <Textarea
                    placeholder="How can we help you?"
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                    className="min-h-[120px] resize-none"
                    data-testid="input-inquiry-message"
                  />
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-sts-primary to-sts-dark hover:from-sts-primary/90 hover:to-sts-dark/90 text-white font-bold h-12"
                    disabled={isInquirySubmitting}
                    data-testid="button-inquiry-submit"
                  >
                    {isInquirySubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-sts-dark via-[#1a4d2e] to-sts-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sts-gold rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
              Ready to Maximize Your <span className="text-sts-gold">Refund?</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Don't leave money on the table. Schedule your free consultation today and let our experts find every deduction you deserve.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-sts-gold to-yellow-400 hover:from-sts-gold hover:to-yellow-500 text-sts-dark font-bold px-8 h-14 shadow-xl"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-cta-consultation"
              >
                Get Free Consultation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold px-8 h-14"
                onClick={() => navigate("/client-login")}
                data-testid="button-cta-login"
              >
                Client Login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16" data-testid="footer-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sts-primary to-sts-dark flex items-center justify-center">
                  <span className="text-white font-black text-xl">S</span>
                </div>
                <span className="font-black text-xl">STS TaxRepair</span>
              </Link>
              <p className="text-gray-400 mb-6">
                Professional tax services with a personal touch. Helping individuals and businesses maximize their refunds since 2009.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-3">
                {["Home", "Services", "About Us", "Contact", "FAQ"].map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase().replace(/\s/g, "-")}`} className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-lg mb-4">Services</h4>
              <ul className="space-y-3">
                {["Personal Tax", "Business Tax", "Tax Planning", "IRS Resolution", "Bookkeeping"].map((service) => (
                  <li key={service}>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      {service}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  (877) STS-TAXES
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  support@ststaxrepair.com
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  Los Angeles, CA
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} STS TaxRepair. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
