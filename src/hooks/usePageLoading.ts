import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackgroundTasks } from '@/contexts/BackgroundTaskContext';

/**
 * Lightweight hook that registers a page's loading state with the background task system.
 * This makes the sidebar show the inline loader for any page that's currently processing.
 *
 * Usage — add ONE line to any page:
 *   usePageLoading(loading);
 *
 * For full background persistence (survives navigation), use useBackgroundRun instead.
 */
export function usePageLoading(isLoading: boolean, label?: string) {
  const location = useLocation();
  const route = location.pathname;
  const { tasks, startTask } = useBackgroundTasks();

  useEffect(() => {
    if (!isLoading) return;

    // Check if there's already a running task for this route
    const existing = tasks.find(t => t.route === route && t.status === 'running');
    if (existing) return;

    // Start a "sentinel" task that resolves when loading stops
    startTask(route, label ?? 'Processing...', () => {
      return new Promise<void>((resolve) => {
        // Store resolve fn so we can call it when loading becomes false
        (globalThis as Record<string, unknown>)[`__page_loading_${route}`] = resolve;
      });
    });

    return () => {
      // Cleanup: resolve the promise if component unmounts while loading
      const resolve = (globalThis as Record<string, unknown>)[`__page_loading_${route}`] as (() => void) | undefined;
      if (resolve) {
        resolve();
        delete (globalThis as Record<string, unknown>)[`__page_loading_${route}`];
      }
    };
  }, [isLoading, route]); // eslint-disable-line react-hooks/exhaustive-deps

  // When loading stops, resolve the sentinel task
  useEffect(() => {
    if (isLoading) return;
    const resolve = (globalThis as Record<string, unknown>)[`__page_loading_${route}`] as (() => void) | undefined;
    if (resolve) {
      resolve();
      delete (globalThis as Record<string, unknown>)[`__page_loading_${route}`];
    }
  }, [isLoading, route]);
}
