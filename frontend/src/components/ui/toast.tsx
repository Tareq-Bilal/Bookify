import { CheckCircle2, X, XCircle } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

export type ToastVariant = "success" | "error";

export type ToastItem = {
  id: string;
  title: string;
  description: string;
  variant: ToastVariant;
};

type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 gap-3">
      {toasts.map(toast => (
        <Toast key={toast.id} onDismiss={() => onDismiss(toast.id)} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const Icon = toast.variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className={cn(
        "pointer-events-auto flex gap-3 rounded-md border bg-white p-4 text-sm text-slate-950 shadow-panel",
        toast.variant === "success" ? "border-emerald-200" : "border-red-200"
      )}
      role="status"
    >
      <Icon
        className={cn("mt-0.5 shrink-0", toast.variant === "success" ? "text-emerald-700" : "text-red-600")}
        size={18}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-none">{toast.title}</p>
        <p className="mt-1 leading-relaxed text-slate-600">{toast.description}</p>
      </div>
      <button
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
        onClick={onDismiss}
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
}
