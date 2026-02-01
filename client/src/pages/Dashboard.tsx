import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users, FileText, UserPlus, ClipboardList,
  TrendingUp, CheckCircle2, AlertCircle, Calendar,
  ArrowRight, Sparkles, Clock, Zap, Activity, Timer
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/PullToRefresh";
import { queryClient } from "@/lib/queryClient";
import type { User, DocumentVersion, AuditLog } from "@shared/mysql-schema";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { useBranding } from "@/hooks/useBranding";

function LiveClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formattedTime = format(currentTime, 'h:mm a');
  const formattedTimeFull = format(currentTime, 'h:mm:ss a');
  const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy');
  const formattedDateShort = format(currentTime, 'MMM d');
  
  return (
    <div className="dashboard-clock-widget flex flex-col items-end" data-testid="widget-clock">
      {/* Mobile: Compact time only */}
      <div className="md:hidden">
        <span className="text-sm font-mono font-bold">{formattedTime}</span>
      </div>
      {/* Desktop: Full clock display */}
      <div className="hidden md:block">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-white/80" />
          <span className="text-xl font-mono font-bold tracking-wider">{formattedTimeFull}</span>
        </div>
        <div className="text-sm text-white/70 mt-0.5">
          {formattedDate}
        </div>
      </div>
    </div>
  );
}

function TaxDeadlineCountdown() {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  // Calculate next tax deadline (April 15 of current or next year)
  const currentYear = now.getFullYear();
  let taxDeadline = new Date(currentYear, 3, 15); // April 15 (month is 0-indexed)
  
  // If we're past April 15 this year, show next year's deadline
  if (now > taxDeadline) {
    taxDeadline = new Date(currentYear + 1, 3, 15);
  }
  
  const daysRemaining = differenceInDays(taxDeadline, now);
  const isUrgent = daysRemaining <= 30;
  const isCritical = daysRemaining <= 7;
  
  return (
    <>
      {/* Mobile: Compact deadline */}
      <div 
        className={cn(
          "md:hidden flex-shrink-0 snap-start flex items-center gap-2 rounded-lg px-3 py-2 border",
          isCritical ? "border-red-400/50 bg-red-500/20" : 
          isUrgent ? "border-amber-400/50 bg-amber-500/20" : 
          "bg-white/15 border-white/10"
        )}
        data-testid="widget-tax-deadline-mobile"
      >
        <Timer className={cn(
          "h-4 w-4",
          isCritical ? "text-red-200" : 
          isUrgent ? "text-amber-200" : 
          "text-white/80"
        )} />
        <div className="text-sm">
          <span className="font-bold">{daysRemaining}</span>
          <span className="text-white/70 ml-1">days left</span>
        </div>
      </div>

      {/* Desktop: Full deadline widget */}
      <div
        className={cn(
          "hidden md:flex dashboard-deadline-widget items-center gap-3 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 border",
          isCritical ? "border-red-400/50 bg-red-500/20" :
          isUrgent ? "border-amber-400/50 bg-amber-500/20" :
          "border-white/20"
        )}
        data-testid="widget-tax-deadline"
      >
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center",
          isCritical ? "bg-red-500/30" : 
          isUrgent ? "bg-amber-500/30" : 
          "bg-white/20"
        )}>
          <Timer className={cn(
            "h-5 w-5",
            isCritical ? "text-red-200 animate-pulse" : 
            isUrgent ? "text-amber-200" : 
            "text-white"
          )} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-2xl font-bold",
              isCritical ? "text-red-200" : 
              isUrgent ? "text-amber-200" : 
              "text-white"
            )}>
              {daysRemaining}
            </span>
            <span className="text-sm text-white/80">days</span>
          </div>
          <span className="text-xs text-white/70">
            Until {format(taxDeadline, 'MMM d, yyyy')} Tax Deadline
          </span>
        </div>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-emerald-500",
  bgColor = "bg-emerald-500/10",
  trend,
  trendLabel,
  delay = 0
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  iconColor?: string;
  bgColor?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  delay?: number;
}) {
  const trendColors = {
    up: "text-emerald-500",
    down: "text-red-500",
    neutral: "text-muted-foreground",
  }

  const trendIcons = {
    up: TrendingUp,
    down: TrendingUp,
    neutral: TrendingUp,
  }

  const TrendIcon = trend ? trendIcons[trend] : TrendingUp

  return (
    <div
      className="animate-slide-up hover:shadow-lg transition-shadow duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Card className="overflow-visible transition-all duration-300 group hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", bgColor)}>
                <Icon className={cn("h-6 w-6", iconColor)} />
              </div>
              {trend && (
                <div className={cn("flex items-center gap-1 text-sm font-medium", trendColors[trend])}>
                  <TrendIcon className={cn("h-4 w-4", trend === "down" && "rotate-180")} />
                  {trendLabel}
                </div>
              )}
            </div>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-sm font-medium mt-1">{title}</p>
          </div>
          <div className="px-6 py-3 bg-muted/50 border-t">
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

  const { branding } = useBranding(currentUser?.officeId || undefined);
  const portalCompanyName = branding?.companyName || "STS TaxRepair";

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

  const { data: activityLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs?limit=10"],
  });

  // `/api/users` can include staff for assignment dropdowns; dashboard "clients"
  // metrics should count *only* client-role users (or legacy rows with null role).
  const clientUsers =
    clients?.filter((u) => {
      const role = (u.role || "").toLowerCase();
      return role === "" || role === "client";
    }) || [];

  const totalClients = clientUsers.length;
  const totalDocuments = documents?.length || 0;
  
  const activeLeads = leads?.filter(l => 
    l.stage !== 'Converted' && l.stage !== 'Lost'
  ).length || 0;
  
  const openTasks = tasks?.filter(t => 
    t.status !== 'completed' && t.status !== 'Complete'
  ).length || 0;

  const isLoading = clientsLoading || documentsLoading || leadsLoading || tasksLoading;

  const recentClients = clientUsers.slice(0, 5);

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

  const handleRefresh = async () => {
    await queryClient.refetchQueries();
  };

  return (
    <>
      {/* Decorative effects - hidden on mobile for performance */}
      <div className="hidden md:block">
        <div className="dashboard-particles-container">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="dashboard-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 12}s`,
              }}
            />
          ))}
        </div>
        <div className="dashboard-orbs-container">
          <div className="dashboard-orb dashboard-orb-1" />
          <div className="dashboard-orb dashboard-orb-2" />
          <div className="dashboard-orb dashboard-orb-3" />
        </div>
        <div className="dashboard-scanline" />
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
        <div className="space-y-6 relative z-10 p-1">
          {/* Hero Section - Compact on Mobile */}
        <div className="dashboard-hero-section rounded-2xl p-4 md:p-8 text-white">
          <div className="dashboard-hero-grid" />
          <div className="hidden md:block">
            <div className="dashboard-hero-glow top-0 right-0 animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="dashboard-hero-glow bottom-0 left-1/4 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          </div>
          
          <div className="relative z-10">
            {/* Mobile: Compact greeting with inline clock */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  {/* iOS-style large title */}
                  <h1 className="text-[34px] leading-[41px] font-bold tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-sm text-white/70 mt-0.5">
                    {getGreeting()} • {portalCompanyName}
                  </p>
                </div>
                <LiveClockWidget />
              </div>
              
              {/* Mobile 2x2 Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 w-full">
                <Link href="/clients" className="block w-full">
                  <Button 
                    className="w-full h-14 bg-white/20 hover:bg-white/30 border border-white/20 flex-col gap-1"
                    variant="ghost"
                    data-testid="mobile-quick-clients"
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-xs font-medium">Clients</span>
                  </Button>
                </Link>
                <Link href="/documents" className="block w-full">
                  <Button 
                    className="w-full h-14 bg-white/20 hover:bg-white/30 border border-white/20 flex-col gap-1"
                    variant="ghost"
                    data-testid="mobile-quick-documents"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs font-medium">Documents</span>
                  </Button>
                </Link>
                <Link href="/tasks" className="block w-full">
                  <Button 
                    className="w-full h-14 bg-white/20 hover:bg-white/30 border border-white/20 flex-col gap-1"
                    variant="ghost"
                    data-testid="mobile-quick-tasks"
                  >
                    <ClipboardList className="h-5 w-5" />
                    <span className="text-xs font-medium">Tasks</span>
                  </Button>
                </Link>
                <Link href="/appointments" className="block w-full">
                  <Button 
                    className="w-full h-14 bg-white/20 hover:bg-white/30 border border-white/20 flex-col gap-1"
                    variant="ghost"
                    data-testid="mobile-quick-appointments"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs font-medium">Appointments</span>
                  </Button>
                </Link>
              </div>
              
              {/* Mobile Stats Row - horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-1 scrollbar-hide">
                <div className="flex-shrink-0 snap-start flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 border border-white/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  <div className="text-sm">
                    <span className="font-bold">{totalClients}</span>
                    <span className="text-white/70 ml-1">Clients</span>
                  </div>
                </div>
                <div className="flex-shrink-0 snap-start flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 border border-white/10">
                  <FileText className="h-4 w-4 text-blue-200" />
                  <div className="text-sm">
                    <span className="font-bold">{totalDocuments.toLocaleString()}</span>
                    <span className="text-white/70 ml-1">Docs</span>
                  </div>
                </div>
                <div className="flex-shrink-0 snap-start flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 border border-white/10">
                  <UserPlus className="h-4 w-4 text-amber-200" />
                  <div className="text-sm">
                    <span className="font-bold">{activeLeads}</span>
                    <span className="text-white/70 ml-1">Leads</span>
                  </div>
                </div>
                <div className="flex-shrink-0 snap-start flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 border border-white/10">
                  <ClipboardList className="h-4 w-4 text-violet-200" />
                  <div className="text-sm">
                    <span className="font-bold">{openTasks}</span>
                    <span className="text-white/70 ml-1">Tasks</span>
                  </div>
                </div>
                <TaxDeadlineCountdown />
              </div>
            </div>

            {/* Desktop: Full layout */}
            <div className="hidden md:block">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-amber-400 animate-pulse" />
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                      {getGreeting()}!
                    </h1>
                  </div>
                  <p className="text-emerald-100 mt-1 text-lg">
                    Welcome to your {portalCompanyName} command center
                  </p>
                </div>
                <LiveClockWidget />
              </div>
              
              {/* Desktop stats and actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors duration-300 border border-white/10">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">{totalClients} Active Clients</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors duration-300 border border-white/10">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{totalDocuments.toLocaleString()} Documents</span>
                  </div>
                  <TaxDeadlineCountdown />
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
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {/* Quick Actions Skeleton */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-14 w-14 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats Grid Skeleton */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed Skeleton */}
            <Card className="border-0">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Quick Actions - Hidden on mobile (shown in hero), visible on desktop */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '350ms' }}>
              <Link href="/clients">
                <Card className="dashboard-quick-action-card dashboard-glass-card border-0 cursor-pointer group hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                        <Users className="h-7 w-7 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Manage Clients</p>
                        <p className="text-sm text-muted-foreground">View & edit clients</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/documents">
                <Card className="dashboard-quick-action-card dashboard-glass-card border-0 cursor-pointer group hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/30">
                        <FileText className="h-7 w-7 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Documents</p>
                        <p className="text-sm text-muted-foreground">Upload & organize</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/tasks">
                <Card className="dashboard-quick-action-card dashboard-glass-card border-0 cursor-pointer group hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-violet-500/30">
                        <ClipboardList className="h-7 w-7 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Tasks</p>
                        <p className="text-sm text-muted-foreground">Manage to-dos</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Stats Grid - Hidden on mobile (summary in hero), visible on desktop */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Clients"
                value={totalClients.toLocaleString()}
                subtitle="Imported from Perfex CRM"
                icon={Users}
                iconColor="text-blue-500"
                bgColor="bg-blue-500/10"
                trend="up"
                trendLabel="+12%"
                delay={0}
              />
              <StatCard
                title="Total Documents"
                value={totalDocuments.toLocaleString()}
                subtitle="Tax returns, W-2s, and more"
                icon={FileText}
                iconColor="text-emerald-500"
                bgColor="bg-emerald-500/10"
                trend="up"
                trendLabel="+8%"
                delay={100}
              />
              <StatCard
                title="Active Leads"
                value={activeLeads}
                subtitle="In your sales pipeline"
                icon={UserPlus}
                iconColor="text-amber-500"
                bgColor="bg-amber-500/10"
                trend="up"
                trendLabel="+24%"
                delay={200}
              />
              <StatCard
                title="Open Tasks"
                value={openTasks}
                subtitle="Tasks needing attention"
                icon={ClipboardList}
                iconColor="text-violet-500"
                bgColor="bg-violet-500/10"
                trend="down"
                trendLabel="-5%"
                delay={300}
              />
            </div>

            {/* Main Content Grid - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dashboard-glass-card border-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
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
                      <EmptyState
                        icon={FileText}
                        title="No documents uploaded yet"
                        description="Documents will appear here once uploaded to the system"
                        className="py-8"
                      />
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

              <Card className="dashboard-glass-card border-0 animate-slide-up" style={{ animationDelay: '500ms' }}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Recent Clients
                  </CardTitle>
                  <Link href="/clients">
                    <Button variant="ghost" size="sm" className="view-all-link text-emerald-500 hover:text-emerald-400 h-12 md:h-10">
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentClients.length > 0 ? (
                    recentClients.map((client, index) => (
                      <Link key={client.id} href={`/clients/${client.id}`}>
                        <div
                          className="dashboard-client-item flex items-center gap-3 p-3 rounded-lg cursor-pointer animate-slide-up group"
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
                    <EmptyState
                      icon={Users}
                      title="No clients yet"
                      description="Clients will appear here once added to the system"
                      className="py-8"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <Card className="dashboard-glass-card border-0 animate-slide-up" style={{ animationDelay: '600ms' }}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Activity Filter Chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {["All", "Clients", "Documents", "Tasks", "Payments"].map((filter) => (
                    <button
                      key={filter}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                        filter === "All"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="md:h-80 md:overflow-y-auto pr-0 md:pr-4 space-y-3">
                  {activityLogs && activityLogs.length > 0 ? (
                      activityLogs.slice(0, 8).map((log, index) => {
                        const actionLabels: Record<string, { label: string; color: string; bgColor: string }> = {
                          'staff_request.submit': { label: 'Staff Request', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                          'staff_request.approve': { label: 'Request Approved', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                          'staff_request.reject': { label: 'Request Rejected', color: 'text-red-500', bgColor: 'bg-red-500/10' },
                          'client.create': { label: 'Client Created', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
                          'client.update': { label: 'Client Updated', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
                          'document.upload': { label: 'Document Uploaded', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
                          'task.create': { label: 'Task Created', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
                          'task.complete': { label: 'Task Completed', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                          'payment.create': { label: 'Payment Received', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                          'lead.convert': { label: 'Lead Converted', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
                          'login': { label: 'User Login', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
                        };
                        const actionConfig = actionLabels[log.action] || {
                          label: log.action.replace(/_/g, ' ').replace(/\./g, ' '),
                          color: 'text-slate-500',
                          bgColor: 'bg-slate-500/10'
                        };

                        return (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card animate-fade-in hover:bg-muted/50 transition-colors"
                            style={{ animationDelay: `${700 + index * 50}ms` }}
                            data-testid={`activity-item-${log.id}`}
                          >
                            {/* User Avatar */}
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {(log.userName?.[0] || 'S').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", actionConfig.color)}>
                                {actionConfig.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {log.userName || 'System'}
                                {log.resourceType && ` - ${log.resourceType}`}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">
                              {log.createdAt && formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <EmptyState
                        icon={Activity}
                        title="No recent activity"
                        description="Activity will appear here as you use the system"
                        className="py-8"
                      />
                    )}
                  </div>
              </CardContent>
            </Card>

            {/* Additional Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/appointments">
                <Card className="dashboard-quick-action-card dashboard-glass-card border-0 cursor-pointer group hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                        <Calendar className="h-7 w-7 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Appointments</p>
                        <p className="text-sm text-muted-foreground">Schedule meetings</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
        </div>
      </PullToRefresh>
    </>
  );
}
