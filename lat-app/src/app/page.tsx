"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCards, CountryBreakdown, StatusBreakdown } from "@/components/dashboard/StatsCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { LenderSearch } from "@/components/lenders/LenderSearch";
import { MeetingForm } from "@/components/meetings/MeetingForm";
import { ExtractionReview } from "@/components/review/ExtractionReview";
import { SyncStatus } from "@/components/offline/SyncStatus";
import { useOnlineStatus, useSyncQueue } from "@/hooks/useSyncQueue";
import type { ViewType, DashboardStats, Activity, Country } from "@/lib/types";

export default function HomePage() {
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [preselectedLenderId, setPreselectedLenderId] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState(0);

  const isOnline = useOnlineStatus();
  const { pendingCount: pendingSync, isSyncing, triggerSync } = useSyncQueue();

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Error
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await fetch("/api/activities?limit=15");
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch {
      // Error
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  const fetchPendingReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/extractions?status=Pending");
      if (res.ok) {
        const data = await res.json();
        setPendingReviews(data.length);
      }
    } catch {
      // Error
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Initial data fetch — these are async calls that resolve outside the effect body
    Promise.all([
      fetch("/api/stats", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setStats(d); })
        .catch(() => {}),
      fetch("/api/activities?limit=15", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setActivities(d); })
        .catch(() => {}),
      fetch("/api/extractions?status=Pending", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setPendingReviews(d.length); })
        .catch(() => {}),
    ]).finally(() => {
      setStatsLoading(false);
      setActivitiesLoading(false);
    });
    return () => controller.abort();
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  }, []);

  const handleNewMeeting = useCallback((lenderId: string) => {
    setPreselectedLenderId(lenderId);
    setActiveView("meetings");
  }, []);

  const handleMeetingSubmitted = useCallback(
    async (meetingId: string) => {
      // Trigger AI transcription
      try {
        await fetch(`/api/meetings/${meetingId}/transcribe`, { method: "POST" });
      } catch {
        // Will retry later
      }
      fetchStats();
      fetchActivities();
      fetchPendingReviews();
      // Switch to review view after submission
      setActiveView("review");
    },
    [fetchStats, fetchActivities, fetchPendingReviews]
  );

  const handleCountryChange = useCallback((country: Country | null) => {
    setSelectedCountry(country);
    // Refresh data with country filter
    fetchStats();
    fetchActivities();
  }, [fetchStats, fetchActivities]);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="view-transition space-y-4">
            <StatsCards stats={stats} loading={statsLoading} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CountryBreakdown stats={stats} />
              <StatusBreakdown stats={stats} />
            </div>
            <RecentActivity activities={activities} loading={activitiesLoading} />
          </div>
        );
      case "lenders":
        return (
          <div className="view-transition">
            <LenderSearch
              selectedCountry={selectedCountry}
              onSelectLender={() => {}}
              onNewMeeting={handleNewMeeting}
            />
          </div>
        );
      case "meetings":
        return (
          <div className="view-transition">
            <MeetingForm
              preselectedLenderId={preselectedLenderId}
              onMeetingSubmitted={handleMeetingSubmitted}
            />
          </div>
        );
      case "review":
        return (
          <div className="view-transition">
            <ExtractionReview initialFilter="Pending" />
          </div>
        );
      case "offline":
        return (
          <div className="view-transition">
            <SyncStatus
              isOnline={isOnline}
              pendingSync={pendingSync}
              isSyncing={isSyncing}
              onTriggerSync={triggerSync}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOnline={isOnline}
        pendingSync={pendingSync}
        pendingReviews={pendingReviews}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedCountry={selectedCountry}
        onCountryChange={handleCountryChange}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar z-50">
            <Sidebar
              activeView={activeView}
              onViewChange={handleViewChange}
              isOnline={isOnline}
              pendingSync={pendingSync}
              pendingReviews={pendingReviews}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              selectedCountry={selectedCountry}
              onCountryChange={(c) => {
                handleCountryChange(c);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeView={activeView}
          onViewChange={handleViewChange}
          isOnline={isOnline}
          pendingSync={pendingSync}
          pendingReviews={pendingReviews}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          selectedCountry={selectedCountry}
          onCountryChange={handleCountryChange}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">{renderView()}</div>
        </main>
      </div>
    </div>
  );
}
