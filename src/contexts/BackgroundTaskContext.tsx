import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

export type TaskStatus = 'running' | 'done' | 'error';

export interface BackgroundTask {
  id: string;
  /** Route path where this task was started, e.g. "/one-click" */
  route: string;
  label: string;
  status: TaskStatus;
  progress?: string;
  result?: unknown;
  error?: string;
  startedAt: number;
}

interface BackgroundTaskContextValue {
  tasks: BackgroundTask[];
  /** Get all running tasks for a given route */
  getTasksForRoute: (route: string) => BackgroundTask[];
  /** Check if any task is running on a route */
  isRouteRunning: (route: string) => boolean;
  /** Start a background task — returns the task id */
  startTask: (route: string, label: string, run: (onProgress: (msg: string) => void) => Promise<unknown>) => string;
  /** Get a task by id */
  getTask: (id: string) => BackgroundTask | undefined;
  /** Clear completed/errored tasks */
  clearDone: () => void;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextValue | null>(null);

let taskCounter = 0;

export function BackgroundTaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const updateTask = useCallback((id: string, patch: Partial<BackgroundTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const startTask = useCallback((route: string, label: string, run: (onProgress: (msg: string) => void) => Promise<unknown>) => {
    const id = `bg-${++taskCounter}-${Date.now()}`;
    const task: BackgroundTask = {
      id,
      route,
      label,
      status: 'running',
      startedAt: Date.now(),
    };

    setTasks(prev => [...prev, task]);

    // Run in background — not tied to any component lifecycle
    run((msg: string) => {
      updateTask(id, { progress: msg });
    })
      .then((result) => {
        updateTask(id, { status: 'done', result, progress: undefined });
      })
      .catch((err) => {
        updateTask(id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
          progress: undefined,
        });
      });

    return id;
  }, [updateTask]);

  const getTasksForRoute = useCallback((route: string) => {
    return tasksRef.current.filter(t => t.route === route);
  }, []);

  const isRouteRunning = useCallback((route: string) => {
    return tasksRef.current.some(t => t.route === route && t.status === 'running');
  }, []);

  const getTask = useCallback((id: string) => {
    return tasksRef.current.find(t => t.id === id);
  }, []);

  const clearDone = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status === 'running'));
  }, []);

  return (
    <BackgroundTaskContext.Provider value={{ tasks, getTasksForRoute, isRouteRunning, startTask, getTask, clearDone }}>
      {children}
    </BackgroundTaskContext.Provider>
  );
}

export function useBackgroundTasks() {
  const ctx = useContext(BackgroundTaskContext);
  if (!ctx) throw new Error('useBackgroundTasks must be used within BackgroundTaskProvider');
  return ctx;
}
