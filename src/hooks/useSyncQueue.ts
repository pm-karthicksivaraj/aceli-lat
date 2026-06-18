"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export function useOnlineStatus() {
  // Always start with true to avoid hydration mismatch (SSR can't know navigator.onLine).
  // Use useSyncExternalStore to read navigator.onLine without causing cascading renders.
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    return () => {
      window.removeEventListener("online", callback);
      window.removeEventListener("offline", callback);
    };
  }, []);

  const getSnapshot = useCallback(() => navigator.onLine, []);
  const getServerSnapshot = useCallback(() => true, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
