import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackgroundTasks } from '@/contexts/BackgroundTaskContext';

/**
 * Drop-in hook to make any page's async work survive navigation.
 *
 * Usage — minimal change to existing pages:
 *
 *   // Before:
 *   const [loading, setLoading] = useState(false);
 *   const [result, setResult] = useState<T | null>(null);
 *   const handle = async () => { setLoading(true); ... setResult(data); setLoading(false); };
 *
 *   // After:
 *   const bg = useBackgroundRun<T>('Analyzing...');
 *   const [localResult, setLocalResult] = useState<T | null>(null);
 *   const loading = bg.running;
 *   const result = bg.result ?? localResult;
 *   const handle = () => bg.run(async () => { return await doWork(); });
 *
 * Or even simpler for new code:
 *   const { run, running, result, error } = useBackgroundRun<T>();
 */
export function useBackgroundRun<T = unknown>(defaultLabel?: string) {
  const location = useLocation();
  const route = location.pathname;
  const { tasks, startTask } = useBackgroundTasks();
  const onDoneRef = useRef<((result: T) => void) | null>(null);
  const onErrorRef = useRef<((error: string) => void) | null>(null);

  // Get the latest task for this route
  const task = useMemo(() => {
    const routeTasks = tasks.filter(t => t.route === route);
    return routeTasks[routeTasks.length - 1] ?? null;
  }, [tasks, route]);

  const running = task?.status === 'running';
  const result = (task?.status === 'done' ? task.result : null) as T | null;
  const error = task?.status === 'error' ? task.error : null;
  const progress = task?.progress ?? null;

  // Fire callbacks when task completes (for pages that need side-effects like toast)
  const prevStatusRef = useRef(task?.status);
  useEffect(() => {
    if (prevStatusRef.current === 'running' && task?.status === 'done' && onDoneRef.current) {
      onDoneRef.current(task.result as T);
    }
    if (prevStatusRef.current === 'running' && task?.status === 'error' && onErrorRef.current) {
      onErrorRef.current(task.error ?? 'Unknown error');
    }
    prevStatusRef.current = task?.status;
  }, [task?.status, task?.result, task?.error]);

  const run = useCallback((work: () => Promise<T>, label?: string) => {
    if (running) return;
    startTask(route, label ?? defaultLabel ?? 'Processing...', async () => {
      return await work();
    });
  }, [route, running, startTask, defaultLabel]);

  /** Register a callback for when the task completes successfully */
  const onDone = useCallback((cb: (result: T) => void) => {
    onDoneRef.current = cb;
  }, []);

  /** Register a callback for when the task fails */
  const onError = useCallback((cb: (error: string) => void) => {
    onErrorRef.current = cb;
  }, []);

  return { run, running, result, error, progress, onDone, onError };
}
