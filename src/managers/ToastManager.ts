import { ToastNotification } from '../types';

type ToastListener = (toasts: ToastNotification[]) => void;

class ToastManager {
  private toasts: ToastNotification[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Subscribe to toast updates
   */
  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.toasts];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in toast notification listener', err);
      }
    });
  }

  /**
   * Show a toast notification
   */
  public show(toast: Omit<ToastNotification, 'id' | 'timestamp'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = toast.duration !== undefined ? toast.duration : 5000;

    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: Date.now(),
      duration,
    };

    // Keep at most 5 concurrent toasts
    if (this.toasts.length >= 5) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    this.toasts.push(newToast);
    this.notify();

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  public showToast(toast: Omit<ToastNotification, 'id' | 'timestamp'>): string {
    return this.show(toast);
  }

  /**
   * Convenience helpers
   */
  public success(
    title: string,
    message?: string,
    options?: Partial<Omit<ToastNotification, 'id' | 'title' | 'message' | 'type'>>
  ): string {
    return this.show({
      title,
      message,
      type: 'success',
      ...options,
    });
  }

  public info(
    title: string,
    message?: string,
    options?: Partial<Omit<ToastNotification, 'id' | 'title' | 'message' | 'type'>>
  ): string {
    return this.show({
      title,
      message,
      type: 'info',
      ...options,
    });
  }

  public warning(
    title: string,
    message?: string,
    options?: Partial<Omit<ToastNotification, 'id' | 'title' | 'message' | 'type'>>
  ): string {
    return this.show({
      title,
      message,
      type: 'warning',
      ...options,
    });
  }

  public error(
    title: string,
    message?: string,
    options?: Partial<Omit<ToastNotification, 'id' | 'title' | 'message' | 'type'>>
  ): string {
    return this.show({
      title,
      message,
      type: 'error',
      ...options,
    });
  }

  /**
   * Dismiss a specific toast
   */
  public dismiss(id: string) {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
      this.timers.delete(id);
    }
    const idx = this.toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.toasts.splice(idx, 1);
      this.notify();
    }
  }

  /**
   * Dismiss all toasts
   */
  public clear() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.toasts = [];
    this.notify();
  }

  public getToasts(): ToastNotification[] {
    return [...this.toasts];
  }
}

export const toastManager = new ToastManager();
