// ============================================================
// Lightweight toast notification store (Zustand).
// Add <ToastContainer /> once in your Layout component,
// then call useToast() from any page/component.
// ============================================================

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id:      string;
    type:    ToastType;
    message: string;
}

interface ToastState {
    toasts: Toast[];
    push:   (type: ToastType, message: string) => void;
    remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    push: (type, message) => {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
        // Auto-dismiss after 4 s
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 4000);
    },

    remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ── Convenience hook ────────────────────────────────────────
// Usage in any component:
//   const toast = useToast();
//   toast.success('Quote saved as draft');
//   toast.error('Failed to save changes');
export const useToast = () => {
    const push = useToastStore((s) => s.push);
    return {
        success: (msg: string) => push('success', msg),
        error:   (msg: string) => push('error',   msg),
        warning: (msg: string) => push('warning', msg),
        info:    (msg: string) => push('info',    msg),
    };
};
