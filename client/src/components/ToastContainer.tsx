// ============================================================
//
// Drop this ONCE inside your Layout component, just before </div>:
//   import ToastContainer from '../components/ToastContainer';
//   ...
//   <ToastContainer />
//
// Then in any page/component call useToast() to fire one.
// ============================================================

import { useToastStore } from '../stores/useToastStore';
import { CheckCircleIcon, XCircleIcon, WarningIcon, InfoIcon, XIcon } from '@phosphor-icons/react';
import type { ToastType } from '../stores/useToastStore';

const STYLES: Record<ToastType, { border: string; icon: React.ReactNode }> = {
    success: {
        border: 'border-green-500/30 bg-green-500/10',
        icon:   <CheckCircleIcon size={16} weight="fill" className="text-green-400 shrink-0" />,
    },
    error: {
        border: 'border-red-500/30 bg-red-500/10',
        icon:   <XCircleIcon size={16} weight="fill" className="text-red-400 shrink-0" />,
    },
    warning: {
        border: 'border-[#E8A120]/30 bg-[#E8A120]/10',
        icon:   <WarningIcon size={16} weight="fill" className="text-[#E8A120] shrink-0" />,
    },
    info: {
        border: 'border-blue-500/30 bg-blue-500/10',
        icon:   <InfoIcon size={16} weight="fill" className="text-blue-400 shrink-0" />,
    },
};

const ToastContainer = () => {
    const { toasts, remove } = useToastStore();

    if (!toasts.length) return null;

    return (
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => {
                const style = STYLES[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl pointer-events-auto
                            animate-in slide-in-from-right-4 fade-in duration-200 ${style.border}`}
                    >
                        {style.icon}
                        <p className="text-sm text-white/90 flex-1 leading-snug">{toast.message}</p>
                        <button
                            onClick={() => remove(toast.id)}
                            className="text-white/30 hover:text-white transition-colors mt-0.5"
                        >
                            <XIcon size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;
