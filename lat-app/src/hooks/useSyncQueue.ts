"use client";

import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function useSyncQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings?status=Submitted&countOnly=true");
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pendingCount || 0);
      }
    } catch {
      setPendingCount(0);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await fetchPendingCount();
    } catch {
      // Will retry later
    } finally {
      setIsSyncing(false);
    }
  }, [fetchPendingCount]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/meetings?status=Submitted&countOnly=true", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPendingCount(data.pendingCount || 0);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return { pendingCount, isSyncing, triggerSync, refreshCount: fetchPendingCount };
}
