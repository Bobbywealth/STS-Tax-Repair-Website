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
  ChevronLeft,
  Sparkles,
  Lock,
  HeadphonesIcon,
  BarChart3,
  FileCheck,
  Banknote,
  UserCheck,
  Globe,
  Quote,
  RefreshCw,
  CreditCard,
  Landmark,
  Search,
  Check
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

const STS_LOGO_URL = "https://www.ststaxrepair.net/wp-content/uploads/2023/12/STS-Logo.webp";

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
  const [newsletterEmail, setNewsletterEmail] = useState("");
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

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "#services" },
    { label: "Agents", href: "#agents" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "FAQ", href: "#faq" }
  ];

  const services = [
    {
      icon: RefreshCw,
      iconImage: "https://www.ststaxrepair.net/wp-content/uploads/2023/12/svgviewer-output-3.svg",
      title: "Professional Tax Filing",
      description: "Our expert tax filing service ensures accuracy and maximum returns. We meticulously navigate the complexities of tax codes, asking the right questions to secure your highest refund. Trust our professionals to handle your taxes with precision and expertise, delivering peace of mind and financial benefit.",
      hasButton: true
    },
    {
      icon: CreditCard,
      iconImage: "https://www.ststaxrepair.net/wp-content/uploads/2023/12/svgviewer-output-2.svg",
      title: "Credit Restoration",
      description: "Rebuild your credit with our comprehensive restoration service. We analyze credit reports, identifying discrepancies and errors. Through strategic interventions, we dispute inaccuracies and guide you towards improved credit health. Let us help restore your financial standing and open doors to better opportunities.",
      agent: "Jessica Zephir",
      phone: "7868051104",
      email: "Zephirfinancialgroup@Outlook.Com"
    },
    {
      icon: Landmark,
      iconImage: null,
      title: "Business Registration",
      description: "Seamlessly establish your business with our registration service. We navigate the bureaucratic landscape, ensuring your incorporation process is efficient and compliant. From paperwork to legal formalities, we handle every step, allowing you to focus on your business vision. Trust us to register your business accurately and expediently.",
      hasButton: true
    },
    {
      icon: Search,
      iconImage: "https://www.ststaxrepair.net/wp-content/uploads/2023/12/svgviewer-output.svg",
      title: "Business Loans",
      description: "Access financial support for your business growth with our comprehensive loan service. We assess your needs, guiding you to suitable loan options. From application to approval, we streamline the process, securing favorable terms. Count on us to help your business thrive with tailored loan solutions designed for your success.",
      hasButton: true
    }
  ];

  const agents = [
    {
      name: "Stephedena Cherfils",
      role: "Service Support",
      phone: "954-534-5227",
      email: "Info.ststax@gmail.com",
      address: "24 Greenway Plz Suite 1800, Houston, TX 77046, USA",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face"
    },
    {
      name: "Withney Simon",
      role: "Service Support",
      phone: "4074277619",
      email: "Withney.ststax@yahoo.com",
      address: "24 Greenway Plz Suite 1800, Houston, TX 77046, USA",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face"
    },
    {
      name: "Keelie Duvignaud",
      role: "Service Support",
      phone: "772-877-1588",
      email: "Taxesbykeys@gmail.com",
      address: "3181 SW Crenshaw St, Port St. Lucie, FL 34953, USA",
      image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop&crop=face"
    },
    {
      name: "Christy S Dor",
      role: "Service Support",
      phone: "561-932-6114",
      email: "christyststaxrepair@gmail.com",
      address: "Florida Office, USA",
      image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=200&h=200&fit=crop&crop=face"
    },
    {
      name: "Alexandra Isaac",
      role: "Service Support",
      phone: "786/352-2038",
      email: "isaacalexandra.ststaxrepair@gmail.com",
      address: "4000 Hollywood Blvd, Suite 555-S, Hollywood FL, 33021",
      image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=200&fit=crop&crop=face"
    },
    {
      name: "Jennifer Constantino",
      role: "Service Support",
      phone: "(954) 629-6424",
      email: "jennconstantino93@gmail.com",
      address: "4000 Hollywood Blvd, Suite 555-S, Hollywood FL, 33021",
      image: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=200&h=200&fit=crop&crop=face"
    },
    {
      name: "Alix Alexandre",
      role: "Service Support",
      phone: "4074613644",
      email: "Alixalexandre36@gmail.com",
      address: "24 Greenway Plz Suite 1800, Houston, TX 77046, USA",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face"
    },
    {
      name: "Leonela Reyes",
      role: "Service Support",
      phone: "(956)-739-4200",
      email: "lmrtaxrepair@gmail.com",
      address: "24 Greenway Plz Suite 1800, Houston, TX 77046, USA",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face"
    }
  ];

  const pricingPlans = [
    {
      title: "Agent Packages",
      price: "$950",
      description: "Become a proficient tax preparer with our Agent Package. Access comprehensive training, top-notch software, ongoing support, and networking opportunities to kickstart your career in tax preparation.",
      features: ["Professional Training", "Software & Tools", "Support & Guidance", "Networking Opportunities"],
      featured: false
    },
    {
      title: "Professional Tax Preparers Package",
      price: "$1,850",
      description: "Elevate your expertise with our Professional Tax Preparers Package. Gain advanced training, priority support, enhanced resources, and marketing assistance to excel in complex tax scenarios and grow your client base.",
      features: ["Advanced Training", "Priority Support", "Enhanced Resources", "Marketing Support"],
      featured: true
    },
    {
      title: "Start A Franchise",
      price: "$25,000",
      description: "Invest in your future with our Franchise Package. Join an established brand, receive comprehensive training, exclusive territories, and business development assistance to launch and expand your tax preparation franchise successfully.",
      features: ["Established Brand", "Comprehensive Training & Support", "Exclusive Territories", "Business Development Assistance"],
      featured: false
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
      a: "Yes! While we have offices in California, Texas, and Florida, we serve clients across all 50 states through our secure online portal."
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Sticky Header with Glass Effect */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100" 
            : "bg-white shadow-md"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        data-testid="header-main"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Real Logo */}
            <Link href="/" className="flex items-center gap-3 group" data-testid="link-home-logo">
              <img 
                src={STS_LOGO_URL} 
                alt="STS TaxRepair" 
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    link.label === "Agents" || link.label === "Pricing" 
                      ? "text-gray-800 font-bold hover:text-sts-primary hover:bg-sts-primary/5" 
                      : "text-gray-700 hover:text-sts-primary hover:bg-sts-primary/5"
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
                className="font-semibold text-gray-700 hover:text-sts-primary hover:bg-sts-primary/5"
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
              className="xl:hidden p-2 rounded-lg transition-colors hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900" />
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
                <nav className="flex flex-col gap-1 py-4 border-t border-gray-100">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="px-4 py-3 text-base font-medium rounded-lg text-gray-700 hover:bg-gray-100"
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

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ position: 'relative' }}
        data-testid="section-hero"
      >
        {/* Desktop Background Image with Animation - hidden on mobile */}
        <motion.div 
          className="absolute inset-0 hidden lg:block overflow-hidden"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-center"
            style={{ 
              backgroundImage: `url('https://www.ststaxrepair.net/wp-content/uploads/2024/12/a-1-6750cc8c5d05a.webp')`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat'
            }}
            animate={{ 
              x: [0, -15, 0],
              y: [0, -8, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        
        {/* Desktop Futuristic Effects Layer */}
        <div className="absolute inset-0 hidden lg:block overflow-hidden pointer-events-none">
          {/* Vignette Effect - Faint edges */}
          <div className="absolute inset-0 bg-radial-gradient opacity-[0.15] pointer-events-none" style={{
            background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.4) 100%)'
          }} />
          {/* Gradient Overlay - Light at top, fade to black at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40" />
          <motion.div 
            className="absolute top-0 left-0 w-full h-full opacity-[0.01]"
            animate={{ 
              background: [
                'radial-gradient(ellipse at 60% 30%, rgba(253, 185, 19, 0.15) 0%, transparent 35%)',
                'radial-gradient(ellipse at 40% 60%, rgba(253, 185, 19, 0.15) 0%, transparent 35%)',
                'radial-gradient(ellipse at 60% 30%, rgba(253, 185, 19, 0.15) 0%, transparent 35%)'
              ]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating Particles - Desktop */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`desktop-particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 8 + 3,
                height: Math.random() * 8 + 3,
                left: `${Math.random() * 60}%`,
                top: `${Math.random() * 100}%`,
                background: i % 2 === 0 ? 'rgba(253, 185, 19, 0.7)' : 'rgba(76, 175, 80, 0.6)',
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 30 - 15, 0],
                opacity: [0.2, 0.7, 0.2],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          ))}
          
          {/* Scanning Light Beams - Desktop */}
          <motion.div
            className="absolute top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-sts-gold/40 to-transparent"
            animate={{ x: ['-5%', '70%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
          />
          <motion.div
            className="absolute top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-sts-primary/30 to-transparent"
            animate={{ x: ['70%', '-5%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 4, delay: 2 }}
          />
          
          {/* Tech Grid Lines */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
          
          {/* Corner Tech Decorations */}
          <div className="absolute top-32 left-8 w-20 h-20 border-l-2 border-t-2 border-sts-gold/30 rounded-tl-lg" />
          <div className="absolute bottom-32 left-8 w-20 h-20 border-l-2 border-b-2 border-sts-gold/30 rounded-bl-lg" />
        </div>
        
        {/* Mobile/Tablet Futuristic Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f14] via-sts-dark to-[#0a1f14] lg:hidden overflow-hidden">
          {/* Animated Mesh Gradients */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-full opacity-40"
            animate={{ 
              background: [
                'radial-gradient(ellipse at 20% 20%, rgba(76, 175, 80, 0.3) 0%, transparent 50%)',
                'radial-gradient(ellipse at 80% 80%, rgba(76, 175, 80, 0.3) 0%, transparent 50%)',
                'radial-gradient(ellipse at 20% 20%, rgba(76, 175, 80, 0.3) 0%, transparent 50%)'
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-0 left-0 w-full h-full opacity-30"
            animate={{ 
              background: [
                'radial-gradient(ellipse at 80% 30%, rgba(253, 185, 19, 0.25) 0%, transparent 40%)',
                'radial-gradient(ellipse at 20% 70%, rgba(253, 185, 19, 0.25) 0%, transparent 40%)',
                'radial-gradient(ellipse at 80% 30%, rgba(253, 185, 19, 0.25) 0%, transparent 40%)'
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 2 === 0 ? 'rgba(253, 185, 19, 0.6)' : 'rgba(76, 175, 80, 0.5)',
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
          
          {/* Scanning Light Beam */}
          <motion.div
            className="absolute top-0 w-1 h-full bg-gradient-to-b from-transparent via-sts-gold/30 to-transparent"
            animate={{ x: ['-10%', '110%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
          
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        {/* Dark Overlay for Desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d2818]/90 via-sts-dark/70 to-sts-dark/40 hidden lg:block" />

        <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
          {/* Mobile Futuristic Hero - shown only on mobile/tablet */}
          <div className="lg:hidden pt-28 pb-10">
            {/* Team Photo with Animated Border */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
              className="relative mx-auto max-w-sm"
            >
              {/* Outer Rotating Rainbow Border */}
              <div className="absolute -inset-1.5 rounded-2xl overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'conic-gradient(from 0deg, #FDB913, #4CAF50, #1a4d2e, #FDB913)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              {/* Soft Gradient Glow Behind */}
              <div className="absolute -inset-4 bg-gradient-to-br from-sts-primary/20 via-transparent to-sts-gold/15 rounded-3xl blur-xl" />
              
              {/* Clean Image Container */}
              <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/40 bg-sts-dark">
                {/* Slight dark overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10" />
                
                <motion.img 
                  src="https://www.ststaxrepair.net/wp-content/uploads/2025/01/Untitled-design-3.png"
                  alt="STS Tax Team"
                  className="w-full h-64 object-cover object-center"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
                
                {/* Subtle Scanline Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-sts-gold/5 to-transparent pointer-events-none"
                  animate={{ y: ['-100%', '100%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Corner Tech Brackets */}
                <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-sts-gold/60 z-20" />
                <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-sts-gold/60 z-20" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-sts-gold/60 z-20" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-sts-gold/60 z-20" />
              </div>
            </motion.div>
            
            {/* Content Section with Dark Overlay */}
            <motion.div
              className="mt-8 mx-auto max-w-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Soft Dark Overlay Card */}
              <div className="relative p-6 rounded-2xl bg-black/20 backdrop-blur-md">
                <div className="space-y-5 text-center flex flex-col items-center">
                  {/* Title with Better Hierarchy */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h1 className="text-4xl font-black leading-[1.15] tracking-tight text-center">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-sts-gold via-yellow-300 to-sts-gold drop-shadow-lg">
                        Reliable
                      </span>
                      <br />
                      <span className="text-white">Tax Advisors</span>
                    </h1>
                    <p className="text-sts-gold font-semibold text-sm tracking-wide mt-2">STS TAX REPAIR</p>
                  </motion.div>
                  
                  {/* Supporting Text with Better Spacing */}
                  <motion.p 
                    className="text-white/80 text-base leading-relaxed px-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Let us be your trusted partner. Work alongside a dependable ally invested in your best interests.
                  </motion.p>
                  
                  {/* CTA Buttons - Full Width with Better Styling */}
                  <motion.div 
                    className="flex flex-col gap-4 pt-3 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#fbd247] to-[#d4a016] hover:from-[#d4a016] hover:to-[#fbd247] text-sts-dark font-bold h-14 text-base shadow-xl shadow-sts-gold/40 relative overflow-hidden group rounded-xl"
                      onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        CONTACT US
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="w-full border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 font-semibold h-14 text-base rounded-xl"
                      onClick={() => navigate("/client-login")}
                    >
                      REGISTER
                      <ChevronRight className="w-6 h-6 ml-2" />
                    </Button>
                  </motion.div>
                  
                  {/* Trust Badges - Directly Under Buttons */}
                  <motion.div 
                    className="flex flex-wrap justify-center gap-4 pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {[
                      { icon: Shield, text: "IRS Authorized" },
                      { icon: Award, text: "CTEC Certified" },
                      { icon: Lock, text: "100% Accuracy" }
                    ].map((item, index) => (
                      <motion.div 
                        key={item.text}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                      >
                        <item.icon className="w-5 h-5 text-sts-gold" />
                        <span className="text-white/90 text-sm font-medium">{item.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="py-8 lg:py-16 lg:pt-56"
            style={{ opacity: heroOpacity, y: heroY }}
          >
            <div className="w-full flex justify-center">
              {/* Hero Content */}
              <div className="space-y-6 lg:space-y-8 max-w-2xl text-center">
              <motion.h1 
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[1.1] tracking-wider text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-sts-gold to-yellow-300">
                    Reliable
                  </span>
                </span>
                <br />
                <span className="text-7xl sm:text-8xl lg:text-9xl font-black">Tax Advisors</span>
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Let Us Be Your Trusted Partner. Work alongside a dependable ally invested in your best interests. For the maximum refund you deserve, your search ends here.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap gap-4 justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-yellow-300 via-sts-gold to-yellow-400 hover:from-yellow-400 hover:via-yellow-300 hover:to-sts-gold text-sts-dark font-bold px-8 py-3 h-auto text-base shadow-2xl shadow-sts-gold/40 hover:shadow-sts-gold/60 transition-all group relative overflow-hidden rounded-lg"
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-hero-contact"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    CONTACT US
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                  />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/40 bg-white/5 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white hover:text-sts-dark font-semibold px-8 py-3 h-auto text-base relative overflow-hidden group rounded-lg shadow-lg hover:shadow-white/30"
                  onClick={() => navigate("/client-login")}
                  data-testid="button-hero-register"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    REGISTER
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  { icon: Shield, text: "IRS Authorized E-File" },
                  { icon: Award, text: "CTEC Certified" },
                  { icon: Lock, text: "100% Accuracy Guarantee" }
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-sts-gold" />
                    </div>
                    <span className="text-sm font-semibold">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>
            </div>
          </motion.div>
        </div>


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

      {/* We Service All 50 States Banner */}
      <section className="py-8 bg-gradient-to-r from-sts-dark via-[#0a1f14] to-sts-dark border-t border-b border-sts-gold/30 shadow-xl shadow-sts-gold/5" data-testid="section-states-banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex items-center justify-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Globe className="w-10 h-10 text-sts-gold drop-shadow-lg" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black text-sts-gold text-center drop-shadow-md tracking-wide">
              We Service All 50 States
            </h2>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            >
              <Globe className="w-10 h-10 text-sts-gold drop-shadow-lg" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Us - Agents Section */}
      <section className="py-20 bg-white" data-testid="section-about-agents">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4 text-sm font-semibold">
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
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-about-contact"
              >
                Contact Us
              </Button>
            </motion.div>

            {/* Right - Team Group Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://www.ststaxrepair.net/wp-content/uploads/2024/12/stephedena-cherfils.webp"
                  alt="STS Tax Repair Team"
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
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
              Expert Tax Consulting <span className="text-sts-primary">Services</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.map((service, index) => (
              <motion.div key={service.title} variants={fadeInUp}>
                <Card 
                  className="p-8 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full group"
                  data-testid={`card-service-${index}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-sts-primary/10 flex items-center justify-center mb-6 group-hover:bg-sts-primary group-hover:scale-110 transition-all overflow-hidden">
                    {service.iconImage ? (
                      <img 
                        src={service.iconImage} 
                        alt={service.title}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <service.icon className="w-8 h-8 text-sts-primary group-hover:text-white transition-colors" />
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-sts-primary mb-4">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
                  
                  {service.hasButton && (
                    <Button className="bg-sts-primary hover:bg-sts-primary/90 text-white">
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  
                  {service.agent && (
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <p className="font-semibold text-gray-900">Agent: {service.agent}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-sts-primary" /> {service.phone}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-sts-primary" /> {service.email}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-[#3c4f56] relative overflow-hidden" data-testid="section-why-choose">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Badge className="bg-sts-gold/20 text-sts-gold border-0 mb-4 text-sm font-semibold">
                WHY CHOOSE US?
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                Unleashing Your{" "}
                <span className="relative inline-block">
                  <span className="text-sts-gold">Maximum</span>
                  <svg 
                    className="absolute -bottom-2 left-0 w-full" 
                    viewBox="0 0 200 12" 
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path 
                      d="M2 8 Q50 2, 100 6 T198 4" 
                      stroke="#FDB913" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
                {" "}Tax Return Potential.
              </h2>
              <p className="text-white/80 text-lg mb-10 leading-relaxed">
                At STS Tax Repair, we understand that when it comes to entrusting someone with your taxes, you want assurance, expertise, and a commitment to your financial success.
              </p>

              {/* 6 Bullet Points in 2 columns */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Tailored Approach",
                  "Unmatched Tax Code Mastery",
                  "Refund Maximization",
                  "Unwavering Commitment",
                  "Dedication to Your Earnings",
                  "Personalized Accountability"
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-sts-gold/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-sts-gold" />
                    </div>
                    <span className="text-white font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-sts-gold/20 to-sts-primary/20 rounded-3xl blur-2xl opacity-50" />
              <img 
                src="https://www.ststaxrepair.net/wp-content/uploads/2024/12/a-1-6750cc8c5d05a.webp"
                alt="STS Tax Team"
                className="relative w-full h-auto object-cover rounded-3xl drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Beyond Traditional CTA Section */}
      <section className="py-28 relative overflow-hidden" data-testid="section-beyond">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80')`,
          }}
        />
        {/* Teal/Dark Green Overlay */}
        <div className="absolute inset-0 bg-[#1a4d4d]/90" />
        
        {/* Subtle Gradient Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sts-gold rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sts-primary rounded-full blur-[100px]" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-8 leading-tight">
              Beyond{" "}
              <span className="relative inline-block">
                <span className="text-sts-gold">Traditional</span>
                <svg 
                  className="absolute -bottom-2 left-0 w-full" 
                  viewBox="0 0 200 12" 
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M2 8 Q50 2, 100 6 T198 4" 
                    stroke="#FDB913" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
              {" "}Tax Services: Your<br />Financial Advocates.
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
              Discover the difference with The Tax Team, your partners in comprehensive tax solutions. Our experts don't stop at routine tax preparation; we immerse ourselves in understanding your finances. Through meticulous questioning, we unearth potential credits and deductions, ensuring you receive every possible benefit.
            </p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-sts-gold hover:from-orange-600 hover:to-yellow-500 text-white font-bold px-12 h-16 text-lg shadow-2xl shadow-orange-500/30 rounded-full"
                data-testid="button-call-now"
              >
                <Phone className="w-6 h-6 mr-3" />
                Call Us Now
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white" data-testid="section-about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="text-center mb-12"
            >
              <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
                About Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                Minimizing Liabilities, <span className="text-sts-primary">Maximizing Deductions</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                For over 15 years, STS TaxRepair has been helping individuals and businesses navigate the complex world of taxation. Our commitment to excellence has earned us the trust of over 50,000 clients across all 50 states.
              </p>
            </motion.div>
              
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Target, title: "Maximum Refund Guarantee", desc: "We find every deduction and credit you're entitled to" },
                { icon: Shield, title: "Free Audit Protection", desc: "We stand behind our work with full IRS representation" },
                { icon: Clock, title: "Fast Turnaround", desc: "Most returns completed within 24-48 hours" },
                { icon: HeadphonesIcon, title: "Year-Round Support", desc: "Questions? We're here for you 365 days a year" }
              ].map((item, index) => (
                <motion.div 
                  key={item.title} 
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-sts-gold/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-sts-gold" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-sts-gold to-yellow-400 hover:from-sts-gold hover:to-yellow-500 text-sts-dark font-bold shadow-lg"
                onClick={() => navigate("/client-login")}
                data-testid="button-get-started"
              >
                Get Started Today
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section id="agents" className="py-24 bg-gray-50" data-testid="section-agents">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
              Our Team
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
              Meet Our <span className="text-sts-primary">Agents</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {agents.map((agent, index) => (
              <motion.div key={agent.name} variants={fadeInUp}>
                <Card 
                  className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  data-testid={`card-agent-${index}`}
                >
                  {/* Agent Avatar */}
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-lg group-hover:scale-110 transition-transform ring-4 ring-sts-primary/20">
                    <img 
                      src={agent.image} 
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.role}</p>
                    <div className="flex justify-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-sts-gold fill-sts-gold" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-sts-primary flex-shrink-0" />
                      <span className="truncate">{agent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-sts-primary flex-shrink-0" />
                      <span className="truncate text-xs">{agent.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-sts-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs line-clamp-2">{agent.address}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4 bg-sts-primary hover:bg-sts-primary/90 text-white"
                    size="sm"
                  >
                    Contact Agent
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white" data-testid="section-pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-sts-primary/10 text-sts-primary border-0 mb-4">
              PRICING PLAN
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Find The Ideal Fit <span className="text-sts-primary">For You.</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Enhance your experience with plans designed to suit your requirements
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div key={plan.title} variants={fadeInUp}>
                <Card 
                  className={`p-8 h-full ${
                    plan.featured 
                      ? "bg-sts-dark text-white border-0 shadow-2xl scale-105" 
                      : "bg-white border-0 shadow-lg hover:shadow-xl"
                  } transition-all duration-300`}
                  data-testid={`card-pricing-${index}`}
                >
                  <h3 className={`text-xl font-bold mb-4 ${plan.featured ? "text-white" : "text-gray-900"}`}>
                    {plan.title}
                  </h3>
                  
                  <div className="mb-6">
                    <span className="text-4xl sm:text-5xl font-black text-sts-gold">{plan.price}</span>
                  </div>
                  
                  <p className={`mb-6 leading-relaxed ${plan.featured ? "text-white/70" : "text-gray-600"}`}>
                    {plan.description}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          plan.featured ? "bg-sts-gold/20" : "bg-sts-primary/10"
                        }`}>
                          <Check className={`w-3 h-3 ${plan.featured ? "text-sts-gold" : "text-sts-primary"}`} />
                        </div>
                        <span className={plan.featured ? "text-white/90" : "text-gray-700"}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      plan.featured 
                        ? "bg-gradient-to-r from-sts-gold to-yellow-400 text-sts-dark hover:from-sts-gold hover:to-yellow-500" 
                        : "bg-sts-primary hover:bg-sts-primary/90 text-white"
                    } font-bold h-12`}
                  >
                    Get Started
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
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
                transition={{ duration: 0.25 }}
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

      {/* Newsletter Section */}
      <section className="relative overflow-hidden" data-testid="section-newsletter">
        <div className="grid md:grid-cols-2">
          {/* Left Side - Dark */}
          <div className="bg-sts-dark py-16 px-8 md:px-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Subscribe For Our Newslater
              </h2>
              <p className="text-white/70 text-lg">
                Stay Informed, Stay Ahead: Subscribe to STSTaxRepair
              </p>
            </motion.div>
          </div>
          
          {/* Right Side - Gold */}
          <div className="bg-gradient-to-br from-sts-gold to-yellow-400 py-16 px-8 md:px-16">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sts-dark/70 font-medium mb-4">Early Bird Notifications</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-white border-0 h-12 flex-1"
                  data-testid="input-newsletter-email"
                />
                <Button 
                  type="submit"
                  className="bg-sts-dark hover:bg-sts-dark/90 text-white h-12 px-8"
                  data-testid="button-newsletter-submit"
                >
                  Submit
                </Button>
              </form>
            </motion.div>
          </div>
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
                  { icon: Phone, label: "Phone", value: "(929) 235-0185", subtext: "Mon-Sat 8am-8pm" },
                  { icon: Mail, label: "Email", value: "ststaxrepair@gmail.com", subtext: "We reply within 24 hours" },
                  { icon: MapPin, label: "Office", value: "4000 Hollywood Blvd, Suite 555-S", subtext: "Hollywood FL, 33021" }
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16" data-testid="footer-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <img 
                src={STS_LOGO_URL} 
                alt="STS TaxRepair" 
                className="h-16 w-auto mb-6"
              />
              <p className="text-gray-400 leading-relaxed">
                It's simple, we focus on the details. Our team of professionals will ask you the right questions to ensure that you always receive the maximum return on your taxes.
              </p>
            </div>

            {/* Address 1 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-sts-gold" />
                <h4 className="font-bold text-lg">Address</h4>
              </div>
              <div className="space-y-3 text-gray-400">
                <p>4000 Hollywood Blvd, Suite 555-S, Hollywood FL, 33021</p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (929) 235-0185
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  amtaxrepair@gmail.com
                </p>
              </div>
            </div>

            {/* Address 2 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-sts-gold" />
                <h4 className="font-bold text-lg">Address</h4>
              </div>
              <div className="space-y-3 text-gray-400">
                <p>24 Greenway Plz Suite 1800, Houston, TX 77046, USA</p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (954) 851-4159
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ststaxrepair@gmail.com
                </p>
              </div>
            </div>

            {/* Address 3 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-sts-gold" />
                <h4 className="font-bold text-lg">Address</h4>
              </div>
              <div className="space-y-3 text-gray-400">
                <p>110 East Broward Blvd., Suite 1700, Fort Lauderdale, 33301</p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  9548514159
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ststaxrepair@gmail.com
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              ©Copyright 2024 Ststaxrepair.com. All Rights Reserved
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
