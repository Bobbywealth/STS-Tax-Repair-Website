import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
  Briefcase,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [contactForm, setContactForm] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
        description: "We'll get back to you shortly.",
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

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "#services" },
    { label: "Agents", href: "#agents" },
    { label: "Personal Tax", href: "#personal-tax" },
    { label: "Business Tax", href: "#business-tax" },
    { label: "Funding", href: "#funding" },
    { label: "Blog", href: "#blog" },
    { label: "About Us", href: "#about" },
    { label: "Contact us", href: "#contact" },
    { label: "FAQ", href: "#faq" }
  ];

  const services = [
    {
      icon: Calculator,
      title: "Personal Tax Preparation",
      description: "Expert preparation for individual tax returns, maximizing your refunds and ensuring compliance."
    },
    {
      icon: Building2,
      title: "Business Tax Services",
      description: "Comprehensive tax solutions for businesses of all sizes, from startups to established corporations."
    },
    {
      icon: DollarSign,
      title: "Tax Refund Advances",
      description: "Get your refund faster with our advance options. Access your money when you need it most."
    },
    {
      icon: Shield,
      title: "IRS Representation",
      description: "Professional representation for audits, appeals, and other IRS matters."
    },
    {
      icon: TrendingUp,
      title: "Tax Planning",
      description: "Strategic tax planning to minimize liability and maximize savings year-round."
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Secure digital storage and management of all your important tax documents."
    }
  ];

  const stats = [
    { value: "15+", label: "Years Experience" },
    { value: "50K+", label: "Clients Served" },
    { value: "$100M+", label: "Refunds Secured" },
    { value: "99%", label: "Client Satisfaction" }
  ];

  const testimonials = [
    {
      name: "Maria Johnson",
      role: "Small Business Owner",
      content: "STS Tax Repair has been handling my business taxes for 5 years. They always find deductions I would have missed!",
      rating: 5
    },
    {
      name: "James Williams",
      role: "Real Estate Agent",
      content: "Professional, thorough, and always available when I have questions. Highly recommend their services.",
      rating: 5
    },
    {
      name: "Sandra Chen",
      role: "Freelance Designer",
      content: "As a self-employed professional, taxes were always stressful until I found STS. They make it easy!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md shadow-md py-2" 
            : "bg-transparent py-4"
        }`}
        data-testid="header-main"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-sts-primary to-sts-dark flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
                <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-sts-gold rounded-full flex items-center justify-center">
                  <span className="text-sts-dark text-xs font-bold">$</span>
                </div>
              </div>
              <span className={`font-bold text-xl tracking-tight ${isScrolled ? "text-sts-dark" : "text-white"}`}>
                STS <span className="text-sts-gold">TaxRepair</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover-elevate ${
                    isScrolled 
                      ? "text-gray-700 hover:text-sts-primary" 
                      : "text-white/90 hover:text-white"
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
                onClick={() => navigate("/client-login")}
                className="bg-sts-primary hover:bg-sts-primary/90 text-white"
                data-testid="button-appointment"
              >
                Appointment
              </Button>
              <Button 
                onClick={() => navigate("/register")}
                className="bg-sts-primary hover:bg-sts-primary/90 text-white"
                data-testid="button-register"
              >
                Register
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md"
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
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-white/20">
              <nav className="flex flex-col gap-2 mt-4">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isScrolled ? "text-gray-700" : "text-white"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 mt-4 px-4">
                  <Button 
                    onClick={() => navigate("/client-login")}
                    className="bg-sts-primary hover:bg-sts-primary/90 text-white w-full"
                  >
                    Appointment
                  </Button>
                  <Button 
                    onClick={() => navigate("/register")}
                    className="bg-sts-primary hover:bg-sts-primary/90 text-white w-full"
                  >
                    Register
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-sts-dark overflow-hidden" data-testid="section-hero">
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sts-dark via-sts-dark/95 to-sts-primary/20" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sts-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sts-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="grid lg:grid-cols-3 gap-12 items-center">
            {/* Hero Content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium animate-fade-in">
                <Zap className="w-4 h-4 text-sts-gold" />
                EASE YOUR FINANCIAL BURDENS WITH SKILLED ASSISTANCE
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <span className="relative inline-block">
                  Reliable
                  <span className="absolute -bottom-2 left-0 right-0 h-3 bg-sts-gold/60 -skew-x-12" />
                </span>{" "}
                Tax Advisors
              </h1>
              
              <p className="text-lg sm:text-xl text-white/80 max-w-2xl animate-fade-in" style={{ animationDelay: "0.4s" }}>
                Let Us Be Your Trusted Partner. Work alongside a dependable ally invested in your best interests. 
                For the maximum refund you deserve, your search ends here.
              </p>
              
              <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
                <Button 
                  size="lg"
                  className="bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-semibold px-8"
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-hero-contact"
                >
                  CONTACT US
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  className="bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-semibold px-8"
                  onClick={() => navigate("/register")}
                  data-testid="button-hero-register"
                >
                  REGISTER
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-8 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                <div className="flex items-center gap-2 text-white/70">
                  <Shield className="w-5 h-5 text-sts-gold" />
                  <span className="text-sm">IRS Authorized</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Award className="w-5 h-5 text-sts-gold" />
                  <span className="text-sm">CTEC Certified</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-sts-gold" />
                  <span className="text-sm">100% Accuracy Guarantee</span>
                </div>
              </div>
            </div>

            {/* Contact Form Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-sts-dark/80 backdrop-blur-md border-white/10 p-6 shadow-2xl animate-slide-up" data-testid="form-contact-sidebar">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-sts-gold" />
                  Let's Connect!
                </h3>
                
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Name *"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-sts-gold"
                      data-testid="input-contact-name"
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="Location"
                      value={contactForm.location}
                      onChange={(e) => setContactForm(prev => ({ ...prev, location: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-sts-gold"
                      data-testid="input-contact-location"
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="Phone Number *"
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-sts-gold"
                      data-testid="input-contact-phone"
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="Email *"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-sts-gold"
                      data-testid="input-contact-email"
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="Message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-sts-gold min-h-[100px] resize-none"
                      data-testid="input-contact-message"
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full bg-sts-primary hover:bg-sts-primary/90 text-white font-semibold"
                    disabled={isSubmitting}
                    data-testid="button-contact-submit"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b" data-testid="section-stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl sm:text-4xl font-bold text-sts-primary mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50" data-testid="section-services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sts-primary font-semibold text-sm uppercase tracking-wider">What We Offer</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Our <span className="text-sts-primary">Services</span>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Comprehensive tax services tailored to meet your unique needs. From individual returns to complex business filings.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card 
                key={service.title}
                className="p-6 hover-elevate group cursor-pointer border-transparent hover:border-sts-primary/20 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`card-service-${index}`}
              >
                <div className="w-14 h-14 rounded-xl bg-sts-primary/10 flex items-center justify-center mb-4 group-hover:bg-sts-primary transition-colors">
                  <service.icon className="w-7 h-7 text-sts-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="about" className="py-20 bg-white" data-testid="section-about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sts-primary font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-6">
                Your Trusted <span className="text-sts-primary">Tax Partner</span>
              </h2>
              
              <div className="space-y-6">
                {[
                  { icon: Target, title: "Maximum Refund Guarantee", desc: "We find every deduction and credit you deserve" },
                  { icon: Shield, title: "Audit Protection", desc: "Free representation if the IRS audits your return" },
                  { icon: Clock, title: "Fast & Efficient", desc: "Most returns completed within 24-48 hours" },
                  { icon: Users, title: "Expert Tax Professionals", desc: "Certified and experienced tax preparers" }
                ].map((item, index) => (
                  <div key={item.title} className="flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 0.15}s` }}>
                    <div className="w-12 h-12 rounded-lg bg-sts-gold/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-sts-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-sts-primary to-sts-dark rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-white/80 mb-6">
                  Join thousands of satisfied clients who trust STS TaxRepair for their tax needs.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-sts-gold" />
                    <span>Free initial consultation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-sts-gold" />
                    <span>No hidden fees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-sts-gold" />
                    <span>Year-round support</span>
                  </div>
                </div>
                <Button 
                  className="mt-8 bg-sts-gold hover:bg-sts-gold/90 text-sts-dark font-semibold w-full"
                  onClick={() => navigate("/register")}
                  data-testid="button-get-started"
                >
                  Get Started Today
                </Button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-sts-gold/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-sts-primary/20 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50" data-testid="section-testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sts-primary font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              What Our <span className="text-sts-primary">Clients Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name}
                className="p-6 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
                data-testid={`card-testimonial-${index}`}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-sts-gold text-sts-gold" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sts-primary/20 flex items-center justify-center">
                    <span className="text-sts-primary font-semibold">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-sts-dark" data-testid="section-contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="text-white">
              <span className="text-sts-gold font-semibold text-sm uppercase tracking-wider">Get In Touch</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-6">
                Contact <span className="text-sts-gold">Us</span>
              </h2>
              <p className="text-white/70 mb-8">
                Have questions? We're here to help. Reach out to our team and we'll get back to you promptly.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-sts-gold" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">Phone</div>
                    <div className="text-white font-medium">(555) 123-4567</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-sts-gold" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">Email</div>
                    <div className="text-white font-medium">info@ststaxrepair.com</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-sts-gold" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">Address</div>
                    <div className="text-white font-medium">123 Tax Avenue, Suite 100</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-sts-gold" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">Business Hours</div>
                    <div className="text-white font-medium">Mon - Fri: 9AM - 6PM</div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-white p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input placeholder="First Name" className="bg-gray-50" data-testid="input-footer-firstname" />
                  <Input placeholder="Last Name" className="bg-gray-50" data-testid="input-footer-lastname" />
                </div>
                <Input placeholder="Email" type="email" className="bg-gray-50" data-testid="input-footer-email" />
                <Input placeholder="Phone" type="tel" className="bg-gray-50" data-testid="input-footer-phone" />
                <Textarea placeholder="Your Message" className="bg-gray-50 min-h-[120px] resize-none" data-testid="input-footer-message" />
                <Button className="w-full bg-sts-primary hover:bg-sts-primary/90 text-white" data-testid="button-footer-submit">
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" data-testid="footer-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sts-primary to-sts-dark flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-bold text-xl">
                  STS <span className="text-sts-gold">TaxRepair</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted partner for all tax preparation and advisory services.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#services" className="hover:text-sts-gold transition-colors">Services</a></li>
                <li><a href="#about" className="hover:text-sts-gold transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-sts-gold transition-colors">Contact</a></li>
                <li><a href="#faq" className="hover:text-sts-gold transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-sts-gold transition-colors">Personal Tax</a></li>
                <li><a href="#" className="hover:text-sts-gold transition-colors">Business Tax</a></li>
                <li><a href="#" className="hover:text-sts-gold transition-colors">Tax Planning</a></li>
                <li><a href="#" className="hover:text-sts-gold transition-colors">IRS Representation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  info@ststaxrepair.com
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} STS TaxRepair. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-sts-gold transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-sts-gold transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
