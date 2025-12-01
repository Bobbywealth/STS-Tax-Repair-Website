import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, FileText, UserPlus, ClipboardList, Loader2, 
  TrendingUp, CheckCircle2, AlertCircle, Calendar,
  ArrowRight, Sparkles, Clock, Zap
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { User, DocumentVersion } from "@shared/mysql-schema";

function FloatingParticles() {
  return (
    <div className="particles-container">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 12}s`,
          }}
        />
      ))}
    </div>
  );
}

function GlowingOrbs() {
  return (
    <div className="orbs-container">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  glowColor,
  delay = 0 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string;
  icon: any;
  gradient: string;
  glowColor: string;
  delay?: number;
}) {
  return (
    <div 
      className="stat-card-wrapper animate-slide-up"
      style={{ animationDelay: `${delay}ms`, ['--glow-color' as any]: glowColor }}
    >
      <Card className="stat-card overflow-visible transition-all duration-300 group border-0">
        <CardContent className="p-0">
          <div className={cn("p-6 text-white relative overflow-hidden rounded-t-lg", gradient)}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
            <div className="stat-shine" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center icon-pulse">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-white/60 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm text-white/80 mt-1">{title}</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-card/80 backdrop-blur-sm border-t border-white/5 rounded-b-lg">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface Lead {
  id: number;
  name: string;
  stage: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
}

export default function Dashboard() {
  // Get current user for personalized greeting
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents/all"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const totalClients = clients?.length || 0;
  const totalDocuments = documents?.length || 0;
  
  const activeLeads = leads?.filter(l => 
    l.stage !== 'Converted' && l.stage !== 'Lost'
  ).length || 0;
  
  const openTasks = tasks?.filter(t => 
    t.status !== 'completed' && t.status !== 'Complete'
  ).length || 0;

  const isLoading = clientsLoading || documentsLoading || leadsLoading || tasksLoading;

  const recentClients = clients?.slice(0, 5) || [];

  const documentsByType = documents?.reduce((acc, doc) => {
    acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topDocTypes = Object.entries(documentsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = currentUser?.firstName || "";
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  };

  return (
    <>
      <style>{`
        /* Futuristic Dashboard Styles */
        .particles-container {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(16, 185, 129, 0.6);
          border-radius: 50%;
          bottom: -10px;
          animation: rise linear infinite;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
        }

        .particle:nth-child(odd) {
          background: rgba(52, 211, 153, 0.5);
          width: 2px;
          height: 2px;
        }

        .particle:nth-child(3n) {
          background: rgba(245, 158, 11, 0.5);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
        }

        @keyframes rise {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }

        .orbs-container {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          animation: float 10s ease-in-out infinite;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%);
          top: -200px;
          right: -100px;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(5, 150, 105, 0.4) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          animation-delay: 3s;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
          top: 40%;
          left: 30%;
          animation-delay: 5s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        .stat-card-wrapper {
          position: relative;
        }

        .stat-card-wrapper::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, var(--glow-color), transparent, var(--glow-color));
          border-radius: 14px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
          filter: blur(8px);
        }

        .stat-card-wrapper:hover::before {
          opacity: 0.5;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stat-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: translateX(-100%);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        .icon-pulse {
          animation: iconPulse 2s ease-in-out infinite;
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .hero-section {
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, 
            rgba(16, 185, 129, 0.9) 0%, 
            rgba(5, 150, 105, 0.95) 50%, 
            rgba(4, 120, 87, 0.9) 100%);
          z-index: 1;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 30px 30px;
          z-index: 2;
        }

        .hero-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(40px);
          z-index: 2;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .glass-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.1);
        }

        .neon-button {
          position: relative;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          overflow: hidden;
        }

        .neon-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          animation: buttonShine 2s infinite;
        }

        @keyframes buttonShine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        .neon-button:hover {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2);
        }

        .quick-action-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .quick-action-card:hover {
          transform: translateY(-4px);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 10px 40px rgba(16, 185, 129, 0.15);
        }

        .client-item {
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .client-item:hover {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .scanline {
          position: fixed;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent);
          animation: scan 6s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes scan {
          0% { top: 0; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <FloatingParticles />
      <GlowingOrbs />
      <div className="scanline" />

      <div className="space-y-6 relative z-10">
        {/* Hero Section */}
        <div className="hero-section rounded-2xl p-8 text-white animate-scale-in">
          <div className="hero-grid" />
          <div className="hero-glow top-0 right-0 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="hero-glow bottom-0 left-1/4 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-8 w-8 text-amber-400 animate-pulse" />
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                    {getGreeting()}!
                  </h1>
                </div>
                <p className="text-emerald-100 mt-2 text-lg">
                  Welcome to your STS TaxRepair command center
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors duration-300 border border-white/10">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">{totalClients} Active Clients</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors duration-300 border border-white/10">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{totalDocuments.toLocaleString()} Documents</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/clients">
                  <Button 
                    size="lg" 
                    className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    data-testid="button-view-clients"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Clients
                  </Button>
                </Link>
                <Link href="/documents">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                    data-testid="button-view-documents"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-emerald-500/20 animate-ping" />
              </div>
              <span className="text-muted-foreground">Loading dashboard data...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Clients"
                value={totalClients.toLocaleString()}
                subtitle="Imported from Perfex CRM"
                icon={Users}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                glowColor="rgba(59, 130, 246, 0.5)"
                delay={0}
              />
              <StatCard
                title="Total Documents"
                value={totalDocuments.toLocaleString()}
                subtitle="Tax returns, W-2s, and more"
                icon={FileText}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                glowColor="rgba(16, 185, 129, 0.5)"
                delay={100}
              />
              <StatCard
                title="Active Leads"
                value={activeLeads}
                subtitle="In your sales pipeline"
                icon={UserPlus}
                gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                glowColor="rgba(245, 158, 11, 0.5)"
                delay={200}
              />
              <StatCard
                title="Open Tasks"
                value={openTasks}
                subtitle="Tasks needing attention"
                icon={ClipboardList}
                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                glowColor="rgba(139, 92, 246, 0.5)"
                delay={300}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 glass-card border-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    Document Overview
                  </CardTitle>
                  <Link href="/documents">
                    <Button variant="ghost" size="sm" className="view-all-link text-emerald-500 hover:text-emerald-400">
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topDocTypes.length > 0 ? (
                      topDocTypes.map(([type, count], index) => {
                        const percentage = Math.round((count / totalDocuments) * 100);
                        const colors = [
                          "bg-gradient-to-r from-blue-500 to-blue-400",
                          "bg-gradient-to-r from-emerald-500 to-emerald-400",
                          "bg-gradient-to-r from-violet-500 to-violet-400",
                          "bg-gradient-to-r from-amber-500 to-amber-400"
                        ];
                        return (
                          <div key={type} className="space-y-2 animate-slide-up" style={{ animationDelay: `${500 + index * 100}ms` }}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{type}</span>
                              <span className="text-muted-foreground">{count.toLocaleString()} ({percentage}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", colors[index])}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{Object.keys(documentsByType).length}</p>
                        <p className="text-xs text-muted-foreground">Document Types</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{Math.round(totalDocuments / Math.max(totalClients, 1))}</p>
                        <p className="text-xs text-muted-foreground">Avg Docs/Client</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '500ms' }}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Recent Clients
                  </CardTitle>
                  <Link href="/clients">
                    <Button variant="ghost" size="sm" className="view-all-link text-emerald-500 hover:text-emerald-400">
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentClients.length > 0 ? (
                    recentClients.map((client, index) => (
                      <Link key={client.id} href={`/clients/${client.id}`}>
                        <div 
                          className="client-item flex items-center gap-3 p-3 rounded-lg cursor-pointer animate-slide-up group"
                          style={{ animationDelay: `${600 + index * 80}ms` }}
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform duration-200 shadow-lg shadow-emerald-500/20">
                            {(client.firstName?.[0] || client.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {client.firstName} {client.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {client.email}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No clients yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/appointments">
                <Card className="quick-action-card glass-card border-0 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                        <Calendar className="h-7 w-7 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Appointments</p>
                        <p className="text-sm text-muted-foreground">Schedule meetings</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/tasks">
                <Card className="quick-action-card glass-card border-0 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-500/30">
                        <AlertCircle className="h-7 w-7 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Tasks</p>
                        <p className="text-sm text-muted-foreground">Manage your to-dos</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/deadlines">
                <Card className="quick-action-card glass-card border-0 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-red-500/30">
                        <Clock className="h-7 w-7 text-red-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Tax Deadlines</p>
                        <p className="text-sm text-muted-foreground">Important dates</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
